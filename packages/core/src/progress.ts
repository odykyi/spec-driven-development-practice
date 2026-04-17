import { ExerciseConfig } from './types/index.js';

export interface UserProgress {
  userId: string;
  completedExercises: Map<string, ExerciseCompletion>;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date | null;
  skillMetrics: SkillMetrics;
}

export interface ExerciseCompletion {
  exerciseId: string;
  completedAt: Date;
  attempts: number;
  solutionHistory: SolutionSubmission[];
  mentored: boolean;
}

export interface SolutionSubmission {
  id: string;
  submittedAt: Date;
  specification: string;
  passed: boolean;
  validationResults: string;
  message?: string;
}

export interface SkillMetrics {
  totalExercisesCompleted: number;
  totalAttempts: number;
  averageAttemptsPerExercise: number;
  tracksCompleted: string[];
  byTrack: Map<string, TrackMetrics>;
}

export interface TrackMetrics {
  trackId: string;
  exercisesCompleted: number;
  totalExercises: number;
  completionRate: number;
  averageAttempts: number;
}

export interface TrackStatus {
  trackId: string;
  exercises: ExerciseStatus[];
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
}

export interface ExerciseStatus {
  exerciseId: string;
  name: string;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  completedAt?: Date;
  prerequisites: string[];
  prerequisitesMet: boolean;
}

export class ProgressManager {
  constructor(private progress: UserProgress) {}

  static create(userId: string): UserProgress {
    return {
      userId,
      completedExercises: new Map(),
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      skillMetrics: {
        totalExercisesCompleted: 0,
        totalAttempts: 0,
        averageAttemptsPerExercise: 0,
        tracksCompleted: [],
        byTrack: new Map(),
      },
    };
  }

  completeExercise(
    exerciseId: string,
    submission: SolutionSubmission,
    exerciseConfig: ExerciseConfig
  ): void {
    const now = new Date();
    
    // Update streak
    this.updateStreak(now);

    // Get or create completion record
    let completion = this.progress.completedExercises.get(exerciseId);
    if (!completion) {
      completion = {
        exerciseId,
        completedAt: now,
        attempts: 1,
        solutionHistory: [],
        mentored: false,
      };
    } else {
      completion.attempts++;
    }

    // Add to history
    completion.solutionHistory.push(submission);

    // Mark as completed if passed
    if (submission.passed) {
      completion.completedAt = now;
      this.progress.completedExercises.set(exerciseId, completion);
      
      // Update metrics
      this.updateMetrics(exerciseId, exerciseConfig);
    }
  }

  getExerciseStatus(exerciseId: string, exerciseConfig: ExerciseConfig): ExerciseStatus {
    const completed = this.progress.completedExercises.get(exerciseId);
    
    // Check prerequisites
    const prerequisites = exerciseConfig.prerequisites || [];
    const prerequisitesMet = prerequisites.every(
      preReq => this.progress.completedExercises.has(preReq)
    );

    let status: ExerciseStatus['status'];
    if (completed) {
      status = 'completed';
    } else if (prerequisitesMet) {
      status = 'available';
    } else {
      status = 'locked';
    }

    return {
      exerciseId,
      name: exerciseConfig.name,
      status,
      completedAt: completed?.completedAt,
      prerequisites,
      prerequisitesMet,
    };
  }

  getTrackStatus(trackId: string, exercises: ExerciseConfig[]): TrackStatus {
    const exerciseStatuses = exercises.map(ex => 
      this.getExerciseStatus(ex.id, ex)
    );

    const completed = exerciseStatuses.filter(ex => ex.status === 'completed').length;
    const total = exerciseStatuses.length;

    return {
      trackId,
      exercises: exerciseStatuses,
      progress: {
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
    };
  }

  getNextRecommendedExercise(availableExercises: ExerciseConfig[]): ExerciseConfig | null {
    // Find first available exercise that hasn't been completed
    for (const exercise of availableExercises) {
      const status = this.getExerciseStatus(exercise.id, exercise);
      if (status.status === 'available') {
        return exercise;
      }
    }
    return null;
  }

  private updateStreak(now: Date): void {
    const lastActive = this.progress.lastActiveDate;
    
    if (!lastActive) {
      this.progress.currentStreak = 1;
    } else {
      const lastDate = new Date(lastActive);
      const today = new Date(now);
      
      // Reset to midnight for comparison
      lastDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      
      const diffMs = today.getTime() - lastDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      
      if (diffDays === 1) {
        // Consecutive day
        this.progress.currentStreak++;
        if (this.progress.currentStreak > this.progress.longestStreak) {
          this.progress.longestStreak = this.progress.currentStreak;
        }
      } else if (diffDays > 1) {
        // Streak broken
        this.progress.currentStreak = 1;
      }
      // If same day, don't update streak
    }
    
    this.progress.lastActiveDate = now;
  }

  private updateMetrics(exerciseId: string, exerciseConfig: ExerciseConfig): void {
    const metrics = this.progress.skillMetrics;
    
    metrics.totalExercisesCompleted++;
    
    const completion = this.progress.completedExercises.get(exerciseId);
    if (completion) {
      metrics.totalAttempts += completion.attempts;
      metrics.averageAttemptsPerExercise = 
        metrics.totalAttempts / metrics.totalExercisesCompleted;
    }

    // Update track metrics
    const trackId = exerciseConfig.track;
    let trackMetrics = metrics.byTrack.get(trackId);
    if (!trackMetrics) {
      trackMetrics = {
        trackId,
        exercisesCompleted: 0,
        totalExercises: 0,
        completionRate: 0,
        averageAttempts: 0,
      };
    }
    
    trackMetrics.exercisesCompleted++;
    // Note: totalExercises should be set when track is loaded
    metrics.byTrack.set(trackId, trackMetrics);
  }

  getProgress(): UserProgress {
    return this.progress;
  }
}

export function createDependencyGraph(exercises: ExerciseConfig[]): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();
  
  for (const exercise of exercises) {
    const deps = new Set(exercise.prerequisites || []);
    graph.set(exercise.id, deps);
  }
  
  return graph;
}

export function getUnlockOrder(
  exerciseId: string,
  dependencyGraph: Map<string, Set<string>>
): string[] {
  const visited = new Set<string>();
  const order: string[] = [];
  
  function visit(id: string): void {
    if (visited.has(id)) return;
    visited.add(id);
    
    const deps = dependencyGraph.get(id) || new Set();
    for (const dep of deps) {
      visit(dep);
    }
    
    order.push(id);
  }
  
  visit(exerciseId);
  return order;
}
