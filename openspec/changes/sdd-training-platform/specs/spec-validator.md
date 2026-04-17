## ADDED Requirements

### Requirement: Spec parser extracts structure from markdown
The spec validator SHALL parse specification documents and extract their structural elements.

#### Scenario: Parse valid specification
- **WHEN** parsing a specification document with valid structure
- **THEN** the parser extracts: title, requirements, scenarios per requirement
- **AND** returns a structured object with all elements

#### Scenario: Parse invalid specification
- **WHEN** parsing a document with invalid structure
- **THEN** the parser returns parsing errors
- **AND** errors include line numbers and descriptive messages

### Requirement: Validator checks requirement presence
The spec validator SHALL verify that specifications contain required sections.

#### Scenario: Missing required section
- **WHEN** validating a specification without a "Requirements" section
- **THEN** the validator returns an error indicating the missing section
- **AND** the error suggests adding the section

#### Scenario: All required sections present
- **WHEN** validating a specification with all required sections
- **THEN** the validator passes the presence check

### Requirement: Validator checks scenario format
The spec validator SHALL verify that scenarios follow the WHEN/THEN format.

#### Scenario: Invalid scenario format
- **WHEN** validating a scenario without proper WHEN/THEN structure
- **THEN** the validator returns a format error
- **AND** provides an example of correct format

#### Scenario: Valid scenario format
- **WHEN** validating a scenario with proper WHEN/THEN bullet structure
- **THEN** the validator passes the format check

### Requirement: Validator supports custom rules
The spec validator SHALL support exercise-specific custom validation rules.

#### Scenario: Custom rule execution
- **WHEN** an exercise defines a custom rule (e.g., "must include at least 3 scenarios")
- **THEN** the validator applies that rule during validation
- **AND** returns the custom rule result in the validation output

### Requirement: Validator provides actionable feedback
The spec validator SHALL provide clear, actionable feedback for validation failures.

#### Scenario: Feedback clarity
- **WHEN** a validation check fails
- **THEN** the error message explains what was expected
- **AND** the error message shows what was actually found
- **AND** the error message provides guidance on how to fix it
