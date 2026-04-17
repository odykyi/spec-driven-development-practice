import * as path from 'path';
import os from 'os';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

export interface SubmissionRecord {
  id?: number;
  exerciseId: string;
  specification: string;
  passed: boolean;
  submittedAt: Date;
  message?: string;
}

export interface ExerciseRecord {
  id: string;
  downloadedAt: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface ProgressRecord {
  exerciseId: string;
  completed: boolean;
  completedAt?: Date;
  attempts: number;
}

const DB_DIR = path.join(os.homedir(), '.config', 'sdd');
const DB_PATH = path.join(DB_DIR, 'progress.db');

let dbInstance: Database<sqlite3.Database> | null = null;

export async function getDatabase(): Promise<Database<sqlite3.Database>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });

  await initSchema(dbInstance);
  return dbInstance;
}

async function initSchema(db: Database<sqlite3.Database>): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed BOOLEAN DEFAULT 0,
      completed_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_id TEXT NOT NULL,
      specification TEXT NOT NULL,
      passed BOOLEAN NOT NULL,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      message TEXT,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      exercise_id TEXT PRIMARY KEY,
      completed BOOLEAN DEFAULT 0,
      completed_at DATETIME,
      attempts INTEGER DEFAULT 0,
      last_submitted_at DATETIME,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    );

    CREATE INDEX IF NOT EXISTS idx_submissions_exercise 
      ON submissions(exercise_id);
    
    CREATE INDEX IF NOT EXISTS idx_progress_completed 
      ON user_progress(completed);
  `);
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}

// Helper methods for database operations
export async function saveSubmission(
  submission: SubmissionRecord
): Promise<void> {
  const db = await getDatabase();
  await db.run(
    `INSERT INTO submissions (exercise_id, specification, passed, submitted_at, message)
     VALUES (?, ?, ?, ?, ?)`,
    [
      submission.exerciseId,
      submission.specification,
      submission.passed,
      submission.submittedAt.toISOString(),
      submission.message || null,
    ]
  );
}

export async function completeExercise(exerciseId: string): Promise<void> {
  const db = await getDatabase();
  
  await db.run(
    `INSERT INTO exercises (id, completed, completed_at)
     VALUES (?, 1, CURRENT_TIMESTAMP)
     ON CONFLICT(id) DO UPDATE SET
       completed = 1,
       completed_at = CURRENT_TIMESTAMP`,
    [exerciseId]
  );

  await db.run(
    `INSERT INTO user_progress (exercise_id, completed, completed_at, attempts)
     VALUES (?, 1, CURRENT_TIMESTAMP, 1)
     ON CONFLICT(exercise_id) DO UPDATE SET
       completed = 1,
       completed_at = CURRENT_TIMESTAMP,
       attempts = attempts + 1`,
    [exerciseId]
  );
}

export async function getCompletedExercises(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.all<{ exercise_id: string }[]>(
    'SELECT exercise_id FROM user_progress WHERE completed = 1'
  );
  return rows.map(r => r.exercise_id);
}

export async function getDownloadedExercises(): Promise<ExerciseRecord[]> {
  const db = await getDatabase();
  const rows = await db.all<
    { id: string; downloaded_at: string; completed: number; completed_at: string | null }[]
  >('SELECT id, downloaded_at, completed, completed_at FROM exercises');
  
  return rows.map(row => ({
    id: row.id,
    downloadedAt: new Date(row.downloaded_at),
    completed: Boolean(row.completed),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  }));
}

export async function getAllProgress(): Promise<ProgressRecord[]> {
  const db = await getDatabase();
  const rows = await db.all<
    { 
      exercise_id: string; 
      completed: number; 
      completed_at: string | null;
      attempts: number;
    }[]
  >('SELECT exercise_id, completed, completed_at, attempts FROM user_progress');
  
  return rows.map(row => ({
    exerciseId: row.exercise_id,
    completed: Boolean(row.completed),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    attempts: row.attempts,
  }));
}
