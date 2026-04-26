---
workflow: bmad-check-implementation-readiness
date: 2026-04-26
project: joselimmo-marketplace-bmad
stepsCompleted:
  - step-01-document-discovery
  - step-02-prd-analysis
  - step-03-epic-coverage-validation
  - step-04-ux-alignment
  - step-05-epic-quality-review
  - step-06-final-assessment
status: complete
completedAt: 2026-04-26
verdict: READY
criticalIssues: 0
majorIssues: 0
minorConcerns: 4
documentsInventoried:
  prd: _bmad-output/planning-artifacts/prd.md
  architecture: _bmad-output/planning-artifacts/architecture.md
  epics: _bmad-output/planning-artifacts/epics.md
  ux: N/A (CLI plugin marketplace - no GUI surface)
supportingDocuments:
  - _bmad-output/planning-artifacts/product-brief-caspian.md
  - _bmad-output/planning-artifacts/product-brief-caspian-distillate.md
  - _bmad-output/planning-artifacts/research/
---

# Implementation Readiness Assessment Report

**Date:** 2026-04-26
**Project:** joselimmo-marketplace-bmad

## Step 1 — Document Discovery

### Files Selected for Assessment

| Type | Path | Size | Modified | Format |
|------|------|------|----------|--------|
| PRD | `_bmad-output/planning-artifacts/prd.md` | 66 KB | 2026-04-26 14:30 | whole |
| Architecture | `_bmad-output/planning-artifacts/architecture.md` | 93 KB | 2026-04-26 14:21 | whole |
| Epics & Stories | `_bmad-output/planning-artifacts/epics.md` | 120 KB | 2026-04-26 17:30 | whole |
| UX Design | — | — | — | **MISSING** |

### Supporting Context (read-only reference)

- `product-brief-caspian.md` — original product brief
- `product-brief-caspian-distillate.md` — distilled brief
- `research/` — 6 domain & technical research reports (agentic workflows, frontmatter schemas, MCP integration, plugin architecture, SessionStart hooks, subagents)

### Issues Identified

- ✅ **No duplicates** — no `whole + sharded` coexistence detected.
- ⚠️ **UX document missing** — no `*ux*.md` file or sharded folder. Pending user confirmation that UX is N/A for a CLI plugin marketplace (no GUI surface).

### Status

Step 1 complete. Proceeding to Step 2.

---

## Step 2 — PRD Analysis

PRD source: `_bmad-output/planning-artifacts/prd.md` (600 lines, status: complete, lastEdited 2026-04-26).
Project classification: `developer_tool` / `cli_tool`, complexity `medium`, context `greenfield`.
Scope: Caspian Core v1.0 + casper-core v1.0 (Memory Profile and casper-full deferred to a separate v1.1 PRD).

### Functional Requirements

#### Spec Contract Authoring

- **FR1**: Any artifact author can declare the Caspian Core contract in YAML frontmatter — `type` (required), `requires` (optional), `produces` (optional), and `schema_version` (optional in v1.0; defaults to `"0.1"` when absent; producers writing against v0.2+ MUST declare `schema_version` explicitly).
- **FR2**: Any artifact author can express typed preconditions via `requires`, specifying the required artifact type, optional tags, and optional count.
- **FR3**: Any artifact author can express typed postconditions via `produces`, specifying the produced artifact type.
- **FR4**: Any artifact author can use canonical `core:*` types or define their own vendor/author-namespaced types (e.g. `bmad:epic`, `maya:lint-rule`).
- **FR5**: Any artifact author can include agentskills.io canonical fields (`name`, `description`, `license`, `allowed-tools`, `metadata`, `compatibility`) and Claude Code overlay fields (`when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `model`, `effort`, `context`, `agent`, `hooks`, `paths`, `shell`) alongside Caspian fields without conflict.
- **FR6**: Any artifact author can reserve vendor or experimental extensions via the `x-*` frontmatter prefix.

#### Artifact Validation

- **FR7**: A plugin author can validate a single file, a directory, or a glob with one `caspian validate <path>` invocation.
- **FR8**: A plugin author can request machine-readable validation output (`--format=json`) suitable for programmatic CI consumption.
- **FR9**: A plugin author receives diagnostics that include file, line number, field name, an edit-distance suggestion for unknown fields, and a doc link to a stable anchor on `caspian.dev`.
- **FR10**: A plugin author receives exit codes that distinguish *all artifacts valid* (`0`) from *at least one artifact invalid* (non-zero).
- **FR11**: A plugin author can run the validator on a system without Claude Code installed (vendor-neutrality guarantee).
- **FR12**: A plugin author can rely on the validator to reject syntactically invalid artifacts — YAML parse errors, BOM prefix, non-UTF-8 encoding, tab indentation in frontmatter, unquoted YAML 1.1 boolean coercion (`on`/`off`/`yes`/`no`), and frontmatter exceeding 4 KB. Frontmatter fields outside the recognized allow-list are emitted as **warnings**, not errors (warn-on-unknown policy).
- **FR13**: A plugin author can use vendor or author-namespaced types (e.g. `bmad:persona`) and receive validator warnings rather than rejections on unregistered types (extensible-registry behavior).
- **FR14**: A plugin author's artifacts are checked against canonical JSON Schema (Draft 2020-12) references that serve as single source of truth for every validation layer.

#### Reference Workflow (casper-core)

- **FR15**: A developer can bootstrap a greenfield project with `/init-project`, producing a typed `core:overview` artifact on disk.
- **FR16**: A developer can articulate a feature with `/discover`, producing typed `core:epic` and `core:story` artifacts on disk.
- **FR17**: A developer can generate an implementation plan with `/plan-story`, which declares `requires: [{type: core:story, count: 1}]` and produces a typed `core:plan` artifact on disk.
- **FR18**: A developer can run the full `/init-project` → `/discover` → `/plan-story` chain end-to-end on a greenfield project with no manual artifact editing required between commands.
- **FR19**: A developer can operate casper-core under the single-active-story workspace convention (at most one active story at a time), with type-based `requires` matching sufficient for deterministic resolution.

#### Plugin Composition & Overrides

- **FR20**: A developer can override a plugin-shipped skill by placing a skill with the same `name` and contract (`requires`/`produces`) in the project's local `.claude/skills/` directory.
- **FR21**: A developer's local skill override survives plugin updates, provided the contract (`name`, `requires`, `produces`) of the overriding skill matches the upstream contract.
- **FR22**: A developer can install casper-core from the Anthropic plugin marketplace (`/plugin install casper-core@anthropic-marketplace`) or from a local path.

#### Governance & Evolution

- **FR23**: An external contributor can propose a non-trivial spec change (new field, enum extension, breaking schema change) via an RFC in `spec/proposals/NNNN-slug.md` using the published TEMPLATE.
- **FR24**: The RFC TEMPLATE requires the proposer to state four mandated sections: Motivation, Alternatives Considered, Backward-Compatibility Plan, and Migration Path.
- **FR25**: An external contributor can expect a documented BDFL response SLA (e.g. acknowledge within N days) and a published conflict-resolution procedure applicable even under BDFL governance.
- **FR26**: Merged RFCs appear as entries in `spec/CHANGELOG.md` with a semver bump, and contributors are credited in `CONTRIBUTORS.md`.
- **FR27**: Spec consumers can trust that artifacts written against an earlier minor version remain readable by later minor versions within the same major version (BACKWARD_TRANSITIVE schema evolution guarantee).

#### Distribution & Discoverability

- **FR28**: The Caspian spec is distributed as a GitHub repository containing prose, JSON Schemas, canonical vocabulary docs, and fixture sets, under the stated licenses (CC-BY-4.0 prose; Apache-2.0 schemas/code).
- **FR29**: The `caspian` CLI is distributed via npm under the unhyphenated `caspian` package name.
- **FR30**: The `casper-core` plugin is distributed via the official Anthropic plugin marketplace under the unhyphenated `casper` or `casper-core` name (acceptance is strategic, not a release gate).
- **FR31**: The `caspian.dev` website presents a single-page landing with the 30-second pitch, a 4-line frontmatter quickstart, and links to the spec GitHub repository, the CLI on npm, casper-core on the marketplace, CONTRIBUTING, and the RFC process.
- **FR32**: The `caspian.dev` website provides stable anchor IDs per spec concept (`#schema-version`, `#type`, `#requires`, `#produces`, `#core-vocabulary`) that the CLI's diagnostic doc links consume.

#### Developer Onboarding & Documentation

- **FR33**: A plugin author can read the core spec (`spec/core.md`) in ten minutes or less and grasp the four-field contract.
- **FR34**: A plugin author can consult a short rationale document for each canonical `core:*` type (`spec/vocabulary/<type>.md`) covering purpose, sources, and use boundaries.
- **FR35**: A plugin author can run a minimal adoption example (`spec/examples/minimal-skill-adoption/`) demonstrating the 4-line frontmatter delta applied to an existing Anthropic SKILL.md.
- **FR36**: A plugin author can copy a CI integration snippet (`spec/examples/ci-integration/`) that wires `npx caspian validate ./` into GitHub Actions in three YAML lines.
- **FR37**: A casper-core user can read a README that explains install, the three porcelain commands, the local-override pattern (Journey 3), and the explicit scope boundary.
- **FR38**: A plugin author can inspect the canonical fixture set (`fixtures/valid/*`, `fixtures/invalid/*`) shipped with the CLI as a reading reference.

**Total FRs: 38**

### Non-Functional Requirements

#### Performance

- **NFR1**: `caspian` CLI validates a 1 000-artifact repository in under 5 seconds on a standard developer laptop. I/O-bound; parallel I/O acceptable but not required.
- **NFR2**: CLI startup overhead under 500 ms on a warm Node runtime.
- **NFR3**: `caspian.dev` single-page site loads in under 2 s on 4G mobile from clean cache; DOMContentLoaded under 1 s on broadband.
- **NFR4**: Frontmatter parsing enforces a 4 KB hard cap per artifact.

#### Security

- **NFR5**: YAML safe-load only (YAML 1.2; no executable custom tags). Reject non-UTF-8 inputs and BOM-prefixed inputs.
- **NFR6**: CLI performs no network I/O at validate time. No telemetry. No remote schema fetching.
- **NFR7**: casper-core ships without `hooks`, `mcpServers`, or `permissionMode` in any plugin-shipped agent.
- **NFR8**: Defensive YAML constraints enforced at parse time: tabs rejected; unquoted `on`/`off`/`yes`/`no` rejected; >4 KB frontmatter rejected.
- **NFR9**: When pointer fields (`supersedes`/`superseded_by`) are introduced in a future spec version, path-traversal references (`..`, absolute paths) must be rejected. Documented in v1.0 as forward-compatibility commitment.

#### Accessibility

- **NFR10**: `caspian.dev` landing meets WCAG 2.1 Level AA (semantic HTML, contrast, keyboard nav, no color-only signals, skip-link, no auto-animation).
- **NFR11**: CLI produces human-readable diagnostics by default and `--format=json` on request.
- **NFR12**: Spec docs (Markdown) render accessibly via GitHub default renderer and on `caspian.dev`; no UI interaction required to read normative content.

#### Interoperability

- **NFR13**: Caspian frontmatter is fully overlay-compatible with Anthropic Agent Skills SKILL.md (every documented field remains valid).
- **NFR14**: JSON Schemas conform to JSON Schema Draft 2020-12; consumable by any compliant validator without extensions.
- **NFR15**: CLI integrates with GitHub Actions via standard exit codes and optional `--format=json` output, no custom Action required in v1.0.
- **NFR16**: Any skill/command respecting Caspian semantics continues to load in a host that ignores Caspian fields (graceful degradation).
- **NFR17**: CLI operates on any machine with Node.js ≥20 (current LTS); no Claude Code required. Vendor-neutrality is a measurable v1.0 invariant.
- **NFR18**: Casper-shipped slash-command `description` fields place the trigger phrase in the first sentence and respect the 1 536-character truncation budget.

#### Reliability

- **NFR19**: CLI is deterministic — identical inputs produce identical outputs (exit code + diagnostics). No time-dependent / random / external-state behavior.
- **NFR20**: CLI has no runtime dependency on external services. Validation proceeds offline.
- **NFR21**: Canonical fixture set runs in CI for every PR to the spec repository. Zero regressions on the valid-fixture set is a hard release gate.

#### Compatibility / Versioning

- **NFR22**: BACKWARD_TRANSITIVE schema evolution within a major version (no breaking changes between minor versions of the same major).
- **NFR23**: casper-core's plugin manifest conforms to the Claude Code plugin spec as of v1.0 release. Best-effort patches if format evolves breakingly.
- **NFR24**: `caspian.dev` preserves stable anchor IDs across minor versions. Anchor renames require a redirect maintained for two subsequent minor versions.

**Total NFRs: 24**

> **Note on omissions:** Scalability category is explicitly excluded by the PRD (no server, no multi-tenant, no user concurrency) — degenerate metrics avoided.

### Additional Requirements & Constraints

**Architectural / scope constraints (binding on epics):**

- Three artifact tracks ship in v1.0: **Caspian spec** (prose + schemas + vocabulary + fixtures), **`caspian` CLI** (Node/TypeScript, npm), **casper-core plugin** (Claude Code plugin format, marketplace).
- **Single source of truth**: JSON Schemas under `spec/schemas/` referenced by every validation layer.
- **Vendor-neutrality release gate**: CLI runs on a vanilla Linux container with no Claude Code installed against the canonical fixture set.
- **Claude-Code surface isolation in casper-core**: plugin manifest + slash-command registration in a dedicated subdirectory; schemas/validator/vocabulary at repo root.
- **Bootstrap order**: spec prose + schemas → CLI → website → casper-core. Circular dependency avoided because CLI validation is generic JSON Schema.
- **Fixture-first development**: every schema change starts with a fixture change.
- **Test discipline**: zero false positives on the valid-fixture set is a v1.0 release gate; every reported validator bug is replicated as a fixture before being fixed.
- **Node-only in v1.0**: Python/Go implementations are post-v1.1.
- **Defensive registration**: `caspian` and `casper` reserved on GitHub, npm, PyPI, crates.io even where unpublished.
- **Coordinated release**: spec, website, and CLI release together (same semver). casper-core follows its own semver but declares targeted Caspian `schema_version` in its plugin manifest.
- **Documentation deliverables**: `spec/README.md`, `spec/core.md`, `spec/CHANGELOG.md`, `spec/CONTRIBUTING.md`, `spec/proposals/TEMPLATE.md`, per-`core:*`-type vocabulary docs, CLI README, casper-core README, `caspian.dev` landing page.

**Anti-goals (must NOT appear in epics):**

- Not an MCP replacement.
- Not a methodology framework (no prescribed process).
- Not an Agent Skills competitor (overlay-compatible).
- Not a memory runtime.
- No orchestration benchmark (declarative vs description-based) as a committed deliverable.
- No non-Node CLI implementation in v1.0.
- No Memory Profile, casper-full, defense-in-depth validator stack, JSON Schema Store PR, GitHub Action `caspian/validate-action@v1`, or conformance badges in v1.0 (all v1.1).
- No `status`, `supersedes`, `superseded_by` fields in v1.0 (deferred to v0.2+ pending RFC).
- No per-`core:*`-type schemas in v1.0 (only envelope + diagnostic registry; per-type schemas deferred to v0.2+).

### PRD Completeness Assessment

**Strengths:**

- Comprehensive coverage of contract authoring, validation, reference workflow, governance, distribution, onboarding (38 FRs in 7 categories).
- NFRs cover Performance, Security, Accessibility, Interoperability, Reliability, Versioning with concrete, measurable targets (5 s for 1 000 artifacts, <500 ms startup, WCAG 2.1 AA, JSON Schema Draft 2020-12, BACKWARD_TRANSITIVE).
- Explicit anti-goals reduce scope-creep risk during epic decomposition.
- Architecture-driven amendments (2026-04-26 revision) are tracked in frontmatter — FR1, FR12, FR5, API surface, Product Scope, and Journey 6 already reconciled with architecture decisions.
- Single-active-story workspace convention (FR19) makes type-based `requires` resolution deterministic — removes a class of ambiguity.

**Gaps to verify in epic coverage validation:**

- The PRD references `caspian.dev` website extensively (FR31, FR32, NFR3, NFR10, NFR12, NFR24) — must verify it is treated as a first-class deliverable in the epics, not an afterthought.
- Defensive package registration (`caspian` + `casper` on GitHub/npm/PyPI/crates.io) is mentioned in MVP and Implementation Considerations but is not a numbered FR — must verify epic coverage.
- Vendor-neutrality release gate (FR11 + NFR17) requires a Claude-Code-free Linux container test — must verify this is an explicit story, not implicit.
- Fixture-first discipline is a process commitment — must verify epics order schemas → fixtures → CLI consistently.
- Outreach activities (PRs into `awesome-claude-code` / `awesome-agent-skills`, framework-maintainer conversations, `agentskills.io` upstream proposal) are scope items but not numbered FRs — must verify epic coverage.
- BDFL response SLA (FR25) is mandated but its concrete value (e.g. 7 days) is left open — to be defined during implementation, not a planning gap per se.

Step 2 complete. Proceeding to Step 3.

---

## Step 3 — Epic Coverage Validation

Epics source: `_bmad-output/planning-artifacts/epics.md` (1 681 lines, status: complete, completedAt 2026-04-26).
Inputs declared: PRD + Architecture (`_bmad-output/planning-artifacts/architecture.md`).
Structure: 5 epics + 28 stories (1.1–1.7, 2.1–2.8, 3.1–3.5, 4.1–4.3, 5.1–5.3).

### Epic Inventory

- **Epic 1 — Spec Foundation & Plugin-Author Adoption** (7 stories): monorepo scaffold + dual-license, `spec/core.md`, `core:*` vocabulary docs, envelope JSON Schema, diagnostic registry + registry schema, canonical fixture set, minimal-skill-adoption example.
- **Epic 2 — CLI Validator & CI Integration** (8 stories): `@caspian/core` skeleton, codegen (typed diagnostic constants + sha256 verify), 6-stage pipeline (stages 1–3 then 4–6), `caspian` CLI walker + human formatter, `--format=json` schema + golden snapshots, conformance suite + 3-layer vendor-neutrality enforcement, npm publish with provenance + `examples/ci-integration/`.
- **Epic 3 — Reference Workflow casper-core** (5 stories): plugin manifest + foundation, `/init-project`, `/discover`, `/plan-story`, end-to-end chain + override pattern + README.
- **Epic 4 — Discoverability via caspian.dev** (3 stories): landing page, diagnostics page generator from registry, GitHub Pages deployment + anchor-stability policy.
- **Epic 5 — Governance & Spec Evolution** (3 stories): spec-level RFC governance (`spec/CONTRIBUTING.md` + TEMPLATE), initial foundational proposal + `spec/CHANGELOG.md`, repo-level governance bundle + auto-CONTRIBUTORS.

### Sequencing & Dependencies (declared)

- **Hard dependency**: Epic 1 ships first (everyone consumes its outputs).
- **Parallelizable after Epic 1**: Epics 2, 3, 4, 5 mutually independent.
- **Recommended priority order**: Epic 1 → Epic 2 → Epic 5 → Epic 3 → Epic 4 (matches PRD cut-priority: spec/schemas → CLI → casper-core → website).

### FR Coverage Matrix

The epics document publishes its own FR Coverage Map. I verified each line against the PRD FR list independently.

| FR # | PRD topic | Epic claim | Independent verification | Status |
|------|-----------|------------|--------------------------|--------|
| FR1 | 4-field contract authoring | Epic 1 | Story 1.2 (`spec/core.md`) + Story 1.4 (envelope schema declares fields) | ✓ |
| FR2 | `requires` typed preconditions | Epic 1 | Story 1.2 + Story 1.4 (envelope schema sub-shape) | ✓ |
| FR3 | `produces` typed postcondition | Epic 1 | Story 1.2 + Story 1.4 | ✓ |
| FR4 | `core:*` + namespaced types | Epic 1 | Story 1.3 (vocabulary docs) + Story 1.2 (namespace rule) | ✓ |
| FR5 | agentskills.io + Claude Code overlay co-existence | Epic 1 | Story 1.4 (`additionalProperties: true` on envelope) | ✓ |
| FR6 | `x-*` extension prefix | Epic 1 | Story 1.2 (spec) + Story 2.4 (allow-list scan accepts `x-*`) | ✓ |
| FR7 | `caspian validate <path>` (file/dir/glob) | Epic 2 | Story 2.5 (walker + multi-file aggregation) | ✓ |
| FR8 | `--format=json` machine-readable output | Epic 2 | Story 2.6 (stable JSON schema + golden snapshots) | ✓ |
| FR9 | Diagnostics with file/line/field/suggestion/doc-link | Epic 2 (anchors served by Epic 4) | Stories 2.3–2.5 + Epic 4 Story 4.2 | ✓ |
| FR10 | Exit codes `0` vs non-zero | Epic 2 | Story 2.5 (CLI exit semantics) | ✓ |
| FR11 | Vendor-neutrality (no Claude Code dep) | Epic 2 | Story 2.7 (3-layer enforcement, docker release gate) | ✓ |
| FR12 | Reject syntax errors + warn on out-of-allow-list | Epic 2 | Stories 2.3 (parse) + 2.4 (allow-list scan) | ✓ |
| FR13 | Warn-on-unregistered-namespace types | Epic 2 | Story 2.4 (namespace check stage 5) | ✓ |
| FR14 | JSON Schema Draft 2020-12 single source of truth | Epic 1 | Story 1.4 + 3-verrou enforcement (consumed by Epic 2) | ✓ |
| FR15 | `/init-project` → `core:overview` | Epic 3 | Story 3.2 | ✓ |
| FR16 | `/discover` → `core:epic` + `core:story` | Epic 3 | Story 3.3 | ✓ |
| FR17 | `/plan-story` requires `core:story` → `core:plan` | Epic 3 | Story 3.4 | ✓ |
| FR18 | Chain end-to-end no manual editing | Epic 3 | Story 3.5 (end-to-end + README) | ✓ |
| FR19 | Single-active-story workspace convention | Epic 3 | Story 3.5 + commands' `requires` declarations | ✓ |
| FR20 | Local skill override pattern | Epic 3 | Story 3.5 (override pattern documented) | ✓ |
| FR21 | Override survives plugin updates | Epic 3 | Story 3.5 (contract-stable override) | ✓ |
| FR22 | Install via marketplace or local path | Epic 3 | Story 3.1 (manifest) + Story 3.5 (README) | ✓ |
| FR23 | RFC process via `spec/proposals/NNNN-slug.md` | Epic 5 | Story 5.1 | ✓ |
| FR24 | TEMPLATE with 4 mandated sections | Epic 5 | Story 5.1 (TEMPLATE.md) | ✓ |
| FR25 | BDFL response SLA + conflict-resolution procedure | Epic 5 | Story 5.1 (`spec/CONTRIBUTING.md`) | ✓ |
| FR26 | Merged RFCs → CHANGELOG + CONTRIBUTORS | Epic 5 | Story 5.2 (CHANGELOG) + Story 5.3 (auto-CONTRIBUTORS via changesets) | ✓ |
| FR27 | BACKWARD_TRANSITIVE | Epic 1 + Epic 5 | Story 1.2 (codified) + Story 5.1 (enforced at review) | ✓ |
| FR28 | GitHub repo + dual-licensing layout | Epic 1 | Story 1.1 (bootstrap + dual-license) | ✓ |
| FR29 | npm distribution under `caspian` package name | Epic 2 | Story 2.8 (npm publish with provenance) | ✓ |
| FR30 | Anthropic plugin marketplace distribution | Epic 3 | Story 3.1 (`plugin.json`) — manual submission | ✓ |
| FR31 | `caspian.dev` single-page landing | Epic 4 | Story 4.1 | ✓ |
| FR32 | Stable anchor IDs per spec concept | Epic 4 | Story 4.3 (anchor-stability policy) | ✓ |
| FR33 | Spec readable in ≤ 10 minutes | Epic 1 | Story 1.2 (`spec/core.md` length budget) | ✓ |
| FR34 | Per-`core:*` rationale docs | Epic 1 | Story 1.3 (vocabulary docs × 11) | ✓ |
| FR35 | `examples/minimal-skill-adoption/` | Epic 1 | Story 1.7 | ✓ |
| FR36 | `examples/ci-integration/` | Epic 2 | Story 2.8 (3-line GHA snippet) | ✓ |
| FR37 | casper-core README + override pattern | Epic 3 | Story 3.5 | ✓ |
| FR38 | Canonical fixtures as reading reference | Epic 1 | Story 1.6 (canonical fixture set) | ✓ |

### NFR Coverage Cross-Check

| Group | NFRs covered | Epic |
|-------|--------------|------|
| Performance | NFR1, NFR2 (tracked budgets, not release gates), NFR4 | Epic 2 |
| Performance | NFR3 | Epic 4 |
| Security | NFR5, NFR6, NFR8, NFR9 | Epic 2 |
| Security | NFR7 | Epic 3 |
| Accessibility | NFR10 | Epic 4 |
| Accessibility | NFR11 | Epic 2 |
| Accessibility | NFR12 | Epic 1 |
| Interoperability | NFR13, NFR14 | Epic 1 |
| Interoperability | NFR15, NFR16, NFR17 | Epic 2 |
| Interoperability | NFR18 | Epic 3 |
| Reliability | NFR19, NFR20, NFR21 | Epic 2 |
| Versioning | NFR22 | Epic 1 |
| Versioning | NFR23 | Epic 3 |
| Versioning | NFR24 | Epic 4 |

**NFR coverage: 24/24** (all NFRs are claimed by at least one epic).

### Missing Requirements

**Critical Missing FRs:** None.

**High Priority Missing FRs:** None.

### Reverse Check (FRs in epics but not in PRD)

The epics inventory enumerates FR1–FR38 only — the same set published in the PRD. No epic introduces an FR number outside the PRD range.

### Watch-List (not gaps, but worth verifying in deeper validation)

- **NFR1 + NFR2 reframed as "tracked budgets, not v1.0 release gates"** — the epics doc explicitly rewords the PRD's hard targets ("under 5 seconds", "under 500 ms") into deferred instrumentation. **This is a scope reduction** vs the PRD and should either be (a) accepted explicitly as a knowing trade-off captured in the PRD revisions log, or (b) reverted. Currently it sits silently between the two docs.
- **NFR23 ("best-effort patch on Claude Code plugin format breakage")** — the PRD's "no hard SLA" wording is preserved in the epic; consistent.
- **FR9 doc links depend on Epic 4** — Epic 2 emits URLs targeting `caspian.dev/diagnostics#caspian-eXXX`; Epic 4 owns the page. If Epic 4 is cut, URLs become dead links. The epics doc declares Epic 4 as "lowest blast radius if cut" — coherent risk, but worth flagging in the priority order.
- **Defensive package registration** (`caspian` + `casper` on GitHub/npm/PyPI/crates.io) — referenced in PRD MVP. Found in epics under "Governance & Documentation Artifacts" → `.github/SECURITY-OPS.md` (Story 5.3). Coverage confirmed but not via a numbered FR.
- **Outreach activities** (PRs into `awesome-claude-code` / `awesome-agent-skills`, `agentskills.io` upstream proposal, framework-maintainer outreach) — not tracked as stories. These are launch-day go-to-market actions, not engineering deliverables, so absence from the epic list is defensible — but the user should confirm they are tracked in a separate launch checklist.

### Coverage Statistics

- **Total PRD FRs:** 38
- **FRs covered in epics:** 38
- **Coverage percentage:** **100 %**
- **Total PRD NFRs:** 24
- **NFRs covered in epics:** 24 (with NFR1/NFR2 reframed as tracked budgets — see watch-list)
- **NFR coverage percentage:** **100 % (with reframing caveat)**

Step 3 complete. Proceeding to Step 4.

---

## Step 4 — UX Alignment

### UX Document Status

**Not Found** — by deliberate scope decision, not by oversight.

Confirming evidence:

- **PRD §"Project-Type Overview"** (line 333): *"Sections `visual_design` and `store_compliance` are skipped per CSV (not applicable to a spec + CLI + plugin)."*
- **PRD §"Developer Tool Specific Requirements"**: the three v1.0 surfaces are enumerated as CLI / spec prose / single-page static landing — **non-UI** by construction.
- **Epics §"Overview"** (line 31): *"No UX Design Specification was produced for v1.0 (the surfaces are CLI / spec prose / single-page static site — non-UI). UI-relevant accessibility and quality concerns are captured in NFR3, NFR10–NFR12."*
- **Epics §"UX Design Requirements"** (line 255): the section is present and explicitly states *"Not applicable"*, mapping the UI-adjacent concerns to NFR3 (load time), NFR10 (WCAG 2.1 AA), NFR11 (CLI dual human + JSON output), NFR12 (Markdown a11y).

### Implied-UI Assessment

| Question | Answer |
|----------|--------|
| Does the PRD mention a user interface? | Only the static `caspian.dev` landing page — no app, no dashboard, no interactive UI |
| Are web/mobile components implied? | No mobile. Single static landing page (Epic 4) is the only HTML surface |
| Is this a user-facing application? | No — it is a spec + CLI + Claude Code plugin + landing page |

### Alignment Issues

- **None.** The UI-adjacent surface (the `caspian.dev` landing) has its quality attributes pinned through NFRs (NFR3 perf, NFR10 WCAG 2.1 AA, NFR24 anchor stability) and is fully scoped under Epic 4 (Stories 4.1–4.3). The architecture does not need to support patterns that do not exist in scope.

### Warnings

- **None for v1.0.** The PRD itself flags that "If a UX spec is produced for v1.1 (casper-full + JSON Schema Store + CI Action + LSP layer), UX-DRs will be appended in a future revision of this document." Action recorded for v1.1 PRD scoping, not for v1.0 implementation readiness.

### Verdict

UX absence is **scoped, justified, and traceable in both PRD and epics**. Not a gap.

Step 4 complete. Proceeding to Step 5.

---

## Step 5 — Epic Quality Review

Validation against the create-epics-and-stories standards: user value, independence, story sizing, AC quality, dependencies, greenfield setup discipline.

### Epic Structure Validation

#### A — User Value Focus

| Epic | Title | User outcome stated | User-centric? |
|------|-------|---------------------|----------------|
| 1 | Spec Foundation & Plugin-Author Adoption | A plugin author reads the spec in ≤10 min and applies frontmatter | ✓ |
| 2 | CLI Validator & CI Integration | A plugin author installs `caspian`, runs `validate`, gates CI | ✓ |
| 3 | Reference Workflow casper-core | A Claude Code developer runs `/init-project` → `/discover` → `/plan-story` end-to-end | ✓ |
| 4 | Discoverability via caspian.dev | A visitor grasps Caspian in 30 s and clicks through; CLI doc URLs resolve | ✓ |
| 5 | Governance & Spec Evolution | An external contributor authors and ships an RFC | ✓ |

**No technical-milestone epics detected.** Epic 1 (which could have been "Set up monorepo + spec scaffolding" in a weak design) is reframed around author adoption — the bootstrap (Story 1.1) is necessary infrastructure subordinated to the user-facing deliverable.

#### B — Epic Independence

- **Epic 1** stands alone: spec + schemas + fixtures usable without the CLI (PRD risk-mitigation: *"the spec is written such that the JSON Schemas alone are useful without the CLI"*). ✓
- **Epic 2** depends on Epic 1's schemas + diagnostic registry + fixtures. Independent of Epic 3/4/5. ✓
- **Epic 3** depends on Epic 1 (contract). Independent of Epic 2 functionally (dogfooding is non-blocking). ✓
- **Epic 4** depends on Epic 1's `diagnostics/registry.json` + spec content. Independent of Epic 2/3/5; if Epic 4 is cut, only CLI doc URLs become dead links — no cascading break. ✓
- **Epic 5** depends on Epic 1. Independent of Epic 2/3/4. ✓

**No backwards dependency violations.** Each Epic N consumes only Epic N-k outputs (k ≥ 0). No "Epic 2 requires Epic 3" scenarios.

### Story Quality Assessment

#### A — Story Sizing

Distribution: 28 stories across 5 epics (avg 5.6 stories/epic). Each story scopes to a single deliverable (one file, one CLI feature, one command, one workflow). No "build the entire CLI" megastory; the CLI is decomposed across 8 stories in Epic 2 (skeleton → codegen → pipeline 1–3 → pipeline 4–6 → walker → JSON formatter → conformance → publish). Sizing is appropriate.

#### B — Acceptance Criteria Quality

**Format:** Every story uses **Given/When/Then BDD format** consistently. Every story declares a **As X / I want Y / So that Z** persona-driven preamble.

**Specificity:** ACs cite exact file paths (`schemas/v1/envelope.schema.json`, `packages/cli/package.json`), exact field names (`engines.node = ">=20.10"`), exact diagnostic codes (`CASPIAN-E001` through `CASPIAN-E014`, `W001`, `W002`, `W003`), exact byte boundaries (4096/4097 byte test in Story 2.3). No vague *"the system works"* criteria.

**Testability:** Every AC is independently verifiable. CI commands are named (`pnpm lint`, `pnpm test`, `pnpm depcruise`, `pnpm verify-codes-hash`, `pnpm ajv-validate-registry`, `pnpm conformance`, `pnpm verify-pack`).

**Edge cases:**

- Story 2.3 covers boundary precision (4096 vs 4097 bytes) and YAML attack vector (`!!python/object:` rejection).
- Story 2.5 covers a 4-state exit-code matrix (0/1/2/3) including internal exception path.
- Story 3.4 explicitly handles the unsatisfied-precondition case (zero active stories in workspace) and the multi-active-story scenario (deferred to v1.1 with explicit doc statement).
- Story 4.3 anticipates anchor renames (forward-looking redirect mechanism).
- Story 2.6 covers determinism (byte-identical JSON across runs) and key-ordering stability.

**Traceability:** ACs cross-reference FRs and NFRs inline (e.g., *"NFR4"*, *"FR9"*, *"PRD Journey 6 reference"*). Architecture decisions are linked back (e.g., *"architecture step-04"*, *"architecture step-06 boundary"*). Outstanding.

### Dependency Analysis

#### A — Within-Epic Dependencies

Within-epic ordering is logical and forward-only (Story N depends on Stories 1..N-1, never on Story N+k). Examples:

- Epic 1: 1.1 (bootstrap) → 1.2 (spec/core.md) parallel-with 1.3 (vocabulary) parallel-with 1.4 (envelope schema) parallel-with 1.5 (diagnostic registry) → 1.6 (fixtures consume 1.4 + 1.5) → 1.7 (example consumes 1.4).
- Epic 2: 2.1 (skeleton) → 2.2 (codegen consumes 2.1 + Story 1.5) → 2.3, 2.4 (pipeline stages consume 2.1, 2.2, 1.5) → 2.5 (CLI walker consumes 2.3, 2.4) → 2.6 (JSON formatter consumes 2.5) → 2.7 (conformance consumes 2.5) → 2.8 (publish gates on 2.6, 2.7).
- Epic 3: 3.1 (manifest) → 3.2, 3.3, 3.4 (commands, mutually independent) → 3.5 (README ties them together).
- Epic 4: 4.1 (landing) parallel-with 4.2 (diagnostics generator) → 4.3 (deployment consumes both).
- Epic 5: 5.1 (governance docs) → 5.2 (initial proposal references TEMPLATE from 5.1) parallel-with 5.3 (repo-level bundle).

#### B — Forward-Reference Pattern (Healthy Placeholders)

Story 1.1 contains three forward references that are explicitly marked and non-blocking:

- *"sub-package `tsconfig.json` files (added by Epic 2) extend this base"* — base config ships in Story 1.1; sub-packages added later.
- *"`.gitattributes` reserves the rule `codes.generated.ts merge=ours linguist-generated=true` (the file itself is created by Epic 2 Story 2.2)"* — rule pre-declared, no broken state.
- *"biome `noRestrictedImports` reserves the `**/schemas/**` lockdown placeholder (rule body activated by Epic 2's `loader.ts` exception)"* — placeholder rule, fully activated when 2.1 ships.

These are **not violations** — Story 1.1 ships independently and CI is green at end-of-story. The placeholders sit dormant until Epic 2 activates them.

#### C — Database/Entity Creation Timing

**N/A.** No database, no schemas-as-tables. The product is files-on-disk only.

### Special Implementation Checks

#### A — Starter Template Requirement

Architecture explicitly rejects off-the-shelf starters (`oclif`, `create-typescript-app`, agentskills layout — all rejected with documented rationale). Decision: ship a **bespoke scaffold** as Story 1.1. ✓ Story 1.1 covers cloning behavior (`pnpm install` succeeds), workspace declaration, root configs, license layout, editor/git/npm conventions, and smoke-level CI gates. Compliant.

#### B — Greenfield Indicators

- Initial project setup story: ✓ (Story 1.1)
- Development environment configuration: ✓ (tsconfig.base.json, biome.json, .nvmrc, .editorconfig, .gitignore, .gitattributes, .npmrc, vitest config — all in Story 1.1 or 2.1)
- CI/CD pipeline setup early: ✓ (release.yml in Story 2.8, site.yml in Story 4.3, conformance step in 2.7, dependabot in 5.3)

### Quality Findings — by Severity

#### Critical Violations

**None detected.**

#### Major Issues

**None detected.**

#### Minor Concerns

1. **NFR1 + NFR2 reframed as "tracked budgets, not v1.0 release gates"** in the epics doc Requirements Inventory (already flagged in Step 3). The epic explicitly acknowledges *"no canonical 1 000-artifact corpus exists at v1.0; benchmark instrumentation deferred to v1.1"* — but this revision is not echoed in the PRD. The PRD still states "under 5 seconds" and "under 500 ms" as quality requirements without a "deferred instrumentation" caveat. **Recommendation:** add a one-line annotation to the PRD's NFR1 and NFR2 (or to the PRD revisions log) explicitly noting that v1.0 treats them as tracked budgets, with instrumentation deferred to v1.1. **Severity: minor.** Does not block implementation; preserves PRD/epics consistency for future audits.

2. **Story 3.4 v1.0 enforcement of `requires` is "pure-prompt advisory"** — *"runtime enforcement is a v1.1 concern of `state-manager`; v1.0 is pure-prompt advisory"*. This is explicitly designed and traceable. **Recommendation:** mention this trade-off in the casper-core README's "explicit scope boundary" (Story 3.5 already covers the section but doesn't currently spell out the prompt-vs-runtime distinction). Confirm during implementation.

3. **Story 1.1 uses `useFilenamingConvention` (kebab-case files) and named-exports-only** — these are mechanical lint rules that may produce false positives on third-party-style names (e.g., `LICENSE`, `LICENSE-CC-BY-4.0`). **Recommendation:** ensure `.biomeignore` or rule overrides accommodate non-source files. Story 1.1 already lists `.biomeignore` exclusions but does not mention these specific filenames. Verify during execution. **Severity: minor.**

4. **Outreach activities** (PRs into `awesome-claude-code` / `awesome-agent-skills`, framework-maintainer outreach, `agentskills.io` upstream proposal) — not tracked as engineering stories. The PRD lists them as MVP/continuous activities. **Recommendation:** confirm these live in a separate launch checklist or marketing tracker, since the implementation readiness scope is engineering-only. Not a blocker. **Severity: minor.**

### Best Practices Compliance Checklist

| Check | Epic 1 | Epic 2 | Epic 3 | Epic 4 | Epic 5 |
|-------|:-----:|:-----:|:-----:|:-----:|:-----:|
| Epic delivers user value | ✓ | ✓ | ✓ | ✓ | ✓ |
| Epic functions independently | ✓ | ✓ | ✓ | ✓ | ✓ |
| Stories appropriately sized | ✓ | ✓ | ✓ | ✓ | ✓ |
| No forward dependencies (or healthy placeholders only) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Database tables when needed (N/A) | — | — | — | — | — |
| Clear acceptance criteria (BDD G/W/T) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Traceability to FRs/NFRs maintained | ✓ | ✓ | ✓ | ✓ | ✓ |

### Verdict

**The epic and story decomposition is unusually disciplined.** ACs are concrete, testable, and traceable. Independence properties are respected. Forward references are explicitly marked as placeholders. The bespoke-scaffold decision is correctly translated into Story 1.1. Greenfield setup stories are present.

Three minor observations recorded above; none block implementation. The PRD ↔ epics drift on NFR1/NFR2 phrasing is the only item worth resolving before kickoff to preserve audit consistency.

Step 5 complete. Proceeding to Step 6.

---

## Step 6 — Final Assessment

### Overall Readiness Status

**READY** — with three minor recommendations to apply opportunistically (none blocking).

### Headline Numbers

| Metric | Value |
|--------|-------|
| Documents inventoried | 3 of 4 (PRD ✓, Architecture ✓, Epics ✓; UX scoped-out by design) |
| Document duplicates | 0 |
| FRs in PRD | 38 |
| FRs covered in epics | 38 / 38 (100 %) |
| NFRs in PRD | 24 |
| NFRs covered in epics | 24 / 24 (100 %, with NFR1/NFR2 reframed as tracked budgets — see issue 1) |
| Epics | 5 |
| Stories | 28 |
| Critical violations | 0 |
| Major issues | 0 |
| Minor concerns | 4 |

### Critical Issues Requiring Immediate Action

**None.** No FR is uncovered. No epic has a forward dependency. No story has vague or untestable ACs. Sequencing is forward-only and respects independence.

### Minor Issues Worth Resolving Before Kickoff

1. **PRD ↔ epics drift on NFR1 and NFR2.** The epics doc reframes the PRD's hard performance targets as *"tracked budgets, not v1.0 release gates"* with instrumentation deferred to v1.1. The PRD itself does not echo this caveat. **Recommendation:** add a one-line annotation to the PRD's NFR1 and NFR2 (or to the PRD revisions log dated 2026-04-26) acknowledging that v1.0 ships these as tracked budgets without an instrumentation gate. Preserves audit consistency.

2. **Story 3.4 — `requires` enforcement is "pure-prompt advisory" in v1.0.** The runtime enforcement is deferred to v1.1's `state-manager`. **Recommendation:** ensure the casper-core README (Story 3.5) explicitly mentions the prompt-vs-runtime distinction in its scope-boundary section, so adopters do not assume mechanical enforcement.

3. **Story 1.1 lint rule edge cases.** `useFilenamingConvention` (kebab-case) and `noRestrictedImports` may produce false positives on `LICENSE`, `LICENSE-CC-BY-4.0`, generated files, etc. **Recommendation:** verify `.biomeignore` and rule overrides accommodate non-source files at first run. Not a blocker; trivial to fix.

4. **Outreach / launch activities** (PRs into `awesome-claude-code` / `awesome-agent-skills`, framework-maintainer outreach, `agentskills.io` upstream proposal) — not tracked as engineering stories. **Recommendation:** confirm these live in a separate launch checklist or product tracker, since this readiness scope is engineering-only. If no such checklist exists, create one before v1.0 ship.

### Strengths Observed

- **Architecture-driven PRD amendments are tracked in PRD frontmatter** (revisions[] entry dated 2026-04-26) — the FR1, FR12, FR5, API surface, Product Scope, and Journey 6 corrections from architecture review are explicitly logged.
- **3-verrou single-source-of-truth enforcement for schemas** (TS rootDirs + biome noRestrictedImports + single loader.ts) is mechanical, not procedural.
- **3-layer vendor-neutrality enforcement** (source-level dependency-cruiser + lockfile audit + docker container release gate) converts a marketing claim into a mechanical invariant.
- **Diagnostic registry codegen with sha256 hash verification + pre-commit hook + .gitattributes generated marker** is unusually rigorous tamper-prevention for a v1.0.
- **Conformance suite prepared at v1.0 even though there is only one implementation** — sets up parity gating for v1.1 alternative implementations from day one.
- **Deferred features are explicitly named with reversibility notes**: `status` field, supersession pointers, multi-active-story workspace, runtime enforcement of `requires`, per-`core:*`-type schemas, JSON Schema Store PR, GitHub Action, conformance badges, casper-full, Memory Profile. Each deferral is BACKWARD_TRANSITIVE-compliant and traceable.
- **Single coordinated release fans out to 3 surfaces** (npm provenance, marketplace manual submission, GH Pages auto-deploy) from one git tag. No drift surface.

### Recommended Next Steps

1. **Apply minor issue 1** (PRD NFR1/NFR2 annotation) to keep the PRD revisions log complete.
2. **Confirm launch checklist** exists for the non-engineering outreach work (issue 4). If absent, draft one in `_bmad-output/planning-artifacts/launch-checklist.md` or equivalent.
3. **Begin implementation with Story 1.1**. The bespoke scaffold is the hard prerequisite; everything else is parallelizable after Epic 1.
4. **Plan a v1.1 PRD scoping session** before v1.0 ship to capture: NFR1/NFR2 instrumentation, Memory Profile overlay, casper-full workflow, defense-in-depth validator stack, JSON Schema Store PR, `caspian/validate-action@v1` GHA, conformance badge levels, runtime `state-manager`, Unix Interop Test scripted reproducible. Several of these have hooks already laid in v1.0 stories.

### Final Note

This assessment identified **4 minor concerns across 4 categories** (PRD/epic consistency, scope clarification, lint configuration, launch tracking). **No critical issues. No major issues. No FR/NFR uncovered.** The planning artifacts are unusually rigorous: ACs are concrete and BDD-formatted, dependencies are forward-only, vendor-neutrality is mechanically enforced, and deferred features carry explicit reversibility notes. **Implementation can proceed.**

---

**Assessor:** AI Product Manager (BMad workflow `bmad-check-implementation-readiness`)
**Date:** 2026-04-26
**Author of artifacts under review:** Cyril
**Project:** joselimmo-marketplace-bmad → Caspian + casper-core (v1.0)

