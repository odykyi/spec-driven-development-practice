import { describe, it, expect } from 'vitest';
import { KeywordJudge } from '../agent/judge.js';
import { SpecAuthorAgent } from '../agent/spec-author.js';
import { agreement, runCalibration } from '../eval/calibration.js';
import { passAtK, summarize } from '../eval/metrics.js';
import { renderCalibrationMarkdown, renderEvalMarkdown } from '../eval/report.js';
import { runEval, selectExercises } from '../eval/runner.js';
import { ScriptedClient } from '../llm/scripted.js';
import { EXERCISES_DIR, FIXTURES_DIR, fenced, readFixture } from './helpers.js';

describe('passAtK', () => {
  it.each([
    [5, 0, 1, 0],
    [5, 5, 1, 1],
    [10, 3, 1, 0.3],
    // 1 - C(7,5) / C(10,5) = 1 - 21/252
    [10, 3, 5, 1 - 21 / 252],
    [4, 1, 4, 1],
  ])('n=%i c=%i k=%i → %f', (n, c, k, expected) => {
    expect(passAtK(n, c, k)).toBeCloseTo(expected, 10);
  });
});

describe('agreement', () => {
  it('computes precision, recall and Cohen kappa from a confusion matrix', () => {
    // tp=8 fp=2 tn=6 fn=4 → accuracy 0.7, p_o=0.7, p_e=0.5*0.6+0.5*0.4=0.5, kappa=0.4
    const pairs = [
      ...Array(8).fill({ gold: true, predicted: true }),
      ...Array(2).fill({ gold: false, predicted: true }),
      ...Array(6).fill({ gold: false, predicted: false }),
      ...Array(4).fill({ gold: true, predicted: false }),
    ];
    const m = agreement(pairs);
    expect(m).toMatchObject({ tp: 8, fp: 2, tn: 6, fn: 4, n: 20 });
    expect(m.accuracy).toBeCloseTo(0.7);
    expect(m.precision).toBeCloseTo(0.8);
    expect(m.recall).toBeCloseTo(8 / 12);
    expect(m.kappa).toBeCloseTo(0.4);
  });

  it('gives kappa 1 for perfect agreement', () => {
    expect(
      agreement([
        { gold: true, predicted: true },
        { gold: false, predicted: false },
      ]).kappa
    ).toBe(1);
  });
});

describe('runCalibration', () => {
  it('scores the keyword baseline against every gold label', async () => {
    const report = await runCalibration(new KeywordJudge(), 'keyword', FIXTURES_DIR, EXERCISES_DIR);
    expect(report.metrics.n).toBe(42);
    // The baseline credits topics that fixtures only name; it must not look perfect.
    expect(report.metrics.fp).toBeGreaterThan(0);
    expect(
      report.fixtures.find(f => f.file === 'state-machine/topic-only.md')?.disagreements.length
    ).toBeGreaterThan(0);
    expect(renderCalibrationMarkdown([report])).toContain('| keyword | 42 |');
  });
});

describe('runEval', () => {
  it('selects every exercise across tracks, in a stable order', async () => {
    const ids = (await selectExercises({ exercisesDir: EXERCISES_DIR })).map(e => e.id);
    expect(ids).toHaveLength(10);
    expect(ids).toContain('basics/hello-world');
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('runs every trial and summarises zero-shot versus revised results', async () => {
    const good = readFixture('hello-world/complete.md');
    const bad = '# Greeting\n\n### Requirement: Greeting\nThe system SHALL greet.\n';
    // Trial 1: bad then good. Trial 2: good at once.
    const author = new ScriptedClient([fenced(bad), fenced(good), fenced(good)]);
    const agent = new SpecAuthorAgent(author, undefined, { maxIterations: 2 });
    const progress: string[] = [];

    const runs = await runEval(agent, {
      exercisesDir: EXERCISES_DIR,
      exerciseIds: ['basics/hello-world'],
      trials: 2,
      concurrency: 1,
      onRunComplete: (run, done, total) => progress.push(`${done}/${total}`),
    });
    const summary = summarize(runs);

    expect(progress).toEqual(['1/2', '2/2']);
    expect(summary.overall).toMatchObject({ runs: 2, firstDraftValidRate: 0.5, acceptedRate: 1 });
    expect(summary.overall.meanIterations).toBe(1.5);
    expect(summary.exercises[0]).toMatchObject({ exerciseId: 'basics/hello-world', passAt1: 1 });
    expect(renderEvalMarkdown(summary, { Model: 'scripted' })).toContain(
      '| basics/hello-world | 2 |'
    );
  });
});
