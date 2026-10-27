# Spec-authoring agent eval

- **Date**: 2026-10-27T15:05:56.632Z
- **Provider**: claude-cli
- **Author model**: claude-haiku-5-5
- **Judge model**: claude-haiku-5-5
- **Max iterations**: 3
- **Trials per exercise**: 1

## Overall

| Metric | Value |
|---|---|
| Runs | 10 |
| First draft passes validator (zero-shot) | 100% |
| First draft accepted (validator + lint + judge) | 30% |
| Accepted after revision loop | 90% |
| Mean iterations | 2.00 |
| Judge coverage, first draft → final | 93% → 97% |
| Mean lint score (final) | 99.0 |
| Tokens in / out | 294132 / 329158 |
| Cost (USD, as reported by provider) | 11.097 |
| Mean latency per run | 142.7 s |

## Per exercise

| Exercise | Trials | First draft valid | Accepted | pass@1 | Iterations | Coverage | Lint | Scenarios |
|---|---|---|---|---|---|---|---|---|
| advanced/database-migration | 1 | 100% | 100% | 1.00 | 2.0 | 100% | 100 | 32.0 |
| advanced/ecommerce-checkout | 1 | 100% | 0% | 0.00 | 3.0 | 67% | 90 | 25.0 |
| basics/hello-world | 1 | 100% | 100% | 1.00 | 1.0 | 100% | 100 | 2.0 |
| basics/install-openspec | 1 | 100% | 100% | 1.00 | 3.0 | 100% | 100 | 7.0 |
| basics/user-story | 1 | 100% | 100% | 1.00 | 1.0 | 100% | 100 | 8.0 |
| patterns/api-rate-limiting | 1 | 100% | 100% | 1.00 | 2.0 | 100% | 100 | 20.0 |
| patterns/file-upload | 1 | 100% | 100% | 1.00 | 3.0 | 100% | 100 | 28.0 |
| patterns/notification-system | 1 | 100% | 100% | 1.00 | 1.0 | 100% | 100 | 28.0 |
| patterns/state-machine | 1 | 100% | 100% | 1.00 | 2.0 | 100% | 100 | 29.0 |
| patterns/user-authentication | 1 | 100% | 100% | 1.00 | 2.0 | 100% | 100 | 50.0 |
