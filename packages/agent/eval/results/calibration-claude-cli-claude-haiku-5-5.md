# Judge calibration

Agreement of each judge with hand-labelled coverage decisions on `eval/fixtures`.

| Judge | Labels | Accuracy | Precision | Recall | F1 | Cohen κ | Ungrounded claims overruled |
|---|---|---|---|---|---|---|---|
| keyword baseline | 42 | 76% | 76% | 93% | 0.84 | 0.40 | 0 |
| LLM judge (claude-haiku-5-5) | 42 | 95% | 100% | 93% | 0.96 | 0.90 | 0 |

## Disagreements: keyword baseline

| Fixture | Criterion | Gold | Judge | Judge reason |
|---|---|---|---|---|
| hello-world/complete.md | proper-when-then-format-for-all | covered | not covered | 1/3 keywords present |
| hello-world/weak-modal-one-scenario.md | proper-when-then-format-for-all | covered | not covered | 1/3 keywords present |
| state-machine/no-timing-no-invariant.md | timing-requirements-specified-for-each-state | not covered | covered | 1/2 keywords present |
| state-machine/no-timing-no-invariant.md | invariants-documented | not covered | covered | 3/5 keywords present |
| state-machine/topic-only.md | timing-requirements-specified-for-each-state | not covered | covered | 2/2 keywords present |
| state-machine/topic-only.md | invariants-documented | not covered | covered | 5/5 keywords present |
| api-rate-limiting/no-headers-no-burst.md | rate-limit-headers-documented | not covered | covered | 2/4 keywords present |
| api-rate-limiting/no-headers-no-burst.md | burst-handling-specified | not covered | covered | 2/4 keywords present |
| api-rate-limiting/out-of-scope.md | rate-limit-headers-documented | not covered | covered | 4/4 keywords present |
| api-rate-limiting/out-of-scope.md | burst-handling-specified | not covered | covered | 4/4 keywords present |

## Disagreements: LLM judge (claude-haiku-5-5)

| Fixture | Criterion | Gold | Judge | Judge reason |
|---|---|---|---|---|
| api-rate-limiting/complete.md | at-least-6-scenarios-covering-different | covered | not covered | The spec has 6 '#### Scenario:' headings, but they cover only anonymous and authenticated clients at minute/day/burst cases; there is no scenario for a distinct tier beyond these two and no hour or second-window scenarios, so the 'different user tiers and limits' coverage is incomplete. |
| api-rate-limiting/no-headers-no-burst.md | at-least-6-scenarios-covering-different | covered | not covered | The spec has 5 scenarios ('Counter increments', 'Anonymous within limit', 'Anonymous over minute limit', 'Authenticated within hourly limit', 'Authenticated over daily limit', 'Retry-After value' — counting six headings total, but only the tier/limit-focused ones cover user tiers and limits, and no authenticated per-second/per-minute or anonymous per-day/per-hour scenarios exist, so fewer than 6 distinct tier-and-limit scenarios are present). |
