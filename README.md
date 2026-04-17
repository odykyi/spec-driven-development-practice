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
# Clone the repository
git clone https://github.com/your-org/sdd-training.git
cd sdd-training

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### CLI Usage

```bash
# Download an exercise
pnpm cli download basics/hello-world

# Navigate to exercise and write your spec
cd exercises/basics/hello-world

# Test your solution locally
pnpm cli test

# Submit your solution
pnpm cli submit
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
