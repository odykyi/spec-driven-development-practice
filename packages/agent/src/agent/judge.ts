import { ChecklistItem } from '../exercise/checklist.js';
import { CompletionResult, LLMClient, TokenUsage, ZERO_USAGE } from '../llm/types.js';

export interface ItemVerdict {
  id: string;
  covered: boolean;
  /** Verbatim quote from the spec that the judge relied on. */
  evidence: string;
  reason: string;
  /**
   * False when the judge claimed coverage but its quote is not in the spec. Those
   * claims are overruled to `covered: false`: an LLM judge must not invent support.
   */
  grounded: boolean;
}

export interface Ambiguity {
  quote: string;
  issue: string;
}

export interface JudgeResult {
  verdicts: ItemVerdict[];
  ambiguities: Ambiguity[];
  /** Share of checklist items covered with grounded evidence, 0..1. */
  coverage: number;
  usage: TokenUsage;
  latencyMs: number;
  costUsd?: number;
  /** Set when the reply could not be parsed; every item then counts as not covered. */
  parseError?: string;
}

export interface Judge {
  evaluate(spec: string, checklist: ChecklistItem[]): Promise<JudgeResult>;
}

export const JUDGE_SYSTEM_PROMPT = `You are a strict reviewer of software specifications written in OpenSpec format.
You decide, for each checklist criterion, whether the specification actually satisfies it.

Rules:
- A criterion is covered only if the spec states it as a concrete, testable requirement or scenario.
  Mentioning a topic, listing it as out of scope, or deferring it ("TBD", "handled appropriately") is NOT coverage.
- For every covered criterion, copy one short verbatim quote (max 200 characters) from the spec as evidence.
  The quote must appear in the spec exactly; do not paraphrase. Use "" when not covered.
- For count criteria ("At least N scenarios ..."), count "#### Scenario:" headings and check they cover the listed cases.
- Also list up to 5 ambiguous phrases in the spec that an implementer could read two ways.

Reply with JSON only, no prose, matching:
{"items":[{"id":"<criterion id>","covered":true|false,"evidence":"<quote>","reason":"<one sentence>"}],
 "ambiguities":[{"quote":"<verbatim>","issue":"<why it is ambiguous>"}]}`;

export function buildJudgePrompt(spec: string, checklist: ChecklistItem[]): string {
  const criteria = checklist.map(item => `- id: ${item.id}\n  criterion: ${item.text}`).join('\n');
  return `Checklist criteria:\n${criteria}\n\nSpecification:\n<spec>\n${spec}</spec>`;
}

/** Rubric judge backed by an LLM, with every coverage claim checked against the spec text. */
export class LLMJudge implements Judge {
  constructor(
    private readonly client: LLMClient,
    private readonly options: { maxTokens?: number } = {}
  ) {}

  async evaluate(spec: string, checklist: ChecklistItem[]): Promise<JudgeResult> {
    const completion: CompletionResult = await this.client.complete({
      system: JUDGE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildJudgePrompt(spec, checklist) }],
      maxTokens: this.options.maxTokens ?? 2048,
      temperature: 0,
    });
    return {
      ...interpretJudgeReply(completion.text, spec, checklist),
      usage: completion.usage,
      latencyMs: completion.latencyMs,
      costUsd: completion.costUsd,
    };
  }
}

type Interpreted = Pick<JudgeResult, 'verdicts' | 'ambiguities' | 'coverage' | 'parseError'>;

export function interpretJudgeReply(
  reply: string,
  spec: string,
  checklist: ChecklistItem[]
): Interpreted {
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonObject(reply));
  } catch (error) {
    return {
      verdicts: checklist.map(item => notCovered(item.id, 'judge reply was not valid JSON')),
      ambiguities: [],
      coverage: 0,
      parseError: (error as Error).message,
    };
  }

  const raw = isRecord(parsed) && Array.isArray(parsed.items) ? parsed.items : [];
  const byId = new Map<string, Record<string, unknown>>();
  for (const entry of raw) {
    if (isRecord(entry) && typeof entry.id === 'string') byId.set(entry.id, entry);
  }

  const haystack = normalizeForMatch(spec);
  const verdicts = checklist.map((item): ItemVerdict => {
    const entry = byId.get(item.id);
    if (!entry) return notCovered(item.id, 'judge did not answer this criterion');

    const claimed = entry.covered === true;
    const evidence = typeof entry.evidence === 'string' ? entry.evidence : '';
    const reason = typeof entry.reason === 'string' ? entry.reason : '';
    const grounded = !claimed || isGrounded(evidence, haystack);
    return {
      id: item.id,
      covered: claimed && grounded,
      evidence,
      reason: grounded ? reason : `overruled: evidence not found in spec (${reason})`,
      grounded,
    };
  });

  const ambiguities = (
    isRecord(parsed) && Array.isArray(parsed.ambiguities) ? parsed.ambiguities : []
  )
    .filter(isRecord)
    .filter(a => typeof a.quote === 'string' && typeof a.issue === 'string')
    .map(a => ({ quote: a.quote as string, issue: a.issue as string }))
    .slice(0, 5);

  const covered = verdicts.filter(verdict => verdict.covered).length;
  return {
    verdicts,
    ambiguities,
    coverage: checklist.length === 0 ? 1 : covered / checklist.length,
  };
}

function notCovered(id: string, reason: string): ItemVerdict {
  return { id, covered: false, evidence: '', reason, grounded: true };
}

/** Accept a bare object, a fenced ```json block, or an object with prose around it. */
export function extractJsonObject(text: string): string {
  const fenced = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end < start) throw new Error('no JSON object found');
  return body.slice(start, end + 1);
}

/** Compare ignoring case, whitespace runs and markdown emphasis, which judges often drop. */
export function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[*_`]/g, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function isGrounded(evidence: string, normalizedSpec: string): boolean {
  const quote = normalizeForMatch(evidence)
    .replace(/^"|"$/g, '')
    .replace(/^\.{3}|\.{3}$/g, '');
  if (quote.length < 8) return false;
  // Judges sometimes join two nearby fragments with "..."; each fragment must exist.
  return quote
    .split(/\s*\.{3}\s*|\s*…\s*/)
    .filter(part => part.length > 0)
    .every(part => normalizedSpec.includes(part.trim()));
}

/**
 * Baseline the LLM judge is calibrated against: an item counts as covered when most
 * of its content words appear in the spec. It is fooled by specs that only name a topic.
 */
export class KeywordJudge implements Judge {
  async evaluate(spec: string, checklist: ChecklistItem[]): Promise<JudgeResult> {
    const haystack = normalizeForMatch(spec);
    const verdicts = checklist.map((item): ItemVerdict => {
      if (item.minScenarios !== undefined) {
        const count = (spec.match(/^####\s+Scenario:/gm) ?? []).length;
        const covered = count >= item.minScenarios;
        return { id: item.id, covered, evidence: '', reason: `${count} scenarios`, grounded: true };
      }
      const words = contentWords(item.text);
      const hits = words.filter(word => haystack.includes(word));
      const covered = words.length > 0 && hits.length / words.length >= 0.5;
      return {
        id: item.id,
        covered,
        evidence: '',
        reason: `${hits.length}/${words.length} keywords present`,
        grounded: true,
      };
    });
    const covered = verdicts.filter(verdict => verdict.covered).length;
    return {
      verdicts,
      ambiguities: [],
      coverage: checklist.length === 0 ? 1 : covered / checklist.length,
      usage: ZERO_USAGE,
      latencyMs: 0,
    };
  }
}

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'all',
  'each',
  'are',
  'is',
  'of',
  'to',
  'in',
  'a',
  'an',
  'when',
  'per',
  'at',
  'least',
  'defined',
  'documented',
  'specified',
  'included',
  'uses',
  'used',
  'from',
  'before',
  'after',
  'covering',
  'different',
  'required',
  'requirements',
  'scenarios',
  'scenario',
]);

function contentWords(text: string): string[] {
  return [
    ...new Set(
      normalizeForMatch(text)
        .split(/[^a-z0-9-]+/)
        .filter(word => word.length > 2 && !STOP_WORDS.has(word))
    ),
  ];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
