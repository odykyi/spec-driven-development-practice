import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import { getConfig } from '../config/config.js';
import { getDatabase } from '../database/sqlite.js';
import { ExerciseLoader } from '@sdd-training/core';

interface ListOptions {
  track?: string;
  all?: boolean;
}

export async function listCommand(options: ListOptions): Promise<void> {
  try {
    const config = await getConfig();
    const exercisesPath = config.exercisesPath || './exercises';
    
    console.log(chalk.bold('\n📚 SDD Training - Available Exercises\n'));
    
    const loader = new ExerciseLoader(exercisesPath);
    
    if (options.all || !options.track) {
      // Show all exercises organized by track
      const tracks = ['basics', 'patterns', 'advanced'];
      
      for (const track of tracks) {
        console.log(chalk.bold.cyan(`\n${track.toUpperCase()}:`));
        
        const exercises = await loader.listExercises(track);
        
        if (exercises.length === 0) {
          console.log(chalk.dim('  No exercises available'));
        } else {
          for (const exerciseId of exercises) {
            try {
              const exercise = await loader.loadExercise(exerciseId);
              const difficulty = exercise.config.difficulty;
              const difficultyColor = 
                difficulty === 'easy' ? chalk.green :
                difficulty === 'medium' ? chalk.yellow :
                difficulty === 'hard' ? chalk.red : chalk.gray;
              
              console.log(`  • ${exercise.config.name} ${difficultyColor(`(${difficulty})`)}`);
              console.log(chalk.dim(`    sdd download ${exerciseId}`));
            } catch {
              console.log(chalk.dim(`  • ${exerciseId}`));
            }
          }
        }
      }
    } else {
      // Show specific track
      const exercises = await loader.listExercises(options.track);
      
      if (exercises.length === 0) {
        console.log(chalk.yellow(`No exercises found in track: ${options.track}`));
      } else {
        for (const exerciseId of exercises) {
          try {
            const exercise = await loader.loadExercise(exerciseId);
            console.log(`  • ${exercise.config.name}`);
            console.log(chalk.dim(`    sdd download ${exerciseId}`));
          } catch {
            console.log(chalk.dim(`  • ${exerciseId}`));
          }
        }
      }
    }
    
    console.log(chalk.dim('\n💡 Run "sdd download <exercise-id>" to start an exercise\n'));
  } catch (error) {
    console.error(chalk.red(`Failed to list exercises: ${error}`));
    process.exit(1);
  }
}
