---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
status: complete
completedAt: 2026-04-26
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
projectName: joselimmo-marketplace-bmad
productName: Caspian + casper-core (v1.0)
author: Cyril
date: 2026-04-26
---

# Caspian + casper-core (v1.0) - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for **Caspian + casper-core (v1.0)** (project `joselimmo-marketplace-bmad`), decomposing the requirements from the PRD and the technical decisions from the Architecture document into implementable stories.

The product ships four artifacts in a single coordinated release:

1. **Caspian Core spec** — prose, JSON Schemas, canonical `core:*` vocabulary, fixtures, diagnostic registry.
2. **`@caspian/core` + `caspian` CLI** — vendor-neutral Node/TypeScript validator (no Claude Code dependency).
3. **`casper-core` reference plugin** — Claude Code plugin demonstrating the `requires → produces` chain end-to-end.
4. **`caspian.dev` landing site** — static GitHub Pages site with stable per-concept anchor IDs consumed by CLI diagnostics.

No UX Design Specification was produced for v1.0 (the surfaces are CLI / spec prose / single-page static site — non-UI). UI-relevant accessibility and quality concerns are captured in NFR3, NFR10–NFR12.

## Requirements Inventory

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
- **FR12**: A plugin author can rely on the validator to reject syntactically invalid artifacts — YAML parse errors, BOM prefix, non-UTF-8 encoding, tab indentation in frontmatter, unquoted YAML 1.1 boolean coercion (`on` / `off` / `yes` / `no`), and frontmatter exceeding 4 KB. Frontmatter fields outside the recognized allow-list (Caspian core fields + agentskills.io canonical fields + Claude Code overlay fields + `x-*` extensions + `<vendor>:<name>` namespaced fields) are emitted as **warnings**, not errors.
- **FR13**: A plugin author can use vendor or author-namespaced types (e.g. `bmad:persona`) and receive validator warnings rather than rejections on unregistered types (extensible-registry behavior).
- **FR14**: A plugin author's artifacts are checked against canonical JSON Schema (Draft 2020-12) references that serve as single source of truth for every validation layer.

#### Reference Workflow (casper-core)

- **FR15**: A developer can bootstrap a greenfield project with `/init-project`, producing a typed `core:overview` artifact on disk.
- **FR16**: A developer can articulate a feature with `/discover`, producing typed `core:epic` and `core:story` artifacts on disk.
- **FR17**: A developer can generate an implementation plan with `/plan-story`, which declares `requires: [{type: core:story, count: 1}]` and produces a typed `core:plan` artifact on disk.
- **FR18**: A developer can run the full `/init-project` → `/discover` → `/plan-story` chain end-to-end on a greenfield project with no manual artifact editing required between commands.
- **FR19**: A developer can operate casper-core under the single-active-story workspace convention (at most one active story at a time), with type-based `requires` matching sufficient for deterministic resolution.

#### Plugin Composition & Overrides

- **FR20**: A developer can override a plugin-shipped skill by placing a skill with the same `name` and contract (`requires` / `produces`) in the project's local `.claude/skills/` directory.
- **FR21**: A developer's local skill override survives plugin updates, provided the contract (`name`, `requires`, `produces`) of the overriding skill matches the upstream contract.
- **FR22**: A developer can install casper-core from the Anthropic plugin marketplace (`/plugin install casper-core@anthropic-marketplace`) or from a local path.

#### Governance & Evolution

- **FR23**: An external contributor can propose a non-trivial spec change (new field, enum extension, breaking schema change) via an RFC in `spec/proposals/NNNN-slug.md` using the published TEMPLATE.
- **FR24**: The RFC TEMPLATE requires the proposer to state four mandated sections: Motivation, Alternatives Considered, Backward-Compatibility Plan, and Migration Path.
- **FR25**: An external contributor can expect a documented BDFL response SLA (e.g. acknowledge within N days) and a published conflict-resolution procedure applicable even under BDFL governance.
- **FR26**: Merged RFCs appear as entries in `spec/CHANGELOG.md` with a semver bump, and contributors are credited in `CONTRIBUTORS.md`.
- **FR27**: Spec consumers can trust that artifacts written against an earlier minor version remain readable by later minor versions within the same major version (BACKWARD_TRANSITIVE schema evolution guarantee).

#### Distribution & Discoverability

- **FR28**: The Caspian spec is distributed as a GitHub repository containing prose, JSON Schemas, canonical vocabulary docs, and fixture sets, under the stated licenses (CC-BY-4.0 for prose; Apache-2.0 for schemas and code).
- **FR29**: The `caspian` CLI is distributed via npm under the unhyphenated `caspian` package name.
- **FR30**: The `casper-core` plugin is distributed via the official Anthropic plugin marketplace under the unhyphenated `casper` or `casper-core` name (marketplace acceptance is a strategic goal, not a formal release gate).
- **FR31**: The `caspian.dev` website presents a single-page landing with the 30-second pitch, a 4-line frontmatter quickstart, and links to the spec GitHub repository, the CLI on npm, casper-core on the marketplace, CONTRIBUTING, and the RFC process.
- **FR32**: The `caspian.dev` website provides stable anchor IDs per spec concept (`#schema-version`, `#type`, `#requires`, `#produces`, `#core-vocabulary`) that the CLI's diagnostic doc links consume.

#### Developer Onboarding & Documentation

- **FR33**: A plugin author can read the core spec (`spec/core.md`) in ten minutes or less and grasp the four-field contract.
- **FR34**: A plugin author can consult a short rationale document for each canonical `core:*` type (`spec/vocabulary/<type>.md`) covering purpose, sources, and use boundaries.
- **FR35**: A plugin author can run a minimal adoption example (`spec/examples/minimal-skill-adoption/`) demonstrating the 4-line frontmatter delta applied to an existing Anthropic SKILL.md.
- **FR36**: A plugin author can copy a CI integration snippet (`spec/examples/ci-integration/`) that wires `npx caspian validate ./` into GitHub Actions in three YAML lines.
- **FR37**: A casper-core user can read a README that explains install, the three porcelain commands, the local-override pattern (Journey 3), and the explicit scope boundary ("v1.0 proof, not the full workflow").
- **FR38**: A plugin author can inspect the canonical fixture set (`fixtures/valid/*`, `fixtures/invalid/*`) shipped with the CLI as a reading reference for "what the spec looks like in practice".

### NonFunctional Requirements

#### Performance

- **NFR1**: The `caspian` CLI validates a 1 000-artifact repository in under 5 seconds on a standard developer laptop. **Tracked budget, not v1.0 release gate** (no canonical 1 000-artifact corpus exists at v1.0; benchmark instrumentation deferred to v1.1).
- **NFR2**: The `caspian` CLI startup overhead (time from invocation to first file parse) is under 500 ms on a warm Node runtime. **Tracked budget**, instrumentation deferred to v1.1.
- **NFR3**: The `caspian.dev` single-page site loads in under 2 seconds on a 4G mobile connection from a clean cache; DOMContentLoaded under 1 second on broadband.
- **NFR4**: Frontmatter parsing enforces a 4 KB hard cap per artifact to prevent pathological YAML inputs from degrading validator performance.

#### Security

- **NFR5**: YAML parsing is safe-load only (YAML 1.2; no custom tags that enable code execution). Validators reject non-UTF-8 inputs and inputs carrying a byte-order mark (BOM).
- **NFR6**: The `caspian` CLI performs no network I/O at validate time. No telemetry is emitted. No remote schema fetching is attempted.
- **NFR7**: casper-core ships without `hooks`, `mcpServers`, or `permissionMode` in any plugin-shipped agent. No elevated permissions are requested at install or runtime.
- **NFR8**: Defensive YAML constraints are enforced at parse time: tab indentation rejected in frontmatter; unquoted booleans (`on`/`off`/`yes`/`no`) rejected; frontmatter size exceeding 4 KB rejected.
- **NFR9**: When pointer fields (`supersedes` / `superseded_by`) are introduced in a future spec version, path-traversal references (`..`, absolute paths) must be rejected. The parser rule is documented in v1.0 as a forward-compatibility commitment.

#### Accessibility

- **NFR10**: The `caspian.dev` single-page site meets WCAG 2.1 Level AA for its landing page (semantic HTML, readable contrast, keyboard-navigable, no reliance on color alone, skip-link provided, no animations triggered without user interaction).
- **NFR11**: The `caspian` CLI produces human-readable diagnostics by default and machine-readable output (`--format=json`) on request, enabling integration with assistive tooling and non-terminal UIs.
- **NFR12**: Spec documentation (Markdown) renders accessibly via GitHub's default renderer and on `caspian.dev`; no UI interactions are required to read normative content.

#### Interoperability

- **NFR13**: Caspian frontmatter is fully overlay-compatible with Anthropic Agent Skills SKILL.md. Every documented Agent Skills field remains valid inside a Caspian-conformant artifact.
- **NFR14**: Caspian JSON Schemas conform to JSON Schema Draft 2020-12; they are consumable by any compliant JSON Schema validator without extensions.
- **NFR15**: The `caspian` CLI integrates with GitHub Actions via standard exit codes (`0` / non-zero) and optional structured output (`--format=json`), without requiring a custom Action in v1.0.
- **NFR16**: Any skill or command that respects Caspian Core semantics continues to load in a host that ignores Caspian fields (graceful degradation requirement). No Caspian field is load-bearing for artifact visibility in a non-Caspian-aware host.
- **NFR17**: The `caspian` CLI operates on any machine with Node.js ≥ 20 (current LTS) installed; no Claude Code is required. Vendor-neutrality is a measurable invariant of the v1.0 release: the CLI runs on a minimal Node container against the canonical fixture set with no Claude Code dependency present.
- **NFR18**: Casper-shipped slash-command `description` fields place the trigger phrase in the first sentence and respect the 1 536-character truncation budget imposed by Claude Code's auto-activation discovery.

#### Reliability

- **NFR19**: The `caspian` CLI is deterministic: identical inputs always produce identical outputs (exit code and diagnostic content). No time-dependent, random, or external-state-dependent behavior.
- **NFR20**: The CLI has no runtime dependency on external services. Validation proceeds offline.
- **NFR21**: The canonical fixture set (valid + invalid) runs in CI for every PR to the spec repository. Zero regressions on the valid-fixture set is a hard release gate for every version bump.

#### Compatibility / Versioning

- **NFR22**: Schema evolution is BACKWARD_TRANSITIVE within a major version: producers may write at the latest minor version; consumers must accept the current minor and all prior minor versions. No breaking changes between minor versions within the same major.
- **NFR23**: Claude Code plugin format compatibility: casper-core's plugin manifest conforms to the Claude Code plugin spec as of v1.0 release. If Claude Code's plugin format evolves in a breaking way, casper-core ships a compatibility patch on a best-effort basis.
- **NFR24**: The canonical doc URL (`caspian.dev`) preserves stable anchor IDs per spec concept across spec minor versions. Anchor renames require a redirect until two subsequent minor versions have shipped.

### Additional Requirements

Architecture-driven technical requirements (sourced from `architecture.md`) that affect epic/story shaping:

#### Starter Template & Bootstrap

- **No off-the-shelf starter** — `oclif`, `create-typescript-app`, agentskills layout all rejected (NFR2 violation, telemetry conflict, opinionated-tooling lock-in). v1.0 ships a **bespoke scaffold**; bootstrap commands are the deliverable of Story-001.
- **Provisional repo location** — `joselimmo-marketplace/caspian/` for v1.0; migrates to a dedicated `caspian/` repository when the spec stabilizes.

#### Monorepo Layout & Tooling

- **pnpm workspaces alone** — no `turbo`, no `nx`. Three packages (`@caspian/core`, `caspian`, plugin) at v1.0 do not justify build-graph caching tooling.
- **TypeScript 5.x** — `module: "nodenext"`, `target: "ES2022"`, `strict: true`. Single root `tsconfig.base.json` extended by each package's `tsconfig.json`.
- **Node engine** — `engines.node = ">=20.10"` declared in every published `package.json` (Node 20 LTS minimum).
- **Build** — `tsc` only for the CLI/core packages (no bundler in v1.0); hand-written `site/build.mjs` for the static landing.
- **Test runner** — `vitest` v3 with snapshot/golden support; tests in `tests/unit/` (mirrors `src/`) + `tests/integration/`; `tests/helpers/paths.ts` resolves `REPO_ROOT` via `import.meta.url` (never `process.cwd()`).
- **Lint/format** — `biome` (single dep replacing eslint + prettier + plugins). `biome.json` at monorepo root enforces kebab-case file names, named exports only, and the `noRestrictedImports` rule guarding the schemas single-source-of-truth.
- **Release coordination** — `changesets` (pnpm-friendly), per-package independent semver; contributor adds a `.changeset/<random>.md` with their PR; CI composes CHANGELOG and creates release PR at tag.
- **Lockfile** — `pnpm-lock.yaml` committed; CI uses `pnpm install --frozen-lockfile` (NFR21).

#### Validator Scope (T1.5) — 17 Diagnostic Codes

- **Validator scope** — parse + envelope shape + warn-on-unknown + JSON output. **Does NOT** ship per-`core:*`-type schemas; type-specific composition rules are casper-core's orchestration concern, not validator scope.
- **17 v1.0 diagnostic codes** — 14 errors (`CASPIAN-E001..E014`) + 3 warnings (`CASPIAN-W001..W003`). Each code is hand-authored in `diagnostics/registry.json` (authoritative, append-only) and produces two derivatives: `packages/core/src/diagnostics/codes.generated.ts` (typed TS constants, sha256-pinned header) and `site/dist/diagnostics.html` (anchored doc page).
- **6-stage pipeline ordering** — fail-fast per stage:
  1. Byte-level (encoding sniff, BOM detection) → `E001`, `E002`.
  2. Frontmatter extraction (`---` delimiters, 4 KB byte cap) → `E004`, `E005`.
  3. YAML parse (strict 1.2 safe-load) + post-parse unquoted-boolean scan → `E003`, `E006`, `E007`.
  4. Envelope schema (ajv against bundled `envelope.schema.json`) → `E008`–`E014`.
  5. Namespace check (`type` non-`core:*` warning, `schema_version` unknown warning) → `W002`, `W003`.
  6. Allow-list scan (22 known fields + `x-*` + `<vendor>:<name>` namespaced) → `W001`.
- **Frontmatter byte-counting** — UTF-8 bytes between (but excluding) the opening and closing `---` lines, exclusive of the delimiter newlines themselves.

#### Dependency Selections (Step-04 Locks)

- **CLI argument parsing** — `commander` ~v12 (mature, low overhead, TS-native types).
- **YAML parsing** — `yaml` ~v2.x in strict YAML 1.2 mode (rejects `on`/`off`/`yes`/`no` coercion that `js-yaml` accepts).
- **JSON Schema validation** — `ajv` ~v8 imported via `ajv/dist/2020.js` for Draft 2020-12 support.
- **File walking** — `fast-glob` with `followSymbolicLinks: false` and explicit realpath verification (forward-compat with NFR9 path-traversal rejection).
- **Linting/formatting** — `biome` (single dep replacing eslint + prettier + plugins).

#### Schema & Diagnostic Single-Source-of-Truth Enforcement (Mechanical)

- **Single envelope schema** — `schemas/v1/envelope.schema.json` (Draft 2020-12, `$id: "https://caspian.dev/schemas/v1/envelope.schema.json"`, path-versioned). Plus `schemas/v1/diagnostic-registry.schema.json` validates the structure of `diagnostics/registry.json` itself.
- **`additionalProperties` policy** — envelope: `true` (overlay-compat); `requires` and `produces` sub-objects: `false` (strict shape).
- **3-verrou single-SoT enforcement** for schemas:
  1. `packages/core/tsconfig.json` `rootDirs: ["./src"]` — out-of-`src/` imports are TS compile errors.
  2. `biome.json` `noRestrictedImports` — `**/schemas/**` forbidden EXCEPT via `packages/core/src/schemas/loader.ts`.
  3. Single `loader.ts` module — sole entry point for reading bundled schemas (resolves via `path.resolve(__dirname, ...)` with dev-mode fallback via `import.meta.url`).
- **Schema bundling** — `packages/core/scripts/copy-schemas.ts` copies `schemas/v1/**/*.json` → `packages/core/dist/schemas/v1/*` at build (NFR6 satisfied: no remote fetch).
- **Diagnostic registry safeguards**:
  - `diagnostics/registry.json` is hand-authored, append-only, schema-validated by CI step `pnpm ajv-validate-registry`.
  - `gen-diagnostic-codes.ts` writes a `// Hash: <sha256>` header into `codes.generated.ts`; `verify-codes-hash.ts` blocks merges on mismatch.
  - `.gitattributes` declares `codes.generated.ts merge=ours linguist-generated=true`.
  - `simple-git-hooks` pre-commit auto-runs `pnpm gen:codes && git add` on commits touching `registry.json`.

#### Vendor-Neutrality Enforcement (3-Layer)

1. **Source-level** — `packages/cli/.dependency-cruiser.cjs` `forbidden` rule: `from: ^packages/(core|cli)/src` to `^node_modules/(@anthropic-ai|@claude)`. Catches direct, transitive, type-only, and statically-resolvable dynamic imports. CI step: `pnpm depcruise`.
2. **Lockfile-level** — CI step `pnpm ls --prod --depth=Infinity --json | jq` checks no resolved dependency name in `packages/core` or `packages/cli` matches `claude` or `anthropic`. Catches transitives that bypass dep-cruiser.
3. **Runtime-level (release gate)** — `docker run --rm -v $(pwd):/work node:20-alpine sh -c "cd /work && npx caspian validate ./fixtures/valid/"` passes on a vanilla Linux container with no Claude Code installed. Execution proof.

#### Distribution & Release

- **CLI ↔ spec semver decoupled** — CLI declares `caspian.supportedSchemaVersions` in `packages/cli/package.json`; v1.0 ships CLI `0.1.0` + spec `schema_version: "0.1"`.
- **1 coordinated release → 3 downstream surfaces** — single git tag drives:
  - npm: `@caspian/core` + `caspian` published with `pnpm publish --provenance` via GitHub Actions OIDC (Sigstore-backed).
  - Anthropic plugin marketplace: `plugins/casper-core/` packaged and submitted; `plugin.json` declares the target `schema_version`. **Manual submission in v1.0** (not automated).
  - GitHub Pages (`caspian.dev`): `site/dist/` regenerated from `diagnostics/registry.json` + `spec/` and pushed.
- **CI matrix** — Node 20 LTS + Node 22, `ubuntu-latest` only for v1.0. macOS / Windows added in v1.1 if user demand emerges.

#### Surface Isolation & License Boundaries

- **`packages/`** — Node packages only (`@caspian/core`, `caspian`); vendor-neutral.
- **`plugins/`** — vendor-specific integrations; `plugins/casper-core/` is the entire Claude-Code-bound surface (markdown + manifest, no Node code).
- **License layout** — root `LICENSE` Apache-2.0; `spec/LICENSE.md` CC-BY-4.0 override; `site/LICENSE.md` dual statement; every sub-package re-declares its Apache-2.0 LICENSE explicitly so isolated consumers see it unambiguously.

#### Conformance Suite (Vendor-Neutral)

- **`conformance/runner.mjs`** — harness; takes a validator binary path as argument; produces `REPORT.md` from the run.
- **`conformance/cases/`** — one case per critical behavior (v1.0 ships ~17 cases mirroring the diagnostic codes 1:1).
- **CI step** — `pnpm conformance` runs `packages/cli/dist/cli.js` against the suite (CLI eats its own dog food).
- **Future consumers** — v1.1 LSP, CI ajv layer, runtime hook, install-time validator, third-party validators (Python/Rust per Vision) all prove parity by running the same suite.

#### Patterns & Conventions (Mechanical Where Possible)

- **Code naming** — TypeScript files `kebab-case.ts`; functions camelCase; types PascalCase; top-level constants `SCREAMING_SNAKE_CASE`; named exports only (no `export default`).
- **Test fixture conventions** — `fixtures/invalid/<code>/<variant>.md` paired with sibling `<variant>.expected.json`; auto-discovered by `tests/fixtures-runner.test.ts` (table-driven). `fixtures/valid/<type-or-purpose>/<variant>.md` must validate without errors (warnings allowed).
- **Diagnostic message style** — imperative present, no period, field names in backticks, no user-blame (*"BOM byte sequence detected"*, not *"You have a BOM, please remove"*); doc URL convention: `caspian.dev/diagnostics#caspian-eXXX`.
- **YAML frontmatter authoring** — field ordering by tier (Caspian core → agentskills.io canonical → Claude Code overlay → `x-*` → `<vendor>:<name>`); 2-space indent; no tabs; no trailing whitespace.
- **Error handling** — validation outcomes return `Diagnostic[]`, never `throw`. `throw` reserved for internal validator bugs; top-level `cli.ts` catches all uncaught exceptions and exits with code 3.
- **Conventional Commits** — `feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`, `perf:`. Trunk-based: `main` only; feature branches `feat/<slug>`, `fix/<slug>`, `chore/<slug>`.
- **Markdown / docs** — ATX headers; fenced code blocks always with language tag; reference-style links for repeated URLs; advisory line length 100 chars.

#### Resolution Semantics — Normative Seal

- v1.0 spec MUST publish: *"v1.0 consumers MUST NOT assume forward-compatibility on resolution semantics. Future spec versions may introduce filters that v1.0 consumers cannot honor."* Type-based matching is the only resolution semantic v1.0 commits to; multi-candidate disambiguation is implementation-defined.

#### PRD Amendments Required (Architecture-Surfaced, To Apply Before v1.0 Ship)

Already applied in PRD per `revisions[]` frontmatter (2026-04-26):

- **FR1** — `schema_version` reclassified from required to optional (default `"0.1"`).
- **FR12** — unknown-field policy is *warn*, not *reject*.
- **FR5 + agentskills.io reference** — corrected canonical field list (6 fields) + Claude Code overlay (12 fields).
- **API Surface** — `requires`/`produces` semantically attached to active components; documents carry `type` only.
- **Product Scope** — JSON Schemas reinterpreted as 2 schemas (envelope + diagnostic registry); per-`core:*` type schemas deferred to v0.2+ pending RFC.
- **Journey 6** — clarified that strict-warnings CI gating is plugin-author opt-in.

#### Governance & Documentation Artifacts (Repo-Level)

- `CONTRIBUTING.md` (repo-level), `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1 unedited), `SECURITY.md`, `.github/SECURITY-OPS.md` (defensive name registration plan), `CODEOWNERS`, `.github/ISSUE_TEMPLATE/{bug_report.md, feature_request.md}`, `.github/PULL_REQUEST_TEMPLATE.md`, `dependabot.yml`.
- `spec/CONTRIBUTING.md` (RFC process), `spec/proposals/TEMPLATE.md` (4 mandated sections), `spec/proposals/0001-initial-spec.md` (v1.0 freeze), `spec/CHANGELOG.md`, `spec/vocabulary/README.md`, `spec/vocabulary/<type>.md` × 11.
- `notes/defensive-ops.md` merged into `.github/SECURITY-OPS.md` per maintainer-facing audience.

### UX Design Requirements

**Not applicable.** No UX Design Specification was produced for v1.0. The product surfaces are non-UI:

- CLI (terminal output, dual human + JSON formatters — covered by NFR11).
- Spec prose (Markdown, GitHub default renderer — covered by NFR12).
- Single-page static landing site (`caspian.dev`) — accessibility covered by NFR3 (load time) + NFR10 (WCAG 2.1 AA: semantic HTML, contrast, keyboard navigation, no color-only signalling, skip-link, no auto-animation).

If a UX spec is produced for v1.1 (casper-full + JSON Schema Store + CI Action + LSP layer), UX-DRs will be appended in a future revision of this document.

### FR Coverage Map

| FR | Epic | Description |
|---|---|---|
| FR1 | Epic 1 | 4-field contract authoring (`schema_version` optional default `"0.1"`, `type` required, `requires`/`produces` optional) |
| FR2 | Epic 1 | `requires` typed preconditions |
| FR3 | Epic 1 | `produces` typed postcondition |
| FR4 | Epic 1 | Canonical `core:*` + namespaced types |
| FR5 | Epic 1 | agentskills.io + Claude Code overlay co-existence |
| FR6 | Epic 1 | `x-*` extension prefix |
| FR7 | Epic 2 | `caspian validate <path>` (file/dir/glob) |
| FR8 | Epic 2 | `--format=json` machine-readable output |
| FR9 | Epic 2 | Diagnostics with file/line/field/edit-distance suggestion/doc-link (anchors served by Epic 4) |
| FR10 | Epic 2 | Exit codes `0` vs non-zero |
| FR11 | Epic 2 | Vendor-neutrality (no Claude Code dep) |
| FR12 | Epic 2 | Reject syntax errors + warn on out-of-allow-list fields |
| FR13 | Epic 2 | Warn-on-unregistered-namespace types |
| FR14 | Epic 1 | JSON Schema Draft 2020-12 as single source of truth (schemas exist canonically; consumed by Epic 2) |
| FR15 | Epic 3 | `/init-project` → `core:overview` |
| FR16 | Epic 3 | `/discover` → `core:epic` + `core:story` |
| FR17 | Epic 3 | `/plan-story` requires `core:story` → produces `core:plan` |
| FR18 | Epic 3 | Chain end-to-end with no manual artifact editing |
| FR19 | Epic 3 | Single-active-story workspace convention |
| FR20 | Epic 3 | Local skill override pattern |
| FR21 | Epic 3 | Override survives plugin updates |
| FR22 | Epic 3 | Install via marketplace or local path |
| FR23 | Epic 5 | RFC process via `spec/proposals/NNNN-slug.md` |
| FR24 | Epic 5 | TEMPLATE with 4 mandated sections |
| FR25 | Epic 5 | BDFL response SLA + conflict-resolution procedure |
| FR26 | Epic 5 | Merged RFCs → CHANGELOG + CONTRIBUTORS |
| FR27 | Epic 1 + Epic 5 | BACKWARD_TRANSITIVE — codified in spec (Epic 1) + enforced at review (Epic 5) |
| FR28 | Epic 1 | GitHub repo + dual-licensing layout (Apache-2.0 / CC-BY-4.0) |
| FR29 | Epic 2 | npm distribution under `caspian` package name |
| FR30 | Epic 3 | Anthropic plugin marketplace distribution |
| FR31 | Epic 4 | `caspian.dev` single-page landing |
| FR32 | Epic 4 | Stable anchor IDs per spec concept |
| FR33 | Epic 1 | Spec readable in ≤ 10 minutes |
| FR34 | Epic 1 | Per-`core:*` rationale docs |
| FR35 | Epic 1 | `examples/minimal-skill-adoption/` |
| FR36 | Epic 2 | `examples/ci-integration/` (3-line GitHub Actions snippet) |
| FR37 | Epic 3 | casper-core README + override pattern doc |
| FR38 | Epic 1 | Canonical fixtures as reading reference |

**Coverage: 38/38 FRs.** No gaps.

## Epic List

### Epic 1: Spec Foundation & Plugin-Author Adoption

**User outcome:** A plugin author can read the Caspian Core spec in ≤10 minutes, understand the 4-field contract (`schema_version`, `type`, `requires`, `produces`), browse the canonical `core:*` vocabulary with rationale, inspect canonical fixtures as a reading reference, follow a minimal 4-line frontmatter adoption example, and apply Caspian frontmatter to their own plugin — without needing the CLI or the casper-core plugin to be installed.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR14, FR27 (spec-side), FR28, FR33, FR34, FR35, FR38.

**NFRs addressed:** NFR12 (Markdown spec accessibility via GitHub default renderer), NFR13 (overlay-compat with Anthropic Agent Skills SKILL.md), NFR14 (JSON Schema Draft 2020-12 conformance), NFR22 (BACKWARD_TRANSITIVE within major version).

**Standalone:** Per PRD risk mitigation, *"the spec is written such that the JSON Schemas alone are useful without the CLI"*. Shipping Epic 1 alone yields a usable v1.0 fallback.

**Implementation notes:** Includes the monorepo bootstrap (architecture Story-001 scaffold side) as the first story — without it, no subsequent file can land in the right place. Includes hand-authoring `diagnostics/registry.json` (vendor-neutral spec artifact, schema-validated) which Epic 2 will consume. Includes the *Resolution Semantics out-of-scope for v1.0* normative seal in `spec/core.md`. Establishes the dual-license layout (Apache-2.0 root / CC-BY-4.0 spec) and per-directory LICENSE redeclaration.

---

### Epic 2: CLI Validator & CI Integration

**User outcome:** A plugin author installs `caspian` from npm, runs `caspian validate <path>` locally on a file / directory / glob, gets human-readable diagnostics with edit-distance suggestions and stable doc links, gates their CI on conformance via the `--format=json` output and exit codes, and trusts the validator runs identically on any vanilla Node ≥20 machine without Claude Code installed. Cross-implementation parity is provable via the conformance suite.

**FRs covered:** FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR29, FR36.

**NFRs addressed:** NFR1, NFR2 (perf — tracked budgets), NFR4 (4 KB hard cap), NFR5 (safe-load YAML 1.2 + UTF-8 + BOM reject), NFR6 (no network I/O / no telemetry), NFR8 (tab/unquoted-bool reject), NFR9 (path-traversal forward-compat), NFR11 (dual human + JSON output), NFR15 (GitHub Actions standard exit codes), NFR16 (graceful degradation), NFR17 (Node ≥ 20 + vendor-neutrality release gate), NFR19 (deterministic), NFR20 (offline), NFR21 (fixture regression CI gate).

**Standalone:** Depends on Epic 1's schemas + diagnostic registry + fixtures. Independent of Epic 3 (casper-core) and Epic 4 (caspian.dev). Per PRD: *"the CLI is useful without casper-core"*.

**Implementation notes:** Implements the 6-stage validation pipeline (T1.5 scope). Ships `@caspian/core` (validation logic) + `caspian` CLI wrapper. Includes the conformance suite (`conformance/runner.mjs` + cases mirroring the 17 codes 1:1). Enforces vendor-neutrality through three layers: `dependency-cruiser` source-level rules + lockfile audit + docker container release gate. The CLI emits doc URLs to `caspian.dev/diagnostics#caspian-eXXX` (URL strings ship even before Epic 4 lands the page). Publishes via `pnpm publish --provenance` through GitHub Actions OIDC (Sigstore-backed).

---

### Epic 3: Reference Workflow casper-core (Claude Code Plugin)

**User outcome:** A developer on Claude Code installs `casper-core` from the Anthropic marketplace (or a local path), runs `/init-project` → `/discover` → `/plan-story` end-to-end on a greenfield project producing typed `core:overview` / `core:epic` / `core:story` / `core:plan` artifacts on disk with no manual editing between commands, can override any of the three commands locally by placing a same-`name`/same-contract skill in `.claude/skills/`, and their override survives plugin updates.

**FRs covered:** FR15, FR16, FR17, FR18, FR19, FR20, FR21, FR22, FR30, FR37.

**NFRs addressed:** NFR7 (no `hooks` / `mcpServers` / `permissionMode` in plugin-shipped agents), NFR18 (slash-command `description` trigger phrase first + ≤ 1 536 char budget), NFR23 (Claude Code plugin format compat).

**Standalone:** Depends on Epic 1 (contract definition). Does not depend on Epic 2 (CLI) functionally — though dogfooding suggests using the CLI to validate the plugin's own frontmatter. Per PRD: *"casper-core useful without the website"*.

**Implementation notes:** Pure markdown + plugin manifest, no Node code. The plugin lives in `plugins/casper-core/` (vendor-bound surface, separate from neutral `packages/`). `plugin.json` declares the target `schema_version` for forward-compat traceability. Each command's frontmatter declares typed `requires`/`produces`. README documents the override pattern (PRD Journey 3) and the explicit scope boundary ("v1.0 proof, not the full workflow"). Marketplace acceptance is a strategic goal, not a release gate.

---

### Epic 4: Discoverability via caspian.dev

**User outcome:** A plugin author or developer lands on `caspian.dev`, grasps Caspian in 30 seconds via the pitch, sees the 4-line frontmatter quickstart, clicks through to the spec GitHub repo / CLI on npm / casper-core marketplace listing / CONTRIBUTING / RFC process. Diagnostic doc URLs emitted by the CLI resolve to a stable anchored page (`/diagnostics`) with one anchor per code that survives spec minor-version bumps.

**FRs covered:** FR31, FR32.

**NFRs addressed:** NFR3 (load < 2s on 4G, DOMContentLoaded < 1s on broadband), NFR10 (WCAG 2.1 Level AA — semantic HTML, contrast, keyboard nav, no color-only signalling, skip-link, no auto-animation), NFR24 (anchor IDs preserved across minor versions; renames require redirect for two minor cycles).

**Standalone:** Independent of Epic 2/3/5 functionality. If absent, the CLI's emitted URLs simply don't resolve — no other epic breaks. Depends on Epic 1's `diagnostics/registry.json` and `spec/` content for the build step that generates `diagnostics.html`.

**Implementation notes:** Hand-written single-page `site/src/index.html` (no static-site framework). Hand-written `site/build.mjs` reads `diagnostics/registry.json` and emits `site/dist/diagnostics.html` with stable anchors. GitHub Pages deployment via `.github/workflows/site.yml` triggered on push to `main`. The 4-CTA hub on the landing page mirrors the root `README.md`.

---

### Epic 5: Governance & Spec Evolution

**User outcome:** An external contributor finds the RFC process documented in `spec/CONTRIBUTING.md`, forks the repo, copies `spec/proposals/TEMPLATE.md`, fills the four mandated sections (Motivation, Alternatives Considered, Backward-Compatibility Plan, Migration Path), opens a numbered proposal PR, receives a BDFL acknowledgment within the documented response SLA, and on merge sees their RFC tracked in `spec/CHANGELOG.md` with the appropriate semver bump and credit in `CONTRIBUTORS.md`. The BACKWARD_TRANSITIVE guarantee is enforced at review time. A documented conflict-resolution procedure applies even under solo-BDFL governance.

**FRs covered:** FR23, FR24, FR25, FR26, FR27 (process-side enforcement).

**NFRs addressed:** None directly (governance is a process attribute, not a quality-attribute concern); supports the *Ecosystem-positioning discipline* cross-cutting concern.

**Standalone:** Depends on Epic 1 (the spec exists to be evolved). Independent of Epic 2/3/4. Pure text artifacts — no code dependencies.

**Implementation notes:** Spec-level governance: `spec/CONTRIBUTING.md` (RFC process, BDFL SLA, conflict-resolution procedure), `spec/proposals/TEMPLATE.md` (4 mandated sections), `spec/proposals/0001-initial-spec.md` (v1.0 freeze captured as the foundational proposal), `spec/CHANGELOG.md` (governance header + initial v1.0 entry). Repo-level governance: `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1 unedited), `SECURITY.md` (responsible disclosure, links to `.github/SECURITY-OPS.md` for defensive name registration plan), `CODEOWNERS`, `.github/ISSUE_TEMPLATE/{bug_report.md, feature_request.md}`, `.github/PULL_REQUEST_TEMPLATE.md`, `dependabot.yml`. Tooling: `changesets` configured to auto-maintain `CONTRIBUTORS.md` and compose CHANGELOGs.

---

## Epic Sequencing & Dependencies

**Hard dependency:** Epic 1 must ship first (every other epic consumes its outputs).

**Parallelizable after Epic 1:** Epics 2, 3, 4, 5 are mutually independent and can be developed in parallel by separate workstreams.

**Recommended priority order** (per PRD *Risk-Based Scoping → Resource risks*: *"explicit priority order if time compresses: spec prose and schemas → CLI → casper-core → website"*):

1. **Epic 1** (Spec Foundation) — hard prerequisite.
2. **Epic 2** (CLI) — primary technical user value; gates the conformance proof.
3. **Epic 5** (Governance) — partly parallel with Epic 2; cheap to ship; establishes the contributor surface early.
4. **Epic 3** (casper-core) — reference workflow proof.
5. **Epic 4** (caspian.dev) — discoverability; lowest blast radius if cut.

This ordering matches the PRD's stated cut-priorities: *"cut casper-core scope (two commands instead of three) before cutting spec scope"* — Epic 1 and Epic 2 are the floor; Epics 3 and 4 carry the most cuttable fat.

---

## Epic 1: Spec Foundation & Plugin-Author Adoption

A plugin author can read the Caspian Core spec in ≤10 minutes, understand the 4-field contract, browse the canonical `core:*` vocabulary with rationale, inspect canonical fixtures, follow a minimal 4-line frontmatter adoption example, and apply Caspian frontmatter to their own plugin — without needing the CLI or the casper-core plugin.

### Story 1.1: Project bootstrap (monorepo scaffold + dual-license layout)

As a contributor (or AI agent implementing Caspian),
I want a coherent monorepo scaffold with explicit dual-license layout and root configs,
So that I can navigate the repo confidently, install dependencies cleanly, and understand the licensing boundary on first read.

**Acceptance Criteria:**

**Given** the repo is freshly cloned
**When** I run `pnpm install` from the root
**Then** the install succeeds without errors
**And** `pnpm-workspace.yaml` declares `packages/*` as the workspace pattern
**And** root `package.json` sets `private: true` and exposes scripts `lint`, `test`, `build`, `release`

**Given** I open the repo root
**When** I list the directory
**Then** `LICENSE` (Apache-2.0 unedited) and `LICENSE-CC-BY-4.0` are present
**And** `README.md` documents the dual-license boundary in a "License" section
**And** `README.md` provides a 4-CTA hub (spec / CLI / casper-core / RFC process) mirroring `caspian.dev`'s landing structure

**Given** the project's TypeScript baseline must be locked early
**When** I open `tsconfig.base.json`
**Then** the config sets `module: "nodenext"`, `target: "ES2022"`, `strict: true`
**And** sub-package `tsconfig.json` files (added by Epic 2) extend this base

**Given** the project's lint/format baseline must be locked early
**When** I open `biome.json`
**Then** the config enforces `useFilenamingConvention` (kebab-case files) and named-exports-only
**And** `noRestrictedImports` reserves the `**/schemas/**` lockdown placeholder (rule body activated by Epic 2's `loader.ts` exception)
**And** `.biomeignore` excludes `**/dist/`, `**/*.generated.ts`, `pnpm-lock.yaml`, `fixtures/invalid/**`

**Given** the Node engine constraint must be discoverable
**When** I open `.nvmrc`
**Then** the file declares `20.10`

**Given** the changesets release-coordination tool is preconfigured
**When** I open `.changeset/`
**Then** `config.json` targets the `main` branch with per-package independent semver
**And** `README.md` documents the contributor flow for adding a changeset

**Given** standard editor/git/npm conventions
**When** I open `.editorconfig`, `.gitignore`, `.gitattributes`, `.npmrc`
**Then** `.editorconfig` enforces 2 spaces / LF / UTF-8 / trim-trailing-whitespace / final-newline
**And** `.gitignore` excludes `node_modules/`, `packages/*/dist/`, `site/dist/`, `*.tsbuildinfo`, `.vitest-cache/`, `.DS_Store`, `.env*`, `*.log`, `coverage/`
**And** `.gitattributes` reserves the rule `codes.generated.ts merge=ours linguist-generated=true` (the file itself is created by Epic 2 Story 2.2)
**And** `.npmrc` sets `auto-install-peers=true` and `strict-peer-dependencies=true`

**Given** smoke-level CI verification
**When** I run `pnpm lint && pnpm test`
**Then** both commands exit `0` (no source files yet; commands resolve cleanly)
**And** `pnpm-lock.yaml` is committed to git (NFR21 reproducibility)

---

### Story 1.2: Caspian Core normative reference (`spec/core.md`)

As a plugin author evaluating Caspian,
I want a single normative reference document I can read in ≤10 minutes,
So that I understand the 4-field contract and can decide whether to adopt Caspian on my plugin.

**Acceptance Criteria:**

**Given** I am a plugin author with no prior Caspian context
**When** I open `spec/core.md`
**Then** I can read the entire document in ≤10 minutes (FR33; benchmark stated in the document header)
**And** the document explains each of the 4 frontmatter fields (`schema_version`, `type`, `requires`, `produces`) with a one-sentence definition + one example

**Given** I am reviewing the contract semantics
**When** I read the field reference
**Then** the document states `schema_version` is OPTIONAL in v1.0 (defaults to `"0.1"` when absent); producers writing against v0.2+ MUST declare it explicitly (FR1)
**And** `type` is REQUIRED, namespaced as `<vendor>:<name>` (FR4)
**And** `requires` is OPTIONAL, an array of `{type, tags?, count?}` entries (FR2)
**And** `produces` is OPTIONAL, an object `{type}` (FR3)
**And** the document includes the semantic note: `requires`/`produces` attach to active components (skills, commands, agents); documents carry `type` only

**Given** I want to verify overlay-compatibility before adopting
**When** I read the overlay section
**Then** the document includes a 3-tier overlay diagram showing Caspian (4 fields) over agentskills.io canonical (6 fields: `name`, `description`, `license`, `allowed-tools`, `metadata`, `compatibility`) over Claude Code overlay (12 fields: `when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `model`, `effort`, `context`, `agent`, `hooks`, `paths`, `shell`)
**And** the document states: every documented Anthropic SKILL.md field remains valid inside a Caspian-conformant artifact (FR5, NFR13, NFR16)

**Given** I am concerned about future spec changes breaking my artifacts
**When** I read the evolution section
**Then** the document publishes the BACKWARD_TRANSITIVE evolution guarantee (additive-only between minor versions within a major; FR27, NFR22)
**And** the document publishes the **Resolution Semantics out-of-scope normative seal**: *"v1.0 consumers MUST NOT assume forward-compatibility on resolution semantics. Future spec versions may introduce filters that v1.0 consumers cannot honor."*
**And** the document explicitly states `status` and supersession pointers (`supersedes` / `superseded_by`) are NOT reserved in v1.0 (additive restoration is BACKWARD_TRANSITIVE-compliant)

**Given** I author my own vendor-namespaced types
**When** I read the namespacing section
**Then** the document documents the `<vendor>:<name>` convention with examples (`bmad:epic`, `maya:lint-rule`)
**And** the document documents the `x-*` extension prefix as the reserved escape hatch (FR6)

**Given** the spec ships with the right entry/license metadata
**When** I check `spec/`
**Then** `spec/README.md` provides the 5-minute introduction and links to `spec/core.md`
**And** `spec/LICENSE.md` declares CC-BY-4.0 explicitly (override of root Apache-2.0)
**And** `spec/core.md` includes stable anchor IDs `#schema-version`, `#type`, `#requires`, `#produces`, `#core-vocabulary` (consumed by Epic 2's CLI doc-link emission and Epic 4's site)

---

### Story 1.3: Canonical `core:*` vocabulary docs

As a plugin author choosing a `type` for my new artifact,
I want a per-`core:*` rationale document covering purpose, sources, and use boundaries,
So that I pick the right canonical type without ambiguity, or invent a clean vendor-namespaced extension when no canonical type fits.

**Acceptance Criteria:**

**Given** I want to consult the vocabulary index
**When** I open `spec/vocabulary/README.md`
**Then** the file lists all 11 canonical `core:*` types (`overview`, `epic`, `story`, `plan`, `adr`, `convention`, `learning`, `glossary`, `review`, `rule`, `scratch`) with a one-line summary each
**And** the file documents the 7-section template every per-type doc follows (Purpose / Sources / Identity / Use Boundaries / Composition / Anti-pattern / Examples)

**Given** I want every canonical type documented (FR34)
**When** I list `spec/vocabulary/`
**Then** files exist for all 11 types: `overview.md`, `epic.md`, `story.md`, `plan.md`, `adr.md`, `convention.md`, `learning.md`, `glossary.md`, `review.md`, `rule.md`, `scratch.md`
**And** each file follows the 7-section template
**And** each file targets fast scan (≤500 lines / ≈2 pages)

**Given** I want a representative deep-dive
**When** I open `spec/vocabulary/adr.md`
**Then** the *Sources* section cites prior art (industry ADR pattern, BMad, Agent OS) with attribution
**And** the *Use Boundaries* section states what `core:adr` is NOT (e.g., not a `core:learning`, not a `core:rule`)
**And** the *Examples* section cross-references at least one fixture under `fixtures/valid/`

**Given** I author a vendor-namespaced type and want to know if it should be promoted
**When** I read any per-type doc
**Then** the doc cross-references the RFC process (link to `spec/CONTRIBUTING.md`, populated by Epic 5) for promoting a vendor type to `core:*`

---

### Story 1.4: Envelope JSON Schema (Draft 2020-12)

As a plugin author using a JSON-Schema-aware editor (e.g., VS Code YAML LSP),
I want a canonical envelope schema referenced via stable `$id`,
So that I get zero-configuration validation feedback in my editor as I author Caspian frontmatter (FR14).

**Acceptance Criteria:**

**Given** the schema is part of v1.0
**When** I open `schemas/v1/envelope.schema.json`
**Then** the first key is `$schema: "https://json-schema.org/draft/2020-12/schema"` (NFR14)
**And** `$id: "https://caspian.dev/schemas/v1/envelope.schema.json"` (stable URI for future JSON Schema Store submission)
**And** the schema's `title` is `"CaspianEnvelope"`

**Given** the contract requires overlay-compatibility at the top level
**When** I inspect the schema
**Then** the envelope's `additionalProperties` is `true` (allows agentskills.io canonical, Claude Code overlay, `x-*`, and vendor-namespaced fields without rejection — FR5, FR6, NFR13, NFR16)
**And** the only field declared `required` is `type`

**Given** the contract enforces strict shape on `requires` and `produces` sub-objects
**When** I inspect the schema
**Then** each `requires` array entry is an object with `additionalProperties: false`, requiring `type` and allowing optional `tags` (string array) and `count` (positive integer) — FR2
**And** the `produces` object has `additionalProperties: false`, requiring `type` — FR3

**Given** I want example artifacts inline in the schema for IDE tooling
**When** I inspect the schema
**Then** `examples: [...]` provides at least one minimal valid envelope at the schema root
**And** each sub-schema (`requires` entry, `produces` object) provides an `examples: [...]` block

**Given** the schema's prose must support author understanding
**When** I read the `description` fields
**Then** each `description` is full English in descriptive voice, starts with a capital, ends with a period
**And** the `description` for `type` enumerates that values must match `<namespace>:<name>` form

**Given** the licensing is unambiguous when the directory is consumed in isolation
**When** I list `schemas/`
**Then** `schemas/LICENSE` declares Apache-2.0 explicitly
**And** the schemas directory is path-versioned: `schemas/v1/` (NFR22; future major bump → `schemas/v2/` alongside)

---

### Story 1.5: Diagnostic registry + registry schema

As a plugin author (or future implementer of an alternative validator),
I want a canonical, schema-validated diagnostic registry with stable codes,
So that I rely on the same `CASPIAN-EXXX` / `CASPIAN-WXXX` codes regardless of which validator emits them, and tooling that validates the registry itself catches malformed edits.

**Acceptance Criteria:**

**Given** the registry is the single source of truth for diagnostic codes
**When** I open `diagnostics/registry.json`
**Then** the file declares all 17 v1.0 codes hand-authored in append-only order
**And** errors `CASPIAN-E001` through `CASPIAN-E014` and warnings `CASPIAN-W001`, `W002`, `W003` are all present
**And** each entry has fields: `code`, `severity` (enum `error | warning`), `rule` (short rule name), `message`, `doc` (URL to `https://caspian.dev/diagnostics#caspian-eXXX` or `#caspian-wXXX`)

**Given** the 17 codes match the architecture's pipeline mapping
**When** I cross-check `registry.json` against the architecture's stage 1–6 pipeline
**Then** `E001` covers BOM byte sequence; `E002` covers non-UTF-8 encoding; `E003` covers tab indentation; `E004` covers frontmatter > 4 KB; `E005` covers missing/malformed `---` delimiters; `E006` covers YAML parse error; `E007` covers unquoted YAML 1.1 boolean coercion (`on`/`off`/`yes`/`no`/`y`/`n`)
**And** `E008`–`E014` cover envelope shape failures (`type` missing/empty/malformed, `requires` not-array / entry-missing-type / invalid-shape, `produces` not-object / missing-type)
**And** `W001` covers unrecognized frontmatter field outside the allow-list; `W002` covers non-`core:*` namespace; `W003` covers unrecognized `schema_version`

**Given** the registry must be machine-validated to catch malformed edits
**When** I open `schemas/v1/diagnostic-registry.schema.json`
**Then** the schema (Draft 2020-12) defines required structure: array of code entries; `severity` strictly `error | warning`
**And** `code` matches pattern `^CASPIAN-(E|W)\d{3}$`
**And** `doc` matches pattern `^https://caspian\.dev/diagnostics#caspian-(e|w)\d{3}$`
**And** required fields per entry: `code`, `severity`, `rule`, `message`, `doc`

**Given** message-style conventions are enforced
**When** I read each entry's `message`
**Then** every message uses imperative present (e.g., *"BOM byte sequence (`EF BB BF`) detected at file start"*, NOT *"You have a BOM"*)
**And** no message ends with a period
**And** field names within messages are wrapped in backticks

**Given** the registry has its own governance lifecycle
**When** I open `diagnostics/CHANGELOG.md`
**Then** the file has a governance header stating the registry is append-only and its semver is decoupled from the spec's
**And** `diagnostics/LICENSE` declares Apache-2.0 explicitly

---

### Story 1.6: Canonical fixture set (valid + invalid)

As a plugin author trying to understand "what does Caspian frontmatter look like in practice",
I want canonical valid fixtures per `core:*` type and overlay scenario, plus invalid fixtures organized one-per-code with machine-readable expectations,
So that I browse concrete examples and Epic 2's regression suite has zero-edit auto-discovery (FR38).

**Acceptance Criteria:**

**Given** the fixture layout follows a consistent convention
**When** I list `fixtures/`
**Then** `fixtures/README.md` (3-line statement) clarifies fixtures are machine-consumed regression data, distinct from author-readable how-tos under `examples/`
**And** `fixtures/LICENSE` declares Apache-2.0 explicitly
**And** `fixtures/valid/` and `fixtures/invalid/` subdirectories are present

**Given** valid fixtures cover each canonical `core:*` type used by casper-core
**When** I list `fixtures/valid/`
**Then** the following files exist with minimal but realistic frontmatter: `core-overview/minimal.md`, `core-epic/minimal.md`, `core-story/minimal.md`, `core-plan/minimal.md`
**And** each valid fixture passes envelope schema validation against `schemas/v1/envelope.schema.json` (no errors, warnings allowed)

**Given** valid fixtures cover overlay-compatibility scenarios
**When** I list `fixtures/valid/overlay-compat/`
**Then** the following files exist: `all-22-known-fields.md` (combines all 6 agentskills.io canonical + 12 Claude Code overlay + 4 Caspian core), `x-extension.md` (uses an `x-vendor-thing` field), `vendor-namespaced.md` (uses a `vendor:custom-field` namespaced field)
**And** each overlay fixture passes envelope schema validation with no errors and (where applicable) no `W001` allow-list warnings since all fields are recognized

**Given** invalid fixtures cover every diagnostic code 1:1
**When** I list `fixtures/invalid/`
**Then** one directory exists per code: `E001-bom`, `E002-encoding`, `E003-tab-indent`, `E004-oversized`, `E005-missing-delimiters`, `E006-yaml-parse`, `E007-unquoted-bool`, `E008-type-missing`, `E009-type-not-namespaced`, `E010-requires-not-array`, `E011-requires-entry-missing-type`, `E012-requires-invalid-shape`, `E013-produces-not-object`, `E014-produces-missing-type`, `W001-unknown-field`, `W002-non-core-namespace`, `W003-unrecognized-schema-version`
**And** each directory contains one or more `<variant>.md` artifacts each paired with a sibling `<variant>.expected.json`

**Given** the `.expected.json` siblings are machine-consumable assertions
**When** I open any `.expected.json`
**Then** the file is shaped as `{ "diagnostics": [ { "code": "CASPIAN-EXXX", "line": <number> }, ... ] }`
**And** the listed code(s) match the directory's intended diagnostic
**And** no extraneous fields appear in `.expected.json`

**Given** comments live only in markdown body, never in frontmatter
**When** I review any fixture
**Then** the frontmatter contains only valid YAML keys/values (no comments)
**And** if explanation is needed, it appears as a single-sentence markdown paragraph in the body (≤1 sentence per fixture)

---

### Story 1.7: Minimal skill adoption example

As a plugin author who already ships Anthropic SKILL.md files,
I want a side-by-side `before/` and `after/` example demonstrating the 4-line frontmatter delta,
So that I see exactly what changes when I adopt Caspian and verify it's overlay-compatible (FR35).

**Acceptance Criteria:**

**Given** the example directory is discoverable
**When** I list `examples/`
**Then** `examples/README.md` (3-line statement) clarifies examples are author-readable walkthroughs, distinct from `fixtures/` regression data
**And** `examples/minimal-skill-adoption/` contains: `README.md`, `before/SKILL.md`, `after/SKILL.md`

**Given** I read the example walkthrough
**When** I open `examples/minimal-skill-adoption/README.md`
**Then** the README explains the 4-line delta concretely: adding `schema_version: "0.1"` (or omitting since it defaults), `type: <vendor>:<name>`, optional `requires: [...]`, optional `produces: {type: <type>}`
**And** the README cross-references `spec/core.md` for full contract details

**Given** the before/after files demonstrate overlay-compat
**When** I diff `before/SKILL.md` and `after/SKILL.md`
**Then** the diff shows exactly the addition of Caspian fields; no Anthropic SKILL.md field is removed or modified
**And** `before/SKILL.md` is a valid Anthropic SKILL.md with the 6 agentskills.io canonical fields populated realistically (would load in any Anthropic-compatible host)
**And** `after/SKILL.md` validates cleanly against `schemas/v1/envelope.schema.json` (overlay-compat verified)

**Given** the example uses realistic content, not fixture-style stubs
**When** I review `after/SKILL.md`
**Then** the frontmatter is representative of a real skill (e.g., a `examples:greeter` skill demonstrating the vendor-namespacing pattern from FR4)
**And** the file remains compact (≤30 lines of frontmatter; body content is illustrative, not load-bearing)

---

## Epic 2: CLI Validator & CI Integration

A plugin author installs `caspian` from npm, runs `caspian validate <path>` locally on a file / directory / glob, gets human-readable diagnostics with edit-distance suggestions and stable doc links, gates their CI on conformance via the `--format=json` output and exit codes, and trusts the validator runs identically on any vanilla Node ≥20 machine without Claude Code installed. Cross-implementation parity is provable via the conformance suite.

### Story 2.1: `@caspian/core` skeleton + envelope schema integration (loader.ts)

As a CLI implementer (or future alternative-host implementer of Caspian validation),
I want a vendor-neutral `@caspian/core` package with a single canonical schema-loading entry point,
So that all validation layers share one bundled schema source and the single-source-of-truth invariant is mechanically enforced.

**Acceptance Criteria:**

**Given** the package layout
**When** I open `packages/core/package.json`
**Then** `name = "@caspian/core"`, `engines.node = ">=20.10"`
**And** `exports` declares `{ ".": "./dist/index.js", "./diagnostics": "./dist/diagnostics/index.js" }`
**And** the `files` array is restrictive (publishes only `dist/`, `README.md`, `CHANGELOG.md`, `LICENSE`)
**And** `LICENSE` (Apache-2.0 explicit) is present at `packages/core/LICENSE`

**Given** Verrou 1 (TypeScript `rootDirs` lockdown)
**When** I open `packages/core/tsconfig.json`
**Then** the config extends `../../tsconfig.base.json`
**And** `rootDirs: ["./src"]` is declared
**And** any relative import that ascends out of `src/` (e.g. `import schema from '../../../schemas/v1/envelope.schema.json'`) is rejected by the TypeScript compiler

**Given** Verrou 2 (biome `noRestrictedImports` lockdown)
**When** I read `biome.json` at the monorepo root
**Then** the `noRestrictedImports` rule is activated for `**/schemas/**`
**And** the rule's allow-list permits only `packages/core/src/schemas/loader.ts` to import from `**/schemas/**`
**And** `pnpm lint` fails on any other import path matching `**/schemas/**`

**Given** Verrou 3 (single loader module)
**When** I run `grep -rn 'envelope.schema' packages/core/src` (or equivalent search)
**Then** exactly one match is returned, in `packages/core/src/schemas/loader.ts`
**And** `loader.ts` resolves `path.resolve(__dirname, '../schemas/v1/envelope.schema.json')` lazily (production mode)
**And** `loader.ts` provides an `import.meta.url`-based fallback to repo-root `schemas/v1/` for dev mode

**Given** schema bundling at build time
**When** I run `pnpm build` (or `pnpm --filter @caspian/core build`)
**Then** `packages/core/scripts/copy-schemas.ts` copies `schemas/v1/**/*.json` into `packages/core/dist/schemas/v1/`
**And** the bundled schemas are loaded at runtime without any network call (NFR6, no remote schema fetching)

**Given** Draft 2020-12 conformance via ajv
**When** I open the validator initialization
**Then** ajv is imported via `ajv/dist/2020.js` (Draft 2020-12 support, NFR14)
**And** the envelope schema is registered locally via `ajv.addSchema()` keyed by its canonical `$id`

**Given** the public API surface
**When** I open `packages/core/src/index.ts`
**Then** the barrel exports a `validateFile(path: string): Diagnostic[]` function (always returns array; empty = valid)
**And** named exports only — no `export default`

**Given** vendor-neutrality at source level
**When** I inspect `packages/core/package.json` and source files
**Then** no dependency or import path matches `@anthropic-ai/*` or `@claude/*`

**Given** vitest config stability across cwd
**When** I open `packages/core/vitest.config.ts`
**Then** the config resolves paths via `import.meta.url` (never `process.cwd()`)
**And** `tests/helpers/paths.ts` exposes `REPO_ROOT`, `FIXTURES_DIR`, `SCHEMAS_DIR`

---

### Story 2.2: Diagnostic registry → typed TS constants (`codes.generated.ts`) with sha256 + verify hash

As a validator implementer,
I want diagnostic codes generated as typed TS constants from the canonical registry, with sha256 tampering safeguards,
So that the codes I reference in source code can never silently drift from `diagnostics/registry.json`.

**Acceptance Criteria:**

**Given** the generation script
**When** I run `pnpm gen:codes` (which invokes `packages/core/scripts/gen-diagnostic-codes.ts`)
**Then** the script reads `diagnostics/registry.json`, computes its sha256 hash, and writes `packages/core/src/diagnostics/codes.generated.ts`
**And** the generated file's first line is a comment of the form `// Hash: <sha256-hex>`
**And** the rest of the file declares one typed constant per registry entry (e.g., `export const CASPIAN_E001: DiagnosticDefinition = { code: "CASPIAN-E001", severity: "error", ... }`)

**Given** the verify-hash CI step
**When** I run `pnpm verify-codes-hash` (which invokes `packages/core/scripts/verify-codes-hash.ts`)
**Then** the script recomputes the sha256 of `diagnostics/registry.json` and compares to the header in `codes.generated.ts`
**And** matching → exit 0; mismatch → exit non-zero with a clear message instructing the contributor to run `pnpm gen:codes`

**Given** the registry-shape CI step
**When** I run `pnpm ajv-validate-registry`
**Then** the step validates `diagnostics/registry.json` against `schemas/v1/diagnostic-registry.schema.json` using ajv
**And** any malformed entry (missing field, severity outside enum, invalid code pattern) blocks the merge

**Given** the pre-commit hook (configured via `simple-git-hooks`)
**When** I commit a change touching `diagnostics/registry.json`
**Then** the hook auto-runs `pnpm gen:codes` and `git add packages/core/src/diagnostics/codes.generated.ts`
**And** the commit includes the regenerated file with the updated hash header

**Given** types are colocated with the registry-derived code
**When** I open `packages/core/src/diagnostics/types.ts`
**Then** `Diagnostic`, `Severity = "error" | "warning"`, and `ValidationResult` are exported
**And** `Severity` is a discriminating union (no `info` or `hint` levels in v1.0)

**Given** the reporter abstraction lives in core
**When** I open `packages/core/src/diagnostics/reporter.ts`
**Then** the file exports a `Reporter` interface (concrete formatters live in `packages/cli`, not in core)

**Given** the diagnostics sub-export
**When** I import from `@caspian/core/diagnostics` in another package
**Then** I can reference `CASPIAN_E001`, `CASPIAN_W001`, etc., as typed constants
**And** I cannot edit `codes.generated.ts` by hand without breaking the hash check

**Given** the hand-edit safeguard
**When** I open `.gitattributes`
**Then** `packages/core/src/diagnostics/codes.generated.ts merge=ours linguist-generated=true` is declared
**And** GitHub marks the file as generated in PR diffs

---

### Story 2.3: Pipeline stages 1–3 in `@caspian/core` (byte-level + frontmatter extraction + YAML parse)

As a plugin author,
I want the validator to detect encoding, BOM, frontmatter-extraction, and YAML-parse failures with stable diagnostic codes,
So that syntactically invalid artifacts fail fast with a clear, machine-stable error code (FR12).

**Acceptance Criteria:**

**Given** a fixture `fixtures/invalid/E001-bom/with-bom.md` (UTF-8 with BOM prefix)
**When** the validator runs
**Then** stage 1 emits `CASPIAN-E001` with line `1`
**And** stages 2–6 do not run for this file (fail-fast)

**Given** a non-UTF-8 fixture (`fixtures/invalid/E002-encoding/`)
**When** the validator runs
**Then** stage 1 emits `CASPIAN-E002`
**And** stages 2–6 do not run

**Given** a fixture with tab indentation in frontmatter (`fixtures/invalid/E003-tab-indent/`)
**When** the validator runs
**Then** stage 3's post-parse scan emits `CASPIAN-E003`
**And** stages 4–6 do not run for this file

**Given** a fixture with frontmatter exceeding 4 KB (`fixtures/invalid/E004-oversized/`)
**When** the validator runs
**Then** stage 2 emits `CASPIAN-E004` (NFR4)
**And** stages 3–6 do not run

**Given** a fixture with missing or malformed `---` delimiters (`fixtures/invalid/E005-missing-delimiters/`)
**When** the validator runs
**Then** stage 2 emits `CASPIAN-E005`
**And** stages 3–6 do not run

**Given** a fixture with a YAML parse error (`fixtures/invalid/E006-yaml-parse/`, e.g. unclosed bracket)
**When** the validator runs using `yaml` v2.x in strict YAML 1.2 safe-load mode (NFR5)
**Then** stage 3 emits `CASPIAN-E006`
**And** stages 4–6 do not run

**Given** a fixture with an unquoted YAML 1.1 boolean coercion (`fixtures/invalid/E007-unquoted-bool/yes-as-string.md`, with a value `enabled: yes`)
**When** the validator runs
**Then** stage 3's post-parse scan flags the unquoted boolean and emits `CASPIAN-E007` (NFR8)
**And** the diagnostic includes the field name in backticks and the offending value

**Given** byte-counting precision
**When** frontmatter is exactly 4096 bytes (UTF-8) between (but excluding) the opening and closing `---` lines, exclusive of the delimiter newlines
**Then** no `E004` fires
**And** at 4097 bytes, `E004` fires (deterministic boundary on both CRLF and LF systems)

**Given** safe-load enforcement (NFR5)
**When** a fixture contains a YAML custom tag that would enable code execution (`!!python/object:`, etc.)
**Then** the parser rejects it without execution attempt and emits `CASPIAN-E006`

**Given** offline operation (NFR6, NFR20)
**When** any stage 1–3 runs
**Then** no network I/O is attempted
**And** no telemetry is emitted

---

### Story 2.4: Pipeline stages 4–6 in `@caspian/core` (envelope + namespace + allow-list)

As a plugin author,
I want the validator to enforce envelope shape, warn on non-`core:*` types and unknown fields, and offer edit-distance suggestions,
So that I get strict-but-friendly feedback that matches the FR12 (warn on out-of-allow-list) + FR13 (warn-on-unregistered-namespace) + FR9 (suggestion + doc link) contract.

**Acceptance Criteria:**

**Given** a fixture missing `type` (`fixtures/invalid/E008-type-missing/`)
**When** stage 4 (envelope schema) runs
**Then** it emits `CASPIAN-E008`

**Given** a fixture with `type` not in `<namespace>:<name>` form (`fixtures/invalid/E009-type-not-namespaced/`, e.g. `type: epic`)
**When** stage 4 runs
**Then** it emits `CASPIAN-E009`

**Given** fixtures `E010-requires-not-array`, `E011-requires-entry-missing-type`, `E012-requires-invalid-shape`
**When** stage 4 runs
**Then** each emits its respective code

**Given** fixtures `E013-produces-not-object`, `E014-produces-missing-type`
**When** stage 4 runs
**Then** each emits its respective code

**Given** a fixture with `type: bmad:epic` (vendor-namespaced, not in `core:*` registry)
**When** stage 5 (namespace check) runs
**Then** it emits warning `CASPIAN-W002` (FR13 — extensible-registry: warn, never reject)
**And** the artifact is otherwise considered valid (warnings do not prevent exit `0` per FR10)

**Given** a fixture with `schema_version: "9.9"` (unrecognized by this validator)
**When** stage 5 runs
**Then** it emits warning `CASPIAN-W003`

**Given** a fixture with an unknown frontmatter field `metadat` (typo of `metadata`)
**When** stage 6 (allow-list scan) runs
**Then** it emits warning `CASPIAN-W001` with `field: "metadat"`
**And** the message includes an edit-distance suggestion in the form *"Did you mean `metadata`?"* (edit-distance ≤ 2)
**And** the diagnostic includes a doc link `https://caspian.dev/diagnostics#caspian-w001` (FR9)

**Given** the 22-known-field allow-list constant
**When** I open `packages/core/src/constants.ts`
**Then** `RECOGNIZED_FIELDS` declares the union: 4 Caspian core (`schema_version`, `type`, `requires`, `produces`) + 6 agentskills.io canonical (`name`, `description`, `license`, `allowed-tools`, `metadata`, `compatibility`) + 12 Claude Code overlay (`when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `model`, `effort`, `context`, `agent`, `hooks`, `paths`, `shell`)
**And** the constant is exported as a frozen `Set<string>` (or `ReadonlySet<string>`)

**Given** vendor-namespaced fields and `x-*` extensions are recognized without warning
**When** a fixture frontmatter includes `bmad:epic-id: 42` or `x-experimental-thing: foo`
**Then** stage 6 does not emit `W001` for those fields (FR4, FR6, NFR16 graceful degradation)

**Given** continue-and-collect within a single file (post-stage-3)
**When** a fixture has both an `E008` (missing `type`) and a `W001` (unknown field) condition
**Then** both diagnostics are emitted in the same validation pass (stages 4, 5, 6 emit independent diagnostics after stage 3 succeeds)

**Given** vendor-neutrality verification
**When** the validator processes any fixture
**Then** no Claude-Code-specific module is imported
**And** `dependency-cruiser` (verified in Story 2.7) confirms zero `@anthropic-ai/*` or `@claude/*` in core's transitive deps

---

### Story 2.5: `caspian` CLI package — walker + multi-file aggregation + human formatter

As a plugin author,
I want a `caspian validate <path>` CLI that accepts file/directory/glob inputs and prints clear human-readable diagnostics with file/line/code/message/doc-URL,
So that I can validate my project locally with a single command and read the output directly in my terminal (FR7, FR9 human-side, FR10).

**Acceptance Criteria:**

**Given** a single file path
**When** I run `caspian validate ./fixtures/valid/core-overview/minimal.md`
**Then** the CLI exits `0` and prints a per-file diagnostic block (empty diagnostics + summary footer)

**Given** a directory
**When** I run `caspian validate ./fixtures/valid/`
**Then** the CLI walks the directory recursively for `*.md` files via `fast-glob`
**And** every matched file is validated through `@caspian/core`'s `validateFile()`

**Given** a glob pattern
**When** I run `caspian validate '**/*.md'`
**Then** glob expansion is performed inside the CLI by `fast-glob` (not by the shell)
**And** `followSymbolicLinks: false` ensures symlinks are not traversed
**And** every walked file's realpath is verified to remain under the cwd (forward-compat with NFR9)

**Given** the exit-code matrix
**When** the CLI completes
**Then** `0` = all files valid (warnings allowed); `1` = at least one error; `2` = usage error (unknown flag, file not found, malformed glob); `3` = internal validator error (uncaught exception)
**And** warnings alone never trigger a non-zero exit (FR10)

**Given** a malformed CLI invocation (`caspian validate --flubber`)
**When** the CLI runs
**Then** the unknown flag is detected by `commander` v12 and the CLI exits `2` with a usage message

**Given** a missing input (`caspian validate ./does-not-exist.md`)
**When** the CLI runs
**Then** the CLI exits `2` with a clear "file not found" message

**Given** an internal exception (intentionally simulated)
**When** an uncaught error reaches the top-level catch in `cli.ts`
**Then** the CLI exits `3`
**And** stderr prints the message + stack trace + `Please report at <repo URL>`

**Given** the human-readable formatter
**When** I run the CLI on a fixture with diagnostics
**Then** stdout shows per-file diagnostic blocks of the form `<file>:<line> — <code> <severity>: <message>` followed by `  hint: <suggestion>` (when applicable) and `  doc: https://caspian.dev/diagnostics#caspian-eXXX`
**And** the summary footer prints `<N> files: <X> errors, <Y> warnings`

**Given** ANSI color detection
**When** stdout is a TTY (`process.stdout.isTTY === true`)
**Then** `chalk` applies ANSI colors (errors red, warnings yellow, file paths cyan)
**And** when stdout is piped or redirected, colors are disabled

**Given** the standard CLI flags
**When** I run `caspian --version`
**Then** the version is printed (sourced from `packages/cli/package.json` via `version.ts` generated at build)
**And** `caspian --help` and `caspian validate --help` print usage with available flags

**Given** the package metadata
**When** I open `packages/cli/package.json`
**Then** `name = "caspian"`, `bin = {"caspian": "./dist/cli.js"}`, `engines.node = ">=20.10"`
**And** dependencies are `@caspian/core` (workspace:^), `commander` (~v12), `fast-glob`, `chalk`
**And** dev dependencies include `vitest` for integration tests

---

### Story 2.6: `--format=json` stable schema (B4) + golden snapshots + verify-pack

As a CI integrator,
I want a stable, machine-readable JSON output mode and a tracked `npm pack` snapshot,
So that downstream automation (jq pipelines, GitHub Actions matrix gates, third-party dashboards) consumes a contract that does not silently break (FR8) and the published artifact never accidentally bloats.

**Acceptance Criteria:**

**Given** the `--format=json` flag
**When** I run `caspian validate --format=json ./fixtures/`
**Then** stdout is valid JSON parseable by `JSON.parse`
**And** the human formatter is bypassed entirely (no ANSI, no plain-text blocks)

**Given** the B4 stable output schema
**When** I parse the JSON output
**Then** the top-level object has `schemaVersion: "1"`, `results: [...]`, `summary: {...}`
**And** each result has `file: string`, `valid: boolean`, `diagnostics: [...]`
**And** each diagnostic has `code: string`, `severity: "error" | "warning"`, `line: number`, `field?: string`, `message: string`, `doc?: string`
**And** `summary` has `files: number`, `errors: number`, `warnings: number`

**Given** schema-version stability
**When** the JSON output schema evolves in any incompatible way
**Then** `schemaVersion` increments (e.g., `"2"`)
**And** the prior schema version is documented as deprecated for at least one minor release before removal

**Given** golden snapshot tests
**When** I run `pnpm --filter caspian test`
**Then** `packages/cli/tests/integration/format-json.test.ts` executes and compares CLI JSON output against tracked `.snap` files
**And** any change to the output shape fails the snapshot test until intentionally updated via `pnpm test -- -u`

**Given** the `published-files.snapshot.json` baseline
**When** I run `pnpm pack --dry-run --json` from `packages/cli/`
**Then** the output matches `packages/cli/tests/integration/published-files.snapshot.json` exactly

**Given** the `verify-pack.ts` CI step
**When** I run `pnpm --filter caspian verify-pack`
**Then** the script diff'd `pnpm pack --dry-run --json` against the snapshot
**And** drift (file added/removed in the published tarball, size delta beyond a small tolerance) fails the build

**Given** the JSON formatter respects offline + deterministic invariants
**When** invoked twice on the same input
**Then** the JSON output is byte-identical across runs (NFR19, NFR20)
**And** key ordering within objects is stable (alphabetical or insertion-order, but consistent)

**Given** strict-warnings opt-in for downstream CI
**When** an integrator runs `caspian validate --format=json ./skills/ | jq -e '.summary.errors == 0 and .summary.warnings == 0'`
**Then** the chained pipeline exits non-zero on any diagnostic (PRD Journey 6 strict-warnings gate)

---

### Story 2.7: Conformance suite + 3-layer vendor-neutrality enforcement

As a plugin author (and as a future implementer of an alternative-language Caspian validator),
I want a vendor-neutral conformance test suite plus three independent vendor-neutrality enforcement layers,
So that *"the validator is portable"* is a mechanically provable invariant, not a marketing claim — and v1.1+ alternative implementations have a parity gate (FR11, NFR17).

**Acceptance Criteria:**

**Given** the conformance harness
**When** I open `conformance/runner.mjs`
**Then** the script accepts a validator binary path as its only argument (e.g., `node conformance/runner.mjs ./packages/cli/dist/cli.js`)
**And** the script iterates every case under `conformance/cases/`
**And** for each case, it executes the validator on `cases/NNN-<slug>/input.md` and compares the actual diagnostics against `cases/NNN-<slug>/expected.json`

**Given** the v1.0 conformance case set
**When** I list `conformance/cases/`
**Then** at least 17 cases exist, each mirroring a diagnostic code (`E001` through `E014`, `W001`, `W002`, `W003`)
**And** each directory contains `input.md` and `expected.json` siblings
**And** `conformance/README.md` documents how to run the suite against an arbitrary validator

**Given** the harness output
**When** the run completes
**Then** `conformance/REPORT.md` is generated from `REPORT.template.md` with per-case pass/fail rows and a final summary
**And** non-matching diagnostic code(s) cause that case to fail
**And** the run's exit code is `0` only if every case passes

**Given** the `pnpm conformance` CI step
**When** the CI workflow runs
**Then** the step invokes `node conformance/runner.mjs ./packages/cli/dist/cli.js`
**And** the CLI eats its own dog food: every case must pass for the build to be green

**Given** vendor-neutrality enforcement layer 1 (source-level)
**When** `packages/cli/.dependency-cruiser.cjs` is evaluated by `pnpm depcruise`
**Then** the configuration declares a `forbidden` rule: `from: ^packages/(core|cli)/src` to `^node_modules/(@anthropic-ai|@claude)`
**And** any direct, transitive (within the cruiser's reach), type-only, or statically-resolvable dynamic import that matches the rule fails the lint
**And** the CI step `pnpm depcruise` runs against both `packages/core` and `packages/cli`

**Given** vendor-neutrality enforcement layer 2 (lockfile-level)
**When** the CI runs `pnpm ls --prod --depth=Infinity --json` and pipes the result through `jq` to filter `packages/core` and `packages/cli` resolved deps
**Then** any dependency name (top-level or transitive) matching `claude` or `anthropic` (case-insensitive) fails the build
**And** this layer catches transitive dependencies that the source-level cruiser cannot see

**Given** vendor-neutrality enforcement layer 3 (runtime release gate)
**When** the release pipeline runs `docker run --rm -v $(pwd):/work node:20-alpine sh -c "cd /work && npx caspian validate ./fixtures/valid/"`
**Then** the validator exits `0` on a vanilla Linux container with no Claude Code installed
**And** this docker step is blocking on the `release.yml` workflow before publish

**Given** the three layers together
**When** any one layer fails
**Then** the build/release fails
**And** the marketing claim *"the CLI runs on a machine without Claude Code installed"* (NFR17) is reduced from "trust me" to mechanical proof

---

### Story 2.8: npm publish with provenance + `examples/ci-integration/`

As a plugin author who just decided to adopt Caspian,
I want to install the CLI from npm via a clean, signed package and copy a 3-line CI integration snippet into my own GitHub Actions workflow,
So that I can gate my repo's PRs on Caspian conformance in under five minutes (FR29, FR36, NFR15).

**Acceptance Criteria:**

**Given** the release workflow
**When** I open `.github/workflows/release.yml`
**Then** the workflow triggers on PR merge to `main` after `changesets` composes the release PR
**And** the workflow runs `pnpm install --frozen-lockfile`, `pnpm build`, then `pnpm publish -r --provenance`
**And** the publish uses GitHub Actions OIDC tokens (no long-lived npm tokens stored)
**And** Sigstore-backed provenance attestations are generated for `@caspian/core` and `caspian` (the CLI wrapper)

**Given** the post-publish verification
**When** I run `npm view caspian@<published-version>` after a release
**Then** the registry lists the package with `provenance` attestations visible
**And** `npm view caspian@<version> dist.signatures` confirms Sigstore signing

**Given** the CLI package metadata
**When** I open `packages/cli/package.json`
**Then** `name = "caspian"` (unhyphenated, matching FR29)
**And** `bin = {"caspian": "./dist/cli.js"}`
**And** `engines.node = ">=20.10"`
**And** `caspian.supportedSchemaVersions = ["0.1"]`
**And** `files = ["dist/", "README.md", "CHANGELOG.md", "LICENSE"]` (restrictive — no source, no tests, no scripts shipped)

**Given** the CI integration snippet
**When** I open `examples/ci-integration/github-actions-snippet.yml`
**Then** the file is a valid GitHub Actions workflow snippet
**And** the validation step is exactly three YAML lines (excluding setup/checkout boilerplate): `- name: Validate Caspian frontmatter`, `  run: npx caspian validate ./skills/`, `  shell: bash` (or equivalent minimal form)

**Given** the snippet README
**When** I open `examples/ci-integration/README.md`
**Then** the README explains: install Node ≥20 in CI, run `npx caspian validate ./<path>/`, fail PR on non-zero exit
**And** the README documents the optional strict-warnings gate via `npx caspian validate --format=json ./skills/ | jq -e '.summary.errors == 0 and .summary.warnings == 0'` (PRD Journey 6 reference)
**And** no Claude Code reference appears in the snippet (vendor-neutrality preserved)

**Given** a fresh user with only Node ≥20 installed
**When** they run `npx caspian validate ./` in any project
**Then** the CLI executes successfully without requiring Claude Code, additional config, or network access at validate time (NFR6, NFR17, NFR20)

**Given** the publish artifact integrity
**When** the release pipeline runs
**Then** `verify-pack.ts` (Story 2.6) has already locked the published file list
**And** the conformance suite (Story 2.7) has passed
**And** the docker vendor-neutrality release gate (Story 2.7) has passed
**And** all three are blocking gates before `pnpm publish` runs

**Given** the CLI README in the published package
**When** I open `packages/cli/README.md`
**Then** the README documents install (`npm install -g caspian` and `npx caspian`), the `validate <path>` command, the exit-code matrix (0/1/2/3), and the `--format=json` shape
**And** the README links to `caspian.dev` for the full spec and diagnostics reference

---

## Epic 3: Reference Workflow casper-core (Claude Code Plugin)

A developer on Claude Code installs `casper-core` from the Anthropic marketplace (or a local path), runs `/init-project` → `/discover` → `/plan-story` end-to-end on a greenfield project producing typed `core:overview` / `core:epic` / `core:story` / `core:plan` artifacts on disk with no manual editing between commands, can override any of the three commands locally by placing a same-name/same-contract skill in `.claude/commands/`, and their override survives plugin updates.

### Story 3.1: casper-core plugin manifest + foundation files

As a developer evaluating Claude Code plugins,
I want a clean casper-core plugin directory with a Claude-Code-conformant manifest, an explicit Apache-2.0 license, and a vendor-neutral surface boundary,
So that I can install the plugin from a local path or marketplace and trust the licensing/structure on first inspection (FR22, FR30, NFR23).

**Acceptance Criteria:**

**Given** the plugin directory layout
**When** I list `plugins/casper-core/`
**Then** the following are present: `plugin.json`, `LICENSE` (Apache-2.0 explicit), `README.md` (skeleton; populated in Story 3.5), and `commands/` (populated in Stories 3.2–3.4)

**Given** vendor-bound surface isolation (architecture step-06 boundary)
**When** I check `plugins/casper-core/` recursively
**Then** NO Node code exists in the directory: no `package.json`, no `.ts` files, no `node_modules/`, no `dist/`
**And** the entire surface is markdown + JSON manifest (vendor-bound to Claude Code, isolated from the neutral `packages/` surface)

**Given** Claude Code plugin format compat (NFR23)
**When** I open `plugins/casper-core/plugin.json`
**Then** the manifest conforms to the Claude Code plugin spec as of v1.0 release (declared `name`, `version`, `description`, license metadata)
**And** `name = "casper-core"` (unhyphenated per FR30)

**Given** Caspian forward-compat traceability
**When** I open `plugins/casper-core/plugin.json`
**Then** a `caspian.supportedSchemaVersions: ["0.1"]` field is declared
**And** the value matches `packages/cli/package.json`'s `caspian.supportedSchemaVersions` declared in Story 2.8

**Given** NFR7 (plugin-format constraint — no elevated permissions)
**When** I check `plugin.json` and any agent definitions in the directory
**Then** `hooks`, `mcpServers`, `permissionMode` are absent
**And** no elevated permissions are requested at install or runtime

**Given** license hygiene for isolated consumption
**When** I open `plugins/casper-core/LICENSE`
**Then** the file is the explicit Apache-2.0 text (re-declared to be unambiguous when the directory is consumed outside the monorepo)

**Given** install via marketplace or local path (FR22)
**When** a developer runs `/plugin install casper-core@anthropic-marketplace` or `/plugin install ./plugins/casper-core`
**Then** Claude Code accepts the manifest and registers `commands/` as the plugin's slash-command surface
**And** marketplace acceptance is a strategic goal, not a release gate (FR30)

**Given** dogfood readiness (non-blocking; verified after Epic 2 ships)
**When** I run `caspian validate ./plugins/casper-core/commands/` after Stories 3.2–3.4 ship
**Then** all command frontmatters validate with zero errors
**And** any `W002` warnings on `type: casper:command` are expected and documented (per FR13 namespace-extensibility rule)

---

### Story 3.2: `/init-project` command (produces `core:overview`)

As a developer starting a fresh project on Claude Code with casper-core installed,
I want a `/init-project` command that seeds a typed `core:overview` artifact on disk,
So that I can demonstrate the `requires → produces` chain from a known starting state and downstream commands have a typed predecessor (FR15).

**Acceptance Criteria:**

**Given** the file layout
**When** I list `plugins/casper-core/commands/`
**Then** `init-project.md` is present

**Given** the Caspian frontmatter contract (FR1–FR3, FR5)
**When** I open `init-project.md`
**Then** the YAML frontmatter declares: `schema_version: "0.1"`, `type: casper:command`, `name: init-project`, a Claude-Code-discoverable `description`, and `produces: {type: core:overview}`
**And** agentskills.io canonical fields and Claude Code overlay fields coexist cleanly alongside Caspian fields without conflict

**Given** NFR18 (slash-command auto-activation discovery)
**When** I read the `description` field
**Then** the trigger phrase appears in the first sentence (e.g., *"Bootstrap a greenfield project with a typed core:overview artifact..."*)
**And** the total `description` length is ≤1 536 characters

**Given** /init-project has no preconditions (operates on greenfield)
**When** I check the frontmatter
**Then** `requires` is absent or declared as an empty array

**Given** FR15 (produces typed `core:overview`)
**When** a developer runs `/init-project` on a fresh repo
**Then** the command body instructs Claude to write a `core:overview` artifact at a conventional path (e.g., `caspian-workspace/overview.md` — exact path documented in the command body)
**And** the written file carries Caspian frontmatter declaring `type: core:overview`
**And** the body is *minimal seeding* — not a full memory scaffold (per PRD Journey 2: *"just enough to demonstrate the chain"*)

**Given** the produced artifact is typed-conformant
**When** I run `caspian validate <produced-overview-path>` post-execution
**Then** the artifact validates with zero errors

**Given** vendor-namespaced type for the command itself
**When** the command file is validated by `caspian validate`
**Then** a `CASPIAN-W002` warning is emitted on `type: casper:command` (expected per FR13 extensible-registry rule; warning-level, exit code remains `0`)

---

### Story 3.3: `/discover` command (produces `core:story`, with `core:epic` side output)

As a developer starting work on a new feature,
I want a `/discover` command that articulates the feature into typed `core:epic` and `core:story` artifacts on disk,
So that the typed contract is reified and the next command (`/plan-story`) has a `core:story` to consume (FR16).

**Acceptance Criteria:**

**Given** the file layout
**When** I list `plugins/casper-core/commands/`
**Then** `discover.md` is present

**Given** the Caspian frontmatter contract
**When** I open `discover.md`
**Then** the YAML frontmatter declares: `schema_version: "0.1"`, `type: casper:command`, `name: discover`, a Claude-Code-discoverable `description`, and `produces: {type: core:story}`

**Given** the produces semantics resolution (architecture step-04 "exactly one artifact of type T" reconciled with PRD FR16 "epic and story")
**When** I read the `produces` declaration
**Then** ONLY `core:story` is declared as the typed contract output (the artifact `/plan-story` consumes via its `requires`)
**And** the `core:epic` file is documented as a *side output* (typed via its own frontmatter but NOT part of the produces dependency contract)
**And** the command body explicitly notes this resolution: *"this command writes both `core:epic` and `core:story` files; the `produces` contract declares `core:story` as the primary handoff to `/plan-story`; the `core:epic` is a parent-linkage side output"*

**Given** FR16 (epic + story files written on disk)
**When** the command body executes
**Then** it writes a typed `core:epic` artifact (parent-linkage side output, e.g., `caspian-workspace/epic.md`)
**And** it writes a typed `core:story` artifact (primary contract output, e.g., `caspian-workspace/story.md`)
**And** both files carry valid Caspian frontmatters declaring their respective `type` values

**Given** the single-active-story workspace convention (FR19)
**When** `/discover` writes the `core:story`
**Then** the path/naming convention makes it the unique active story
**And** type-based `requires` matching by downstream `/plan-story` remains deterministic (no `status` filter needed in v1.0)

**Given** NFR18
**When** I read the `description` field
**Then** the trigger phrase appears in the first sentence (e.g., *"Articulate a new feature into typed core:epic and core:story artifacts..."*)
**And** the total length is ≤1 536 characters

**Given** /discover has no Caspian preconditions (chain flexibility per FR18 verification)
**When** I check the frontmatter
**Then** `requires` is absent (a developer can run `/discover` directly on a project even without prior `/init-project`)

**Given** the produced artifacts are typed-conformant
**When** I run `caspian validate <produced-paths>` post-execution
**Then** both the `core:epic` and `core:story` files validate with zero errors

---

### Story 3.4: `/plan-story` command (requires `core:story`, produces `core:plan`)

As a developer with an active `core:story` (produced by `/discover` or hand-written),
I want a `/plan-story` command that consumes the typed story and produces a typed `core:plan`,
So that the `requires → produces` chain is closed end-to-end and the typed contract is provably composable (FR17).

**Acceptance Criteria:**

**Given** the file layout
**When** I list `plugins/casper-core/commands/`
**Then** `plan-story.md` is present

**Given** the Caspian frontmatter contract (FR2, FR3, FR17)
**When** I open `plan-story.md`
**Then** the YAML frontmatter declares: `schema_version: "0.1"`, `type: casper:command`, `name: plan-story`, a Claude-Code-discoverable `description`, `requires: [{type: core:story, count: 1}]`, and `produces: {type: core:plan}`

**Given** FR17 + FR19 (requires `core:story` count 1, single-active-story convention)
**When** `/plan-story` is invoked in a workspace with exactly one active `core:story` artifact
**Then** the `requires` constraint is satisfied deterministically via type-based matching (no `status` filter needed)

**Given** zero active stories in the workspace
**When** a developer runs `/plan-story`
**Then** the command body instructs Claude that the precondition `core:story (count: 1)` is unsatisfied and to surface the issue to the user (runtime enforcement is a v1.1 concern of `state-manager`; v1.0 is pure-prompt advisory)

**Given** the multi-active-story scenario is out of scope for v1.0
**When** the README or command body addresses ambiguity
**Then** it states the single-active-story convention is required for deterministic resolution (FR19); multi-story workspaces are deferred to v1.1's `state-manager` + `status` filter

**Given** FR17 (produces typed `core:plan`)
**When** the command body executes successfully
**Then** it writes a typed `core:plan` artifact at a conventional path paired with the active story (e.g., `caspian-workspace/story-plan.md`)
**And** the file carries Caspian frontmatter declaring `type: core:plan`

**Given** the produced artifact is typed-conformant
**When** I run `caspian validate <produced-plan-path>` post-execution
**Then** the artifact validates with zero errors

**Given** NFR18
**When** I read the `description` field
**Then** the trigger phrase appears in the first sentence (e.g., *"Generate a typed core:plan artifact from the active core:story..."*)
**And** the total length is ≤1 536 characters

**Given** vendor-namespaced type for the command itself
**When** the command file is validated by `caspian validate`
**Then** `CASPIAN-W002` warning is emitted (expected per FR13, same as Stories 3.2 and 3.3)

---

### Story 3.5: End-to-end chain + override pattern + casper-core README

As a developer who just installed casper-core,
I want a README explaining install paths, the 3-command chain demonstration, the local-override pattern (Journey 3), and the explicit scope boundary,
So that I can adopt the plugin in 5 minutes and not be confused about what v1.0 does versus the full Casper workflow (FR37, FR18, FR20, FR21).

**Acceptance Criteria:**

**Given** the README scope (FR37)
**When** I open `plugins/casper-core/README.md`
**Then** the document covers all five sections: install (marketplace + local path), the three commands and what each produces, the end-to-end chain demo on a greenfield project, the local-override pattern (PRD Journey 3), and the explicit scope boundary

**Given** the install section (FR22)
**When** I read it
**Then** both install forms are documented: `/plugin install casper-core@anthropic-marketplace` (marketplace; acceptance is strategic, not a release gate per FR30) and `/plugin install ./path/to/casper-core` (local development)

**Given** the chain demonstration (FR18)
**When** I follow the README's chain section on a fresh greenfield repo
**Then** I can run `/init-project` → `/discover` → `/plan-story` end-to-end with zero manual artifact editing required between commands
**And** the resulting workspace contains four typed artifacts (`core:overview`, `core:epic`, `core:story`, `core:plan`) on disk

**Given** dogfood evidence post-chain (PRD Technical Success: *"casper-core's chain demonstrably produces artifacts that pass `caspian` CLI validation on a clean run"*)
**When** I run `caspian validate <workspace-root>` after the chain completes
**Then** all four produced artifacts validate with zero errors
**And** any `W002` warnings on `type: casper:command` (in the plugin's own command files) are expected per FR13

**Given** the override pattern section (PRD Journey 3, FR20)
**When** I read it
**Then** the documented pattern is: copy `plugins/casper-core/commands/plan-story.md` into the project's local `.claude/commands/plan-story.md`, modify the body to taste, **keep `name`, `requires`, and `produces` frontmatter fields identical to the upstream contract**, run `caspian validate ./.claude/commands/` to verify
**And** Claude Code resolves the local override ahead of the plugin-shipped command at invocation time

**Given** override survives plugin updates (FR21)
**When** the README addresses the update scenario
**Then** it states: provided the override's `name` + `requires` + `produces` match the upstream contract, running `/plugin update casper-core` does not break the override
**And** the README warns that contract changes (e.g., a future `/plan-story` declaring `requires: [{type: core:story, count: 2}]`) would invalidate an old override and require re-alignment

**Given** the explicit scope boundary
**When** I read the scope section
**Then** it states: *"casper-core v1.0 is a proof-of-concept of the requires/produces contract via 3 porcelain commands. The full Casper workflow (Memory Profile overlay, 8 porcelain commands including `/backlog`, 6 plumbing skills, runtime advisor `state-manager`, SessionStart lean-boot hook) ships in casper-full v1.1 — see [link to v1.1 PRD when published]"*
**And** the boundary discourages over-extending v1.0 (no `/backlog` workaround attempts, no Memory Profile retrofitting in v1.0)

**Given** vendor-neutrality reminder
**When** I read the README
**Then** there is no claim that casper-core is required to use Caspian
**And** the document positions the spec, the CLI (`caspian` on npm), and overlay-compatibility as the primary v1.0 artifacts; casper-core is a *demonstration*, not a dependency for adopters

**Given** dogfood evidence on the plugin's own commands
**When** I run `caspian validate ./plugins/casper-core/commands/` after Epic 2 ships
**Then** all three command files validate with zero errors
**And** the only warnings emitted are `CASPIAN-W002` on `type: casper:command` (vendor-namespace warning, expected by FR13)

---

## Epic 4: Discoverability via caspian.dev

A plugin author or developer lands on `caspian.dev`, grasps Caspian in 30 seconds via the pitch, sees the 4-line frontmatter quickstart, clicks through to the spec GitHub repo / CLI on npm / casper-core marketplace listing / CONTRIBUTING / RFC process. Diagnostic doc URLs emitted by the CLI resolve to a stable anchored page (`/diagnostics`) with one anchor per code that survives spec minor-version bumps.

### Story 4.1: `caspian.dev` landing page (index.html + styles + scaffold)

As a plugin author or developer arriving on `caspian.dev` for the first time,
I want a hand-written single-page landing with a 30-second pitch, a 4-line frontmatter quickstart, and four call-to-action links,
So that I grasp Caspian's value proposition in 30 seconds and decide whether to click through to the spec / CLI / casper-core / CONTRIBUTING (FR31).

**Acceptance Criteria:**

**Given** the site scaffold
**When** I list `site/`
**Then** `site/src/index.html`, `site/src/styles.css`, `site/LICENSE.md`, `site/package.json`, and `site/README.md` are present
**And** `site/package.json` has `private: true`, no runtime dependencies, and no static-site-framework dependencies (pure HTML + CSS + Node `node:fs`/`node:url` for the build only — architecture step-04)

**Given** dual licensing for the site
**When** I open `site/LICENSE.md`
**Then** the file declares the dual statement explicitly: prose under CC-BY-4.0, build code under Apache-2.0
**And** SPDX headers in source files (where applicable) match the per-file license

**Given** FR31 (landing page content)
**When** I open `site/src/index.html`
**Then** the page contains: a 30-second pitch (one short paragraph), an install-in-two-lines quickstart showing the 4-line Caspian frontmatter delta, and 4 CTAs linking to the spec GitHub repo, the CLI on npm, casper-core on the marketplace, and CONTRIBUTING (the RFC process)
**And** the structural layout mirrors the root `README.md` 4-CTA hub (Story 1.1) so both surfaces stay aligned

**Given** FR32 (spec-concept stable anchor IDs)
**When** I inspect `site/src/index.html` (or its rendered output)
**Then** stable anchor IDs are present for each spec concept: `id="schema-version"`, `id="type"`, `id="requires"`, `id="produces"`, `id="core-vocabulary"`
**And** the anchors are documented as part of the spec's stable URL surface (per NFR24 redirect commitment when renamed)

**Given** NFR3 (load performance)
**When** I measure load time on a 4G connection from a clean cache
**Then** the page loads in under 2 seconds
**And** DOMContentLoaded fires under 1 second on broadband
**And** no JavaScript framework or runtime library is loaded (zero JS in v1.0)

**Given** NFR10 (WCAG 2.1 Level AA)
**When** I audit the page (e.g., via `axe-core` or equivalent)
**Then** semantic HTML5 elements are used (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`) with proper landmark roles
**And** a skip-link to `#main` is the first interactive element
**And** color contrast is ≥ 4.5:1 for normal text and ≥ 3:1 for large text
**And** the page is keyboard-navigable end-to-end (every interactive element reachable via Tab; visible focus indicator)
**And** no information is conveyed by color alone
**And** no animations trigger without explicit user interaction

**Given** NFR12 (Markdown spec accessibility complement)
**When** I follow the link to the spec GitHub repo from the landing page
**Then** the spec is readable via GitHub's default Markdown renderer with no UI interactions required to access normative content

---

### Story 4.2: Diagnostics page generator (`build.mjs` reads registry → emits `diagnostics.html`)

As a developer who clicked a CLI diagnostic doc-URL (e.g., `https://caspian.dev/diagnostics#caspian-e007`),
I want to land on a stable, anchored doc page describing the code, its rule, and an example,
So that I understand what the diagnostic means without reading the validator source — and the page stays automatically in sync with `diagnostics/registry.json` as the canonical source of truth (FR32).

**Acceptance Criteria:**

**Given** the build script
**When** I open `site/build.mjs`
**Then** the script uses only `node:fs` and `node:url` (no third-party dependency in v1.0)
**And** the script resolves `diagnostics/registry.json` relative to the repo root via `import.meta.url` (never `process.cwd()` — matches the cwd-stability convention from Story 2.1)

**Given** the diagnostics page template
**When** I open `site/src/diagnostics.html.tpl`
**Then** the template is valid HTML with a clearly marked replacement region (e.g., `{{diagnostics_table}}`) that `build.mjs` substitutes
**And** the template uses semantic HTML matching Story 4.1's WCAG 2.1 AA conventions

**Given** the build pipeline
**When** I run `pnpm --filter site build` (or `node site/build.mjs`)
**Then** `site/dist/diagnostics.html` is generated from `site/src/diagnostics.html.tpl` populated with content from `diagnostics/registry.json`
**And** the generated page contains one anchored section per registry entry (`<section id="caspian-e001">...</section>` through `<section id="caspian-e014">`, plus `<section id="caspian-w001">` through `<section id="caspian-w003">`)

**Given** anchor convention consistency
**When** the CLI (Story 2.5/2.6) emits a doc URL `https://caspian.dev/diagnostics#caspian-e007`
**Then** the URL fragment `caspian-e007` matches an `id` on the deployed `diagnostics.html`
**And** the casing is lowercase (matching the Story 1.5 registry `doc` field convention)

**Given** each diagnostic section's content
**When** I read a section
**Then** it includes: the code (`CASPIAN-EXXX` or `CASPIAN-WXXX`), severity (error or warning), rule short name, the canonical message text from the registry, and a brief explanatory paragraph or example for context

**Given** build determinism (NFR19 extension)
**When** I run `pnpm --filter site build` twice on the same commit with no changes to `diagnostics/registry.json`
**Then** the resulting `site/dist/diagnostics.html` is byte-identical across runs

**Given** the build script reads the canonical registry directly
**When** `diagnostics/registry.json` is updated (in a future minor version)
**Then** rebuilding the site automatically reflects the new state with no separate edit to `diagnostics.html.tpl` (single source of truth — same principle as Story 2.2's `codes.generated.ts` derivation)

---

### Story 4.3: GitHub Pages deployment workflow + anchor stability policy

As a maintainer of the spec, the CLI, and the site,
I want a single git push to `main` to rebuild and deploy the entire site automatically, with a documented anchor-stability commitment for future spec evolutions,
So that the site never drifts behind spec or registry edits, and CLI diagnostic URLs remain valid across spec minor-version bumps (NFR24).

**Acceptance Criteria:**

**Given** the deployment workflow
**When** I open `.github/workflows/site.yml`
**Then** the workflow triggers on push to `main` whenever any of `site/**`, `spec/**`, or `diagnostics/registry.json` changes
**And** the workflow steps are: `actions/checkout` → setup Node 20 LTS → `pnpm install --frozen-lockfile` → `pnpm --filter site build` → deploy `site/dist/` to GitHub Pages (via `actions/deploy-pages` or equivalent)

**Given** GitHub Pages source configuration
**When** the workflow completes successfully
**Then** GitHub Pages serves `site/dist/` content from the `gh-pages` deployment artifact
**And** the canonical URL `https://caspian.dev` (custom domain CNAME-mapped to GH Pages) resolves to the deployed `index.html`
**And** `https://caspian.dev/diagnostics` resolves to the deployed `diagnostics.html`

**Given** anchor-stability documentation (NFR24 commitment)
**When** I open `site/README.md`
**Then** the file documents the policy verbatim: *"Anchor IDs (per spec concept and per diagnostic code) are preserved across spec minor versions. Renames require a redirect; the old anchor remains valid for at least two subsequent minor versions before removal."*
**And** the README cross-references this commitment to NFR24 and to the spec's BACKWARD_TRANSITIVE evolution rule

**Given** the redirect mechanism in v1.0 (forward-looking, no rename has happened yet)
**When** I check the workflow / build output
**Then** the v1.0 release does NOT need to ship any actual redirect (no anchor has been renamed yet)
**And** the redirect mechanism is documented as future work to be implemented when the first rename happens (e.g., via an `<a id="old-anchor"></a>` shim within the new anchor's section, OR via a redirect map in `site/build.mjs`)

**Given** dogfood verification for the deployment
**When** the v1.0 release is cut and the workflow runs
**Then** `https://caspian.dev/diagnostics#caspian-e001` (and every other diagnostic anchor for the 17 v1.0 codes) resolves to the correct section
**And** `https://caspian.dev/#schema-version`, `#type`, `#requires`, `#produces`, `#core-vocabulary` (and other concept anchors from Story 4.1) resolve to their respective sections

**Given** the architecture's release coordination invariant (1 git tag → 3 downstream surfaces)
**When** a tagged release fires `release.yml` (Story 2.8) and publishes the npm packages
**Then** `site.yml` is triggered (or runs in parallel) to redeploy the site
**And** the three surfaces (npm, marketplace submission, GH Pages) propagate from the same git tag with no manual coordination needed

**Given** workflow self-isolation
**When** I inspect `.github/workflows/site.yml`
**Then** the workflow uses GitHub-provided actions only (`actions/checkout`, `actions/setup-node`, `actions/deploy-pages`) plus `pnpm` install
**And** no Claude-Code-specific or Anthropic-specific dependency is introduced (vendor-neutrality of the site build is preserved — no Caspian-specific runtime needed to deploy)

---

## Epic 5: Governance & Spec Evolution

An external contributor finds the RFC process documented in `spec/CONTRIBUTING.md`, forks the repo, copies `spec/proposals/TEMPLATE.md`, fills the four mandated sections (Motivation, Alternatives Considered, Backward-Compatibility Plan, Migration Path), opens a numbered proposal PR, receives a BDFL acknowledgment within the documented response SLA, and on merge sees their RFC tracked in `spec/CHANGELOG.md` with the appropriate semver bump and credit in `CONTRIBUTORS.md`. The BACKWARD_TRANSITIVE guarantee is enforced at review time. A documented conflict-resolution procedure applies even under solo-BDFL governance.

### Story 5.1: Spec-level RFC governance (`spec/CONTRIBUTING.md` + `spec/proposals/TEMPLATE.md`)

As an external contributor with a non-trivial spec change idea,
I want a single discoverable document explaining the RFC process, the TEMPLATE I must fill, the BDFL response SLA, and the conflict-resolution procedure,
So that I can author a proposal confidently without guessing at conventions, and trust I won't be ignored or stalled silently (FR23, FR24, FR25).

**Acceptance Criteria:**

**Given** the spec-level governance files
**When** I list `spec/`
**Then** `CONTRIBUTING.md` is present alongside `proposals/TEMPLATE.md` (in addition to files from Stories 1.2, 1.3, and 5.2)

**Given** FR23 (RFC process via `spec/proposals/NNNN-slug.md`)
**When** I open `spec/CONTRIBUTING.md`
**Then** the file documents the file-naming convention: `NNNN-<slug>.md` with zero-padded 4-digit number and kebab-case slug
**And** documents the numbering policy: sequential, never reused even on rejection; the contributor proposes `NNNN` based on the next available number visible in `spec/proposals/`
**And** documents placement: all proposals live in `spec/proposals/`

**Given** FR23 (what triggers the RFC process)
**When** I read the "When is an RFC required" section
**Then** it enumerates the triggers: new field, enum extension, status-transition semantics, breaking schema change (per PRD Journey 5)
**And** it documents the opt-out for trivial changes: typo fixes, prose clarifications, vocabulary doc updates that don't change semantics — these go via regular PR

**Given** FR24 (TEMPLATE four mandated sections)
**When** I open `spec/proposals/TEMPLATE.md`
**Then** the template has exactly four top-level sections in order: **Motivation**, **Alternatives Considered**, **Backward-Compatibility Plan**, **Migration Path**
**And** each section has a one-sentence prompt explaining what the contributor must write (e.g., for Motivation: *"What concrete use case does this RFC solve? Cite at least one real artifact, plugin, or scenario where the change is needed."*)
**And** the *Alternatives Considered* prompt explicitly asks whether a vendor-namespaced (`x-*` or `<vendor>:<name>`) extension would suffice instead of a `core:*` change

**Given** FR25 (BDFL response SLA)
**When** I read `spec/CONTRIBUTING.md`
**Then** the SLA is stated with concrete numbers, not "best effort" (e.g., *"BDFL acknowledges RFCs within 7 days; substantive review within 14 days"*)
**And** the SLA explicitly applies even under solo-BDFL governance

**Given** FR25 (conflict-resolution procedure)
**When** I read `spec/CONTRIBUTING.md`
**Then** the procedure documents what happens if the BDFL stalls (e.g., *"if no acknowledgment within the SLA window, the contributor may escalate via a GitHub Discussions thread tagged `rfc-stalled`"*)
**And** documents what happens on persistent disagreement (e.g., *"if disagreement persists after substantive review, the BDFL provides a written rationale and the RFC is closed; the contributor may republish a revised RFC after 30 days"*)

**Given** the BACKWARD_TRANSITIVE enforcement at review time (FR27 process-side)
**When** I read `spec/CONTRIBUTING.md`
**Then** the document explicitly states: reviewers (including the BDFL) refuse breaking changes within a major version; additive-only between minors; the *Backward-Compatibility Plan* section of TEMPLATE is the contributor's burden of proof

**Given** the link to upstream Caspian governance
**When** I read `spec/CONTRIBUTING.md`
**Then** it cross-references the published sunset protocol (per PRD: *"if `agentskills.io` ships equivalent fields, Caspian commits to aliasing and deprecating its own within two minor releases"*) so contributors understand the proactive-upstreaming bias

---

### Story 5.2: Initial foundational proposal + `spec/CHANGELOG.md`

As an external contributor wanting a canonical example of a well-formed RFC,
I want `spec/proposals/0001-initial-spec.md` to capture the v1.0 freeze as the foundational proposal, and `spec/CHANGELOG.md` to track all spec evolutions with semver entries,
So that I can read 0001 as a worked-out example before authoring my own RFC, and verify that the BACKWARD_TRANSITIVE evolution discipline is applied to every entry (FR26, FR27 process-side).

**Acceptance Criteria:**

**Given** the file layout
**When** I list `spec/proposals/`
**Then** `0001-initial-spec.md` exists alongside `TEMPLATE.md`

**Given** the foundational proposal follows the TEMPLATE
**When** I open `spec/proposals/0001-initial-spec.md`
**Then** all four mandated sections are present and substantive: **Motivation** (the gap Caspian addresses + composition-contract argument from PRD Innovation Areas), **Alternatives Considered** (free-form frontmatter, vendor-specific `x-*` only, fork of `agentskills.io` — and why none fit), **Backward-Compatibility Plan** (foundational release; no prior spec version exists), **Migration Path** (none — initial release)

**Given** proposal status metadata
**When** I open the file's frontmatter
**Then** it declares the proposal's status as accepted (or `merged` / `final` per the convention chosen in Story 5.1)
**And** references the v1.0 release tag and date

**Given** `spec/CHANGELOG.md` exists
**When** I open it
**Then** a governance header at the top states: *"This file tracks normative changes to the Caspian Core spec. Each entry corresponds to a merged RFC or BACKWARD_TRANSITIVE-compliant additive change. Semver bumps require an associated RFC; trivial documentation fixes do not."*
**And** the header documents the semver discipline: minor bumps for additive changes within a major (BACKWARD_TRANSITIVE); patch for typos or prose; major for breaking — and that v0.x is pre-stable

**Given** the v1.0 entry
**When** I read `spec/CHANGELOG.md`
**Then** the first entry documents: version `0.1`, the release date, a summary listing the normative content (4-field contract `schema_version` / `type` / `requires` / `produces`; 11-type `core:*` vocabulary; envelope JSON Schema; 17-code diagnostic registry), and a link to `proposals/0001-initial-spec.md`

**Given** the entry-format convention
**When** I review the v1.0 entry
**Then** the format is reusable for future entries: each entry includes the version, date, additive vs breaking note, summary, and a link to the relevant RFC under `proposals/`
**And** the format is documented in `spec/CONTRIBUTING.md` (Story 5.1) so future contributors emit consistent entries

**Given** semver decoupling between spec / CLI / diagnostic registry
**When** I cross-check this CHANGELOG against `diagnostics/CHANGELOG.md` (Story 1.5) and the CLI's `packages/cli/CHANGELOG.md` (Story 2.8)
**Then** each artifact has its own independent semver lifecycle
**And** the spec's `CHANGELOG.md` only tracks normative-spec changes, not CLI bugfixes or registry append-only additions

---

### Story 5.3: Repo-level governance bundle + auto-CONTRIBUTORS

As a new contributor arriving on the repo,
I want standard openness signals (CODE_OF_CONDUCT, SECURITY, ISSUE/PR templates, CODEOWNERS, dependabot) plus an automated CONTRIBUTORS.md that credits me when my PR merges,
So that I trust the project's basic governance hygiene and don't have to ask for credit attribution after every contribution (FR26 contributor side, plus standard governance ops not directly tied to a specific FR).

**Acceptance Criteria:**

**Given** Contributor Covenant adoption
**When** I list the repo root
**Then** `CODE_OF_CONDUCT.md` is present
**And** the file is the **Contributor Covenant 2.1 text verbatim** (no local edits — local modifications would invalidate the "Covenant 2.1" claim)

**Given** responsible disclosure policy
**When** I open `SECURITY.md`
**Then** the file documents: the private reporting channel (a GitHub security advisory and a fallback email), the acknowledgment SLA (e.g., 72 hours), the disclosure timeline policy (e.g., 90 days coordinated disclosure)
**And** the file links to `.github/SECURITY-OPS.md` for the operational ops backing it

**Given** defensive name registration plan
**When** I open `.github/SECURITY-OPS.md`
**Then** the file documents: which package names are reserved on which registries (`caspian` and `casper` and `casper-core` reserved on npm + PyPI + crates.io + GitHub orgs/repos), the rationale (squat prevention + tokenization-drift prevention against future implementations), and a renewal/maintenance schedule
**And** this consolidates the architecture's earlier `notes/defensive-ops.md` placeholder per the maintainer-facing audience

**Given** code ownership
**When** I open `.github/CODEOWNERS`
**Then** the file declares the solo BDFL owns all paths initially (`* @<bdfl-username>`)
**And** the file structure supports expansion as contributors join (per-directory overrides commented as templates)

**Given** issue templates
**When** I list `.github/ISSUE_TEMPLATE/`
**Then** `bug_report.md` and `feature_request.md` are present
**And** `bug_report.md` requires: environment (Node version, OS), reproducible steps, expected behavior, actual behavior, optionally a minimal failing fixture
**And** `feature_request.md` for non-trivial spec changes redirects the contributor to `spec/CONTRIBUTING.md` RFC process; for tooling-only feature requests, it stays on the issue tracker

**Given** PR template
**When** I open `.github/PULL_REQUEST_TEMPLATE.md`
**Then** the template requires a summary section
**And** a checklist that confirms: `pnpm lint && pnpm test && pnpm depcruise && pnpm verify-codes-hash && pnpm ajv-validate-registry` passed locally; a changeset is added if the change is user-visible; commit messages follow Conventional Commits

**Given** dependabot configuration
**When** I open `.github/dependabot.yml`
**Then** weekly version bumps are configured for `npm` (covering `packages/core` and `packages/cli`) and `github-actions`
**And** the configuration enables auto-PRs (BDFL approves manually per architecture step-04 G3)

**Given** auto-CONTRIBUTORS via changesets (FR26)
**When** I open `.changeset/config.json`
**Then** a contributor-tracking convention is configured (e.g., `@changesets/changelog-github` plugin OR a custom CI step) such that contributors of merged changesets are automatically appended to `CONTRIBUTORS.md` with their GitHub handle
**And** the changeset workflow (`release.yml` from Story 2.8) invokes the contributor-update step on every release PR composition

**Given** the initial CONTRIBUTORS.md state
**When** I list the repo root
**Then** `CONTRIBUTORS.md` is present
**And** the file's header documents: *"This file is auto-maintained by changesets. Manual edits are discouraged; contributions are credited automatically on merge."*
**And** the initial content lists only the BDFL (the file expands as external contributors merge their first changeset)

**Given** governance discoverability via the root README hub
**When** I read the root `README.md` (Story 1.1)
**Then** the "Governance" section links to `spec/CONTRIBUTING.md` (RFC process), `CODE_OF_CONDUCT.md`, `SECURITY.md`, and explicitly states the project is BDFL-governed with documented response SLA + conflict-resolution procedure

