import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import {
  SpecParser,
  ValidationEngine,
  OutputFormatter,
  ExerciseLoader,
  createMemoryCache,
} from '@sdd-training/core';
import { getConfig } from '../config/config.js';
import { getDatabase, saveSubmission, completeExercise } from '../database/sqlite.js';

interface SubmitOptions {
  message?: string;
  validate?: boolean;
}

export async function submitCommand(options: SubmitOptions): Promise<void> {
  const spinner = ora('Submitting solution...').start();
  
  try {
    // Check if we're in an exercise directory
    const cwd = process.cwd();
    const configPath = path.join(cwd, '.meta', 'config.yml');
    
    try {
      await fs.access(configPath);
    } catch {
      spinner.fail('Not in an exercise directory. Navigate to an exercise folder first.');
      process.exit(1);
    }

    // Read the exercise config
    const exerciseConfig = await new ExerciseLoader(cwd).loadExercise('.');
    const exerciseId = exerciseConfig.config.id;

    // Read the spec file
    const specPath = path.join(cwd, 'spec.md');
    let specContent: string;
    try {
      specContent = await fs.readFile(specPath, 'utf-8');
    } catch {
      spinner.fail('No spec.md file found. Create your specification first.');
      process.exit(1);
    }

    // Run validation if enabled (default)
    let validationResult: ReturnType<ValidationEngine['validate']> | undefined;
    
    if (options.validate !== false) {
      spinner.text = 'Running validation...';
      
      const parser = new SpecParser();
      const spec = parser.parse(specContent);
      
      const engine = new ValidationEngine(createMemoryCache());
      validationResult = engine.validate(spec, {
        exerciseConfig: exerciseConfig.config,
        cache: createMemoryCache(),
      });

      if (validationResult.status === 'fail' || validationResult.status === 'error') {
        spinner.fail('Validation failed');
        const formatter = new OutputFormatter();
        console.log(formatter.toText(validationResult));
        process.exit(1);
      }
    }

    // Save to local database
    const db = await getDatabase();
    await saveSubmission({
      exerciseId,
      specification: specContent,
      passed: true,
      submittedAt: new Date(),
      message: options.message || '',
    });

    // Mark exercise as completed
    await completeExercise(exerciseId);

    spinner.succeed(chalk.green('Solution submitted successfully!'));
    
    if (validationResult?.status === 'pass') {
      const formatter = new OutputFormatter();
      console.log(chalk.dim('\nValidation Results:'));
      console.log(formatter.toCompact(validationResult));
    }
    
    console.log(chalk.dim(`\nRun 'sdd sync' to upload to server.`));
  } catch (error) {
    spinner.fail(`Failed to submit: ${error}`);
    process.exit(1);
  }
}
