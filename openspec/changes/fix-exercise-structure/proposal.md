## Why

The current exercise structure is conceptually confusing. The `hello-world` exercise asks users to write specifications in `spec.md`, but doesn't align with the actual OpenSpec workflow where specs live in `openspec/changes/`. This creates a disconnect between the learning exercises and real-world usage.

## What Changes

- **Restructure exercises** to use `openspec/changes/` pattern for specification writing
- **Add `openspec init`** command to scaffold new exercises within the OpenSpec framework
- **Update exercise READMEs** to reference `openspec/changes/<name>/` as the workspace
- **Create exercise completion flow** that validates specs using `openspec status` and `openspec validate`
- **Remove standalone `spec.md` files** - exercises use proper OpenSpec change workflow
- **Update CLI** to use `openspec` commands instead of custom validation

## Capabilities

### New Capabilities

- `exercise-init`: Initialize a new exercise as an OpenSpec change with proper scaffolding
- `exercise-validate`: Validate exercise specs using OpenSpec CLI instead of custom engine
- `exercise-submit`: Submit exercise completion by marking change as complete
- `openspec-integration`: Full integration with OpenSpec CLI for all spec operations

### Modified Capabilities

- None (this is restructuring existing exercises)

## Impact

- All exercise READMEs need updating
- CLI validation logic replaced with OpenSpec calls
- Exercise folder structure changes (adds `openspec/` subdirectory)
- User workflow changes from `sdd test` to `openspec validate`
- Breaking change for existing downloaded exercises
