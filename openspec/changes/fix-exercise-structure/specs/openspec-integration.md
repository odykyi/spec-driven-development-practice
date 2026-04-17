## ADDED Requirements

### Requirement: Full OpenSpec CLI integration
The system SHALL integrate with OpenSpec CLI for all specification operations.

#### Scenario: Download exercise with OpenSpec
- **WHEN** user runs `sdd download <exercise>`
- **THEN** the system checks if OpenSpec CLI is installed
- **AND** initializes the exercise as an OpenSpec change
- **AND** copies exercise files to workspace

#### Scenario: List exercises shows OpenSpec status
- **WHEN** user runs `sdd list`
- **THEN** the system displays exercises with their OpenSpec status
- **AND** shows which exercises are initialized as changes
- **AND** shows completion status from `openspec status`

#### Scenario: Exercise help shows OpenSpec commands
- **WHEN** user runs `sdd --help` or `sdd <command> --help`
- **THEN** the system displays OpenSpec commands used
- **AND** explains the relationship between sdd and openspec commands
