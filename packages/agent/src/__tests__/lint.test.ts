import { describe, it, expect } from 'vitest';
import { SpecParser } from '@sdd-training/core';
import { lintSpec } from '../spec/lint.js';
import { readFixture } from './helpers.js';

const lint = (markdown: string) => lintSpec(markdown, new SpecParser().parse(markdown));
const rules = (markdown: string) => lint(markdown).findings.map(finding => finding.rule);

describe('lintSpec', () => {
  it('passes a well-formed, testable spec without findings', () => {
    const report = lint(readFixture('hello-world/complete.md'));
    expect(report.findings).toEqual([]);
    expect(report.score).toBe(100);
  });

  it('flags clause lines the parser would silently ignore', () => {
    const report = lint(readFixture('hello-world/unformatted-clauses.md'));
    expect(report.errors).toBe(4);
    expect(report.findings[0]).toMatchObject({ rule: 'clause-format', location: 'line 9' });
  });

  it.each([
    ['- When the user logs in'],
    ['* **WHEN** the user logs in'],
    ['- **When** the user logs in'],
    ['-**THEN** it returns 200'],
  ])('treats "%s" as a near-miss clause', line => {
    const spec = `# T\n### Requirement: R\nThe system SHALL work.\n#### Scenario: S\n${line}\n`;
    expect(rules(spec)).toContain('clause-format');
  });

  it('flags outcomes that cannot be asserted', () => {
    const report = lint(readFixture('state-machine/topic-only.md'));
    const vague = report.findings.filter(finding => finding.rule === 'vague-outcome');
    expect(vague.map(finding => finding.message)).toEqual([
      expect.stringContaining('"as needed"'),
      expect.stringContaining('"properly"'),
    ]);
  });

  it('flags requirements without SHALL or MUST', () => {
    expect(rules(readFixture('hello-world/weak-modal-one-scenario.md'))).toEqual([
      'requirement-normative',
    ]);
  });

  it('flags scenarios that share a trigger', () => {
    const spec = [
      '# T',
      '### Requirement: R',
      'The system SHALL respond.',
      '#### Scenario: First',
      '- **WHEN** the user clicks save',
      '- **THEN** the form is stored',
      '#### Scenario: Second',
      '- **WHEN** the user clicks save',
      '- **THEN** a toast "Saved" is shown',
    ].join('\n');
    const report = lint(spec);
    expect(report.findings).toEqual([
      expect.objectContaining({ rule: 'duplicate-scenario', severity: 'error' }),
    ]);
    expect(report.score).toBe(90);
  });

  it('never scores below zero', () => {
    const lines = ['# T', '### Requirement: R', 'The system SHALL work.', '#### Scenario: S'];
    for (let i = 0; i < 12; i++) lines.push(`- When case ${i}`);
    expect(lint(lines.join('\n')).score).toBe(0);
  });
});
