# API Rate Limiting

## ADDED Requirements

### Requirement: Request Counting
The API SHALL count requests in fixed windows keyed by API key, or by client IP for anonymous callers.

#### Scenario: Counter increments
- **WHEN** an anonymous client sends a request
- **THEN** the counter for its IP in each window increases by 1

### Requirement: Windows and Tiers
The API SHALL apply limits per second, per minute, per hour and per day: anonymous 1/sec, 30/min, 500/hour, 2000/day; authenticated 10/sec, 300/min, 5000/hour, 50000/day.

#### Scenario: Anonymous within limit
- **WHEN** an anonymous client sends 30 requests in one minute
- **THEN** all 30 succeed with status 200

#### Scenario: Anonymous over minute limit
- **WHEN** an anonymous client sends a 31st request in the same minute
- **THEN** the API responds 429 Too Many Requests

#### Scenario: Authenticated within hourly limit
- **WHEN** an authenticated client sends its 5000th request in one hour
- **THEN** the request succeeds with status 200

#### Scenario: Authenticated over daily limit
- **WHEN** an authenticated client sends request number 50001 in one day
- **THEN** the API responds 429 Too Many Requests

### Requirement: Limit Exceeded
The API SHALL respond 429 Too Many Requests with a Retry-After header when a limit is exceeded.

#### Scenario: Retry-After value
- **WHEN** a client exceeds its per-minute limit 20 seconds before the window ends
- **THEN** the 429 response has Retry-After: 20
