#!/usr/bin/env node

/**
 * OpenSpec Installer Script
 * Run this to set up OpenSpec for offline use
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔧 OpenSpec Offline Installer');
console.log('=============================\n');

// Check if running from the correct directory
const currentDir = process.cwd();
const packageJsonPath = path.join(currentDir, 'package.json');

if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Error: No package.json found. Are you in the right directory?');
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
if (packageJson.name !== 'sdd-training') {
  console.error('❌ Error: This doesn\'t appear to be the sdd-training repository.');
  process.exit(1);
}

console.log('✓ Found sdd-training repository\n');

// Step 1: Check Node.js version
console.log('📋 Checking Node.js version...');
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf-8' }).trim();
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 18) {
    console.error(`❌ Node.js ${nodeVersion} is too old. Please upgrade to v18 or higher.`);
    process.exit(1);
  }
  console.log(`✓ Node.js ${nodeVersion} is compatible\n`);
} catch {
  console.error('❌ Node.js is not installed or not in PATH');
  process.exit(1);
}

// Step 2: Check pnpm
console.log('📋 Checking pnpm...');
try {
  const pnpmVersion = execSync('pnpm --version', { encoding: 'utf-8' }).trim();
  console.log(`✓ pnpm ${pnpmVersion} found\n`);
} catch {
  console.log('⚠️  pnpm not found. Installing...');
  try {
    execSync('npm install -g pnpm', { stdio: 'inherit' });
    console.log('✓ pnpm installed\n');
  } catch {
    console.error('❌ Failed to install pnpm. Please install manually: npm install -g pnpm');
    process.exit(1);
  }
}

// Step 3: Check OpenSpec CLI
console.log('📋 Checking OpenSpec CLI...');
try {
  const openspecVersion = execSync('openspec --version', { encoding: 'utf-8' }).trim();
  console.log(`✓ OpenSpec CLI ${openspecVersion} found\n`);
} catch {
  console.log('⚠️  OpenSpec CLI not found. Installing...');
  try {
    execSync('npm install -g @openspec/cli', { stdio: 'inherit' });
    console.log('✓ OpenSpec CLI installed\n');
  } catch {
    console.error('❌ Failed to install OpenSpec CLI. Please install manually: npm install -g @openspec/cli');
    process.exit(1);
  }
}

// Step 4: Install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('pnpm install', { stdio: 'inherit' });
  console.log('✓ Dependencies installed\n');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Step 5: Build packages
console.log('🔨 Building packages...');
try {
  execSync('pnpm build', { stdio: 'inherit' });
  console.log('✓ Packages built\n');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Step 6: Link CLI globally (optional)
console.log('🔗 Linking CLI globally...');
try {
  execSync('pnpm --filter @sdd-training/cli link --global', { stdio: 'pipe' });
  console.log('✓ CLI linked globally\n');
} catch {
  console.log('⚠️  Could not link CLI globally. You can use: pnpm cli\n');
}

// Step 7: Set up workspace directory
console.log('📁 Setting up workspace...');
const workspaceDir = path.join(os.homedir(), 'sdd-exercises');
if (!fs.existsSync(workspaceDir)) {
  fs.mkdirSync(workspaceDir, { recursive: true });
  console.log(`✓ Created workspace: ${workspaceDir}\n`);
} else {
  console.log(`✓ Workspace exists: ${workspaceDir}\n`);
}

// Step 8: Copy exercises to workspace
console.log('📚 Copying exercises to workspace...');
const exercisesSource = path.join(currentDir, 'exercises');
const exercisesDest = path.join(workspaceDir, 'exercises');

try {
  if (fs.existsSync(exercisesDest)) {
    fs.rmSync(exercisesDest, { recursive: true });
  }
  fs.cpSync(exercisesSource, exercisesDest, { recursive: true });
  console.log(`✓ Exercises copied to ${exercisesDest}\n`);
} catch (error) {
  console.error('❌ Failed to copy exercises:', error.message);
  process.exit(1);
}

// Step 9: Create config
const configDir = path.join(os.homedir(), '.config', 'sdd');
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

const config = {
  workspacePath: workspaceDir,
  exercisesPath: exercisesDest,
  offlineMode: true,
};

fs.writeFileSync(
  path.join(configDir, 'config.json'),
  JSON.stringify(config, null, 2)
);
console.log('✓ Configuration saved\n');

// Done
console.log('🎉 OpenSpec is ready for offline use!');
console.log('\nNext steps:');
console.log('  1. Run: sdd init-exercise basics/hello-world');
console.log('  2. Navigate to: cd ~/sdd-exercises/openspec/changes/basics-hello-world');
console.log('  3. Read the README: cat proposal.md');
console.log('  4. Write your spec: edit specs/spec.md');
console.log('  5. Check status: openspec status --change basics-hello-world');
console.log('  6. Validate: openspec validate --change basics-hello-world');
console.log('\nAll exercises are available offline!');
