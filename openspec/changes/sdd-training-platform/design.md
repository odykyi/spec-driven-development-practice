## Context

This is a greenfield project to build an Exercism-style training platform focused on Spec-Driven Development (SDD). The platform will teach developers how to write effective specifications and prompts for AI-assisted development.

**Current State:**
- No existing codebase or infrastructure
- Exercism.io provides a proven model for progressive coding practice
- SDD is an emerging discipline without dedicated training tools
- Target audience: developers learning to work with AI agents

**Constraints:**
- Must support both web and CLI interfaces
- Exercises must be validated programmatically
- Progress must be persisted across sessions
- Must support community features (mentoring, discussions)

## Goals / Non-Goals

**Goals:**
- Build a progressive learning system with difficulty tiers
- Create an exercise validation engine that checks spec quality
- Support multiple learning tracks (basics, patterns, advanced)
- Provide immediate feedback on exercise submissions
- Enable community contributions of new exercises
- Track user progress and skill development over time

**Non-Goals:**
- Real-time collaboration (not pair programming)
- Video content or multimedia lessons
- Certification or accreditation
- Enterprise team management features (initially)
- Mobile native apps (web responsive is sufficient)

## Decisions

**1. Monorepo Architecture**
- **Decision:** Use a single repository for CLI, web, and exercise definitions
- **Rationale:** Simpler versioning, exercises and validators stay in sync
- **Alternative considered:** Separate repos - rejected due to coordination overhead

**2. Exercise Format: Markdown + YAML Frontmatter**
- **Decision:** Each exercise is a directory with README.md (instructions) and .meta/config.yml (validation rules)
- **Rationale:** Git-friendly, human-readable, easy to author
- **Alternative considered:** JSON files - rejected due to poor readability for long-form content

**3. Validation Engine: AST-Based Analysis**
- **Decision:** Parse specifications into AST and check structural requirements
- **Rationale:** Can verify presence of sections, scenario formats, requirement completeness
- **Alternative considered:** Regex matching - rejected as too brittle for nested structures

**4. Progress Storage: SQLite (local) + Optional Sync**
- **Decision:** Local SQLite for CLI, optional cloud sync for web
- **Rationale:** Works offline, no server required for CLI users
- **Alternative considered:** PostgreSQL only - rejected due to CLI complexity

**5. Web Framework: Next.js + TypeScript**
- **Decision:** Next.js App Router with API routes for backend
- **Rationale:** Unified stack, SSR for SEO, familiar to target audience
- **Alternative considered:** Separate backend - rejected for simpler deployment

**6. Authentication: GitHub OAuth Primary**
- **Decision:** GitHub OAuth as primary auth, with email fallback
- **Rationale:** Target audience already has GitHub accounts
- **Alternative considered:** Custom auth - rejected as unnecessary complexity

## Risks / Trade-offs

**Risk: Exercise quality inconsistency**  
Community-contributed exercises may vary in quality or validation accuracy.
→ **Mitigation:** Require exercise templates, automated checks on PRs, maintainer review

**Risk: Validation engine brittleness**  
Parsing specs may break with unconventional formatting.
→ **Mitigation:** Start with strict format requirements, provide clear error messages, allow validator overrides

**Risk: Platform adoption**  
New platform with no existing community.
→ **Mitigation:** Seed with high-quality exercises, integrate with SDD documentation, leverage existing communities

**Risk: AI validation accuracy**  
Automated spec quality assessment may miss nuanced issues.
→ **Mitigation:** Human-in-the-loop mentoring, confidence scores, clear validation criteria

**Trade-off: Scope vs. Time to Market**
Balancing feature completeness (mentoring, tracks, achievements) vs. launching MVP.
→ **Resolution:** Ship with core track + 10 exercises first, iterate based on feedback

**Trade-off: Flexibility vs. Structure**
Allowing creative spec formats vs. enforcing consistent structure for validation.
→ **Resolution:** Enforce structure in early tracks, allow flexibility in advanced tracks

## Migration Plan

N/A - This is a greenfield project with no existing users or data to migrate.

## Open Questions

1. Should we integrate with existing AI coding tools (Claude, GitHub Copilot) for validation?
2. What's the pricing model? Free + premium tracks? Completely free?
3. Do we need exercise translations for non-English speakers?
4. Should solutions be public (learning from others) or private by default?
5. How do we handle exercise versioning when specs are updated?
