import {
  SpecDocument,
  ValidationResult,
  CheckResult,
  ValidationSummary,
  ValidationRule,
  ValidationContext,
  ValidationCache,
  Requirement,
  Scenario,
} from '../types/index.js';

/**
 * @deprecated Use `openspec validate` CLI command instead for new code.
 * This engine is kept for backward compatibility with the web app API route.
 * For programmatic validation, prefer spawning `openspec validate` process.
 */
export class ValidationEngine {
  private rules: Map<string, ValidationRule> = new Map();
  private cache: ValidationCache | null = null;

  constructor(cache?: ValidationCache) {
    this.cache = cache || null;
    this.registerDefaultRules();
  }

  registerRule(rule: ValidationRule): void {
    this.rules.set(rule.id, rule);
  }

  validate(spec: SpecDocument, context?: ValidationContext): ValidationResult {
    const startTime = Date.now();

    // Check cache if available
    if (this.cache && context?.cache) {
      const cacheKey = this.generateCacheKey(spec);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const checks: CheckResult[] = [];
    const rulesToApply = this.getRulesToApply(context);

    // Run all validation rules
    for (const rule of rulesToApply) {
      try {
        const result = rule.validate(spec, context);
        checks.push(result);
      } catch (error) {
        checks.push({
          id: rule.id,
          name: rule.name,
          status: 'error',
          message: `Validation rule '${rule.name}' threw an error: ${error}`,
        });
      }
    }

    // Run custom rules from context
    if (context?.customRules) {
      for (const rule of context.customRules) {
        try {
          const result = rule.validate(spec, context);
          checks.push(result);
        } catch (error) {
          checks.push({
            id: rule.id,
            name: rule.name,
            status: 'error',
            message: `Custom validation rule '${rule.name}' threw an error: ${error}`,
          });
        }
      }
    }

    const summary = this.calculateSummary(checks);
    const duration = Date.now() - startTime;

    const result: ValidationResult = {
      status: this.determineOverallStatus(checks),
      checks,
      summary,
      timestamp: new Date(),
      duration,
    };

    // Cache result if caching is enabled
    if (this.cache && context?.cache) {
      const cacheKey = this.generateCacheKey(spec);
      const ttl = context.exerciseConfig?.validationRules.includes('cache-ttl-60') ? 60000 : 300000;
      this.cache.set(cacheKey, result, ttl);
    }

    return result;
  }

  private registerDefaultRules(): void {
    this.registerRule({
      id: 'requirements-present',
      name: 'Requirements Present',
      description: 'Checks that the specification contains at least one requirement',
      validate: (spec: SpecDocument): CheckResult => {
        const hasRequirements = spec.requirements.length > 0;
        return {
          id: 'requirements-present',
          name: 'Requirements Present',
          status: hasRequirements ? 'pass' : 'fail',
          message: hasRequirements
            ? `Found ${spec.requirements.length} requirement(s)`
            : 'No requirements found in specification',
        };
      },
    });

    this.registerRule({
      id: 'requirements-have-scenarios',
      name: 'Requirements Have Scenarios',
      description: 'Checks that each requirement has at least one scenario',
      validate: (spec: SpecDocument): CheckResult => {
        const requirementsWithoutScenarios = spec.requirements.filter(
          req => req.scenarios.length === 0
        );

        const pass = requirementsWithoutScenarios.length === 0;
        return {
          id: 'requirements-have-scenarios',
          name: 'Requirements Have Scenarios',
          status: pass ? 'pass' : 'fail',
          message: pass
            ? 'All requirements have at least one scenario'
            : `${requirementsWithoutScenarios.length} requirement(s) missing scenarios: ${requirementsWithoutScenarios.map(r => r.name).join(', ')}`,
        };
      },
    });

    this.registerRule({
      id: 'scenarios-have-when-then',
      name: 'Scenarios Have WHEN/THEN',
      description: 'Checks that each scenario has at least one WHEN and one THEN clause',
      validate: (spec: SpecDocument): CheckResult => {
        const invalidScenarios: string[] = [];

        for (const req of spec.requirements) {
          for (const scenario of req.scenarios) {
            if (scenario.when.length === 0 || scenario.then.length === 0) {
              invalidScenarios.push(`${req.name} > ${scenario.name}`);
            }
          }
        }

        const pass = invalidScenarios.length === 0;
        return {
          id: 'scenarios-have-when-then',
          name: 'Scenarios Have WHEN/THEN',
          status: pass ? 'pass' : 'fail',
          message: pass
            ? 'All scenarios have proper WHEN and THEN clauses'
            : `Scenarios missing WHEN/THEN: ${invalidScenarios.join(', ')}`,
        };
      },
    });

    this.registerRule({
      id: 'min-scenarios',
      name: 'Minimum Scenarios Count',
      description: 'Checks that the specification has at least the minimum required scenarios',
      validate: (spec: SpecDocument, context?: ValidationContext): CheckResult => {
        const minScenarios = context?.exerciseConfig?.minScenarios || 1;
        const totalScenarios = spec.requirements.reduce(
          (sum, req) => sum + req.scenarios.length,
          0
        );

        const pass = totalScenarios >= minScenarios;
        return {
          id: 'min-scenarios',
          name: 'Minimum Scenarios Count',
          status: pass ? 'pass' : 'fail',
          message: pass
            ? `Found ${totalScenarios} scenarios (minimum: ${minScenarios})`
            : `Only ${totalScenarios} scenario(s) found, but at least ${minScenarios} required`,
        };
      },
    });

    this.registerRule({
      id: 'required-sections',
      name: 'Required Sections Present',
      description: 'Checks that all required sections are present in the specification',
      validate: (spec: SpecDocument, context?: ValidationContext): CheckResult => {
        const requiredSections = context?.exerciseConfig?.requiredSections || [];
        
        // This is a simplified check - in practice you'd parse the raw markdown
        // to check for actual section presence
        const present = ['Requirements']; // Always required and parsed
        
        const missing = requiredSections.filter(
          section => !present.includes(section)
        );

        const pass = missing.length === 0;
        return {
          id: 'required-sections',
          name: 'Required Sections Present',
          status: pass ? 'pass' : 'fail',
          message: pass
            ? 'All required sections are present'
            : `Missing required sections: ${missing.join(', ')}`,
        };
      },
    });
  }

  private getRulesToApply(context?: ValidationContext): ValidationRule[] {
    const ruleIds = context?.exerciseConfig?.validationRules || [];
    
    if (ruleIds.length === 0) {
      // Apply all default rules if no specific rules configured
      return Array.from(this.rules.values());
    }

    return ruleIds
      .map(id => this.rules.get(id))
      .filter((rule): rule is ValidationRule => rule !== undefined);
  }

  private calculateSummary(checks: CheckResult[]): ValidationSummary {
    return {
      total: checks.length,
      passed: checks.filter(c => c.status === 'pass').length,
      failed: checks.filter(c => c.status === 'fail').length,
      errors: checks.filter(c => c.status === 'error').length,
    };
  }

  private determineOverallStatus(checks: CheckResult[]): 'pass' | 'fail' | 'error' {
    if (checks.some(c => c.status === 'error')) {
      return 'error';
    }
    if (checks.some(c => c.status === 'fail')) {
      return 'fail';
    }
    return 'pass';
  }

  private generateCacheKey(spec: SpecDocument): string {
    // Simple hash-based cache key
    const content = JSON.stringify(spec);
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `spec-${hash}`;
  }
}

/**
 * @deprecated Use `openspec validate` CLI command instead. This cache is kept for backward compatibility.
 */
export function createMemoryCache(): ValidationCache {
  const cache = new Map<string, { result: ValidationResult; expires: number }>();

  return {
    get: (key: string): ValidationResult | undefined => {
      const entry = cache.get(key);
      if (!entry) return undefined;
      
      if (Date.now() > entry.expires) {
        cache.delete(key);
        return undefined;
      }
      
      return entry.result;
    },
    set: (key: string, result: ValidationResult, ttl = 300000): void => {
      cache.set(key, {
        result,
        expires: Date.now() + ttl,
      });
    },
    clear: (): void => {
      cache.clear();
    },
  };
}
