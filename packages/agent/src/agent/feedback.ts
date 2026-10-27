import { ValidationResult } from '@sdd-training/core';
import { ChecklistItem } from '../exercise/checklist.js';
import { LintReport } from '../spec/lint.js';
import { JudgeResult } from './judge.js';

/**
 * Turns tool observations into a revision request. Each problem is stated with the
 * exact check that failed, so the model fixes that and does not rewrite the rest.
 */
export function buildRevisionFeedback(
  validation: ValidationResult,
  lint: LintReport,
  judge: JudgeResult | undefined,
  checklist: ChecklistItem[]
): string {
  const sections: string[] = [];

  const failedChecks = validation.checks.filter(check => check.status !== 'pass');
  if (failedChecks.length > 0) {
    sections.push(
      'The validator rejected the spec:\n' +
        failedChecks.map(check => `- ${check.name}: ${check.message}`).join('\n')
    );
  }

  const blocking = lint.findings.filter(finding => finding.severity === 'error');
  const advisory = lint.findings.filter(finding => finding.severity === 'warning').slice(0, 8);
  if (blocking.length > 0) {
    sections.push(
      'Format errors (these lines are invisible to the validator):\n' +
        blocking.map(finding => `- ${finding.location}: ${finding.message}`).join('\n')
    );
  }
  if (advisory.length > 0) {
    sections.push(
      'Quality issues to fix:\n' +
        advisory.map(finding => `- ${finding.location}: ${finding.message}`).join('\n')
    );
  }

  if (judge) {
    const textById = new Map(checklist.map(item => [item.id, item.text]));
    const missing = judge.verdicts.filter(verdict => !verdict.covered);
    if (missing.length > 0) {
      sections.push(
        'A reviewer found these criteria not covered:\n' +
          missing
            .map(verdict => `- ${textById.get(verdict.id) ?? verdict.id}: ${verdict.reason}`)
            .join('\n')
      );
    }
    if (judge.ambiguities.length > 0) {
      sections.push(
        'Ambiguous wording to tighten:\n' +
          judge.ambiguities.map(a => `- "${a.quote}": ${a.issue}`).join('\n')
      );
    }
  }

  return [
    'Revise your specification.',
    '',
    ...sections.flatMap(section => [section, '']),
    'Keep everything that already works. Reply with the complete revised specification in one ```markdown block.',
  ].join('\n');
}
