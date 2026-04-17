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

✅ **Initialize OpenSpec change**: `sdd init-exercise basics/hello-world`  
✅ **Write in `openspec/changes/basics-hello-world/specs/spec.md`**  
✅ **At least 2 scenarios**:
   - 1 scenario for "Default greeting when no name provided"  
   - 1 scenario for "Personalized greeting when name provided"  
✅ **Uses SHALL** for mandatory requirements  
✅ **Proper WHEN/THEN format** for all scenarios  
✅ **All artifacts complete**: Check with `openspec status --change basics-hello-world`  
✅ **Validates successfully**: Run `openspec validate --change basics-hello-world`

## Where to Write

After running `sdd init-exercise basics/hello-world`, edit:
```
~/sdd-exercises/openspec/changes/basics-hello-world/specs/spec.md
```

Run this to open it:
```bash
cd ~/sdd-exercises/openspec/changes/basics-hello-world
open specs/spec.md        # On macOS
# Or: nano specs/spec.md
# Or: code specs/spec.md  # VS Code
```

## How Many Scenarios

You need **2 scenarios minimum**. Copy-paste this template into `specs/spec.md`:

```markdown
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
