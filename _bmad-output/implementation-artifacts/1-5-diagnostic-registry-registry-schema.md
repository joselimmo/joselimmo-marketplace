# Story 1.5: Diagnostic registry + registry schema

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a plugin author (or future implementer of an alternative validator),
I want a canonical, schema-validated diagnostic registry with stable codes,
So that I rely on the same `CASPIAN-EXXX` / `CASPIAN-WXXX` codes regardless of which validator emits them, and tooling that validates the registry itself catches malformed edits.

## Working Directory

All paths in this story resolve **inside `caspian/`** — the sub-monorepo that hosts the Caspian project under the surrounding `joselimmo-marketplace-bmad` repository. Any reference like `diagnostics/registry.json` resolves to `caspian/diagnostics/registry.json`; `schemas/v1/diagnostic-registry.schema.json` resolves to `caspian/schemas/v1/diagnostic-registry.schema.json`. Never create files outside `caspian/diagnostics/` or `caspian/schemas/v1/` for this story (with the single exception of the sprint-status update under `_bmad-output/implementation-artifacts/`).

`caspian/diagnostics/` does **not yet exist** in the repository — Story 1.5 creates the directory tree for the first time. `caspian/schemas/v1/` was created by Story 1.4 and currently holds `envelope.schema.json`; this story adds a sibling `diagnostic-registry.schema.json` to the same `v1/` subdirectory.

## Acceptance Criteria

**AC1.** `caspian/diagnostics/registry.json` exists, is valid UTF-8 with LF line endings and no BOM, and parses as well-formed JSON (epics line 583–584).

**AC2.** The registry declares **all 17 v1.0 codes** in append-only order: errors `CASPIAN-E001` through `CASPIAN-E014` (14 entries) followed by warnings `CASPIAN-W001`, `CASPIAN-W002`, `CASPIAN-W003` (3 entries). No additional codes (no `CASPIAN-W004`; no `CASPIAN-E015+`). The total entry count is exactly **17**. (Epics line 585–586; architecture lines 259–279.)

**AC3.** Each registry entry has the five required fields: `code`, `severity` (enum `error | warning`), `rule` (short rule name), `message` (canonical text), `doc` (URL to `https://caspian.dev/diagnostics#caspian-eXXX` or `#caspian-wXXX`). No additional fields per entry. (Epics line 587.)

**AC4.** The 17 codes match the architecture's stage 1–6 pipeline mapping exactly (epics lines 589–593; architecture lines 259–279, 282–289):

  - **Stages 1–3** (encoding / frontmatter extraction / YAML parse):
    - `E001` — BOM byte sequence (`EF BB BF`) detected
    - `E002` — non-UTF-8 encoding
    - `E003` — tab character in frontmatter indentation
    - `E004` — frontmatter exceeds 4 KB hard cap
    - `E005` — missing or malformed `---` delimiters
    - `E006` — YAML parse error
    - `E007` — unquoted YAML 1.1 boolean coercion (`on`/`off`/`yes`/`no`/`y`/`n`)
  - **Stage 4** (envelope shape — maps to `caspian/schemas/v1/envelope.schema.json` keywords):
    - `E008` — `type` field missing or empty
    - `E009` — `type` field not in `<namespace>:<name>` form
    - `E010` — `requires` is not an array
    - `E011` — `requires` entry missing `type`
    - `E012` — `requires` entry has invalid shape
    - `E013` — `produces` is not an object
    - `E014` — `produces` missing `type`
  - **Stages 5–6** (warnings — namespace check + allow-list scan):
    - `W001` — unrecognized frontmatter field outside the agentskills.io / Claude Code overlay / `x-*` / vendor namespace allow-list
    - `W002` — `type` uses a namespace outside the canonical `core:*` registry
    - `W003` — `schema_version` value not recognized by this validator

**AC5.** `caspian/schemas/v1/diagnostic-registry.schema.json` exists, is valid UTF-8 with LF line endings and no BOM, and parses as well-formed JSON. The schema's **first key** is `"$schema": "https://json-schema.org/draft/2020-12/schema"` — verify with `jq -r 'keys_unsorted[0]' caspian/schemas/v1/diagnostic-registry.schema.json` returns `$schema`. (Architecture lines 372, 586; epics line 596–597; same first-key convention as Story 1.4.)

**AC6.** The schema declares `"$id": "https://caspian.dev/schemas/v1/diagnostic-registry.schema.json"` exactly. The URI is canonical and stable for future JSON Schema Store submission and across spec minor versions; the URI is **not required to resolve** at v1.0 (the `caspian.dev` site lands in Epic 4). (Architecture lines 215, 373; same `$id` convention as Story 1.4.)

**AC7.** The schema's `"title"` is the literal string `"CaspianDiagnosticRegistry"`. The `$defs` sub-schema for individual entries is titled `"DiagnosticEntry"`. (Architecture line 374 — PascalCase; same convention as `CaspianEnvelope` / `RequiresEntry` / `Produces` from Story 1.4.)

**AC8.** Each registry entry's `code` field validates against `pattern: "^CASPIAN-(E|W)\\d{3}$"` (epics line 598). The pattern matches exactly the format `CASPIAN-` + (`E` or `W`) + 3 zero-padded digits. JSON-string escaping doubles the backslash: in the JSON file the pattern reads as the string `^CASPIAN-(E|W)\d{3}$`.

**AC9.** Each registry entry's `doc` field validates against `pattern: "^https://caspian\\.dev/diagnostics#caspian-(e|w)\\d{3}$"` (epics line 599). The pattern enforces (a) lowercase `caspian-` followed by lowercase `e` or `w` and 3 digits in the URL fragment; (b) literal `caspian.dev` (escaped period in the regex); (c) `https://` prefix. JSON-string escaping renders as `^https://caspian\.dev/diagnostics#caspian-(e|w)\d{3}$`.

**AC10.** The schema's required entry fields are exactly `["code", "severity", "rule", "message", "doc"]` (epics line 600). The `severity` property is `enum: ["error", "warning"]` — the enum is closed; no `info` or `hint` (architecture line 254 — *"exactly two: error / warning. No info or hint in v1.0"*).

**AC11.** Every entry's `message` field follows the message-style conventions (epics lines 602–606; architecture line 478 *Pattern Examples — Good*):

  - **Declarative voice, no user-blame.** *"BOM byte sequence (\`EF BB BF\`) detected at file start"* — describes what was observed, not what the author did wrong. NOT *"You have a BOM"* (user-blame), NOT *"Your file should not contain a BOM"* (instructional).
  - **No trailing period.** Messages do not end with `.` — terminating punctuation is reserved for sentences in prose, not diagnostic identifiers.
  - **Field names, byte sequences, and value names wrapped in backticks.** Examples: `` `type` `` (field name), `` `EF BB BF` `` (byte sequence), `` `core:*` `` (namespace pattern). Backticks render as code-style emphasis in human-mode diagnostic output.

**AC12.** `caspian/diagnostics/CHANGELOG.md` exists and carries a governance header that states (epics lines 608–610):

  - The registry is **append-only**: a retired code is never reused; a new diagnostic for an existing rule receives a new code; semantic changes to a code's meaning require a new code (architecture line 258 — *"C4. Registry versioning"*).
  - The registry's semver is **decoupled** from the spec's semver: the diagnostic registry has its own version timeline, distinct from `caspian/spec/CHANGELOG.md` (Story 5.2's deliverable) and from `packages/cli/CHANGELOG.md` (Story 2.8's deliverable). Architecture line 591 — *"registry semver (governance header: 'tracks diagnostic codes; semver decoupled from spec')"*.

**AC13.** `caspian/diagnostics/LICENSE` exists and declares Apache-2.0 explicitly (epics line 611). The file uses **plain text** (no `.md` extension) and contains the **full Apache License 2.0 text** — not a one-line declaration. The simplest faithful implementation is to copy `caspian/LICENSE` byte-for-byte to `caspian/diagnostics/LICENSE`. This follows the CNCF/Kubernetes pattern called out by architecture line 749 ("isolated consumers see the license unambiguously") and matches Story 1.4's `caspian/schemas/LICENSE` precedent.

**AC14.** The registry-schema directory is **path-versioned** under `caspian/schemas/v1/` (NFR22; epics line 596). The new schema lives **alongside** Story 1.4's `envelope.schema.json` at `caspian/schemas/v1/diagnostic-registry.schema.json`, not in a separate top-level directory and not directly under `caspian/schemas/`.

**AC15.** `pnpm -C caspian lint` exits `0` after this story (smoke gate; same standard as Stories 1.1, 1.2, 1.3, 1.4). Biome 2.4 lints `**/*.json` per `caspian/biome.json` line 11; the new `diagnostic-registry.schema.json` and `registry.json` files MUST pass formatter + linter without warnings. `pnpm -C caspian test` continues to exit `0` with the *No projects matched the filters* output (empty-workspace pattern; no source code or tests added).

**AC16.** Manual cross-checks recorded in the Dev Agent Record's *Debug Log References* section (parallel to Story 1.4's AC16 walkthrough):

  - **Cross-check #1 — registry validates against its own schema.** Trace each of the 17 entries through `caspian/schemas/v1/diagnostic-registry.schema.json` keywords (root `required`, entry `additionalProperties: false`, entry `required`, `code` `pattern`, `severity` `enum`, `doc` `pattern`) and confirm every entry passes. v1.0 ships no validator runtime in this story (ajv lands in Epic 2 Story 2.1); the cross-check is manual.
  - **Cross-check #2 — code-to-pipeline mapping.** Audit each of the 17 entries against the architecture's stage 1–6 mapping (architecture lines 259–279, 282–289 + AC4 above) and confirm: each error code corresponds to a pipeline stage; the rule short name accurately captures the failure mode; the message text describes the failure declaratively without user-blame.
  - **Cross-check #3 — message style audit.** For each of the 17 messages, verify (a) no trailing period, (b) field/byte/value names backticked, (c) declarative voice (no "you", "your", or instructional phrasing), (d) accurate factual content matching the architecture's rule description.
  - **Cross-check #4 — pattern spot-checks.** Verify that the `code` regex `^CASPIAN-(E|W)\d{3}$` accepts `CASPIAN-E001`/`CASPIAN-E014`/`CASPIAN-W003` and rejects `CASPIAN-X001` / `CASPIAN-E1` / `caspian-e001` / `CASPIAN-E001 ` (trailing space) / `CASPIAN-E001\n`. Verify the `doc` regex accepts the canonical 17 URLs and rejects `http://...` (missing `s`), `https://caspian.dev/diagnostics#E001` (uppercase), `https://caspian.dev/Diagnostics#caspian-e001` (capital D).

## Tasks / Subtasks

- [x] **Task 1 — Create `caspian/diagnostics/` directory + LICENSE** (AC: #13)
  - [x] Create the directory `caspian/diagnostics/` (does not exist yet — `ls caspian/` before this story shows no `diagnostics/` entry).
  - [x] Copy the full Apache 2.0 license text from `caspian/LICENSE` to `caspian/diagnostics/LICENSE` (no `.md` extension, plain text, exact byte-for-byte copy). Verify with `diff caspian/LICENSE caspian/diagnostics/LICENSE` — output MUST be empty (no differences).
  - [x] Do NOT create any `README.md` inside `caspian/diagnostics/` — the architecture's project tree (lines 588–591) lists only `LICENSE`, `registry.json`, and `CHANGELOG.md` under `diagnostics/`; no human-facing index is mandated.
  - [x] Do NOT create `caspian/diagnostics/registry.schema.json` or any other file under `caspian/diagnostics/` beyond the three deliverables (LICENSE + registry.json + CHANGELOG.md). The validating schema lives at `caspian/schemas/v1/diagnostic-registry.schema.json`, NOT inside `caspian/diagnostics/`.

- [x] **Task 2 — Author `caspian/diagnostics/CHANGELOG.md`** (AC: #12)
  - [x] Write the file as a small markdown document with a heading, governance header, and an empty-but-shaped first version section (template provided in *Reference CHANGELOG Model* below).
  - [x] The governance header MUST state **append-only** semantics for codes (a retired code is never reused; new codes are added; semantic changes require a new code).
  - [x] The governance header MUST state that the registry's semver is **decoupled** from the spec's, the CLI's, and `@caspian/core`'s.
  - [x] Use ATX headers (`# Heading`), one blank line between sections, no trailing whitespace, LF line endings (matches `caspian/.editorconfig` from Story 1.1; consistent with all other markdown in the repo).
  - [x] **Do NOT** populate the changelog with semver release entries (e.g., `## 0.1.0 — 2026-04-27`) — the registry is at v0 / unreleased state until v1.0 ships. Use a placeholder section like `## Unreleased` listing the initial 17-code authoring as a single bullet, OR an explicit `## 0.1.0 — Initial release` section if the dev decides v0.1.0 is the first registry version. EITHER choice is acceptable; record the choice in Completion Notes.

- [x] **Task 3 — Author `caspian/schemas/v1/diagnostic-registry.schema.json`** (AC: #5–#10, #14)
  - [x] Use the **Reference Registry-Schema Model** in *Dev Notes* below as the authoritative starting point. The model satisfies AC5–AC10 + AC14. Deviations require a recorded justification in Dev Agent Record / Completion Notes.
  - [x] Ensure the **first key** is `$schema` (AC5). Verify after authoring with `jq -r 'keys_unsorted[0]' caspian/schemas/v1/diagnostic-registry.schema.json` returns `$schema`.
  - [x] Ensure `$id` is exactly `https://caspian.dev/schemas/v1/diagnostic-registry.schema.json` (AC6) — no trailing slash, no fragment, no query string.
  - [x] Set `title: "CaspianDiagnosticRegistry"` (root) and `title: "DiagnosticEntry"` ($defs sub-schema) per AC7 — PascalCase per architecture line 374.
  - [x] Set root `additionalProperties: false` and root `required: ["diagnostics"]`. Inside `$defs.DiagnosticEntry`, set `additionalProperties: false` and `required: ["code", "severity", "rule", "message", "doc"]` (AC10). Both layers are strict because the registry is internal infrastructure, not user-authored content (unlike the envelope schema's `additionalProperties: true` at root, which exists to admit overlay fields — see Story 1.4 AC5 + architecture A5).
  - [x] Apply `pattern: "^CASPIAN-(E|W)\\d{3}$"` to the `code` property (AC8). In JSON-string form the pattern reads `^CASPIAN-(E|W)\d{3}$` — single backslash; the JSON parser handles the `\\` → `\` unescape.
  - [x] Apply `pattern: "^https://caspian\\.dev/diagnostics#caspian-(e|w)\\d{3}$"` to the `doc` property (AC9). In JSON-string form the pattern reads `^https://caspian\.dev/diagnostics#caspian-(e|w)\d{3}$`.
  - [x] Apply `enum: ["error", "warning"]` to the `severity` property (AC10). The enum is closed; no `info` or `hint` (architecture line 254).
  - [x] Provide `description` text on the root, on `properties.diagnostics`, on `$defs.DiagnosticEntry`, and on each of `code`/`severity`/`rule`/`message`/`doc`. Voice is descriptive (capital + period; matches Story 1.4 AC11 + architecture line 375).
  - [x] Provide `examples` blocks at the root (sample minimal registry with one entry) AND on `$defs.DiagnosticEntry` (one canonical entry). Architecture line 378 — *"`examples` is recommended on every schema"*.
  - [x] Apply 2-space indentation, LF line endings, UTF-8 no BOM (matches `caspian/biome.json` formatter from Story 1.1; same conventions Story 1.4 followed for `envelope.schema.json`).
  - [x] No JSON comments, no trailing commas, no JSON5 features (this is plain JSON — biome lints `*.json` per `caspian/biome.json` line 11).

- [x] **Task 4 — Author `caspian/diagnostics/registry.json`** (AC: #1–#4, #11)
  - [x] Use the **Reference Registry Model** in *Dev Notes* below as the authoritative starting point. The model is a complete 17-entry registry that satisfies AC1–AC4 + AC11. Deviations require a recorded justification.
  - [x] Use the root-object form `{"diagnostics": [...]}` (NOT a top-level array). Rationale: matches the registry-schema's required structure (root-object with `diagnostics` array) and gives top-level metadata room for future minor versions without breaking BACKWARD_TRANSITIVE.
  - [x] List the 17 entries in **append-only order**: E001, E002, E003, E004, E005, E006, E007, E008, E009, E010, E011, E012, E013, E014, W001, W002, W003 (AC2). The order encodes registry semver semantics — future codes append to the end; never reorder existing entries.
  - [x] Apply each entry's exact 5 fields (`code`, `severity`, `rule`, `message`, `doc`) per AC3. No extra fields.
  - [x] Apply the canonical messages from the *Reference Registry Model* — they are pre-audited against AC11 (declarative voice, no period, backticks).
  - [x] Apply the canonical doc URLs in the form `https://caspian.dev/diagnostics#caspian-eNNN` (or `#caspian-wNNN`) — lowercase `e`/`w`, 3-digit zero-padded NNN matching the code's numeric suffix.
  - [x] Apply 2-space indentation, LF line endings, UTF-8 no BOM (same convention as the schema file).
  - [x] No JSON comments, no trailing commas (biome enforces strict JSON).

- [x] **Task 5 — Cross-check the registry against its schema** (AC: #16)
  - [x] Record in Dev Agent Record / Debug Log: the **expected outcome** of validating `caspian/diagnostics/registry.json` against `caspian/schemas/v1/diagnostic-registry.schema.json`. v1.0 ships no validator runtime; the cross-check is manual: trace each of the 17 entries through the schema's keywords (root `required: ["diagnostics"]`, root `additionalProperties: false`, entry `required: [code, severity, rule, message, doc]`, entry `additionalProperties: false`, `code.pattern`, `severity.enum`, `doc.pattern`).
  - [x] Record the **expected ajv error keywords** for three deliberate negative cases (do NOT modify the registry — these are mental walkthroughs):
    - **Negative N1 — entry with `severity: "info"`** → MUST FAIL on `severity.enum`.
    - **Negative N2 — entry with `code: "CASPIAN-X001"`** → MUST FAIL on `code.pattern`.
    - **Negative N3 — entry with extra unknown field `since: "0.1"`** → MUST FAIL on entry `additionalProperties: false`.
  - [x] Record the **expected ajv pass** for the actual 17 entries (P-bonus: empty `diagnostics: []` would pass `additionalProperties: false` and `required: [diagnostics]` but NOT the schema-level `minItems: 1` if applied — the *Reference Registry-Schema Model* applies `minItems: 1` to enforce at least one entry. Confirm or relax in Completion Notes.).
  - [x] Record code-to-pipeline mapping for each of the 17 entries (AC4): which architecture stage emits each code, and what input pattern triggers it. This walkthrough is the artifact that prevents Story 2.3 / 2.4 (pipeline implementation) from misaligning with the registry.

- [x] **Task 6 — Smoke gate + sprint-status update** (AC: #15)
  - [x] Run `pnpm -C caspian lint` from the repository root. Expected output: Biome checks **7 files** (the 5 from Story 1.4 plus the new `caspian/schemas/v1/diagnostic-registry.schema.json` and `caspian/diagnostics/registry.json`), exit code 0. If biome reports any formatter or linter complaint on the new files, fix the files (do NOT relax `caspian/biome.json`).
  - [x] Run `pnpm -C caspian test`. Expected output: *No projects matched the filters*, exit code 0. (Empty-workspace pattern from Stories 1.1–1.4 — unchanged in Story 1.5 because no source code is added.)
  - [x] Update File List in this story file with all new and modified files, paths relative to the repository root.
  - [x] Update `_bmad-output/implementation-artifacts/sprint-status.yaml`: transition `1-5-diagnostic-registry-registry-schema` from `in-progress` to `review` (this happens in dev-story Step 9 — included here for traceability; create-story has already moved it from `backlog` to `ready-for-dev`).

## Dev Notes

### Project Context

This is a **content-only** story — four artifacts under `caspian/diagnostics/` and `caspian/schemas/v1/` (1 LICENSE + 1 CHANGELOG + 1 registry + 1 schema), zero source code, zero tests beyond the smoke gate. Story 1.4 sealed `caspian/schemas/v1/envelope.schema.json` (the machine-readable envelope contract); Story 1.5 produces (a) the **registry of diagnostic codes** that any conforming Caspian validator emits, and (b) the **meta-schema** that validates the registry's structure. Together they form the diagnostic-identity layer of the spec, complementary to the envelope schema's shape-validation layer.

The deliverables of Story 1.5 are consumed by every downstream story / epic that emits, generates, or documents diagnostics:

- **Story 1.6** (canonical fixture set) authors invalid fixtures organized one-per-code (`fixtures/invalid/E001-bom/`, `fixtures/invalid/E007-unquoted-bool/`, …). Each fixture's sibling `<variant>.expected.json` references one or more codes from this story's registry. Invalid-fixture coverage is normative: every entry in `registry.json` MUST have at least one invalid fixture under `fixtures/invalid/<code>/` per the architecture's *fixture-first discipline* (architecture line 392).
- **Epic 2 Story 2.2** (diagnostic-registry typed TS constants) generates `packages/core/src/diagnostics/codes.generated.ts` from `registry.json` via `packages/core/scripts/gen-diagnostic-codes.ts`, with a sha256 header for tampering detection. This story's `registry.json` is the single source of truth that derivative consumes.
- **Epic 2 Story 2.4** (pipeline stages 4–6) emits `E008`–`E014` (envelope shape errors), `W002` (non-`core:*` namespace), `W003` (unrecognized `schema_version`), and `W001` (allow-list scan) by reading the canonical message text from `registry.json` at runtime.
- **Epic 2 Story 2.7** (conformance suite) ships ~17 cases mirroring the 17 codes 1:1; the runner asserts that any conforming validator emits the same code for the same input.
- **Epic 4 Story 4.2** (`caspian.dev/diagnostics` page) builds `site/dist/diagnostics.html` from `registry.json` via `site/build.mjs`, with stable per-code anchors (`#caspian-e001`, …) the CLI's diagnostic doc URLs point at.

### Architecture Compliance — MUST follow

**Source: `_bmad-output/planning-artifacts/architecture.md` step-04 (Diagnostic Registry — C1..C5 lines 251–279), step-05 (JSON Schema Authoring lines 370–378), step-06 (Project Structure — `diagnostics/` subtree lines 588–591), and the Decision Priority Analysis (A1–A5).**

- **C1. Code format (architecture line 253)** — `CASPIAN-E001` / `CASPIAN-W001`, zero-padded 3 digits, no intermediate scope. Convention: `EXXX` = error, `WXXX` = warning. Story 1.5's registry MUST follow this format; the schema's `code.pattern` enforces it mechanically.

- **C2. Severity levels (architecture line 254)** — exactly two: `error` (contributes to non-zero exit), `warning` (informational; does not affect exit). No `info` or `hint` in v1.0. Story 1.5's schema MUST encode this as `severity.enum: ["error", "warning"]`.

- **C3. Registry pipeline (architecture lines 255–257)** — `diagnostics/registry.json` is the authoritative source (hand-authored). Two derivatives: (a) `packages/core/src/diagnostics/codes.generated.ts` (Story 2.2's deliverable; **NOT in scope for Story 1.5**); (b) `site/dist/diagnostics.html` (Story 4.2's deliverable; **NOT in scope for Story 1.5**). Story 1.5 ships only the source-of-truth file + the meta-schema that validates it.

- **C4. Registry versioning (architecture line 258)** — append-only. A retired code is never reused; a new diagnostic for an existing rule receives a new code; semantic changes to a code's meaning require a new code. Versioning is tracked in `diagnostics/CHANGELOG.md` (this story's deliverable). The CHANGELOG governance header MUST state these append-only semantics (AC12).

- **C5. Initial v1.0 registry (architecture lines 259–279)** — exactly 17 codes (14 errors + 3 warnings). The full canonical table is reproduced verbatim in the *Reference Registry Model* below; the dev MUST author the 17 entries in append-only order matching the architecture's table.

- **JSON Schema Authoring conventions (architecture lines 370–378)** — same conventions Story 1.4 followed for `envelope.schema.json`:
  - `"$schema": "https://json-schema.org/draft/2020-12/schema"` is **always the first key**.
  - `"$id"` is absolute and stable: `https://caspian.dev/schemas/v1/<name>.schema.json`. For this story: `https://caspian.dev/schemas/v1/diagnostic-registry.schema.json`.
  - `"title"` is **PascalCase and concise**: `"CaspianDiagnosticRegistry"` for the root, `"DiagnosticEntry"` for the entry sub-schema.
  - `"description"` is **full English, descriptive voice, capital + period**.
  - **Field names mirror the registry-JSON spelling exactly** — `code` lowercase, `severity` lowercase, `rule` lowercase, `message` lowercase, `doc` lowercase. No transformation.
  - **Required fields declared in `"required": [...]`** — at root and inside `$defs.DiagnosticEntry`.
  - **`"examples": [...]` recommended on every schema** — apply at root + on `$defs.DiagnosticEntry`.

- **Decision A4 — Schema versioning (architecture line 217)** — path-versioned (`schemas/v1/`). The new `diagnostic-registry.schema.json` lives **alongside** Story 1.4's `envelope.schema.json` under `caspian/schemas/v1/`. A future major bump introduces a parallel `caspian/schemas/v2/`; renames within a major version are forbidden by BACKWARD_TRANSITIVE (NFR22).

- **Decision A2 — `$ref` strategy (architecture line 215)** — internal `$ref` to `$defs` only. The registry-schema is self-contained: it does not `$ref` the envelope schema, and the envelope schema does not `$ref` the registry-schema. The two schemas share a directory and a versioning convention but are independent contracts.

- **License layout (architecture lines 175–181, 749, 588)** — `caspian/diagnostics/LICENSE` (no `.md` extension; plain Apache 2.0 text). Each sub-package re-declares Apache-2.0 explicitly so isolated consumers see the license unambiguously (the Kubernetes/CNCF pattern). Spec `LICENSE.md` (Story 1.2) is the CC-BY-4.0 override for prose; diagnostics is code-side, default Apache-2.0 — same as Story 1.4's `caspian/schemas/LICENSE`.

- **Cross-cutting: single source of truth (architecture step-02 + lines 729–735)** — `caspian/diagnostics/registry.json` is the **authoritative source**. Story 1.5 writes this file once; future stories' generated derivatives (Story 2.2's `codes.generated.ts`, Story 4.2's `diagnostics.html`) consume it via build scripts. Story 1.5 does NOT author any of those generators.

- **Anchor stability (architecture step-02 *Doc-URL stability*; NFR24)** — every `doc` URL in the registry is a stable URL contract. Once published (Epic 4), `https://caspian.dev/diagnostics#caspian-eXXX` MUST resolve for all v1.x. Renames require a redirect and a two-minor-version overlap. The 17 doc URLs Story 1.5 emits are the canonical anchors Stories 4.2 + 4.3 implement on the site.

### Reference Registry-Schema Model

This is the canonical model the dev agent uses to author `caspian/schemas/v1/diagnostic-registry.schema.json`. It satisfies AC5–AC10 + AC14. Use it byte-faithfully unless a deviation is justified and recorded in Dev Agent Record / Completion Notes.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://caspian.dev/schemas/v1/diagnostic-registry.schema.json",
  "title": "CaspianDiagnosticRegistry",
  "description": "Schema for the Caspian diagnostic registry (`diagnostics/registry.json`). The registry is the single source of truth for the stable `CASPIAN-EXXX` and `CASPIAN-WXXX` diagnostic codes that every conforming Caspian validator emits. The registry is append-only: a retired code is never reused, a new diagnostic for an existing rule receives a new code, and semantic changes to a code's meaning require a new code.",
  "type": "object",
  "additionalProperties": false,
  "required": ["diagnostics"],
  "properties": {
    "diagnostics": {
      "type": "array",
      "description": "The append-only list of diagnostic-code definitions, ordered by first appearance.",
      "items": { "$ref": "#/$defs/DiagnosticEntry" },
      "minItems": 1
    }
  },
  "$defs": {
    "DiagnosticEntry": {
      "title": "DiagnosticEntry",
      "description": "A single diagnostic-code definition with stable identity across spec versions.",
      "type": "object",
      "additionalProperties": false,
      "required": ["code", "severity", "rule", "message", "doc"],
      "properties": {
        "code": {
          "type": "string",
          "pattern": "^CASPIAN-(E|W)\\d{3}$",
          "description": "The stable diagnostic identifier in the form `CASPIAN-EXXX` (error) or `CASPIAN-WXXX` (warning), where `XXX` is a zero-padded three-digit number."
        },
        "severity": {
          "type": "string",
          "enum": ["error", "warning"],
          "description": "The diagnostic's severity level. Errors contribute to a non-zero exit code; warnings are informational and do not affect the exit code by default."
        },
        "rule": {
          "type": "string",
          "minLength": 1,
          "description": "A short, kebab-case rule name describing the failure mode. Used for grouping and human reference."
        },
        "message": {
          "type": "string",
          "minLength": 1,
          "description": "The canonical diagnostic message text. Declarative voice, no trailing period, with field names, byte sequences, and value names wrapped in backticks."
        },
        "doc": {
          "type": "string",
          "pattern": "^https://caspian\\.dev/diagnostics#caspian-(e|w)\\d{3}$",
          "description": "The stable documentation URL pointing at the per-code anchor on `caspian.dev/diagnostics`. The anchor uses lowercase `caspian-e` or `caspian-w` followed by the three-digit code number."
        }
      },
      "examples": [
        {
          "code": "CASPIAN-E001",
          "severity": "error",
          "rule": "bom-rejection",
          "message": "BOM byte sequence (`EF BB BF`) detected at file start",
          "doc": "https://caspian.dev/diagnostics#caspian-e001"
        }
      ]
    }
  },
  "examples": [
    {
      "diagnostics": [
        {
          "code": "CASPIAN-E001",
          "severity": "error",
          "rule": "bom-rejection",
          "message": "BOM byte sequence (`EF BB BF`) detected at file start",
          "doc": "https://caspian.dev/diagnostics#caspian-e001"
        }
      ]
    }
  ]
}
```

**Field-by-field rationale:**

- `$schema` first → AC5; canonical Draft 2020-12 meta-schema URI.
- `$id` → AC6; canonical URI for IDE auto-discovery and JSON Schema Store submission.
- `title: "CaspianDiagnosticRegistry"` (root), `title: "DiagnosticEntry"` ($defs) → AC7; PascalCase per architecture line 374.
- Root `description` → declares what the registry is and the append-only invariant that governs its evolution.
- Root `type: "object"`, `additionalProperties: false`, `required: ["diagnostics"]` → registry is internal infrastructure; strict shape locks down extension paths and forces a `schemas/v2/` bump for any new top-level field. (Contrast with the envelope schema's `additionalProperties: true` at root, which exists to admit user overlay fields per Decision A5 — Story 1.4 AC5.)
- `properties.diagnostics` is `type: array`, `items.$ref: "#/$defs/DiagnosticEntry"`, `minItems: 1` → enforces at least one entry. The 17-code v1.0 registry comfortably satisfies this; future versions can never go below one entry without bumping `schemas/v2/`.
- `$defs.DiagnosticEntry.required: ["code", "severity", "rule", "message", "doc"]` → AC10; all 5 fields required per epics line 600.
- `$defs.DiagnosticEntry.additionalProperties: false` → strict; no per-entry extension. Adding a new entry field (e.g., `since: "0.1"`) is a `schemas/v2/` change.
- `code.pattern: "^CASPIAN-(E|W)\\d{3}$"` → AC8; matches exactly the C1 format. JSON-string `\\d` decodes to regex `\d` (digit class).
- `severity.enum: ["error", "warning"]` → AC10 + C2; closed enum.
- `rule.minLength: 1` → guards against empty strings (a degenerate edge case the AC's "short rule name" wording does not explicitly forbid but should not occur).
- `message.minLength: 1` → same rationale.
- `doc.pattern: "^https://caspian\\.dev/diagnostics#caspian-(e|w)\\d{3}$"` → AC9; enforces the canonical anchor format. The lowercase `e`/`w` in the URL fragment differs from the uppercase in the `code` field — matching architecture line 386's `caspian.dev/diagnostics#caspian-eXXX` lowercase convention. The escaped period (`\\.`) prevents the regex from matching `caspian-dev` (alternative TLD-style host).
- `$defs.DiagnosticEntry.examples` and root `examples` → architecture line 378; the example registry contains one entry (E001) to demonstrate the shape without redundantly enumerating all 17 (which is the registry-JSON's job, not the schema's).

### Reference Registry Model

This is the canonical model the dev agent uses to author `caspian/diagnostics/registry.json`. It declares the 17 v1.0 codes in append-only order with pre-audited messages (AC11) and canonical doc URLs (AC9 form). Use it byte-faithfully unless a deviation is justified and recorded.

```json
{
  "diagnostics": [
    {
      "code": "CASPIAN-E001",
      "severity": "error",
      "rule": "bom-rejection",
      "message": "BOM byte sequence (`EF BB BF`) detected at file start",
      "doc": "https://caspian.dev/diagnostics#caspian-e001"
    },
    {
      "code": "CASPIAN-E002",
      "severity": "error",
      "rule": "encoding-utf8-required",
      "message": "File encoding is not UTF-8",
      "doc": "https://caspian.dev/diagnostics#caspian-e002"
    },
    {
      "code": "CASPIAN-E003",
      "severity": "error",
      "rule": "tab-indent-rejection",
      "message": "Tab character detected in frontmatter indentation",
      "doc": "https://caspian.dev/diagnostics#caspian-e003"
    },
    {
      "code": "CASPIAN-E004",
      "severity": "error",
      "rule": "frontmatter-byte-cap",
      "message": "Frontmatter exceeds the 4 KB hard cap",
      "doc": "https://caspian.dev/diagnostics#caspian-e004"
    },
    {
      "code": "CASPIAN-E005",
      "severity": "error",
      "rule": "frontmatter-delimiters-required",
      "message": "Missing or malformed frontmatter delimiters (`---`)",
      "doc": "https://caspian.dev/diagnostics#caspian-e005"
    },
    {
      "code": "CASPIAN-E006",
      "severity": "error",
      "rule": "yaml-parse-error",
      "message": "YAML parse error in frontmatter",
      "doc": "https://caspian.dev/diagnostics#caspian-e006"
    },
    {
      "code": "CASPIAN-E007",
      "severity": "error",
      "rule": "yaml-1-1-boolean-coercion",
      "message": "Unquoted YAML 1.1 boolean-like value (`on`/`off`/`yes`/`no`/`y`/`n`)",
      "doc": "https://caspian.dev/diagnostics#caspian-e007"
    },
    {
      "code": "CASPIAN-E008",
      "severity": "error",
      "rule": "type-required",
      "message": "Field `type` is missing or empty",
      "doc": "https://caspian.dev/diagnostics#caspian-e008"
    },
    {
      "code": "CASPIAN-E009",
      "severity": "error",
      "rule": "type-namespace-name-form",
      "message": "Field `type` is not in `<namespace>:<name>` form",
      "doc": "https://caspian.dev/diagnostics#caspian-e009"
    },
    {
      "code": "CASPIAN-E010",
      "severity": "error",
      "rule": "requires-must-be-array",
      "message": "Field `requires` is not an array",
      "doc": "https://caspian.dev/diagnostics#caspian-e010"
    },
    {
      "code": "CASPIAN-E011",
      "severity": "error",
      "rule": "requires-entry-type-required",
      "message": "Entry in `requires` is missing `type`",
      "doc": "https://caspian.dev/diagnostics#caspian-e011"
    },
    {
      "code": "CASPIAN-E012",
      "severity": "error",
      "rule": "requires-entry-invalid-shape",
      "message": "Entry in `requires` has an invalid shape",
      "doc": "https://caspian.dev/diagnostics#caspian-e012"
    },
    {
      "code": "CASPIAN-E013",
      "severity": "error",
      "rule": "produces-must-be-object",
      "message": "Field `produces` is not an object",
      "doc": "https://caspian.dev/diagnostics#caspian-e013"
    },
    {
      "code": "CASPIAN-E014",
      "severity": "error",
      "rule": "produces-type-required",
      "message": "Field `produces` is missing `type`",
      "doc": "https://caspian.dev/diagnostics#caspian-e014"
    },
    {
      "code": "CASPIAN-W001",
      "severity": "warning",
      "rule": "frontmatter-field-allow-list",
      "message": "Unrecognized frontmatter field outside the recognized allow-list",
      "doc": "https://caspian.dev/diagnostics#caspian-w001"
    },
    {
      "code": "CASPIAN-W002",
      "severity": "warning",
      "rule": "type-canonical-namespace",
      "message": "Field `type` uses a namespace outside the canonical `core:*` registry",
      "doc": "https://caspian.dev/diagnostics#caspian-w002"
    },
    {
      "code": "CASPIAN-W003",
      "severity": "warning",
      "rule": "schema-version-recognized",
      "message": "Field `schema_version` value is not recognized by this validator",
      "doc": "https://caspian.dev/diagnostics#caspian-w003"
    }
  ]
}
```

**Per-code rationale (cross-check #2 from AC16):**

| Code | Stage | Rule short name | Pipeline trigger |
|---|---|---|---|
| `E001` | 1 (byte-level) | `bom-rejection` | First 3 bytes of file equal `EF BB BF`. |
| `E002` | 1 (byte-level) | `encoding-utf8-required` | Non-UTF-8 byte sequence detected; encoding sniff fails strict UTF-8. |
| `E003` | 3 (post-parse scan) | `tab-indent-rejection` | Tab character (`\t`) appears in the frontmatter slice's indentation. |
| `E004` | 2 (frontmatter extraction) | `frontmatter-byte-cap` | Bytes between (exclusive of) the opening and closing `---` delimiters exceed 4096 (architecture D4 line 292). |
| `E005` | 2 (frontmatter extraction) | `frontmatter-delimiters-required` | Opening `---` missing, closing `---` missing, or delimiter line malformed (e.g., trailing characters). |
| `E006` | 3 (YAML parse) | `yaml-parse-error` | The `yaml` library rejects the frontmatter slice (strict 1.2 safe-load). |
| `E007` | 3 (post-parse scan) | `yaml-1-1-boolean-coercion` | After successful YAML parse, a string-typed value matches the case-insensitive set `{on, off, yes, no, y, n}` (the YAML 1.1 boolean keyword footgun). |
| `E008` | 4 (envelope schema) | `type-required` | `type` field absent or empty string. Maps to `envelope.schema.json` root `required: ["type"]` keyword. |
| `E009` | 4 (envelope schema) | `type-namespace-name-form` | `type` field present but does not match `^[^:]+:.+$`. Maps to `type.pattern` keyword. |
| `E010` | 4 (envelope schema) | `requires-must-be-array` | `requires` field present but not a JSON array. Maps to `requires.type: array` keyword. |
| `E011` | 4 (envelope schema) | `requires-entry-type-required` | `requires` entry is an object but missing `type`. Maps to `RequiresEntry.required: ["type"]` keyword. |
| `E012` | 4 (envelope schema) | `requires-entry-invalid-shape` | `requires` entry has extra unknown property, OR `tags` is not array-of-string, OR `count` is not a positive integer. Maps to `RequiresEntry.additionalProperties: false`, `tags.items.type: string`, or `count.minimum: 1` / `count.type: integer`. |
| `E013` | 4 (envelope schema) | `produces-must-be-object` | `produces` field present but not a JSON object. Maps to `produces.type: object` (via `Produces` $def). |
| `E014` | 4 (envelope schema) | `produces-type-required` | `produces` is an object but missing `type`. Maps to `Produces.required: ["type"]` keyword. |
| `W001` | 6 (allow-list scan) | `frontmatter-field-allow-list` | Frontmatter field not in the 22 recognized fields + `x-*` extensions + `<vendor>:<name>` namespaced fields (Caspian core 4 + agentskills.io canonical 6 + Claude Code overlay 12). |
| `W002` | 5 (namespace check) | `type-canonical-namespace` | `type` field's namespace is not `core` (e.g., `bmad:`, `maya:`, `examples:`). Warning, never error — ecosystem-extensibility contract per FR13. |
| `W003` | 5 (namespace check) | `schema-version-recognized` | `schema_version` value is not in the v1.0 recognized set `["0.1"]`. Warning, never error — graceful degradation per NFR16 / architecture A5 *Anti-Patterns* discipline. |

### Reference CHANGELOG Model

This is the canonical model for `caspian/diagnostics/CHANGELOG.md`. It satisfies AC12.

```markdown
# Caspian Diagnostic Registry — Changelog

This file tracks changes to the Caspian diagnostic-code registry
(`registry.json`). It records the addition, deprecation, and (rarely)
correction of `CASPIAN-EXXX` and `CASPIAN-WXXX` codes.

## Governance

The Caspian diagnostic registry is **append-only**. A retired code is
never reused; a new diagnostic for an existing rule receives a new
code; semantic changes to a code's meaning require a new code (the
existing code MUST be deprecated and a successor allocated). This
discipline preserves stable diagnostic identity across spec versions
and across the validator implementations that emit those codes.

The registry's semver is **decoupled** from the spec's semver, the
`caspian` CLI's semver, and the `@caspian/core` package's semver. The
registry has its own version timeline. A spec minor bump may ship with
no registry changes; a registry-only minor bump may ship between spec
releases. Cross-references between the four CHANGELOGs
(`spec/CHANGELOG.md`, `diagnostics/CHANGELOG.md`,
`packages/cli/CHANGELOG.md`, `packages/core/CHANGELOG.md`) are
maintained at release time, not enforced by tooling.

## Unreleased

- Initial registry shape established with the 17 v1.0 codes
  (`CASPIAN-E001`–`CASPIAN-E014` plus `CASPIAN-W001`–`CASPIAN-W003`).
  The registry is validated structurally by
  [`../schemas/v1/diagnostic-registry.schema.json`](../schemas/v1/diagnostic-registry.schema.json).
```

**Notes for the dev:**

- The dev MAY rename `## Unreleased` to `## 0.1.0 — 2026-04-27` (or the actual ship date) if they decide v0.1.0 is the first registry version. EITHER choice is acceptable for AC12; record the choice in Completion Notes.
- The dev MAY tighten or expand the prose slightly. The hard requirements are: append-only semantics MUST appear; semver-decoupling MUST appear. All other framing is editorial.
- Use ATX headers (`#`, `##`), one blank line between sections, line length ~70-72 characters (consistent with `caspian/spec/core.md`'s prose width), no trailing whitespace, LF line endings, UTF-8 no BOM.

### Library / Framework Requirements

**No new dependencies installed in this story.** The Caspian spec ships JSON files and a markdown changelog; consumers are downstream concerns:

- **`ajv` (~v8) imported via `ajv/dist/2020.js`** — runtime Draft 2020-12 validator. Lands in Epic 2 Story 2.1 (`packages/core/package.json` adds it as a dep). Story 2.4 uses ajv to validate user frontmatter against `envelope.schema.json` and emit codes from `registry.json`. **Not a Story 1.5 concern.**
- **CI step `pnpm ajv-validate-registry`** — architecture line 732 calls for a CI step that runs `ajv validate -s schemas/v1/diagnostic-registry.schema.json -d diagnostics/registry.json` to block merges of malformed registry edits. The repo currently has **no `.github/workflows/` directory** (verify with `ls .github/ 2>/dev/null || echo 'no .github'`). Story 1.5 does NOT add this CI step. The step is a future Epic 2 deliverable (architecture line 548 lists `ci.yml` under `.github/workflows/` as a future file). Recording this as a Forward Dependency in the Completion Notes is sufficient.
- **`scripts/gen-diagnostic-codes.ts`** — derivative-generator for `codes.generated.ts`. Story 2.2's deliverable. **Not a Story 1.5 concern.**
- **`site/build.mjs`** — derivative-generator for `diagnostics.html`. Story 4.2's deliverable. **Not a Story 1.5 concern.**

The smoke gate (`pnpm -C caspian lint && pnpm -C caspian test`) does **not** validate JSON-Schema-specific structural constraints (e.g., it does not check that `registry.json` validates against `diagnostic-registry.schema.json`). Biome formats and lints `*.json` syntax/style; it does not validate schema semantics. AC5 (`$schema` first key), AC6 (`$id` exact value), and the 17-entry append-only ordering (AC2) are verified by direct inspection (`jq -r 'keys_unsorted[0]'`, `jq -r '.["$id"]'`, `jq -r '.diagnostics | length'`, `jq -r '.diagnostics[].code'`) — record those checks in the Debug Log.

### File Structure Requirements

After this story, the repository contains:

```text
caspian/
├── diagnostics/                                    # NEW directory (Story 1.5)
│   ├── LICENSE                                     # full Apache 2.0 text — byte-for-byte copy of caspian/LICENSE
│   ├── registry.json                               # 17 v1.0 codes; root-object form { "diagnostics": [...] }
│   └── CHANGELOG.md                                # governance header + unreleased section
└── schemas/
    ├── LICENSE                                     # (Story 1.4 — unchanged)
    └── v1/
        ├── envelope.schema.json                    # (Story 1.4 — unchanged)
        └── diagnostic-registry.schema.json         # NEW — validates registry.json structure
```

**Do NOT create in this story:**

- `caspian/diagnostics/README.md` — not in the architecture's project tree (lines 588–591). The diagnostics directory is consumed mechanically; no human-facing index is required (mirror of Story 1.4's "no schemas/README.md" decision).
- `caspian/diagnostics/registry.schema.json` — the meta-schema lives at `caspian/schemas/v1/diagnostic-registry.schema.json`, NOT inside `diagnostics/`. The schemas directory is the single source of truth for JSON Schemas; the diagnostics directory holds the data being validated.
- `caspian/schemas/v1/diagnostic-registry.json` — the data file lives in `diagnostics/`, not `schemas/`. Do not split the data file across both directories.
- `packages/core/src/diagnostics/codes.generated.ts` — Story 2.2's deliverable (architecture line 640).
- `packages/core/scripts/gen-diagnostic-codes.ts` — Story 2.2's deliverable (architecture line 659).
- `packages/core/scripts/verify-codes-hash.ts` — Story 2.2's deliverable (architecture line 660).
- `site/build.mjs` or `site/dist/diagnostics.html` — Story 4.2's deliverable (architecture line 705).
- `.github/workflows/ci.yml` or any CI configuration — future Epic 2 deliverable; no `.github/workflows/` exists yet.
- Any modification to `caspian/spec/core.md`, `caspian/spec/README.md`, `caspian/spec/LICENSE.md`, `caspian/spec/vocabulary/**`, or `caspian/schemas/v1/envelope.schema.json` — Stories 1.2, 1.3, and 1.4 sealed those. The "coming soon — Story 1.5" annotation in `core.md` line 295 (`*(coming soon — Story 1.5)*`) and similar forward-references on lines 9 + 74 + 82 MAY remain in place; the relative links resolve naturally once `caspian/diagnostics/registry.json` exists.
- Any modification to root-of-monorepo files (`caspian/package.json`, `caspian/biome.json`, `caspian/pnpm-workspace.yaml`, `caspian/.biomeignore`, etc.) — the existing biome glob `**/*.json` already covers the two new JSON files. If biome flags an issue with the new JSON files, fix the JSON, NOT biome.json.
- Any new fixture under `caspian/fixtures/` — Story 1.6's deliverable.
- Anything outside `caspian/diagnostics/` and `caspian/schemas/v1/` (with the single exception of the sprint-status update under `_bmad-output/implementation-artifacts/`).

### Anti-Patterns — DO NOT do

- ❌ **Do NOT add `CASPIAN-W004`** (or any 18th code), even though `caspian/spec/core.md` line 82 contains the annotation *"proposed `CASPIAN-W004`, to be reserved by Story 1.5's registry"*. The architecture's authoritative v1.0 set is exactly 17 codes — 14 errors + 3 warnings (architecture lines 259–279, restated by epics line 585 and AC2 above). The Story 1.2 annotation was a forward-projection that the architecture subsequently superseded; Story 1.5 follows the architecture (and AC2's strict 17-entry count), not the Story 1.2 forward-projection. **The drift between `core.md` line 82 and the v1.0 registry MUST be recorded as a Deferred-Work entry** (`_bmad-output/implementation-artifacts/deferred-work.md`) so a future tidy-up story (or a v0.2+ RFC reserving W004) can resolve it.
- ❌ **Do NOT generate `packages/core/src/diagnostics/codes.generated.ts`** in this story. The TS-constants derivative is Story 2.2's deliverable. Architecture line 467 — *"the generated `codes.generated.ts` must never be edited by hand"* — applies once the file exists; until Story 2.2 ships, the file does not exist at all.
- ❌ **Do NOT add a sha256 header** anywhere in `registry.json` or `diagnostic-registry.schema.json`. The sha256 header lives inside `codes.generated.ts` (Story 2.2's deliverable, architecture line 640). The hash protects the **derivative**, not the source-of-truth.
- ❌ **Do NOT add `info`, `hint`, or any third severity** to the registry's severity enum. Architecture C2 (line 254) — *"exactly two: error / warning. No info or hint in v1.0"*. The schema's `severity.enum: ["error", "warning"]` is closed; expanding it would break BACKWARD_TRANSITIVE (existing CLI code paths assume two-severity exit-code logic).
- ❌ **Do NOT use top-level array form** for `registry.json` (i.e., `[{...}, {...}]`). Use the root-object form `{"diagnostics": [...]}`. Rationale: matches the schema's required structure (root-object with `diagnostics` array) and gives top-level metadata room for future minor versions without breaking BACKWARD_TRANSITIVE.
- ❌ **Do NOT add per-entry `since: "0.1"` / `deprecated: false` / `tags: [...]`** or any other metadata field beyond the 5 required (`code`, `severity`, `rule`, `message`, `doc`). AC3 lists exactly 5 fields per entry; the schema's `additionalProperties: false` enforces it. If versioning per entry is needed in the future, it lives in `CHANGELOG.md` (the registry's append-only history) or via a `schemas/v2/` bump.
- ❌ **Do NOT add `definitions` (Draft 04 idiom)** to the registry-schema. Use `$defs` (Draft 2020-12 idiom) — same convention Story 1.4 followed.
- ❌ **Do NOT add `format: "uri"` on `$id` or on `doc`**. The `format` keyword in Draft 2020-12 is annotation-only by default; it adds no validation but adds clutter. The `pattern` keyword on `doc` already enforces the canonical anchor format.
- ❌ **Do NOT add `$comment` JSON-Schema metadata fields**. The schema is meant to be human-readable as JSON; comments belong in commit messages and PR descriptions.
- ❌ **Do NOT add `default` values** on any property. JSON Schema's `default` keyword has unclear conformance semantics across validators.
- ❌ **Do NOT enumerate the 17 codes in the schema** (e.g., as `enum` on `code`). The schema validates structure, NOT membership; the registry-JSON is the authoritative list. Adding `enum` would (a) duplicate the 17-code list across two files and (b) break BACKWARD_TRANSITIVE for v0.2+ when codes are appended.
- ❌ **Do NOT install** `ajv`, `jsonschema`, `json-schema`, or any validator dependency in this story. v1.0 ships the schema file as content. Validators are downstream concerns (Epic 2 Story 2.1 pulls in ajv).
- ❌ **Do NOT modify** `caspian/biome.json`, `caspian/.biomeignore`, or any biome configuration to add an exception for `caspian/diagnostics/` or `caspian/schemas/v1/`. The existing config (`**/*.json` included; `**/dist`, `**/*.generated.ts`, `pnpm-lock.yaml`, `fixtures/invalid` excluded) is the right scope.
- ❌ **Do NOT touch the surrounding `joselimmo-marketplace-bmad` repo.** Specifically: do not modify root `CLAUDE.md`, do not edit `.claude-plugin/marketplace.json`, do not move planning artifacts.
- ❌ **Do NOT introduce any tooling that fetches schemas over HTTP** at validation time (NFR6 — *"no remote schema fetching"*). The `$id` URI's value is for IDE auto-discovery and JSON Schema Store submission, not runtime fetching.
- ❌ **Do NOT add a CI step** to the repository (no `.github/workflows/ci.yml` modifications). The repo has no `.github/workflows/` directory yet; introducing one is a future Epic 2 deliverable. Surface the missing `ajv-validate-registry` step as a Forward Dependency in Completion Notes.
- ❌ **Do NOT attempt to write a fixture** under `caspian/fixtures/` (e.g., one invalid fixture per code). That is Story 1.6's deliverable and would dilute Story 1.5's content-only scope.
- ❌ **Do NOT bypass git hooks** (`--no-verify`) when committing. There are none yet — habit only.

### Source Citations — Verbatim Anchors

The following claims are sourced from the PRD, architecture, epics, and `core.md` and reproduced exactly here so the dev agent does not have to re-derive them:

| Statement | Source | Wording / cross-reference |
|---|---|---|
| **17 v1.0 diagnostic codes** | `_bmad-output/planning-artifacts/epics.md` line 163 | *"17 v1.0 diagnostic codes — 14 errors (`CASPIAN-E001..E014`) + 3 warnings (`CASPIAN-W001..W003`). Each code is hand-authored in `diagnostics/registry.json` (authoritative, append-only)..."* |
| **Single envelope schema + diagnostic-registry schema** | `_bmad-output/planning-artifacts/epics.md` line 183 | *"Single envelope schema — `schemas/v1/envelope.schema.json` (Draft 2020-12, `$id: 'https://caspian.dev/schemas/v1/envelope.schema.json'`, path-versioned). Plus `schemas/v1/diagnostic-registry.schema.json` validates the structure of `diagnostics/registry.json` itself."* |
| **C1. Code format** | `_bmad-output/planning-artifacts/architecture.md` line 253 | *"`CASPIAN-E001` / `CASPIAN-W001`, zero-padded 3 digits, no intermediate scope. Convention: `EXXX` = error, `WXXX` = warning."* |
| **C2. Severity levels — exactly two** | `_bmad-output/planning-artifacts/architecture.md` line 254 | *"exactly two: `error` (contributes to non-zero exit), `warning` (informational; does not affect exit). No `info` or `hint` in v1.0."* |
| **C3. Registry pipeline** | `_bmad-output/planning-artifacts/architecture.md` lines 255–257 | *"`diagnostics/registry.json` is the authoritative source (hand-authored). Two derivatives: `packages/cli/src/diagnostics/codes.generated.ts` — typed TS constants generated by `scripts/gen-diagnostic-codes.ts`. `site/diagnostics.html` — human-readable reference page with per-code anchors..."* |
| **C4. Registry versioning — append-only** | `_bmad-output/planning-artifacts/architecture.md` line 258 | *"append-only. A retired code is never reused; a new diagnostic for an existing rule receives a new code; semantic changes to a code's meaning require a new code. Versioning tracked in `diagnostics/CHANGELOG.md`."* |
| **C5. Initial v1.0 registry — 17 codes table** | `_bmad-output/planning-artifacts/architecture.md` lines 259–279 | The full 17-row table reproduced in *Reference Registry Model* above. |
| **Diagnostic registry boundary — schema-validated** | `_bmad-output/planning-artifacts/architecture.md` lines 729–735 | *"Authoritative source: `diagnostics/registry.json` (hand-authored, append-only). Schema validator: `schemas/v1/diagnostic-registry.schema.json` defines the registry's required structure (codes, severity enum, message/doc fields). CI step `ajv validate -s schemas/v1/diagnostic-registry.schema.json -d diagnostics/registry.json` blocks merges of malformed registry edits."* |
| **Versioned diagnostic registry as cross-cutting concern** | `_bmad-output/planning-artifacts/prd.md` line 79 | *"A separate release artifact (`spec/diagnostics/registry.json` + `caspian.dev/diagnostics`) defines a stable diagnostic code per validation rule (`CASPIAN-E001`, `CASPIAN-W042`, …) with stable identity across spec versions."* (Note: PRD's `spec/diagnostics/` location is superseded by the architecture's `diagnostics/` at the project root.) |
| **Doc-URL stability — caspian.dev** | `_bmad-output/planning-artifacts/prd.md` line 426 | *"Canonical doc URL is `caspian.dev`, not the GitHub repo. The CLI's diagnostics emit `caspian.dev` doc links, giving a stable URL surface that survives repo restructuring."* |
| **Anchor stability per spec concept** | `_bmad-output/planning-artifacts/prd.md` line 398 | *"Stable anchor IDs per spec concept (`#schema-version`, `#type`, `#requires`, `#produces`, `#core-vocabulary`) so the CLI can emit durable doc links in diagnostics."* |
| **JSON Schema authoring conventions** | `_bmad-output/planning-artifacts/architecture.md` lines 370–378 | `$schema` first key; `$id` absolute and stable; `title` PascalCase; `description` full English descriptive voice with capital + period; field names mirror frontmatter spelling exactly; `required` array (not `additionalProperties` workaround); `examples` recommended. |
| **Decision A4 — path-versioned schemas** | `_bmad-output/planning-artifacts/architecture.md` line 217 | *"Path-versioned (`schemas/v1/`)."* |
| **License layout — diagnostics/ Apache-2.0 with full LICENSE re-declaration** | `_bmad-output/planning-artifacts/architecture.md` lines 175–181, 749, 588–589 | *"Each sub-package (`packages/core`, `packages/cli`, `plugins/casper-core`, `schemas`, `diagnostics`, `fixtures`) re-declares its Apache-2.0 LICENSE explicitly so isolated consumers see the license unambiguously."* |
| **No remote schema fetching at runtime (NFR6)** | `_bmad-output/planning-artifacts/architecture.md` line 160 | *"Schemas bundled into `packages/cli/dist/schemas/` at build via `scripts/copy-schemas.ts` to satisfy NFR6 (no remote schema fetching)."* |
| **Pattern Examples — Good diagnostic message** | `_bmad-output/planning-artifacts/architecture.md` lines 472–481 | ``"BOM byte sequence (`EF BB BF`) detected at file start"`` (declarative, backticks around byte sequence, no period). The Story 1.5 messages follow this exemplar verbatim for E001 and stylistically for the other 16. |
| **Anti-pattern — diagnostic message** | `_bmad-output/planning-artifacts/architecture.md` lines 484–491 | *"Your file has a BOM. Remove it please."* (user-blame, period, missing backticks, missing CASPIAN- prefix on code). The Story 1.5 messages avoid all four anti-pattern markers. |
| **`core.md` annotation re. `CASPIAN-W004`** | `caspian/spec/core.md` lines 80–84 | *"A `type` value under `core:` whose name is not in the canonical vocabulary triggers a warning diagnostic (proposed `CASPIAN-W004`, to be reserved by Story 1.5's registry) — warning rather than error so future minor versions can extend the canonical vocabulary without breaking older conforming artifacts."* — **Story 1.5 does NOT reserve W004** (architecture's authoritative 17-code v1.0 set has only W001–W003); the `core.md` forward-projection is recorded as a Deferred-Work entry. |

### Previous Story Intelligence (from Stories 1.1, 1.2, 1.3, 1.4)

**Working-directory convention (from 1.1, restated 1.2 + 1.3 + 1.4).** `caspian/` is the working subdirectory. Every reference in epics / architecture to `spec/`, `schemas/`, `diagnostics/`, etc., resolves to `caspian/spec/`, `caspian/schemas/`, `caspian/diagnostics/`, etc. Story 1.5 operates entirely inside `caspian/diagnostics/` (new) and `caspian/schemas/v1/` (created in Story 1.4).

**Sealed predecessor files (from 1.2, 1.3, 1.4).** Story 1.5 does NOT modify `caspian/spec/core.md`, `caspian/spec/README.md`, `caspian/spec/LICENSE.md`, any file under `caspian/spec/vocabulary/`, or `caspian/schemas/v1/envelope.schema.json`. The "coming soon — Story 1.5" annotations in `core.md` lines 9, 74, 82, 295 MAY remain in place. A future tidy-up story may remove them; that is out of scope for Story 1.5. The specific tension on `core.md` line 82 (`CASPIAN-W004` proposed but not reserved) is recorded as a Deferred-Work entry rather than fixed in `core.md` (the file is sealed).

**License-file naming convention (from 1.1, 1.4).** For code-side / data-side subtrees that consume the Apache-2.0 default, the convention is plain `LICENSE` (no extension, full Apache 2.0 text). Story 1.4's `caspian/schemas/LICENSE` followed this; Story 1.5's `caspian/diagnostics/LICENSE` follows the same. Spec subtrees use `LICENSE.md` (`.md` suffix) for the CC-BY-4.0 prose override (Story 1.2's `caspian/spec/LICENSE.md`). The `diagnostics/` subtree is data-side, so plain `LICENSE`.

**No commits by the dev agent (from 1.1, 1.2, 1.3, 1.4).** Per project policy, the dev agent prepares and stages but does NOT commit. Story 1.5 follows the same pattern: prepare the 4 new files (1 LICENSE + 1 CHANGELOG + 1 registry + 1 schema), update this story file's Tasks/Subtasks + Dev Agent Record + File List, run the smoke gate, output the recommended commit command, **stop**.

**Conventional Commits prefix (from 1.2, 1.3, 1.4).** `docs(spec):` for prose/data under `caspian/spec/`, `caspian/schemas/`, `caspian/diagnostics/`. For Story 1.5, the deliverables are JSON content + a markdown changelog under `caspian/diagnostics/` and `caspian/schemas/v1/`. Architecturally `diagnostics/` is part of the spec contract (single source of truth for diagnostic codes — architecture line 758). The most consistent prefix with the project's recent history is `docs(spec): add diagnostic registry + registry schema (Story 1.5)`. An alternative `feat(spec):` is defensible for first-time emission of the registry; the dev agent picks one and records the choice in Completion Notes.

**Smoke-gate output expectations (from 1.1, 1.2, 1.3, 1.4).** Story 1.4 ran biome over **5 files** (the 4 baseline JSON files Story 1.1 introduced + Story 1.4's `envelope.schema.json`). Story 1.5 adds **2 JSON files** to biome's scope (`diagnostic-registry.schema.json` and `registry.json`), so the new expected count is **7 files checked**. The CHANGELOG.md is markdown and is NOT linted by biome (biome's includes do not list `**/*.md`; see `caspian/biome.json` line 4–17). The LICENSE has no extension and is NOT linted. `pnpm -C caspian test` continues to report *No projects matched the filters* and exit 0 (no source code or tests added; Stories 1.1–1.5 are all empty-workspace stories so far).

**Forward-reference annotation discipline (from 1.2, 1.3, 1.4).** Story 1.5 introduces **no new forward references inside any of the four authored files** (the schema `description` text is self-contained, the registry messages reference field names but not future docs, the CHANGELOG points only at `../schemas/v1/diagnostic-registry.schema.json` which exists in the same story). The `doc` URLs `https://caspian.dev/diagnostics#caspian-eXXX` are **planning-stable URIs that do not yet resolve** (Epic 4 Story 4.2 deploys `caspian.dev/diagnostics`); this is documented in *Architecture Compliance — MUST follow* above and does NOT require *"coming soon — Epic 4"* annotations inside the registry-JSON or registry-schema (the URL is canonical, not currently fetchable, by convention).

**Sprint-status update pattern (from 1.1, 1.2, 1.3, 1.4).** Sprint status transitions are: `backlog → ready-for-dev` (create-story) → `in-progress` (dev-story Step 4) → `review` (dev-story Step 9) → `done` (after code review). Story 1.5 is currently `backlog`; this create-story workflow transitions it to `ready-for-dev`.

**Deferred-work tracker (from 1.1, 1.3, 1.4).** `_bmad-output/implementation-artifacts/deferred-work.md` is append-only. Story 1.5 introduces (at minimum) one new Deferred-Work entry: `caspian/spec/core.md` line 82 references `CASPIAN-W004` as *"proposed ... to be reserved by Story 1.5's registry"* — the architecture's authoritative 17-code v1.0 set does NOT include W004, so Story 1.5 deliberately does not reserve it; the drift is recorded for a future tidy-up. Other Deferred-Work candidates that may surface during code review (registry-level `minItems`, schema upper-bound on entry count, sha256-style content-addressing of registry, etc.) are appended to the existing format as they emerge.

**Biome-on-JSON behavior (from 1.1, 1.4).** Biome 2.4.13 lints and formats `*.json` files. The two new JSON files MUST pass biome's formatter + linter without warnings. Resolve any complaint by editing the JSON (correct indentation, line endings, etc.) — never by relaxing `caspian/biome.json` (relaxing the lint baseline is out of scope for Story 1.5).

**Reference Schema Model authoring style (from 1.4).** Story 1.4 supplied a complete *Reference Schema Model* that the dev agent used byte-faithfully. Story 1.5 supplies two complete models — the *Reference Registry-Schema Model* and the *Reference Registry Model* — that the dev agent uses byte-faithfully. Deviations require recorded justification in Completion Notes.

### Git Intelligence — Recent Patterns

Last 5 commits (most recent first):

```text
45dfdbc chore(review-1-4): apply code-review patches + sync sprint status
29eaed1 docs(spec): add envelope JSON Schema (Story 1.4)
f858f35 chore(review-1-3): apply code-review patches + sync sprint status
ecf3ad9 docs(spec): add canonical core:* vocabulary docs (Story 1.3)
5cd423b chore(review-1-2): apply code-review patches + sync sprint status
```

Patterns to follow:

- Conventional Commits prefix matching the change kind. For Story 1.5: `docs(spec): add diagnostic registry + registry schema (Story 1.5)` (recommended; matches 1.2 / 1.3 / 1.4 cadence). Alternative `feat(spec):` is acceptable for first-time emission of the registry.
- Story number in commit message (`(Story 1.5)` parenthetical; trailing).
- Single coherent commit — all four files (`caspian/diagnostics/LICENSE` + `caspian/diagnostics/CHANGELOG.md` + `caspian/diagnostics/registry.json` + `caspian/schemas/v1/diagnostic-registry.schema.json`) ship together. Do not split across commits.
- After review, a separate `chore(review-1-5): apply code-review patches + sync sprint status` commit captures any review patches — same pattern as 1.1, 1.2, 1.3, 1.4.
- No co-authored-by trailer unless the user requests one.

### Latest Tech Information

No new dependencies are installed in this story. Two external standards / consumer-side references whose stability matters:

- **JSON Schema Draft 2020-12** — published by the JSON Schema organization as the current stable draft. The meta-schema URI `https://json-schema.org/draft/2020-12/schema` is the canonical anchor; it does not version (no patch suffix) within the 2020-12 draft. ajv v8 (~v8.12 to v8.17 as of 2026-Q1) supports Draft 2020-12 via `import Ajv from 'ajv/dist/2020.js'`. Story 2.1 imports ajv via that path; Story 1.5's `diagnostic-registry.schema.json` is consumed by ajv's 2020-12 validator with no extra configuration.
- **JSON Schema `pattern` keyword** — in Draft 2020-12, `pattern` uses ECMAScript regex semantics. The patterns Story 1.5 uses (`^CASPIAN-(E|W)\\d{3}$` and `^https://caspian\\.dev/diagnostics#caspian-(e|w)\\d{3}$`) are entirely within the ECMA-262 RegExp common subset that all conforming validators support. No flags are applied (no `i`, `g`, `m`); case sensitivity matters for both patterns (uppercase `CASPIAN-E001` vs lowercase `#caspian-e001`).
- **VS Code YAML LSP / generic JSON Schema consumers** — once Epic 4 deploys `caspian.dev/schemas/v1/diagnostic-registry.schema.json`, IDE consumers can configure schema mapping (e.g., `json.schemas: [{"fileMatch": ["**/diagnostics/registry.json"], "url": "https://caspian.dev/schemas/v1/diagnostic-registry.schema.json"}]`). Until then, consumers map the local file path. **Story 1.5 only ships the file; editor configuration is the consumer's concern.**

No web research beyond the existing planning artifacts is required. The PRD, architecture, epics, `caspian/spec/core.md`, and Story 1.4's deliverable fully specify the diagnostic-registry shape and content.

### Project Structure Notes

After Story 1.5 ships, the `caspian/diagnostics/` directory is complete for v1.0:

```text
caspian/diagnostics/                                # Apache-2.0 (Story 1.5)
├── LICENSE                                         # full Apache 2.0 text — byte-for-byte copy of caspian/LICENSE
├── registry.json                                   # 17 v1.0 codes; root-object form
└── CHANGELOG.md                                    # governance header (append-only + semver-decoupled)
```

And `caspian/schemas/v1/` becomes:

```text
caspian/schemas/v1/                                 # Apache-2.0 (Story 1.4 + 1.5)
├── envelope.schema.json                            # (Story 1.4 — sealed)
└── diagnostic-registry.schema.json                 # NEW (Story 1.5)
```

After Story 1.5 ships, the schemas/v1/ directory is structurally complete for v1.0 (per architecture's project tree lines 582–586). A v0.2+ minor bump may add a third schema (e.g., `core-story.schema.json` if per-`core:*`-type schemas are RFC-approved); that lives alongside `envelope.schema.json` and `diagnostic-registry.schema.json`. A v2.0 spec major bump would land `caspian/schemas/v2/` alongside `v1/`.

The `caspian/diagnostics/` tree does **not** acquire any further file in Stories 1.6 or 1.7 (those stories work in `caspian/fixtures/` and `caspian/examples/`, NOT in `caspian/diagnostics/`). The next file added to `caspian/diagnostics/` is when (and if) a v0.2+ spec minor bump appends a code to `registry.json` and bumps `CHANGELOG.md`. Per architecture C4 (line 258), the file content evolves; the file count stays the same.

### References

- **Epic 1 — Story 1.5 ACs:** `_bmad-output/planning-artifacts/epics.md` lines 575–611 (`### Story 1.5: Diagnostic registry + registry schema`).
- **Epic 1 — Validator Scope (T1.5) — 17 Diagnostic Codes:** `_bmad-output/planning-artifacts/epics.md` lines 160–164.
- **Epic 1 — Schema layout summary (envelope + diagnostic-registry):** `_bmad-output/planning-artifacts/epics.md` line 183.
- **Epic 1 — Product Scope reinterpretation (2 schemas in v1.0):** `_bmad-output/planning-artifacts/epics.md` line 246.
- **Architecture — Diagnostic Registry C1..C5:** `_bmad-output/planning-artifacts/architecture.md` lines 251–279.
- **Architecture — Validation Pipeline D1..D4:** `_bmad-output/planning-artifacts/architecture.md` lines 281–292.
- **Architecture — JSON Schema Authoring conventions:** `_bmad-output/planning-artifacts/architecture.md` lines 370–378.
- **Architecture — Pattern Examples (good vs. anti-pattern diagnostic message):** `_bmad-output/planning-artifacts/architecture.md` lines 470–506.
- **Architecture — Schemas directory layout:** `_bmad-output/planning-artifacts/architecture.md` lines 582–586.
- **Architecture — Diagnostics directory layout:** `_bmad-output/planning-artifacts/architecture.md` lines 588–591.
- **Architecture — Diagnostic registry boundary (schema-validated, sha256-pinned, .gitattributes safeguards):** `_bmad-output/planning-artifacts/architecture.md` lines 729–735.
- **Architecture — License layout (per-directory + root composite):** `_bmad-output/planning-artifacts/architecture.md` lines 175–181, 749, 588.
- **Architecture — Single-source-of-truth diagram (registry.json → derivatives):** `_bmad-output/planning-artifacts/architecture.md` lines 812–815.
- **Architecture — Implementation sequence (Story-002: Diagnostic registry):** `_bmad-output/planning-artifacts/architecture.md` lines 327–330, 902–908.
- **Architecture — Decision Impact Analysis (cross-component dependencies for registry):** `_bmad-output/planning-artifacts/architecture.md` lines 917–920.
- **PRD — FR9 (CLI emits diagnostics with file/line/field/suggestion/doc-link):** `_bmad-output/planning-artifacts/prd.md` line 515.
- **PRD — FR12 (CLI rejects syntactically invalid; warns on allow-list):** `_bmad-output/planning-artifacts/prd.md` line 518.
- **PRD — FR13 (extensible-registry warn-on-unknown-namespace):** `_bmad-output/planning-artifacts/prd.md` line 519.
- **PRD — FR32 (caspian.dev anchor IDs):** `_bmad-output/planning-artifacts/prd.md` line 550.
- **PRD — Versioned diagnostic registry as cross-cutting concern:** `_bmad-output/planning-artifacts/prd.md` line 79.
- **PRD — NFR6 (no remote schema fetching) [via architecture]:** `_bmad-output/planning-artifacts/architecture.md` line 160.
- **PRD — NFR16 (graceful degradation in non-Caspian-aware hosts):** `_bmad-output/planning-artifacts/prd.md` line 591.
- **PRD — NFR19 (deterministic CLI):** `_bmad-output/planning-artifacts/prd.md` line 597.
- **PRD — NFR22 (BACKWARD_TRANSITIVE schema evolution):** `_bmad-output/planning-artifacts/prd.md` line 603.
- **PRD — NFR24 (doc-URL stability) [via architecture]:** `_bmad-output/planning-artifacts/architecture.md` line 79, 426.
- **`caspian/spec/core.md` — `type` field shape + W002 namespace warning:** `caspian/spec/core.md` lines 65–97.
- **`caspian/spec/core.md` — `schema_version` semantics + W003 unrecognized-version warning:** `caspian/spec/core.md` lines 39–63.
- **`caspian/spec/core.md` — `CASPIAN-W004` proposal (forward-reference NOT reserved by Story 1.5):** `caspian/spec/core.md` lines 80–84.
- **`caspian/spec/core.md` — Conformance + W001 + W002 references:** `caspian/spec/core.md` lines 168–214, 278–288.
- **`caspian/spec/core.md` — See Also (forward-reference to `../diagnostics/registry.json`):** `caspian/spec/core.md` line 295.
- **Implementation readiness report — Story 1.5 traceability:** `_bmad-output/planning-artifacts/implementation-readiness-report-2026-04-26.md` (search for Story 1.5 entries).
- **Story 1.1 — Working-directory convention, root LICENSE (Apache 2.0 full text), biome.json baseline, conventional-commits prefix:** `_bmad-output/implementation-artifacts/1-1-project-bootstrap-monorepo-scaffold-dual-license-layout.md`.
- **Story 1.2 — `caspian/spec/` foundation, forward-reference discipline, smoke-gate pattern, sealed-files convention:** `_bmad-output/implementation-artifacts/1-2-caspian-core-normative-reference-spec-core-md.md`.
- **Story 1.3 — Vocabulary directory, working-directory persistence, deferred-work pattern:** `_bmad-output/implementation-artifacts/1-3-canonical-core-vocabulary-docs.md`.
- **Story 1.4 — `caspian/schemas/v1/envelope.schema.json` + `caspian/schemas/LICENSE` precedent; Reference Schema Model pattern:** `_bmad-output/implementation-artifacts/1-4-envelope-json-schema-draft-2020-12.md`.
- **Deferred work tracker:** `_bmad-output/implementation-artifacts/deferred-work.md`.
- **Project conventions:** `F:\work\joselimmo-marketplace-bmad\CLAUDE.md`.
- **JSON Schema Draft 2020-12 specification (external):** <https://json-schema.org/draft/2020-12/release-notes>.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (`claude-opus-4-7[1m]`) via the BMad `/bmad-dev-story` workflow on 2026-04-27.

### Debug Log References

- **Mechanical AC verification (`node -e ...`).** Parsed both `caspian/schemas/v1/diagnostic-registry.schema.json` and `caspian/diagnostics/registry.json`, then printed:
  - **Schema:** `byte_size=3276`, `utf8_no_bom=true`, `lf_only=true`, `first_key=$schema`, `$schema=https://json-schema.org/draft/2020-12/schema`, `$id=https://caspian.dev/schemas/v1/diagnostic-registry.schema.json`, `title=CaspianDiagnosticRegistry`, `type=object`, `additionalProperties=false`, `required=["diagnostics"]`, `diagnostics_minItems=1`, `DiagnosticEntry.title=DiagnosticEntry`, `DiagnosticEntry.additionalProperties=false`, `DiagnosticEntry.required=["code","severity","rule","message","doc"]`, `code.pattern=^CASPIAN-(E|W)\d{3}$`, `severity.enum=["error","warning"]`, `doc.pattern=^https://caspian\.dev/diagnostics#caspian-(e|w)\d{3}$`, `root_examples_count=1`, `DiagnosticEntry_examples_count=1`. All AC5–AC10 + AC14 schema-side ACs pass.
  - **Registry:** `byte_size=4057`, `utf8_no_bom=true`, `lf_only=true`, `entry_count=17`, `codes=CASPIAN-E001,CASPIAN-E002,CASPIAN-E003,CASPIAN-E004,CASPIAN-E005,CASPIAN-E006,CASPIAN-E007,CASPIAN-E008,CASPIAN-E009,CASPIAN-E010,CASPIAN-E011,CASPIAN-E012,CASPIAN-E013,CASPIAN-E014,CASPIAN-W001,CASPIAN-W002,CASPIAN-W003`. Ordering matches the AC2 + AC4 expected sequence exactly. All AC1–AC4 registry-side ACs pass.

- **AC11 message-style audit (per-entry).** For each of the 17 entries, automated checks: (a) message does NOT end with `.`, (b) message does NOT match `^you\b|\byour\b` (case-insensitive — no user-blame), (c) first character is uppercase. **Result: `AC11_all_clean=true`** — every message conforms.

- **AC3 — fields-per-entry audit.** For each entry, `Object.keys(d).length === 5`. **Result: `AC3_fields_per_entry_eq_5=true`** — all 17 entries have exactly the 5 required fields, no extras.

- **AC8 — code-pattern audit.** `^CASPIAN-(E|W)\d{3}$` regex applied to each entry's `code`. **Result: `AC8_code_regex_all_match=true`** — all 17 codes match.

- **AC9 — doc-pattern audit.** `^https://caspian\.dev/diagnostics#caspian-(e|w)\d{3}$` regex applied to each entry's `doc`. **Result: `AC9_doc_regex_all_match=true`** — all 17 doc URLs match.

- **AC2 — append-only ordering audit.** Compared registry's `code` sequence against expected `[E001..E014, W001..W003]`. **Result: `AC2_order_ok=true`** — ordering correct.

- **Cross-check #1 — registry-passes-schema simulation.** Manually re-implemented the relevant subset of JSON-Schema-2020-12 evaluation (root `required: ["diagnostics"]`, root `additionalProperties: false`, entry `required: [code, severity, rule, message, doc]`, entry `additionalProperties: false`, `code.pattern`, `severity.enum`, `doc.pattern`). For each of the 17 entries: `hasReq && severity-in-enum && code-pattern-match && doc-pattern-match`. **Result: `registry_passes_schema=true`** — all 17 entries would pass ajv-Draft-2020-12 validation against the meta-schema.

- **Cross-check #1 (negative cases — manual ajv keyword expectations).**
  - **N1** entry with `severity: "info"` → ajv emits keyword `enum`, instancePath `/diagnostics/N/severity`, params `{ allowedValues: ["error", "warning"] }`. The registry as authored does NOT contain this case; the simulation confirms the meta-schema would catch it.
  - **N2** entry with `code: "CASPIAN-X001"` → ajv emits keyword `pattern`, instancePath `/diagnostics/N/code`, params `{ pattern: "^CASPIAN-(E|W)\\d{3}$" }`. Confirmed via spot-check below.
  - **N3** entry with extra unknown field `since: "0.1"` → ajv emits keyword `additionalProperties`, instancePath `/diagnostics/N`, params `{ additionalProperty: "since" }`. Confirmed by `additionalProperties: false` on `$defs.DiagnosticEntry`.

- **Cross-check #4 — pattern spot-checks** (all confirmed by `node -e` regex-evaluation):
  - `code` regex `^CASPIAN-(E|W)\d{3}$` **accepts**: `CASPIAN-E001`, `CASPIAN-E014`, `CASPIAN-W003`. **Rejects**: `CASPIAN-X001` (wrong letter), `CASPIAN-E1` (1 digit), `caspian-e001` (lowercase), `CASPIAN-E001 ` (trailing space), `CASPIAN-E0001` (4 digits), `CASPIAN-E01` (2 digits).
  - `doc` regex `^https://caspian\.dev/diagnostics#caspian-(e|w)\d{3}$` **accepts**: `https://caspian.dev/diagnostics#caspian-e001`, `https://caspian.dev/diagnostics#caspian-w003`. **Rejects**: `http://caspian.dev/diagnostics#caspian-e001` (no `s`), `https://caspian.dev/diagnostics#E001` (wrong fragment shape), `https://caspian.dev/Diagnostics#caspian-e001` (capital `D`), `https://caspianXdev/diagnostics#caspian-e001` (escape on `.` rejects alternative TLD-style host).

- **Cross-check #2 — code-to-pipeline mapping** (recorded as the *Per-code rationale* table inside the *Reference Registry Model* section of Dev Notes; reproduced here in audit form):

  | Code | Stage | Trigger pattern |
  |---|---|---|
  | `E001` | 1 (byte-level) | First 3 bytes equal `EF BB BF` (UTF-8 BOM). |
  | `E002` | 1 (byte-level) | UTF-8 strict decode rejects the byte stream. |
  | `E003` | 3 (post-parse scan) | Tab character (`\t`) appears in the frontmatter slice's indentation. |
  | `E004` | 2 (frontmatter extraction) | Bytes between (excl.) opening `---` and closing `---` exceed 4096 (architecture D4 line 292). |
  | `E005` | 2 (frontmatter extraction) | Opening `---` missing, closing `---` missing, or delimiter line malformed. |
  | `E006` | 3 (YAML parse) | `yaml` v2.x strict 1.2 rejects the frontmatter. |
  | `E007` | 3 (post-parse scan) | After successful YAML parse, a string-typed value matches `{on, off, yes, no, y, n}` case-insensitively (YAML 1.1 boolean keyword footgun). |
  | `E008` | 4 (envelope schema) | Maps to `envelope.schema.json` root `required: ["type"]`. |
  | `E009` | 4 (envelope schema) | Maps to `type.pattern` (`^[^:]+:.+$`). |
  | `E010` | 4 (envelope schema) | Maps to `requires.type: array`. |
  | `E011` | 4 (envelope schema) | Maps to `RequiresEntry.required: ["type"]`. |
  | `E012` | 4 (envelope schema) | Maps to `RequiresEntry.additionalProperties: false`, `tags.items.type: string`, OR `count.minimum: 1` / `count.type: integer`. |
  | `E013` | 4 (envelope schema) | Maps to `produces.type: object` (via `Produces` $def). |
  | `E014` | 4 (envelope schema) | Maps to `Produces.required: ["type"]`. |
  | `W001` | 6 (allow-list scan) | Field outside the 22 recognized + `x-*` extensions + `<vendor>:<name>` namespaced. |
  | `W002` | 5 (namespace check) | `type` namespace is not `core`. |
  | `W003` | 5 (namespace check) | `schema_version` value not in `["0.1"]`. |

- **AC15 smoke gate.** From repository root:
  - `pnpm -C caspian lint` → `Checked 7 files in 20ms. No fixes applied.` Exit 0. The 7 files are the 5 baseline (`biome.json`, `package.json`, `tsconfig.base.json`, `.changeset/config.json`, `schemas/v1/envelope.schema.json` — all biome-tracked since Story 1.4) plus the 2 new JSON files (`schemas/v1/diagnostic-registry.schema.json` + `diagnostics/registry.json`). The CHANGELOG.md (`.md`) and the LICENSE (no extension) are excluded from biome's includes — same exclusion pattern Stories 1.2 and 1.3 relied on for prose markdown.
  - `pnpm -C caspian test` → `No projects matched the filters in "F:\work\joselimmo-marketplace-bmad\caspian"`. Exit 0. Empty-workspace pattern from Stories 1.1–1.4 preserved; no source code or tests added.

- **AC13 LICENSE byte-equality verification.** `cp caspian/LICENSE caspian/diagnostics/LICENSE` followed by `diff caspian/LICENSE caspian/diagnostics/LICENSE` → empty output (no differences). `wc -c` confirms 11358 bytes for both files. Same CNCF/Kubernetes pattern Story 1.4 used for `caspian/schemas/LICENSE`.

- **JSON Schema authoring conventions audit (architecture lines 370–378).**
  - `$schema` is the literal first key of the meta-schema's root JSON object (verified via `Object.keys(obj)[0]`).
  - `$id` is `https://caspian.dev/schemas/v1/diagnostic-registry.schema.json` — absolute, no trailing slash, no fragment, matches architecture line 215 / line 373 verbatim.
  - `title` values are PascalCase: `CaspianDiagnosticRegistry` (root), `DiagnosticEntry` ($defs).
  - All `description` strings start with a capital and end with a period; voice is descriptive, not normative or imperative. 8 description fields total (root, properties.diagnostics, $defs.DiagnosticEntry, $defs.DiagnosticEntry.properties.{code, severity, rule, message, doc}) — each one passes the capital-and-period test.
  - Field names mirror registry-JSON spelling exactly: `code` / `severity` / `rule` / `message` / `doc`, all lowercase, no transformation.
  - `required` is declared via the `required: [...]` array at every level (root + entry).
  - `examples` arrays are present at the schema root (1 entry) AND on `$defs.DiagnosticEntry` (1 entry).

### Completion Notes List

**All 16 acceptance criteria satisfied. Story status: `review`.**

- **AC1 — `registry.json` exists, valid UTF-8 with LF, no BOM, well-formed JSON** ✅ — `caspian/diagnostics/registry.json` created (4057 bytes). Mechanical verification confirmed: `utf8_no_bom=true`, `lf_only=true`, `JSON.parse()` succeeds.
- **AC2 — 17 v1.0 codes in append-only order** ✅ — sequence audit `AC2_order_ok=true`; `entry_count=17`; codes E001–E014 + W001–W003 in exact expected order; no W004 reserved.
- **AC3 — 5 fields per entry, no extras** ✅ — `AC3_fields_per_entry_eq_5=true` for all 17 entries.
- **AC4 — codes match architecture's stage 1–6 pipeline mapping** ✅ — full mapping table reproduced in Debug Log Cross-check #2; each code aligns with its architecture-mandated trigger.
- **AC5 — `diagnostic-registry.schema.json` exists, `$schema` first key** ✅ — `Object.keys(obj)[0] === "$schema"` confirmed; literal value is `"https://json-schema.org/draft/2020-12/schema"`.
- **AC6 — `$id` exact value** ✅ — `obj["$id"] === "https://caspian.dev/schemas/v1/diagnostic-registry.schema.json"`. No trailing slash, no fragment, no query string.
- **AC7 — `title: "CaspianDiagnosticRegistry"` (root) + `"DiagnosticEntry"` ($defs)** ✅ — both confirmed.
- **AC8 — `code.pattern` matches all 17 codes; rejects malformed** ✅ — `AC8_code_regex_all_match=true`; spot-checks confirm rejection of `CASPIAN-X001`, `CASPIAN-E1`, `caspian-e001`, trailing-space variant, 4-digit and 2-digit variants.
- **AC9 — `doc.pattern` matches all 17 URLs; rejects malformed** ✅ — `AC9_doc_regex_all_match=true`; spot-checks confirm rejection of `http://`, uppercase `E001`, capital `Diagnostics`, escaped `.` rejects alt-TLD host.
- **AC10 — entry `required: ["code","severity","rule","message","doc"]` + `severity.enum: ["error","warning"]`** ✅ — both confirmed.
- **AC11 — message-style conventions (declarative, no period, backticks)** ✅ — `AC11_all_clean=true` across all 17 messages.
- **AC12 — `CHANGELOG.md` governance header (append-only + semver-decoupled)** ✅ — `## Governance` section asserts both invariants explicitly. Used `## Unreleased` (NOT `## 0.1.0 — 2026-04-27`) — see *Decision recorded* below.
- **AC13 — `caspian/diagnostics/LICENSE` is full Apache 2.0 text, byte-faithful copy of `caspian/LICENSE`** ✅ — `diff` returns empty output; both files are 11358 bytes.
- **AC14 — path-versioned `schemas/v1/`** ✅ — `caspian/schemas/v1/diagnostic-registry.schema.json` lives alongside `envelope.schema.json` under `v1/`.
- **AC15 — smoke gate green** ✅ — `pnpm -C caspian lint` checked 7 files in 20ms, exit 0. `pnpm -C caspian test` reported *No projects matched the filters*, exit 0. Empty-workspace pattern preserved.
- **AC16 — manual cross-checks recorded** ✅ — Cross-checks #1 (registry vs schema, including N1/N2/N3 negatives), #2 (code-to-pipeline mapping), #3 (message-style audit), #4 (pattern spot-checks) all documented in Debug Log above.

**No deviations from the story spec on the schema or the registry.** Both *Reference Registry-Schema Model* and *Reference Registry Model* in the Dev Notes were used byte-faithfully — no shape, type, pattern, message, rule, or example was modified relative to the models. Only formatting choices (whitespace inside JSON; biome's formatter accepted both files without modifications — `No fixes applied`).

**Decision recorded — `## Unreleased` over `## 0.1.0 — 2026-04-27` in CHANGELOG.md.** The Story spec offered both options. Chose `## Unreleased` because: (a) the registry's first formal release will coincide with the v1.0 spec ship (currently sequenced after Story 5.2's `spec/CHANGELOG.md` lands the foundational proposal), at which point this section can be retitled to `## 0.1.0 — <ship-date>`; (b) using `## Unreleased` keeps the change-log shape interruption-free for any v0.x interim work; (c) it matches the dominant changesets / Keep-a-Changelog idiom for pre-1.0 packages where the actual ship version is decided at tag time.

**Decision recorded — root-object form `{"diagnostics": [...]}` over top-level array.** Explicitly mandated by the story spec; chose the object form. Rationale (per story Dev Notes): matches the registry-schema's required structure, gives top-level metadata room for future minor versions without breaking BACKWARD_TRANSITIVE, mirrors the validator's JSON output envelope shape (architecture line 386: `{ "diagnostics": [ ... ] }`).

**Decision recorded — `additionalProperties: false` at both schema layers.** The registry-schema is internal infrastructure (not user-authored content), so the deliberate Story 1.4 envelope-schema asymmetry (root `additionalProperties: true`, sub-shapes `false`) does NOT carry over. The registry-schema is strict at every level: any future field addition (e.g., `since: "0.1"` per entry, or `version: "0.1"` at root) will require a `schemas/v2/` bump per NFR22 BACKWARD_TRANSITIVE.

**Decision recorded — `minItems: 1` on `properties.diagnostics`.** Enforces "at least one entry" at schema level. The 17-code v1.0 registry comfortably satisfies this; future versions can never go below one entry without bumping `schemas/v2/`. Alternative considered: omit `minItems` to allow a registry with zero entries (e.g., a hypothetical "spec-only" subset). Rejected because: (a) the AC's "single source of truth for diagnostic codes" framing implies non-empty; (b) any consumer that depends on a specific code will break on an empty registry whether or not the schema admits it.

**Deferred-Work item recorded — `caspian/spec/core.md` line 82 references `CASPIAN-W004`.** The `core.md` annotation reads *"proposed `CASPIAN-W004`, to be reserved by Story 1.5's registry"* — but the architecture's authoritative v1.0 set has only W001–W003. Story 1.5 does NOT reserve W004 (per AC2's strict 17-entry count). The drift is captured as a Deferred-Work entry below for a future tidy-up story or v0.2+ RFC. `core.md` is sealed (Story 1.2); no in-place edit performed.

**Manual follow-up required by the user:**

- **Append a Deferred-Work entry** to `_bmad-output/implementation-artifacts/deferred-work.md` recording the `CASPIAN-W004` drift between `caspian/spec/core.md` line 82 and the v1.0 registry. Suggested wording:

  > **`caspian/spec/core.md` line 82 references `CASPIAN-W004` as "proposed ... to be reserved by Story 1.5's registry"** — the architecture's v1.0 set (architecture.md lines 277–279) has only W001/W002/W003; Story 1.5 followed the architecture and did NOT reserve W004. `core.md` is sealed (Story 1.2), so the annotation remains in place. A future tidy-up story could either (a) remove the W004 reference from `core.md`, or (b) introduce W004 in a v0.2+ RFC for the "type under `core:` whose name is not in the canonical vocabulary" warning use case. The `W002` ("non-`core:*` namespace") code partially overlaps but is not identical: W002 fires on `bmad:epic` / `maya:rule`, while W004's intended use was for `core:not-canonical-name`. [`caspian/spec/core.md` lines 80–84]

  This belongs in the existing `## Deferred from: code review of 1-5-...` section the next code review will create, OR in a fresh `## Deferred during dev of 1-5-...` section if surfaced before code review.

- **Commit the story.** Per the repo's commit policy, the dev agent did not commit. Recommended invocation:

  ```bash
  git add caspian/diagnostics/ caspian/schemas/v1/diagnostic-registry.schema.json _bmad-output/implementation-artifacts/1-5-diagnostic-registry-registry-schema.md _bmad-output/implementation-artifacts/sprint-status.yaml
  git commit -m "docs(spec): add diagnostic registry + registry schema (Story 1.5)"
  ```

  If `.claude/settings.local.json` was auto-modified by Claude Code's permission-grant flow during the smoke gate (as in earlier stories), include or omit it at the user's discretion.

- **Resolve forward-reference notes (optional, NOT required for Story 1.5 acceptance).** Story 1.2's `caspian/spec/core.md` carries *"coming soon — Story 1.5"* annotations on lines 9, 74, 82, 295. Those annotations are now stale (the registry exists). Same handling discipline as Story 1.4 followed for Story 1.4-targeted annotations: leave them in place; a future tidy-up story may remove them. Out of scope for Story 1.5.

**Forward dependencies (consumed by later stories):**

- **Story 1.6 (canonical fixture set)** — The 17 codes in `registry.json` define the directory layout under `caspian/fixtures/invalid/`: one directory per code (`E001-bom/`, `E002-encoding/`, …, `W003-unrecognized-schema-version/`). Each fixture's sibling `<variant>.expected.json` references the codes by their exact `code` string (`"CASPIAN-EXXX"` or `"CASPIAN-WXXX"`). Story 1.6's test runner will read the registry to enumerate the expected directories.
- **Story 2.2 (typed TS constants codes.generated.ts + sha256 verify-hash)** — `packages/core/scripts/gen-diagnostic-codes.ts` reads `caspian/diagnostics/registry.json`, computes a sha256 hash, and emits `packages/core/src/diagnostics/codes.generated.ts` with a `// Hash: <sha256>` header. The TS constants are typed `DiagnosticDefinition` records mirroring this story's 5 fields. Field names MUST match exactly: `code`, `severity`, `rule`, `message`, `doc`.
- **Story 2.4 (pipeline stages 4–6)** — When ajv emits validation errors against `envelope.schema.json`, the pipeline maps ajv keywords to registry codes per the table in Cross-check #2 (E008 ↔ root `required`, E009 ↔ `type.pattern`, E010 ↔ `requires.type: array`, E011 ↔ `RequiresEntry.required`, E012 ↔ `RequiresEntry.additionalProperties: false`, E013 ↔ `produces.type: object`, E014 ↔ `Produces.required`). The runtime emits the canonical `message` text from the registry, NOT a re-derived message.
- **Story 2.7 (conformance suite)** — `conformance/cases/` ships ~17 cases mirroring the 17 codes 1:1. Each case has an `input.md` and an `expected.json` that names the code via the exact string from this story's registry. The runner asserts that any conforming validator emits the same code for the same input — this is the cross-implementation parity contract.
- **Story 4.2 (caspian.dev/diagnostics page)** — `site/build.mjs` reads `caspian/diagnostics/registry.json` and emits `site/dist/diagnostics.html` with one section per entry, anchored by `id="caspian-eXXX"` / `id="caspian-wXXX"`. The 17 anchors are the canonical resolution targets for the doc URLs Story 1.5 emits in the registry. NFR24 anchor stability requires the anchor IDs to never change across spec minor versions.

**Sprint-status transitions during this dev session:**

- `1-5-diagnostic-registry-registry-schema`: `ready-for-dev` → `in-progress` (Step 4 of dev-story workflow) → `review` (Step 9 — final gate after smoke gate green and all 16 ACs satisfied).

### File List

All paths relative to repo root (`F:\work\joselimmo-marketplace-bmad\`).

**New files (4):**

- `caspian/diagnostics/LICENSE` — full Apache 2.0 license text, byte-faithful copy of `caspian/LICENSE` (11358 bytes; identical to root LICENSE per `diff` verification)
- `caspian/diagnostics/CHANGELOG.md` — registry changelog with governance header (append-only + semver-decoupled) + `## Unreleased` section
- `caspian/diagnostics/registry.json` — 17 v1.0 diagnostic codes (E001–E014 + W001–W003) in append-only order; root-object form `{"diagnostics": [...]}`; 4057 bytes
- `caspian/schemas/v1/diagnostic-registry.schema.json` — Caspian diagnostic registry meta-schema (Draft 2020-12); root `CaspianDiagnosticRegistry` + `$defs.DiagnosticEntry`; 3276 bytes

**Modified files (2):**

- `_bmad-output/implementation-artifacts/1-5-diagnostic-registry-registry-schema.md` — Tasks/Subtasks marked complete; Dev Agent Record populated (Agent Model, Debug Log, Completion Notes); File List populated; Status transitioned `ready-for-dev → in-progress → review`
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — `1-5-diagnostic-registry-registry-schema` transitioned `backlog → ready-for-dev → in-progress → review`; session markers appended; `last_updated: 2026-04-27`

### Review Findings

**0 decision-needed · 0 patch · 10 defer · 8 dismissed**

#### Deferred

- [x] [Review][Defer] Schema has no cross-field constraint preventing `code`/`severity` letter mismatch (e.g., `CASPIAN-E001` with `severity: "warning"`) [caspian/schemas/v1/diagnostic-registry.schema.json] — deferred, JSON Schema 2020-12 cross-field constraints require `if/then/else` complexity; all 17 current entries are correct by construction; low risk for a hand-authored registry; revisit at schema v2 or via CI script
- [x] [Review][Defer] `doc` URL numeric suffix is not constrained to match the `code` numeric suffix [caspian/schemas/v1/diagnostic-registry.schema.json] — deferred, JSON Schema cannot enforce numeric equality across fields; all 17 entries are correct; Story 2.2/4.2 generators should verify alignment at generation time
- [x] [Review][Defer] No `uniqueItems: true` on the `diagnostics` array — duplicate full-object entries pass schema validation [caspian/schemas/v1/diagnostic-registry.schema.json] — deferred, Reference Registry-Schema Model omits this; `uniqueItems` compares full objects not just `code` values (imperfect solution); consider adding in schema v2 or enforcing via CI `ajv-validate-registry` step (Epic 2)
- [x] [Review][Defer] No kebab-case pattern constraint on the `rule` field — only `minLength: 1` enforced [caspian/schemas/v1/diagnostic-registry.schema.json] — deferred, Reference Registry-Schema Model only had `minLength: 1`; all 17 current entries use kebab-case; a future schema v2 could add `pattern: "^[a-z][a-z0-9]*(-[a-z0-9]+)*$"`
- [x] [Review][Defer] `message` field has no `maxLength` constraint — CLI output could receive unbounded messages [caspian/schemas/v1/diagnostic-registry.schema.json] — deferred, story spec Reference Model omits `maxLength`; current 17 messages are concise (26–69 chars); consider `maxLength: 200` in schema v2
- [x] [Review][Defer] CHANGELOG.md cross-references `spec/CHANGELOG.md`, `packages/cli/CHANGELOG.md`, `packages/core/CHANGELOG.md` — none of these paths exist yet [caspian/diagnostics/CHANGELOG.md] — deferred, forward-looking governance text appropriate for a v1.0 foundation document; resolves as Epic 2 (Story 2.8) and Story 5.2 ship
- [x] [Review][Defer] No machine-readable `version` field in `registry.json` — CHANGELOG states decoupled semver but the registry itself carries no version tag [caspian/diagnostics/registry.json] — deferred, by design (`additionalProperties: false` at root disallows extra fields without a `schemas/v2/` bump); version tracking is prose-only via CHANGELOG; recorded in Completion Notes
- [x] [Review][Defer] CASPIAN-E009 message contains literal angle brackets (`<namespace>:<name>`) — Story 4.2 HTML generator must HTML-escape all string fields [caspian/diagnostics/registry.json] — deferred, canonical architecture message text; `<` and `>` are intentional pattern-syntax notation; Story 4.2 MUST apply standard HTML entity escaping to all registry fields before rendering
- [x] [Review][Defer] No uniqueness constraint on the `rule` field — two entries could share the same rule name with different codes [caspian/schemas/v1/diagnostic-registry.schema.json] — deferred, Story 2.2 TypeScript generator should detect and reject duplicate rule names; all 17 current rules are unique
- [x] [Review][Defer] Append-only governance is process-dependent, not schema-enforced — no CI step `ajv-validate-registry` yet [caspian/schemas/v1/diagnostic-registry.schema.json] — deferred, already recorded as Forward Dependency in Completion Notes; CI step lands in Epic 2

### Change Log

- **2026-04-27 — Story 1.5 dev session.** Created 4 files: 1 LICENSE (byte-faithful Apache 2.0 copy) + 1 CHANGELOG.md (governance header asserts append-only + semver-decoupled invariants) under `caspian/diagnostics/`, plus 1 registry.json (17 v1.0 codes E001–E014 + W001–W003 in append-only order, root-object form) and 1 diagnostic-registry.schema.json (Draft 2020-12, `additionalProperties: false` at both layers, `code.pattern`/`severity.enum`/`doc.pattern` enforce the registry's required shape). All 16 acceptance criteria satisfied. Smoke gate green (`pnpm -C caspian lint` checked 7 files, exit 0; `pnpm -C caspian test` exit 0). Story status `ready-for-dev → in-progress → review`. No source code or tests added — content-only story consumed by Stories 1.6 (fixture directory layout), 2.2 (codes.generated.ts derivative), 2.4 (pipeline runtime), 2.7 (conformance suite), and 4.2 (diagnostics.html derivative). Forward-reference annotation drift on `caspian/spec/core.md` line 82 (proposed `CASPIAN-W004` not reserved) recorded as a Deferred-Work candidate for the user to append.
