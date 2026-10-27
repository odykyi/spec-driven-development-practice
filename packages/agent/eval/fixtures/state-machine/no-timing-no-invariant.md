# Traffic Light Controller

## ADDED Requirements

### Requirement: Light States
The controller SHALL support three states: Red, Green and Yellow.

#### Scenario: Normal transition
- **WHEN** the controller is Red and receives a NEXT event
- **THEN** it switches to Green

### Requirement: Transition Triggers
The controller SHALL move Red → Green → Yellow → Red, one step per NEXT event emitted by its scheduler.

#### Scenario: Yellow returns to Red
- **WHEN** the controller is Yellow and receives a NEXT event
- **THEN** it switches to Red

### Requirement: Exceptional Modes
The controller SHALL handle emergency, power failure and manual control events.

#### Scenario: Emergency override
- **WHEN** an EMERGENCY event is received in any state
- **THEN** the controller switches to Red and ignores NEXT events until EMERGENCY_CLEAR

#### Scenario: Power failure
- **WHEN** a POWER_LOST event is received
- **THEN** the controller flashes the red lamp

#### Scenario: Manual control
- **WHEN** an operator sends MANUAL_ON
- **THEN** only operator NEXT commands change the state
