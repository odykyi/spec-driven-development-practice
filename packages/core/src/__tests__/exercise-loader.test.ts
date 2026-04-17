import { describe, it, expect, beforeEach } from 'vitest';
import { ExerciseLoader } from '../exercise-loader.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';

describe('ExerciseLoader', () => {
  const testBasePath = path.join(process.cwd(), 'test-exercises');
  let loader: ExerciseLoader;

  beforeEach(async () => {
    // Create test directory structure
    await fs.mkdir(path.join(testBasePath, 'test-exercise', '.meta'), { recursive: true });
    
    // Create test exercise config
    const config = {
      id: 'test/test-exercise',
      track: 'test',
      name: 'Test Exercise',
      difficulty: 'easy',
      validationRules: ['requirements-present'],
    };
    await fs.writeFile(
      path.join(testBasePath, 'test-exercise', '.meta', 'config.yml'),
      yaml.stringify(config)
    );

    // Create test README
    await fs.writeFile(
      path.join(testBasePath, 'test-exercise', 'README.md'),
      '# Test Exercise\n\nThis is a test.'
    );

    loader = new ExerciseLoader(testBasePath);
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(testBasePath, { recursive: true, force: true });
  });

  describe('loadExercise', () => {
    it('should load exercise with config and readme', async () => {
      const exercise = await loader.loadExercise('test/test-exercise');

      expect(exercise.id).toBe('test/test-exercise');
      expect(exercise.config.name).toBe('Test Exercise');
      expect(exercise.config.difficulty).toBe('easy');
      expect(exercise.readme).toContain('Test Exercise');
    });

    it('should throw for non-existent exercise', async () => {
      await expect(loader.loadExercise('non-existent')).rejects.toThrow('Exercise not found');
    });
  });

  describe('listExercises', () => {
    it('should list all exercises', async () => {
      const exercises = await loader.listExercises();
      expect(exercises).toContain('test/test-exercise');
    });

    it('should filter by track', async () => {
      const exercises = await loader.listExercises('test');
      expect(exercises).toContain('test/test-exercise');

      const otherExercises = await loader.listExercises('other');
      expect(otherExercises).not.toContain('test/test-exercise');
    });
  });
});
