## ADDED Requirements

### Requirement: Exercise submission marks change complete
The system SHALL mark an OpenSpec change as complete when the exercise is submitted.

#### Scenario: Submit completed exercise
- **WHEN** user runs `sdd submit` after all artifacts are done
- **THEN** the system checks `openspec status --change <name>`
- **AND** verifies all required artifacts have status "done"
- **AND** marks exercise as completed in local database
- **AND** displays success message

#### Scenario: Submit incomplete exercise
- **WHEN** user runs `sdd submit` but artifacts are incomplete
- **THEN** the system displays which artifacts are missing
- **AND** suggests running `openspec status` to check progress
- **AND** exits without marking complete

#### Scenario: Submit with validation errors
- **WHEN** user attempts submit but validation fails
- **THEN** the system displays validation errors
- **AND** prevents submission until fixed
