---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-04-26'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/product-brief-caspian.md
  - _bmad-output/planning-artifacts/product-brief-caspian-distillate.md
  - _bmad-output/planning-artifacts/research/domain-agentic-workflows-ecosystem-research-2026-04-17.md
  - _bmad-output/planning-artifacts/research/technical-plugin-architecture-distribution-research-2026-04-17.md
  - _bmad-output/planning-artifacts/research/technical-frontmatter-schemas-research-2026-04-17.md
  - _bmad-output/planning-artifacts/research/technical-mcp-tool-integration-research-2026-04-18.md
  - _bmad-output/planning-artifacts/research/technical-sessionstart-hook-lifecycle-research-2026-04-18.md
  - _bmad-output/planning-artifacts/research/technical-subagents-context-isolation-research-2026-04-18.md
inputDocumentLoading:
  note: "Large technical research files loaded partially (~250 lines each of exec summary + stack analysis). Full content remains available via offset/limit reads in later steps as needed."
workflowType: 'architecture'
project_name: 'joselimmo-marketplace-bmad'
product_name: 'Caspian + casper-core'
user_name: 'Cyril'
date: '2026-04-22'
communication_language: 'Français'
document_output_language: 'English'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements (38 FRs across 7 capability areas):**

- *Spec Contract Authoring* (FR1–FR6) — four-field contract (`schema_version`, `type`, `requires`, `produces`) authoritative in YAML frontmatter, namespaced types, Agent-Skills-compatible, `x-*` extension escape hatch.
- *Artifact Validation* (FR7–FR14) — `caspian validate <path>` accepts file/dir/glob; structured JSON output mode; diagnostics with file/line/field/edit-distance suggestion/doc link/stable diagnostic code; strict exit codes; vendor-neutral execution; rejects YAML parse errors, BOM, tab indentation, oversized frontmatter, unknown fields; warns (never rejects) on unregistered namespaced types; references canonical JSON Schema Draft 2020-12 as single source of truth.
- *Reference Workflow (casper-core)* (FR15–FR19) — `/init-project` → `/discover` → `/plan-story` chain producing typed `core:overview` / `core:epic` / `core:story` / `core:plan` artifacts end-to-end; single-active-story workspace convention removes the need for `status`-based matching in v1.0.
- *Plugin Composition & Overrides* (FR20–FR22) — local-skill override via `name` + contract identity; survives plugin updates; install via Anthropic marketplace or local path.
- *Governance & Evolution* (FR23–FR27) — RFC process via `spec/proposals/NNNN-slug.md`; mandatory four-section TEMPLATE; BDFL response SLA + conflict-resolution procedure; `CHANGELOG.md` semver entries; `CONTRIBUTORS.md`; BACKWARD_TRANSITIVE evolution guarantee.
- *Distribution & Discoverability* (FR28–FR32) — GitHub repo (CC-BY-4.0 prose, Apache-2.0 code); npm package `caspian`; marketplace plugin `casper-core`; `caspian.dev` landing with stable per-concept anchor IDs consumed by CLI diagnostics.
- *Developer Onboarding & Documentation* (FR33–FR38) — 10-minute readable spec; per-`core:*` rationale docs; minimal-skill-adoption example; CI integration snippet; casper-core README documenting override pattern; canonical fixture set as reading reference.

**Non-Functional Requirements (24 NFRs across 6 quality attributes):**

- *Performance* (NFR1–NFR4) — 1 000-artifact validation < 5s and CLI startup < 500 ms are **performance budgets tracked, not release gates** (no canonical 1 000-artifact corpus exists at v1.0; synthetic-corpus generator and bench harness are post-v1.0 instrumentation); landing page < 2s on 4G; 4 KB hard cap on frontmatter size.
- *Security* (NFR5–NFR9) — safe-load YAML 1.2 only; reject BOM, non-UTF-8, tab indentation, unquoted booleans; no network I/O at validate time; no telemetry; casper-core ships without `hooks`/`mcpServers`/`permissionMode`; forward-compat path-traversal rejection committed for any future pointer fields.
- *Accessibility* (NFR10–NFR12) — WCAG 2.1 AA on `caspian.dev`; dual human-readable + `--format=json` diagnostic output; Markdown spec accessible via GitHub default renderer.
- *Interoperability* (NFR13–NFR18) — full overlay-compatibility with Anthropic Agent Skills SKILL.md; JSON Schema Draft 2020-12 conformance; GitHub Actions integration via standard exit codes; graceful degradation in non-Caspian-aware hosts; vendor-neutrality (Node ≥20, no Claude Code dependency); slash-command description respects 1 536-char auto-activation truncation budget.
- *Reliability* (NFR19–NFR21) — deterministic CLI (no time/random/external-state dependence); offline operation; canonical fixture set as hard release gate (zero regressions on valid-fixtures).
- *Compatibility / Versioning* (NFR22–NFR24) — BACKWARD_TRANSITIVE within major version (additive-only between minors); Claude Code plugin format compat patch on best-effort SLA; `caspian.dev` anchor IDs preserved across spec minor versions (rename → redirect for two minor cycles).

**Resolution Semantics — Out of Scope for v1.0 (normative seal):**

The v1.0 spec MUST publish an explicit normative statement: *"v1.0 consumers MUST NOT assume forward-compatibility on resolution semantics. Future spec versions may introduce filters that v1.0 consumers cannot honor."* This is the architectural seal that prevents v1.0 consumers from baking in the implicit invariant *"every artifact present in the workspace is eligible for matching"* — an invariant any future filter would silently break. Type-based matching is the only resolution semantic v1.0 commits to; multi-candidate disambiguation is implementation-defined.

**Scale & Complexity:**

- Primary domain: **developer_tool / cli_tool** (open spec + vendor-neutral Node CLI + Claude Code reference plugin + static landing page).
- Complexity level: **medium technical / high strategic**. Technical complexity is medium — low-domain complexity, non-trivial protocol design, governance discipline, validator-stack engineering. Strategic complexity is high — cross-vendor coordination, ecosystem politics, framework-maintainer adoption pipeline, and pre-committed sunset protocol all dominate the 12-month success window. The v1.0 release de-risks the technical layer; the strategic layer is de-risked separately by adoption-channel discipline (out of architectural scope, captured in PRD's *Adoption / Distribution Plan*).
- Estimated architectural components: **4** — (1) spec repository (prose + JSON Schemas + canonical vocabulary + fixtures + diagnostic registry), (2) `caspian` CLI (Node/TypeScript), (3) `casper-core` Claude Code plugin (markdown + manifest), (4) `caspian.dev` static landing site (GitHub Pages).

### Technical Constraints & Dependencies

- **Runtime constraint** — Node.js ≥ 20 (current LTS) for the CLI. v1.0 ships only the Node implementation; Python/Go are explicit post-v1.1 (Vision) deferrals.
- **Schema constraint** — JSON Schema Draft 2020-12 is the canonical authoring format. `ajv` is the chosen Node validator (consistent across v1.0 CLI and the v1.1 CI/runtime layers, eliminating cross-implementation drift between `ajv` and Python `jsonschema`). Concrete `ajv` import path locking, YAML parser selection (`yaml` v2.x strict 1.2 vs `js-yaml`), and byte-counting policy are step-04 decisions.
- **Frontmatter parsing constraint** — YAML 1.2, UTF-8, no BOM, safe-load only, 4 KB hard cap (UTF-8 bytes, exclusive of `---` delimiters), tab indentation rejected, unquoted-boolean coercion rejected.
- **Vendor-neutrality constraint** — the CLI code must not import any Claude-Code-specific module. v1.0 release gate: CLI runs on a vanilla Linux container (no Claude Code installed) against the canonical fixture set.
- **Claude Code plugin-format constraints** — casper-core ships without `hooks`, `mcpServers`, or `permissionMode` in any plugin-shipped agent. Slash-command descriptions place the trigger phrase in the first sentence and respect the 1 536-character auto-activation truncation budget.
- **Distribution constraints** — spec + CLI publish together at the same semver; casper-core follows its own semver and declares the Caspian `schema_version` it targets in its plugin manifest.
- **Governance constraint** — every v1.0 schema decision is a BACKWARD_TRANSITIVE commitment; additive restoration is cheap, removal is expensive. `status`, supersession pointers, and any `id` / artifact-identity model are deliberately NOT reserved in v1.0. The Resolution Semantics scope note (above) is the architectural seal that makes this position defensible against future filter additions.
- **Workspace convention** — single-active-story workspace in v1.0 lets type-based `requires` matching be deterministic without `status` filtering.
- **`produces` contract semantics — type signature (machine-checkable)** — `produces: {type: T}` means *"this skill, on successful completion, produces exactly one artifact of type T"*. Strong guarantee, statically verifiable, foundation for dependency resolution. casper-core v1.0's three porcelain commands all respect this contract: each produces exactly one typed artifact on success; non-production on success is a validator-detectable contract violation. This is what makes `requires` / `produces` a machine-checkable interface rather than decorative metadata.

### Cross-Cutting Concerns Identified

- **Single source of truth for schemas.** The JSON Schemas under `spec/schemas/` are authoritative. The v1.0 CLI, future IDE integration, v1.1 CI layer, and v1.1 runtime skill all reference these schemas — never re-declare. Concrete mitigation for the documented "validator stack drift" risk at the *valid / invalid decision* level.
- **Versioned diagnostic registry.** A separate release artifact (`spec/diagnostics/registry.json` + `caspian.dev/diagnostics`) defines a stable diagnostic code per validation rule (`CASPIAN-E001`, `CASPIAN-W042`, …) with stable identity across spec versions. Every validation layer (v1.0 CLI; v1.1 IDE / CI / runtime / install) emits the same code for the same rule, regardless of the underlying parser or error model. Test fixtures assert on the code, not on message text. CLI diagnostics emit a stable doc link (`caspian.dev/diagnostics#E003`). Mitigation for validator-stack drift at the *diagnostic identity* level — complementary to the single-source-of-truth schemas, addressing what the schema alone cannot guarantee (consistency of error codes, severities, and stability of message identity across heterogeneous parsers).
- **Surface isolation.** Vendor-neutral artifacts (schemas, validator, canonical vocabulary, diagnostic registry) live at the spec repo root. Claude-Code-specific artifacts (plugin manifest, slash-command registration) live in a dedicated subdirectory of casper-core. Boundary enforced by directory layout and import discipline.
- **Doc-URL stability.** `caspian.dev` exposes stable per-concept anchor IDs (`#schema-version`, `#type`, `#requires`, `#produces`, `#core-vocabulary`, `#diagnostics-EXXX`). The CLI emits these anchors in diagnostics. Renames require a redirect and a two-minor-version overlap.
- **Fixture-first discipline.** Canonical valid + invalid fixtures are built alongside the schemas. Every reported validator bug post-v1.0 is replicated as a fixture before being fixed. CI runs the full fixture set on every spec PR. Zero regressions on the valid-fixture set is a hard release gate.
- **Unified release coordination.** Spec, schemas, diagnostic registry, and CLI release together (same semver). casper-core has independent semver but declares its target `schema_version` in the plugin manifest, providing forward-compat traceability.
- **Output channel duality.** Every diagnostic surface produces both human-readable and machine-readable (`--format=json`) output, satisfying the accessibility, CI integration, and assistive-tooling requirements simultaneously.
- **Ecosystem-positioning discipline.** Sunset protocol, proactive upstreaming to `agentskills.io`, and overlay-compatibility-as-published-contract all shape the architecture toward optionality and graceful coexistence rather than competitive entrenchment.

### Operational Notes (Out of Architectural Scope)

- **Defensive package-name registration** across npm, PyPI, crates.io, and GitHub orgs — operational hygiene to prevent name squatting and tokenization drift; tracked in `notes/defensive-ops.md` rather than as an architectural constraint.
- **Performance instrumentation infrastructure** — 1 000-artifact synthetic-corpus generator and `bench.yml` CI workflow are deferred; NFR1 / NFR2 are tracked budgets in v1.0 with no gated threshold.
- **Implementation contract** — concrete locking of YAML parser version, `ajv` import path, encoding policy, byte-counting policy, symlink policy, newline normalization, and exit-code matrix is the deliverable of step-04 (Architectural Decisions), captured in a future `docs/architecture/implementation-contract.md` artifact.

## Starter Template Evaluation

### Primary Technology Domain

**Multi-component developer tooling project**: open spec (Markdown + JSON Schemas), Node.js/TypeScript CLI validator, Claude Code reference plugin (Markdown + manifest), and static landing site (HTML + GitHub Pages). Each component has a distinct distribution channel; none maps cleanly to a standard "starter".

### Starter Options Considered

- **`oclif`** — comprehensive CLI framework (Heroku/Salesforce). Rejected: 100–300 ms cold-start overhead violates NFR2 (<500 ms); embeds telemetry primitives that violate NFR6; heavy directory layout misaligned with the spec-first design philosophy.
- **`create-typescript-app`** (Josh Goldberg) — opinionated TS scaffold. Rejected: bundles tooling (lint, prettier, husky, semantic-release) that pre-decides choices we've deliberately reserved for the implementation contract.
- **`oclif generate` minimal mode** — plain TS + commander preset. Rejected: marginal value over a hand-rolled scaffold and still requires a post-generation cleanup pass.
- **agentskills/agentskills layout (inspiration source)** — Python-based static site for the spec, no CLI. Useful as a structural reference (`docs/`, `skills-ref/`, dual-licensing CC-BY-4.0 + Apache-2.0) but does not provide a Node CLI starter.

### Selected Approach: Bespoke Scaffold

**Rationale for Selection:**
No off-the-shelf starter aligns with the v1.0 NFR profile (sub-500 ms startup, no telemetry, deterministic, offline). Every reviewed starter requires a removal pass that costs more than scaffolding from scratch. The boring-technology philosophy (PRD *Implementation Considerations*) favors a minimal hand-rolled monorepo whose every dependency is justified individually.

**Inspiration drawn from agentskills/agentskills:** dual-licensing pattern (CC-BY-4.0 prose + Apache-2.0 code), separation between normative content (`spec/`) and reference examples (`fixtures/`).

**Initialization Commands** (deferred to first implementation story, not executed at architecture-decision time):

```bash
mkdir caspian && cd caspian
pnpm init
echo 'packages:\n  - "packages/*"' > pnpm-workspace.yaml
mkdir -p spec/{proposals,vocabulary} schemas/core-types diagnostics \
  fixtures/{valid,invalid} examples packages/{cli/src,cli/tests} \
  packages/casper-core/claude-code/commands site notes
cd packages/cli
pnpm init
pnpm add commander yaml ajv fast-glob
pnpm add -D typescript vitest @types/node @biomejs/biome
```

### Architectural Decisions Provided by the Scaffold

**Monorepo structure** (single git repository under `joselimmo-marketplace/caspian/` for v1.0; provisional; migrates to a dedicated `caspian/` repository when the spec stabilizes):

- `spec/` — normative prose, vocabulary, proposals, CHANGELOG (CC-BY-4.0)
- `schemas/` — JSON Schemas Draft 2020-12, single source of truth (Apache-2.0)
- `diagnostics/` — versioned diagnostic registry per step-02 cross-cutting concern (Apache-2.0)
- `fixtures/` — canonical valid + invalid artifact samples (Apache-2.0)
- `examples/` — minimal-skill-adoption + CI integration snippets
- `packages/cli/` — `caspian` npm package (Node ≥20 + TypeScript)
- `packages/casper-core/` — Anthropic marketplace plugin; Claude-Code-specific surface isolated under `packages/casper-core/claude-code/`
- `site/` — `caspian.dev` source (single-page, hand-written HTML, GH Pages)
- `notes/` — out-of-architectural-scope ops notes (`defensive-ops.md`)

**Language & Runtime:**

- TypeScript 5.x with `module: "nodenext"`, `target: "ES2022"`, `strict: true`.
- Node.js ≥ 20.10 LTS (engine constraint declared in `packages/cli/package.json`).

**Build Tooling:**

- `tsc` for the CLI package (no bundler in v1.0; minimizes dependency surface and startup cost).
- Hand-written `build.mjs` for `site/` (no static-site framework in v1.0).

**Testing Framework:**

- `vitest` v3 with snapshot/golden support for `--format=json` diagnostic output.
- Fixture-based regression suite consuming `fixtures/valid/**` (zero false positives = release gate per NFR21) and `fixtures/invalid/**` (each invalid file asserts on a specific `CASPIAN-EXXX` diagnostic code).

**Code Organization:**

- `packages/cli/src/` segments into `commands/`, `parsers/`, `validators/`, `diagnostics/`, plus `cli.ts`, `walker.ts`, `version.ts` at the root of `src/`.
- Schemas bundled into `packages/cli/dist/schemas/` at build via `scripts/copy-schemas.ts` to satisfy NFR6 (no remote schema fetching).

**Dependency Selections** (final versions locked in step-04 implementation contract):

- CLI argument parsing: **`commander`** (~v12) — mature, low overhead, TS-native types.
- YAML parsing: **`yaml`** (~v2.x) in strict YAML 1.2 mode — rejects `on`/`off` boolean coercion (NFR8) which `js-yaml` accepts.
- JSON Schema validation: **`ajv`** (~v8) imported via `ajv/dist/2020.js` for Draft 2020-12 support.
- File walking: **`fast-glob`** with `followSymbolicLinks: false` and explicit realpath verification (forward-compat with NFR9 path-traversal rejection).
- Linting/formatting: **`biome`** (single dependency replacing eslint + prettier + plugins; aligned with boring-tech philosophy).

**Development Experience:**

- `pnpm` as the package manager and workspace orchestrator (deterministic lockfile, strict peer-dep resolution).
- GitHub Actions CI (`pnpm install --frozen-lockfile && pnpm test`) running fixture-regression suite on every PR.
- No bundler watch mode in v1.0; `tsc --watch` + `vitest --watch` cover dev iteration.

**Licensing (per-directory, root composite):**

- `/LICENSE` — Apache-2.0 (default for the project).
- `/spec/LICENSE.md` — CC-BY-4.0 (overrides for prose).
- `/site/LICENSE.md` — dual statement (prose CC-BY-4.0, build code Apache-2.0).
- Each sub-package (`packages/cli`, `packages/casper-core`, `schemas`, `diagnostics`, `fixtures`) re-declares its Apache-2.0 LICENSE explicitly to remain unambiguous when a directory is consumed in isolation.

**Note:** Project initialization using the bootstrap commands above should be the first implementation story (Story-001: monorepo scaffold + CLI shell + single round-trip fixture validation against one schema, CI green).

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
A1 schema layout, A2 `$ref` policy, A5 `additionalProperties`, B1 CLI command surface, B2 exit codes, B3 output modes, C1 diagnostic code format, D1 validation pipeline ordering, E1 CLI ↔ spec coupling.

**Important Decisions (Shape Architecture):**
A3 schema bundling, A4 schema path-versioning, C2 severity levels, C3 registry pipeline, D2 error policy, E2 npm publish provenance, F1 CI matrix, F4 site deployment, G2 lockfile policy.

**Deferred Decisions (Post-MVP / First Implementation Story):**
B4 JSON output stable schema details, B5 glob expansion semantics, C4 registry append-only convention, D3 multi-file summary footer formatting, D4 byte-counting locked (already settled in step-02), E3 pre-1.0 CLI version timing, E4 release coordination tooling (`changesets`), F2 branch protection rules, F3 `bench.yml` performance budgets (v1.1), G1 dependency audit thresholds, G3 Renovate configuration, G4 SBOM generation (v1.1).

### Validator Scope — T1.5 (Strict-Parse + Permissive-Allow-List + Stable Diagnostics)

The v1.0 validator is intentionally scoped between minimum-viable (T1, parse + shape only) and full-PRD (T3, includes per-`core:*`-type schemas). The chosen tier:

- Parses YAML frontmatter with strict 1.2 + safe-load. Rejects BOM, non-UTF-8, tab indentation, oversized frontmatter (>4 KB), unquoted-boolean YAML 1.1 footguns.
- Validates the envelope shape: `type` is namespace-formed; `requires` (if present) is array of `{type, tags?, count?}`; `produces` (if present) is `{type}`.
- **Warns** (does not reject) on frontmatter fields outside the recognized allow-list (4 Caspian fields + 6 agentskills.io canonical fields + 12 Claude Code overlay fields + `x-*` extensions + `<vendor>:<name>` namespaced fields).
- Warns on `type` values using namespaces outside the canonical `core:*` registry.
- Emits stable diagnostic codes (`CASPIAN-EXXX` / `CASPIAN-WXXX`) from a versioned registry.
- Supports `--format=human` (default, ANSI-aware) and `--format=json` (programmatic CI consumption).
- Does **not** ship per-`core:*`-type JSON Schemas. casper-core orchestration uses string-matching on `type`, not type-specific schema validation.

This scope reflects three principles: (1) skills/commands/agents carry `requires`/`produces`; documents carry `type` only; the validator validates *what is present*, not an imposed shape beyond the namespaced `type`. (2) Anthropic ecosystem evolution may add new SKILL.md fields; warn-on-unknown lets Caspian degrade gracefully without an emergency release. (3) Composition rules between `core:*` types are an orchestration concern (casper-core's responsibility), not a validation concern.

### Spec & Schema Architecture

- **A1. Schema layout** — single envelope schema `schemas/v1/envelope.schema.json` (Draft 2020-12) defining the four-field Caspian Core contract, `requires` array shape, and `produces` object shape. No per-`core:*`-type schemas in v1.0.
- **A2. `$ref` strategy** — `$id: "https://caspian.dev/schemas/v1/envelope.schema.json"`. Schema is registered locally at runtime via `ajv.addSchema()`; the URI is canonical for future JSON Schema Store submission (v1.1) and stable across spec minor versions.
- **A3. Schema bundling** — `packages/cli/scripts/copy-schemas.ts` copies `schemas/v1/**/*.json` into `packages/cli/dist/schemas/` at build time. Runtime loads from `path.resolve(__dirname, 'schemas')`. NFR6 (no remote schema fetch) satisfied by construction.
- **A4. Schema versioning** — path-versioned (`schemas/v1/`). When a future major bump arrives, `schemas/v2/` lives alongside `schemas/v1/`. Renames within a major version are forbidden by BACKWARD_TRANSITIVE.
- **A5. `additionalProperties` policy**:
  - Envelope: `additionalProperties: true` (overlay-compatibility with agentskills.io + Claude Code + future fields). Unrecognized fields trigger `CASPIAN-W001` warning, not rejection.
  - `requires` and `produces` sub-objects: `additionalProperties: false` (strict shape; `{type, tags, count}` for `requires` entries, `{type}` for `produces`).

### CLI Architecture

- **B1. Command surface (v1.0)** — `caspian validate <path>`, `caspian --version`, `caspian --help`, `caspian validate --help`. No `init`, `lint`, `fix`, or other commands in v1.0.
- **B2. Exit codes**:
  - `0` — all artifacts valid; warnings allowed and do **not** trigger non-zero exit.
  - `1` — at least one artifact has an error.
  - `2` — usage error (unknown flag, file not found, malformed glob).
  - `3` — internal validator error (bug; should never happen; report as issue).
- **B3. Output modes** — `--format=human` (default; ANSI colors auto-detected via `process.stdout.isTTY`) and `--format=json` (stable schema, see B4 deferred). No `--quiet`/`--verbose`/`--strict` in v1.0.
- **B4. JSON output stable schema** — defined during first implementation story. Working principle:

```json
{
  "schemaVersion": "1",
  "results": [
    {
      "file": "skills/maya-lint.md",
      "valid": true,
      "diagnostics": [
        { "code": "CASPIAN-W001", "severity": "warning", "line": 7, "field": "metadata", "message": "..." }
      ]
    }
  ],
  "summary": { "files": 12, "errors": 0, "warnings": 3 }
}
```

- **B5. Glob expansion** — performed by `fast-glob` inside the CLI, not by the shell. CLI accepts file paths, directories, or glob patterns as `<path>` arguments. `followSymbolicLinks: false`; realpath verification keeps every walked file under the cwd.

### Diagnostic Registry

- **C1. Code format** — `CASPIAN-E001` / `CASPIAN-W001`, zero-padded 3 digits, no intermediate scope. Convention: `EXXX` = error, `WXXX` = warning.
- **C2. Severity levels** — exactly two: `error` (contributes to non-zero exit), `warning` (informational; does not affect exit). No `info` or `hint` in v1.0.
- **C3. Registry pipeline** — `diagnostics/registry.json` is the authoritative source (hand-authored). Two derivatives:
  - `packages/cli/src/diagnostics/codes.generated.ts` — typed TS constants generated by `scripts/gen-diagnostic-codes.ts`.
  - `site/diagnostics.html` — human-readable reference page with per-code anchors (`#diagnostics-E001`, …) emitted in CLI diagnostic output.
- **C4. Registry versioning** — append-only. A retired code is never reused; a new diagnostic for an existing rule receives a new code; semantic changes to a code's meaning require a new code. Versioning tracked in `diagnostics/CHANGELOG.md`.
- **C5. Initial v1.0 registry — 17 codes** (14 errors + 3 warnings):

| Code | Severity | Rule |
|---|---|---|
| `CASPIAN-E001` | error | BOM byte sequence (`EF BB BF`) detected |
| `CASPIAN-E002` | error | Non-UTF-8 encoding |
| `CASPIAN-E003` | error | Tab character in frontmatter indentation |
| `CASPIAN-E004` | error | Frontmatter exceeds 4 KB hard cap |
| `CASPIAN-E005` | error | Missing or malformed frontmatter delimiters (`---`) |
| `CASPIAN-E006` | error | YAML parse error |
| `CASPIAN-E007` | error | Unquoted boolean-like value (`on`/`off`/`yes`/`no`/`y`/`n`) — likely YAML 1.1 footgun |
| `CASPIAN-E008` | error | `type` field missing or empty |
| `CASPIAN-E009` | error | `type` field not in `<namespace>:<name>` form |
| `CASPIAN-E010` | error | `requires` is not an array |
| `CASPIAN-E011` | error | `requires` entry missing `type` field |
| `CASPIAN-E012` | error | `requires` entry has invalid shape |
| `CASPIAN-E013` | error | `produces` is not an object |
| `CASPIAN-E014` | error | `produces` missing `type` field |
| `CASPIAN-W001` | warning | Unrecognized frontmatter field (outside agentskills.io / Claude Code overlay / `x-*` / vendor namespace) |
| `CASPIAN-W002` | warning | `type` uses namespace outside the `core:*` canonical registry |
| `CASPIAN-W003` | warning | `schema_version` value not recognized by this validator |

### Validation Pipeline

- **D1. Pipeline ordering** — fail-fast per stage; on failure at stage N, stages N+1..6 do not run for that file:
  1. **Byte-level** — encoding sniff (UTF-8 strict), BOM detection (`E001`, `E002`).
  2. **Frontmatter extraction** — `---` delimiters present, byte cap 4 KB enforced (`E004`, `E005`).
  3. **YAML parse** — `yaml` v2.x strict 1.2 safe-load + post-parse scan for unquoted-boolean values (`E003`, `E006`, `E007`).
  4. **Envelope schema** — `type` shape, `requires` array shape, `produces` object shape (`E008`–`E014`). `schema_version` is optional; absent = implicit `"0.1"`.
  5. **Namespace check** — `type` namespace warning if not in canonical `core:*` registry (`W002`); `schema_version` warning if value outside known set (`W003`).
  6. **Allow-list scan** — every frontmatter field outside the 22 recognized + `x-*` + `<vendor>:<name>` namespaced fields produces a `W001` warning.
- **D2. Error policy** — continue-and-collect within a single file (report all diagnostics for one file in one pass after stage 3 succeeds; stages 4–6 each emit independent diagnostics). Inter-file: continue always. Exit code reflects whether any file errored.
- **D3. Multi-file output** — per-file diagnostic block in human mode + summary footer (total files / errors / warnings). JSON mode emits `results: []` array + `summary: {}` object.
- **D4. Frontmatter byte-counting** — bytes between (but excluding) the opening and closing `---` lines, exclusive of the delimiter newlines themselves. Settles cross-platform CRLF/LF ambiguity.

### Distribution & Release

- **E1. CLI ↔ spec semver coupling** — decoupled. CLI has independent semver. CLI declares the supported `schema_version` range in `packages/cli/package.json` (e.g. `caspian.supportedSchemaVersions: ["0.1"]`). v1.0 ships CLI `0.1.0` + spec `schema_version: "0.1"`.
- **E2. npm publish provenance** — `npm publish --provenance` via GitHub Actions OIDC. Sigstore-backed; counters the lack of package-signing in the agent-skill ecosystem (Snyk audit context) at marginal cost.
- **E3. Pre-1.0 CLI version (deferred)** — ship CLI `0.x.y` series during pre-stable; promote to `1.0.0` when external adopter feedback signals stability.
- **E4. Release coordination (deferred)** — `changesets` (pnpm-friendly) for per-package semver in the monorepo; first implementation story configures it.

### Infrastructure & CI

- **F1. CI matrix** — Node 20 LTS + Node 22, Linux (`ubuntu-latest`) only for v1.0. macOS / Windows added in v1.1 if user demand emerges.
- **F2. Branch protection (deferred)** — required checks for `lint`, `test`, `fixture-suite`. Signed-commit enforcement is nice-to-have, not v1.0 gate.
- **F3. Performance instrumentation** — deferred to v1.1 per step-02 Operational Notes (NFR1/NFR2 are tracked budgets, not gated thresholds).
- **F4. Site deployment** — GitHub Pages source = `main` branch, `/site/` directory; GitHub Actions workflow `site.yml` regenerates `diagnostics.html` from `diagnostics/registry.json` and pushes to Pages.

### Security & Supply Chain

- **G1. Dependency audit (deferred details)** — `pnpm audit` non-blocking in CI; CVE high+ blocks the release pipeline.
- **G2. Lockfile policy** — `pnpm-lock.yaml` committed; CI uses `pnpm install --frozen-lockfile`. NFR21 reproducibility.
- **G3. Renovate (deferred)** — enabled day-one; auto-PRs for dependency bumps; BDFL approves manually.
- **G4. SBOM (deferred to v1.1)** — CycloneDX or SPDX manifest published alongside npm tarball.

### PRD Amendments Required

This step surfaced amendments needed in the PRD before v1.0 ship. Tracked here for a dedicated PRD-edit pass:

1. **FR1** — `schema_version` reclassified from *required* to *optional with implicit default `"0.1"`*.
2. **FR12** — *"rejects unknown frontmatter fields"* → *"warns on fields outside the recognized allow-list (Caspian fields + agentskills.io canonical + Claude Code overlay + `x-*` extensions + `<vendor>:<name>` namespaced)"*.
3. **API Surface** — clarification: `requires` / `produces` are semantically attached to active components (skills, commands, agents). Documents (passive output artifacts) carry `type` only.
4. **agentskills.io field list** — PRD's reference to agentskills.io canonical fields (`name`, `description`, `disable-model-invocation`, `model`, `version`) is incorrect. Real list: `name`, `description`, `license`, `allowed-tools`, `metadata`, `compatibility`. Claude Code adds 12 overlay fields.
5. **Product Scope** — *"JSON Schemas for all artifact types"* reinterpreted: v1.0 ships **one envelope schema**, not 11 per-`core:*`-type schemas. Per-type composition rules are casper-core's orchestration concern, not validator scope.

### Decision Impact Analysis

**Implementation sequence (Story-by-Story):**

1. **Story-001: Monorepo scaffold** — pnpm workspaces, `packages/cli` skeleton, `schemas/v1/envelope.schema.json` minimal version, one valid + one invalid fixture, `caspian validate <single-file>` returning exit 0/1, CI green.
2. **Story-002: Diagnostic registry** — `diagnostics/registry.json` + `scripts/gen-diagnostic-codes.ts`, all 17 v1.0 codes, fixture coverage one fixture per code.
3. **Story-003: Pipeline stages 1–3** — byte-level + frontmatter extraction + YAML parse including `E007` post-parse scan.
4. **Story-004: Pipeline stages 4–6** — envelope schema + namespace check + allow-list scan including the 22-field allow-list constant.
5. **Story-005: Glob walking + multi-file** — `fast-glob` with symlink/realpath safety, multi-file aggregation, summary footer.
6. **Story-006: `--format=json` + B4 stable schema** — JSON envelope, golden snapshot tests in vitest.
7. **Story-007: casper-core plugin** — three porcelain commands declaring typed `requires`/`produces`, README with override pattern (Journey 3).
8. **Story-008: caspian.dev landing page** — single-page HTML, `diagnostics.html` generated from registry, GH Pages workflow.
9. **Story-009: npm publish + provenance** — release pipeline, Sigstore OIDC, `--frozen-lockfile`, version `0.1.0`.

**Cross-component dependencies:**

- `schemas/v1/envelope.schema.json` is consumed by `packages/cli` at build (copy-schemas) and runtime (ajv) → bundling discipline + import-path locking are step-04 invariants.
- `diagnostics/registry.json` drives both `packages/cli/src/diagnostics/codes.generated.ts` (typed constants) and `site/diagnostics.html` (anchored documentation) → single source of truth, two derivatives.
- `packages/cli/package.json` declares `caspian.supportedSchemaVersions` → casper-core's plugin manifest declares the target spec version, providing forward-compat traceability.
- `notes/defensive-ops.md` (npm/PyPI/crates.io/GitHub squat-prevention) is operational hygiene, not a code dependency.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

The standard step-05 pattern categories (database naming, API endpoints, event systems, state management) do not apply to a developer-tool / CLI / spec project. The following categories cover the actual conflict surfaces for AI agents implementing Caspian.

**Critical conflict points addressed:** 8 categories spanning code naming, schema authoring, diagnostic style, test fixtures, YAML frontmatter authoring, Markdown conventions, error handling philosophy, and git workflow.

**Mechanical enforcement layer:** `biome` (configured in `biome.json` at the monorepo root) enforces TypeScript indent, quotes, trailing commas, semicolons, import ordering, base naming conventions (camelCase/PascalCase), and `useFilenamingConvention: kebab-case`. The patterns below capture decisions either not enforced by biome or worth documenting even when biome enforces them mechanically.

### Code Naming Conventions

| Item | Convention | Example |
|---|---|---|
| TypeScript files | `kebab-case.ts` | `frontmatter-parser.ts`, `validate-cmd.ts` |
| Unit test files | `*.test.ts` co-located with source | `parsers/yaml.test.ts` |
| Integration tests | `tests/integration/*.test.ts` | `tests/integration/cli-end-to-end.test.ts` |
| Fixture regression | `tests/fixtures-runner.test.ts` (single entry) | — |
| Functions / methods | camelCase verb | `parseFrontmatter`, `validateEnvelope` |
| Types / interfaces | PascalCase noun | `Diagnostic`, `ValidationResult` |
| Top-level constants | `SCREAMING_SNAKE_CASE` | `MAX_FRONTMATTER_BYTES = 4096` |
| Enums | PascalCase singular + lower-kebab string values | `type Severity = "error" \| "warning"` |
| Module exports | Named exports only (no `export default`) | `export function validateFile(path: string): Diagnostic[]` |

### JSON Schema Authoring

- `$schema: "https://json-schema.org/draft/2020-12/schema"` is always the first key in every schema file.
- `$id` is absolute and stable: `https://caspian.dev/schemas/v1/<name>.schema.json`.
- `title` is PascalCase and concise: `"CaspianEnvelope"`, `"RequiresEntry"`.
- `description` is full English, descriptive voice (*"The version of the Caspian spec the producer writes against."*), starts with a capital, ends with a period.
- Field names inside schemas mirror the frontmatter spelling exactly (`schema_version` snake_case for Caspian fields, `disable-model-invocation` kebab-case for Claude Code overlay, etc.). No transformation.
- Required fields are declared in `required: [...]`, not via `additionalProperties` constraints.
- `examples: [...]` array is recommended on every schema; consumed by IDE tooling.

### Diagnostic Message Style

- **Imperative present, no period.** *"Frontmatter exceeds 4 KB hard cap"*, not *"Your frontmatter is too big."*.
- Field names appear between backticks in the message text: *"`requires` entry missing `type` field"*.
- Messages do not blame the author (*"Did you forget…"*); they describe the state.
- Every diagnostic code has a stable doc URL by convention: `https://caspian.dev/diagnostics#<code-lowercase>` (e.g. `caspian.dev/diagnostics#caspian-e007`).
- `CASPIAN-W001` (unrecognized field) appends an edit-distance suggestion in the format *"Did you mean `<suggestion>`?"* when a candidate within edit distance ≤ 2 exists in the recognized allow-list.

### Test Fixture Conventions

- Layout:
  - `fixtures/valid/<type-or-purpose>/<variant>.md` — artifacts that must validate without errors (warnings allowed). Examples: `fixtures/valid/core-overview/minimal.md`, `fixtures/valid/overlay-compat/all-22-fields.md`.
  - `fixtures/invalid/<code>/<variant>.md` — artifacts that must emit a specific diagnostic code. Examples: `fixtures/invalid/E001-bom/with-bom.md`, `fixtures/invalid/E007-unquoted-bool/yes-as-string.md`.
- Each invalid fixture has a sibling `<variant>.expected.json` listing the expected diagnostics:

  ```json
  { "diagnostics": [ { "code": "CASPIAN-E001", "line": 1 } ] }
  ```

- The fixtures regression suite (`tests/fixtures-runner.test.ts`) is table-driven over discovery: adding a new fixture requires only the two files; the runner needs no edit.
- Explanatory comments belong in the markdown body of the fixture, never in the frontmatter; one sentence maximum.

### YAML Frontmatter Authoring (Fixtures + casper-core)

- **Field ordering convention** (top-to-bottom):
  1. Caspian core fields: `schema_version`, `type`, `requires`, `produces`.
  2. agentskills.io canonical: `name`, `description`, `license`, `allowed-tools`, `metadata`, `compatibility`.
  3. Claude Code overlay: `when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `model`, `effort`, `context`, `agent`, `hooks`, `paths`, `shell`.
  4. `x-*` extension fields.
  5. `<vendor>:<name>` namespaced fields.
- Strings: unquoted if safe (alphanumeric + `:` + `-` + `.`); double-quoted otherwise. No single quotes.
- Arrays/objects with more than one entry: block style (multi-line).
- Arrays/objects with one entry: flow style is acceptable (`requires: [{type: core:story}]`).
- 2-space indentation; no tabs (rejected by `CASPIAN-E003` per NFR8).
- No trailing whitespace.

### Markdown / Documentation Conventions

- ATX headers (`# Title`), never setext (underscored).
- One blank line between sections.
- Fenced code blocks always carry a language tag (` ```typescript `, ` ```yaml `, ` ```json `).
- No trailing whitespace.
- Advisory line length: 100 characters (not enforced by biome).
- Reference-style links for repeated URLs.
- Field names and code identifiers in backticks (`type`, `requires`, `validateFile`).
- Spec prose authored in English (per BMM `document_output_language: 'English'`).

### Error Handling Philosophy (Validator-Internal)

- **Validation outcomes return `Diagnostic[]`, never `throw`.** A function `validateFile(path: string): Diagnostic[]` always returns an array; an empty array means valid.
- **`throw` is reserved for internal validator bugs.** Top-level `cli.ts` catches all uncaught exceptions and exits with code `3`, printing message + stack trace to stderr plus an instruction *"Please report at <repo URL>"*.
- No `Result<T, E>` type abstraction in v1.0. `Diagnostic[]` is the contract; introducing a Result type would be premature abstraction.
- Internal errors and validation errors are routed differently: validation errors → stdout (or `--format=json` payload), internal errors → stderr.

### Git / Commit / Branch Conventions

- **Conventional Commits** for all commit messages: `feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`, `perf:`. Enables `changesets` (deferred) to auto-derive semver bumps and generate `CHANGELOG.md` entries.
- Branch naming:
  - Long-running: `main` only.
  - Feature: `feat/<short-slug>` (e.g. `feat/diagnostic-registry`).
  - Fix: `fix/<short-slug>`.
  - Chore: `chore/<short-slug>`.
- PR titles use the same format as commit subjects.
- Trunk-based workflow: no `develop`, `staging`, or release branches.

### Enforcement Mapping

| Pattern category | Mechanical enforcement | Audit method |
|---|---|---|
| Code naming, formatting | `biome` (`pnpm lint`) | CI gate |
| File naming kebab-case | `biome useFilenamingConvention` | CI gate |
| Test file location/naming | `vitest` config + convention | Test runner discovery |
| JSON Schema authoring | Convention + PR review | Manual; optional schema-of-schemas check post-v1.0 |
| Diagnostic message style | Convention + `registry.json` lint | Optional generation script check |
| Test fixture conventions | `tests/fixtures-runner.test.ts` auto-discovery | Test runner gate |
| YAML frontmatter ordering | Convention + PR review | Manual v1.0; potential validator extension v1.1 |
| Markdown conventions | `biome` (partial) | Linter gate |
| Error handling philosophy | TypeScript types + PR review | Compiler gate |
| Conventional Commits | `commitlint` git hook (optional) | Hook + PR review |

### Enforcement Guidelines

**All AI agents implementing Caspian MUST:**

- Run `pnpm lint && pnpm test` locally before any commit. CI re-runs both.
- Treat `biome.json` as authoritative; never disable rules in code (`// biome-ignore`) without an inline comment justifying the exception.
- Add a fixture whenever a new diagnostic rule is added, in both `valid/` and `invalid/` trees.
- Update `diagnostics/registry.json` for every new code; the generated `codes.generated.ts` must never be edited by hand.
- Follow Conventional Commits; PRs not following the convention are blocked by review.

### Pattern Examples

**Good — diagnostic message:**

```typescript
const E_BOM_REJECTED: DiagnosticCode = {
  code: "CASPIAN-E001",
  severity: "error",
  message: "BOM byte sequence (`EF BB BF`) detected at file start",
  doc: "https://caspian.dev/diagnostics#caspian-e001",
};
```

**Anti-pattern — diagnostic message:**

```typescript
const E_BOM_REJECTED = {
  code: "BOM_ERR",                                    // missing CASPIAN- prefix
  severity: "error",
  message: "Your file has a BOM. Remove it please.",  // user-blame, period
  // no doc URL
};
```

**Good — fixture layout:**

```text
fixtures/invalid/E007-unquoted-bool/yes-as-string.md
fixtures/invalid/E007-unquoted-bool/yes-as-string.expected.json
```

**Anti-pattern — fixture layout:**

```text
fixtures/test_07_yes_unquoted.md          # no code prefix, snake_case
fixtures/test_07_yes_unquoted_test.ts     # assertion in TS instead of JSON sibling
```

## Project Structure & Boundaries

### Tooling Decisions Locking This Structure

Three foundational tool choices are locked at this step (answering open questions surfaced during party-mode review):

- **Monorepo orchestration**: `pnpm workspaces` alone (no `turbo`, no `nx`). With three packages (`core`, `cli`, `casper-core`), turbo's caching benefit does not pay back its config cost; nx is over-engineered for the scale.
- **Release coordination**: `changesets` (pnpm-friendly). Per-package independent semver bumps; contributor adds a `.changeset/<random>.md` with their PR; CI composes the CHANGELOG and creates a release PR at tag.
- **Vendor-neutrality enforcement**: `dependency-cruiser` (replaces the earlier `grep` smoke check). Catches transitive dependencies, type-only imports, and dynamic imports that grep would miss.

### Complete Project Directory Structure

Provisional location: `joselimmo-marketplace/caspian/`. Migrates to a dedicated `caspian/` repository when the spec stabilizes.

```text
caspian/
├── LICENSE                                    # Apache-2.0 root default
├── LICENSE-CC-BY-4.0                          # referenced by spec/LICENSE.md and site/LICENSE.md
├── README.md                                  # 4-CTA hub mirroring caspian.dev landing
├── CONTRIBUTING.md                            # repo-level + decision tree "Where do I log this change?"
├── CHANGELOG.md                               # repo-level (governance header at top)
├── CONTRIBUTORS.md                            # auto-maintained by changesets
├── SECURITY.md                                # responsible disclosure policy; links to .github/SECURITY-OPS.md
├── CODE_OF_CONDUCT.md                         # Contributor Covenant 2.1 unedited
├── package.json                               # workspace root; private:true; scripts: lint/test/build/release
├── pnpm-workspace.yaml                        # packages: ["packages/*"]
├── pnpm-lock.yaml                             # committed (NFR21)
├── tsconfig.base.json                         # strict, nodenext, ES2022; extended by packages/*
├── biome.json                                 # monorepo-wide; rules: kebab-case files, named exports, noRestrictedImports
├── .biomeignore                               # excludes **/dist/, **/*.generated.ts, pnpm-lock.yaml, fixtures/invalid/**
├── .gitignore                                 # node_modules/, packages/*/dist/, site/dist/, *.tsbuildinfo, .vitest-cache/, .DS_Store, .env*, *.log, coverage/
├── .gitattributes                             # codes.generated.ts: merge=ours linguist-generated=true
├── .npmrc                                     # auto-install-peers=true, strict-peer-dependencies=true
├── .editorconfig                              # 2 spaces, LF, UTF-8, trim trailing whitespace, final newline
├── .nvmrc                                     # 20.10
├── .changeset/
│   ├── config.json                            # changesets config (semver mode, base branch, repo)
│   └── README.md                              # contributor guide for adding a changeset
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                             # lint + test + fixture-suite + dep-cruiser + pack-snapshot + ajv-validate-registry; Node 20+22 on ubuntu-latest
│   │   ├── release.yml                        # changesets release PR; on merge: pnpm publish --provenance via OIDC
│   │   └── site.yml                           # rebuild diagnostics.html from registry.json + deploy to GH Pages on main push
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── CODEOWNERS                             # solo BDFL initially; updates as contributors join
│   ├── dependabot.yml                         # weekly bumps for npm + github-actions
│   └── SECURITY-OPS.md                        # operational ops: defensive name registration plan (npm/PyPI/crates.io/GitHub)
│
├── spec/                                      # CC-BY-4.0 (override of root Apache-2.0)
│   ├── LICENSE.md                             # CC-BY-4.0 explicit; applies to all files in this directory
│   ├── README.md                              # spec entry point (5-min intro)
│   ├── core.md                                # NORMATIVE — the 4-field contract reference (≤10 min readable, FR33)
│   ├── CHANGELOG.md                           # spec semver (governance header: "tracks normative changes; bumps require RFC")
│   ├── CONTRIBUTING.md                        # RFC process (FR23-26), BDFL response SLA, conflict resolution
│   ├── proposals/
│   │   ├── TEMPLATE.md                        # 4 mandated sections (FR24)
│   │   └── 0001-initial-spec.md               # v1.0 freeze as foundational proposal
│   └── vocabulary/                            # FR34 — per-core:* type rationale
│       ├── README.md                          # vocabulary index + 7-section template described
│       ├── overview.md
│       ├── epic.md
│       ├── story.md
│       ├── plan.md
│       ├── adr.md
│       ├── convention.md
│       ├── learning.md
│       ├── glossary.md
│       ├── review.md
│       ├── rule.md
│       └── scratch.md
│
├── schemas/                                   # Apache-2.0 (single source of truth)
│   ├── LICENSE                                # Apache-2.0 explicit
│   └── v1/
│       ├── envelope.schema.json               # Caspian envelope (Draft 2020-12); $id stable
│       └── diagnostic-registry.schema.json    # validates the structure of diagnostics/registry.json
│
├── diagnostics/                               # Apache-2.0 (versioned diagnostic registry)
│   ├── LICENSE                                # Apache-2.0 explicit
│   ├── registry.json                          # AUTHORITATIVE — 17 codes, hand-authored, append-only
│   └── CHANGELOG.md                           # registry semver (governance header: "tracks diagnostic codes; semver decoupled from spec")
│
├── fixtures/                                  # Apache-2.0 (validator regression test data)
│   ├── LICENSE                                # Apache-2.0 explicit
│   ├── README.md                              # 3-line clarification: machine-consumed regression data, not author-readable how-tos
│   ├── valid/
│   │   ├── core-overview/minimal.md
│   │   ├── core-epic/minimal.md
│   │   ├── core-story/minimal.md
│   │   ├── core-plan/minimal.md
│   │   └── overlay-compat/{all-22-known-fields, x-extension, vendor-namespaced}.md
│   └── invalid/
│       ├── E001-bom/{with-bom.md, with-bom.expected.json}
│       ├── E002-encoding/...
│       ├── ... (one directory per code: E001..E014, W001..W003)
│       └── W003-unrecognized-schema-version/...
│
├── examples/                                  # mixed Apache-2.0 + CC-BY-4.0 (author-readable how-tos)
│   ├── README.md                              # 3-line clarification: complete walkthroughs, distinct from fixtures
│   ├── minimal-skill-adoption/                # FR35
│   │   ├── README.md
│   │   ├── before/SKILL.md                    # vanilla Anthropic SKILL.md
│   │   └── after/SKILL.md                     # +4 lines Caspian frontmatter
│   └── ci-integration/                        # FR36
│       ├── README.md
│       └── github-actions-snippet.yml         # 3-line `npx caspian validate ./`
│
├── conformance/                               # vendor-neutral conformance test suite
│   ├── README.md                              # how to run an arbitrary validator against the suite
│   ├── runner.mjs                             # harness; takes validator binary path as argument; produces REPORT.md
│   ├── REPORT.template.md                     # template for conformance reports
│   └── cases/
│       ├── 001-bom-rejection/{input.md, expected.json}
│       ├── 002-tab-indent-rejection/{input.md, expected.json}
│       └── ... (case per critical behavior; v1.0 ships ~17 cases mirroring the diagnostic codes)
│
├── packages/                                  # NODE packages ONLY — vendor-neutral
│   ├── core/                                  # @caspian/core — pure validation; consumed by cli (and v1.1 LSP/CI/runtime/install layers)
│   │   ├── LICENSE                            # Apache-2.0 explicit
│   │   ├── README.md                          # API surface, public exports, semver promise
│   │   ├── CHANGELOG.md                       # core semver (governance header)
│   │   ├── package.json                       # name="@caspian/core"; exports: { ".": "./dist/index.js", "./diagnostics": "./dist/diagnostics/index.js" }; engines.node=">=20.10"
│   │   ├── tsconfig.json                      # extends ../../tsconfig.base.json; rootDirs: ["./src"] (no .. ascent — D3 verrou 1)
│   │   ├── vitest.config.ts                   # cwd-stable test config (uses import.meta.url)
│   │   ├── src/
│   │   │   ├── index.ts                       # barrel export; defines public API surface
│   │   │   ├── parsers/{byte-reader, frontmatter, yaml}.ts
│   │   │   ├── validators/{envelope, namespace, allow-list}.ts
│   │   │   ├── diagnostics/
│   │   │   │   ├── codes.generated.ts         # GENERATED from diagnostics/registry.json — DO NOT EDIT (sha256 header — D3 / safeguards)
│   │   │   │   ├── reporter.ts                # interface; concrete formatters live in packages/cli
│   │   │   │   └── types.ts                   # Diagnostic, Severity, ValidationResult
│   │   │   ├── pipeline.ts                    # orchestrates 6-stage pipeline (D1)
│   │   │   ├── schemas/
│   │   │   │   └── loader.ts                  # SOLE entry point for reading bundled schemas (D3 verrou 3)
│   │   │   └── constants.ts                   # MAX_FRONTMATTER_BYTES, RECOGNIZED_FIELDS, etc.
│   │   ├── tests/
│   │   │   ├── helpers/
│   │   │   │   └── paths.ts                   # REPO_ROOT, FIXTURES_DIR, SCHEMAS_DIR via import.meta.url
│   │   │   ├── unit/                          # mirrors src/ structure
│   │   │   │   ├── parsers/{byte-reader, frontmatter, yaml}.test.ts
│   │   │   │   ├── validators/{envelope, namespace, allow-list}.test.ts
│   │   │   │   └── pipeline.test.ts
│   │   │   ├── integration/
│   │   │   │   └── full-pipeline.test.ts      # orchestrated multi-stage scenarios
│   │   │   └── fixtures-runner.test.ts        # auto-discovers fixtures/** via REPO_ROOT helper
│   │   ├── scripts/
│   │   │   ├── copy-schemas.ts                # build-time: schemas/v1/* → dist/schemas/v1/*
│   │   │   ├── gen-diagnostic-codes.ts        # diagnostics/registry.json → src/diagnostics/codes.generated.ts (writes sha256 header)
│   │   │   └── verify-codes-hash.ts           # CI: re-hashes registry.json and compares to header in codes.generated.ts; fails on mismatch
│   │   └── dist/                              # gitignored; tsc + copy-schemas output
│   │
│   └── cli/                                   # caspian — npm CLI wrapper around @caspian/core
│       ├── LICENSE                            # Apache-2.0 explicit
│       ├── README.md                          # install, validate <path>, exit codes, --format=json
│       ├── CHANGELOG.md                       # cli semver (governance header: "decoupled from core; stable CLI surface")
│       ├── package.json                       # name="caspian"; bin={"caspian":"./dist/cli.js"}; deps: @caspian/core (workspace:^), commander, fast-glob, chalk; engines.node=">=20.10"; caspian.supportedSchemaVersions=["0.1"]; files: ["dist/", "README.md", "CHANGELOG.md", "LICENSE"]
│       ├── tsconfig.json                      # extends base; rootDirs: ["./src"]
│       ├── vitest.config.ts
│       ├── .dependency-cruiser.cjs            # forbidden imports rule (no @anthropic-ai/* or @claude/*)
│       ├── src/
│       │   ├── cli.ts                         # entry: parse argv, dispatch, top-level catch → exit 3
│       │   ├── version.ts                     # generated at build from package.json
│       │   ├── commands/
│       │   │   └── validate.ts                # caspian validate <path>: walks → core.validateFile() → reporter
│       │   ├── walker.ts                      # fast-glob, no-symlinks, realpath check
│       │   ├── output/
│       │   │   ├── human.ts                   # ANSI-aware human formatter (uses chalk)
│       │   │   └── json.ts                    # stable JSON output schema (B4)
│       │   └── constants.ts
│       ├── tests/
│       │   ├── helpers/paths.ts
│       │   ├── unit/...
│       │   ├── integration/
│       │   │   ├── cli-end-to-end.test.ts     # exec the bin, assert stdout+exit
│       │   │   └── format-json.test.ts        # golden snapshots
│       │   └── published-files.snapshot.json  # tracked artifact: `pnpm pack --dry-run --json` snapshot for regression
│       ├── scripts/
│       │   └── verify-pack.ts                 # CI: pnpm pack --dry-run --json | diff snapshot; fails on drift
│       └── dist/                              # gitignored; npm-published
│
├── plugins/                                   # vendor-specific integrations; NOT Node packages
│   └── casper-core/                           # Claude Code plugin — entire directory IS the Claude-Code-bound surface
│       ├── LICENSE                            # Apache-2.0 explicit
│       ├── README.md                          # FR37 — install, 3 commands, override pattern (Journey 3), explicit scope boundary
│       ├── plugin.json                        # Claude Code plugin manifest (declares supported caspian schema_version)
│       └── commands/
│           ├── init-project.md                # FR15 — produces core:overview
│           ├── discover.md                    # FR16 — produces core:epic + core:story
│           └── plan-story.md                  # FR17 — requires core:story, produces core:plan
│
└── site/                                      # caspian.dev source — dual-licensed
    ├── LICENSE.md                             # explicit dual: prose CC-BY-4.0, build code Apache-2.0
    ├── package.json                           # build script deps (none in v1.0; pure node:fs + node:url)
    ├── build.mjs                              # reads diagnostics/registry.json → emits diagnostics.html with stable anchors
    ├── src/
    │   ├── index.html                         # 30-sec pitch, 4-line quickstart, 4 CTAs (mirrors root README hub)
    │   ├── diagnostics.html.tpl               # template; concrete diagnostics.html generated by build.mjs
    │   └── styles.css                         # minimal, WCAG 2.1 AA semantic
    └── dist/                                  # gitignored; built artifacts pushed to GH Pages
```

### Architectural Boundaries

**Vendor-neutrality boundary** (replaces earlier grep approach with a 3-layer mechanism):

1. **Source-level** — `packages/cli/.dependency-cruiser.cjs` declares a `forbidden` rule: `from: ^packages/(core|cli)/src` to `^node_modules/(@anthropic-ai|@claude)`. Catches direct, transitive, type-only, and statically-resolvable dynamic imports. Runs in CI as `pnpm depcruise`.
2. **Lockfile-level** — CI step `pnpm ls --prod --depth=Infinity --json | jq` checks no resolved dependency name in `packages/core` or `packages/cli` matches `claude` or `anthropic`. Catches transitives that bypass dep-cruiser.
3. **Runtime-level** — release gate: `docker run --rm -v $(pwd):/work node:20-alpine sh -c "cd /work && npx caspian validate ./fixtures/valid/"` passes on a vanilla Linux container with no Claude Code installed. The execution proof.

The grep approach is rejected; it provides false confidence on transitive deps and type-only imports.

**Single source of truth for schemas** (3-verrou enforcement, replaces aspirational claim):

- **Verrou 1 — TypeScript `rootDirs`**: `packages/core/tsconfig.json` declares `rootDirs: ["./src"]`. Any relative import that ascends out of `src/` (e.g. `import schema from '../../../schemas/v1/envelope.schema.json'`) is a TypeScript compile error.
- **Verrou 2 — biome `noRestrictedImports`**: rule pattern `**/schemas/**` is forbidden EXCEPT via `packages/core/src/schemas/loader.ts`. Lint failure in CI.
- **Verrou 3 — single loader module**: `packages/core/src/schemas/loader.ts` is the sole entry point that reads bundled schemas (resolves `path.resolve(__dirname, '../schemas/v1/envelope.schema.json')` via lazy initialization, with fallback to repo-root `schemas/v1/` for dev mode based on `import.meta.url` resolution). Audit: `grep -rn 'envelope.schema' packages/core/src` returns exactly 1 result (`loader.ts`).

**Diagnostic registry boundary** (now schema-validated):

- **Authoritative source**: `diagnostics/registry.json` (hand-authored, append-only).
- **Schema validator**: `schemas/v1/diagnostic-registry.schema.json` defines the registry's required structure (codes, severity enum, message/doc fields). CI step `ajv validate -s schemas/v1/diagnostic-registry.schema.json -d diagnostics/registry.json` blocks merges of malformed registry edits.
- **Generated derivative #1**: `packages/core/src/diagnostics/codes.generated.ts` (typed TS constants). Header includes `// Hash: <sha256 of registry.json at gen time>`. CI's `verify-codes-hash.ts` recomputes the registry hash and compares; mismatch = fail.
- **Generated derivative #2**: `site/dist/diagnostics.html` (built by `site/build.mjs`).
- **Tampering safeguards**: `.gitattributes` declares `codes.generated.ts merge=ours linguist-generated=true` (auto-resolve to ours-then-regen on rebase + GitHub marks the file generated in PR diffs). Pre-commit hook (`simple-git-hooks`) runs `pnpm gen:codes && git add codes.generated.ts` on every commit touching `registry.json`.

**Vendor-vs-host package boundary**:

- `packages/` contains **only** Node packages publishable via npm with a `package.json` and `dist/` build output. Currently `core` and `cli`.
- `plugins/` contains **vendor-specific integrations** (markdown + manifest, no Node code). Currently `casper-core/` for Claude Code. Future: `cursor-core/`, `continue-core/`, etc.
- pnpm workspace resolves `packages/*` only; `plugins/*` are plain git-tracked files.
- This boundary forbids accidentally introducing JS into a plugin (which would create a Claude-Code-bound binary inside the otherwise neutral monorepo).

**License boundary** (per-directory LICENSE files, root composite):

- `/LICENSE` — Apache-2.0 (project default). GitHub Linguist surfaces this as the repo's license.
- `/spec/LICENSE.md` — CC-BY-4.0 (overrides for prose).
- `/site/LICENSE.md` — explicit dual statement (prose CC-BY-4.0, build code Apache-2.0). SPDX headers in source files.
- Each sub-package (`packages/core`, `packages/cli`, `plugins/casper-core`, `schemas`, `diagnostics`, `fixtures`) re-declares its Apache-2.0 LICENSE explicitly so isolated consumers see the license unambiguously. Standard pattern (Kubernetes, CNCF projects).
- Documented in root `README.md` "License" section.

**Distribution boundary** (reframed: 1 coordinated release → 3 downstream surfaces):

> Caspian publishes 1 coordinated release per semver tag from the monorepo. The tag triggers `release.yml` which runs changesets to compose CHANGELOGs, then publishes the npm packages with provenance. This single release fans out to 3 downstream consumer surfaces:
>
> - **npm registry** (primary artifact): `@caspian/core` + `caspian` (CLI wrapper).
> - **Anthropic plugin marketplace** (downstream): `plugins/casper-core/` packaged and submitted; the manifest declares the target `schema_version`.
> - **caspian.dev** (downstream): `site/dist/` regenerated from `diagnostics/registry.json` and `spec/` content; deployed to GitHub Pages.
>
> The 3 surfaces never drift independently: a single git tag drives all 3, with deterministic propagation.

The earlier "3 channels independent" framing is rejected as misleading.

### Requirements to Structure Mapping

**Spec Contract Authoring** (FR1–FR6) → `schemas/v1/envelope.schema.json` (the contract) + `spec/core.md` (normative reference) + `spec/vocabulary/*.md` (per-`core:*` type rationale).

**Artifact Validation** (FR7–FR14) → `packages/core/src/**/*.ts` (validator logic) + `packages/cli/src/**/*.ts` (CLI surface) + `diagnostics/registry.json` (codes) + `fixtures/**` (regression coverage). FR9 doc links emitted by `packages/cli/src/output/{human,json}.ts` reading from `diagnostics/registry.json`.

**Reference Workflow casper-core** (FR15–FR19) → `plugins/casper-core/commands/{init-project,discover,plan-story}.md`. Each file's frontmatter declares the `requires`/`produces` contract; the markdown body is the prompt body Claude Code injects.

**Plugin Composition & Overrides** (FR20–FR22) → documented in `plugins/casper-core/README.md` (FR37); relies on Claude Code's native skill-override behavior; no Caspian-specific code.

**Governance & Evolution** (FR23–FR27) → `spec/CONTRIBUTING.md` + `spec/proposals/TEMPLATE.md` + `spec/CHANGELOG.md` + `CONTRIBUTORS.md` (auto-maintained by changesets) + `CODE_OF_CONDUCT.md`.

**Distribution & Discoverability** (FR28–FR32) → root `LICENSE` + `LICENSE-CC-BY-4.0` (FR28) + `packages/cli/package.json` (FR29) + `plugins/casper-core/plugin.json` (FR30) + `site/src/index.html` (FR31) + `site/build.mjs` (FR32).

**Developer Onboarding & Documentation** (FR33–FR38) → `spec/README.md` (FR33) + `spec/vocabulary/*.md` (FR34) + `examples/minimal-skill-adoption/` (FR35) + `examples/ci-integration/` (FR36) + `plugins/casper-core/README.md` (FR37) + `fixtures/**` (FR38).

**Cross-cutting concerns mapping**:

- **Single source of truth for schemas** → `schemas/v1/` (envelope + diagnostic-registry schemas); consumed exclusively via `packages/core/src/schemas/loader.ts`.
- **Versioned diagnostic registry** → `diagnostics/registry.json`; derivatives `packages/core/src/diagnostics/codes.generated.ts` + `site/dist/diagnostics.html`.
- **Surface isolation** → `plugins/casper-core/` is the entire Claude-Code-bound surface; everything else neutral.
- **Doc-URL stability** → anchor format `caspian.dev/diagnostics#caspian-eXXX`.
- **Fixture-first discipline** → `fixtures/**` paired with `packages/core/tests/fixtures-runner.test.ts`.
- **Conformance suite** → `conformance/` enables external validators (v1.1 layers, third-party implementations) to prove conformance against the same case set.
- **Output channel duality** → `packages/cli/src/output/{human,json}.ts`.
- **Ecosystem-positioning discipline** → `spec/core.md` overlay-compat statement + `spec/CHANGELOG.md` sunset protocol notes + repo-level `CONTRIBUTING.md`.

### Integration Points

**Internal data flow (validation pipeline)**:

```text
file path
  ↓ packages/cli/src/walker.ts (fast-glob, realpath check)
  ↓ packages/core/src/parsers/byte-reader.ts (encoding sniff, BOM check)
  ↓ packages/core/src/parsers/frontmatter.ts (--- extract, byte cap)
  ↓ packages/core/src/parsers/yaml.ts (strict 1.2 parse, unquoted-bool scan)
  ↓ packages/core/src/validators/envelope.ts (ajv against bundled envelope schema)
  ↓ packages/core/src/validators/namespace.ts (type / schema_version warnings)
  ↓ packages/core/src/validators/allow-list.ts (22 known + x-* + vendor:*)
  ↓ Diagnostic[]
  ↓ packages/cli/src/output/{human,json}.ts (formatter)
  → stdout (results) + exit code
```

**Internal generation flow (build-time derivatives)**:

```text
diagnostics/registry.json
  ├→ packages/core/scripts/gen-diagnostic-codes.ts → packages/core/src/diagnostics/codes.generated.ts (with sha256 header)
  ├→ site/build.mjs → site/dist/diagnostics.html
  └→ ajv validate -s schemas/v1/diagnostic-registry.schema.json -d diagnostics/registry.json (CI gate, no derivative)

schemas/v1/envelope.schema.json
  └→ packages/core/scripts/copy-schemas.ts → packages/core/dist/schemas/v1/envelope.schema.json
```

**External integrations**:

- **npm registry** (publish) — `release.yml` runs `pnpm publish --provenance` from `packages/core` then `packages/cli` after changesets composes the release. OIDC token from Actions, signed via Sigstore.
- **GitHub Pages** (deploy) — `site.yml` triggers on push to `main`, runs `pnpm --filter site run build`, deploys `site/dist/` to GH Pages.
- **Anthropic plugin marketplace** (publish) — manual submission of `plugins/casper-core/` zip in v1.0; not automated.
- **JSON Schema Store** (deferred to v1.1) — submit `schemas/v1/envelope.schema.json` PR. Stable `$id` URI is the prerequisite.
- **agentskills.io** (upstream proposal) — `requires`/`produces` proposals submitted as RFCs to `agentskills.io` repo before v1.0 ships.

**Conformance suite consumers**:

- `packages/cli` (eats its own dog food: CLI run against `conformance/cases/` is a CI gate).
- v1.1 LSP, CI ajv layer, runtime hook, install-time validator (run `conformance/runner.mjs` with their binary as argument; produce REPORT.md asserting parity).
- Third-party validators (e.g. a future Python `caspian-py` per the Vision section) declare conformance by passing the suite.

### File Organization Patterns

**Configuration files at root**: `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `.npmrc`, `tsconfig.base.json` (extended by `packages/*/tsconfig.json`), `biome.json` (single config monorepo-wide), `.biomeignore`, `.gitignore`, `.gitattributes`, `.editorconfig`, `.nvmrc`, `.changeset/`.

**Per-package configuration**: each `packages/*/` has `package.json`, `tsconfig.json` extending the base, and `vitest.config.ts`.

**Source organization** (TypeScript packages):

- `src/` for production code; mirrored by `tests/unit/` for unit tests (separate directory keeps `src/` clean for npm publish).
- `tests/integration/` for end-to-end / multi-stage tests.
- `tests/helpers/paths.ts` resolves `REPO_ROOT` via `import.meta.url` (never `process.cwd()`); exposes `FIXTURES_DIR`, `SCHEMAS_DIR`, etc.
- `tests/fixtures-runner.test.ts` is the auto-discovery entry consuming `fixtures/**`. Lives in `packages/core/tests/` (it tests core API behavior).
- `scripts/` for build-time tools (copy-schemas, gen-diagnostic-codes, verify-codes-hash, verify-pack); excluded from npm publish via `files: [...]` allow-list in `package.json`.
- `dist/` is the build output (gitignored, npm-published).

**Test organization**:

- `packages/core/tests/unit/` mirrors `packages/core/src/`.
- `packages/cli/tests/unit/` mirrors `packages/cli/src/`.
- `packages/core/tests/integration/full-pipeline.test.ts` exercises orchestrated multi-stage scenarios against the public API.
- `packages/cli/tests/integration/cli-end-to-end.test.ts` exec's the CLI binary as a subprocess and asserts stdout/exit.
- `packages/cli/tests/integration/format-json.test.ts` golden-snapshots the `--format=json` output.
- `packages/core/tests/fixtures-runner.test.ts` table-driven over `fixtures/**` discovery.
- `conformance/runner.mjs` is a separate harness, not a vitest suite; invoked via `pnpm conformance` script.

### Development Workflow Integration

**Setup**:

```bash
pnpm install                          # one-time; verifies frozen lockfile in CI
pnpm gen:codes                        # regenerates packages/core/src/diagnostics/codes.generated.ts
pnpm build                            # tsc + copy-schemas across all packages
```

**Iteration**:

```bash
pnpm --filter @caspian/core dev       # tsc --watch + vitest --watch
pnpm --filter caspian dev             # tsc --watch + vitest --watch (depends on @caspian/core via workspace:^)
pnpm --filter site build              # node build.mjs
pnpm conformance                      # ./conformance/runner.mjs against packages/cli/dist/cli.js
```

**Pre-commit hooks** (via `simple-git-hooks`): `pnpm gen:codes && git add packages/core/src/diagnostics/codes.generated.ts` on every commit.

**CI workflow** (`ci.yml`):

1. `pnpm install --frozen-lockfile`
2. `pnpm lint` (biome)
3. `pnpm depcruise` (dependency-cruiser vendor-neutrality check)
4. `pnpm verify-codes-hash` (codes.generated.ts hash matches registry.json)
5. `pnpm test` (all packages, vitest)
6. `pnpm ajv-validate-registry` (registry.json conforms to its schema)
7. `pnpm verify-pack` (npm pack snapshot regression test)
8. `pnpm conformance` (CLI runs the conformance suite)

**Release workflow** (`release.yml`, on PR merge):

1. `changesets version` composes CHANGELOGs across packages
2. `pnpm install --frozen-lockfile`
3. `pnpm build`
4. `pnpm publish -r --provenance` (publishes `@caspian/core` then `caspian`)
5. `git push --tags`
6. Triggers `site.yml` for GH Pages redeployment.

**Implementation sequence (Story-by-Story, revised for core+cli split + conformance + plugins)**:

1. **Story-001: Monorepo scaffold** — pnpm workspaces, root configs (biome, tsconfig.base, .changeset, .gitignore, .gitattributes, .editorconfig), `packages/core` skeleton with `package.json` + `tsconfig.json` + minimal `src/index.ts`, `packages/cli` skeleton consuming `@caspian/core` via `workspace:^`, schemas/v1/envelope.schema.json minimal version, one valid + one invalid fixture, `caspian validate <single-file>` returning exit 0/1, CI green (lint + test + dep-cruise).
2. **Story-002: Diagnostic registry + safeguards** — `diagnostics/registry.json` with all 17 codes, `schemas/v1/diagnostic-registry.schema.json`, `gen-diagnostic-codes.ts` with sha256 header, `verify-codes-hash.ts`, `.gitattributes`, pre-commit hook configured.
3. **Story-003: Pipeline stages 1–3 in `@caspian/core`** — byte-level + frontmatter extraction + YAML parse + post-parse unquoted-bool scan, with fixture coverage E001–E007.
4. **Story-004: Pipeline stages 4–6 in `@caspian/core`** — envelope schema validation + namespace check + allow-list scan, fixture coverage E008–E014, W001–W003.
5. **Story-005: CLI walker + multi-file** — `packages/cli/src/walker.ts`, `packages/cli/src/output/human.ts`, summary footer, integration tests.
6. **Story-006: `--format=json` + B4 stable schema** — `packages/cli/src/output/json.ts`, golden snapshot tests, `published-files.snapshot.json` baseline + `verify-pack.ts`.
7. **Story-007: casper-core plugin** — `plugins/casper-core/{plugin.json, commands/*.md, README.md}` declaring typed `requires`/`produces`, override-pattern documented per Journey 3.
8. **Story-008: caspian.dev landing + diagnostics page** — `site/src/index.html` + `site/build.mjs` reading `diagnostics/registry.json` → `site/dist/diagnostics.html`, GH Pages workflow.
9. **Story-009: Conformance suite** — `conformance/runner.mjs` + `conformance/cases/` (one case per diagnostic code), CI step `pnpm conformance`.
10. **Story-010: npm publish + provenance + governance docs** — `release.yml` with changesets + provenance OIDC, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `.github/SECURITY-OPS.md` (defensive name registration plan), `CODEOWNERS`, `dependabot.yml`, version `0.1.0` first publish.

### Cross-Component Dependencies

- `schemas/v1/envelope.schema.json` is consumed by `packages/core/scripts/copy-schemas.ts` (build) and `packages/core/src/schemas/loader.ts` (runtime, sole entry).
- `schemas/v1/diagnostic-registry.schema.json` is consumed by CI `pnpm ajv-validate-registry` step before any merge to `diagnostics/registry.json`.
- `diagnostics/registry.json` drives `packages/core/src/diagnostics/codes.generated.ts` (via `gen-diagnostic-codes.ts` with sha256 verification) AND `site/dist/diagnostics.html` (via `site/build.mjs`).
- `packages/cli/package.json` declares `caspian.supportedSchemaVersions` → `plugins/casper-core/plugin.json` declares the target `schema_version` → forward-compat traceability across components.
- `conformance/cases/` consumes `diagnostics/registry.json` indirectly (cases mirror codes 1:1 in v1.0); future external validators consume `conformance/runner.mjs`.
- `.github/SECURITY-OPS.md` documents the operational ops backing `notes/defensive-ops.md` (which has been merged into SECURITY-OPS.md per maintainer-facing audience).

## Architecture Validation Results

### Coherence Validation ✅

**Decision compatibility — clean.** All technology choices play together: Node ≥ 20.10 LTS + TypeScript 5 strict (nodenext, ES2022) + pnpm workspaces + tsc + `commander` v12 + `yaml` v2 strict 1.2 + `ajv` v8 (Draft 2020-12) + `fast-glob` + `vitest` v3 + `biome` + `changesets` + `dependency-cruiser`. No version conflicts identified; all deps maintain compatible release cycles in 2026.

**Pattern consistency — clean.** Step-05 patterns are aligned with step-04 decisions: kebab-case file convention is enforced by biome's `useFilenamingConvention`; named exports match TS best-practice + tooling support; fixture layout `<code>/<variant>.md + .expected.json` matches the auto-discovery model in `tests/fixtures-runner.test.ts`; conventional-commits aligns with changesets' release-PR generation.

**Structure alignment — clean.** Step-06 monorepo (`packages/{core, cli}` + `plugins/casper-core/` + `spec/` + `schemas/` + `diagnostics/` + `fixtures/` + `examples/` + `conformance/` + `site/`) supports every step-04 decision and every step-05 pattern boundary. The 3-layer vendor-neutrality enforcement (dependency-cruiser + lockfile audit + docker gate), the 3-verrou single-SoT enforcement (tsconfig rootDirs + biome noRestrictedImports + single loader), and the diagnostic-registry CI guard (sha256 header + verify-codes-hash + .gitattributes + pre-commit hook + ajv-validate-registry) collectively transform aspirational invariants into mechanical guarantees.

### Requirements Coverage Validation ✅

**Functional Requirements — 38/38 covered.**

| Category | FRs | Architectural support |
|---|---|---|
| Spec Contract Authoring | FR1–FR6 | `schemas/v1/envelope.schema.json` + `spec/core.md` + `spec/vocabulary/*.md` + envelope `additionalProperties: true` for FR5 + allow-list scan accepts `x-*` for FR6 |
| Artifact Validation | FR7–FR14 | `packages/cli/src/walker.ts` (FR7) + `packages/cli/src/output/json.ts` (FR8) + `reporter.ts` with edit-distance + doc links (FR9) + exit code matrix in `cli.ts` (FR10) + dependency-cruiser + docker gate (FR11) + allow-list scan amended to warn (FR12 — see PRD amendment) + `validators/namespace.ts` W002 (FR13) + Draft 2020-12 schemas (FR14) |
| Reference Workflow casper-core | FR15–FR19 | `plugins/casper-core/commands/{init-project,discover,plan-story}.md` |
| Plugin Composition & Overrides | FR20–FR22 | Documented in `plugins/casper-core/README.md`; relies on Claude Code's native skill-override behavior |
| Governance & Evolution | FR23–FR27 | `spec/CONTRIBUTING.md` + `spec/proposals/TEMPLATE.md` + `spec/CHANGELOG.md` (governance header) + `CONTRIBUTORS.md` (auto-maintained by changesets) + BACKWARD_TRANSITIVE policy in `spec/core.md` |
| Distribution & Discoverability | FR28–FR32 | Root `LICENSE` + `LICENSE-CC-BY-4.0` (FR28) + `packages/cli/package.json` `name="caspian"` (FR29) + `plugins/casper-core/plugin.json` (FR30) + `site/src/index.html` 4-CTA hub (FR31) + `site/build.mjs` stable anchor IDs (FR32) |
| Developer Onboarding | FR33–FR38 | `spec/README.md` (FR33) + `spec/vocabulary/*.md` (FR34) + `examples/minimal-skill-adoption/` (FR35) + `examples/ci-integration/` (FR36) + `plugins/casper-core/README.md` (FR37) + `fixtures/**` (FR38) |

**Non-Functional Requirements — 24/24 covered.**

| Category | NFRs | Architectural support |
|---|---|---|
| Performance | NFR1–NFR4 | NFR1/NFR2 reframed as tracked budgets (step-02 + step-04), instrumentation deferred to v1.1; NFR3 enforced by minimal-HTML site with no JS framework; NFR4 enforced by frontmatter parser byte cap |
| Security | NFR5–NFR9 | `yaml` strict 1.2 safe-load + UTF-8 strict + BOM check (NFR5); zero network I/O at validate time + no telemetry (NFR6); `plugins/casper-core/plugin.json` declares no hooks/mcp/permissionMode (NFR7); parser rejects tabs/unquoted-booleans (NFR8); fast-glob no-symlinks + realpath check (NFR9, forward-compat) |
| Accessibility | NFR10–NFR12 | `site/src/styles.css` WCAG 2.1 AA semantic HTML (NFR10); dual `human` + `json` output modes (NFR11); CommonMark-only spec rendered by GitHub (NFR12) |
| Interoperability | NFR13–NFR18 | Envelope `additionalProperties: true` + allow-list accepts agentskills.io + Claude Code overlay + `x-*` (NFR13); Draft 2020-12 conformance (NFR14); GitHub Actions standard exit codes + JSON output (NFR15); warn-not-reject philosophy (NFR16); `dependency-cruiser` + docker container release gate (NFR17); casper-core slash-command descriptions respect 1 536-char budget (NFR18) |
| Reliability | NFR19–NFR21 | No time/random/external-state in pipeline (NFR19); offline-only operation (NFR20); fixtures regression as CI hard-gate via `fixtures-runner.test.ts` (NFR21) |
| Compatibility / Versioning | NFR22–NFR24 | Path-versioned schemas (`schemas/v1/`) + additive-only between minors + `schema_version` optional default `"0.1"` (NFR22); `plugins/casper-core/plugin.json` declares Claude Code plugin format compat (NFR23); `site/build.mjs` preserves anchor IDs across spec minor versions with redirect policy (NFR24) |

**Cross-cutting concerns — 8/8 covered.** Single-source-of-truth schemas, versioned diagnostic registry, surface isolation, doc-URL stability, fixture-first discipline, unified release coordination, output channel duality, ecosystem-positioning discipline — all materialize in concrete files/directories with mechanical enforcement.

### Implementation Readiness Validation ✅

**Decision completeness:** All critical (9), important (9), and selected deferrable decisions (12) are documented with rationale + version pinning where applicable. Implementation contract details (parser version pinning, ajv import path, byte-counting policy, exit code matrix) are intentionally deferred to a `docs/architecture/implementation-contract.md` artifact produced by Story-001 of the implementation phase.

**Structure completeness:** Tree exhaustive at step-06; every leaf file has a documented purpose. Story sequence (10 stories) maps each implementation increment to specific files in the tree.

**Pattern completeness:** 8 conflict-surface categories from step-05 cover what biome doesn't enforce mechanically. Enforcement mapping table identifies which mechanism governs each pattern (CI gate / TS compiler / test runner / PR review).

### Gap Analysis Results

**Critical gaps (block implementation): 0.** None identified.

**Important gaps (PRD amendments tracked, not architecturally blocking):**

The following PRD amendments surfaced during step-04 + step-06 do not block architecture lock but must be applied before v1.0 ship:

- **FR1** — `schema_version` reclassified from *required* to *optional with implicit default `"0.1"`*.
- **FR12** — *"rejects unknown frontmatter fields"* → *"warns on fields outside the recognized allow-list"*.
- **API Surface** — clarification: `requires`/`produces` are semantically attached to active components (skills, commands, agents); documents carry `type` only.
- **agentskills.io field list** — PRD's reference is incorrect (lists 5 fields actually belonging to Claude Code overlay). Real list: 6 canonical fields (`name`, `description`, `license`, `allowed-tools`, `metadata`, `compatibility`).
- **Product Scope** — *"JSON Schemas for all artifact types"* reinterpreted: v1.0 ships **one envelope schema + one diagnostic-registry schema**, not 11 per-`core:*`-type schemas. Per-type composition rules are casper-core's orchestration concern.

These are tracked in step-04's *PRD Amendments Required* section.

**Nice-to-have gaps (content concerns, addressable in early implementation stories):**

- `spec/core.md` table of contents not yet drafted; should include the 3-tier overlay-compat diagram (Caspian / Claude Code / agentskills.io), the Resolution Semantics scope note, and the corrected agentskills.io field list. Addressable in Story-002.
- `spec/vocabulary/README.md` template not yet written; the 7-section structure proposed at party-mode review (paige) should land here. Addressable in Story-002.
- Conformance suite cases definition: "one case per diagnostic code" is the v1.0 baseline, but cases may bundle multiple codes for cascade scenarios. Addressable in Story-009.
- `caspian.dev` 4-CTA hub content must mirror root `README.md`; pure content task. Addressable in Story-008.

### Validation Issues Addressed

No critical or blocking issues. PRD amendments are documented and assigned to a dedicated PRD-edit pass before v1.0 ship. Content tasks are mapped to specific implementation stories.

### Architecture Completeness Checklist

**✅ Requirements Analysis (step-02)**

- [x] Project context analyzed (38 FRs + 24 NFRs cataloged)
- [x] Scale and complexity assessed (medium technical / high strategic)
- [x] Technical constraints identified (Node-only, vendor-neutrality release gate, BACKWARD_TRANSITIVE)
- [x] Cross-cutting concerns mapped (8 concerns)
- [x] Resolution Semantics normative seal added

**✅ Architectural Decisions (step-04)**

- [x] T1.5 validator scope locked (parse + envelope + warn-on-unknown + JSON output + 17 stable codes)
- [x] Single envelope schema; no per-`core:*`-type schemas in v1.0
- [x] CLI ↔ spec semver decoupled
- [x] Performance NFRs reframed as tracked budgets (not release gates)
- [x] Distribution: 1 coordinated release → 3 downstream surfaces
- [x] PRD amendments tracked

**✅ Implementation Patterns (step-05)**

- [x] Code naming conventions (kebab-case files, camelCase functions, PascalCase types, named exports)
- [x] JSON Schema authoring conventions ($id stable, examples encouraged)
- [x] Diagnostic message style (imperative present, no period, doc links)
- [x] Test fixture conventions (`<code>/<variant>.md + .expected.json`)
- [x] YAML frontmatter authoring (field ordering by tier)
- [x] Markdown / documentation conventions (ATX headers, fenced + lang tags)
- [x] Error handling philosophy (Diagnostic[] return, no Result type, no throws except internal bugs)
- [x] Conventional Commits + trunk-based git workflow

**✅ Project Structure (step-06)**

- [x] Complete tree with every leaf file documented
- [x] `packages/core` + `packages/cli` split locked
- [x] `casper-core` moved to `plugins/`
- [x] `conformance/` suite scaffolded
- [x] Schema validation for the diagnostic registry itself
- [x] 3-layer vendor-neutrality enforcement (dependency-cruiser + lockfile audit + docker gate)
- [x] 3-verrou single-SoT (tsconfig rootDirs + biome noRestrictedImports + loader.ts)
- [x] Diagnostic-registry CI guard (sha256 + verify hash + .gitattributes + pre-commit hook)
- [x] Tooling locked: pnpm workspaces alone, changesets for releases, dependency-cruiser for boundaries
- [x] Story sequence mapped to specific files (10 stories)
- [x] PRD amendments + content gaps catalogued

### Architecture Readiness Assessment

**Overall Status:** **READY FOR IMPLEMENTATION**

**Confidence Level:** **High.** Reasoning:

- 100% FR/NFR coverage with explicit architectural support documented per requirement.
- Boundary integrity enforced by mechanical gates (CI checks + compiler errors + lint rules + tests), not by reviewer discipline.
- Story sequence is concrete: each story has bounded scope and clear acceptance criteria implied by file/directory deliverables.
- All major scope-reduction decisions (T1.5 validator, no per-type schemas, no perf gates v1.0, no per-package LICENSE redundancy at root) have been documented with rationale.
- PRD amendments tracked but architecturally orthogonal: architecture is internally consistent regardless of when PRD edits land.

**Key Strengths:**

- **Bespoke scaffold avoids opinionated-starter lock-in.** Every dependency is justified individually; the v1.0 dep tree is auditable in one screen.
- **Multi-layer vendor-neutrality enforcement** transforms a marketing claim ("vendor-neutral overlay") into mechanical invariants (dependency graph constrained by `dependency-cruiser`, lockfile audited, runtime proven on Claude-Code-free container).
- **Single-source-of-truth pattern materialized at three checkpoints** (TypeScript compiler + biome lint + sole loader module) eliminates the "trust me" failure mode that kills validator-stack consistency.
- **Conformance suite future-proofs the v1.0 → v1.1 transition.** When v1.1 introduces 4 validator layers (LSP, CI ajv, runtime hook, install-time), each can prove parity by passing the same suite — no implicit drift.
- **Diagnostic registry as versioned artifact** aligns three derivatives (codes.generated.ts, diagnostics.html, conformance cases) without hand-edits, with sha256-hash verification preventing tampering.
- **Skills-vs-documents conceptual split** clarified at step-04 + reflected throughout: validator validates *what is present*, not an imposed shape.

**Areas for Future Enhancement (post-v1.0):**

- **Per-`core:*`-type schemas** — currently deferred; revisit when resolution-semantics evolution demands per-type frontmatter constraints (likely v0.2+ with concrete RFC).
- **Performance instrumentation** — `bench.yml` workflow + 1 000-artifact synthetic corpus generator. Reframes NFR1/NFR2 from tracked budgets to release gates.
- **Cross-platform CI** — macOS + Windows runners. Activated when external contributors report platform-specific issues.
- **Second reference implementation** — a Python or Rust validator passing the conformance suite. Vision-section deliverable; proves spec portability beyond the Node ecosystem.
- **Defense-in-depth validator stack** (v1.1) — IDE LSP + CI Action + runtime hook + install-time validator. The v1.0 conformance suite is the parity gate.

### Implementation Handoff

**AI agent guidelines for implementation phase:**

1. Follow the architectural decisions, patterns, structure, and boundary specs as documented. They are normative for v1.0.
2. Treat the file paths in step-06's tree as authoritative. Do not create files outside the documented locations without an architecture amendment.
3. Run `pnpm lint && pnpm depcruise && pnpm test && pnpm verify-codes-hash && pnpm ajv-validate-registry && pnpm verify-pack` locally before any commit. CI re-runs all of these.
4. Treat the diagnostic registry as the single authoritative source for all diagnostic codes; never edit `codes.generated.ts` by hand.
5. When in doubt about a pattern, refer to the *Pattern Examples* (step-05) and *Cross-Component Dependencies* (step-06) sections; do not invent new patterns silently.

**First implementation priority:**

Story-001 — *Monorepo scaffold + CLI shell + first round-trip*. Concrete deliverables:

- pnpm workspaces with `packages/core` + `packages/cli` skeletons
- Root configs (`biome.json`, `tsconfig.base.json`, `.gitignore`, `.gitattributes`, `.editorconfig`, `.nvmrc`, `.changeset/config.json`, `.npmrc`)
- `schemas/v1/envelope.schema.json` minimal version
- `fixtures/valid/core-overview/minimal.md` + `fixtures/invalid/E001-bom/with-bom.md` + `.expected.json`
- `caspian validate <single-file>` returning exit 0 (valid fixture) / 1 (invalid fixture)
- CI green: `pnpm lint && pnpm depcruise && pnpm test`

Ship Story-001 before tackling stories 002–010. Story-001 validates the boundary mechanics + the dev workflow in concrete code, and surfaces any unknown-unknown footgun before the rest of the architecture commits resources.
