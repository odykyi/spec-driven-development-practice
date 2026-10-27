# API Rate Limiting

## ADDED Requirements

### Requirement: Request Counting
The API SHALL count requests per client key (API key for authenticated users, client IP for anonymous users) using a sliding-window counter stored in Redis.

#### Scenario: Request is counted
- **WHEN** an authenticated client sends a request
- **THEN** the counter for its API key in every active window increases by 1

### Requirement: Time Windows and Tier Limits
The API SHALL enforce limits per second, per minute, per hour and per day: anonymous clients get 1/sec, 30/min, 500/hour, 2000/day; authenticated clients get 20/sec, 300/min, 5000/hour, 50000/day.

#### Scenario: Anonymous client within limits
- **WHEN** an anonymous client sends its 30th request within one minute
- **THEN** the request succeeds with status 200

#### Scenario: Anonymous client exceeds minute limit
- **WHEN** an anonymous client sends its 31st request within one minute
- **THEN** the API responds 429 Too Many Requests

#### Scenario: Authenticated client exceeds daily limit
- **WHEN** an authenticated client sends request number 50001 within one day
- **THEN** the API responds 429 Too Many Requests

### Requirement: Rate Limit Headers
Every response SHALL include X-RateLimit-Limit, X-RateLimit-Remaining and X-RateLimit-Reset (Unix seconds) for the most restrictive active window.

#### Scenario: Headers on a successful request
- **WHEN** an authenticated client with 299 requests left this minute sends a request
- **THEN** the response has X-RateLimit-Limit: 300 and X-RateLimit-Remaining: 298

### Requirement: Limit Exceeded Behaviour
When any limit is exceeded the API SHALL respond 429 Too Many Requests with a Retry-After header in seconds and a JSON body {"error": "rate_limited"}.

#### Scenario: Retry-After is returned
- **WHEN** a client exceeds its per-hour limit 600 seconds before the window resets
- **THEN** the 429 response has Retry-After: 600

### Requirement: Burst Handling
The API SHALL absorb bursts with a token bucket of 20 tokens refilled at 20 tokens per second for authenticated clients.

#### Scenario: Burst within bucket size
- **WHEN** an authenticated client sends 20 requests within 100 ms after being idle for 1 second
- **THEN** all 20 requests succeed

#### Scenario: Burst beyond bucket size
- **WHEN** the same client sends a 21st request in that 100 ms
- **THEN** the API responds 429 Too Many Requests
