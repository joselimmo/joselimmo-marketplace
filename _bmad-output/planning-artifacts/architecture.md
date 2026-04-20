---
stepsCompleted: [1, 2]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/product-brief-caspian.md
  - _bmad-output/planning-artifacts/product-brief-caspian-distillate.md
  - _bmad-output/planning-artifacts/research/domain-agentic-workflows-ecosystem-research-2026-04-17.md
  - _bmad-output/planning-artifacts/research/technical-frontmatter-schemas-research-2026-04-17.md
  - _bmad-output/planning-artifacts/research/technical-plugin-architecture-distribution-research-2026-04-17.md
  - _bmad-output/planning-artifacts/research/technical-subagents-context-isolation-research-2026-04-18.md
  - _bmad-output/planning-artifacts/research/technical-sessionstart-hook-lifecycle-research-2026-04-18.md
  - _bmad-output/planning-artifacts/research/technical-mcp-tool-integration-research-2026-04-18.md
  - _bmad-output/brainstorming/brainstorming-session-2026-04-17-1545.md
workflowType: 'architecture'
project_name: 'joselimmo-marketplace-bmad (Caspian Core + casper-core v1.0)'
user_name: 'Cyril'
date: '2026-04-19'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Scope

**v1.0 release**: Caspian Core open specification (prose + JSON Schemas + declarative conformance suite + `core:*` vocabulary) + `caspian` CLI shim (~20 LoC wrapping `ajv-cli` with embedded schemas) + `casper-core` Claude Code reference plugin + `caspian.dev` landing page. All packaged in a **split-ready monorepo** for v1.0, with structural discipline to enable clean separation into `caspian/` and `casper-core/` repos if traction emerges. v1.1+ deliverables (Memory Profile overlay, casper-full, full-featured CLI with Caspian-specific diagnostics, GitHub Action, JSON Schema Store PR, conformance badges, second-language implementer stub) are explicitly out of scope for this architecture.

**Scope deviation from PRD**: the PRD specifies a full-featured vendor-neutral Node.js CLI with custom diagnostics as a v1.0 deliverable. This architecture reduces the v1.0 CLI to a ~20-LoC shim wrapping `ajv-cli` and relies on the JSON Schema format itself (consumable by any Draft 2020-12 validator) to prove vendor neutrality. The declarative conformance suite is promoted from internal QA tool to public v1.0 artifact. A list of PRD amendments accumulates through this document and is consolidated in the final step.

## Project Context Analysis

### Requirements Overview

**Functional Requirements (38 FRs, 7 clusters)** — see PRD for detail. Architectural reading:

- **Spec Contract Authoring (FR1–6)** — four-field contract (`schema_version`, `type`, `requires`, `produces`) + overlay with Agent Skills fields + `x-*` extension. The spec is simultaneously the protocol and the primary v1.0 artifact; every downstream layer (shim, IDE via JSON Schema Store, future CI/runtime) references its JSON Schemas.
- **Artifact Validation (FR7–14)** — `caspian validate` is delivered in v1.0 as a ~20-LoC shim wrapping `ajv-cli` with embedded schemas. Vendor-neutrality is proven by the JSON Schema format itself being consumable by any off-the-shelf Draft 2020-12 validator, not by a custom implementation. Namespace-aware warn-never-reject behavior for unregistered types is documented as SHOULD behavior in spec prose; strict validators (`ajv-cli`) behave stricter (reject unknowns) — acceptable trade-off for v1.0, re-examined when v1.1 ships a full-featured CLI.
- **Reference Workflow (FR15–19)** — casper-core porcelain commands form a deterministic `requires → produces` chain under the single-active-story workspace convention. State lives entirely in typed artifact files on disk; no in-process orchestrator.
- **Plugin Composition & Overrides (FR20–22)** — skill identity tied to `name` + contract; local `.claude/skills/` skills override plugin-shipped ones. Override safety = contract stability, so `requires`/`produces` cannot change casually between plugin versions.
- **Governance & Evolution (FR23–27)** — RFC process, mandated template sections, BDFL response SLA, `CHANGELOG.md`, BACKWARD_TRANSITIVE guarantee. Every v1.0 decision is a permanent commitment — favor under-shipping.
- **Distribution & Discoverability (FR28–32)** — GitHub repo (dual-license), npm `caspian` (shim), Anthropic marketplace `casper-core`, `caspian.dev` landing with stable anchor IDs. Three release channels; anchor-URL stability is a first-class architectural concern.
- **Developer Onboarding & Documentation (FR33–38)** — 10-minute readable core spec, per-type rationale docs, minimal adoption example, CI integration snippet, casper-core README with override pattern, canonical fixture set as reading reference. Documentation is a shipping artifact.

**Non-Functional Requirements (24 NFRs, 6 groups):**

- **Performance (NFR1–4)** — validation performance is now a property of `ajv-cli`, not custom code; targets (1000 artifacts <5s, startup <500ms) are inherited. 4 KB frontmatter cap documented in spec; enforcement by any validator consuming the schema.
- **Security (NFR5–9)** — YAML safe-load constraints documented in spec; enforced by whatever validator consumes the schema (off-the-shelf `ajv-cli` + `yaml` parser defaults are safe). Path-traversal and pointer rules are forward-compat commitments for future spec versions. No telemetry, no network I/O — trivially satisfied by the shim.
- **Accessibility (NFR10–12)** — caspian.dev WCAG 2.1 AA; machine-readable output inherited from `ajv-cli --format=json`; Markdown spec renders accessibly on GitHub + caspian.dev.
- **Interoperability (NFR13–18)** — overlay compatibility with Agent Skills (every SKILL.md field remains valid); JSON Schema Draft 2020-12 compliance consumable by any validator; GitHub Actions integration via `ajv-cli` exit codes; graceful degradation; Node ≥20 LTS for the shim; description truncation budget respected.
- **Reliability (NFR19–21)** — deterministic shim (wrapping `ajv-cli`, no random/time/state dependency); offline operation; declarative conformance suite is the release gate for every spec version bump.
- **Compatibility / Versioning (NFR22–24)** — BACKWARD_TRANSITIVE within a major; Claude Code plugin format best-effort; caspian.dev stable anchors with redirect on rename for two minors.

**Scale & Complexity:**

- Primary domain: developer tooling (spec + thin CLI shim + Claude Code reference plugin). No end-user UI beyond a static single-page documentation site. No server state, no database, no concurrency model.
- Complexity level: **medium for the technical sub-system; complex for the governance sub-system** (Cynefin-honest framing). Low on conventional engineering axes; non-trivial in protocol design discipline; multi-vendor interop commitment and BACKWARD_TRANSITIVE discipline push governance into complex-domain territory where decisions are permanent and emergent-adoption-dependent.
- Estimated architectural components (v1.0):
  1. `spec/` — Markdown prose + JSON Schemas + **declarative conformance suite** (fixtures + expected outcomes) + `core:*` vocabulary + examples.
  2. `caspian` CLI shim — ~20 LoC wrapping `ajv-cli`, embedded schemas, npm-distributed (`cli/` or `shim/`).
  3. `casper-core` plugin — 3 porcelain commands + artifact-seed helpers + Claude-Code-specific surface in `claude-code/` subdir.
  4. `caspian.dev` site — single-page static Markdown-to-HTML.
- All four packaged in a single **split-ready** monorepo for v1.0, with structural discipline to enable clean separation into `caspian/` (spec + schemas + conformance suite + shim + site) and `casper-core/` (Claude Code plugin) once traction emerges.

### Technical Constraints & Dependencies

- **Runtime (shim only)** — Node.js ≥20 LTS. Shim delegates to `ajv-cli`. Defensive name registration on PyPI / crates.io maintained without publishing.
- **Parsing constraints (spec-documented, off-the-shelf-enforced)** — YAML 1.2, UTF-8, no BOM, safe-load only, 4 KB frontmatter size cap, tab indentation rejected, unquoted booleans rejected. Spec publishes a **Caspian YAML profile**: documented subset (no anchors, no merge keys, no custom tags) so two independent implementations parse identically.
- **Standards** — JSON Schema Draft 2020-12 (consumed by `ajv-cli` v1.0, targeted by any future validator); Anthropic Agent Skills SKILL.md overlay; Claude Code plugin format as published.
- **Network** — zero network I/O at validate time (`ajv-cli` default); no telemetry; no remote schema fetching; no required configuration file.
- **Hosting** — GitHub (repo + Issues + Actions + Pages free tier); npm registry; Anthropic plugin marketplace. Domain `caspian.dev`.
- **Licensing** — CC-BY-4.0 for `spec/*.md` prose; Apache-2.0 for JSON Schemas, shim code, Casper code, fixtures. Single root `LICENSE` referencing both; per-subtree scoping documented.
- **Claude Code plugin-format constraint** — no `hooks`, `mcpServers`, `permissionMode` in plugin-shipped agents (v1.0 ships none).
- **Team** — solo BDFL. Architectural bias: simplicity, subset-shippability, split-readiness.

### Architectural Invariants (load-bearing)

1. **Single source of truth for schemas** — JSON Schemas under `spec/schemas/` are canonical. Consumed by the shim, `ajv-cli`, off-the-shelf validators, future JSON Schema Store entry. Documentation derived from or synchronized to them; no second source.
2. **Vendor neutrality proven by format, not by binary** — the JSON Schemas are standard Draft 2020-12, consumable by any compliant validator without Claude Code. The CLI shim is trivially reproducible in any language (wrapper around an `ajv-cli` equivalent).
3. **Claude-Code surface isolation in casper-core** — plugin manifest + slash-command registration in `casper-core/claude-code/`; schemas, conformance suite, vocabulary at spec-package root.
4. **BACKWARD_TRANSITIVE schema evolution** — within a major version: additive fields only; enums may extend; `required` may relax but never tighten; `status`, `supersedes/superseded_by`, `count_max` deliberately deferred (additive when introduced). Scope to be locked precisely in Step 4.
5. **Schema version contract is explicit** — producers stamp `schema_version` in frontmatter; consumers document their supported range in README / manifest. Runtime verification of compatibility is a SHOULD for honoring harnesses.
6. **Single-active-story workspace convention** (casper-core scope) — deterministic type-based `requires` resolution without `status`. Multi-story support deferred with `status` field introduction.
7. **Declarative conformance suite as primary validation artifact** (promoted from "fixture-first methodology") — `spec/conformance/{valid,invalid}/*` pairs each fixture with an `expected.yaml` declaring `{valid: bool, reasons: [...]}`. Any implementation (shim, future CLI, second-language stub) passes or fails against this suite — the suite is the spec's operational definition of conformance.
8. **Monorepo split-ready** — one-way dependencies (casper-core may consume published schemas; spec never depends on casper-core); independent semver per package; per-package CI; licence boundaries match subtree boundaries; no cross-package relative imports. Designed so a future split into two repos is a rename-and-repoint, not a refactor.

### Cross-Cutting Concerns Identified

- **Schema cross-layer coherence** — single canonical source consumed by shim v1.0, off-the-shelf validators today, v1.1 CI/runtime/IDE layers tomorrow. Primary defense against validator stack drift.
- **Diagnostic format inheritance (v1.0)** — shim inherits `ajv-cli` diagnostic format. Caspian-specific diagnostic codes (`CASP-E###`) deferred to v1.2+ when a full-featured CLI is warranted. Documented explicitly so users don't assume stability of `ajv-cli`'s formatting.
- **Namespace-aware type classification** — canonical `core:*` enum + namespace regex `^[a-z][a-z0-9]*:[a-z][a-z0-9-]*$` embedded in the schema. Warn-never-reject on unregistered types is spec SHOULD behavior; v1.0 off-the-shelf `ajv-cli` is strict (rejects unknowns) — acceptable trade-off, documented.
- **Vendor neutrality as schema property** — proven by any off-the-shelf validator consuming the schema cleanly; reinforced by zero Claude/Anthropic/claude-code references in the spec package (grep-testable invariant).
- **Anchor URL stability on caspian.dev** — `#schema-version`, `#type`, `#requires`, `#produces`, `#core-vocabulary` persist across minor versions; rename requires redirect for two subsequent minors.
- **Caspian YAML profile** — documented subset (safe-load, no anchors, no merge keys, no custom tags). Published in spec so two independent implementations parse identically. Not enforced by v1.0 shim (inherits `ajv-cli`'s parser) but required for conformance.
- **Declarative conformance suite** — primary QA artifact (promoted to invariant #7), also used by any future implementer to self-certify. Zero regressions on valid fixtures = hard release gate for every spec + shim + casper-core version bump.
- **Dual licensing discipline** — CC-BY-4.0 for `spec/*.md`; Apache-2.0 for schemas, shim, Casper code, fixtures, conformance suite. Single root `LICENSE`; subtree-level `LICENSE` markers where scoping matters; review discipline prevents license contamination in shared files. Split-ready: each future repo inherits a clean licence posture.
- **Unhyphenated naming discipline** — `caspian` / `casper` reserved on GitHub, npm, PyPI, crates.io.
- **Monorepo split-readiness** — structural invariants per #8 ensure future split into `caspian` (spec + schemas + conformance + shim + site) and `casper-core` (plugin) is mechanical.
- **Framework extension point (v1.0 posture)** — extension mechanism for frameworks (BMad, Spec Kit, Superpowers) is **namespace + `produces`/`requires` typing**, not a plugin API. Frameworks adopt by adding frontmatter; no code integration required. Documented explicitly as the v1.0 extension surface to answer Journey 4's question directly.

### Open Questions Deferred to Step 4 (Architectural Decisions)

- **Casper role disambiguation** — démo or reference implementation? Conformance expectations differ. Pre-lean: reference implementation for v1.0 (it passes the conformance suite; it is grep-able by other implementers), with scope honestly limited ("v1.0 proof, not full workflow").
- **Second-implementer stub** as vendor-neutrality demonstration — deferred to v1.1 alongside the full-featured CLI. v1.0 vendor-neutrality rests on: (a) schema format, (b) shim trivially reproducible, (c) conformance suite consumable by any validator. Acceptable for a pre-adoption release.
- **Distribution of the canonical schema** within the monorepo — Step 6 decision: `spec/schemas/*.json` is the single copy; the shim embeds it at build time; the site links to the GitHub raw URL. No separate `@caspian/schemas` npm package in v1.0 (deferred to v1.1 JSON Schema Store submission).
- **BACKWARD_TRANSITIVE scope precision** — Step 4 decision: enumerate additive operations (new optional fields, enum extensions, required → optional, new namespace) and breaking operations (required → new required, enum removal, field removal, type narrowing).

### Strategic Questions Flagged (Outside Architecture Scope — For PRD Revision)

- **JTBD primary** — composability (A), auditability (B), signal (C), or defense (D)? Current scope optimizes for A; B/C are adjacent markets with different architectural implications. Revisit in PRD revision if traction signals shift.
- **Blue Ocean pivot** — audit-focused positioning (Victor's option α) is architecturally compatible with current invariants and reuses the declarative conformance suite as a signature base. Not pursued in v1.0; flagged for PRD revision if adoption stalls.

### PRD Amendments Accumulated (Step 2)

- **FR7–FR14** to be reformulated: validation delivered via `caspian` shim wrapping `ajv-cli` + Draft 2020-12 JSON Schemas consumable by any validator. Custom diagnostic codes deferred to v1.2+.
- **NFR1, NFR2, NFR4, NFR6, NFR11, NFR19, NFR20**: performance and determinism targets inherited from `ajv-cli` defaults in v1.0.
- **NFR17**: vendor neutrality reframed as a property of the JSON Schema format, not a property of a custom binary.
- **FR29**: npm `caspian` remains valid; documentation specifies it is a shim.
- **New FR**: publication of a **declarative conformance suite** under `spec/conformance/` — promoted from internal tool to v1.0 public artifact.
- **New NFR**: **Caspian YAML profile** documented subset (YAML 1.2 safe-load + no anchors, merge keys, or custom tags) so two independent implementations parse identically.
- **Classification**: `complexity: medium` → `complexity: medium (technical) + complex (governance)` for Cynefin-honest framing.
