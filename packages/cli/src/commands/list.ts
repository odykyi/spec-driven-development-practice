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
    const db = await getDatabase();
    
    if (options.all) {
      // List all available exercises
      const exercisesPath = config.exercisesPath || './exercises';
      const loader = new ExerciseLoader(exercisesPath);
      const exercises = await loader.listExercises(options.track);
      
      console.log(chalk.bold('\nAvailable Exercises:'));
      
      const completedExercises = await db.getCompletedExercises();
      
      for (const exerciseId of exercises) {
        const isCompleted = completedExercises.includes(exerciseId);
        const status = isCompleted ? chalk.green('✓') : chalk.dim('○');
        console.log(`  ${status} ${exerciseId}`);
      }
    } else {
      // List downloaded exercises
      const exercises = await db.getDownloadedExercises();
      
      if (exercises.length === 0) {
        console.log(chalk.yellow('No exercises downloaded yet.'));
        console.log(chalk.dim('Run `sdd download <exercise>` to get started.'));
        return;
      }
      
      console.log(chalk.bold('\nDownloaded Exercises:'));
      
      for (const exercise of exercises) {
        const statusColor = exercise.completed ? chalk.green : chalk.yellow;
        const status = exercise.completed ? 'completed' : 'in progress';
        console.log(`  ${statusColor('●')} ${exercise.id} ${chalk.dim(`(${status})`)}`);
      }
    }
    
    console.log('');
  } catch (error) {
    console.error(chalk.red(`Failed to list exercises: ${error}`));
    process.exit(1);
  }
}
