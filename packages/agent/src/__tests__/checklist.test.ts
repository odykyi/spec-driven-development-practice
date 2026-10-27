import { describe, it, expect } from 'vitest';
import { ExerciseLoader } from '@sdd-training/core';
import { extractChecklist, slugify, stripMarkdown } from '../exercise/checklist.js';
import { loadFixtures } from '../eval/calibration.js';
import { EXERCISES_DIR, FIXTURES_DIR, loadExercise } from './helpers.js';

describe('extractChecklist', () => {
  it('turns the hello-world Definition of Done into gradable criteria', async () => {
    const exercise = await loadExercise('basics/hello-world');
    const items = extractChecklist(exercise.readme);

    expect(items.map(item => item.id)).toEqual([
      'at-least-2-scenarios',
      'uses-shall-for-mandatory-requirements',
      'proper-when-then-format-for-all',
    ]);
    expect(items[0].minScenarios).toBe(2);
    // Sub-bullets are folded into their parent criterion.
    expect(items[0].text).toContain('Default greeting when no name provided');
    expect(items[0].text).toContain('Personalized greeting when name provided');
  });

  it('drops workflow steps that say nothing about spec content', () => {
    const readme = [
      '## Definition of Done',
      '',
      '✅ **Initialize OpenSpec change**: `sdd init-exercise x/y`',
      '✅ **Write in `openspec/changes/x-y/specs/spec.md`**',
      '✅ **Retry policy documented** (3 attempts)',
      '✅ **All artifacts complete**: Check with `openspec status`',
      '✅ **Validates successfully**: Run `openspec validate`',
      '',
      '## Where to Write',
      '✅ **Not part of the checklist**',
    ].join('\n');

    expect(extractChecklist(readme)).toEqual([
      { id: 'retry-policy-documented', text: 'Retry policy documented (3 attempts)' },
    ]);
  });

  it('accepts the "Success Criteria / Definition of Done" heading variant', async () => {
    const exercise = await loadExercise('advanced/ecommerce-checkout');
    const ids = extractChecklist(exercise.readme).map(item => item.id);
    expect(ids).toContain('at-least-10-scenarios-covering-the');
    expect(ids).toContain('security-considerations-documented');
  });

  it('keeps ids unique within an exercise', () => {
    const readme = [
      '## Definition of Done',
      '✅ **Errors documented**: for the API',
      '✅ **Errors documented**: for the UI',
      '✅ **Errors documented**: for the CLI',
    ].join('\n');
    expect(extractChecklist(readme).map(item => item.id)).toEqual([
      'errors-documented',
      'errors-documented-2',
      'errors-documented-3',
    ]);
  });

  it('finds at least three criteria in every exercise', async () => {
    const loader = new ExerciseLoader(EXERCISES_DIR);
    for (const track of await loader.listTracks()) {
      for (const id of await loader.listExercises(track)) {
        const exercise = await loader.loadExercise(id);
        expect(extractChecklist(exercise.readme).length, id).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('matches every gold label in the calibration fixtures to a real criterion', async () => {
    for (const fixture of await loadFixtures(FIXTURES_DIR)) {
      const exercise = await loadExercise(fixture.exerciseId);
      const ids = extractChecklist(exercise.readme)
        .map(item => item.id)
        .sort();
      expect(Object.keys(fixture.labels).sort(), fixture.file).toEqual(ids);
    }
  });
});

describe('markdown helpers', () => {
  it('strips emphasis and code spans', () => {
    expect(stripMarkdown('**Uses `SHALL`** for *all*  rules')).toBe('Uses SHALL for all rules');
  });

  it('slugifies punctuation away', () => {
    expect(slugify('429 behavior (X-RateLimit-*)!')).toBe('429-behavior-x-ratelimit');
  });
});
