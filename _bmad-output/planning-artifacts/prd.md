---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain (skipped; low-complexity domain — technical constraints deferred to step-10 NFR)
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
status: complete
completedAt: 2026-04-19
lastEdited: '2026-04-26'
revisions:
  - date: '2026-04-26'
    type: architecture-driven amendments
    notes: 'Driven by the architecture workflow (see _bmad-output/planning-artifacts/architecture.md, PRD Amendments Required sections in step-04 and step-07).'
    items:
      - 'FR1 — schema_version reclassified from required to optional with implicit default "0.1"'
      - 'FR12 — unknown-field policy reframed as warn-on-unknown rather than reject'
      - 'FR5 + agentskills.io reference — corrected canonical field list (6 fields) + Claude Code overlay (12 fields)'
      - 'API Surface — added semantic note on field attachment (requires/produces are attached to active components; documents carry type only)'
      - 'Product Scope — JSON Schemas reinterpreted as 2 schemas (envelope + diagnostic registry); per-core:* type schemas deferred to v0.2+ pending RFC'
      - 'Journey 6 — clarified plugin author opts into a strict-warnings CI gate; warning-level diagnostics do not exit non-zero by default'
  - date: '2026-04-26'
    type: implementation-readiness amendments
    notes: 'Driven by the implementation-readiness workflow (see _bmad-output/planning-artifacts/implementation-readiness-report-2026-04-26.md, Step 5 minor concern 1). Aligns PRD wording with epics doc Requirements Inventory.'
    items:
      - 'NFR1 — annotated as a tracked budget for v1.0 (the under-5s target on a 1 000-artifact corpus); benchmark instrumentation deferred to v1.1 since no canonical 1 000-artifact corpus exists at v1.0. Not a v1.0 release gate.'
      - 'NFR2 — annotated as a tracked budget for v1.0 (the under-500ms warm-startup target); instrumentation deferred to v1.1. Not a v1.0 release gate.'
classification:
  projectType: developer_tool
  projectTypeSecondary: cli_tool
  domain: general
  complexity: medium
  projectContext: greenfield
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-caspian.md
  - _bmad-output/planning-artifacts/product-brief-caspian-distillate.md
  - _bmad-output/brainstorming/brainstorming-session-2026-04-17-1545.md
documentCounts:
  briefs: 2
  research: 0
  brainstorming: 1
  projectDocs: 0
workflowType: prd
projectName: joselimmo-marketplace-bmad
author: Cyril
date: 2026-04-19
---

# Product Requirements Document - joselimmo-marketplace-bmad

**Author:** Cyril
**Date:** 2026-04-19

## Executive Summary

The Claude Code plugin ecosystem grew from zero to thousands of skills, agents, and slash commands in under a year. Every author defines their own frontmatter conventions. A developer who installs BMad for brainstorming, Superpowers for planning, an Anthropic frontend plugin, and a custom design skill has no way to know which skill fires when, in what order, or what each expects and produces. The workflow becomes something to memorize rather than discover. The root cause is not model capability, and not the plugin format — it is **the absence of a declarative contract** between components. No skill declares "I need an active epic and a plan"; none declares "I produce an ADR." The runtime and the LLM have to guess.

**Caspian** — *Composable Agent Skill Protocol / Interoperable Artifacts Network* — is an open specification that closes this gap with a minimal frontmatter contract: `schema_version`, `type`, `requires`, `produces`. These four fields turn any agent, skill, command, or memory document into a typed, composable unit. The contract is Agent-Skills-compatible by construction: every Anthropic-standard field remains valid.

**Casper** — *Composable Agent Skill Protocol Example Reference* — is the Claude Code reference plugin that proves the contract end-to-end. Claude-Code-specific surface is isolated in a subdirectory; schemas, validator, and vocabulary live at the repo root and remain vendor-neutral so any other harness can honor the spec.

**Scope of this PRD: Caspian Core + casper-core (v1.0).** The Memory Profile overlay and the full turn-key workflow (casper-full v1.1) are the subject of a second PRD.

**Primary audience** — plugin authors and framework maintainers who want components to compose across ecosystems with zero methodology tax. **Secondary audience** — developers on Claude Code who want a turn-key, modifiable workflow (Casper).

**Why now.** Fragmentation is already visible: six distinct frontmatter schemas exist today (Agent Skills, Superpowers, Spec Kit, Agent OS, BMad, AIDD), none composable with any other. Anthropic opened the Agent Skills standard in December 2025 and cross-vendor adoption (OpenAI, Microsoft, Cursor, GitHub) landed in under three months — the ecosystem is still malleable but not for long. Caspian fills the gap above SKILL.md as a compatible overlay, not a competing fork, while the cement is still wet.

### What Makes This Special

- **Composable by construction, not by convention.** `requires` and `produces` are the stud and tube: a narrow typed interface that lets pieces snap together without prior coordination between authors. Caspian imposes no workflow shape — it just lets components declare theirs.
- **A precise, defensible gap.** `requires` / `produces` are absent from every surveyed agent-skill frontmatter schema (Agent Skills, Superpowers, Spec Kit, Agent OS, BMad, AIDD). Prior art exists in workflow-graph tooling (Dagger, Nix derivations, Bazel, Airflow) but has never crossed into the agent-skill authoring layer. The delta is narrow and defensible.
- **Opt-in at two levels, graceful degradation.** A skill that adds Caspian fields stays usable in any host that ignores them. A Caspian-aware orchestrator honors the fields the moment it sees them. No coordinated migration required — adoption proceeds one skill at a time, one host at a time.
- **Overlay, not fork.** Every Anthropic SKILL.md field remains valid. A published sunset protocol commits Caspian to aliasing and deprecating its own fields within two minor releases if `agentskills.io` ships equivalent fields. Proactive upstreaming of `requires` / `produces` proposals begins before v1.0 — the convergent path is the preferred path.

**Core insight.** The problem is not model capability or plugin format — it is the absence of a declarative contract between components. Caspian replaces guessing with a minimal typed declaration.

**User north star.** A developer installs four plugins from four authors, runs the workflow, and it is discoverable, composable, and observable on the first run.

**Realistic analog.** `prettier` or `prospector` — specs that took three to five years of deliberate integration work to become defaults. Not LSP or EditorConfig, which rode dominant-platform backing Caspian does not have.

## Project Classification

- **Project Type** — `developer_tool` (open specification + vendor-neutral CLI validator + Claude Code reference plugin).
- **Secondary Project Type** — `cli_tool` (the `caspian` validator is an explicit v1.0 deliverable, no Claude Code dependency).
- **Domain** — `general` (agentic-AI tooling and plugin ecosystem; no regulatory or real-time constraints).
- **Complexity** — `medium` (low-complexity domain, but non-trivial protocol design, governance, validator-stack engineering, and cross-vendor interop discipline).
- **Project Context** — `greenfield` (product net-new; hosted inside the existing `joselimmo-marketplace` plugin repo but no Caspian/Casper code pre-exists).

## Success Criteria

### User Success

- **Primary users — plugin authors and framework maintainers.** "Worth it" = their components compose with components from other authors without prior coordination.
  - ≥2 external adopters (third-party skills or plugins declaring `requires` / `produces` in their frontmatter) within 12 months post-v1.0.
  - ≥1 external contributor (RFC or code contribution merged from outside the founding author) within 12 months post-v1.0.
- **Secondary users — developers running Casper on Claude Code.** "Worth it" = workflow is discoverable on the first run.
  - `/init-project` → `/discover` → `/plan-story` chain executes end-to-end on a greenfield project with no manual artifact editing.
  - Developer overrides a single porcelain command locally without forking the plugin.

### Business Success

- **Distribution channel validated** — JSON Schema Store PR accepted (zero-config IDE validation in every editor consuming the store). Deliverable of v1.1; gating indicator for 12-month success.
- **Ecosystem positioning validated** — ≥1 framework maintainer (BMad / Superpowers / Spec Kit / Agent OS) publicly engaged with the spec by v1.1 release; direct conversations with ≥2 maintainers logged by month 3.
- **Marketplace traction** — casper-core accepted in the official Anthropic plugin marketplace. Strategic goal, not a formal gate.
- **Upstream convergence initiated** — ≥1 `requires` / `produces` proposal submitted to `agentskills.io` before v1.0 release.

### Technical Success

- **Contract stability** — schema evolution is BACKWARD_TRANSITIVE between v1.0 and v1.1: additive-only, no breaking changes to `schema_version`, `type`, `requires`, `produces`.
- **Validator correctness** — the `caspian` CLI implements the full validation coverage matrix for its layer (YAML parse errors, BOM rejection, size cap enforcement, schema conformance, warn-on-unknown-field handling, namespace-aware type validation with warnings on unregistered types). Zero false positives on the canonical fixture set shipped with v1.0. Forward-compatibility commitment: enum strictness and path-traversal rejection will apply when `status` and pointer fields are added in a future spec version (see NFR9).
- **Reference plugin end-to-end** — casper-core's `/init-project` → `/discover` → `/plan-story` chain demonstrably produces artifacts that pass `caspian` CLI validation on a clean run.
- **Vendor neutrality verified** — the `caspian` CLI runs on a machine without Claude Code installed. This is the physical evidence behind the "vendor-neutral" positioning.
- **Unix Interop Test** — a non-Casper skill produces an artifact Casper consumes cleanly, and vice versa; scripted and reproducible. Deliverable of v1.1; the fixtures are drafted during v1.0.

### Measurable Outcomes

**Check-in cadence (leading indicators, 3 / 6 months)**

- **Month 3** — public launch post published; ≥2 framework maintainers contacted and logged; `requires` / `produces` upstream proposal drafted.
- **Month 6** — ≥10 GitHub issues opened by non-author contributors; v1.1 scope frozen; at least one talk or discussion thread on `r/ClaudeAI`, HN, or `awesome-claude-code`.

**Success gate evaluation (lagging indicators, 12 months post-v1.0)**

- JSON Schema Store PR accepted.
- ≥2 external adopters (defined above).
- ≥1 external contributor (defined above).
- Unix Interop Test demonstrated and reproducible.
- **If gate fails** — scope / positioning review is triggered before further investment; sunset protocol considered if `agentskills.io` has shipped equivalent fields.

## Product Scope

### MVP — Minimum Viable Product (Caspian Core v1.0 + casper-core v1.0)

- **Spec artifacts** — Caspian Core spec prose, two canonical JSON Schemas (envelope contract `schemas/v1/envelope.schema.json` + diagnostic registry `schemas/v1/diagnostic-registry.schema.json`; per-`core:*`-type schemas deferred to v0.2+ pending an RFC tying them to resolution-semantics evolution — composition rules between `core:*` types are casper-core's orchestration concern, not validator scope), `spec/CHANGELOG.md`, canonical `core:*` vocabulary (`core:adr`, `core:convention`, `core:learning`, `core:glossary`, `core:overview`, `core:epic`, `core:story`, `core:plan`, `core:review`, `core:rule`, `core:scratch`), extensible-registry conformance rules.
- **Vendor-neutral `caspian` CLI validator** — no Claude Code dependency. Validates frontmatter against JSON Schemas. Accepts file, directory, or glob inputs. Strict exit codes for CI gating. Ships with a canonical fixture set for regression testing.
- **casper-core reference plugin** — 2–3 porcelain commands (`/init-project`, `/discover`, `/plan-story`) demonstrating the full `requires → produces` chain. Claude-Code-specific surface (plugin manifest, slash-command registration) isolated in a dedicated subdirectory. Schemas, validator, and vocabulary live at the repo root.
- **Licensing** — CC-BY-4.0 for spec prose; Apache-2.0 for JSON Schemas, validator, and Casper code. Single `LICENSE` file at repo root.
- **Defensive registration** — `caspian` and `casper` names reserved on GitHub, npm, and PyPI even where no package is published.
- **Outreach (continuous)** — launch post on release, PRs into `awesome-claude-code` and `awesome-agent-skills`, direct conversation with ≥1 framework maintainer before v1.1.

### Growth Features (Post-MVP — scoped to a separate v1.1 PRD)

- Caspian Memory Profile overlay (`memory_scope` field, two-tier memory layout).
- casper-full: 8 porcelain commands, 6 plumbing skills, SessionStart lean-boot hook (≤500 tokens, hard cap), full Memory Profile wiring.
- Defense-in-depth validator stack: IDE (VSCode YAML LSP), CI (`ajv` + `caspian/validate-action` GitHub Action), runtime (`validate-artifact-frontmatter` skill + `PreToolUse(Write)` hook), install-time (`claude plugin validate`).
- Unix Interop Test scripted and reproducible.
- JSON Schema Store PR submitted.
- Conformance badge levels (*Core-declared* / *Core-validated* / *Profile-compliant*) + JSON manifest for author signalling and user filtering.

### Vision (Future — post-v1.1)

- **≥2 independent reference implementations** — a second harness-bound or CLI-only implementation validating spec portability.
- **Framework maintainer adoption** — ≥1 of BMad / Superpowers / Spec Kit / Agent OS emits Caspian-compliant frontmatter in its generated artifacts.
- **Upstream convergence achieved** — `requires` / `produces` accepted into `agentskills.io`. Triggers the committed sunset protocol: Caspian aliases the upstream names and deprecates its own within two minor releases.

### Out of Scope / Anti-goals (explicit)

- **Not an MCP replacement.** MCP solves agent↔tool; Caspian solves skill↔skill via typed artifacts.
- **Not a methodology framework.** No prescribed process, only a contract.
- **Not an Agent Skills competitor.** Overlay-compatible, not a fork.
- **Not a memory runtime.** Caspian defines file-level frontmatter; Mem0, Letta, Zep retain the runtime role.
- **No orchestration benchmark** (declarative `requires` / `produces` vs description-based inference) as a committed deliverable. Revisit if evidence emerges.

## User Journeys

### Journey 1 — Maya adopts Caspian Core in her published plugin *(Primary user — plugin author, happy path)*

**Persona.** Maya, independent plugin author. Ships five Claude Code skills under her own GitHub org. A recurring frustration in her issues tracker: "your skill and BMad's don't play well together — I never know which runs first."

**Opening scene.** Maya sees a PR notification on `awesome-claude-code`: a new entry for Caspian appears, tagged *interop spec*. She opens the spec, reads for ten minutes, grasps the contract (four fields, overlay-compatible, zero methodology tax).

**Rising action.** She picks one of her skills, adds four lines of frontmatter: `schema_version: "0.1"`, `type: maya:lint-rule`, `requires: [{type: core:plan}]`, `produces: {type: core:review}`. Runs `caspian validate ./skills/` locally. Gets a clean pass.

**Climax.** She ships a minor version. A week later a Casper user opens an issue: *"your skill now surfaces automatically after `/plan-story` — I didn't have to memorize the trigger."*

**Resolution.** Maya adds Caspian frontmatter to her four other skills over the weekend. Adoption cost: roughly four lines per artifact. Payoff: her plugins stop being isolated islands.

**Requirements revealed** — spec docs readable in under ten minutes; canonical `core:*` vocabulary unambiguous; `caspian` CLI ergonomic (`validate <path>`); namespace convention (`<vendor>:<type>`) documented; strict-but-friendly error output; overlay-compatibility (host ignoring the fields still loads the skill).

### Journey 2 — Tomás ships his first story with Casper *(Secondary user — developer on Claude Code, happy path)*

**Persona.** Tomás, backend engineer in a three-person team. Pragmatic, limited patience for tooling ceremony. Wants to try an opinionated workflow before committing.

**Opening scene.** Tomás runs `/plugin install casper-core@anthropic-marketplace` from Claude Code. Reads the README: three commands, isolated Claude-Code surface, overlay spec underneath.

**Rising action.** He runs `/init-project` on a fresh repo. Casper seeds a minimal project overview artifact (`type: core:overview`) — not a full memory scaffold, just enough to demonstrate the chain. Runs `/discover` to articulate a small feature; an epic + story artifact are written (`type: core:epic`, `type: core:story`). Runs `/plan-story`; the command's frontmatter declares `requires: [{type: core:story, count: 1}]`, which Casper satisfies from the single active story (casper-core v1.0 operates under a single-active-story workspace convention — type-based matching is therefore deterministic). He gets a `core:plan` artifact back, cleanly typed.

**Climax.** He implements the story manually using his usual tools, validates his edits with `caspian validate` against the produced plan, commits.

**Resolution.** "Nothing magic — just things in the right order. And I can see each artifact." He keeps Casper for his side projects.

**Requirements revealed** — `/init-project`, `/discover`, `/plan-story` porcelain behavior; minimal artifact seeding in v1.0 (no full Memory Profile yet); `requires` resolution semantics (type-based matching under the single-active-story workspace convention, count 1); typed artifact files on disk; human-readable diagnostics.

### Journey 3 — Tomás overrides `/plan-story` locally *(Secondary user — developer, edge case: turn-key-but-modifiable)*

**Persona.** Tomás, two weeks into using Casper. His team uses a plan template distinct from Casper's default — shorter, three sections only.

**Opening scene.** He copies `casper-core/skills/plan-story/` into his project's local `.claude/skills/plan-story/`. Modifies the body. Does **not** fork casper-core.

**Rising action.** He keeps Casper's `requires` and `produces` frontmatter identical to the original. Runs `caspian validate` on his override: clean. Runs `/plan-story` — Claude Code resolves to the local skill ahead of the plugin-shipped one.

**Climax.** Casper releases an update. Tomás runs `/plugin update casper-core`. His override survives; nothing else breaks, because the contract is unchanged.

**Resolution.** The override is stable across Casper updates. No need to maintain a fork.

**Requirements revealed** — skill identity tied to frontmatter `name` + artifact contract, not file location; local skills override plugin-shipped skills; `requires` / `produces` stability is what makes the override safe; documented override pattern in Casper README.

### Journey 4 — A framework maintainer evaluates Caspian for BMad *(Primary user — framework maintainer, strategic scenario)*

**Persona.** A BMad core maintainer receives an inbound RFC from a contributor proposing that BMad-generated epics emit Caspian frontmatter so they compose with Casper and other Caspian-aware tools.

**Opening scene.** The maintainer opens the Caspian spec, skims the Agent-Skills-compatibility section, confirms no existing BMad frontmatter would be invalidated.

**Rising action.** Spike: they add `type: bmad:epic`, `produces: {type: core:story}` to one BMad epic template. Run `caspian validate` — clean, with a friendly warning that `bmad:epic` is not in the `core:*` registry (warn, not reject — the extensibility contract holds). They verify in a BMad test harness: no downstream breakage.

**Climax.** They merge the RFC. BMad releases a minor version. BMad users who also run Casper now see their epics flow directly into the Casper pipeline.

**Resolution.** One small diff per artifact type. Users gain cross-framework composition. The maintainer's cost of participation was a half-day spike.

**Requirements revealed** — overlay compatibility is a published contract, not a best-effort promise; extensible-registry semantics (warn on unknown type, never reject); namespace discipline (`bmad:*`) documented; conformance signalling (hint at v1.1 badges) valuable for user filtering.

### Journey 5 — Priya submits an RFC to extend `requires` *(Primary user — external contributor, governance scenario)*

**Persona.** Priya, author of an open-source skill orchestrator. She needs richer `requires` semantics: where the v1.0 spec accepts `count: N` (exact match), her orchestrator wants to dispatch in parallel across *1 to N* stories — so she needs a `count_max`.

**Opening scene.** Priya arrives on the Caspian repo via a mention in `awesome-claude-code`. She reads `spec/README.md`, then `spec/CONTRIBUTING.md`. The RFC process is explicit: any non-trivial modification (new field, enum extension, status transition semantics, breaking schema change) goes through an RFC in `spec/proposals/NNNN-slug.md`.

**Rising action.** She forks the repo, copies `spec/proposals/TEMPLATE.md`, fills the four mandated sections: **Motivation** (her concrete use case), **Alternatives considered** (why not a vendor-specific `x-*` field in her namespace? because the semantics are general and deserve to live in `core:`), **Backward-compat plan** (additive, `count_max` absent = v1.0 behavior unchanged), **Migration path** (none required — v1.0 producers remain valid). She opens the PR: `spec/proposals/0003-requires-count-max.md`.

**Climax.** Discussion in the PR. The BDFL pushes back on surface-area growth: *"why not a range `{min, max}` rather than two separate fields `count` and `count_max`?"* Priya defends the asymmetry: `count: 1` (the dominant case) stays scalar, and the `count_max` extension stays optional — the spec's surface grows only for users who need it. After two rounds, the BDFL accepts. An entry is added to `spec/CHANGELOG.md`: `0.2 — additive: requires.count_max (optional)`.

**Resolution.** The RFC is merged. Priya appears in `CONTRIBUTORS.md`. Her orchestrator ships the feature. Six months later, Caspian announces its first `schema_version: "0.2"` — BACKWARD_TRANSITIVE held, no migration required on adopters' side.

**Requirements revealed** — `spec/CONTRIBUTING.md` documenting the RFC process; `spec/proposals/TEMPLATE.md` with mandated sections (Motivation / Alternatives / Backward-compat / Migration); `spec/CHANGELOG.md` with dated semver entries; BACKWARD_TRANSITIVE commitment enforced at review time (reviewers refuse breaking changes); documented BDFL response SLA (e.g. *BDFL acknowledges RFCs within 7 days*); `CONTRIBUTORS.md` auto-maintained; published conflict-resolution procedure (what happens if the BDFL stalls or the contributor persists in disagreement).

### Journey 6 — CI catches an invalid artifact *(Technical / automation journey — validator in action)*

**Persona.** A plugin-author's GitHub Actions pipeline. No human in this journey — the value is in the automation.

**Opening scene.** A contributor opens a PR on a Caspian-adopting plugin. Their skill has a typo in frontmatter: `requrires` instead of `requires`.

**Rising action.** CI runs `caspian validate ./skills/`. The plugin author's CI is configured with a strict-warnings gate (exit non-zero on any diagnostic, error or warning — e.g., `caspian validate --format=json ./skills/ | jq -e '.summary.errors == 0 and .summary.warnings == 0'`). The CLI emits a precise diagnostic and the gate triggers a non-zero exit:

```
skills/plan-feature/SKILL.md:7 — unknown field "requrires"
  hint: did you mean "requires"?
  doc: https://caspian.dev/spec/core#requires
```

**Climax.** The PR is blocked by the failed status check. Contributor sees the diagnostic inline in the PR Checks tab.

**Resolution.** Contributor fixes the typo, pushes again, CI goes green. Cost: under a minute lost, one bug caught before merge.

**Requirements revealed** — `caspian` CLI supports directory / glob input; exit codes suitable for CI gating (`0` = no errors, non-zero = at least one error; warnings are exit-0 by default); machine-readable `--format=json` output enables CI authors to opt into strict-warnings gating via downstream tooling (`jq` or equivalent); diagnostics include file + line + field name + suggestion + doc link; CLI runs without Claude Code installed (CI runners are vanilla Linux); warn-on-unknown-fields policy (consistent with FR12 + NFR16 graceful degradation + FR13 extensible-registry).

### Journey Requirements Summary

- **Caspian spec (v1.0)** — prose docs readable by a plugin author in ≤10 minutes; canonical `core:*` vocabulary with design rationale per type; namespace convention documented; JSON Schemas published and canonical.
- **`caspian` CLI validator (v1.0)** — `validate <path>` command; file / directory / glob input; strict exit codes for CI; diagnostics include file, line, field, suggestion, doc link; zero Claude Code dependency; canonical fixture set shipped for regression testing.
- **casper-core plugin (v1.0)** — three porcelain commands (`/init-project`, `/discover`, `/plan-story`) each declaring typed `requires` / `produces` frontmatter; end-to-end chain producing cleanly typed artifacts; minimal memory seeding (not full Memory Profile); Claude-Code-specific surface isolated in a subdirectory.
- **Local-override support** — skill identity tied to frontmatter `name` + contract, not file path; plugin-shipped skills overridable by local skills with the same contract; Casper README documents the override pattern.
- **Overlay compatibility** — every Anthropic SKILL.md field remains valid alongside Caspian fields; validator warns (never rejects) on types outside the `core:*` registry; extensibility via `<vendor>:<type>` namespacing.
- **Governance artifacts (v1.0)** — `spec/CONTRIBUTING.md` documenting the RFC process; `spec/proposals/TEMPLATE.md` (Motivation / Alternatives / Backward-compat / Migration); `spec/CHANGELOG.md` with semver entries; `CONTRIBUTORS.md` auto-maintained; documented BDFL response SLA and conflict-resolution procedure.

### Journeys explicitly out of scope for v1.0

- **External-harness journey** (non-Casper orchestrator using `caspian` CLI outside Claude Code). Matters, but proving spec portability is a post-v1.1 success criterion — covered in the Vision section, not a journey the v1.0 release measures against.
- **Unix Interop Test journey** (non-Casper skill producing an artifact Casper consumes, and vice versa). Deliverable of v1.1.
- **Regulated-domain audit-trail journey** (team using `requires` / `produces` lineage as free provenance). Emerges naturally from the contract but does not drive any v1.0 requirement beyond what the journeys above already cover.

## Innovation & Novel Patterns

### Detected Innovation Areas

- **Declarative pre/post-conditions at the agent-skill authoring layer.** `requires` and `produces` are absent from every surveyed frontmatter schema (Agent Skills, Superpowers, Spec Kit, Agent OS, BMad, AIDD). Prior art exists in workflow-graph tooling (Dagger, Nix derivations, Bazel, Airflow) but has never been applied to the skill-authoring layer. Caspian crosses that line — the delta is narrow and defensible, not "nothing like this exists."
- **Extensible namespace-based artifact-type registry.** Most specs fail either by decree (closed enum that can never absorb author innovation) or by absence (free-for-all frontmatter that degenerates into xkcd 927). Caspian takes the middle path: a canonical `core:*` vocabulary plus first-class vendor/author namespaces (`bmad:*`, `maya:*`), with validator warnings (never rejections) on unregistered types. The effective registry for a project emerges from the union of installed skills, not from central approval.
- **Overlay with a pre-committed sunset protocol.** A spec that plans its own obsolescence. If `agentskills.io` ships equivalent fields, Caspian commits to aliasing and deprecating its own within two minor releases. Proactive upstreaming of `requires` / `produces` proposals to Anthropic begins before v1.0. Convergent absorption is the preferred outcome, not the failure mode. This discipline — publishing the exit before the launch — is unusual in spec design.

### Market Context & Competitive Landscape

**Complementary standards (not competitors)**

- **Anthropic Agent Skills (`agentskills.io`, Dec 2025)** — official open standard. Cross-vendor adoption in under three months (OpenAI, Microsoft, Cursor, GitHub, Atlassian, Figma). The standard is layered: **agentskills.io canonical fields** (`name`, `description`, `license`, `allowed-tools`, `metadata`, `compatibility` — six fields) and the **Claude Code overlay** (`when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `model`, `effort`, `context`, `agent`, `hooks`, `paths`, `shell` — twelve additional vendor fields, on top of the canonical six). Caspian fills the gap above both layers: composition semantics (`requires` / `produces`) for agents, commands, and memory documents. Overlay-compatible by construction — every agentskills.io canonical and Claude Code overlay field remains valid inside a Caspian-conformant artifact.
- **MCP (Model Context Protocol, Linux Foundation)** — 10 000+ servers, 97M monthly SDK downloads. Solves agent↔tool discovery and invocation. Orthogonal to Caspian's skill↔skill artifact contract. The 2026 roadmap adds `.well-known` MCP Server Cards for static capability discovery — complementary to Caspian's static artifact typing, not competitive.

**Incumbent spec-driven frameworks (Caspian positions as substrate, not competitor)**

- BMad-Method (~37k⭐), GitHub Spec Kit (~71k⭐), Superpowers (~57k⭐), Agent OS, AIDD. Each defines its own proprietary frontmatter shape. None compose with any other. Framework maintainer adoption of Caspian Core (Journey 4) is the v1.1+ unlock.

**Plugin collections (surface for adoption compounding)**

- ComposioHQ/awesome-claude-plugins (176+ plugins), wshobson/agents (72+ agents, 31k⭐), claude-code-templates (davila7, 135+ agents / 176+ plugins), rohitg00/awesome-claude-code-toolkit (101 plugins in the official marketplace). All ship ad-hoc, author-defined frontmatter. Each is a potential adoption surface.

**Memory runtimes (orthogonal — Memory Profile territory, out of v1.0 scope)**

- Mem0, Letta/MemGPT, Zep, LangMem. Converging on episodic/semantic/procedural scope vocabulary at runtime but with zero interop on file format. The Memory Profile overlay (scoped to the v1.1 PRD) is the greenfield slot.

**Market-timing signals**

- Gartner forecast: 40% of today's agents will not survive to 2027 — pre-consolidation window.
- Developer trust in AI output: 29% in 2025, down from ~70% in 2023 — tailwind for typed-artifact and precondition approaches.
- Snyk audit: prompt injection present in 36% of published skills; no package-signing standard in the ecosystem. Caspian's structural defenses (closed enums in Profile, validated pointers, size caps, BOM rejection, safe YAML loading) help but cannot solve supply-chain trust alone.

### Validation Approach

- **Implementation proof (v1.0).** casper-core demonstrates the full `requires → produces` chain end-to-end. Clean execution on a greenfield project is the primary evidence that the contract is implementable.
- **Vendor-neutrality proof (v1.0).** The `caspian` CLI runs on a machine with no Claude Code installed — a physical demonstration, not a declaration.
- **Adoption evidence (12 months post-v1.0).** ≥2 external adopters (third-party skills or plugins declaring `requires` / `produces`) — a real-world implementability check. ≥1 external RFC merged (Journey 5) — a governance pressure-test.
- **Portability evidence (v1.1).** Unix Interop Test scripted and reproducible — a non-Casper skill produces an artifact Casper consumes cleanly, and vice versa. This is the portability gold standard.
- **Long-term portability evidence (post-v1.1).** ≥2 independent reference implementations — proves the spec is not tied to Casper.

### Risk Mitigation

- **Risk — Anthropic absorbs `requires` / `produces` into Agent Skills.** *Mitigation:* sunset protocol pre-committed and published in the spec; proactive upstreaming to `agentskills.io` begins before v1.0; convergence is the preferred path, not the failure mode. Absorption risk is converted from existential to planned.
- **Risk — description-based orchestration inference proves "good enough", making declarative preconditions redundant.** *Mitigation:* flagged as a residual risk; no benchmark is a committed v1.0 deliverable (explicit anti-goal); revisit only if field evidence emerges.
- **Risk — namespace sprawl fragments the registry (`bmad:persona` vs `superpowers:persona` with incompatible semantics).** *Mitigation:* validator warns (never rejects) on unregistered types; published design rationale per `core:*` type to prevent bikeshedding; conformance badge levels (v1.1) provide a quality signal; RFC process for `core:*` additions.
- **Risk — validator stack drift across four layers (IDE, CI, runtime, install).** *Mitigation:* single JSON Schema source of truth that all layers reference. v1.0 ships only two of four layers (CLI + install-time), reducing drift surface; the full stack is deferred to v1.1.
- **Risk — BDFL bus factor stalls the project.** *Mitigation:* RFC process (every decision is traceable, a successor can resume); early outreach to external contributors (Journey 5); documented conflict-resolution procedure published even under BDFL governance.

## Developer Tool Specific Requirements

### Project-Type Overview

Caspian / Casper ships three distinct developer-tool artifacts, each with its own distribution channel and language profile:

1. **Caspian spec (v1.0)** — spec prose + JSON Schemas + canonical vocabulary + single-page static site at `caspian.dev`. Language-agnostic deliverable. Distributed as a GitHub repository (prose, schemas, fixtures) and, in v1.1, as a JSON Schema Store entry (schemas only).
2. **`caspian` CLI validator (v1.0)** — vendor-neutral, no Claude Code dependency. Validates YAML frontmatter against the spec's JSON Schemas. Distributed via npm.
3. **casper-core Claude Code plugin (v1.0)** — reference implementation demonstrating the `requires → produces` chain. Distributed via the official Anthropic plugin marketplace.

Sections `visual_design` and `store_compliance` are skipped per CSV (not applicable to a spec + CLI + plugin).

### Language Matrix

| Component | Language / Runtime | Rationale |
|---|---|---|
| Caspian spec (prose, vocabulary) | Markdown, YAML | Language-agnostic by design |
| Caspian JSON Schemas | JSON Schema (Draft 2020-12) | Canonical; consumed by any JSON-Schema-aware validator |
| `caspian.dev` website | Static HTML (GitHub Pages) | Minimal; single landing page with stable doc anchors |
| `caspian` CLI validator (v1.0) | **Node.js / TypeScript** | Minimizes validator stack-drift risk: the v1.1 CI layer and runtime skill both target Node (`ajv`). A Python v1.0 CLI would introduce a second JSON Schema implementation whose verdicts must byte-agree with `ajv` — a concrete source of divergence (`ajv` and Python `jsonschema` differ on several Draft 2020-12 conformance cases). One Node implementation across v1.0 CLI + v1.1 CI + v1.1 runtime skill = zero drift. |
| casper-core plugin | Markdown (SKILL.md, command frontmatter) + Claude Code plugin manifest | Constrained by the Claude Code plugin format |
| Client libraries (future) | Optional — `caspian-py`, `caspian-go` (post-v1.1, Vision) | Only if external-harness adoption demands it |

**Out of scope for v1.0** — non-Node implementations of the CLI. Defensive package-name registration on PyPI and crates.io is maintained to pre-empt future collisions, but no second runtime is shipped.

### Installation Methods

- **Spec consumption** — browse `caspian.dev` for the human-readable entry point; clone the GitHub repo for full normative sources (prose, schemas, fixtures); reference the JSON Schemas by URL in v1.1 once the JSON Schema Store PR lands.
- **CLI validator**
  - `npm install -g @caspian-dev/cli` — global install for interactive use; the binary in PATH is `caspian`.
  - `npx @caspian-dev/cli validate <path>` — zero-install usage for CI.
  - `uses: caspian-dev/validate-action@v1` — reusable GitHub Action (v1.1 deliverable; v1.0 users wire `npx @caspian-dev/cli` manually).
- **casper-core plugin**
  - From Claude Code: `/plugin install casper-core@anthropic-marketplace` (assumes marketplace acceptance — strategic goal, not a formal gate).
  - Local development: `/plugin install ./path/to/casper-core`.

### API Surface

**Spec surface (Caspian Core v1.0) — four frontmatter fields form the contract**

- `schema_version` (optional in v1.0, string, semver minor) — declares the spec version the producer writes against. **Default `"0.1"` when absent in v1.0.** Producers writing against v0.2+ MUST declare `schema_version` explicitly to enable consumer-side forward-compatibility detection.
- `type` (required, string, namespaced) — `core:story`, `bmad:epic`, `maya:lint-rule`, …
- `requires` (optional, array of objects) — each entry: `{type: string, tags?: string[], count?: int}`.
- `produces` (optional, object) — `{type: string}`.

**Semantic note on field attachment.** `requires` and `produces` are semantically attached to **active components** (skills, commands, agents) — the artifacts that consume preconditions and emit postconditions. **Documents** (passive output artifacts produced by a skill, such as a `core:story` written to disk) carry only `type`. The four-field contract is universal in scope (any Caspian artifact MAY declare any of the four fields), but `requires` / `produces` are typically empty or absent on documents.

Agent-Skills-compatible — every Anthropic SKILL.md field remains valid. `x-*` prefix reserved as extension escape hatch. **`status` and supersession pointers (`supersedes` / `superseded_by`) are deliberately absent from v1.0. Their operational semantics have not been sufficiently challenged; they are deferred to a future spec version (v0.2 at earliest) pending a concrete use case with a BDFL-approved RFC. Adding them later as optional fields is BACKWARD_TRANSITIVE-compliant.**

**CLI surface (`caspian` v1.0)**

- `caspian validate <path>` — accepts file, directory, or glob; walks, parses frontmatter, validates each file against the schemas.
- `caspian validate --format=json <path>` — machine-readable output for CI consumption.
- `caspian --version`, `caspian --help`, `caspian validate --help` — standard CLI conventions.
- Exit codes: `0` = all valid; non-zero = at least one invalid artifact.
- Diagnostics include file, line, field name, suggestion (edit-distance for unknown fields), and a doc link to a stable anchor on `caspian.dev`.
- No network access, no telemetry, no required configuration file in v1.0. Configuration (custom type-registry overrides, custom fixture paths) is deferred.

**Plugin surface (casper-core v1.0)**

- 2–3 porcelain commands — `/init-project`, `/discover`, `/plan-story`. Each declares typed `requires` and `produces` in its frontmatter.
- Each command produces a typed artifact on disk (`core:overview`, `core:epic`, `core:story`, `core:plan`) that the next command in the chain consumes.
- **Single-active-story workspace convention** — casper-core v1.0 operates under the convention that a workspace has at most one active story at a time. Type-based `requires` matching (without a `status` filter) is therefore deterministic in v1.0. When multi-story workspaces become relevant in a future release, the spec extension will coincide with the addition of `status`.
- Claude-Code-specific surface (plugin manifest, slash-command registration) isolated in a `claude-code/` subdirectory of the plugin repo.

**Website surface (`caspian.dev` v1.0)**

- Single-page static site hosted on GitHub Pages (free tier). Generated from Markdown with a minimal generator (11ty or hand-written HTML — no CMS, no blog, no doc portal).
- Sections: 30-second pitch; install-in-two-lines quickstart showing the 4-line frontmatter delta; links to spec GitHub, CLI on npm, casper-core on the marketplace, RFC process, CONTRIBUTING.
- Stable anchor IDs per spec concept (`#schema-version`, `#type`, `#requires`, `#produces`, `#core-vocabulary`) so the CLI can emit durable doc links in diagnostics.
- No server-side logic. Content is versioned in the same repo as the spec — changes ship together.

### Code Examples

- **Minimal skill adopting Caspian Core** — a four-line frontmatter delta (`schema_version`, `type`, `requires`, `produces`) added to an existing Anthropic SKILL.md. Shipped in `spec/examples/minimal-skill-adoption/`.
- **Full casper-core chain** — the reference plugin is itself the canonical end-to-end example.
- **Canonical fixture set** — shipped with the `caspian` CLI as `fixtures/valid/*` and `fixtures/invalid/*`. Used for CLI regression testing; doubles as a reading reference.
- **CI integration snippet** — three-line GitHub Actions step calling `npx @caspian-dev/cli validate ./` shipped in `examples/ci-integration/`.

### Migration Guide

Not applicable — Caspian v1.0 is the initial release. A migration guide will be introduced only if a future breaking change requires it.

### Documentation Requirements

- **Spec docs** — `spec/README.md` (5-minute intro), `spec/core.md` (normative reference), `spec/CHANGELOG.md`, `spec/CONTRIBUTING.md`, `spec/proposals/TEMPLATE.md`.
- **CLI docs** — built-in `caspian --help`; `README.md` in the CLI package covering install, common commands, and exit codes.
- **Plugin docs** — `casper-core/README.md` covering install, the three porcelain commands, the local-override pattern (Journey 3), and the explicit scope ("v1.0 proof, not the full workflow").
- **Vocabulary docs** — one short file per canonical `core:*` type with a rationale paragraph (sources: BMad, Agent OS, industry ADR pattern) to head off bikeshedding.
- **Website** — `caspian.dev` landing page (see Website surface above). Part of v1.0, not deferred.

### Technical Architecture Considerations

- **Single source of truth for schemas.** The JSON Schema files under `spec/schemas/` are canonical (Draft 2020-12). The CLI, any IDE integration, the v1.1 CI layer, and the v1.1 runtime skill all reference these schemas — never re-declare them. This mitigates the validator stack-drift risk identified in Risk Mitigation.
- **Vendor neutrality enforced by an implementation boundary.** The `caspian` CLI code must not import any Claude-Code-specific module. v1.0 release gate: running the CLI on a vanilla Linux container with no Claude Code installed, against the canonical fixture set, passes.
- **Claude-Code surface isolation in casper-core.** All Claude-Code-specific code (plugin manifest, slash-command registration, any planned hooks) lives in a dedicated subdirectory. Schemas, validator, and vocabulary live at the repo root so they remain reusable by any other harness.
- **Frontmatter parsing constraints (apply to every implementation layer).** YAML 1.2, UTF-8, no BOM. Safe loading only. Frontmatter size cap 4 KB. Path-traversal rejection (`..`, absolute paths) in any pointer field added in a future version.
- **Canonical doc URL is `caspian.dev`**, not the GitHub repo. The CLI's diagnostics emit `caspian.dev` doc links, giving a stable URL surface that survives repo restructuring.

### Implementation Considerations

- **Bootstrap order.** Spec prose + JSON Schemas first; the CLI consumes the schemas; the website surfaces the prose; casper-core consumes the CLI (for self-validation during development) and demonstrates the spec. Circular dependency avoided because the CLI's validation is generic JSON Schema, not Caspian-specific.
- **Fixture-first development.** The canonical fixture set (valid + invalid per schema) is built alongside the schemas. Every future change to a schema starts with a fixture change.
- **Test discipline for the CLI.** Zero false positives on the valid-fixture set is a v1.0 release gate. Every reported validator bug post-v1.0 is replicated as a fixture before being fixed.
- **Node-only in v1.0.** Python or Go implementations of the CLI are explicitly post-v1.1 — only if external-harness adoption (Vision) demands it.
- **Publishing pipeline.** Spec, website, and CLI release together (same semver). casper-core follows its own semver but declares the Caspian `schema_version` it targets in its plugin manifest.
- **Defensive naming.** `caspian` and `casper` are reserved on GitHub, npm, PyPI, and crates.io even where no package ships. Primary domain `caspian.dev`; defensive registration of `caspian.io` / `caspian.ai` if budget allows.

## Project Scoping & Phased Development

**Cross-reference.** The feature-level scope (MVP / Growth / Vision / Anti-goals) is defined in the *Product Scope* section above and is not duplicated here. This section covers strategic scoping only: MVP philosophy, resources, and risk-based scope decisions.

### MVP Strategy & Philosophy

Caspian v1.0 is simultaneously a **problem-solving MVP** and a **platform MVP** — both framings apply:

- **As a problem-solving MVP** — it proves that declarative pre/post-conditions are implementable and composable at the agent-skill authoring layer. The end-to-end `/init-project` → `/discover` → `/plan-story` chain in casper-core is the problem-solving evidence: the contract does not require a heroic runtime to be honored.
- **As a platform MVP** — it establishes the minimum surface that other authors can build on. The four-field contract, the `core:*` vocabulary, and the namespace extensibility rule are platform primitives. Other plugin authors are the platform users.

**Not a revenue MVP, not an experience MVP.** No monetization surface; end-user experience (Casper UX polish) is deferred to casper-full in the v1.1 PRD.

**Fastest path to validated learning.** Ship Caspian Core spec + `caspian` CLI + casper-core plugin + `caspian.dev` landing page as a coordinated release. Run one external-adopter experiment within three months (concrete prompt: a Maya-style author adds Caspian frontmatter to a real published plugin). That is the v1.0 validation signal beyond implementation correctness.

### Resource Requirements

**Team — solo founding author (BDFL) with Claude Code assist for v1.0.** RFC process opens the door to external contributors (Journey 5), but none is a prerequisite for v1.0. Implementation is AI-assisted via Claude Code; the binding constraint on the timeline is BDFL decision bandwidth — spec design choices, canonical vocabulary rationale, and review cycles — not raw code production.

**Calendar — days, not weeks.** Realistic range: **3–7 calendar days of focused work** for a public-release-safe v1.0 (not internal-only), spread over 1–2 calendar weeks depending on available daily time. Indicative distribution:

- **Day 1–2 — spec prose + JSON Schemas + canonical fixture set.** Human-intensive: design decisions and per-`core:*`-type rationale. AI-assisted for prose drafting and schema authoring. This is the longest phase because every decision here is locked in by BACKWARD_TRANSITIVE.
- **Day 3 — `caspian` CLI implementation, tests, diagnostics.** AI-implemented, human-reviewed on fixture-set correctness, diagnostic quality, and the vendor-neutrality release gate (runs on a Claude-Code-free container).
- **Day 4 — casper-core plugin (3 porcelain commands), plugin README, override-pattern documentation.** AI-implemented, human-reviewed via dogfooding on a real greenfield project.
- **Day 5 — `caspian.dev` site + per-type vocabulary docs + launch prep (awesome-list PRs, upstream `agentskills.io` proposal draft).**
- **Days 6–7 (buffer).** Iteration on dogfooding findings; one external-adopter experiment (a Maya-style author adds Caspian frontmatter to their own plugin); fix friction before public release.

**BDFL oversight domains (solo-covered).** Spec and schema design discipline (every decision is a BACKWARD_TRANSITIVE commitment); code and test review (fixture-set zero-false-positives gate); dogfooding discipline (real project, not a synthetic one); launch discipline (awesome-list outreach, `agentskills.io` upstreaming, community engagement).

**Budget — marginal.** Domain registration (`caspian.dev`, plus defensive `caspian.io` / `caspian.ai` optional), GitHub Pages (free), npm (free), marketplace submission (free), Claude Code subscription (existing input cost). Target: under €100 for the first year excluding subscriptions already in place.

### Risk-Based Scoping

Scope-adjacent risks not already captured in the Innovation / Risk Mitigation section.

**Technical risks**

- *Scope risk: `caspian` CLI performance regressions on large codebases.* Mitigation — `caspian validate` is I/O-bound and per-file; shipping a profile benchmark in v1.0 on a 1 000-file synthetic repo sets a baseline. Not a v1.0 release gate unless a real user reports an issue during internal dogfooding.
- *Scope risk: cross-platform CLI packaging (Windows, Mac, Linux).* Mitigation — ship as a Node package (`npm install -g @caspian-dev/cli`). Cross-platform is Node's problem, not ours. A `pkg`-style bundled binary is deferred to post-v1.0 if zero-Node-install usage emerges as a demand.

**Market risks**

- *Scope risk: zero traction in the 0–3 month window.* Mitigation — the launch includes a concrete adopter experiment (one real plugin adds Caspian frontmatter). If that fails to complete cleanly, a positioning review is triggered before investing in v1.1 (already captured in Success Criteria).
- *Scope risk: premature competition from an analogous spec by another actor in the same window.* Mitigation — the sunset protocol explicitly allows absorption; the overlay-compatibility stance means even a competing spec's rise does not invalidate Caspian-compatible artifacts.

**Resource risks**

- *Scope risk: BDFL unavailability (illness, life event) mid-release.* Mitigation — the spec is written such that the JSON Schemas alone are useful without the CLI; the CLI is useful without casper-core; casper-core is useful without the website. Any subset is a partial but usable v1.0. Stage releases whenever possible instead of a single atomic drop.
- *Scope risk: solo author underestimates one of the day-deliverables.* Mitigation — explicit priority order if time compresses: spec prose and schemas → CLI → casper-core → website. The spec can ship without the plugin; the plugin cannot ship without the spec. Cut casper-core scope (two commands instead of three) before cutting spec scope.
- *Scope risk: a v1.0 decision is reversed post-release, costing BACKWARD_TRANSITIVE goodwill.* Mitigation — the decision to exclude `status` is the concrete example (BDFL decision in step-07). Each v1.0 scope decision is paired with an explicit reversibility note in this PRD. Additive restoration is cheap; removal is expensive — favor under-shipping over over-committing.

### Phased Development Roadmap

Mapped to the Product Scope sections above.

- **Phase 1 — MVP (this PRD, v1.0)** — see *Product Scope → MVP* above.
- **Phase 2 — Growth (separate PRD, v1.1)** — see *Product Scope → Growth Features* above. Memory Profile + casper-full + defense-in-depth validator stack + JSON Schema Store submission + GitHub Action + conformance badges.
- **Phase 3 — Expansion (Vision, post-v1.1)** — see *Product Scope → Vision* above. ≥2 independent reference implementations; framework-maintainer adoption; `agentskills.io` upstream convergence.

No new content; Phase 1/2/3 exist to connect the strategic framing here to the feature lists already documented.

## Functional Requirements

The capability contract. Every feature shipped in v1.0 must trace back to a line below. Any capability not listed here will not exist in the final product unless explicitly added through a subsequent revision.

### Spec Contract Authoring

- **FR1**: Any artifact author can declare the Caspian Core contract in YAML frontmatter — `type` (required), `requires` (optional), `produces` (optional), and `schema_version` (optional in v1.0; defaults to `"0.1"` when absent; producers writing against v0.2+ MUST declare `schema_version` explicitly).
- **FR2**: Any artifact author can express typed preconditions via `requires`, specifying the required artifact type, optional tags, and optional count.
- **FR3**: Any artifact author can express typed postconditions via `produces`, specifying the produced artifact type.
- **FR4**: Any artifact author can use canonical `core:*` types or define their own vendor/author-namespaced types (e.g. `bmad:epic`, `maya:lint-rule`).
- **FR5**: Any artifact author can include agentskills.io canonical fields (`name`, `description`, `license`, `allowed-tools`, `metadata`, `compatibility`) and Claude Code overlay fields (`when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `model`, `effort`, `context`, `agent`, `hooks`, `paths`, `shell`) alongside Caspian fields without conflict.
- **FR6**: Any artifact author can reserve vendor or experimental extensions via the `x-*` frontmatter prefix.

### Artifact Validation

- **FR7**: A plugin author can validate a single file, a directory, or a glob with one `caspian validate <path>` invocation.
- **FR8**: A plugin author can request machine-readable validation output (`--format=json`) suitable for programmatic CI consumption.
- **FR9**: A plugin author receives diagnostics that include file, line number, field name, an edit-distance suggestion for unknown fields, and a doc link to a stable anchor on `caspian.dev`.
- **FR10**: A plugin author receives exit codes that distinguish *all artifacts valid* (`0`) from *at least one artifact invalid* (non-zero).
- **FR11**: A plugin author can run the validator on a system without Claude Code installed (vendor-neutrality guarantee).
- **FR12**: A plugin author can rely on the validator to reject syntactically invalid artifacts — YAML parse errors, BOM prefix, non-UTF-8 encoding, tab indentation in frontmatter, unquoted YAML 1.1 boolean coercion (`on` / `off` / `yes` / `no`), and frontmatter exceeding 4 KB. Frontmatter fields outside the recognized allow-list (Caspian core fields + agentskills.io canonical fields + Claude Code overlay fields + `x-*` extensions + `<vendor>:<name>` namespaced fields) are emitted as **warnings**, not errors, consistent with NFR16 graceful degradation and FR13 extensible-registry behavior.
- **FR13**: A plugin author can use vendor or author-namespaced types (e.g. `bmad:persona`) and receive validator warnings rather than rejections on unregistered types (extensible-registry behavior).
- **FR14**: A plugin author's artifacts are checked against canonical JSON Schema (Draft 2020-12) references that serve as single source of truth for every validation layer.

### Reference Workflow (casper-core)

- **FR15**: A developer can bootstrap a greenfield project with `/init-project`, producing a typed `core:overview` artifact on disk.
- **FR16**: A developer can articulate a feature with `/discover`, producing typed `core:epic` and `core:story` artifacts on disk.
- **FR17**: A developer can generate an implementation plan with `/plan-story`, which declares `requires: [{type: core:story, count: 1}]` and produces a typed `core:plan` artifact on disk.
- **FR18**: A developer can run the full `/init-project` → `/discover` → `/plan-story` chain end-to-end on a greenfield project with no manual artifact editing required between commands.
- **FR19**: A developer can operate casper-core under the single-active-story workspace convention (at most one active story at a time), with type-based `requires` matching sufficient for deterministic resolution.

### Plugin Composition & Overrides

- **FR20**: A developer can override a plugin-shipped skill by placing a skill with the same `name` and contract (`requires` / `produces`) in the project's local `.claude/skills/` directory.
- **FR21**: A developer's local skill override survives plugin updates, provided the contract (`name`, `requires`, `produces`) of the overriding skill matches the upstream contract.
- **FR22**: A developer can install casper-core from the Anthropic plugin marketplace (`/plugin install casper-core@anthropic-marketplace`) or from a local path.

### Governance & Evolution

- **FR23**: An external contributor can propose a non-trivial spec change (new field, enum extension, breaking schema change) via an RFC in `spec/proposals/NNNN-slug.md` using the published TEMPLATE.
- **FR24**: The RFC TEMPLATE requires the proposer to state four mandated sections: Motivation, Alternatives Considered, Backward-Compatibility Plan, and Migration Path.
- **FR25**: An external contributor can expect a documented BDFL response SLA (e.g. acknowledge within N days) and a published conflict-resolution procedure applicable even under BDFL governance.
- **FR26**: Merged RFCs appear as entries in `spec/CHANGELOG.md` with a semver bump, and contributors are credited in `CONTRIBUTORS.md`.
- **FR27**: Spec consumers can trust that artifacts written against an earlier minor version remain readable by later minor versions within the same major version (BACKWARD_TRANSITIVE schema evolution guarantee).

### Distribution & Discoverability

- **FR28**: The Caspian spec is distributed as a GitHub repository containing prose, JSON Schemas, canonical vocabulary docs, and fixture sets, under the stated licenses (CC-BY-4.0 for prose; Apache-2.0 for schemas and code).
- **FR29**: The Caspian CLI is distributed via npm as `@caspian-dev/cli` under the `caspian-dev` organization (mirroring the canonical domain `caspian.dev`). The unhyphenated `caspian` package name was unavailable at publication time (squat by an unrelated maintainer; see Epic 1 retrospective AI-3, 2026-04-27). The binary name in PATH after global install remains `caspian` (declared via the `bin` field in `package.json`), so post-install user experience reads `caspian validate <path>` unchanged.
- **FR30**: The `casper-core` plugin is distributed via the official Anthropic plugin marketplace under the unhyphenated `casper` or `casper-core` name (marketplace acceptance is a strategic goal, not a formal release gate).
- **FR31**: The `caspian.dev` website presents a single-page landing with the 30-second pitch, a 4-line frontmatter quickstart, and links to the spec GitHub repository, the CLI on npm, casper-core on the marketplace, CONTRIBUTING, and the RFC process.
- **FR32**: The `caspian.dev` website provides stable anchor IDs per spec concept (`#schema-version`, `#type`, `#requires`, `#produces`, `#core-vocabulary`) that the CLI's diagnostic doc links consume.

### Developer Onboarding & Documentation

- **FR33**: A plugin author can read the core spec (`spec/core.md`) in ten minutes or less and grasp the four-field contract.
- **FR34**: A plugin author can consult a short rationale document for each canonical `core:*` type (`spec/vocabulary/<type>.md`) covering purpose, sources, and use boundaries.
- **FR35**: A plugin author can run a minimal adoption example (`spec/examples/minimal-skill-adoption/`) demonstrating the 4-line frontmatter delta applied to an existing Anthropic SKILL.md.
- **FR36**: A plugin author can copy a CI integration snippet (`examples/ci-integration/`) that wires `npx @caspian-dev/cli validate ./` into GitHub Actions in three YAML lines.
- **FR37**: A casper-core user can read a README that explains install, the three porcelain commands, the local-override pattern (Journey 3), and the explicit scope boundary ("v1.0 proof, not the full workflow").
- **FR38**: A plugin author can inspect the canonical fixture set (`fixtures/valid/*`, `fixtures/invalid/*`) shipped with the CLI as a reading reference for "what the spec looks like in practice".

## Non-Functional Requirements

Quality-attribute requirements that specify **how well** the system must perform. Categories not applicable to Caspian / Casper v1.0 (Scalability — no server, no multi-tenant, no user concurrency) are explicitly omitted rather than documented with degenerate metrics.

### Performance

- **NFR1** — The `caspian` CLI validates a 1 000-artifact repository in under 5 seconds on a standard developer laptop (Apple M-series or equivalent). The validator is I/O-bound; parallel file I/O is acceptable but not required for v1.0. **v1.0 status: tracked budget, not a release gate** (no canonical 1 000-artifact corpus exists at v1.0; benchmark instrumentation deferred to v1.1).
- **NFR2** — The `caspian` CLI startup overhead (time from invocation to first file parse) is under 500 ms on a warm Node runtime. **v1.0 status: tracked budget, not a release gate** (instrumentation deferred to v1.1).
- **NFR3** — The `caspian.dev` single-page site loads in under 2 seconds on a 4G mobile connection from a clean cache; DOMContentLoaded under 1 second on broadband.
- **NFR4** — Frontmatter parsing enforces a 4 KB hard cap per artifact to prevent pathological YAML inputs from degrading validator performance.

### Security

- **NFR5** — YAML parsing is safe-load only (YAML 1.2; no custom tags that enable code execution). Validators reject non-UTF-8 inputs and inputs carrying a byte-order mark (BOM).
- **NFR6** — The `caspian` CLI performs no network I/O at validate time. No telemetry is emitted. No remote schema fetching is attempted.
- **NFR7** — casper-core ships without `hooks`, `mcpServers`, or `permissionMode` in any plugin-shipped agent. This is a Claude Code plugin-format constraint, respected as published; no elevated permissions are requested at install or runtime.
- **NFR8** — Defensive YAML constraints are enforced at parse time: tab indentation rejected in frontmatter; unquoted booleans (`on`/`off`/`yes`/`no`) rejected; frontmatter size exceeding 4 KB rejected.
- **NFR9** — When pointer fields (`supersedes` / `superseded_by`) are introduced in a future spec version, path-traversal references (`..`, absolute paths) must be rejected. The parser rule is documented in v1.0 as a forward-compatibility commitment.

### Accessibility

- **NFR10** — The `caspian.dev` single-page site meets WCAG 2.1 Level AA for its landing page (semantic HTML, readable contrast, keyboard-navigable, no reliance on color alone, skip-link provided, no animations triggered without user interaction).
- **NFR11** — The `caspian` CLI produces human-readable diagnostics by default and machine-readable output (`--format=json`) on request, enabling integration with assistive tooling and non-terminal UIs.
- **NFR12** — Spec documentation (Markdown) renders accessibly via GitHub's default renderer and on `caspian.dev`; no UI interactions are required to read normative content.

### Interoperability

- **NFR13** — Caspian frontmatter is fully overlay-compatible with Anthropic Agent Skills SKILL.md. Every documented Agent Skills field (`name`, `description`, `disable-model-invocation`, `model`, `version`, `when_to_use`, `allowed-tools`, `argument-hint`, `user-invocable`, `agent`, `hooks`, `paths`, `shell`, `effort`, `context`) remains valid inside a Caspian-conformant artifact.
- **NFR14** — Caspian JSON Schemas conform to JSON Schema Draft 2020-12; they are consumable by any compliant JSON Schema validator without extensions.
- **NFR15** — The `caspian` CLI integrates with GitHub Actions via standard exit codes (`0` / non-zero) and optional structured output (`--format=json`), without requiring a custom Action in v1.0.
- **NFR16** — Any skill or command that respects Caspian Core semantics continues to load in a host that ignores Caspian fields (graceful degradation requirement). No Caspian field is load-bearing for artifact visibility in a non-Caspian-aware host.
- **NFR17** — The `caspian` CLI operates on any machine with Node.js ≥20 (current LTS) installed; no Claude Code is required. Vendor-neutrality is a measurable invariant of the v1.0 release: the CLI runs on a minimal Node container against the canonical fixture set with no Claude Code dependency present.
- **NFR18** — Casper-shipped slash-command `description` fields place the trigger phrase in the first sentence and respect the 1 536-character truncation budget imposed by Claude Code's auto-activation discovery.

### Reliability

- **NFR19** — The `caspian` CLI is deterministic: identical inputs always produce identical outputs (exit code and diagnostic content). No time-dependent, random, or external-state-dependent behavior is introduced.
- **NFR20** — The CLI has no runtime dependency on external services. Validation proceeds offline.
- **NFR21** — The canonical fixture set (valid + invalid) runs in CI for every PR to the spec repository. Zero regressions on the valid-fixture set is a hard release gate for every version bump.

### Compatibility / Versioning

- **NFR22** — Schema evolution is BACKWARD_TRANSITIVE within a major version: producers may write at the latest minor version; consumers must accept the current minor and all prior minor versions. No breaking changes between minor versions within the same major.
- **NFR23** — Claude Code plugin format compatibility: casper-core's plugin manifest conforms to the Claude Code plugin spec as of v1.0 release. If Claude Code's plugin format evolves in a breaking way, casper-core ships a compatibility patch on a best-effort basis (no hard SLA, given solo-BDFL governance).
- **NFR24** — The canonical doc URL (`caspian.dev`) preserves stable anchor IDs per spec concept across spec minor versions. Anchor renames require a redirect until two subsequent minor versions have shipped.
