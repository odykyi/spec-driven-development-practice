## ADDED Requirements

### Requirement: Exercise initialization creates OpenSpec change
The system SHALL create a new OpenSpec change when initializing an exercise.

#### Scenario: Initialize hello-world exercise
- **WHEN** user runs `sdd init-exercise basics/hello-world`
- **THEN** the system executes `openspec new change "basics-hello-world"`
- **AND** creates directory structure in `openspec/changes/basics-hello-world/`
- **AND** copies exercise description into `proposal.md`
- **AND** copies exercise hints into `design.md`

#### Scenario: Exercise already initialized
- **WHEN** user runs `sdd init-exercise` for an already-initialized exercise
- **THEN** the system warns "Exercise already initialized"
- **AND** suggests using `--force` to recreate
