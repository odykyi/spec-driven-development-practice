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

interface TestOptions {
  watch?: boolean;
}

export async function testCommand(options: TestOptions): Promise<void> {
  const spinner = ora('Running tests...').start();
  
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

    // Load exercise config
    const loader = new ExerciseLoader(cwd);
    const exercise = await loader.loadExercise('.');

    // Read the spec file
    const specPath = path.join(cwd, 'spec.md');
    let specContent: string;
    try {
      specContent = await fs.readFile(specPath, 'utf-8');
    } catch {
      spinner.fail('No spec.md file found. Create your specification first.');
      process.exit(1);
    }

    // Parse and validate
    spinner.text = 'Parsing specification...';
    const parser = new SpecParser();
    const spec = parser.parse(specContent);

    spinner.text = 'Running validation...';
    const engine = new ValidationEngine(createMemoryCache());
    const result = engine.validate(spec, {
      exerciseConfig: exercise.config,
      cache: createMemoryCache(),
    });

    // Display results
    spinner.stop();
    
    const formatter = new OutputFormatter();
    console.log(formatter.toText(result));

    if (options.watch) {
      console.log(chalk.dim('\n👀 Watching for changes... (Press Ctrl+C to stop)'));
      
      // Simple file watching implementation
      let lastContent = specContent;
      
      const interval = setInterval(async () => {
        try {
          const currentContent = await fs.readFile(specPath, 'utf-8');
          if (currentContent !== lastContent) {
            console.log(chalk.dim('\n📝 File changed, re-running validation...\n'));
            lastContent = currentContent;
            
            const newSpec = parser.parse(currentContent);
            const newResult = engine.validate(newSpec, {
              exerciseConfig: exercise.config,
              cache: createMemoryCache(),
            });
            
            console.log(formatter.toText(newResult));
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
    } else {
      // Exit with appropriate code
      process.exit(result.status === 'pass' ? 0 : 1);
    }
  } catch (error) {
    spinner.fail(`Test failed: ${error}`);
    process.exit(1);
  }
}
