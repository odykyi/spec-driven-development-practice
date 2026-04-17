import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';
import { ExerciseConfig, Track } from './types/index.js';

export interface Exercise {
  id: string;
  config: ExerciseConfig;
  readme: string;
  directory: string;
}

export class ExerciseLoader {
  constructor(private basePath: string) {}

  async loadExercise(exerciseId: string): Promise<Exercise> {
    const exercisePath = path.join(this.basePath, exerciseId);
    
    // Check if exercise exists
    try {
      await fs.access(exercisePath);
    } catch {
      throw new Error(`Exercise not found: ${exerciseId}`);
    }

    // Load config
    const configPath = path.join(exercisePath, '.meta', 'config.yml');
    let config: ExerciseConfig;
    try {
      const configContent = await fs.readFile(configPath, 'utf-8');
      config = yaml.parse(configContent) as ExerciseConfig;
    } catch {
      throw new Error(`Invalid or missing config for exercise: ${exerciseId}`);
    }

    // Load README
    const readmePath = path.join(exercisePath, 'README.md');
    let readme: string;
    try {
      readme = await fs.readFile(readmePath, 'utf-8');
    } catch {
      readme = '';
    }

    return {
      id: exerciseId,
      config,
      readme,
      directory: exercisePath,
    };
  }

  async loadTrack(trackId: string): Promise<Track> {
    const trackPath = path.join(this.basePath, '..', 'tracks', `${trackId}.yml`);
    
    try {
      const content = await fs.readFile(trackPath, 'utf-8');
      return yaml.parse(content) as Track;
    } catch {
      throw new Error(`Track not found: ${trackId}`);
    }
  }

  async listExercises(trackId?: string): Promise<string[]> {
    const exercisesPath = this.basePath;
    
    try {
      const entries = await fs.readdir(exercisesPath, { withFileTypes: true });
      const exercises: string[] = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const trackPath = path.join(exercisesPath, entry.name);
          const trackEntries = await fs.readdir(trackPath, { withFileTypes: true });
          
          for (const exerciseEntry of trackEntries) {
            if (exerciseEntry.isDirectory()) {
              const exerciseId = `${entry.name}/${exerciseEntry.name}`;
              if (!trackId || entry.name === trackId) {
                exercises.push(exerciseId);
              }
            }
          }
        }
      }

      return exercises;
    } catch {
      return [];
    }
  }

  async listTracks(): Promise<string[]> {
    const tracksPath = path.join(this.basePath, '..', 'tracks');
    
    try {
      const entries = await fs.readdir(tracksPath, { withFileTypes: true });
      return entries
        .filter(entry => entry.isFile() && entry.name.endsWith('.yml'))
        .map(entry => entry.name.replace('.yml', ''));
    } catch {
      return [];
    }
  }
}
