#!/usr/bin/env node
import * as fs from 'fs/promises';
import * as path from 'path';
import { parseArgs } from 'util';
import { ExerciseLoader, SpecParser } from '@sdd-training/core';
import { KeywordJudge, LLMJudge } from './agent/judge.js';
import { SpecAuthorAgent } from './agent/spec-author.js';
import { extractChecklist } from './exercise/checklist.js';
import { createClient, isProviderName } from './llm/factory.js';
import { runCalibration } from './eval/calibration.js';
import { summarize } from './eval/metrics.js';
import { renderCalibrationMarkdown, renderEvalMarkdown } from './eval/report.js';
import { runEval } from './eval/runner.js';
import { lintSpec } from './spec/lint.js';

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PACKAGE_ROOT, '../..');

const USAGE = `sdd-agent <command> [options]

Commands:
  solve <exercise>         Write a spec for one exercise with the revise loop
  judge <spec.md>          Score a spec against an exercise's Definition of Done (--exercise)
  lint <spec.md>           Deterministic quality checks, no model call
  eval                     Run the agent over every exercise and write a report
  calibrate                Measure judge agreement with hand-labelled fixtures

Options:
  --provider <name>        claude-cli | anthropic | openai-compatible   (default: claude-cli)
  --model <id>             Author model (provider default otherwise)
  --judge-model <id>       Judge model (defaults to --model)
  --base-url <url>         Server for openai-compatible (default: Ollama on localhost)
  --exercise <id>          Exercise for judge
  --max-iterations <n>     Draft + revisions per run (default: 3)
  --trials <n>             Runs per exercise for eval (default: 1)
  --concurrency <n>        Parallel runs for eval (default: 2)
  --track <id>             Limit eval to one track (repeatable)
  --no-judge               Accept on validator + lint only
  --out <dir>              Where eval/calibrate write results (default: eval/results)
  --exercises <dir>        Exercises directory (default: <repo>/exercises)`;

async function main(): Promise<void> {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      provider: { type: 'string', default: 'claude-cli' },
      model: { type: 'string' },
      'judge-model': { type: 'string' },
      'base-url': { type: 'string' },
      exercise: { type: 'string' },
      'max-iterations': { type: 'string', default: '3' },
      trials: { type: 'string', default: '1' },
      concurrency: { type: 'string', default: '2' },
      track: { type: 'string', multiple: true },
      'no-judge': { type: 'boolean', default: false },
      out: { type: 'string', default: path.join(PACKAGE_ROOT, 'eval', 'results') },
      exercises: { type: 'string', default: path.join(REPO_ROOT, 'exercises') },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  const [command, target] = positionals;
  if (values.help || !command) {
    console.log(USAGE);
    return;
  }

  const provider = values.provider ?? 'claude-cli';
  if (!isProviderName(provider)) throw new Error(`Unknown provider "${provider}"`);
  const makeAuthor = () =>
    createClient({ provider, model: values.model, baseUrl: values['base-url'] });
  const makeJudge = () =>
    new LLMJudge(
      createClient({
        provider,
        model: values['judge-model'] ?? values.model,
        baseUrl: values['base-url'],
      })
    );
  const loader = new ExerciseLoader(values.exercises!);
  const maxIterations = Number(values['max-iterations']);

  switch (command) {
    case 'lint': {
      const spec = await readTarget(target, 'lint');
      const report = lintSpec(spec, new SpecParser().parse(spec));
      console.log(JSON.stringify(report, null, 2));
      process.exitCode = report.errors > 0 ? 1 : 0;
      return;
    }
    case 'judge': {
      const spec = await readTarget(target, 'judge');
      if (!values.exercise) throw new Error('judge needs --exercise <id>');
      const exercise = await loader.loadExercise(values.exercise);
      const result = await makeJudge().evaluate(spec, extractChecklist(exercise.readme));
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    case 'solve': {
      if (!target) throw new Error('solve needs an exercise id, e.g. basics/hello-world');
      const agent = new SpecAuthorAgent(
        makeAuthor(),
        values['no-judge'] ? undefined : makeJudge(),
        {
          maxIterations,
        }
      );
      const run = await agent.run(await loader.loadExercise(target));
      for (const step of run.steps) {
        console.error(
          `iteration ${step.iteration}: validator ${step.validation.status}, lint ${step.lint.score}, ` +
            `coverage ${step.judge ? Math.round(step.judge.coverage * 100) + '%' : 'n/a'}`
        );
      }
      console.error(`stop: ${run.stopReason}`);
      console.log(run.finalSpec);
      return;
    }
    case 'eval': {
      const agent = new SpecAuthorAgent(
        makeAuthor(),
        values['no-judge'] ? undefined : makeJudge(),
        {
          maxIterations,
        }
      );
      const started = new Date();
      const runs = await runEval(agent, {
        exercisesDir: values.exercises!,
        tracks: values.track,
        trials: Number(values.trials),
        concurrency: Number(values.concurrency),
        onRunComplete: (run, done, total) =>
          console.error(
            `[${done}/${total}] ${run.exerciseId}: ${run.stopReason} after ${run.steps.length} iteration(s)`
          ),
      });
      const summary = summarize(runs);
      const model = values.model ?? makeAuthor().model;
      const stem = `${started.toISOString().slice(0, 10)}-${provider}-${model}`.replace(
        /[^\w.-]+/g,
        '_'
      );
      const markdown = renderEvalMarkdown(summary, {
        Date: started.toISOString(),
        Provider: provider,
        'Author model': model,
        'Judge model': values['no-judge'] ? 'none' : (values['judge-model'] ?? model),
        'Max iterations': String(maxIterations),
        'Trials per exercise': String(values.trials),
      });
      await fs.mkdir(values.out!, { recursive: true });
      await fs.writeFile(
        path.join(values.out!, `${stem}.json`),
        JSON.stringify({ summary, runs }, null, 2)
      );
      await fs.writeFile(path.join(values.out!, `${stem}.md`), markdown);
      console.log(markdown);
      return;
    }
    case 'calibrate': {
      const fixturesDir = path.join(PACKAGE_ROOT, 'eval', 'fixtures');
      const judgeModel = values['judge-model'] ?? values.model ?? makeAuthor().model;
      const reports = [
        await runCalibration(
          new KeywordJudge(),
          'keyword baseline',
          fixturesDir,
          values.exercises!
        ),
        await runCalibration(
          makeJudge(),
          `LLM judge (${judgeModel})`,
          fixturesDir,
          values.exercises!
        ),
      ];
      const markdown = renderCalibrationMarkdown(reports);
      await fs.mkdir(values.out!, { recursive: true });
      const stem = `calibration-${provider}-${judgeModel}`.replace(/[^\w.-]+/g, '_');
      await fs.writeFile(path.join(values.out!, `${stem}.json`), JSON.stringify(reports, null, 2));
      await fs.writeFile(path.join(values.out!, `${stem}.md`), markdown);
      console.log(markdown);
      return;
    }
    default:
      throw new Error(`Unknown command "${command}"\n\n${USAGE}`);
  }
}

async function readTarget(target: string | undefined, command: string): Promise<string> {
  if (!target) throw new Error(`${command} needs a path to a spec file`);
  return fs.readFile(target, 'utf-8');
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
