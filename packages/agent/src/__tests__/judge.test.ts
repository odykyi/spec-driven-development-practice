import { describe, it, expect } from 'vitest';
import {
  KeywordJudge,
  LLMJudge,
  extractJsonObject,
  interpretJudgeReply,
  isGrounded,
  normalizeForMatch,
} from '../agent/judge.js';
import { ChecklistItem } from '../exercise/checklist.js';
import { ScriptedClient } from '../llm/scripted.js';
import { judgeReply, readFixture } from './helpers.js';

const checklist: ChecklistItem[] = [
  { id: 'states', text: 'All 3 states defined (Red, Green, Yellow)' },
  { id: 'timing', text: 'Timing requirements specified for each state' },
];
const spec = readFixture('state-machine/complete.md');

describe('interpretJudgeReply', () => {
  it('accepts coverage claims whose evidence is quoted from the spec', () => {
    const result = interpretJudgeReply(
      judgeReply([
        {
          id: 'states',
          covered: true,
          evidence: 'exactly one of three states at any time: Red, Green or Yellow',
        },
        { id: 'timing', covered: true, evidence: 'Green → Yellow after 25 seconds' },
      ]),
      spec,
      checklist
    );
    expect(result.coverage).toBe(1);
    expect(result.verdicts.every(verdict => verdict.grounded)).toBe(true);
  });

  it('overrules a coverage claim backed by an invented quote', () => {
    const result = interpretJudgeReply(
      judgeReply([
        { id: 'states', covered: true, evidence: 'Red, Green or Yellow' },
        { id: 'timing', covered: true, evidence: 'Each state lasts exactly 45 seconds' },
      ]),
      spec,
      checklist
    );
    expect(result.coverage).toBe(0.5);
    expect(result.verdicts[1]).toMatchObject({ covered: false, grounded: false });
    expect(result.verdicts[1].reason).toMatch(/^overruled/);
  });

  it('counts criteria the judge skipped as not covered', () => {
    const result = interpretJudgeReply(
      judgeReply([{ id: 'states', covered: true, evidence: 'Red, Green or Yellow' }]),
      spec,
      checklist
    );
    expect(result.verdicts[1]).toMatchObject({ id: 'timing', covered: false });
    expect(result.coverage).toBe(0.5);
  });

  it('scores an unparseable reply as zero coverage instead of throwing', () => {
    const result = interpretJudgeReply('I think it looks great!', spec, checklist);
    expect(result.coverage).toBe(0);
    expect(result.parseError).toBeDefined();
  });

  it('reads JSON wrapped in a fence with prose around it', () => {
    const reply =
      'Sure:\n```json\n' + judgeReply([{ id: 'states', covered: false }]) + '\n```\nDone.';
    expect(JSON.parse(extractJsonObject(reply)).items[0].id).toBe('states');
  });

  it('keeps at most five well-formed ambiguities', () => {
    const ambiguities = Array.from({ length: 7 }, (_, i) => ({ quote: `q${i}`, issue: 'vague' }));
    const reply = JSON.stringify({ items: [], ambiguities: [...ambiguities, { quote: 1 }] });
    expect(interpretJudgeReply(reply, spec, checklist).ambiguities).toHaveLength(5);
  });
});

describe('grounding', () => {
  const haystack = normalizeForMatch(spec);

  it('ignores case, whitespace and markdown emphasis', () => {
    expect(isGrounded('**when** the controller POWERS on', haystack)).toBe(true);
  });

  it('accepts quotes stitched together with an ellipsis when every part exists', () => {
    expect(
      isGrounded('Red → Green after 30 seconds ... Yellow → Red after 5 seconds', haystack)
    ).toBe(true);
    expect(isGrounded('Red → Green after 30 seconds ... Yellow lasts 9 seconds', haystack)).toBe(
      false
    );
  });

  it('rejects quotes too short to be evidence', () => {
    expect(isGrounded('Red', haystack)).toBe(false);
  });
});

describe('LLMJudge', () => {
  it('sends the criteria and spec at temperature 0 and reports usage', async () => {
    const client = new ScriptedClient([
      judgeReply([{ id: 'states', covered: true, evidence: 'Red, Green or Yellow' }]),
    ]);
    const result = await new LLMJudge(client).evaluate(spec, checklist);

    expect(client.requests[0].temperature).toBe(0);
    expect(client.requests[0].messages[0].content).toContain('id: timing');
    expect(client.requests[0].messages[0].content).toContain('<spec>');
    expect(result.usage.inputTokens).toBeGreaterThan(0);
  });
});

describe('KeywordJudge baseline', () => {
  it('is fooled by a spec that names topics only to defer them', async () => {
    const result = await new KeywordJudge().evaluate(readFixture('state-machine/topic-only.md'), [
      { id: 'timing', text: 'Timing requirements specified for each state' },
      { id: 'invariants', text: 'Invariants documented (only one light active)' },
    ]);
    // Both are deferred in the fixture ("TBD", "out of scope"); keywords cannot tell.
    expect(result.verdicts.map(verdict => verdict.covered)).toEqual([true, true]);
  });

  it('counts scenarios exactly for "At least N scenarios" criteria', async () => {
    const result = await new KeywordJudge().evaluate(spec, [
      { id: 'n', text: 'At least 4 scenarios', minScenarios: 4 },
      { id: 'm', text: 'At least 7 scenarios', minScenarios: 7 },
    ]);
    expect(result.verdicts.map(verdict => verdict.covered)).toEqual([true, false]);
  });
});
