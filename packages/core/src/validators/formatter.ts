import { ValidationResult, CheckResult } from '../types/index.js';

type Status = 'pass' | 'fail' | 'error';

export class OutputFormatter {
  toJSON(result: ValidationResult): string {
    return JSON.stringify(
      {
        status: result.status,
        summary: result.summary,
        checks: result.checks.map((check: CheckResult) => ({
          id: check.id,
          name: check.name,
          status: check.status,
          message: check.message,
        })),
        timestamp: result.timestamp.toISOString(),
        duration: result.duration,
      },
      null,
      2
    );
  }

  toText(result: ValidationResult): string {
    const lines: string[] = [];

    // Status line with emoji
    const statusEmoji: Record<Status, string> = {
      pass: '✅',
      fail: '❌',
      error: '⚠️',
    };

    lines.push(`${statusEmoji[result.status as Status]} Validation ${result.status.toUpperCase()}`);
    lines.push('');

    // Summary
    lines.push(`Summary: ${result.summary.passed}/${result.summary.total} checks passed`);
    if (result.summary.failed > 0) {
      lines.push(`  Failed: ${result.summary.failed}`);
    }
    if (result.summary.errors > 0) {
      lines.push(`  Errors: ${result.summary.errors}`);
    }
    lines.push(`  Duration: ${result.duration}ms`);
    lines.push('');

    // Individual checks
    lines.push('Checks:');
    for (const check of result.checks) {
      const emoji: Record<Status, string> = {
        pass: '✅',
        fail: '❌',
        error: '⚠️',
      };
      lines.push(`  ${emoji[check.status as Status]} ${check.name}: ${check.message}`);
    }

    return lines.join('\n');
  }

  toCompact(result: ValidationResult): string {
    const statusEmoji: Record<Status, string> = {
      pass: '✅',
      fail: '❌',
      error: '⚠️',
    };

    const failedChecks = result.checks.filter((c: CheckResult) => c.status !== 'pass');
    
    if (failedChecks.length === 0) {
      return `${statusEmoji.pass} All ${result.summary.total} checks passed`;
    }

    return [
      `${statusEmoji[result.status as Status]} ${result.summary.passed}/${result.summary.total} checks passed`,
      ...failedChecks.map((c: CheckResult) => `  ${statusEmoji[c.status as Status]} ${c.name}: ${c.message}`),
    ].join('\n');
  }
}
