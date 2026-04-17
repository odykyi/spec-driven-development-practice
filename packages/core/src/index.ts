export { SpecParser } from './parser/spec-parser.js';
// @deprecated Use `openspec validate` CLI command instead
export { ValidationEngine, createMemoryCache } from './validators/engine.js';
export { OutputFormatter } from './validators/formatter.js';
export { ExerciseLoader } from './exercise-loader.js';
export { 
  ProgressManager, 
  createDependencyGraph, 
  getUnlockOrder 
} from './progress.js';
export * from './types/index.js';
