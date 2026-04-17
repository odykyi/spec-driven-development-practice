import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { ExerciseLoader } from '@sdd-training/core';
import { getConfig } from '../config/config.js';

// Find exercises directory - check multiple locations
async function findExercisesPath(): Promise<string> {
  // Try paths from current working directory
  const possiblePaths = [
    // Project root exercises
    path.join(process.cwd(), 'exercises'),
    // If running from packages/cli/
    path.join(process.cwd(), '..', '..', 'exercises'),
    // If running from packages/cli/dist/
    path.join(process.cwd(), '..', '..', '..', 'exercises'),
    // Current directory
    './exercises',
  ];

  for (const exercisesPath of possiblePaths) {
    try {
      await fs.access(exercisesPath);
      return path.resolve(exercisesPath);
    } catch {
      continue;
    }
  }

  throw new Error('Could not find exercises directory. Are you running from the project root?');
}

interface DownloadOptions {
  force?: boolean;
}

export async function downloadCommand(exerciseId: string, options: DownloadOptions): Promise<void> {
  const spinner = ora(`Downloading exercise ${exerciseId}...`).start();
  
  try {
    const config = await getConfig();
    const exercisesPath = await findExercisesPath();
    const targetPath = path.join(config.workspacePath, exerciseId);

    // Check if exercise already exists
    try {
      await fs.access(targetPath);
      if (!options.force) {
        spinner.warn(`Exercise ${exerciseId} already exists. Use --force to overwrite.`);
        return;
      }
    } catch {
      // Exercise doesn't exist, continue
    }

    // Load exercise from source
    const loader = new ExerciseLoader(exercisesPath);
    const exercise = await loader.loadExercise(exerciseId);

    // Create exercise directory
    await fs.mkdir(targetPath, { recursive: true });
    await fs.mkdir(path.join(targetPath, '.meta'), { recursive: true });

    // Write README
    await fs.writeFile(
      path.join(targetPath, 'README.md'),
      exercise.readme
    );

    // Write config
    await fs.writeFile(
      path.join(targetPath, '.meta', 'config.yml'),
      await fs.readFile(path.join(exercise.directory, '.meta', 'config.yml'))
    );

    // Create starter spec file
    await fs.writeFile(
      path.join(targetPath, 'spec.md'),
      generateStarterSpec(exercise.config.name)
    );

    spinner.succeed(`Downloaded exercise ${chalk.green(exerciseId)} to ${targetPath}`);
    console.log(chalk.dim(`\nTo get started:`));
    console.log(chalk.dim(`  cd ${targetPath}`));
    console.log(chalk.dim(`  sdd test`));
  } catch (error) {
    spinner.fail(`Failed to download exercise: ${error}`);
    process.exit(1);
  }
}

function generateStarterSpec(exerciseName: string): string {
  return `# ${exerciseName}

## ADDED Requirements

### Requirement: <!-- requirement name -->
<!-- Describe what the system SHALL do -->

#### Scenario: <!-- scenario name -->
- **WHEN** <!-- action or condition -->
- **THEN** <!-- expected outcome -->
`;
}
