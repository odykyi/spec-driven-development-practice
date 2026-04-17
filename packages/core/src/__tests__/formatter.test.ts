import { describe, it, expect } from 'vitest';
import { OutputFormatter } from '../validators/formatter.js';
import { ValidationResult } from '../types/index.js';

describe('OutputFormatter', () => {
  const formatter = new OutputFormatter();

  const createMockResult = (overrides?: Partial<ValidationResult>): ValidationResult => ({
    status: 'pass',
    checks: [
      {
        id: 'check-1',
        name: 'Check 1',
        status: 'pass',
        message: 'Check 1 passed',
      },
    ],
    summary: {
      total: 1,
      passed: 1,
      failed: 0,
      errors: 0,
    },
    timestamp: new Date('2024-01-01'),
    duration: 100,
    ...overrides,
  });

  describe('toJSON', () => {
    it('should format result as JSON', () => {
      const result = createMockResult();
      const json = formatter.toJSON(result);
      const parsed = JSON.parse(json);

      expect(parsed.status).toBe('pass');
      expect(parsed.summary.total).toBe(1);
      expect(parsed.checks).toHaveLength(1);
      expect(parsed.timestamp).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should include failed checks', () => {
      const result = createMockResult({
        status: 'fail',
        checks: [
          {
            id: 'check-1',
            name: 'Check 1',
            status: 'fail',
            message: 'Check 1 failed',
          },
        ],
        summary: {
          total: 1,
          passed: 0,
          failed: 1,
          errors: 0,
        },
      });

      const json = formatter.toJSON(result);
      const parsed = JSON.parse(json);

      expect(parsed.status).toBe('fail');
      expect(parsed.summary.failed).toBe(1);
    });
  });

  describe('toText', () => {
    it('should format passing result as text', () => {
      const result = createMockResult();
      const text = formatter.toText(result);

      expect(text).toContain('✅ Validation PASS');
      expect(text).toContain('1/1 checks passed');
      expect(text).toContain('Duration: 100ms');
    });

    it('should format failing result as text', () => {
      const result = createMockResult({
        status: 'fail',
        checks: [
          {
            id: 'check-1',
            name: 'Requirements Present',
            status: 'fail',
            message: 'No requirements found',
          },
        ],
        summary: {
          total: 1,
          passed: 0,
          failed: 1,
          errors: 0,
        },
      });

      const text = formatter.toText(result);

      expect(text).toContain('❌ Validation FAIL');
      expect(text).toContain('Failed: 1');
      expect(text).toContain('❌ Requirements Present: No requirements found');
    });

    it('should include error count', () => {
      const result = createMockResult({
        status: 'error',
        summary: {
          total: 1,
          passed: 0,
          failed: 0,
          errors: 1,
        },
      });

      const text = formatter.toText(result);

      expect(text).toContain('⚠️ Validation ERROR');
      expect(text).toContain('Errors: 1');
    });
  });

  describe('toCompact', () => {
    it('should format passing result compactly', () => {
      const result = createMockResult();
      const text = formatter.toCompact(result);

      expect(text).toBe('✅ All 1 checks passed');
    });

    it('should format failing result compactly', () => {
      const result = createMockResult({
        status: 'fail',
        checks: [
          {
            id: 'check-1',
            name: 'Requirements Present',
            status: 'fail',
            message: 'No requirements found',
          },
          {
            id: 'check-2',
            name: 'Scenarios Check',
            status: 'pass',
            message: 'All good',
          },
        ],
        summary: {
          total: 2,
          passed: 1,
          failed: 1,
          errors: 0,
        },
      });

      const text = formatter.toCompact(result);

      expect(text).toContain('❌ 1/2 checks passed');
      expect(text).toContain('❌ Requirements Present: No requirements found');
    });
  });
});
