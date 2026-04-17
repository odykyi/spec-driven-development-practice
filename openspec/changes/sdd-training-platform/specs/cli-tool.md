## ADDED Requirements

### Requirement: CLI downloads exercises locally
The CLI tool SHALL download exercise files to the user's local machine.

#### Scenario: Download exercise
- **WHEN** running `sdd download basics/hello-world`
- **THEN** the CLI creates a local directory for the exercise
- **AND** downloads README.md with instructions
- **AND** downloads any starter files
- **AND** downloads .meta/config.yml for validation rules

#### Scenario: Exercise already exists
- **WHEN** attempting to download an already-downloaded exercise
- **THEN** the CLI prompts for confirmation to overwrite
- **AND** preserves any existing solution files by default

### Requirement: CLI submits solutions
The CLI tool SHALL submit local specifications to the validation server.

#### Scenario: Submit solution
- **WHEN** running `sdd submit` from within an exercise directory
- **THEN** the CLI reads the local specification file
- **AND** sends it to the validation endpoint
- **AND** displays the validation results

#### Scenario: Submit with message
- **WHEN** running `sdd submit --message "First attempt"`
- **THEN** the submission includes the message
- **AND** the message is stored with the solution history

### Requirement: CLI shows exercise status
The CLI tool SHALL display the status of downloaded exercises.

#### Scenario: List exercises
- **WHEN** running `sdd list`
- **THEN** the CLI displays all downloaded exercises
- **AND** shows completion status (not started, in progress, completed)
- **AND** shows the track each exercise belongs to

### Requirement: CLI supports offline mode
The CLI tool SHALL support offline validation for downloaded exercises.

#### Scenario: Validate offline
- **WHEN** running `sdd test` without internet connection
- **THEN** the CLI runs validation locally using cached rules
- **AND** displays the validation results

### Requirement: CLI syncs progress
The CLI tool SHALL synchronize local progress with the server.

#### Scenario: Sync up
- **WHEN** running `sdd sync`
- **THEN** the CLI uploads any completed exercises not yet synced
- **AND** downloads progress updates from the server

#### Scenario: Conflict resolution
- **WHEN** local and server progress conflict
- **THEN** the CLI displays both versions
- **AND** prompts the user to choose which to keep
