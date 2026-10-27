# API Rate Limiting

## ADDED Requirements

### Requirement: Request Counting
The API SHALL count requests per API key in a sliding window.

#### Scenario: Request counted
- **WHEN** a client sends a request
- **THEN** its counter increases by 1

### Requirement: Time Windows
The API SHALL enforce separate limits per second, per minute, per hour and per day.

#### Scenario: Minute limit reached
- **WHEN** a client sends more than 300 requests in one minute
- **THEN** the API responds 429 Too Many Requests

### Requirement: Limit Exceeded
The API SHALL return 429 Too Many Requests for every request over a limit.

#### Scenario: Over the daily limit
- **WHEN** a client exceeds 50000 requests in one day
- **THEN** the API responds 429 Too Many Requests

## Out of Scope

Rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset) and burst handling (a 20 req/sec token bucket) will be specified in a later change.
