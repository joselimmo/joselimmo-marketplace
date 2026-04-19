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

**Caspian** — *Composable Agent Skill Protocol / Interoperable Artifacts Network* — is an open specification that closes this gap with a minimal frontmatter contract: `schema_version`, `type`, `status`, `requires`, `produces`. These fields turn any agent, skill, command, or memory document into a typed, composable unit. The contract is Agent-Skills-compatible by construction: every Anthropic-standard field remains valid.

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

- **Contract stability** — schema evolution is BACKWARD_TRANSITIVE between v1.0 and v1.1: additive-only, no breaking changes to `schema_version`, `type`, `status`, `requires`, `produces`.
- **Validator correctness** — the `caspian` CLI implements the full validation coverage matrix for its layer (YAML parse errors, BOM rejection, size cap enforcement, schema conformance, enum strictness, unknown-field handling, path-traversal rejection in pointers). Zero false positives on the canonical fixture set shipped with v1.0.
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

- **Spec artifacts** — Caspian Core spec prose, JSON Schemas for all artifact types, `spec/CHANGELOG.md`, canonical `core:*` vocabulary (`core:adr`, `core:convention`, `core:learning`, `core:glossary`, `core:overview`, `core:epic`, `core:story`, `core:plan`, `core:review`, `core:rule`, `core:scratch`), extensible-registry conformance rules.
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

**Rising action.** She picks one of her skills, adds five lines of frontmatter: `schema_version: "0.1"`, `type: maya:lint-rule`, `requires: [{type: core:plan}]`, `produces: {type: core:review}`. Runs `caspian validate ./skills/` locally. Gets a clean pass.

**Climax.** She ships a minor version. A week later a Casper user opens an issue: *"your skill now surfaces automatically after `/plan-story` — I didn't have to memorize the trigger."*

**Resolution.** Maya adds Caspian frontmatter to her four other skills over the weekend. Adoption cost: roughly five lines per artifact. Payoff: her plugins stop being isolated islands.

**Requirements revealed** — spec docs readable in under ten minutes; canonical `core:*` vocabulary unambiguous; `caspian` CLI ergonomic (`validate <path>`); namespace convention (`<vendor>:<type>`) documented; strict-but-friendly error output; overlay-compatibility (host ignoring the fields still loads the skill).

### Journey 2 — Tomás ships his first story with Casper *(Secondary user — developer on Claude Code, happy path)*

**Persona.** Tomás, backend engineer in a three-person team. Pragmatic, limited patience for tooling ceremony. Wants to try an opinionated workflow before committing.

**Opening scene.** Tomás runs `/plugin install casper-core@anthropic-marketplace` from Claude Code. Reads the README: three commands, isolated Claude-Code surface, overlay spec underneath.

**Rising action.** He runs `/init-project` on a fresh repo. Casper seeds a minimal project overview artifact (`type: core:overview`) — not a full memory scaffold, just enough to demonstrate the chain. Runs `/discover` to articulate a small feature; an epic + story artifact are written (`type: core:epic`, `type: core:story`, `status: active`). Runs `/plan-story`; the command's frontmatter declares `requires: [{type: core:story, status: active, count: 1}]`, which Casper satisfies from the active story. He gets a `core:plan` artifact back, cleanly typed.

**Climax.** He implements the story manually using his usual tools, validates his edits with `caspian validate` against the produced plan, commits.

**Resolution.** "Nothing magic — just things in the right order. And I can see each artifact." He keeps Casper for his side projects.

**Requirements revealed** — `/init-project`, `/discover`, `/plan-story` porcelain behavior; minimal artifact seeding in v1.0 (no full Memory Profile yet); `requires` resolution semantics ("active story, count 1"); typed artifact files on disk; human-readable diagnostics.

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

**Rising action.** CI runs `caspian validate ./skills/`. The CLI exits non-zero with a precise diagnostic:

```
skills/plan-feature/SKILL.md:7 — unknown field "requrires"
  hint: did you mean "requires"?
  doc: https://caspian.dev/spec/core#requires
```

**Climax.** The PR is blocked by the failed status check. Contributor sees the diagnostic inline in the PR Checks tab.

**Resolution.** Contributor fixes the typo, pushes again, CI goes green. Cost: under a minute lost, one bug caught before merge.

**Requirements revealed** — `caspian` CLI supports directory / glob input; exit codes suitable for CI gating (`0` = pass, non-zero = fail); diagnostics include file + line + field name + suggestion + doc link; CLI runs without Claude Code installed (CI runners are vanilla Linux); strict-mode on unknown fields (vs permissive — consistent with validator coverage matrix).

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

- **Anthropic Agent Skills (`agentskills.io`, Dec 2025)** — official open standard. Cross-vendor adoption in under three months (OpenAI, Microsoft, Cursor, GitHub, Atlassian, Figma). Covers SKILL.md frontmatter only (`name`, `description`, `disable-model-invocation`, `model`, `version`). Caspian fills the gap above: agents, commands, memory documents, composition semantics. Overlay-compatible by construction — every Agent Skills field remains valid inside a Caspian-conformant artifact.
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
