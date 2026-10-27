import { Exercise, SpecParser, ValidationEngine, ValidationResult } from '@sdd-training/core';
import { ChecklistItem, extractChecklist } from '../exercise/checklist.js';
import { ChatMessage, LLMClient, TokenUsage, ZERO_USAGE, addUsage } from '../llm/types.js';
import { extractSpecMarkdown } from '../spec/extract.js';
import { LintReport, lintSpec } from '../spec/lint.js';
import { buildRevisionFeedback } from './feedback.js';
import { Judge, JudgeResult } from './judge.js';
import { AUTHOR_SYSTEM_PROMPT, buildDraftPrompt } from './prompts.js';

export interface SpecAuthorOptions {
  /** Draft plus revisions. 1 means a single zero-shot attempt. */
  maxIterations?: number;
  /** Judge coverage (0..1) a spec needs before it is accepted. */
  coverageThreshold?: number;
  /** Stop once this many tokens (input + output, author and judge) have been spent. */
  tokenBudget?: number;
  maxTokens?: number;
  temperature?: number;
}

export type StopReason = 'accepted' | 'max-iterations' | 'token-budget';

export interface AgentStep {
  iteration: number;
  spec: string;
  validation: Pick<ValidationResult, 'status' | 'summary'> & {
    failed: Array<{ id: string; message: string }>;
  };
  lint: LintReport;
  judge?: Omit<JudgeResult, 'usage' | 'latencyMs' | 'costUsd'>;
  scenarioCount: number;
  accepted: boolean;
  usage: TokenUsage;
  latencyMs: number;
  costUsd: number;
}

export interface AgentRun {
  exerciseId: string;
  model: string;
  checklist: ChecklistItem[];
  steps: AgentStep[];
  finalSpec: string;
  accepted: boolean;
  stopReason: StopReason;
  usage: TokenUsage;
  latencyMs: number;
  costUsd: number;
}

/**
 * Writes a spec for an exercise and revises it until it passes. Each iteration the
 * model drafts; then three tools observe the draft: the platform's own validator
 * (structure), the linter (testability), and the rubric judge (coverage of the
 * exercise's Definition of Done). Their findings become the next user turn.
 *
 * The judge only runs once the validator passes: structural failures are cheaper
 * to fix first, and an unparseable spec has nothing for the judge to cite.
 */
export class SpecAuthorAgent {
  private readonly parser = new SpecParser();
  private readonly engine = new ValidationEngine();

  constructor(
    private readonly client: LLMClient,
    private readonly judge: Judge | undefined,
    private readonly options: SpecAuthorOptions = {}
  ) {}

  async run(exercise: Exercise): Promise<AgentRun> {
    const maxIterations = this.options.maxIterations ?? 3;
    const threshold = this.options.coverageThreshold ?? 1;
    const checklist = extractChecklist(exercise.readme);
    const messages: ChatMessage[] = [
      { role: 'user', content: buildDraftPrompt(exercise, checklist) },
    ];
    const steps: AgentStep[] = [];
    let usage = ZERO_USAGE;
    let stopReason: StopReason = 'max-iterations';

    for (let iteration = 1; iteration <= maxIterations; iteration++) {
      const completion = await this.client.complete({
        system: AUTHOR_SYSTEM_PROMPT,
        messages,
        maxTokens: this.options.maxTokens ?? 4096,
        temperature: this.options.temperature ?? 0.2,
      });
      const spec = extractSpecMarkdown(completion.text);
      const doc = this.parser.parse(spec);
      const validation = this.engine.validate(doc, { exerciseConfig: exercise.config });
      const lint = lintSpec(spec, doc);

      let stepUsage = completion.usage;
      let latencyMs = completion.latencyMs;
      let costUsd = completion.costUsd ?? 0;
      let judged: JudgeResult | undefined;
      if (validation.status === 'pass' && this.judge && checklist.length > 0) {
        judged = await this.judge.evaluate(spec, checklist);
        stepUsage = addUsage(stepUsage, judged.usage);
        latencyMs += judged.latencyMs;
        costUsd += judged.costUsd ?? 0;
      }

      const accepted =
        validation.status === 'pass' &&
        lint.errors === 0 &&
        (judged === undefined || judged.coverage >= threshold);

      usage = addUsage(usage, stepUsage);
      steps.push({
        iteration,
        spec,
        validation: {
          status: validation.status,
          summary: validation.summary,
          failed: validation.checks
            .filter(check => check.status !== 'pass')
            .map(check => ({ id: check.id, message: check.message })),
        },
        lint,
        judge: judged && {
          verdicts: judged.verdicts,
          ambiguities: judged.ambiguities,
          coverage: judged.coverage,
          parseError: judged.parseError,
        },
        scenarioCount: doc.requirements.reduce((sum, req) => sum + req.scenarios.length, 0),
        accepted,
        usage: stepUsage,
        latencyMs,
        costUsd,
      });

      if (accepted) {
        stopReason = 'accepted';
        break;
      }
      const budget = this.options.tokenBudget;
      if (budget !== undefined && usage.inputTokens + usage.outputTokens >= budget) {
        stopReason = 'token-budget';
        break;
      }
      messages.push(
        { role: 'assistant', content: completion.text },
        { role: 'user', content: buildRevisionFeedback(validation, lint, judged, checklist) }
      );
    }

    const last = steps[steps.length - 1];
    return {
      exerciseId: exercise.id,
      model: this.client.model,
      checklist,
      steps,
      finalSpec: last.spec,
      accepted: last.accepted,
      stopReason,
      usage,
      latencyMs: steps.reduce((sum, step) => sum + step.latencyMs, 0),
      costUsd: steps.reduce((sum, step) => sum + step.costUsd, 0),
    };
  }
}
