## Context

The current SDD training platform has exercises that ask users to write specifications in a standalone `spec.md` file. However, the platform itself uses OpenSpec for its own specification management (in `openspec/changes/`). This creates conceptual confusion:

1. Users learn to write specs in `spec.md` during exercises
2. But real OpenSpec workflow requires `openspec/changes/<name>/` structure
3. The validation is custom-built instead of using OpenSpec CLI
4. There's no connection between exercise completion and actual spec workflow

## Goals / Non-Goals

**Goals:**
- Align exercise workflow with real OpenSpec workflow
- Use `openspec/changes/` directory structure for all exercise specs
- Replace custom validation with OpenSpec CLI validation
- Create clear path from exercise → understanding OpenSpec
- Maintain offline-first capability

**Non-Goals:**
- Change the exercise content/requirements
- Add server-side features
- Change the track/exercise organization
- Support online/sync features

## Decisions

**1. Exercise Structure: OpenSpec Change Format**
- **Decision:** Each exercise becomes an OpenSpec change in `openspec/changes/`
- **Rationale:** Teaches actual OpenSpec workflow from day one
- **Alternative:** Keep separate formats - rejected as confusing

**2. Validation: Use OpenSpec CLI**
- **Decision:** Replace custom `ValidationEngine` with `openspec validate` command
- **Rationale:** Consistent with how specs are validated in real projects
- **Alternative:** Keep custom validation - rejected as divergent

**3. Exercise Init Command**
- **Decision:** Create `sdd init-exercise <name>` that runs `openspec new change`
- **Rationale:** Users need to learn the OpenSpec init workflow
- **Alternative:** Manual setup - rejected as poor UX

**4. Spec Location**
- **Decision:** Exercise specs go in `openspec/changes/<exercise-name>/`
- **Rationale:** Matches OpenSpec conventions
- **Structure:**
  ```
  openspec/changes/hello-world/
  ├── .openspec.yaml
  ├── proposal.md (exercise description)
  ├── design.md (solution approach)
  ├── specs/spec.md (actual spec)
  └── tasks.md (checklist)
  ```

**5. Completion Check**
- **Decision:** Exercise completion = change status shows "complete"
- **Rationale:** Natural OpenSpec workflow - apply when done
- **Implementation:** Check `openspec status --change <name>`

## Risks / Trade-offs

**Risk: Breaking existing downloads**
Users who downloaded exercises already will have old structure.
→ **Mitigation:** Clear migration guide, version bump, or force re-download

**Risk: Complexity increase**
OpenSpec structure is more complex than simple `spec.md`.
→ **Mitigation:** Starter templates, clear README updates, progressive disclosure

**Risk: Requires OpenSpec CLI installed**
Currently exercises work without it.
→ **Mitigation:** Make OpenSpec CLI dependency, include in install script

## Migration Plan

1. Update exercise READMEs to describe OpenSpec workflow
2. Add `openspec init` to install script
3. Create migration command for existing users
4. Update CLI to use OpenSpec commands
5. Remove custom validation engine (or keep as fallback)

## Open Questions

1. Should we keep custom validation as fallback if OpenSpec CLI not installed?
2. Do we auto-generate proposal/design/tasks from exercise config?
3. Should exercises have both simple and full OpenSpec modes?
