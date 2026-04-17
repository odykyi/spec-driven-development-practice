export interface SpecDocument {
  title: string;
  description?: string;
  requirements: Requirement[];
  metadata?: Record<string, unknown>;
}

export interface Requirement {
  id: string;
  name: string;
  description: string;
  scenarios: Scenario[];
}

export interface Scenario {
  id: string;
  name: string;
  when: string[];
  then: string[];
}

export interface ValidationResult {
  status: 'pass' | 'fail' | 'error';
  checks: CheckResult[];
  summary: ValidationSummary;
  timestamp: Date;
  duration: number;
}

export interface CheckResult {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'error';
  message: string;
  details?: Record<string, unknown>;
}

export interface ValidationSummary {
  total: number;
  passed: number;
  failed: number;
  errors: number;
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  validate: (spec: SpecDocument, context?: ValidationContext) => CheckResult;
}

export interface ValidationContext {
  exerciseConfig?: ExerciseConfig;
  customRules?: ValidationRule[];
  cache?: ValidationCache;
}

export interface ExerciseConfig {
  id: string;
  name: string;
  track: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prerequisites?: string[];
  validationRules: string[];
  requiredSections?: string[];
  minScenarios?: number;
  hints?: string[];
  examples?: string[];
}

export interface ValidationCache {
  get: (key: string) => ValidationResult | undefined;
  set: (key: string, result: ValidationResult, ttl?: number) => void;
  clear: () => void;
}

export interface Track {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  exercises: string[];
  concepts?: string[];
}

export interface ParsedNode {
  type: string;
  content?: string;
  children?: ParsedNode[];
  depth?: number;
  raw?: string;
}

export interface ASTNode {
  type: 'document' | 'heading' | 'section' | 'requirement' | 'scenario' | 'text' | 'list' | 'listItem';
  value?: string;
  depth?: number;
  children: ASTNode[];
  metadata?: Record<string, unknown>;
  raw?: string;
}
