import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { getConfig } from '../config/config.js';
import { ExerciseLoader } from '@sdd-training/core';

interface ListOptions {
  track?: string;
  all?: boolean;
}

/**
 * Map exercise ID to OpenSpec change name
 */
function toChangeName(exerciseId: string): string {
  return exerciseId.replace(/\//g, '-');
}

/**
 * Check if exercise is initialized as OpenSpec change
 */
async function isInitialized(workspacePath: string, changeName: string): Promise<boolean> {
  const changePath = path.join(workspacePath, 'openspec', 'changes', changeName);
  try {
    await fs.access(path.join(changePath, '.openspec.yaml'));
    return true;
  } catch {
    return false;
  }
}

/**
 * Get OpenSpec status for a change
 */
function getOpenSpecStatus(workspacePath: string, changeName: string): { initialized: boolean; complete?: boolean; error?: boolean } {
  try {
    const output = execSync(`openspec status --change "${changeName}" --json`, {
      cwd: workspacePath,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    const status = JSON.parse(output);
    return {
      initialized: true,
      complete: status.isComplete || status.status === 'all_done',
    };
  } catch {
    return {
      initialized: false,
      error: true,
    };
  }
}

export async function listCommand(options: ListOptions): Promise<void> {
  try {
    const config = await getConfig();
    const exercisesPath = config.exercisesPath || './exercises';
    const workspacePath = config.workspacePath;
    
    console.log(chalk.bold('\n📚 SDD Training - Available Exercises\n'));
    console.log(chalk.dim('Legend: ○ = not started, ◐ = initialized, ● = complete\n'));
    
    const loader = new ExerciseLoader(exercisesPath);
    
    // Check if OpenSpec CLI is available
    let openspecAvailable = false;
    try {
      execSync('openspec --version', { stdio: 'pipe' });
      openspecAvailable = true;
    } catch {
      // OpenSpec not available
    }
    
    if (options.all || !options.track) {
      // Show all exercises organized by track
      const tracks = ['basics', 'patterns', 'advanced'];
      
      for (const track of tracks) {
        console.log(chalk.bold.cyan(`${track.toUpperCase()}:`));
        
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
              
              const changeName = toChangeName(exerciseId);
              const initialized = await isInitialized(workspacePath, changeName);
              
              let statusIcon = '○'; // Not started
              let statusColor = chalk.gray;
              
              if (initialized && openspecAvailable) {
                const status = getOpenSpecStatus(workspacePath, changeName);
                if (status.complete) {
                  statusIcon = '●'; // Complete
                  statusColor = chalk.green;
                } else if (status.initialized) {
                  statusIcon = '◐'; // In progress
                  statusColor = chalk.yellow;
                }
              }
              
              console.log(`  ${statusColor(statusIcon)} ${exercise.config.name} ${difficultyColor(`(${difficulty})`)}`);
              
              if (!initialized) {
                console.log(chalk.dim(`    Run: sdd init-exercise ${exerciseId}`));
              } else if (openspecAvailable) {
                const status = getOpenSpecStatus(workspacePath, changeName);
                if (!status.complete) {
                  console.log(chalk.dim(`    Check: openspec status --change ${changeName}`));
                }
              }
            } catch {
              console.log(chalk.dim(`  ○ ${exerciseId}`));
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
            const changeName = toChangeName(exerciseId);
            const initialized = await isInitialized(workspacePath, changeName);
            
            let statusIcon = '○';
            if (initialized) {
              statusIcon = '◐';
              if (openspecAvailable) {
                const status = getOpenSpecStatus(workspacePath, changeName);
                if (status.complete) statusIcon = '●';
              }
            }
            
            console.log(`  ${statusIcon} ${exercise.config.name}`);
            if (!initialized) {
              console.log(chalk.dim(`    Run: sdd init-exercise ${exerciseId}`));
            }
          } catch {
            console.log(chalk.dim(`  ○ ${exerciseId}`));
          }
        }
      }
    }
    
    console.log(chalk.dim('\n💡 Run "sdd init-exercise <exercise-id>" to start an exercise\n'));
    
    if (!openspecAvailable) {
      console.log(chalk.yellow('⚠️  OpenSpec CLI not found. Install with: npm install -g @openspec/cli\n'));
    }
  } catch (error) {
    console.error(chalk.red(`Failed to list exercises: ${error}`));
    process.exit(1);
  }
}
