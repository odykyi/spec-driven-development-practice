# @sdd-training/agent

An LLM agent that writes OpenSpec specifications for the platform's exercises, a rubric judge
that grades them, and an eval harness that measures both.

The platform teaches people to write specs that AI coding agents can implement. This package
asks the reverse question: **how well does a model write those specs, and how much does
tool feedback help?** It uses the platform's own validator as a tool, so every number below
comes from the same checks a learner's submission goes through.

## How it works

```
                 ┌──────────────────────── revision feedback ────────────────────────┐
                 ▼                                                                    │
 exercise ──► author LLM ──► spec.md ──► SpecParser + ValidationEngine (structure) ───┤
 README +                               lintSpec (testability, near-miss clauses) ────┤
 config                                 LLM judge (Definition-of-Done coverage) ──────┘
                                                    │
                                        accepted when validator passes, lint has no
                                        errors, and judge coverage ≥ threshold
```

1. **Rubric extraction** (`src/exercise/checklist.ts`): each exercise's *Definition of Done* is
   parsed into criteria with stable ids. Process steps ("run `openspec validate`") are dropped;
   "At least N scenarios" becomes a count rule.
2. **Author loop** (`src/agent/spec-author.ts`): the model drafts a spec; three tools observe it;
   their findings become the next user turn. The loop stops when the spec is accepted, after
   `maxIterations`, or when a token budget is spent. The judge runs only once the validator
   passes: an unparseable spec has nothing for it to cite.
3. **Linter** (`src/spec/lint.ts`): deterministic checks the validator does not make: clause
   lines the parser silently ignores (`- When ...`, `- **When**`), THEN clauses that cannot be
   asserted ("handled appropriately"), weak modal verbs, duplicate triggers.
4. **Grounded judge** (`src/agent/judge.ts`): an LLM decides, per criterion, whether the spec
   covers it, and must quote the spec as evidence. Quotes are checked against the spec text; a
   coverage claim with an invented quote is **overruled**. Unparseable replies score zero rather
   than crashing a run.
5. **Eval harness** (`src/eval/`): runs the agent over every exercise × trials with a worker pool
   and reports zero-shot validity, accepted rate, unbiased pass@k, iterations, coverage, lint
   score, tokens, cost and latency. **Judge calibration** scores the judge against hand-labelled
   specs in `eval/fixtures/` (accuracy, precision, recall, F1, Cohen's κ) next to a keyword
   baseline.

The calibration fixtures include adversarial specs that *name* a criterion only to defer it
("Invariants ... are out of scope", "Timing ... TBD"). A keyword matcher credits those; a
judge worth using must not.

## Providers

All model access goes through one `LLMClient` interface (`src/llm/`), with retries and
`retry-after` handling for rate limits:

| Provider | Flag | Needs |
|---|---|---|
| Claude Code CLI | `--provider claude-cli` (default) | a signed-in `claude` binary; no API key |
| Anthropic Messages API | `--provider anthropic` | `ANTHROPIC_API_KEY` |
| OpenAI-compatible (Ollama, vLLM, LM Studio, OpenAI) | `--provider openai-compatible --base-url ...` | a running server; `OPENAI_API_KEY` if required |

Tests use `ScriptedClient`, so `pnpm test` is deterministic and makes no network calls.

## Usage

```bash
pnpm install
pnpm --filter @sdd-training/core --filter @sdd-training/agent build

# One exercise, printing each iteration's validator / lint / coverage result
node packages/agent/dist/cli.js solve patterns/state-machine

# Grade or lint your own spec
node packages/agent/dist/cli.js judge my-spec.md --exercise patterns/state-machine
node packages/agent/dist/cli.js lint my-spec.md

# Full eval and judge calibration; reports land in packages/agent/eval/results/
pnpm eval -- --trials 3 --concurrency 3
pnpm calibrate

# Open-weight model through Ollama
node packages/agent/dist/cli.js eval --provider openai-compatible --model qwen3:8b
```

## Results

### Agent eval

All 10 exercises, 1 trial each, up to 3 iterations. Claude Haiku 5.5 was both author and judge,
through the Claude CLI on 2026-10-27
([full report](./eval/results/2026-10-27-claude-cli-claude-haiku-5-5.md),
[raw runs](./eval/results/2026-10-27-claude-cli-claude-haiku-5-5.json)):

| Metric | First draft (zero-shot) | After revision loop |
|---|---|---|
| Passes the platform validator | 100% | 100% |
| Accepted (validator + lint + judge) | 30% | 90% |
| Judge coverage of Definition of Done | 93% | 97% |
| Mean iterations | 1 | 2.0 |

- Every first draft passed the structural validator, so the validator alone cannot tell good
  specs from weak ones. The extra tools are what drove revisions: 7 of 10 first drafts had
  lint errors, and 3 had uncovered criteria.
- All 25 first-draft lint errors were `duplicate-scenario`: scenarios with identical WHEN
  clauses. Some of these pairs differed only in GIVEN/AND lines, which the core parser does
  not read. So the rule pushes the distinguishing condition into WHEN, where tests and the
  validator can see it. It is strict, not always wrong, and worth relaxing once the parser
  reads GIVEN.
- The one failure is `advanced/ecommerce-checkout` (20-step flow, 25 scenarios). Its second
  draft broke the validator. Its third reached 67% coverage, still missing several of the 20
  steps, and the judge left one criterion unanswered. Long exercises need a higher judge token
  limit or per-section judging.
- The run used 294k input and 329k output tokens, about 143 s per exercise. The Claude CLI
  reported a list-price cost of $11.10.

### Judge calibration

42 hand-labelled coverage decisions across 9 specs (`eval/fixtures/labels.json`), judged by
Claude Haiku 5.5 through the Claude CLI on 2026-10-27
([full report](./eval/results/calibration-claude-cli-claude-haiku-5-5.md)):

| Judge | Accuracy | Precision | Recall | F1 | Cohen κ |
|---|---|---|---|---|---|
| Keyword baseline | 76% | 76% | 93% | 0.84 | 0.40 |
| LLM judge (Haiku 5.5) | 95% | 100% | 93% | 0.96 | 0.90 |

Of the baseline's 10 errors, 8 are false positives on the adversarial fixtures: it credits
headers, burst handling, timing and invariants that the spec only names or explicitly puts out
of scope. The LLM judge had no false positives. Its two misses are both "At least 6 scenarios"
criteria, where it miscounted scenario headings. That points to an obvious next step: decide
count rules deterministically (as `KeywordJudge` already does) and leave only coverage of the
listed cases to the model.

## Layout

```
src/
  llm/        provider clients, retry, scripted test client
  exercise/   Definition-of-Done → checklist
  spec/       spec extraction from replies, linter
  agent/      author loop, prompts, revision feedback, grounded judge, keyword baseline
  eval/       runner, metrics (pass@k), calibration (κ), markdown reports
  cli.ts      sdd-agent solve | judge | lint | eval | calibrate
eval/
  fixtures/   hand-labelled specs + labels.json
  results/    committed eval and calibration reports
```
