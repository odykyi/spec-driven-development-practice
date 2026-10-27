import { CalibrationReport } from './calibration.js';
import { EvalSummary } from './metrics.js';

const pct = (value: number | null) => (value === null ? 'n/a' : `${(value * 100).toFixed(0)}%`);
const num = (value: number, digits = 2) => value.toFixed(digits);

export function renderEvalMarkdown(summary: EvalSummary, meta: Record<string, string>): string {
  const o = summary.overall;
  const lines = [
    '# Spec-authoring agent eval',
    '',
    ...Object.entries(meta).map(([key, value]) => `- **${key}**: ${value}`),
    '',
    '## Overall',
    '',
    '| Metric | Value |',
    '|---|---|',
    `| Runs | ${o.runs} |`,
    `| First draft passes validator (zero-shot) | ${pct(o.firstDraftValidRate)} |`,
    `| First draft accepted (validator + lint + judge) | ${pct(o.firstDraftAcceptedRate)} |`,
    `| Accepted after revision loop | ${pct(o.acceptedRate)} |`,
    `| Mean iterations | ${num(o.meanIterations)} |`,
    `| Judge coverage, first draft → final | ${pct(o.meanFirstDraftCoverage)} → ${pct(o.meanCoverage)} |`,
    `| Mean lint score (final) | ${num(o.meanLintScore, 1)} |`,
    `| Tokens in / out | ${o.inputTokens} / ${o.outputTokens} |`,
    `| Cost (USD, as reported by provider) | ${num(o.costUsd, 3)} |`,
    `| Mean latency per run | ${(o.meanLatencyMs / 1000).toFixed(1)} s |`,
    '',
    '## Per exercise',
    '',
    '| Exercise | Trials | First draft valid | Accepted | pass@1 | Iterations | Coverage | Lint | Scenarios |',
    '|---|---|---|---|---|---|---|---|---|',
    ...summary.exercises.map(
      e =>
        `| ${e.exerciseId} | ${e.trials} | ${pct(e.firstDraftValidRate)} | ${pct(e.acceptedRate)} | ${num(e.passAt1)} | ${num(e.meanIterations, 1)} | ${pct(e.meanCoverage)} | ${num(e.meanLintScore, 0)} | ${num(e.meanScenarios, 1)} |`
    ),
    '',
  ];
  return lines.join('\n');
}

export function renderCalibrationMarkdown(reports: CalibrationReport[]): string {
  const lines = [
    '# Judge calibration',
    '',
    'Agreement of each judge with hand-labelled coverage decisions on `eval/fixtures`.',
    '',
    '| Judge | Labels | Accuracy | Precision | Recall | F1 | Cohen κ | Ungrounded claims overruled |',
    '|---|---|---|---|---|---|---|---|',
    ...reports.map(
      r =>
        `| ${r.judge} | ${r.metrics.n} | ${pct(r.metrics.accuracy)} | ${pct(r.metrics.precision)} | ${pct(r.metrics.recall)} | ${num(r.metrics.f1)} | ${num(r.metrics.kappa)} | ${r.ungroundedClaims} |`
    ),
    '',
  ];
  for (const report of reports) {
    const misses = report.fixtures.flatMap(f =>
      f.disagreements.map(
        d =>
          `| ${f.file} | ${d.id} | ${d.gold ? 'covered' : 'not covered'} | ${d.predicted ? 'covered' : 'not covered'} | ${d.reason.replace(/\|/g, '\\|')} |`
      )
    );
    if (misses.length === 0) continue;
    lines.push(
      `## Disagreements: ${report.judge}`,
      '',
      '| Fixture | Criterion | Gold | Judge | Judge reason |',
      '|---|---|---|---|---|',
      ...misses,
      ''
    );
  }
  return lines.join('\n');
}
