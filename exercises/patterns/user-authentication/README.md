# User Authentication Flow

Specify a complete user authentication system with registration, login, password reset, and session management.

## Instructions

Write a comprehensive specification for user authentication covering all common flows.

## Learning Goals

- Specify security requirements
- Handle error cases gracefully
- Define session management
- Document password requirements

## The Flow (12 Steps)

1. **User Registration** - Create new account with email/password
2. **Email Verification** - Verify email address
3. **Login** - Authenticate with credentials
4. **Remember Me** - Persistent login option
5. **Password Reset Request** - Initiate password reset
6. **Password Reset Confirmation** - Complete password reset via email
7. **Session Creation** - Create authenticated session
8. **Session Validation** - Check session on each request
9. **Session Refresh** - Extend session before expiry
10. **Logout** - End session
11. **Account Lockout** - Lock after failed attempts
12. **Two-Factor Authentication** - Optional 2FA support

## Security Requirements

- Passwords must be at least 8 characters with uppercase, lowercase, number, and special char
- Failed login attempts tracked (lockout after 5 failures)
- Sessions expire after 30 minutes of inactivity
- Password reset tokens expire after 1 hour
- All tokens must be cryptographically secure

## Example Structure

```markdown
### Requirement: User Registration
The system SHALL allow users to create accounts.

#### Scenario: Successful registration
- **GIVEN** a user provides valid email and password
- **WHEN** the user submits registration
- **THEN** the system creates the account
- **AND** sends verification email
- **AND** returns 201 Created

#### Scenario: Weak password
- **GIVEN** a user provides password "123"
- **WHEN** the user submits registration
- **THEN** the system returns 400 Bad Request
- **AND** includes error: "Password must be at least 8 characters"
```

## Definition of Done

✅ **Initialize OpenSpec change**: `sdd init-exercise patterns/user-authentication`  
✅ **Write in `openspec/changes/patterns-user-authentication/specs/spec.md`**  
✅ **At least 10 scenarios** covering the 12-step flow  
✅ **All 12 steps documented** with requirements  
✅ **Security requirements specified** (password rules, lockout)  
✅ **Session management defined** (creation, validation, expiry)  
✅ **Error scenarios included** (weak password, invalid credentials)  
✅ **All artifacts complete**: Check with `openspec status --change patterns-user-authentication`  
✅ **Validates successfully**: Run `openspec validate --change patterns-user-authentication`

## Where to Write

After running `sdd init-exercise patterns/user-authentication`, edit:
```
~/sdd-exercises/openspec/changes/patterns-user-authentication/specs/spec.md
```

Run this to open it:
```bash
cd ~/sdd-exercises/openspec/changes/patterns-user-authentication
open specs/spec.md        # On macOS
# Or: nano specs/spec.md
# Or: code specs/spec.md  # VS Code
```
