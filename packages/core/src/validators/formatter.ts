import { ValidationResult } from './types/index.js';

export class OutputFormatter {
  toJSON(result: ValidationResult): string {
    return JSON.stringify(
      {
        status: result.status,
        summary: result.summary,
        checks: result.checks.map(check => ({
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
    const statusEmoji = {
      pass: '✅',
      fail: '❌',
      error: '⚠️',
    };

    lines.push(`${statusEmoji[result.status]} Validation ${result.status.toUpperCase()}`);
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
      const emoji = {
        pass: '✅',
        fail: '❌',
        error: '⚠️',
      };
      lines.push(`  ${emoji[check.status]} ${check.name}: ${check.message}`);
    }

    return lines.join('\n');
  }

  toCompact(result: ValidationResult): string {
    const statusEmoji = {
      pass: '✅',
      fail: '❌',
      error: '⚠️',
    };

    const failedChecks = result.checks.filter(c => c.status !== 'pass');
    
    if (failedChecks.length === 0) {
      return `${statusEmoji.pass} All ${result.summary.total} checks passed`;
    }

    return [
      `${statusEmoji[result.status]} ${result.summary.passed}/${result.summary.total} checks passed`,
      ...failedChecks.map(c => `  ${statusEmoji[c.status]} ${c.name}: ${c.message}`),
    ].join('\n');
  }
}
