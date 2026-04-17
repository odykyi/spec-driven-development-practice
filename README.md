# SDD Training Platform

A progressive, hands-on platform for learning Spec-Driven Development (SDD). Similar to [Exercism](https://exercism.org), but focused on teaching developers how to write effective specifications and prompts for AI-assisted development.

## Overview

The SDD Training Platform provides:

- **Progressive Learning Tracks** - Structured learning paths from basics to advanced patterns
- **Hands-on Exercises** - Practice writing specifications with immediate feedback
- **Automated Validation** - Check your specs against exercise requirements
- **CLI Tool** - Work locally with offline support
- **Web Platform** - Browser-based interface with in-browser editor
- **Community Mentoring** - Get feedback from experienced practitioners

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# Navigate to the project directory
cd spec-driven-development-practice

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run the installer to set up offline workspace
pnpm install-openspec
```

---

## 🖥️ Demo

### Listing Available Exercises

```bash
$ sdd list

📚 SDD Training - Available Exercises

BASICS:
  • Install OpenSpec (easy)
    sdd download basics/install-openspec
  • Hello World (easy)
    sdd download basics/hello-world
  • User Story (easy)
    sdd download basics/user-story

PATTERNS:
  • State Machine (medium)
    sdd download patterns/state-machine
  • API Rate Limiting (medium)
    sdd download patterns/api-rate-limiting
  • User Authentication (medium)
    sdd download patterns/user-authentication

💡 Run "sdd download <exercise-id>" to start an exercise
```

### Downloading an Exercise

```bash
$ sdd download basics/hello-world

⠋ Downloading exercise basics/hello-world...
✔ Downloaded exercise basics/hello-world to ~/sdd-exercises/basics/hello-world

To get started:
  cd ~/sdd-exercises/basics/hello-world
  sdd test
```

### Running Validation (Success)

```bash
$ cd ~/sdd-exercises/basics/hello-world
$ sdd test

⠋ Running tests...
✅ Validation PASS

Summary: 4/4 checks passed
  Duration: 23ms

Checks:
  ✅ Requirements Present: Found 2 requirement(s)
  ✅ Requirements Have Scenarios: All requirements have at least one scenario
  ✅ Scenarios Have WHEN/THEN: All scenarios have proper WHEN and THEN clauses
  ✅ Minimum Scenarios Count: Found 3 scenarios (minimum: 2)

🎉 All checks passed! Ready to submit.
```

### Running Validation (Failure)

```bash
$ sdd test

⠋ Running tests...
❌ Validation FAIL

Summary: 2/4 checks passed
  Failed: 2
  Duration: 18ms

Checks:
  ✅ Requirements Present: Found 1 requirement(s)
  ❌ Requirements Have Scenarios: 1 requirement(s) missing scenarios: Greeting Function
  ❌ Scenarios Have WHEN/THEN: Scenarios missing WHEN/THEN: Greeting Function > Default greeting
  ✅ Minimum Scenarios Count: Found 1 scenarios (minimum: 1)

Fix the failing checks and run 'sdd test' again.
```

### Submitting Your Solution

```bash
$ sdd submit

⠋ Running validation...
✅ Validation passed
✔ Solution submitted successfully!

Validation Results:
✅ All 4 checks passed

Run 'sdd sync' to upload to server.
```

### Web Interface

The web platform provides a browser-based editor for writing specifications:

```
┌─────────────────────────────────────────────────────────────┐
│  SDD Training                                    Dashboard  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Hello World                                                │
│  ○ easy                                            Start →  │
│                                                             │
│  Instructions    [Editor]                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ # Hello World                                       │   │
│  │                                                     │   │
│  │ ## ADDED Requirements                               │   │
│  │                                                     │   │
│  │ ### Requirement: Greeting Function                  │   │
│  │ The system SHALL provide...                         │   │
│  │                                                     │   │
│  │ #### Scenario: Default greeting                     │   │
│  │ - **WHEN** no name is provided                     │   │
│  │ - **THEN** return "Hello, World!"                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Validate]                                                 │
│                                                             │
│  ✅ Validation Passed                                       │
│  4/4 checks passed                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### CLI Usage

There are three ways to run the `sdd` CLI:

**Option 1: From project directory (easiest for development)**
```bash
# From the spec-driven-development-practice directory:
pnpm cli download basics/hello-world
cd ~/sdd-exercises/basics/hello-world

# Run commands from project root:
pnpm cli test
pnpm cli submit
```

**Option 2: Direct path to CLI (when in exercise directory)**
```bash
cd ~/sdd-exercises/basics/hello-world

# Use full path to CLI:
node /path/to/spec-driven-development-practice/packages/cli/dist/cli.js test
```

**Option 3: Create alias (recommended for daily use)**
```bash
# Add to your ~/.zshrc or ~/.bashrc:
alias sdd='node /path/to/spec-driven-development-practice/packages/cli/dist/cli.js'

# Then reload your shell:
source ~/.zshrc  # or source ~/.bashrc

# Now you can use 'sdd' from anywhere:
sdd download basics/hello-world
cd ~/sdd-exercises/basics/hello-world
sdd test
sdd submit
```

**Common Commands:**
```bash
sdd list                    # List all exercises
sdd download <exercise>     # Download an exercise
sdd test                    # Validate your spec
sdd submit                  # Submit solution
sdd list --all              # Show available exercises
```

### Web Platform

```bash
# Start development server
pnpm dev

# Open http://localhost:3000
```

## Project Structure

```
sdd-training/
├── packages/
│   ├── core/           # Validation engine and shared types
│   ├── cli/            # Command-line interface
│   └── web/            # Next.js web platform
├── exercises/          # Exercise definitions
├── tracks/             # Track configurations
└── openspec/           # Project specifications
```

## Development

### Workspace Commands

```bash
# Run all tests
pnpm test

# Lint all packages
pnpm lint

# Format code
pnpm format
```

### Package-specific Commands

```bash
# Core package
pnpm --filter @sdd-training/core test
pnpm --filter @sdd-training/core build

# CLI package
pnpm --filter @sdd-training/cli start

# Web package
pnpm --filter @sdd-training/web dev
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:

- Adding new exercises
- Creating learning tracks
- Improving validation rules
- Contributing to the platform

## Documentation

- [Exercise Author Guide](./docs/exercise-author-guide.md)
- [Mentor Guide](./docs/mentor-guide.md)
- [CLI Reference](./docs/cli-reference.md)
- [Architecture](./docs/architecture.md)

## License

MIT
