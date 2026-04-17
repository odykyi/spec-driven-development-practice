import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationEngine, createMemoryCache } from '../validators/engine.js';
import { SpecDocument, ValidationContext, ExerciseConfig } from '../types/index.js';

describe('ValidationEngine', () => {
  let engine: ValidationEngine;

  beforeEach(() => {
    engine = new ValidationEngine();
  });

  const createValidSpec = (): SpecDocument => ({
    title: 'Test Spec',
    requirements: [
      {
        id: 'req-1',
        name: 'Test Requirement',
        description: 'A test requirement',
        scenarios: [
          {
            id: 'scen-1',
            name: 'Test Scenario',
            when: ['user performs action'],
            then: ['system responds'],
          },
        ],
      },
    ],
  });

  describe('basic validation', () => {
    it('should pass for a valid specification', () => {
      const spec = createValidSpec();
      const result = engine.validate(spec);

      expect(result.status).toBe('pass');
      expect(result.summary.passed).toBeGreaterThan(0);
      expect(result.summary.failed).toBe(0);
    });

    it('should fail for specification without requirements', () => {
      const spec: SpecDocument = {
        title: 'Empty Spec',
        requirements: [],
      };

      const result = engine.validate(spec);

      expect(result.status).toBe('fail');
      expect(result.checks.some(c => c.id === 'requirements-present' && c.status === 'fail')).toBe(
        true
      );
    });

    it('should fail for requirements without scenarios', () => {
      const spec: SpecDocument = {
        title: 'Incomplete Spec',
        requirements: [
          {
            id: 'req-1',
            name: 'No Scenarios',
            description: 'Has no scenarios',
            scenarios: [],
          },
        ],
      };

      const result = engine.validate(spec);

      expect(result.checks.some(c => c.id === 'requirements-have-scenarios' && c.status === 'fail')).toBe(true);
    });

    it('should fail for scenarios without WHEN/THEN', () => {
      const spec: SpecDocument = {
        title: 'Incomplete Scenario Spec',
        requirements: [
          {
            id: 'req-1',
            name: 'Incomplete Scenario',
            description: 'Has incomplete scenario',
            scenarios: [
              {
                id: 'scen-1',
                name: 'No When Then',
                when: [],
                then: [],
              },
            ],
          },
        ],
      };

      const result = engine.validate(spec);

      expect(result.checks.some(c => c.id === 'scenarios-have-when-then' && c.status === 'fail')).toBe(true);
    });
  });

  describe('custom rules', () => {
    it('should apply custom validation rules', () => {
      const spec = createValidSpec();
      const customRule = {
        id: 'custom-check',
        name: 'Custom Check',
        description: 'A custom validation rule',
        validate: () => ({
          id: 'custom-check',
          name: 'Custom Check',
          status: 'pass' as const,
          message: 'Custom check passed',
        }),
      };

      const context: ValidationContext = {
        customRules: [customRule],
      };

      const result = engine.validate(spec, context);

      expect(result.checks.some(c => c.id === 'custom-check')).toBe(true);
    });
  });

  describe('exercise config', () => {
    it('should use only configured validation rules', () => {
      const spec = createValidSpec();
      const config: ExerciseConfig = {
        id: 'test-exercise',
        name: 'Test Exercise',
        track: 'test',
        difficulty: 'easy',
        validationRules: ['requirements-present'],
      };

      const context: ValidationContext = {
        exerciseConfig: config,
      };

      const result = engine.validate(spec, context);

      expect(result.checks).toHaveLength(1);
      expect(result.checks[0].id).toBe('requirements-present');
    });

    it('should enforce minimum scenarios count', () => {
      const spec = createValidSpec();
      const config: ExerciseConfig = {
        id: 'test-exercise',
        name: 'Test Exercise',
        track: 'test',
        difficulty: 'medium',
        validationRules: ['min-scenarios'],
        minScenarios: 3,
      };

      const context: ValidationContext = {
        exerciseConfig: config,
      };

      const result = engine.validate(spec, context);

      expect(result.checks.some(c => c.id === 'min-scenarios' && c.status === 'fail')).toBe(true);
    });
  });

  describe('caching', () => {
    it('should cache validation results', () => {
      const cache = createMemoryCache();
      const cachedEngine = new ValidationEngine(cache);
      const spec = createValidSpec();

      const context: ValidationContext = {
        cache,
      };

      // First validation
      const result1 = cachedEngine.validate(spec, context);
      expect(result1.status).toBe('pass');

      // Second validation should use cache
      const result2 = cachedEngine.validate(spec, context);
      expect(result2.timestamp).toEqual(result1.timestamp);
    });
  });

  describe('error handling', () => {
    it('should handle rule execution errors gracefully', () => {
      const spec = createValidSpec();
      const errorRule = {
        id: 'error-rule',
        name: 'Error Rule',
        description: 'A rule that throws',
        validate: () => {
          throw new Error('Rule failed');
        },
      };

      const context: ValidationContext = {
        customRules: [errorRule],
      };

      const result = engine.validate(spec, context);

      const errorCheck = result.checks.find(c => c.id === 'error-rule');
      expect(errorCheck?.status).toBe('error');
      expect(errorCheck?.message).toContain('Rule failed');
    });
  });
});
