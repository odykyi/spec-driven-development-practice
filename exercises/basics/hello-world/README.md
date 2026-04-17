# Hello World

Welcome to Spec-Driven Development! This is your first exercise.

## Instructions

Write a specification for a simple "Hello World" function that takes a name and returns a greeting.

## Requirements

Your specification should include:
1. A clear description of what the function does
2. At least 2 scenarios covering:
   - Default greeting when no name is provided
   - Personalized greeting when a name is provided

## Example

```markdown
### Requirement: Greeting Function
The system SHALL provide a greeting function.

#### Scenario: Default greeting
- **WHEN** no name is provided
- **THEN** the function returns "Hello, World!"

#### Scenario: Personalized greeting
- **WHEN** a name "Alice" is provided
- **THEN** the function returns "Hello, Alice!"
```

## Hints

- Use "SHALL" for mandatory requirements
- Be specific about inputs and outputs
- Consider edge cases (empty string, special characters)

## Definition of Done

✅ **Written in `spec.md` file** (in this same folder)  
✅ **At least 2 scenarios**:
   - 1 scenario for "Default greeting when no name provided"  
   - 1 scenario for "Personalized greeting when name provided"  
✅ **Uses SHALL** for mandatory requirements  
✅ **Proper WHEN/THEN format** for all scenarios  
✅ **Validates successfully** with `sdd test`

## Where to Write

Edit the file **`spec.md`** in your exercise directory.

Run this to open it:
```bash
# On macOS:
open spec.md

# Or use any editor:
nano spec.md
vim spec.md
code spec.md  # VS Code
```

## How Many Scenarios

You need **2 scenarios minimum**. Copy-paste this template into `spec.md`:

```markdown
# Hello World

## ADDED Requirements

### Requirement: Greeting Function
The system SHALL provide a greeting function.

#### Scenario: Default greeting
- **WHEN** no name is provided
- **THEN** the function returns "Hello, World!"

#### Scenario: Personalized greeting
- **WHEN** a name "Alice" is provided
- **THEN** the function returns "Hello, Alice!"
```
