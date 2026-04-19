---
title: "Product Brief Distillate: Caspian & Casper"
type: llm-distillate
source: "product-brief-caspian.md"
created: "2026-04-19"
purpose: "Token-efficient context for downstream PRD creation"
---

# Distillate: Caspian & Casper

Dense, PRD-grade context. Each bullet self-contained; reader not assumed to have the brief loaded.

## Naming & Branding

- **Caspian** = the open specification (acronym expansion: *Composable Agent Skill Protocol / Interoperable Artifacts Network*). Written as a pronounceable word, no hyphen.
- **Casper** = the reference implementation plugin (acronym expansion: *Composable Agent Skill Protocol Example Reference*).
- Canonical package / repo / registry names use unhyphenated `caspian` / `casper` (GitHub, npm, PyPI) — defensive naming against tokenization drift.
- Spec ≠ plugin by design; downstream docs must never conflate them.

## Core Spec Fields (Caspian Core)

- **Four load-bearing frontmatter fields** define the contract: `schema_version`, `type`, `status`, `requires`, `produces`.
- `schema_version` (required, string) — semver minor (`"0.1"` at v1.0). Producers write latest, consumers accept current + prior minors. BACKWARD_TRANSITIVE evolution.
- `type` (required, string) — namespaced artifact type (e.g. `core:story`). Open taxonomy — any namespace allowed.
- `status` (required, enum) — `draft | active | superseded | archived`. Two-way pointers `superseded_by` / `supersedes` for linked supersession.
- `requires` (optional, array) — list of `{type, status?, tags?, count?}` preconditions.
- `produces` (optional, object) — `{type, status?}` output descriptor.
- **Agent-Skills-compatible**: every Anthropic SKILL.md field (`name`, `description`, `when_to_use`, `allowed-tools`, etc.) remains valid.
- **Extension escape hatch**: `x-*` prefix reserved for vendor/future fields; documented from day 1 as fallback if Claude Code ever rejects unknown frontmatter.

## Artifact-Type Registry (Extensible, Namespace-Driven)

- **Not a closed enum.** Caspian rejects the xkcd-927 failure mode by using namespaces, not walls.
- `core:*` namespace — canonical types shipped with spec: `core:adr`, `core:convention`, `core:learning`, `core:glossary`, `core:overview`, `core:epic`, `core:story`, `core:plan`, `core:review`, `core:rule`, `core:scratch`.
- **Author-defined namespaces** — any skill author may declare types under their own prefix (e.g. `bmad:persona`, `acme:design-spec`). No central registry approval.
- **Context-effective registry** — at runtime / validation, the effective type registry for a project = union of types declared by installed skills. Emerges from composition, not from decree.
- **Validator behavior** — warn on unregistered types, never reject. Authors retain freedom; ecosystem still gets gentle pressure toward canonical types.
- Design rationale for `core:*` selection must be documented per type (sources: BMad, Agent OS, industry ADR pattern) to prevent bikeshedding.

## Memory Profile (Opinionated Overlay)

- Adds `memory_scope` field (array of enum values) for progressive-disclosure context loading.
- **MVP `memory_scope` enum values**: `glossary | overviews | adr-summaries | adrs-by-tag | conventions | learnings-by-tag`. Extensible via minor spec bump.
- **Two-tier memory layout**:
  - `memory/project/` — permanent / curated: `adr/*.md`, `convention/*.md`, `learning/*.md`, `glossary.md`, `overview/{product,technical}.md`, `rule/*.md`.
  - `memory/backlog/epic-NNN/` — ephemeral per-epic: `epic.md`, `story-NNN-slug.md`, `story-NNN-slug-plan.md`, `story-NNN-slug-review.md`, `context.md`, `scratch/`.
- Root pointer files: `ACTIVE.md`, `BACKLOG.md`, `INDEX.md` (auto-maintained).
- **Shared read, partitioned write** — no cross-epic dependencies.
- **Progressive disclosure rule**: frontmatter = index line (INDEX.md), body = on-demand content, referenced files = deep dive. Never duplicate body into frontmatter (no `summary:` field); never bury metadata in body.
- **Profile adoption is optional** — Core can be adopted standalone without Memory Profile. Non-adopters of Profile ignore `memory_scope` without penalty.

## Casper — Reference Implementation Split

- **casper-core (v1.0, MVP)** — minimal reference proving `requires → produces` chain:
  - 2–3 porcelain commands: `/init-project`, `/discover`, `/plan-story`.
  - Full end-to-end demonstration of the contract.
  - Claude-Code-specific surface (SessionStart hook, plugin manifest, slash-command registration) isolated in a `claude-code/` subdirectory.
  - Schemas, validator, vocabulary live at repo root — reusable by any other harness.
- **casper-full (v1.1)** — the full turn-key workflow:
  - 8 porcelain commands: `/init-project`, `/backlog`, `/discover`, `/plan-story`, `/implement`, `/reflect`, `/switch-epic`, `/abandon-epic`.
  - 6 plumbing skills: `state-manager`, `load-memory-scope`, `validate-artifact-frontmatter`, `extract-diff-patterns`, `explore-codebase`, `detect-domain-from-paths`.
  - `.workflow.yaml` user-editable config.
  - SessionStart lean-boot hook ≤500 tokens (hard cap).
  - Full Memory Profile wiring.
- **Token targets** (from brainstorming Phase 3): SessionStart ≤500 tokens hard; first command call 1.5–3K tokens soft; full story cycle 15–25K tokens indicative (overflow = `/discover` decomposition failure).
- **Frontmatter hard cap**: 4 KB per artifact.
- **Plugin-shipped agents restriction** — Claude Code does not allow `hooks`, `mcpServers`, `permissionMode` in plugin-shipped agents. Casper design must route around this.

## Validator Stack (Defense-in-Depth)

- **Four validation layers**, each catching a distinct failure mode:
  - **Author-time (IDE)** — VSCode YAML Language Server + `yaml.schemas` mapping via `redhat.vscode-yaml` extension. Live errors as author types.
  - **Commit-time (CI)** — `claude plugin validate` + `ajv` (Node) as hard gate. Reusable GitHub Action `caspian/validate-action` (v1.1) lets authors adopt in 3 YAML lines.
  - **Runtime** — `validate-artifact-frontmatter` plumbing skill + `PreToolUse(Write)` hook on `memory/**/*.md`, fail-closed on invalid writes.
  - **Install-time** — `claude plugin validate` runs on plugin install (host-level).
- **Canonical published schema format**: JSON Schema. Zod/Pydantic are implementation-detail-only, language-bound.
- **Validation coverage matrix** (error × layer):
  - Typo in known field → caught by all 4.
  - Invalid enum value → caught by all 4.
  - Unknown field → IDE warn, CI strict, runtime strict, install ignored.
  - YAML parse error → all 4 (install loads with no metadata).
  - BOM prefix → CI + runtime catch, IDE misses.
  - Invalid status transition → only runtime catches.
  - Broken `superseded_by` pointer → CI (custom linter) + runtime.
- **Vendor-neutral `caspian` CLI** (v1.0) — no Claude Code dependency. Lets Cursor/Continue/OpenAI-skill authors verify Core compliance outside Claude Code.

## Scope Signals — v1.0 / v1.1 / Later

**v1.0 (MVP — spec stands alone)**
- Caspian Core stable: spec prose, JSON Schemas, `spec/CHANGELOG.md`, `core:` canonical vocabulary, extensible-registry conformance rules.
- Vendor-neutral `caspian` CLI validator.
- casper-core reference plugin (2–3 commands, Claude-specific surface isolated).
- Licenses: CC-BY-4.0 (spec prose), Apache-2.0 (schemas, validator, Casper code).

**v1.1 (adoption gate)**
- Caspian Memory Profile stable.
- casper-full (8 commands / 6 skills / SessionStart / validator stack).
- Unix Interop Test scripted.
- JSON Schema Store PR submitted.
- `caspian/validate-action` GitHub Action.
- **Conformance badge levels** (e.g. *Core-declared* / *Core-validated* / *Profile-compliant*) + JSON manifest for author signalling + user filtering.

**Post-v1.1**
- Multiple independent reference implementations (second harness-bound or CLI-only) to validate spec portability.

**Anti-goals (explicitly out of scope)**
- Not an MCP replacement (MCP = agent↔tool; Caspian = skill↔skill via typed artifacts).
- Not a methodology framework (no prescribed process).
- Not a competitor to Agent Skills (overlay-compatible, not a fork).
- Not a memory runtime (file-level frontmatter only; Mem0/Letta/Zep keep runtime role).

**Out of scope for the brief itself** (flagged during review, intentionally deferred)
- Benchmark measuring declarative `requires`/`produces` vs description-based orchestration inference — not committed as deliverable.
- "Known Hard Problems" section (dependency resolution, cycles, artifact-type versioning, conflict handling, enforcement semantics) — left to this distillate, but not addressed yet. PRD must pick these up.

## Rejected Ideas (Do Not Re-Propose)

- **MCP for skill-to-skill composition** — rejected. MCP is agent↔tool only. Skill composition stays artifact-based (typed files + frontmatter). Confirmed in domain + MCP integration research.
- **Open type taxonomy with no namespace discipline** — rejected implicitly. Extensibility without `core:` / vendor namespaces degenerates into xkcd 927.
- **`x-*` prefix as default extension in MVP** — documented as escape hatch only. Not applied in v1.0 because Claude Code currently accepts unknown frontmatter silently.
- **Steering Committee at v1.0** — rejected. Premature: zero active external contributors. BDFL + RFC process initially.
- **Closed 11-type enum in Core (as originally prototyped in brainstorming)** — rejected in favor of namespace-based extensible registry. Closed enum stays only inside Memory Profile, where opinionation is the point.
- **Fixed date for BDFL → Steering Committee transition** — rejected by user. Transition is activity-triggered, no timeline.
- **Tight LSP/EditorConfig framing as predictive analog** — softened. Both rode platform backing Caspian does not have. Realistic analog: prettier / prospector (3–5 year adoption curves).
- **"Under five minutes" time-to-value claim** — removed. Unmeasured, aspirational.
- **Citing "61% of devs don't trust AI output" stat in problem statement** — removed. Unsourced, loosely connected to orchestration thesis.

## Technical Constraints & Footguns

- **YAML 1.2, UTF-8, NO BOM**. BOM = silent skill-load failure (see Codex Issue #13918). Validator strips or rejects early.
- **YAML footguns to reject**: tab indentation, unquoted booleans (`on`/`off`/`yes`/`no`), unquoted colons in descriptions, empty-to-`null` silent coercion. Safe-load mandatory.
- **Frontmatter size cap**: 4 KB hard, to prevent YAML bombs.
- **Path-traversal rejection in pointers** — no `..`, no absolute paths in `superseded_by` / `supersedes` / artifact references.
- **Auto-activation discoverability**: driven solely by skill `description` field. Combined `description + when_to_use` truncated at 1,536 chars; total skill-listing budget ~1% of context (fallback 8,000 chars, override via `SLASH_COMMAND_TOOL_CHAR_BUDGET`). "Use when…" convention is cross-framework best practice; trigger phrase must be in first sentence or gets truncated.
- **Forward-compatibility risk**: Claude Code currently accepts unknown frontmatter silently. If the host ever becomes strict, extension fields (`requires`, `produces`, `memory_scope`) break. Fallback = `x-*` namespacing, pre-documented in spec.
- **Validator stack drift risk** — four layers means four places schemas can drift out of sync. Mitigation: single source of truth (JSON Schema file) that all layers reference.
- **Documented field count discrepancy** — Claude Code SKILL.md actually supports ≥11 frontmatter fields in 2026 (`name`, `description`, `when_to_use`, `argument-hint`, `disable-model-invocation`, `user-invocable`, `allowed-tools`, `model`, `effort`, `context` with value `fork`, `agent`, `hooks`, `paths`, `shell`). Superpowers Issues #195/#882 incorrectly claim only 2 are supported — doc bug Caspian spec should counter with a clear compatibility table.

## Competitive Intelligence

- **Anthropic Agent Skills (agentskills.io)** — official open standard (Dec 2025). Cross-vendor in <3 months (OpenAI, Microsoft, Cursor, GitHub, Atlassian, Figma). Covers ONLY SKILL.md frontmatter (`name`, `description`, `disable-model-invocation`, `model`, `version`). Gap = agents, commands, memory docs, composition semantics.
- **wshobson/agents, claude-code-templates (davila7), ComposioHQ/awesome-claude-plugins, rohitg00/awesome-claude-code-toolkit** — large curated collections (72+ plugins, 31K+ stars; 135+ agents / 176+ plugins; 101 in official marketplace). Ship ad-hoc author-defined frontmatter. No cross-author schema.
- **BMad-Method / GitHub Spec Kit / Kiro / Agent OS** — incumbent spec-driven frameworks (BMad ~37K⭐, Spec-kit ~71K⭐, Superpowers ~57K⭐, Agent Skills ~73K⭐). All silotéd — no interop between them. Positioning opportunity: Caspian sits *underneath* as shared substrate.
- **MCP (Model Context Protocol)** — Linux Foundation-hosted (10K+ servers, 97M monthly SDK downloads). 2026 roadmap adds `.well-known` MCP Server Cards for static capability discovery. **Complementary** to Caspian, not competitive: MCP = tool/server discovery; Caspian = authoring-layer skill frontmatter.
- **Memory runtime frameworks** — Mem0, Letta/MemGPT, Zep, LangMem. Converging on episodic/semantic/procedural scope vocabulary but **zero interop on file format**. Memory Profile is the greenest greenfield.
- **Market state** — pre-consolidation. Gartner predicts 40% of today's agents won't survive to 2027. Top 4 frameworks hold most attention; none locked in.
- **Sentiment signals** — "BMAD sucks" threads surface methodology fatigue. Superpowers occupies "same quality, lower tokens" niche — competitive on efficiency axis. Trust collapse (29% dev-trust in AI output, down from ~70% in 2023) is a tailwind for typed-artifact + precondition approaches.
- **Precedents that actually stuck** — LSP (2016, Microsoft platform backing), EditorConfig, OpenAPI, robots.txt, CODEOWNERS. Common pattern = narrow scope + canonical reference + single-file adoption cost.
- **Security context** — Snyk audit found prompt injection in 36% of published skills; no package-signing standard in the ecosystem. Caspian's structural defenses (closed enums in Profile, validated pointers, size caps, BOM rejection, safe YAML) help but cannot solve supply-chain trust.

## Adoption / Distribution Plan

- **Spec distribution target**: JSON Schema Store PR. Zero-config IDE validation in every editor that consumes the store. Accepted PR is a v1.1 deliverable.
- **Casper distribution target**: official Anthropic plugin marketplace (curated, quality signal). Acceptance is not a formal success criterion but is a strategic goal.
- **Mutual reinforcement** — spec README links to Casper; Casper README points to spec. Spec pulls in authors; plugin pulls in users.
- **Seed outreach** — continuous in parallel with dev, not a pre-v1.0 gate:
  - Launch post (platform TBD — prefer known dev outlet over personal blog for SEO seeding).
  - PRs into `awesome-claude-code`, `awesome-agent-skills`, `awesome-claude-plugins` with Caspian and Casper entries.
  - Direct conversation with ≥1 framework maintainer (likely BMad — user already uses it) before v1.1.
  - Engagement on `r/ClaudeAI`, HN, and Claude Code community channels.
- **Proactive upstreaming** — `requires` / `produces` proposals submitted to `agentskills.io` before v1.0. Convergent path is preferred path.

## User Scenarios (Detailed)

- **The "4-plugin composition" scenario** (driving use case): user installs BMad (brainstorming), Superpowers (planning), Anthropic's frontend plugin, a custom design skill. Today: user must memorize every skill's trigger phrase and drive orchestration manually. With Caspian: each skill declares `requires`/`produces`; runtime (or a Caspian-aware orchestrator skill) surfaces the right skill at the right moment. Workflow becomes discoverable.
- **The turn-key-but-modifiable scenario**: user clones Casper, runs `/init-project`, starts shipping immediately. When an opinion doesn't match (e.g. prefers different planning style), user overrides the `/plan-story` command locally without forking the plugin — because all state and artifacts are declared, not hidden.
- **The plugin-author adoption scenario**: author of an existing plugin adds `requires`/`produces` to frontmatter. Gets composability with Casper and future Caspian-aware harnesses. Cost ~5 lines per artifact; payoff = discoverability + cross-plugin users.
- **The framework-maintainer adoption scenario**: maintainer of BMad/Superpowers emits Caspian-compliant frontmatter in their generated artifacts. Cost = small diff per artifact type. Payoff = users can mix their framework with others, not just use it in isolation.
- **The regulated-domain scenario**: team in a regulated context needs audit trail of AI-driven work. Caspian's `requires`/`produces` lineage = free provenance graph, no extra instrumentation. Value prop for enterprise-adjacent users.
- **The testable-skill scenario**: harness uses declared `requires` to generate fixtures, runs skill, asserts declared `produces`. Skills become unit-testable. Closes a long-standing gap in agentic-framework tooling.

## Governance & Licensing

- **Licensing (dual)**:
  - Spec prose (`spec/*.md`) — **CC-BY-4.0** (Creative Commons, attribution required; designed for prose documents).
  - JSON Schemas, vendor-neutral `caspian` CLI, Casper reference plugin code — **Apache-2.0** (explicit patent grant, corporate-friendly, same license as OpenAPI / Kubernetes / MCP).
  - Single `LICENSE` at repo root links both.
- **Governance model (v1.0)** — BDFL (founding author) with RFC process.
  - Non-trivial spec changes (new field, enum extension, status transition semantics, breaking schema changes) require an RFC in `spec/proposals/NNNN-slug.md`.
  - RFC template includes: motivation, alternatives considered, backward-compat plan, migration path.
  - Discussion happens in issue / PR; BDFL merges or declines.
- **Governance evolution** — project commits to transitioning to a Steering Committee as external contribution activity grows. **No fixed timeline** (user choice). Written commitment in repo README; conflict-resolution procedure published even under BDFL.
- **Schema evolution policy** — BACKWARD_TRANSITIVE (Confluent terminology): every artifact carries `schema_version`; producers write at latest; consumers accept current + all prior minors; additive-only between minor versions; major bumps require deprecation cycle + migration script.
- **Trademark / naming** — `caspian` / `casper` reserved on npm, PyPI, crates.io, GitHub orgs even without published packages — defensive registration.

## Risks & Open Questions

**Primary risk: Anthropic absorption**
- Anthropic may extend Agent Skills to cover agents, commands, memory itself. Caspian becomes redundant.
- **Sunset protocol committed**: if `agentskills.io` ships equivalent fields under different names, Caspian aliases them and deprecates its own within two minor releases. Absorption risk converted from existential to planned.
- Proactive upstreaming of `requires`/`produces` to agentskills.io begins before v1.0.

**Secondary risks**
- **Fragmentation via namespace sprawl** — `bmad:persona` vs `superpowers:persona` with incompatible semantics. Mitigation = gentle validator warn on unregistered types + published design rationale for `core:*` vocabulary. Accepted as residual risk.
- **BDFL bus factor** — single-maintainer project stalls on disengagement. Mitigation = RFC process (decisions are traceable, successor can pick up) + early outreach to external contributors. Residual risk stays until governance transitions.
- **Validator stack drift** — four layers, four places schemas can diverge. Mitigation = single JSON Schema file all layers reference.
- **MCP scope creep** — if MCP expands into skill↔skill artifact passing, Caspian's positioning weakens. Mitigation = published quarterly "scope boundary review" as governance practice.
- **Naming collision (Casper / Caspian)** — user chose to keep the names. Defensive registration + canonical unhyphenated spelling everywhere accepted as sufficient mitigation. Residual SEO cost absorbed.
- **Description-based orchestration absorbing the need for declarative preconditions** — flagged by review, deprioritized by user. Not addressed in v1.0 / v1.1. Revisit if benchmark evidence emerges.

**Open questions for PRD**
- Exact `requires` resolution semantics — how does an orchestrator resolve `{type, status?, tags?, count?}`? Greedy first-match? User prompts for choice? Cycles?
- Conflict handling — two skills `produces` same type/status concurrently; what's the merge policy?
- Artifact-type versioning — how does `core:story` v1 vs `core:story` v2 coexist? Implicit via `schema_version` on the artifact, or explicit type versioning?
- Enforcement semantics — is a Caspian-aware orchestrator REQUIRED to refuse to run a skill whose `requires` are unsatisfied? Or is enforcement advisory?
- Runtime-honoring harnesses — beyond Casper, who is the second implementation, and what contract with it do we want by v1.1 to prove portability?
- Interaction with `/discover` decomposition — what happens when a skill's `requires` cannot be satisfied by existing artifacts? Does `/discover` trigger prerequisite skills, or does it surface a blocker to the user?

## Recommended Next Step

- Use this distillate + the executive brief (`product-brief-caspian.md`) as input for **PRD creation**. Caspian Core spec + casper-core plugin is the natural first PRD scope; Memory Profile + casper-full is a second PRD.






