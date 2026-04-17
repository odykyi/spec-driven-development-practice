# State Machine

Advanced exercise: Model a system using state machine patterns.

## Instructions

Write a specification for a simple traffic light state machine that cycles through Red → Green → Yellow → Red.

## Requirements

Your specification should:
1. Define all possible states
2. Define valid state transitions
3. Define timing requirements for each state
4. Include at least 4 scenarios covering:
   - Normal state transitions
   - Emergency override
   - Power failure handling
   - Manual control mode

## Learning Goals

- Model complex systems with states and transitions
- Use precise timing requirements
- Handle exceptional cases
- Document invariants and constraints

## Concepts

- **States**: Red, Green, Yellow
- **Transitions**: Timed automatic transitions
- **Events**: Emergency override, power failure, manual control
- **Invariants**: Only one light active at a time

## Hints

- Use state diagrams in your description
- Define preconditions for each transition
- Consider what happens when the system starts
- Include timing as explicit requirements
- Model error states explicitly

## Definition of Done

✅ **Written in `spec.md` file** (in this exercise folder)  
✅ **At least 4 scenarios** (normal, emergency, power failure, manual)  
✅ **All 3 states defined** (Red, Green, Yellow)  
✅ **State transitions documented** with triggers  
✅ **Timing requirements specified** for each state  
✅ **Invariants documented** (only one light active)  
✅ **Validates successfully** with `sdd test`

## Where to Write

Edit the file **`spec.md`** in your exercise directory.

Run this to open it:
```bash
# On macOS:
open spec.md

# Or use any editor:
nano spec.md
vim spec.md
code spec.md  # VS Code
```
