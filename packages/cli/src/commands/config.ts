import * as fs from 'fs/promises';
import * as path from 'path';
import os from 'os';
import chalk from 'chalk';
import { getConfig, setConfig, Config } from '../config/config.js';

interface ConfigOptions {
  get?: string;
  set?: string[];
  list?: boolean;
}

export async function configCommand(options: ConfigOptions): Promise<void> {
  try {
    if (options.list) {
      const config = await getConfig();
      console.log(chalk.bold('\nCurrent Configuration:'));
      console.log(chalk.dim('─'.repeat(40)));
      
      for (const [key, value] of Object.entries(config)) {
        console.log(`  ${key}: ${chalk.cyan(value)}`);
      }
      console.log('');
      return;
    }
    
    if (options.get) {
      const config = await getConfig();
      const value = config[options.get as keyof Config];
      
      if (value === undefined) {
        console.log(chalk.yellow(`Config key '${options.get}' not found.`));
      } else {
        console.log(`${options.get}: ${chalk.cyan(value)}`);
      }
      return;
    }
    
    if (options.set && options.set.length >= 2) {
      const [key, value] = options.set;
      await setConfig(key as keyof Config, value);
      console.log(chalk.green(`✓ Set ${key} = ${value}`));
      return;
    }
    
    // No options provided, show help
    console.log(chalk.bold('Configuration Commands:'));
    console.log('  sdd config --list              List all configuration');
    console.log('  sdd config --get <key>         Get a specific value');
    console.log('  sdd config --set <key> <value> Set a configuration value');
    console.log('');
    console.log(chalk.dim('Available keys:'));
    console.log(chalk.dim('  serverUrl     - Server URL for sync'));
    console.log(chalk.dim('  exercisesPath - Path to exercises repository'));
    console.log(chalk.dim('  workspacePath - Local workspace directory'));
    console.log(chalk.dim('  authToken     - Authentication token'));
    console.log('');
  } catch (error) {
    console.error(chalk.red(`Config error: ${error}`));
    process.exit(1);
  }
}
