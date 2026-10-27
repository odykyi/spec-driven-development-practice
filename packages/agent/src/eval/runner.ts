import { Exercise, ExerciseLoader } from '@sdd-training/core';
import { AgentRun, SpecAuthorAgent } from '../agent/spec-author.js';

export interface EvalOptions {
  exercisesDir: string;
  /** Exercise ids, or every exercise in these tracks when `tracks` is set. */
  exerciseIds?: string[];
  tracks?: string[];
  trials?: number;
  concurrency?: number;
  onRunComplete?: (run: AgentRun, done: number, total: number) => void;
}

/** Every exercise that has a gradable Definition of Done, in track order. */
export async function selectExercises(options: EvalOptions): Promise<Exercise[]> {
  const loader = new ExerciseLoader(options.exercisesDir);
  let ids = options.exerciseIds ?? [];
  if (ids.length === 0) {
    const tracks = options.tracks ?? (await loader.listTracks());
    for (const track of tracks) {
      ids.push(...(await loader.listExercises(track)).sort());
    }
  }
  ids = [...new Set(ids)];
  return Promise.all(ids.map(id => loader.loadExercise(id)));
}

export async function runEval(agent: SpecAuthorAgent, options: EvalOptions): Promise<AgentRun[]> {
  const exercises = await selectExercises(options);
  const trials = options.trials ?? 1;
  const jobs = exercises.flatMap(exercise => Array.from({ length: trials }, () => exercise));
  const runs: AgentRun[] = new Array(jobs.length);
  let next = 0;
  let done = 0;

  // A small worker pool: provider rate limits, not CPU, bound how fast this can go.
  const worker = async () => {
    while (next < jobs.length) {
      const index = next++;
      runs[index] = await agent.run(jobs[index]);
      options.onRunComplete?.(runs[index], ++done, jobs.length);
    }
  };
  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(options.concurrency ?? 2, jobs.length)) }, worker)
  );
  return runs;
}
