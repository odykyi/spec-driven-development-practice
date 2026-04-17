#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';

const program = new Command();

program
  .name('openspec')
  .description('OpenSpec - Specification validation and management')
  .version('0.1.0');

program
  .command('validate')
  .description('Validate a specification file')
  .argument('<file>', 'Specification file to validate')
  .action(async (file: string) => {
    try {
      const content = await fs.readFile(file, 'utf-8');
      console.log(chalk.green('✓'), `File ${file} loaded`);
      console.log(chalk.dim('Validation coming in next version...'));
    } catch (error) {
      console.error(chalk.red('✗'), `Failed to read file: ${error}`);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize a new specification project')
  .action(async () => {
    console.log(chalk.blue('ℹ'), 'Creating example specification...');
    
    const template = `# Project Specification

## ADDED Requirements

### Requirement: Example requirement
Description of what the system SHALL do.

#### Scenario: Example scenario
- **WHEN** some condition
- **THEN** expected outcome
`;

    await fs.writeFile('spec.md', template);
    console.log(chalk.green('✓'), 'Created spec.md');
  });

program.parse();
