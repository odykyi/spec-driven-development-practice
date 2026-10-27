import * as fs from 'fs';
import * as path from 'path';
import { Exercise, ExerciseLoader } from '@sdd-training/core';

export const REPO_ROOT = path.resolve(__dirname, '../../../..');
export const EXERCISES_DIR = path.join(REPO_ROOT, 'exercises');
export const FIXTURES_DIR = path.resolve(__dirname, '../../eval/fixtures');

export function readFixture(file: string): string {
  return fs.readFileSync(path.join(FIXTURES_DIR, file), 'utf-8');
}

export function loadExercise(id: string): Promise<Exercise> {
  return new ExerciseLoader(EXERCISES_DIR).loadExercise(id);
}

export function fenced(markdown: string): string {
  return `Here is the spec.\n\n\`\`\`markdown\n${markdown.trim()}\n\`\`\`\n`;
}

export function judgeReply(
  items: Array<{ id: string; covered: boolean; evidence?: string; reason?: string }>,
  ambiguities: Array<{ quote: string; issue: string }> = []
): string {
  return JSON.stringify({
    items: items.map(item => ({ evidence: '', reason: 'ok', ...item })),
    ambiguities,
  });
}
