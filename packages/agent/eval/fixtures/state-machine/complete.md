# Traffic Light Controller

## ADDED Requirements

### Requirement: Light States
The controller SHALL be in exactly one of three states at any time: Red, Green or Yellow.

#### Scenario: Start-up state
- **WHEN** the controller powers on
- **THEN** it enters the Red state and lights only the red lamp

### Requirement: Timed Transitions
The controller SHALL move Red → Green after 30 seconds, Green → Yellow after 25 seconds, and Yellow → Red after 5 seconds.

#### Scenario: Normal cycle
- **WHEN** the controller has been in Red for 30 seconds
- **THEN** it switches to Green
- **AND** after 25 seconds in Green it switches to Yellow
- **AND** after 5 seconds in Yellow it switches to Red

### Requirement: Emergency Override
The controller SHALL switch to Red within 1 second when it receives an EMERGENCY signal, and hold Red until the signal clears.

#### Scenario: Emergency vehicle approaching
- **WHEN** an EMERGENCY signal is received while the light is Green
- **THEN** the light switches to Yellow for 2 seconds and then to Red
- **AND** it stays Red until an EMERGENCY_CLEAR signal is received

### Requirement: Power Failure Handling
The controller SHALL flash the red lamp at 1 Hz while running on backup power.

#### Scenario: Mains power lost
- **WHEN** mains power fails and the controller switches to backup power
- **THEN** the red lamp flashes once per second and the green and yellow lamps stay off

### Requirement: Manual Control Mode
The controller MUST let an operator advance the light one state at a time in manual mode, with timers suspended.

#### Scenario: Operator advances the light
- **WHEN** the operator enables manual mode and presses NEXT while the light is Red
- **THEN** the light switches to Green and stays Green until NEXT is pressed again

### Requirement: Single Active Lamp Invariant
The controller SHALL never light more than one lamp at the same time, except while flashing red on backup power.

#### Scenario: Transition does not overlap lamps
- **WHEN** the light switches from Yellow to Red
- **THEN** the yellow lamp turns off before the red lamp turns on
