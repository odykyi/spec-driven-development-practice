import { SpecDocument } from '@sdd-training/core';

export type LintSeverity = 'error' | 'warning';

export interface LintFinding {
  rule: string;
  severity: LintSeverity;
  location: string;
  message: string;
}

export interface LintReport {
  findings: LintFinding[];
  errors: number;
  warnings: number;
  /** 100 minus 10 per error and 3 per warning, floored at 0. */
  score: number;
}

// Words that make a THEN clause impossible to test: there is no observable outcome to assert.
const VAGUE_TERMS = [
  'appropriate',
  'appropriately',
  'properly',
  'correctly',
  'as needed',
  'as expected',
  'user-friendly',
  'intuitive',
  'seamless',
  'seamlessly',
  'quickly',
  'fast',
  'efficiently',
  'robust',
  'reasonable',
  'adequate',
  'sufficient',
  'etc',
  'and so on',
  'tbd',
];
const VAGUE_PATTERN = new RegExp(`\\b(${VAGUE_TERMS.join('|').replace(/-/g, '\\-')})\\b`, 'i');
const WEAK_MODAL = /\b(should|may|might|could)\b/i;
const NORMATIVE = /\b(SHALL|MUST)\b/;
// The core parser only reads `- **WHEN** ...` / `- **THEN** ...`; anything close to it
// but not exact is silently ignored, so the validator would never see that clause.
// The match is case-sensitive, exactly like the parser's `startsWith('- **WHEN**')`.
const NEAR_MISS_CLAUSE = /^\s*[-*]\s*(\*\*)?\s*(when|then)\b/i;
const EXACT_CLAUSE = /^\s*- \*\*(WHEN|THEN)\*\*\s+\S/;

/**
 * Deterministic quality checks the structural validator does not make. They are
 * cheap, explainable, and give the agent precise revision feedback without a model call.
 */
export function lintSpec(markdown: string, spec: SpecDocument): LintReport {
  const findings: LintFinding[] = [];
  const add = (rule: string, severity: LintSeverity, location: string, message: string) =>
    findings.push({ rule, severity, location, message });

  markdown.split('\n').forEach((line, index) => {
    if (NEAR_MISS_CLAUSE.test(line) && !EXACT_CLAUSE.test(line)) {
      add(
        'clause-format',
        'error',
        `line ${index + 1}`,
        `"${line.trim()}" is not parsed as a clause; write "- **WHEN** ..." or "- **THEN** ..."`
      );
    }
  });

  for (const requirement of spec.requirements) {
    const where = `Requirement: ${requirement.name}`;
    if (!requirement.description) {
      add('requirement-description', 'warning', where, 'Requirement has no description line');
    } else if (!NORMATIVE.test(requirement.description)) {
      add(
        'requirement-normative',
        'warning',
        where,
        'Requirement statement has no SHALL/MUST, so it is not clearly mandatory'
      );
    } else if (WEAK_MODAL.test(requirement.description)) {
      add('weak-modal', 'warning', where, 'Mixes SHALL/MUST with should/may; pick one');
    }

    const seen = new Map<string, string>();
    for (const scenario of requirement.scenarios) {
      const at = `${where} > Scenario: ${scenario.name}`;
      const key = [...scenario.when].sort().join('|').toLowerCase();
      if (key && seen.has(key)) {
        add(
          'duplicate-scenario',
          'error',
          at,
          `Has the same WHEN clauses as "${seen.get(key)}"; scenarios must differ in their trigger`
        );
      } else if (key) {
        seen.set(key, scenario.name);
      }

      for (const then of scenario.then) {
        const vague = then.match(VAGUE_PATTERN);
        if (vague) {
          add(
            'vague-outcome',
            'warning',
            at,
            `THEN "${then}" uses "${vague[1]}", which cannot be asserted; state the observable result`
          );
        }
        if (WEAK_MODAL.test(then)) {
          add('weak-modal', 'warning', at, `THEN "${then}" uses a weak modal verb`);
        }
      }
    }
  }

  const errors = findings.filter(finding => finding.severity === 'error').length;
  const warnings = findings.length - errors;
  return { findings, errors, warnings, score: Math.max(0, 100 - errors * 10 - warnings * 3) };
}
