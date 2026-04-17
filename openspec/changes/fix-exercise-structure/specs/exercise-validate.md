## ADDED Requirements

### Requirement: Exercise validation uses OpenSpec CLI
The system SHALL validate exercise specifications using the OpenSpec CLI instead of custom validation.

#### Scenario: Validate with openspec command
- **WHEN** user runs `sdd validate` from within an exercise directory
- **THEN** the system executes `openspec validate --change <exercise-name>`
- **AND** displays validation results from OpenSpec

#### Scenario: OpenSpec CLI not installed
- **WHEN** user attempts to validate but OpenSpec CLI is not found
- **THEN** the system displays error: "OpenSpec CLI required. Run: npm install -g @openspec/cli"
- **AND** exits with code 1

#### Scenario: Validation passes
- **WHEN** OpenSpec validation returns success
- **THEN** the system displays "✅ All checks passed"
- **AND** shows which artifacts are complete

#### Scenario: Validation fails
- **WHEN** OpenSpec validation returns failure
- **THEN** the system displays "❌ Validation failed"
- **AND** shows which artifacts need work
- **AND** displays error messages from OpenSpec
