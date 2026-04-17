import { Command } from 'commander';
import chalk from 'chalk';
import { downloadCommand } from './commands/download.js';
import { submitCommand } from './commands/submit.js';
import { listCommand } from './commands/list.js';
import { testCommand } from './commands/test.js';
import { syncCommand } from './commands/sync.js';
import { configCommand } from './commands/config.js';

const program = new Command();

program
  .name('sdd')
  .description('Spec-Driven Development Training CLI')
  .version('0.1.0');

program
  .command('download')
  .description('Download an exercise to your local machine')
  .argument('<exercise>', 'Exercise ID (e.g., basics/hello-world)')
  .option('-f, --force', 'Overwrite existing exercise')
  .action(downloadCommand);

program
  .command('submit')
  .description('Submit your solution for validation')
  .option('-m, --message <message>', 'Submission message')
  .option('--no-validate', 'Skip local validation before submitting')
  .action(submitCommand);

program
  .command('list')
  .description('List all downloaded exercises and their status')
  .option('-t, --track <track>', 'Filter by track')
  .option('--all', 'Show all available exercises (not just downloaded)')
  .action(listCommand);

program
  .command('test')
  .description('Run validation on your solution locally')
  .option('-w, --watch', 'Watch for changes and re-run tests')
  .action(testCommand);

program
  .command('sync')
  .description('Synchronize your progress with the server')
  .option('--upload', 'Only upload local progress')
  .option('--download', 'Only download server progress')
  .action(syncCommand);

program
  .command('config')
  .description('Configure CLI settings')
  .option('--get <key>', 'Get configuration value')
  .option('--set <key> <value>', 'Set configuration value')
  .option('--list', 'List all configuration')
  .action(configCommand);

program.parse();
