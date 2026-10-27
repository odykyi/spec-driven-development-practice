import * as fs from 'fs/promises';
import * as path from 'path';
import { ExerciseLoader } from '@sdd-training/core';
import { Judge, JudgeResult } from '../agent/judge.js';
import { extractChecklist } from '../exercise/checklist.js';

/**
 * A hand-written spec with gold labels: for each checklist item, whether a careful
 * human reviewer considers it covered. Fixtures deliberately include specs that name
 * a topic without specifying it, to catch judges that reward keywords.
 */
export interface CalibrationFixture {
  file: string;
  exerciseId: string;
  description: string;
  labels: Record<string, boolean>;
}

export interface ConfusionMatrix {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

export interface AgreementMetrics extends ConfusionMatrix {
  n: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  /** Cohen's kappa: agreement with the gold labels beyond what chance would give. */
  kappa: number;
}

export interface FixtureOutcome {
  file: string;
  exerciseId: string;
  disagreements: Array<{ id: string; gold: boolean; predicted: boolean; reason: string }>;
  ungroundedClaims: number;
}

export interface CalibrationReport {
  judge: string;
  metrics: AgreementMetrics;
  fixtures: FixtureOutcome[];
  ungroundedClaims: number;
}

export function agreement(pairs: Array<{ gold: boolean; predicted: boolean }>): AgreementMetrics {
  const m: ConfusionMatrix = { tp: 0, fp: 0, tn: 0, fn: 0 };
  for (const { gold, predicted } of pairs) {
    if (gold && predicted) m.tp++;
    else if (!gold && predicted) m.fp++;
    else if (!gold && !predicted) m.tn++;
    else m.fn++;
  }
  const n = pairs.length;
  const accuracy = n === 0 ? 0 : (m.tp + m.tn) / n;
  const precision = m.tp + m.fp === 0 ? 0 : m.tp / (m.tp + m.fp);
  const recall = m.tp + m.fn === 0 ? 0 : m.tp / (m.tp + m.fn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  // Expected agreement if judge and gold labelled independently at their own base rates.
  const pYes = n === 0 ? 0 : ((m.tp + m.fp) / n) * ((m.tp + m.fn) / n);
  const pNo = n === 0 ? 0 : ((m.tn + m.fn) / n) * ((m.tn + m.fp) / n);
  const expected = pYes + pNo;
  const kappa = expected === 1 ? 1 : (accuracy - expected) / (1 - expected);
  return { ...m, n, accuracy, precision, recall, f1, kappa };
}

export async function loadFixtures(fixturesDir: string): Promise<CalibrationFixture[]> {
  const raw = await fs.readFile(path.join(fixturesDir, 'labels.json'), 'utf-8');
  return JSON.parse(raw) as CalibrationFixture[];
}

export async function runCalibration(
  judge: Judge,
  judgeName: string,
  fixturesDir: string,
  exercisesDir: string
): Promise<CalibrationReport> {
  const loader = new ExerciseLoader(exercisesDir);
  const fixtures = await loadFixtures(fixturesDir);
  const pairs: Array<{ gold: boolean; predicted: boolean }> = [];
  const outcomes: FixtureOutcome[] = [];

  for (const fixture of fixtures) {
    const exercise = await loader.loadExercise(fixture.exerciseId);
    const checklist = extractChecklist(exercise.readme);
    const spec = await fs.readFile(path.join(fixturesDir, fixture.file), 'utf-8');
    const result: JudgeResult = await judge.evaluate(spec, checklist);

    const disagreements: FixtureOutcome['disagreements'] = [];
    for (const verdict of result.verdicts) {
      const gold = fixture.labels[verdict.id];
      if (gold === undefined) continue;
      pairs.push({ gold, predicted: verdict.covered });
      if (gold !== verdict.covered) {
        disagreements.push({
          id: verdict.id,
          gold,
          predicted: verdict.covered,
          reason: verdict.reason,
        });
      }
    }
    outcomes.push({
      file: fixture.file,
      exerciseId: fixture.exerciseId,
      disagreements,
      ungroundedClaims: result.verdicts.filter(verdict => !verdict.grounded).length,
    });
  }

  return {
    judge: judgeName,
    metrics: agreement(pairs),
    fixtures: outcomes,
    ungroundedClaims: outcomes.reduce((total, outcome) => total + outcome.ungroundedClaims, 0),
  };
}
