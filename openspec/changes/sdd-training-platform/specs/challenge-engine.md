## ADDED Requirements

### Requirement: Exercise validation executes against submission
The validation engine SHALL execute a set of predefined checks against a user's submitted specification.

#### Scenario: Validation passes
- **WHEN** a user submits a specification for an exercise
- **AND** the specification meets all exercise requirements
- **THEN** the validation engine returns a success status
- **AND** all checks show as passed

#### Scenario: Validation fails with errors
- **WHEN** a user submits a specification for an exercise
- **AND** the specification fails one or more requirements
- **THEN** the validation engine returns a failure status
- **AND** each failed check includes an error message explaining the failure

### Requirement: Validation checks are exercise-specific
The validation engine SHALL load validation rules from the exercise's configuration.

#### Scenario: Loading exercise-specific validators
- **WHEN** validating a submission for exercise "basic-structure"
- **THEN** the engine loads validation rules from `.meta/config.yml`
- **AND** applies only those rules defined for that exercise

### Requirement: Validation results are cached
The validation engine SHALL cache validation results for a configurable duration.

#### Scenario: Cached result returned
- **WHEN** a user re-submits an unchanged specification within the cache TTL
- **THEN** the engine returns the cached result without re-running validation

### Requirement: Validation supports multiple output formats
The validation engine SHALL support at least JSON and human-readable text output formats.

#### Scenario: JSON output for API
- **WHEN** validation is triggered via API with format=json
- **THEN** the engine returns a JSON object with structured results

#### Scenario: Text output for CLI
- **WHEN** validation is triggered via CLI without format specification
- **THEN** the engine returns human-readable text with check results
