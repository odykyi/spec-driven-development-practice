import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import { getConfig } from '../config/config.js';

interface TestOptions {
  watch?: boolean;
}

/**
 * Get change name from current directory path
 */
function getChangeNameFromPath(cwd: string): string | null {
  const match = cwd.match(/openspec\/changes\/([^/]+)$/);
  return match ? match[1] : null;
}

export async function testCommand(options: TestOptions): Promise<void> {
  const spinner = ora('Running tests...').start();

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

    // Run OpenSpec validation
    spinner.text = 'Running OpenSpec validation...';
    try {
      const output = execSync(`openspec validate --change "${changeName}"`, {
        cwd: path.join(cwd, '..', '..'), // Run from workspace root
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      
      spinner.stop();
      console.log(chalk.green('✅ Validation PASS\n'));
      console.log(output);
      
    } catch (error: any) {
      spinner.stop();
      console.log(chalk.red('❌ Validation FAIL\n'));
      if (error.stdout) {
        console.log(error.stdout);
      }
      if (error.stderr) {
        console.log(error.stderr);
      }
      process.exit(1);
    }

    if (options.watch) {
      console.log(chalk.dim('\n👀 Watching for changes... (Press Ctrl+C to stop)'));

      // Watch specs/spec.md for changes
      const specPath = path.join(cwd, 'specs', 'spec.md');
      let lastContent = '';
      
      try {
        lastContent = await fs.readFile(specPath, 'utf-8');
      } catch {
        // File might not exist yet
      }

      const interval = setInterval(async () => {
        try {
          const currentContent = await fs.readFile(specPath, 'utf-8');
          if (currentContent !== lastContent) {
            console.log(chalk.dim('\n📝 File changed, re-running validation...\n'));
            lastContent = currentContent;

            try {
              const output = execSync(`openspec validate --change "${changeName}"`, {
                cwd: path.join(cwd, '..', '..'),
                encoding: 'utf-8',
                stdio: 'pipe',
              });
              console.log(chalk.green('✅ Validation PASS\n'));
              console.log(output);
            } catch (error: any) {
              console.log(chalk.red('❌ Validation FAIL\n'));
              if (error.stdout) console.log(error.stdout);
              if (error.stderr) console.log(error.stderr);
            }
          }
        } catch {
          // File might be temporarily unavailable
        }
      }, 1000);

      // Keep process running
      process.on('SIGINT', () => {
        clearInterval(interval);
        console.log(chalk.dim('\n\nStopped watching.'));
        process.exit(0);
      });
    }

  } catch (error: any) {
    if (error.message?.includes('openspec')) {
      spinner.fail('OpenSpec CLI error. Make sure it\'s installed: npm install -g @openspec/cli');
    } else {
      spinner.fail(`Test failed: ${error}`);
    }
    process.exit(1);
  }
}
