import { describe, it, expect, beforeAll } from 'vitest';
import { Exercise } from '@sdd-training/core';
import { KeywordJudge, LLMJudge } from '../agent/judge.js';
import { SpecAuthorAgent } from '../agent/spec-author.js';
import { ScriptedClient } from '../llm/scripted.js';
import { fenced, judgeReply, loadExercise, readFixture } from './helpers.js';

const GOOD = readFixture('hello-world/complete.md');
const NO_SCENARIOS = `# Greeting\n\n## ADDED Requirements\n\n### Requirement: Greeting Function\nThe system SHALL greet the user.\n`;
const ALL_COVERED = judgeReply([
  { id: 'at-least-2-scenarios', covered: true, evidence: 'Default greeting when no name provided' },
  {
    id: 'uses-shall-for-mandatory-requirements',
    covered: true,
    evidence: 'The system SHALL provide',
  },
  {
    id: 'proper-when-then-format-for-all',
    covered: true,
    evidence: '- **WHEN** `greet()` is called without a name',
  },
]);

let helloWorld: Exercise;
beforeAll(async () => {
  helloWorld = await loadExercise('basics/hello-world');
});

describe('SpecAuthorAgent', () => {
  it('accepts a first draft that passes every tool', async () => {
    const author = new ScriptedClient([fenced(GOOD)]);
    const judge = new LLMJudge(new ScriptedClient([ALL_COVERED]));
    const run = await new SpecAuthorAgent(author, judge).run(helloWorld);

    expect(run.stopReason).toBe('accepted');
    expect(run.steps).toHaveLength(1);
    expect(run.steps[0]).toMatchObject({ accepted: true, scenarioCount: 3 });
    expect(run.steps[0].judge?.coverage).toBe(1);
    expect(run.finalSpec).toBe(GOOD);
  });

  it('feeds validator failures back and accepts the revision', async () => {
    const author = new ScriptedClient([fenced(NO_SCENARIOS), fenced(GOOD)]);
    const judgeClient = new ScriptedClient([ALL_COVERED]);
    const run = await new SpecAuthorAgent(author, new LLMJudge(judgeClient)).run(helloWorld);

    expect(run.stopReason).toBe('accepted');
    expect(run.steps.map(step => step.validation.status)).toEqual(['fail', 'pass']);
    // The judge is skipped while the spec is structurally invalid.
    expect(run.steps[0].judge).toBeUndefined();
    expect(judgeClient.requests).toHaveLength(1);

    const revision = author.requests[1].messages;
    expect(revision.map(message => message.role)).toEqual(['user', 'assistant', 'user']);
    expect(revision[2].content).toContain('Requirements Have Scenarios');
    expect(revision[2].content).toContain('Greeting Function');
  });

  it('revises when the judge finds a criterion uncovered, naming that criterion', async () => {
    const partial = judgeReply([
      { id: 'at-least-2-scenarios', covered: false, reason: 'no default greeting scenario' },
      {
        id: 'uses-shall-for-mandatory-requirements',
        covered: true,
        evidence: 'The system SHALL provide',
      },
      {
        id: 'proper-when-then-format-for-all',
        covered: true,
        evidence: 'it returns "Hello, World!"',
      },
    ]);
    const author = new ScriptedClient([fenced(GOOD), fenced(GOOD)]);
    const judge = new LLMJudge(new ScriptedClient([partial, ALL_COVERED]));
    const run = await new SpecAuthorAgent(author, judge).run(helloWorld);

    expect(run.steps.map(step => step.judge?.coverage)).toEqual([2 / 3, 1]);
    const feedback = author.requests[1].messages[2].content;
    expect(feedback).toContain('not covered');
    expect(feedback).toContain('no default greeting scenario');
  });

  it('rejects specs with lint errors even when the validator passes', async () => {
    // Every scenario still has a parsed WHEN/THEN, but one extra clause is invisible to the parser.
    const withHiddenClause = GOOD.replace(
      '- **THEN** it returns "Hello, Alice!"',
      '- **THEN** it returns "Hello, Alice!"\n- Then the name is trimmed first'
    );
    const author = new ScriptedClient([fenced(withHiddenClause)]);
    const run = await new SpecAuthorAgent(author, undefined, { maxIterations: 1 }).run(helloWorld);

    expect(run.steps[0].validation.status).toBe('pass');
    expect(run.steps[0].lint.errors).toBeGreaterThan(0);
    expect(run.accepted).toBe(false);
  });

  it('stops at the iteration limit with the last draft as the result', async () => {
    const author = new ScriptedClient([fenced(NO_SCENARIOS), fenced(NO_SCENARIOS)]);
    const run = await new SpecAuthorAgent(author, new KeywordJudge(), { maxIterations: 2 }).run(
      helloWorld
    );

    expect(run.stopReason).toBe('max-iterations');
    expect(run.accepted).toBe(false);
    expect(run.steps).toHaveLength(2);
  });

  it('stops early once the token budget is spent', async () => {
    const author = new ScriptedClient([fenced(NO_SCENARIOS), fenced(NO_SCENARIOS)]);
    const run = await new SpecAuthorAgent(author, undefined, { tokenBudget: 1 }).run(helloWorld);

    expect(run.stopReason).toBe('token-budget');
    expect(author.requests).toHaveLength(1);
  });

  it('adds up usage across author and judge calls', async () => {
    const author = new ScriptedClient([fenced(GOOD)]);
    const judgeClient = new ScriptedClient([ALL_COVERED]);
    const run = await new SpecAuthorAgent(author, new LLMJudge(judgeClient)).run(helloWorld);

    const authorOut = Math.ceil(fenced(GOOD).length / 4);
    const judgeOut = Math.ceil(ALL_COVERED.length / 4);
    expect(run.usage.outputTokens).toBe(authorOut + judgeOut);
  });
});
