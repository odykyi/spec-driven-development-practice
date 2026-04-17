# User Story

Learn to write specifications using the Given-When-Then format for user stories.

## Instructions

Write a specification for a user story about a user adding an item to a shopping cart.

## Requirements

Your specification should:
1. Define the user story clearly
2. Include at least 3 scenarios:
   - Successfully adding an available item
   - Trying to add an out-of-stock item
   - Adding multiple quantities of an item

## Learning Goals

- Understand the Given-When-Then pattern
- Write scenarios from the user's perspective
- Consider business rules and edge cases

## Hints

- Use "Given" to set up the initial context
- Use "When" to describe the action
- Use "Then" to describe the expected outcome
- You can have multiple "And" steps

## Definition of Done

✅ **Initialize OpenSpec change**: `sdd init-exercise basics/user-story`  
✅ **Write in `openspec/changes/basics-user-story/specs/spec.md`**  
✅ **At least 3 scenarios** (success, out-of-stock, multiple quantities)  
✅ **Uses GIVEN-WHEN-THEN format** for all scenarios  
✅ **User story is clearly defined** from user's perspective  
✅ **Business rules documented**  
✅ **All artifacts complete**: Check with `openspec status --change basics-user-story`  
✅ **Validates successfully**: Run `openspec validate --change basics-user-story`

## Where to Write

After running `sdd init-exercise basics/user-story`, edit:
```
~/sdd-exercises/openspec/changes/basics-user-story/specs/spec.md
```

Run this to open it:
```bash
cd ~/sdd-exercises/openspec/changes/basics-user-story
open specs/spec.md        # On macOS
# Or: nano specs/spec.md
# Or: code specs/spec.md  # VS Code
```

## Example Structure

```markdown
### Requirement: Add to Cart
As a shopper, I want to add items to my cart...

#### Scenario: Available item
- **GIVEN** the user is viewing a product
- **AND** the product is in stock
- **WHEN** the user clicks "Add to Cart"
- **THEN** the item is added to the cart
- **AND** the cart count increases by 1
```
