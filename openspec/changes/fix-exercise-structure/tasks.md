## 1. Add OpenSpec Dependency

- [x] 1.1 Add `@openspec/cli` as dependency to CLI package
- [x] 1.2 Update install script to check for OpenSpec CLI
- [x] 1.3 Add OpenSpec CLI installation to setup instructions

## 2. Create Exercise Init Command

- [x] 2.1 Implement `sdd init-exercise <name>` command
- [x] 2.2 Map exercise IDs to change names (e.g., `basics/hello-world` → `basics-hello-world`)
- [x] 2.3 Copy exercise README content to `proposal.md`
- [x] 2.4 Copy exercise hints to `design.md`
- [x] 2.5 Create starter `specs/spec.md` with exercise requirements
- [x] 2.6 Create `tasks.md` from exercise DoD checklist

## 3. Update Validation Command

- [x] 3.1 Replace custom validation with `openspec validate` call
- [x] 3.2 Parse and display OpenSpec validation output
- [x] 3.3 Handle OpenSpec CLI not installed error
- [ ] 3.4 Remove or deprecate custom ValidationEngine

## 4. Update Submit Command

- [x] 4.1 Check change status via `openspec status` before allowing submit
- [x] 4.2 Display missing artifacts if incomplete
- [x] 4.3 Mark exercise complete in local database on success

## 5. Update Exercise READMEs

- [x] 5.1 Update all 10 exercise READMEs to reference `openspec/changes/`
- [x] 5.2 Add "Where to Write" section pointing to change directory
- [x] 5.3 Update DoD to reference OpenSpec artifacts (proposal, design, specs, tasks)
- [x] 5.4 Remove references to standalone `spec.md` file
- [x] 5.5 Update example commands to use `openspec` CLI

## 6. Update List Command

- [ ] 6.1 Show OpenSpec initialization status for each exercise
- [ ] 6.2 Display completion status from `openspec status`
- [ ] 6.3 Show which exercises need `init-exercise` run first

## 7. Update Main README

- [x] 7.1 Update installation instructions for OpenSpec CLI
- [x] 7.2 Update CLI usage examples to show OpenSpec workflow
- [x] 7.3 Add section explaining relationship between `sdd` and `openspec`
- [x] 7.4 Update demo screenshots to show OpenSpec commands

## 8. Testing & Migration

- [ ] 8.1 Test `init-exercise` for all 10 exercises
- [ ] 8.2 Test validation with OpenSpec CLI
- [ ] 8.3 Test submit flow
- [ ] 8.4 Create migration guide for existing users
- [ ] 8.5 Update integration tests
