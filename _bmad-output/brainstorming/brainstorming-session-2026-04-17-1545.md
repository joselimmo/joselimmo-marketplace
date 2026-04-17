---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'Design of a custom Claude Code plugin providing a full-lifecycle development workflow (skills, agents, commands, rules) with integrated long-term memory management'
session_goals: 'Identify the components (skills/agents/commands/rules/hooks) to include, define their orchestration, explore long-term memory strategies (project memory, rules, context), and distinguish MVP scope from long-term vision. Plugin must stay token-efficient (explicit anti-BMAD), polyvalent across stacks (monorepo, single-project, Java, TS, Angular, Vue), and draw inspiration from the AIDD framework.'
selected_approach: 'ai-recommended'
techniques_used: ['First Principles Thinking', 'SCAMPER Method', 'Resource Constraints']
ideas_generated: 45
workflow_completed: true
session_active: false
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** Cyril
**Date:** 2026-04-17

## Session Overview

**Topic:** Design of a custom Claude Code plugin providing a full-lifecycle development workflow (skills, agents, commands, rules) with integrated long-term memory management.

**Goals:**
- Identify the components (skills, agents, commands, rules, hooks) to include.
- Define their orchestration across the development cycle (ideation → specs → implementation → review → maintenance).
- Explore long-term memory strategies: project memory, project-specific rules, context loading patterns.
- Distinguish MVP scope from long-term vision.

### Session Setup

**Target users:** personal-first usage, but published on a public marketplace → content must stay generic and clean.

**Target stacks (polyvalence required):** monorepo, single-project, Java, TypeScript, Angular, Vue — no lock-in to one language/framework.

**Design constraints / inspirations:**
- ❌ **Anti-pattern — BMAD:** too verbose, too token-expensive. Avoid heavy multi-file orchestration and redundant agent chatter.
- ✅ **Inspiration — AIDD framework** (already present in `.claude/` + `aidd_docs/` of this repo): lightweight, project-memory-first approach.

**Long-term memory scope:** project memory + project-specific rules (AIDD-style). No cross-project memory at this stage.

## Technique Selection

**Approach:** AI-Recommended Techniques

**Analysis context:** Design of a token-efficient Claude Code plugin requires a three-phase ideation sequence — strip assumptions, generate methodically, then stress-test under extreme constraints.

**Recommended sequence:**

- **Phase 1 — First Principles Thinking (creative, ~15-20 min):** Deconstruct what is irreducibly necessary in an AI-assisted dev lifecycle, before any component is enumerated. Primary weapon against BMAD-style over-engineering.
- **Phase 2 — SCAMPER Method (structured, ~25-30 min):** Systematically traverse the seven lenses (Substitute, Combine, Adapt, Modify, Put to other uses, Eliminate, Reverse) across three axes: components, orchestration, and long-term memory strategies.
- **Phase 3 — Resource Constraints (structured, ~15-20 min):** Force MVP scoping by applying extreme limits (token budget, component count) to expose what is essential vs. aspirational.

**AI rationale:** The user's anti-BMAD stance and token-efficiency requirement make First Principles the only honest foundation. SCAMPER's "Eliminate" lens is a direct tool against feature-bloat. Resource Constraints closes the loop by forcing a defensible MVP.

---

## Technique Execution Results

### Phase 1 — First Principles Thinking

**Focus:** Deconstruct the dev lifecycle to its irreducible truths, ignoring any tooling tradition.

**Starting point:** User listed 10 linear activities (understand & challenge need → design target solution → decompose into stories → plan each → implement → tests → run → review → update docs → commit/PR).

**Breakthroughs from the dialogue:**

- Rework is confirmed essential (gap in the initial list).
- Ramp-up is not an activity but a capability — it is the READ side of long-term memory. `/resume` covers within-task continuity; long-term memory covers cross-session continuity.
- The deeper pattern: each activity is a **transformation** with (input artifacts, cognitive posture, output artifact). The truly irreducible layer is the **artifact chain + context handoffs**, not the activities themselves.
- "Commit + create PR" is not irreducible — it is one integration pattern among several. The primitive is *"integrate the change in a traceable way"*; plugin must stay agnostic about Git flow.
- Long-term memory growth is **not** a dedicated documentation phase — it is ambient, opportunistic, multi-channel.

**Fundamental principles extracted (v2, after challenges):**

1. **Workflow = chain of typed transformations**, not a list of activities.
2. **Each transformation = (typed input artifacts, cognitive posture, typed output artifact).**
3. **Two distinct memories:** ephemeral scratchpad (per-epic) + persistent long-term (per-project).
4. **Long-term memory grows through three ambient-capture channels** (transformation byproduct, on-demand `/remember`, v2+ post-edit reflection). Never a dedicated documentation step.
5. **Integration is the primitive, not the Git flow.** Plugin describes *what* (traceable change), not *how* (PR, trunk, patch-mail).
6. **Long-term memory is stratified in read**: always-loaded core (rules + conventions + overview) + boot-loaded index + lazy detailed content.

### Phase 2 — SCAMPER Method (all 7 lenses)

**Lens 1 — Substitute:** Explored replacements for canonical plugin primitives.

- ❌ *Rejected:* "Skills-only architecture" (no agents). User correctly argued that subagents provide context isolation — a token-efficiency win when used correctly, only BMAD-style agent dialogue must be eliminated.
- ✅ *Retained:* `Meta-Skill Orchestrator + Explicit Commands` — a single skill (`state-manager`) advises, explicit slash-commands execute. Determinism where it matters, heuristics where they help.
- ✅ *Retained:* `Optional Steps via Context Heuristics` — backend-only changes skip UX design; trivial diffs skip planning. Rules live in `.workflow.yaml`.
- ✅ *Retained:* `Artifact-Driven Chaining` — commands declare required input types / produced output types; no hard-coded sequence.
- ✅ *Retained:* `Index-First, Content-Lazy` memory loading.

**Lens 2 — Combine:** Fused redundant components.

- ✅ `State-Manager` (conductor + indexer fused) — reads state, proposes next, refreshes `INDEX.md` on every pass (read-your-writes).
- ✅ `BACKLOG = Actionable Dashboard` — the backlog is both view and action surface; looking at it is invoking the conductor.
- ✅ `Reflection = Review + Memory Capture (Deferred)` — memory capture only triggers after review cycle is `approved`. The learning value often emerges *through* the correction loop.
- ✅ `Discovery = Challenge + Decompose` — challenge-the-need and decompose-into-stories happen in the same dialogue.
- ✅ `Docs + Tests-as-Living-Docs (Coexistence)` — both channels live. BDD-style tests substitute functional docs only on codebases mature enough; plugin detects and proposes.

**Lens 3 — Adapt:** Transferred patterns from neighboring domains.

- 🏛️ **Unix Pipeline Philosophy** — *Principle #1* of the plugin. Transformations are small, typed, pure, composable.
- 🏛️ **Git's Porcelain vs Plumbing** — central architecture split. Slash-commands (porcelain) are user-facing; skills (plumbing) are composable primitives; porcelain composes plumbing.
- ✅ **`.workflow.yaml` Project Config** — inspired by `package.json scripts`. Project-level declarative override.
- ❌ *Rejected:* "Database Migrations for Memory" (Git already covers history).
- ❌ *Rejected:* "Make/Bazel artifact dependency graph" (too heavy given optional steps; Unix Pipeline already provides implicit typed composition).

**Lens 4 — Modify:** Dimensional manipulation.

- ❌ *Rejected:* "CLAUDE.md ≤ 20 lines hard cap" — too rigid. Replaced by the stronger **`Selective Memory Loading by Workflow Phase`** idea.
- ✅ **Selective Memory Loading by Workflow Phase** — 🏛️ Major principle. At session start: glossary + overviews + ADR summaries. In `/discover`: + product details. In `/plan-story`: + tech details + ADRs by tag. In `/implement`: + patterns + learnings by domain. Each command declares its `memory_scope` in frontmatter.
- ✅ `One Artifact Per Transformation, No Alternatives` — strict convention: one `.md` file with YAML frontmatter, always.
- ✅ `MAGNIFY — Backlog as Primary Interface` — 80% of sessions start and end on `/backlog`.
- ❌ *Rejected:* "Scratchpad as single file" (contradicts typed-artifacts principle).

**Lens 5 — Put to Other Uses:** Brief — validated two future-facing repurposes.

- ✅ `Workflow Plugin for Non-Code Projects` (v2+): the framework is domain-agnostic; alternate porcelain + `.workflow.yaml` could serve writing, research, course design.
- ✅ `Memory → Readable HTML Documentation` (v2+): `/export-docs` generates a static site (e.g., using `visual-explainer` or similar). Target: stakeholders + onboarding.

**Lens 6 — Eliminate (anti-BMAD weapon):** Deep pruning.

- ⚠️ **Reframed, not eliminated:** Subagents (Claude Code native) are **kept** as context-isolation primitives — never as personas. Uses: `explore-codebase`, `research-web`, `adversarial-review`. Never dialogue between personas.
- ✅ `NO EPIC-PRD / NO FORMAL SPECS` — an epic is a short YAML-fronted `.md` file, plus an **Emergent Context** free section to preserve info that falls outside the schema.
- ✅ `Emergent Context Channel` — every workflow artifact can carry a `## Emergent Context` section that downstream transformations must read. Closes the info-loss-between-phases gap.
- ✅ `Bootstrap Command /init-project` — for brownfield projects, a one-shot subagent-powered codebase scan seeds `memory/project/` with detected stack, glossary, conventions.
- ✅ `NO SEPARATE "DOCUMENTATION" STEP` — capture is ambient, never a standalone phase.
- ✅ `NO STATUS / PROGRESS COMMANDS` — `/backlog` is the single source of truth.
- ✅ `Roleplay Is Skill-Local, Not Framework-Structural` — each skill chooses empirically; no dogma.
- ✅ `Plumbing Skills Can Ask — If Output Absorbs Everything` — revised rule. Plumbing skills *may* interact, but all information gathered must land in the output artifact (conservation invariant).

**Lens 7 — Reverse:** Flipping remaining assumptions.

- ✅ `Memory Is Read First, Written Last` — every transformation begins with a scoped memory read, ends with a memory write. Never read-write-read within one transformation.
- 🏛️ **Precondition-Driven, Self-Explaining Orchestration** — consolidation of two Reverse ideas. Each porcelain command declares `requires: [...]`, `produces: type`, `memory_scope: [...]` in its frontmatter. The state-manager introspects → emits the list of runnable commands → `/explain` (v2+) exposes it to the user. No sequence imposed.

### Phase 3 — Resource Constraints

**Constraint applied:** 7 calendar days, solo, must be self-usable on a real project by end of week.

**Key realization from AIDD inventory:** the AIDD framework (present in this repo as `aidd_docs/`) ships ADR templates, memory scaffolding conventions, a 3-tier flow concept, a 4-command loop pattern, and a brownfield "Phase 2 — Configure Your Project" routine. All are reusable, shifting several ambitious items into MVP reach.

**Story-scoped context budget (new principle #9):** The token budget is evaluated per story cycle (plan → implement → reflect), never per session. A single large need splits across multiple stories across multiple sessions, glued only by the long-term memory. `/discover` has an obligation to decompose until each story fits in roughly 15-25k tokens total.

**Token targets:**

| Operation | Target |
|---|---|
| `SessionStart` lean boot | ≤ 500 tokens (hard) |
| First command call | 1.5-3k tokens (soft) |
| Full story cycle | 15-25k tokens (indicative; overflow = decomposition failure) |

**Memory naming finalized:**

- `memory/project/` — curated, permanent knowledge. Glossary, overviews, ADRs, conventions, learnings.
- `memory/backlog/` — ephemeral workflow artifacts. `ACTIVE.md`, `BACKLOG.md`, per-epic folders with epic + story + plan + review files.

**Design rejected during Phase 3:**

- ❌ `/consolidate-memory` command + `draft` status (YAGNI). Each capture channel already has a quality filter at write time; adding consolidation ritual duplicates it. The frontmatter `status` field remains in the schema for future use, but no command mobilizes it in MVP.

---

## Idea Organization and Prioritization

### Thematic Organization

**Theme 1 — Architectural Principles (9 pillars)**

1. **Unix Pipeline Philosophy** 🏛️ — transformations are small, typed, pure, composable.
2. **Artifact = Typed File, Skill = Pure Function** 🏛️ — type-theoretic formalization.
3. **Porcelain vs Plumbing** 🏛️ — two-layer architecture. Commands compose skills.
4. **Precondition-Driven, Self-Explaining Orchestration** 🏛️ — declarative gates, no sequence.
5. **Two-Tier Memory** 🏛️ — `memory/project/` curated + `memory/backlog/` ephemeral.
6. **Selective Memory Loading by Workflow Phase** 🏛️ — per-command `memory_scope`.
7. **Ambient Capture (3 channels)** 🏛️ — byproduct + on-demand + v2+ post-edit.
8. **Epic-Level Isolation** 🏛️ — no cross-epic dependencies by design.
9. **Story-Scoped Context Budget** 🏛️ — per-story, not per-session.

**Theme 2 — MVP Components**

_Commands (porcelain, user-facing):_

- `/init-project` — brownfield bootstrap; scans code via `explore-codebase` subagent, generates initial `memory/project/*` files.
- `/backlog` — primary UX surface; view + action in one.
- `/discover` — challenge + decompose into stories; produces epic fiche + emergent context.
- `/plan-story` — technical plan aligned on active ADRs.
- `/implement` — code + tests (TDD-aware on mature codebases).
- `/reflect` — review loop (iterative) + deferred memory capture at approval.
- `/switch-epic` — clean context switch across parallel epics.
- `/abandon-epic` — hard deletion of the epic workspace.

_Skills (plumbing, composable):_

- `state-manager` — state read + command recommendation + INDEX refresh.
- `load-memory-scope` — reads memory files matching requested scopes/tags.
- `validate-artifact-frontmatter` — schema check on all typed artifacts.
- `extract-diff-patterns` — used by `/reflect` to mine learnings.
- `explore-codebase` — subagent for brownfield scanning and large-context exploration.
- `detect-domain-from-paths` — path-based domain tagging using `.workflow.yaml` domain-map.

_Config & infra:_

- `.workflow.yaml` (project-level) — domain-map, skip-heuristics, overrides.
- `SessionStart` hook — configurable lean boot (`always` / `new-session-only` / `manual` / `interactive`).
- `memory/` directory structure with typed frontmatter (`type`, `title`, `tags`, `status`, `superseded_by`, etc.).

**Theme 3 — Memory System**

- Two-folder split: `memory/project/` (permanent) + `memory/backlog/` (ephemeral).
- Auto-maintained `memory/project/INDEX.md` listing all entries by tag + summary.
- Capture channels: deferred byproduct of `/reflect`, explicit `/remember` (lightweight, user-invoked), v2+ post-edit reflection.
- Tag-based selective loading, path-based domain auto-detection (MVP minimal).
- Integrity: all memory files follow a strict frontmatter schema; `validate-artifact-frontmatter` guards.

**Theme 4 — Orchestration & UX**

- `BACKLOG.md` as live dashboard — the entry point.
- Multi-epic parallel workspaces under `memory/backlog/epic-XXX/`.
- No cross-epic dependencies (architectural rule).
- No-archive policy — epics are finished or abandoned.
- `ACTIVE.md` pointer indicates which epic + story is in focus.
- Optional steps via context heuristics (backend-only skips UX design, trivial diffs skip plan).

**Theme 5 — Rejected / Out-of-Scope (explicit non-decisions)**

- ❌ Agent personas with dialogue (BMAD anti-pattern).
- ❌ Formal PRDs / long specs.
- ❌ Dedicated "update documentation" step.
- ❌ `/status` / `/progress` / `/report` commands.
- ❌ Make/Bazel dependency graph.
- ❌ Database-migration-style memory versioning (Git covers it).
- ❌ Scratchpad as single flat file.
- ❌ Draft-and-consolidate memory ritual (YAGNI; filter at write time instead).

### MVP vs v2+ Scope

**MVP (target: 7 days solo):**

- All 9 architectural principles.
- 8 porcelain commands listed above.
- 6 plumbing skills listed above.
- `.workflow.yaml` project config.
- `SessionStart` lean boot hook.
- Path-based domain auto-detection (MVP version).
- `memory/project/` + `memory/backlog/` structure.
- Auto-maintained `INDEX.md`.
- Two of three capture channels: byproduct-of-`/reflect` + on-demand `/remember`.

**v2+ Backlog:**

- `/rework-epic` (diff-based story refresh against current codebase).
- `/export-docs` — HTML doc generation (e.g., `visual-explainer`).
- `/explain` rich self-description beyond `/backlog`.
- Post-edit reflection skill (third capture channel, proactive on manual diffs).
- Workflow style learning (observation + adaptation).
- `/clear` heuristic detection (v2 — no native hook).
- Domain auto-detection via embeddings (beyond path-based MVP).
- Non-code repurpose (writing, research, course design).
- `/consolidate-memory` + active `draft` status (only if capture noise becomes a real problem in 3-6 months of use).

### Open Decisions Before Implementation

These must be settled in the first hours of implementation:

1. **Exact artifact type taxonomy** — final list of `type:` values in frontmatter. Current set: `adr | convention | learning | glossary | overview | epic | story | plan | review | rule`. Adjust before writing the schema validator.
2. **Memory file naming convention** — kebab-case vs snake_case, date prefix on ADRs, `NNN-` numeric prefix for ordered lists (ADRs yes?), etc.
3. **Epic / story ID scheme** — `epic-001`, `epic-auth-refactor`, `2026-04-17-auth-refactor`? Impacts the `memory/backlog/` tree.
4. **`memory_scope` vocabulary** — fixed enum of scope names, or free-form tags? Recommend: fixed MVP enum (`glossary`, `overviews`, `adr-summaries`, `adrs-by-tag`, `conventions`, `learnings-by-tag`), extensible later.
5. **Exact lean-boot output shape** — format of the 3-line summary. Recommend a fixed template: `"Epic: <id> / Story: <id>:<status> / Next: <suggested-command>"`.
6. **Concrete content of `.workflow.yaml`** — MVP keys: `domain-map`, `skip-heuristics`, `lean-boot-mode`. Document schema early.
7. **Subagent output contract** — how `explore-codebase` / `research-web` return structured artifacts vs free prose. Recommend: subagents produce a typed artifact file the caller reads, not conversational returns.
8. **Plugin repo vs consumer repo separation** — this plugin lives in `joselimmo-marketplace/plugins/<name>/`; installed users get it via `/plugin install`. `.workflow.yaml` lives in the consumer repo.

---

## Action Plan — Indicative 7-Day Roadmap

> All days include running the plugin against a real side-project by end of day 7 as the acceptance test.

**Day 1 — Foundations + Plugin Skeleton**

- Create `plugins/workflow-<name>/.claude-plugin/plugin.json` and register in `.claude-plugin/marketplace.json`.
- Define the frontmatter schemas for all artifact types (open decision #1 settled here).
- Write `validate-artifact-frontmatter` plumbing skill (+ fixture files for each type).
- Seed the plugin README with principles and architecture overview.

**Day 2 — Memory System Core**

- Implement `memory/project/` + `memory/backlog/` scaffolding generator (part of `/init-project`).
- Implement the `state-manager` skill: reads `ACTIVE.md` + `INDEX.md`, proposes next command.
- Implement the `INDEX.md` auto-generation inside `state-manager` (read-your-writes pattern).
- Implement `load-memory-scope` plumbing skill.

**Day 3 — Brownfield Bootstrap**

- Implement `explore-codebase` subagent.
- Implement `/init-project` porcelain: wires `explore-codebase` → generates skeleton `memory/project/*` files (glossary, tech-overview, product-overview seeds).
- Test on two real brownfield projects (Angular and Java if available, for polyvalence check).

**Day 4 — Discovery & Planning Commands**

- Implement `/discover` (challenge + decompose + emergent-context section).
- Implement `/plan-story` with `memory_scope` declaration.
- Wire up precondition checks in `state-manager`.

**Day 5 — Implement & Reflect**

- Implement `/implement` porcelain.
- Implement `/reflect` with iterative review loop and deferred memory capture at approval.
- Implement `/remember` (lightweight on-demand capture).

**Day 6 — Multi-Epic & Config**

- Implement `/backlog` actionable dashboard.
- Implement `/switch-epic` + `/abandon-epic`.
- Implement `.workflow.yaml` loader + `detect-domain-from-paths`.
- Implement `SessionStart` hook lean boot (cross-OS: Windows / Mac / Linux).

**Day 7 — Dogfood & Polish**

- Full-cycle run on a real project: `/init-project` → `/discover` → `/plan-story` → `/implement` → `/reflect` on at least two stories across two parallel epics.
- Fix friction points discovered.
- Write usage doc in plugin README. Ship v1.

---

## Session Summary and Insights

**Key Achievements:**

- 45 ideas captured, of which 9 promoted to architectural principles.
- A MVP scope that contains 8 commands + 6 plumbing skills + 1 config file + 1 hook + memory structure — defensible in a 7-day solo build.
- A clean v2+ backlog where nice-to-haves live without contaminating the MVP.
- Explicit rejection list — items killed during ideation and why, preventing scope creep in implementation.

**Creative Breakthroughs:**

- Reframing agents from "BMAD personas" to "Claude Code subagents for context isolation" — preserved the token-efficiency goal without losing a useful primitive.
- `Selective Memory Loading by Workflow Phase` emerged from a pushback on an over-restrictive CLAUDE.md budget. The user's counter-proposal became one of the strongest architectural ideas of the session.
- Story-scoped context budget (per-story, not per-session) reframed token-efficiency as a decomposition discipline — forcing `/discover` to produce session-sized stories.
- The `memory/project/` + `memory/backlog/` folder naming eliminated the opaque AIDD `internal/external` taxonomy, and consolidated the two-tier memory under one `memory/` umbrella for discoverability.
- The aborted "draft + consolidation" pattern demonstrated the session's own anti-bloat discipline: a clever idea was killed on YAGNI grounds when the user questioned whether it solved a real problem.

**Session Reflections:**

- The user's empirical pushback (e.g., "SuperPowers skills don't always trigger") consistently improved the design over abstract reasoning.
- The AIDD framework inventory mid-session (Phase 3) was a turning point — it shifted several items from v2+ to MVP by lowering their implementation cost.
- The anti-sycophantic protocol held: the facilitator admitted error three times (skills-only, CLAUDE.md cap, draft-consolidation) when the user's arguments were stronger.
- The dialogue maintained generative density: idea count grew steadily (10 → 21 → 35 → 44 → 45) across the three phases without collapsing into premature organization.

**Ready to Move to Implementation:** settle the 8 open decisions above, then execute Day 1 of the roadmap.
