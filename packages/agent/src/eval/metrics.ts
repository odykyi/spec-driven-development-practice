import { AgentRun } from '../agent/spec-author.js';

/**
 * Unbiased pass@k estimator (Chen et al., 2021, "Evaluating Large Language Models
 * Trained on Code"): the probability that at least one of k samples drawn without
 * replacement from n attempts, c of them correct, is correct.
 */
export function passAtK(n: number, c: number, k: number): number {
  if (k <= 0 || n <= 0) return 0;
  if (n - c < k) return 1;
  // 1 - C(n-c, k) / C(n, k), as a running product to avoid large factorials.
  let failAll = 1;
  for (let i = n - c + 1; i <= n; i++) {
    failAll *= 1 - k / i;
  }
  return 1 - failAll;
}

export interface ExerciseMetrics {
  exerciseId: string;
  trials: number;
  /** Validator pass rate of the first draft alone: the zero-shot baseline. */
  firstDraftValidRate: number;
  /** Rate of runs accepted (validator + lint + judge) within the iteration limit. */
  acceptedRate: number;
  passAt1: number;
  meanIterations: number;
  /** Judge coverage of the final spec, averaged over runs where the judge ran. */
  meanCoverage: number | null;
  meanLintScore: number;
  meanScenarios: number;
}

export interface EvalSummary {
  exercises: ExerciseMetrics[];
  overall: {
    runs: number;
    firstDraftValidRate: number;
    firstDraftAcceptedRate: number;
    acceptedRate: number;
    meanIterations: number;
    meanCoverage: number | null;
    meanFirstDraftCoverage: number | null;
    meanLintScore: number;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    meanLatencyMs: number;
  };
}

export function summarize(runs: AgentRun[]): EvalSummary {
  const byExercise = new Map<string, AgentRun[]>();
  for (const run of runs) {
    byExercise.set(run.exerciseId, [...(byExercise.get(run.exerciseId) ?? []), run]);
  }

  const exercises = [...byExercise.entries()].map(([exerciseId, group]): ExerciseMetrics => {
    const accepted = group.filter(run => run.accepted).length;
    return {
      exerciseId,
      trials: group.length,
      firstDraftValidRate: mean(
        group.map(run => (run.steps[0].validation.status === 'pass' ? 1 : 0))
      ),
      acceptedRate: accepted / group.length,
      passAt1: passAtK(group.length, accepted, 1),
      meanIterations: mean(group.map(run => run.steps.length)),
      meanCoverage: meanOrNull(group.map(finalCoverage)),
      meanLintScore: mean(group.map(run => last(run).lint.score)),
      meanScenarios: mean(group.map(run => last(run).scenarioCount)),
    };
  });

  return {
    exercises,
    overall: {
      runs: runs.length,
      firstDraftValidRate: mean(
        runs.map(run => (run.steps[0].validation.status === 'pass' ? 1 : 0))
      ),
      firstDraftAcceptedRate: mean(runs.map(run => (run.steps[0].accepted ? 1 : 0))),
      acceptedRate: mean(runs.map(run => (run.accepted ? 1 : 0))),
      meanIterations: mean(runs.map(run => run.steps.length)),
      meanCoverage: meanOrNull(runs.map(finalCoverage)),
      meanFirstDraftCoverage: meanOrNull(runs.map(run => run.steps[0].judge?.coverage)),
      meanLintScore: mean(runs.map(run => last(run).lint.score)),
      inputTokens: sum(runs.map(run => run.usage.inputTokens)),
      outputTokens: sum(runs.map(run => run.usage.outputTokens)),
      costUsd: sum(runs.map(run => run.costUsd)),
      meanLatencyMs: mean(runs.map(run => run.latencyMs)),
    },
  };
}

function last(run: AgentRun) {
  return run.steps[run.steps.length - 1];
}

function finalCoverage(run: AgentRun): number | undefined {
  return last(run).judge?.coverage;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : sum(values) / values.length;
}

function meanOrNull(values: Array<number | undefined>): number | null {
  const present = values.filter((value): value is number => value !== undefined);
  return present.length === 0 ? null : mean(present);
}
