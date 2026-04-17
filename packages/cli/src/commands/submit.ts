import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import { getConfig } from '../config/config.js';
import { getDatabase, saveSubmission, completeExercise } from '../database/sqlite.js';

interface SubmitOptions {
  message?: string;
  validate?: boolean;
}

/**
 * Get change name from current directory path
 */
function getChangeNameFromPath(cwd: string): string | null {
  const match = cwd.match(/openspec\/changes\/([^/]+)$/);
  return match ? match[1] : null;
}

/**
 * Get exercise ID from change name (reverse of toChangeName)
 * e.g., "basics-hello-world" -> "basics/hello-world"
 */
function toExerciseId(changeName: string): string {
  // Replace first dash between track and exercise with slash
  return changeName.replace(/^([^-]+)-(.+)$/, '$1/$2');
}

export async function submitCommand(options: SubmitOptions): Promise<void> {
  const spinner = ora('Submitting solution...').start();

  try {
    // Check if we're in an OpenSpec change directory
    const cwd = process.cwd();
    const openspecConfigPath = path.join(cwd, '.openspec.yaml');

    try {
      await fs.access(openspecConfigPath);
    } catch {
      spinner.fail('Not in an OpenSpec change directory. Navigate to openspec/changes/<exercise-name>/ first.');
      console.log(chalk.dim('\nHint: Run `sdd init-exercise <exercise-id>` to initialize an exercise.'));
      process.exit(1);
    }

    // Get change name from path
    const changeName = getChangeNameFromPath(cwd);
    if (!changeName) {
      spinner.fail('Could not determine change name from directory path.');
      process.exit(1);
    }

    const exerciseId = toExerciseId(changeName);
    const workspaceRoot = path.join(cwd, '..', '..');

    // Check OpenSpec status
    spinner.text = 'Checking OpenSpec status...';
    let statusOutput: string;
    let isComplete = false;
    
    try {
      statusOutput = execSync(`openspec status --change "${changeName}" --json`, {
        cwd: workspaceRoot,
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      
      const status = JSON.parse(statusOutput);
      isComplete = status.isComplete || status.status === 'all_done';
      
      if (!isComplete) {
        spinner.stop();
        console.log(chalk.yellow('⚠️  Exercise not complete yet.\n'));
        
        // Show which artifacts are incomplete
        if (status.artifacts) {
          console.log(chalk.bold('Remaining work:'));
          for (const artifact of status.artifacts) {
            if (artifact.status !== 'done') {
              console.log(`  • ${artifact.id}: ${artifact.status}`);
            }
          }
        }
        
        console.log(chalk.dim(`\nRun: openspec status --change ${changeName}`));
        console.log(chalk.dim('Or: openspec validate --change ' + changeName));
        process.exit(1);
      }
    } catch (error: any) {
      spinner.stop();
      console.log(chalk.red('❌ Failed to check OpenSpec status\n'));
      if (error.stderr) console.log(error.stderr);
      process.exit(1);
    }

    // Validate if requested (default)
    if (options.validate !== false) {
      spinner.text = 'Running validation...';
      try {
        execSync(`openspec validate --change "${changeName}"`, {
          cwd: workspaceRoot,
          stdio: 'pipe',
        });
      } catch (error: any) {
        spinner.stop();
        console.log(chalk.red('❌ Validation failed\n'));
        if (error.stdout) console.log(error.stdout);
        process.exit(1);
      }
    }

    // Read the spec file for storage
    const specPath = path.join(cwd, 'specs', 'spec.md');
    let specContent: string;
    try {
      specContent = await fs.readFile(specPath, 'utf-8');
    } catch {
      specContent = '';
    }

    // Save to local database
    await saveSubmission({
      exerciseId,
      specification: specContent,
      passed: true,
      submittedAt: new Date(),
      message: options.message || '',
    });

    // Mark exercise as completed
    await completeExercise(exerciseId);

    spinner.succeed(chalk.green('✅ Exercise submitted successfully!'));
    console.log(chalk.dim(`\nExercise: ${exerciseId}`));
    console.log(chalk.dim('Status: Complete'));
    console.log(chalk.dim(`\nAll OpenSpec artifacts validated and submitted.`));

  } catch (error: any) {
    if (error.message?.includes('openspec')) {
      spinner.fail('OpenSpec CLI error. Make sure it\'s installed: npm install -g @openspec/cli');
    } else {
      spinner.fail(`Failed to submit: ${error}`);
    }
    process.exit(1);
  }
}
