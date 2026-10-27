# Traffic Light

## ADDED Requirements

### Requirement: States
The traffic light SHALL have the states Red, Green and Yellow.

Timing for each state is configured appropriately by operators (TBD).
Invariants such as only one light active at a time are out of scope for this version.

#### Scenario: Normal operation
- **WHEN** the light is running
- **THEN** it changes state as needed

#### Scenario: Emergency override
- **WHEN** an emergency vehicle approaches
- **THEN** the light handles the emergency properly
