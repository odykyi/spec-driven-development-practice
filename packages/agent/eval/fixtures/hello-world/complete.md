# Greeting Function

## ADDED Requirements

### Requirement: Greeting Function
The system SHALL provide a `greet(name?)` function that returns a greeting string.

#### Scenario: Default greeting when no name provided
- **WHEN** `greet()` is called without a name
- **THEN** it returns "Hello, World!"

#### Scenario: Personalized greeting when name provided
- **WHEN** `greet("Alice")` is called
- **THEN** it returns "Hello, Alice!"

#### Scenario: Empty name falls back to the default
- **WHEN** `greet("")` is called
- **THEN** it returns "Hello, World!"
