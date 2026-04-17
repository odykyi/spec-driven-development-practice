# E-Commerce Checkout Flow

Write a comprehensive specification for a complete e-commerce checkout process, from adding a product to the basket through payment completion.

## Instructions

Create a detailed specification that covers the entire checkout flow. This is a complex, multi-step process that requires careful attention to user interactions, data validation, and error handling.

## Context

**User Story**: As a customer, I want to purchase products online so that I can receive them at my home.

**System**: An e-commerce website selling physical products with shipping requirements.

## The Complete Checkout Flow (20 Steps)

### Phase 1: Product Discovery (Steps 1-3)
1. **Browse/Search Products** - User finds the product they want
2. **View Product Details** - User examines product information, images, reviews
3. **Select Options** - User chooses size, color, quantity, etc.

### Phase 2: Basket Management (Steps 4-6)
4. **Add to Basket** - User adds selected product to their basket
5. **View Basket** - User reviews basket contents
6. **Update Basket** - User can change quantities or remove items

### Phase 3: Authentication (Steps 7-9)
7. **Checkout Initiation** - User clicks "Proceed to Checkout"
8. **Account Check** - System checks if user is logged in
9. **Guest or Login** - User chooses to login, register, or checkout as guest

### Phase 4: Shipping Information (Steps 10-12)
10. **Enter Shipping Address** - User inputs delivery address
11. **Validate Address** - System validates the address format and existence
12. **Select Shipping Method** - User chooses delivery speed/cost option

### Phase 5: Billing & Payment (Steps 13-16)
13. **Enter Billing Address** - User inputs or confirms billing address
14. **Select Payment Method** - User chooses credit card, PayPal, etc.
15. **Enter Payment Details** - User inputs card number, expiry, CVV
16. **Validate Payment** - System validates payment information

### Phase 6: Review & Confirmation (Steps 17-18)
17. **Order Review** - User reviews entire order: items, shipping, billing, total cost
18. **Apply Promo Code** - User can enter discount codes (optional step)

### Phase 7: Order Completion (Steps 19-20)
19. **Place Order** - User confirms and submits the order
20. **Order Confirmation** - System processes payment and confirms order with reference number

## Additional Requirements

### Error Scenarios to Consider:
- Product out of stock when adding to basket
- Invalid shipping address
- Payment declined
- Session timeout during checkout
- Promo code invalid or expired
- Minimum order not met
- Shipping restrictions to selected location

### Business Rules:
- Minimum order value of $10
- Free shipping on orders over $50
- Promo codes cannot be combined
- Billing and shipping address can be different
- CVV required for all card payments
- 3D Secure authentication for high-value orders

## Validation Criteria

Your specification must:
1. Cover all 20 steps of the checkout flow
2. Include at least 5 error scenarios
3. Define all business rules explicitly
4. Use proper WHEN/THEN format for all scenarios
5. Include data validation requirements
6. Cover both happy path and edge cases

## Hints

- Break down the flow into logical phases
- Consider what data needs to be captured at each step
- Think about validation at each stage
- Consider state management (basket state, user session)
- Don't forget security requirements for payment
- Consider mobile vs desktop differences
- Think about accessibility requirements

## Example Structure

```markdown
### Requirement: Product Discovery
The system SHALL allow users to browse and select products.

#### Scenario: Successful product selection
- **GIVEN** the user is on the product listing page
- **WHEN** the user clicks on a product
- **THEN** the system displays the product details page
- **AND** shows available options (size, color)
- **AND** displays the price and availability

#### Scenario: Out of stock product
- **GIVEN** the user is viewing a product
- **WHEN** the product is out of stock
- **THEN** the system displays "Out of Stock" message
- **AND** shows expected restock date
- **AND** provides "Notify Me" option
```

## Success Criteria / Definition of Done

✅ **Written in `spec.md` file** (in this exercise folder)  
✅ **All 20 steps documented** with requirements  
✅ **At least 10 scenarios** covering the flow  
✅ **5+ error scenarios** defined  
✅ **Business rules explicitly stated**  
✅ **Data validation requirements** included  
✅ **Security considerations** documented  
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
