import { describe, it, expect, beforeEach } from 'vitest';
import { 
  ProgressManager, 
  createDependencyGraph, 
  getUnlockOrder,
  UserProgress,
  SolutionSubmission,
} from '../progress.js';
import { ExerciseConfig } from '../types/index.js';

describe('ProgressManager', () => {
  let manager: ProgressManager;
  let progress: UserProgress;

  beforeEach(() => {
    progress = ProgressManager.create('user-1');
    manager = new ProgressManager(progress);
  });

  describe('exercise completion', () => {
    it('should mark exercise as completed', () => {
      const submission: SolutionSubmission = {
        id: 'sub-1',
        submittedAt: new Date(),
        specification: 'test spec',
        passed: true,
        validationResults: 'all passed',
      };

      const config: ExerciseConfig = {
        id: 'test/ex-1',
        name: 'Test Exercise',
        track: 'test',
        difficulty: 'easy',
        validationRules: [],
      };

      manager.completeExercise('test/ex-1', submission, config);

      const status = manager.getExerciseStatus('test/ex-1', config);
      expect(status.status).toBe('completed');
    });

    it('should track multiple attempts', () => {
      const config: ExerciseConfig = {
        id: 'test/ex-1',
        name: 'Test Exercise',
        track: 'test',
        difficulty: 'easy',
        validationRules: [],
      };

      const failedSubmission: SolutionSubmission = {
        id: 'sub-1',
        submittedAt: new Date(),
        specification: 'bad spec',
        passed: false,
        validationResults: 'failed',
      };

      const passedSubmission: SolutionSubmission = {
        id: 'sub-2',
        submittedAt: new Date(),
        specification: 'good spec',
        passed: true,
        validationResults: 'passed',
      };

      manager.completeExercise('test/ex-1', failedSubmission, config);
      manager.completeExercise('test/ex-1', passedSubmission, config);

      const completion = progress.completedExercises.get('test/ex-1');
      expect(completion?.attempts).toBe(2);
      expect(completion?.solutionHistory).toHaveLength(2);
    });
  });

  describe('exercise status', () => {
    it('should lock exercises with unmet prerequisites', () => {
      const config: ExerciseConfig = {
        id: 'test/ex-2',
        name: 'Exercise 2',
        track: 'test',
        difficulty: 'easy',
        validationRules: [],
        prerequisites: ['test/ex-1'],
      };

      const status = manager.getExerciseStatus('test/ex-2', config);
      expect(status.status).toBe('locked');
      expect(status.prerequisitesMet).toBe(false);
    });

    it('should unlock exercises when prerequisites are met', () => {
      const preReqConfig: ExerciseConfig = {
        id: 'test/ex-1',
        name: 'Exercise 1',
        track: 'test',
        difficulty: 'easy',
        validationRules: [],
      };

      const submission: SolutionSubmission = {
        id: 'sub-1',
        submittedAt: new Date(),
        specification: 'spec',
        passed: true,
        validationResults: 'passed',
      };

      manager.completeExercise('test/ex-1', submission, preReqConfig);

      const config: ExerciseConfig = {
        id: 'test/ex-2',
        name: 'Exercise 2',
        track: 'test',
        difficulty: 'easy',
        validationRules: [],
        prerequisites: ['test/ex-1'],
      };

      const status = manager.getExerciseStatus('test/ex-2', config);
      expect(status.status).toBe('available');
      expect(status.prerequisitesMet).toBe(true);
    });
  });

  describe('streak tracking', () => {
    it('should start streak on first completion', () => {
      const config: ExerciseConfig = {
        id: 'test/ex-1',
        name: 'Exercise 1',
        track: 'test',
        difficulty: 'easy',
        validationRules: [],
      };

      const submission: SolutionSubmission = {
        id: 'sub-1',
        submittedAt: new Date(),
        specification: 'spec',
        passed: true,
        validationResults: 'passed',
      };

      manager.completeExercise('test/ex-1', submission, config);

      expect(progress.currentStreak).toBe(1);
      expect(progress.longestStreak).toBe(1);
    });
  });

  describe('track progress', () => {
    it('should calculate track progress', () => {
      const ex1: ExerciseConfig = {
        id: 'test/ex-1',
        name: 'Exercise 1',
        track: 'test',
        difficulty: 'easy',
        validationRules: [],
      };

      const submission: SolutionSubmission = {
        id: 'sub-1',
        submittedAt: new Date(),
        specification: 'spec',
        passed: true,
        validationResults: 'passed',
      };

      manager.completeExercise('test/ex-1', submission, ex1);

      const exercises: ExerciseConfig[] = [
        ex1,
        { id: 'test/ex-2', name: 'Exercise 2', track: 'test', difficulty: 'easy', validationRules: [] },
      ];

      const trackStatus = manager.getTrackStatus('test', exercises);
      
      expect(trackStatus.progress.completed).toBe(1);
      expect(trackStatus.progress.total).toBe(2);
      expect(trackStatus.progress.percentage).toBe(50);
    });
  });
});

describe('Dependency Graph', () => {
  it('should create dependency graph', () => {
    const exercises: ExerciseConfig[] = [
      { id: 'a', name: 'A', track: 'test', difficulty: 'easy', validationRules: [], prerequisites: [] },
      { id: 'b', name: 'B', track: 'test', difficulty: 'easy', validationRules: [], prerequisites: ['a'] },
      { id: 'c', name: 'C', track: 'test', difficulty: 'easy', validationRules: [], prerequisites: ['a', 'b'] },
    ];

    const graph = createDependencyGraph(exercises);

    expect(graph.get('a')).toEqual(new Set());
    expect(graph.get('b')).toEqual(new Set(['a']));
    expect(graph.get('c')).toEqual(new Set(['a', 'b']));
  });

  it('should get unlock order', () => {
    const graph = new Map([
      ['c', new Set(['b'])],
      ['b', new Set(['a'])],
      ['a', new Set()],
    ]);

    const order = getUnlockOrder('c', graph);

    expect(order).toEqual(['a', 'b', 'c']);
  });
});
