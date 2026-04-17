## ADDED Requirements

### Requirement: Tracks organize exercises by difficulty
The track management system SHALL organize exercises into linear progressions based on difficulty.

#### Scenario: Track structure
- **WHEN** viewing the "Basics" track
- **THEN** exercises are displayed in order from easiest to hardest
- **AND** each exercise shows prerequisites (if any)

#### Scenario: Track metadata
- **WHEN** loading a track
- **THEN** the system reads track metadata from `track.yml`
- **AND** metadata includes: name, description, difficulty level, estimated time

### Requirement: Tracks support concept grouping
The track management system SHALL group exercises by concept within a track.

#### Scenario: Concept grouping
- **WHEN** viewing the "Patterns" track
- **THEN** exercises are grouped under concepts like "Given-When-Then", "Actor-Model", "State Machines"
- **AND** users can see which concepts they've mastered

### Requirement: Exercise dependencies are enforced
The track management system SHALL prevent access to exercises until prerequisites are completed.

#### Scenario: Locked exercise
- **WHEN** attempting to start exercise that requires uncompleted prerequisites
- **THEN** the system displays the exercise as locked
- **AND** shows which prerequisite exercises must be completed first

#### Scenario: Unlocked exercise
- **WHEN** all prerequisite exercises are completed
- **THEN** the exercise becomes available for the user to start

### Requirement: Tracks support multiple languages
The track management system SHALL support exercise content in multiple languages.

#### Scenario: Language selection
- **WHEN** a user selects language "Spanish"
- **THEN** exercise instructions are displayed in Spanish
- **AND** track metadata is displayed in Spanish
