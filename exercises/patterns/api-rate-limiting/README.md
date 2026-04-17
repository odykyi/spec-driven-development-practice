# API Rate Limiting

Learn to specify rate limiting requirements for APIs to prevent abuse and ensure fair usage.

## Instructions

Write a specification for an API rate limiting system that controls how many requests a client can make within a time window.

## Learning Goals

- Specify numeric constraints and thresholds
- Define different rate limits for different user types
- Handle rate limit exceeded scenarios
- Document HTTP status codes and headers

## Requirements

Your specification should cover:
1. Request counting mechanism
2. Time window definitions (per second, per minute, per hour, per day)
3. Different limits for authenticated vs anonymous users
4. Rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)
5. Behavior when limits are exceeded (429 Too Many Requests)
6. Burst handling and token bucket algorithm

## Business Rules

- Anonymous users: 100 requests per hour
- Authenticated users: 1000 requests per hour
- Premium users: 10000 requests per hour
- Burst allowance: 20 requests in 1 second for all tiers

## Example Structure

```markdown
### Requirement: Rate Limit Enforcement
The API SHALL enforce rate limits based on user tier.

#### Scenario: Anonymous user within limit
- **GIVEN** an anonymous user has made 50 requests in the last hour
- **WHEN** the user makes another request
- **THEN** the system processes the request
- **AND** returns X-RateLimit-Remaining: 50

#### Scenario: Rate limit exceeded
- **GIVEN** an anonymous user has made 100 requests in the last hour
- **WHEN** the user makes another request
- **THEN** the system returns 429 Too Many Requests
- **AND** returns Retry-After header with seconds until reset
```
