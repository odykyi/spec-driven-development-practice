import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig } from '../config/config.js';

interface InitOptions {
  force?: boolean;
}

/**
 * Map exercise ID to OpenSpec change name
 * e.g., "basics/hello-world" -> "basics-hello-world"
 */
function toChangeName(exerciseId: string): string {
  return exerciseId.replace(/\//g, '-');
}

/**
 * Read exercise README and extract content
 */
async function readExerciseReadme(exercisesPath: string, exerciseId: string): Promise<string> {
  const readmePath = path.join(exercisesPath, exerciseId, 'README.md');
  try {
    return await fs.readFile(readmePath, 'utf-8');
  } catch {
    throw new Error(`Could not read README for exercise: ${exerciseId}`);
  }
}

/**
 * Read exercise config
 */
async function readExerciseConfig(exercisesPath: string, exerciseId: string): Promise<any> {
  const configPath = path.join(exercisesPath, exerciseId, '.meta', 'config.yml');
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    // Simple YAML parsing for basic fields
    const config: any = {};
    for (const line of content.split('\n')) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        config[match[1]] = match[2].trim();
      }
    }
    return config;
  } catch {
    return {};
  }
}

export async function initExerciseCommand(exerciseId: string, options: InitOptions): Promise<void> {
  const spinner = ora(`Initializing exercise ${exerciseId}...`).start();

  try {
    const config = await getConfig();
    const exercisesPath = config.exercisesPath || './exercises';
    const changeName = toChangeName(exerciseId);
    const changePath = path.join(config.workspacePath, 'openspec', 'changes', changeName);

    // Check if already initialized
    try {
      await fs.access(changePath);
      if (!options.force) {
        spinner.warn(`Exercise already initialized at ${changePath}`);
        console.log(chalk.dim('Use --force to reinitialize'));
        return;
      }
    } catch {
      // Not initialized yet, continue
    }

    // Read exercise files
    spinner.text = 'Reading exercise files...';
    const readme = await readExerciseReadme(exercisesPath, exerciseId);
    const exerciseConfig = await readExerciseConfig(exercisesPath, exerciseId);

    // Create OpenSpec change using CLI
    spinner.text = 'Creating OpenSpec change...';
    try {
      execSync(`openspec new change "${changeName}"`, {
        cwd: config.workspacePath,
        stdio: 'pipe',
      });
    } catch (error) {
      // Change might already exist, continue
    }

    // Write proposal.md (exercise description)
    spinner.text = 'Creating proposal...';
    const proposalContent = `## Why

${readme.split('\n')[0]}  // Title

${readme}

## What Changes

- Write a specification that meets the exercise requirements
- Create all required OpenSpec artifacts (proposal, design, specs, tasks)

## Capabilities

### New Capabilities
- 

## Impact

- Learning OpenSpec workflow through hands-on practice
`;
    await fs.writeFile(path.join(changePath, 'proposal.md'), proposalContent);

    // Write design.md (hints and approach)
    spinner.text = 'Creating design document...';
    const hintsMatch = readme.match(/## Hints([\s\S]*?)(?=##|$)/);
    const hints = hintsMatch ? hintsMatch[1].trim() : '';

    const designContent = `## Context

This exercise requires writing a specification for: ${exerciseConfig.name || exerciseId}

## Goals / Non-Goals

**Goals:**
- Complete all artifacts required by the exercise
- Validate successfully with OpenSpec

**Non-Goals:**
- Implementation code
- Tests

## Hints

${hints}

## Decisions

- Using OpenSpec standard format for specifications
- Organizing requirements with proper structure

## Risks / Trade-offs

- Time vs. completeness balance
`;
    await fs.writeFile(path.join(changePath, 'design.md'), designContent);

    // Create specs directory and starter spec.md
    spinner.text = 'Creating spec template...';
    await fs.mkdir(path.join(changePath, 'specs'), { recursive: true });

    const minScenarios = exerciseConfig.minScenarios || 2;
    const scenarios = Array(minScenarios).fill(0).map((_, i) => `
#### Scenario: ${i + 1}
- **WHEN** <!-- condition -->
- **THEN** <!-- expected outcome -->
`).join('');

    const specContent = `## ADDED Requirements

### Requirement: ${exerciseConfig.name || 'Exercise Solution'}
<!-- Describe what the system SHALL do -->
${scenarios}
`;
    await fs.writeFile(path.join(changePath, 'specs', 'spec.md'), specContent);

    // Create tasks.md from DoD
    spinner.text = 'Creating tasks...';
    const tasksContent = `## 1. Write Specification

- [ ] 1.1 Read exercise requirements in proposal.md
- [ ] 1.2 Write requirements in specs/spec.md
- [ ] 1.3 Add scenarios covering all cases
- [ ] 1.4 Validate with: openspec validate ${changeName}

## 2. Complete Artifacts

- [ ] 2.1 Complete proposal.md (exercise description)
- [ ] 2.2 Complete design.md (approach and hints)
- [ ] 2.3 Complete specs/spec.md (requirements)
- [ ] 2.4 Mark all tasks complete
`;
    await fs.writeFile(path.join(changePath, 'tasks.md'), tasksContent);

    spinner.succeed(chalk.green(`Exercise ${exerciseId} initialized!`));
    console.log(chalk.dim(`\nLocation: ${changePath}`));
    console.log(chalk.dim(`\nNext steps:`));
    console.log(chalk.dim(`  cd ${changePath}`));
    console.log(chalk.dim(`  cat proposal.md    # Read exercise`));
    console.log(chalk.dim(`  edit specs/spec.md # Write your spec`));
    console.log(chalk.dim(`  openspec validate --change ${changeName}`));

  } catch (error) {
    spinner.fail(`Failed to initialize exercise: ${error}`);
    process.exit(1);
  }
}
