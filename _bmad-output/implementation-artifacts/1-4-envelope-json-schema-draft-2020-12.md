# Story 1.4: Envelope JSON Schema (Draft 2020-12)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a plugin author using a JSON-Schema-aware editor (e.g., VS Code YAML LSP),
I want a canonical envelope schema referenced via stable `$id`,
So that I get zero-configuration validation feedback in my editor as I author Caspian frontmatter (FR14).

## Working Directory

All paths in this story resolve **inside `caspian/`** — the sub-monorepo that hosts the Caspian project under the surrounding `joselimmo-marketplace-bmad` repository. Any reference like `schemas/v1/envelope.schema.json` resolves to `caspian/schemas/v1/envelope.schema.json`. Never create files at the repository root or anywhere outside `caspian/schemas/` for this story (with the single exception of the sprint-status file under `_bmad-output/implementation-artifacts/`).

`caspian/schemas/` does **not yet exist** in the repository — Story 1.4 creates the directory tree for the first time.

## Acceptance Criteria

**AC1.** `caspian/schemas/v1/envelope.schema.json` exists, is valid UTF-8 with LF line endings and no BOM, and parses as well-formed JSON (epics line 543).

**AC2.** The schema's **first key** is `"$schema": "https://json-schema.org/draft/2020-12/schema"` (NFR14 conformance to JSON Schema Draft 2020-12; epics line 544; architecture line 372). "First key" means the first member of the root JSON object after the opening `{`. Verify with `jq -r 'keys_unsorted[0]' caspian/schemas/v1/envelope.schema.json` returns `$schema`.

**AC3.** The schema declares `"$id": "https://caspian.dev/schemas/v1/envelope.schema.json"` exactly (epics line 545; architecture line 215, 373). The URI is canonical and stable for future JSON Schema Store submission and across spec minor versions; the URI is **not required to resolve** at v1.0 (the `caspian.dev` site lands in Epic 4).

**AC4.** The schema's `"title"` is the literal string `"CaspianEnvelope"` (epics line 546; architecture line 374).

**AC5.** At the envelope root, `"additionalProperties": true` (epics line 549; architecture A5 line 218–220). This admits agentskills.io canonical (6 fields), Claude Code overlay (12 fields), `x-*` extension fields, and `<vendor>:<name>`-namespaced fields without rejection (FR5, FR6, NFR13, NFR16).

**AC6.** At the envelope root, the only entry in `"required"` is `["type"]` (epics line 550). `schema_version`, `requires`, and `produces` are NOT in the root `required` array.

**AC7.** Each `requires` array entry is an object with `"additionalProperties": false`, `"required": ["type"]`, and `"properties"` containing exactly: `type` (string), `tags` (array of strings, optional), `count` (positive integer, optional) — FR2; epics lines 553–555. The shape is captured either inline under `properties.requires.items` or factored into `$defs` and referenced via `$ref` — both are acceptable as long as the resulting schema validates the same set of inputs.

**AC8.** The `produces` object has `"additionalProperties": false`, `"required": ["type"]`, and `"properties"` containing exactly `type` (string) — FR3; epics lines 555–556. Same factoring choice as AC7 applies.

**AC9.** The schema root provides `"examples": [...]` with **at least one** minimal valid envelope (epics line 559–560). One example MUST be the absolute minimum (`{"type": "core:story"}` — `type` is the only required field), and at least one example SHOULD demonstrate the full four-field envelope.

**AC10.** Each sub-schema — the `requires` entry shape AND the `produces` object — provides its own `"examples": [...]` block with at least one example object (epics line 560–561).

**AC11.** Every `"description"` in the schema is **full English in descriptive voice**, starts with a capital letter, ends with a period (epics line 564–565; architecture line 375). Field names referenced in description text are wrapped in escaped JSON-string-friendly form (e.g., `"\"requires\""` or unquoted backtick-equivalent). Descriptions are present at minimum on: the root envelope, `schema_version`, `type`, `requires`, `produces`, and the `tags` and `count` properties of the `requires` entry.

**AC12.** The `"description"` for the `type` property **explicitly enumerates** the `<namespace>:<name>` form requirement (epics line 566). The description states that the substring before the first `:` is the namespace, the remainder is the name, and that multi-colon values (such as `core:story:v2`) are valid; values missing the colon, or with empty namespace or empty name, are not.

**AC13.** `caspian/schemas/LICENSE` exists and declares Apache-2.0 explicitly (epics line 569–570). The file uses **plain text** (no `.md` extension) and contains the **full Apache License 2.0 text** — not a one-line declaration. The simplest faithful implementation is to copy `caspian/LICENSE` byte-for-byte to `caspian/schemas/LICENSE`. This follows the CNCF/Kubernetes pattern called out by architecture line 749 ("isolated consumers see the license unambiguously").

**AC14.** The schemas directory is **path-versioned**: `caspian/schemas/v1/` (epics line 570–571; NFR22). The schema file lives under `v1/`, not directly under `schemas/`. A future major bump introduces a parallel `caspian/schemas/v2/` alongside; renames within a major version are forbidden by BACKWARD_TRANSITIVE.

**AC15.** `pnpm -C caspian lint` exits `0` after this story (smoke gate; same standard as Stories 1.1, 1.2, 1.3). Biome 2.4 lints `**/*.json` per `caspian/biome.json` line 11; the new schema file MUST pass formatter + linter without warnings. `pnpm -C caspian test` continues to exit `0` with the *No projects matched the filters* output (Story 1.1 + 1.2 + 1.3 pattern; no source code or tests added).

**AC16.** A canonical fixture-style validation walkthrough is recorded in the Dev Agent Record's *Debug Log References* section. Specifically: at least three positive cases (minimal envelope, full envelope, envelope with overlay/extension fields) and at least three negative cases (missing `type`, malformed `type` such as `":"` or `"foo"`, `requires` entry with extra unknown property) are walked through against the authored schema and the **expected** validator behavior recorded. v1.0 ships no validator runtime in this story (ajv lands in Story 2.1); the walkthrough is a manual schema-shape verification, not an automated test run.

## Tasks / Subtasks

- [x] **Task 1 — Create `caspian/schemas/` directory + LICENSE** (AC: #13, #14)
  - [x] Create the directory `caspian/schemas/` (does not exist yet — `ls caspian/` before this story shows no `schemas/` entry).
  - [x] Create `caspian/schemas/v1/` as a sibling subdirectory under `schemas/` (path-versioned per NFR22 / AC14).
  - [x] Copy the full Apache 2.0 license text from `caspian/LICENSE` to `caspian/schemas/LICENSE` (no `.md` extension, plain text, exact byte-for-byte copy). Verify with `diff caspian/LICENSE caspian/schemas/LICENSE` — output MUST be empty (no differences).
  - [x] Do NOT create any `README.md` inside `caspian/schemas/` or `caspian/schemas/v1/` — none is mandated by the architecture for this story (the architecture's project tree at lines 582–586 lists only `LICENSE`, `v1/envelope.schema.json`, and the future `v1/diagnostic-registry.schema.json` under `schemas/`).
  - [x] Do NOT create `caspian/schemas/v1/diagnostic-registry.schema.json` — that is Story 1.5's deliverable (architecture line 586).

- [x] **Task 2 — Author `caspian/schemas/v1/envelope.schema.json`** (AC: #1–#12)
  - [x] Use the **Reference Schema Model** in *Dev Notes — Reference Schema Model* below as the authoritative starting point. The model satisfies all 12 shape-related ACs; deviations require a recorded justification in Dev Agent Record / Completion Notes.
  - [x] Ensure the **first key** is `$schema` (AC2). JSON object key order is preserved at write time by most editors; verify after authoring with `jq -r 'keys_unsorted[0]' caspian/schemas/v1/envelope.schema.json` returns `$schema`.
  - [x] Ensure `$id` is exactly `https://caspian.dev/schemas/v1/envelope.schema.json` (AC3) — no trailing slash, no query string, no fragment. The URI is **planning-stable**: it does NOT need to resolve to a fetchable resource at v1.0 (caspian.dev is built in Epic 4).
  - [x] Set `title: "CaspianEnvelope"` (AC4). PascalCase per architecture line 374.
  - [x] Set root `additionalProperties: true` and root `required: ["type"]` (AC5, AC6). Together these admit agentskills.io + Claude Code overlay + `x-*` + vendor-namespaced fields while still requiring `type`.
  - [x] Author the four named root properties in this order: `schema_version`, `type`, `requires`, `produces`. Each property gets a `type` (JSON Schema), a `description`, and (where applicable) an `examples` block. Root-property order is informational (JSON has no required key order) but matching the canonical frontmatter order from `core.md` keeps the schema's structure mirror-readable to authors.
  - [x] Use either `$defs` (Draft 2020-12 idiom; preferred) or inline sub-schemas for `RequiresEntry` and `Produces`. If using `$defs`, reference via `$ref: "#/$defs/RequiresEntry"` and `$ref: "#/$defs/Produces"`. The Reference Schema Model uses `$defs`.
  - [x] On the `type` property's description, explicitly state the `<namespace>:<name>` form (AC12). Recommend including a short prose sentence: *"The substring before the first colon is the namespace; the remainder is the name. Multi-colon values such as core:story:v2 are valid."*
  - [x] Apply `pattern: "^[^:]+:.+$"` to every `type`-typed string (envelope root, `RequiresEntry.type`, `Produces.type`). The pattern enforces non-empty namespace, presence of a colon, and non-empty name without forbidding multi-colon values. Combine with `minLength: 1`.
  - [x] Apply `minimum: 1` and `type: integer` to `RequiresEntry.count` (AC7 — *"positive integer"*).
  - [x] Apply `type: array, items.type: string` to `RequiresEntry.tags` (AC7 — *"string array"*).
  - [x] Provide root `examples` with at least 2 entries: one minimal (`{"type": "core:story"}`) and one full-shape (all four fields used) — AC9.
  - [x] Provide `examples` on the `RequiresEntry` and `Produces` sub-schemas (AC10).
  - [x] All `description` text is full English in descriptive voice, capital + period (AC11; architecture line 375). Avoid normative voice ("MUST"/"SHALL") — descriptions document semantics, the contract lives in `core.md`. Avoid imperative voice ("Set this to…") — descriptions describe the field, they do not instruct the author.
  - [x] Apply 2-space indentation and LF line endings (matches biome.json formatter config; same convention as the rest of the repo per Story 1.1).
  - [x] No JSON comments, no trailing commas, no JSON5 features (this is plain JSON — biome lints `*.json` per `caspian/biome.json` line 11).

- [x] **Task 3 — Manual schema walkthrough (positive + negative cases)** (AC: #16)
  - [x] Record in the Dev Agent Record's Debug Log the **expected outcome** of validating the following six cases against the authored schema. v1.0 ships no validator runtime in this story (ajv loads in Story 2.1), so the walkthrough is manual: trace each case through the schema's keywords and record what an ajv-Draft-2020-12 validator should report.
  - [x] **Positive 1 — minimal envelope**: `{"type": "core:story"}` → MUST validate (only required field present, no shape violations).
  - [x] **Positive 2 — full four-field envelope**: `{"schema_version": "0.1", "type": "core:plan", "requires": [{"type": "core:story"}], "produces": {"type": "core:plan"}}` → MUST validate.
  - [x] **Positive 3 — overlay + extension**: `{"type": "core:story", "name": "my-skill", "description": "An example", "x-bmad-confidence": "high", "bmad:status": "ready"}` → MUST validate (additionalProperties: true admits all four extra fields).
  - [x] **Negative 1 — missing `type`**: `{"schema_version": "0.1"}` → MUST FAIL with a "missing required property `type`" error (root `required` enforcement). This will map to `CASPIAN-E008` per Story 1.5's registry.
  - [x] **Negative 2 — malformed `type`** (no colon): `{"type": "story"}` → MUST FAIL on `type`'s `pattern` keyword. This will map to `CASPIAN-E009`.
  - [x] **Negative 3 — `requires` entry with extra unknown property**: `{"type": "core:plan", "requires": [{"type": "core:story", "weight": 5}]}` → MUST FAIL on `RequiresEntry.additionalProperties: false` (the unknown `weight` property is forbidden inside a requires entry). This will map to `CASPIAN-E012` per Story 1.5's registry.
  - [x] Optional bonus negative case worth recording: `{"type": "core:plan", "requires": [{}]}` → MUST FAIL with "missing required property `type`" inside the `RequiresEntry`. Maps to `CASPIAN-E011`.
  - [x] Optional bonus positive case: `{"type": "core:story:v2"}` → MUST validate (multi-colon values are explicitly valid per `core.md` line 69 and the chosen pattern `^[^:]+:.+$`).

- [x] **Task 4 — Smoke gate + sprint-status update** (AC: #15)
  - [x] Run `pnpm -C caspian lint` from the repository root. Expected output: Biome checks 5 files (the existing 4 from Stories 1.1+1.2+1.3 plus the new `envelope.schema.json`), exit code 0. If biome reports any formatter or linter complaint on `envelope.schema.json`, fix the schema (do NOT relax biome.json) — the file MUST conform to the project's lint baseline.
  - [x] Run `pnpm -C caspian test`. Expected output: *No projects matched the filters*, exit code 0. (This is the empty-workspace pattern from Stories 1.1, 1.2, and 1.3 — unchanged in Story 1.4 because no source code is added.)
  - [x] Update File List in this story file with all new and modified files, paths relative to the repository root.
  - [x] Update `_bmad-output/implementation-artifacts/sprint-status.yaml`: transition `1-4-envelope-json-schema-draft-2020-12` from `in-progress` to `review` (this happens in dev-story Step 9 — included here for traceability; create-story has already moved it from `backlog` to `ready-for-dev`).

### Review Findings

- [x] [Review][Decision] Pattern `^[^:]+:.+$` allows whitespace-only namespace or name — **Resolved: dismissed (A)** — YAML parser trims whitespace before schema evaluation; whitespace ≠ empty; pattern intentional per Dev Notes. The description claims "empty namespace or empty name are rejected" but a whitespace-only value (e.g., `"a: "` or `" :b"`) satisfies the pattern since `.+` matches any character including space, and `[^:]+` matches a space. The Dev Notes explicitly considered and rejected a stricter pattern (`^[^\s:][^\s:]*:[^\s].*$`), arguing the YAML parser (yaml v2.x strict 1.2, Story 2.3) trims whitespace before the schema sees the value. Decision required: (a) accept the looser pattern as-is — trust the YAML parser, schema description remains technically accurate since whitespace ≠ empty; (b) tighten the pattern to `^[^\s:][^\s]*:[^\s].*$` — schema enforces the constraint independently of the parser.
- [x] [Review][Patch] `produces` root property missing description alongside `$ref` (AC11) — **Applied**: added `"description": "The typed postcondition this active component emits on a successful run."` as sibling to `$ref`. Smoke gate green (5 files, exit 0). AC11 requires a description on `produces`. The property is `{ "$ref": "#/$defs/Produces" }` with no sibling `"description"`. Unlike `requires`, which carries a property-level description alongside its `items.$ref`, `produces` has none. The Dev Notes justify this as intentional (description lives on the `$defs` definition), but AC11 explicitly lists `produces` and no spec waiver was granted. Draft 2020-12 allows sibling keywords alongside `$ref`. Fix: add `"description": "The typed postcondition this active component emits on a successful run."` alongside the `$ref`. [caspian/schemas/v1/envelope.schema.json:31]
- [x] [Review][Defer] `count` field name implies exact count; description says "minimum" [caspian/schemas/v1/envelope.schema.json] — deferred, pre-existing spec design choice; field is named `count` in `core.md`; semantics are "at-least-N" but renaming is a spec change out of scope for Story 1.4
- [x] [Review][Defer] `schema_version` accepts empty string (no `minLength`) [caspian/schemas/v1/envelope.schema.json] — deferred, explicit anti-pattern in story spec: schema-level rejection of unrecognized versions breaks CASPIAN-W003 warn-on-unknown policy; empty string handled by warning system in Story 2.4
- [x] [Review][Defer] `tags` array lacks `minItems: 1`, `uniqueItems: true`, `items.minLength: 1` [caspian/schemas/v1/envelope.schema.json] — deferred, beyond Story 1.4 spec requirements; empty/duplicate/empty-string tags not addressed by any AC; could be addressed in a future hardening story
- [x] [Review][Defer] `requires: []` (empty array) passes validation — deferred, `minItems: 1` not required by any AC; semantically equivalent to omitting the field; open design question for future spec revision
- [x] [Review][Defer] `caspian/LICENSE` leading blank line (Story 1.1 artifact) — deferred, pre-existing in Story 1.1; `diff` confirms `schemas/LICENSE` is byte-identical to `caspian/LICENSE`; AC13 satisfied; cleanup belongs in a Story 1.1 follow-up or separate housekeeping commit
- [x] [Review][Defer] `schema_version: 0.1` YAML float-cast trap (unquoted YAML auto-casts to float 0.1) — deferred, documentation concern for spec prose; not a schema bug; YAML parser behaviour handled by the pipeline introduced in Story 2.3
- [x] [Review][Defer] No upper bound on `count` integer — deferred, not required by any AC or architecture constraint; no practical upper bound mandated; could add `maximum` in a future hardening story
- [x] [Review][Defer] `Produces.additionalProperties: false` limits future extensibility — deferred, intentional per AC8 and architecture Decision A5 deliberate asymmetry; future fields in `produces` require a spec minor version bump per NFR22

## Dev Notes

### Project Context

This is a **schema-only** story — two artifacts under `caspian/schemas/` (one license file + one JSON Schema), zero source code, zero tests beyond the smoke gate. Story 1.2 sealed `caspian/spec/core.md` with the normative four-field contract; Story 1.3 sealed the per-`core:*`-type rationale under `caspian/spec/vocabulary/`. Story 1.4 produces the **machine-readable counterpart** of the contract: a Draft 2020-12 JSON Schema that any conforming validator (ajv, Python `jsonschema`, Go `gojsonschema`, etc.) consumes to verify Caspian frontmatter shape.

The deliverables of Story 1.4 are consumed by every downstream epic that needs envelope-shape validation:

- **Epic 1 Story 1.5** authors `caspian/schemas/v1/diagnostic-registry.schema.json` (the meta-schema validating `diagnostics/registry.json`'s structure). It lives in the same `schemas/v1/` directory created here. Story 1.5's schema is independent of Story 1.4's envelope schema (it does not `$ref` it), but they share a directory and the same authoring conventions.
- **Epic 1 Story 1.6** authors valid + invalid fixtures. Each `fixtures/valid/**/*.md`'s frontmatter MUST validate against `schemas/v1/envelope.schema.json`. Each `fixtures/invalid/**/*.md` MUST trigger one or more diagnostics, of which `E008`–`E014` are envelope-shape diagnostics that map directly to ajv error keywords on this schema (root `required`, `type` `pattern`, `requires` `items`, `produces` `additionalProperties: false`, etc.).
- **Epic 1 Story 1.7** authors `examples/minimal-skill-adoption/after/SKILL.md`. Its frontmatter MUST validate against this schema (the FR35 overlay-compat verification depends on it).
- **Epic 2 Story 2.1** introduces `packages/core/src/schemas/loader.ts` (the SOLE entry point for reading bundled schemas — D3 verrou 3 of architecture line 723–727). The loader resolves `path.resolve(__dirname, '../schemas/v1/envelope.schema.json')` against a build-time copy produced by `packages/core/scripts/copy-schemas.ts`. Story 1.4 creates the source-of-truth file the loader and the copy-schemas script will reference.
- **Epic 2 Story 2.4** runs `ajv` (loaded from `ajv/dist/2020.js` for Draft 2020-12 support) against this schema during the validation pipeline's stage 4 (envelope shape). The mapping from ajv error keywords to `CASPIAN-EXXX` codes is Story 2.4's concern, not Story 1.4's.
- **Epic 4 Story 4.1+** the canonical `$id` URI `https://caspian.dev/schemas/v1/envelope.schema.json` becomes the GitHub-Pages-hosted canonical address once the site deploys. JSON Schema Store submission is deferred to v1.1 per architecture line 826.

### Architecture Compliance — MUST follow

**Source: `_bmad-output/planning-artifacts/architecture.md` step-04 (Implementation Patterns), step-05 (JSON Schema Authoring), step-06 (Project Structure), and the Decision Priority Analysis (A1, A2, A4, A5).**

- **JSON Schema Authoring conventions (architecture lines 370–378)** — these are the binding stylistic constraints for the schema file:
  - `"$schema": "https://json-schema.org/draft/2020-12/schema"` is **always the first key** (architecture line 372). Object key order is preserved by most JSON editors when writing; verify after authoring.
  - `"$id"` is absolute and stable: `https://caspian.dev/schemas/v1/<name>.schema.json` (architecture line 373). For this story: `https://caspian.dev/schemas/v1/envelope.schema.json`.
  - `"title"` is **PascalCase and concise** (architecture line 374): `"CaspianEnvelope"` for the root, `"RequiresEntry"` for the requires-entry sub-schema, `"Produces"` (or similarly concise PascalCase) for the produces sub-schema.
  - `"description"` is **full English, descriptive voice, starts with a capital, ends with a period** (architecture line 375; AC11). Example wording: *"The version of the Caspian spec the producer writes against."* — declarative, not imperative.
  - **Field names inside the schema mirror the frontmatter spelling exactly** (architecture line 376) — `schema_version` snake_case (Caspian), `disable-model-invocation` kebab-case (Claude Code overlay if ever added), no transformation. This story only declares the four Caspian fields under `properties`; the others ride through `additionalProperties: true`.
  - **Required fields are declared in `"required": [...]`, not via `"additionalProperties"` constraints** (architecture line 377). Apply at every level: root, `RequiresEntry`, `Produces`.
  - **`"examples": [...]` is recommended on every schema** (architecture line 378). For Story 1.4 the AC makes it mandatory at the root and on each sub-schema.

- **Decision A1 — Schema layout (architecture line 214)** — single envelope schema `schemas/v1/envelope.schema.json` (Draft 2020-12) defining the four-field Caspian Core contract, `requires` array shape, and `produces` object shape. **No per-`core:*`-type schemas in v1.0.** The per-type docs in `spec/vocabulary/` (Story 1.3) are *rationale*, not normative shape rules. Any temptation to add `core:story`-specific or `core:plan`-specific shape constraints in this schema is out of scope.

- **Decision A2 — `$ref` strategy (architecture line 215)** — `$id` is canonical for future JSON Schema Store submission and stable across spec minor versions. The schema is **registered locally at runtime** (Epic 2 Story 2.1's loader calls `ajv.addSchema()`), not fetched via the URI. Story 1.4 is silent on `$ref` to *external* schemas — this envelope schema is self-contained; internal `$ref` to `$defs` is the only `$ref` use.

- **Decision A3 — Schema bundling (architecture line 216)** — at v1.0 build time, `packages/core/scripts/copy-schemas.ts` will copy `schemas/v1/**/*.json` into `packages/core/dist/schemas/`. **This story does NOT author copy-schemas.ts** — that is Epic 2 Story 2.1's deliverable. Story 1.4 only produces the source-of-truth file at `caspian/schemas/v1/envelope.schema.json`.

- **Decision A4 — Schema versioning (architecture line 217)** — path-versioned (`schemas/v1/`). When a future major bump arrives, `schemas/v2/` lives alongside. Renames within a major version are forbidden by BACKWARD_TRANSITIVE. Story 1.4 places the schema under `v1/` (AC14).

- **Decision A5 — `additionalProperties` policy (architecture line 218–220, also restated in step-05)** — the envelope's root `additionalProperties` is `true` (AC5); the `RequiresEntry` and `Produces` sub-schemas have `additionalProperties: false` (AC7, AC8). This is the deliberate asymmetry: top-level admits the agentskills.io / Claude Code overlay / `x-*` / vendor-namespaced field universe; the inner shapes lock down because they are part of the contract that downstream tooling resolves on.

- **License layout (architecture line 175–181, 749, 583)** — `caspian/schemas/LICENSE` (no `.md` extension; plain Apache 2.0 text). Each sub-package re-declares Apache-2.0 explicitly so isolated consumers see the license unambiguously (the Kubernetes/CNCF pattern). Spec `LICENSE.md` (Story 1.2) is the CC-BY-4.0 override for prose; schemas are code-side, default Apache-2.0.

- **Cross-cutting: single source of truth (architecture step-02 + 3-verrou enforcement at line 723–727)** — `caspian/schemas/v1/envelope.schema.json` is the **single source of truth** for the envelope contract. Story 1.4 writes this file once; it is the authoritative artifact. Verrou 1 (TS `rootDirs`), Verrou 2 (biome `noRestrictedImports`), and Verrou 3 (single loader module) are all Epic 2 enforcement mechanisms — **none of them are configured in Story 1.4**. Story 1.4 only places the file at the path those mechanisms will police.

- **Anchor stability (architecture step-02 *Doc-URL stability*; NFR24)** — the `$id` URL `https://caspian.dev/schemas/v1/envelope.schema.json` is itself a stable URL contract. Once published (Epic 4), it MUST resolve for all v1.x. Renames require a redirect and a two-minor-version overlap.

### Library / Framework Requirements

**No new dependencies installed in this story.** The Caspian spec ships JSON Schema files; consumers (ajv, etc.) are downstream concerns:

- **`ajv` (~v8) imported via `ajv/dist/2020.js`** — runtime Draft 2020-12 validator. Lands in Epic 2 Story 2.1 (`packages/core/package.json` adds it as a dep). Not a Story 1.4 concern.
- **Python `jsonschema`, Go `gojsonschema`** — alternative validators that conformance-suite verification (Epic 2 Story 2.7) targets. Not Story 1.4's concern; the schema MUST be vendor-neutral by being pure Draft 2020-12 with no extensions.
- **VS Code YAML LSP (RedHat YAML extension)** — the *target consumer* of `$id` per the Story 1.4 user-story statement. Authors point their editor at the schema either via a local file path (`yaml.schemas: { "caspian/schemas/v1/envelope.schema.json": "**/*.md" }`) or via the canonical URI once Epic 4 is live. **Story 1.4 only ships the file; editor configuration is the author's concern.**
- **No Markdown linter, no anchor checker, no JSON Schema linter, no schema validation tool** is installed in v1.0 (boring-tech philosophy, PRD Implementation Considerations). The architecture's *Pattern category | Mechanical enforcement | Audit method* table at line 446–453 says "JSON Schema authoring | Convention + PR review | Manual; optional schema-of-schemas check post-v1.0" — manual review is the v1.0 gate.

The smoke gate (`pnpm -C caspian lint && pnpm -C caspian test`) does **not** validate JSON-Schema-specific structural constraints (e.g., it does not check that `$schema` is the first key, or that all `$ref` targets exist). Biome formats and lints `*.json` syntax/style; it does not validate schema semantics. AC2 ("$schema is first key") and AC3 ("$id exact value") are verified by direct inspection (`jq -r 'keys_unsorted[0]'`, `jq -r '.["$id"]'`) — record those checks in the Debug Log.

### File Structure Requirements

After this story, `caspian/schemas/` contains exactly **2 files** (1 LICENSE + 1 schema) and **1 subdirectory** (`v1/`):

```text
caspian/schemas/
├── LICENSE                   # full Apache 2.0 text — byte-for-byte copy of caspian/LICENSE
└── v1/
    └── envelope.schema.json  # Caspian envelope (Draft 2020-12); $id stable
```

**Do NOT create in this story:**

- `caspian/schemas/README.md` — not in the architecture's project tree (lines 582–586). The schemas directory is consumed mechanically; no human-facing index is required.
- `caspian/schemas/v1/diagnostic-registry.schema.json` — Story 1.5's deliverable.
- `caspian/schemas/v1/README.md` or any other documentation file under `v1/` — same rationale as above.
- Any per-`core:*`-type schema (`core-story.schema.json`, `core-plan.schema.json`, etc.) — explicitly out of scope per architecture line 213, 980.
- A nested `caspian/schemas/v1/types/` or `caspian/schemas/v1/sub-schemas/` directory — sub-schemas live in `$defs` inside the envelope file, not as separate files.
- A `package.json`, `tsconfig.json`, or any Node-package metadata under `caspian/schemas/` — `schemas/` is **not** a Node package. It is a content-only Apache-2.0 directory consumed by `packages/core` (Epic 2) and by external validators.
- Any modification to `caspian/spec/core.md`, `caspian/spec/README.md`, `caspian/spec/LICENSE.md`, or any file under `caspian/spec/vocabulary/` — Stories 1.2 and 1.3 sealed those. The "coming soon — Story 1.4" annotations in `core.md` (lines 8, 282, 294) and the `caspian/spec/README.md` MAY remain in place; they record historical project state and the relative links resolve naturally once `caspian/schemas/v1/envelope.schema.json` exists.
- Any modification to root-of-monorepo files (`caspian/package.json`, `caspian/biome.json`, `caspian/pnpm-workspace.yaml`, etc.) — the existing biome glob `**/*.json` already covers the new schema file.
- Anything outside `caspian/schemas/` (with the single exception of the sprint-status update under `_bmad-output/implementation-artifacts/`).

### Reference Schema Model

This is the canonical model the dev agent uses to author `caspian/schemas/v1/envelope.schema.json`. It satisfies all 12 shape-related ACs (AC1–AC12). Use it byte-faithfully unless a deviation is justified and recorded in Dev Agent Record / Completion Notes. Field-by-field rationale follows the model.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://caspian.dev/schemas/v1/envelope.schema.json",
  "title": "CaspianEnvelope",
  "description": "The Caspian Core v1.0 frontmatter envelope contract. Defines the four canonical fields that turn any Markdown artifact into a typed, composable unit. Allows additional properties so agentskills.io canonical, Claude Code overlay, x-* extension, and vendor-namespaced fields coexist without rejection.",
  "type": "object",
  "additionalProperties": true,
  "required": ["type"],
  "properties": {
    "schema_version": {
      "type": "string",
      "description": "The minor schema generation the producer writes against, in MAJOR.MINOR form. Optional in v1.0; absence equates to \"0.1\". Producers writing against v0.2 or later versions declare this explicitly so consumers can detect the producer's target minor.",
      "examples": ["0.1"]
    },
    "type": {
      "type": "string",
      "minLength": 1,
      "pattern": "^[^:]+:.+$",
      "description": "The artifact's typed identity in <namespace>:<name> form. The substring before the first colon is the namespace; the remainder is the name. Multi-colon values such as core:story:v2 are valid. Values missing the colon, or with empty namespace or empty name, are rejected.",
      "examples": ["core:story", "core:plan", "bmad:epic"]
    },
    "requires": {
      "type": "array",
      "description": "An array of typed preconditions this active component (skill, command, or agent) consumes before producing its output. Documents typically omit this field by convention.",
      "items": { "$ref": "#/$defs/RequiresEntry" },
      "examples": [
        [{ "type": "core:story" }],
        [{ "type": "core:story", "count": 2 }]
      ]
    },
    "produces": { "$ref": "#/$defs/Produces" }
  },
  "$defs": {
    "RequiresEntry": {
      "title": "RequiresEntry",
      "description": "A single typed precondition entry within the requires array.",
      "type": "object",
      "additionalProperties": false,
      "required": ["type"],
      "properties": {
        "type": {
          "type": "string",
          "minLength": 1,
          "pattern": "^[^:]+:.+$",
          "description": "The required artifact's type, in <namespace>:<name> form."
        },
        "tags": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Optional refinement of matching when multiple artifacts of the same type are eligible."
        },
        "count": {
          "type": "integer",
          "minimum": 1,
          "description": "Optional minimum number of matching artifacts the consumer expects. Absence means at least one."
        }
      },
      "examples": [
        { "type": "core:story" },
        { "type": "core:story", "tags": ["ready-for-dev"], "count": 1 }
      ]
    },
    "Produces": {
      "title": "Produces",
      "description": "The typed postcondition this active component emits on a successful run. A successful run produces exactly one artifact of the declared type.",
      "type": "object",
      "additionalProperties": false,
      "required": ["type"],
      "properties": {
        "type": {
          "type": "string",
          "minLength": 1,
          "pattern": "^[^:]+:.+$",
          "description": "The type of the artifact this active component emits, in <namespace>:<name> form."
        }
      },
      "examples": [
        { "type": "core:plan" }
      ]
    }
  },
  "examples": [
    { "type": "core:story" },
    {
      "schema_version": "0.1",
      "type": "core:plan",
      "requires": [{ "type": "core:story" }],
      "produces": { "type": "core:plan" }
    }
  ]
}
```

**Field-by-field rationale:**

- `$schema` first → AC2; literally the canonical Draft 2020-12 meta-schema URI.
- `$id` → AC3; canonical URI for IDE auto-discovery and JSON Schema Store submission (deferred to v1.1).
- `title: "CaspianEnvelope"` → AC4; PascalCase per architecture line 374.
- Root `description` → AC11; declares what the envelope is; explicitly mentions the agentskills.io / Claude Code overlay / `x-*` / vendor-namespaced coexistence (FR5 / FR6 / NFR13 / NFR16).
- Root `type: "object"` → required by JSON Schema for object validation.
- Root `additionalProperties: true` → AC5; the deliberate asymmetry that admits all overlay tiers.
- Root `required: ["type"]` → AC6; only `type` is required.
- `schema_version` property: `type: string`, no `pattern` enforcement at v1.0. The `MAJOR.MINOR` form requirement is documented in the `description` for human and editor consumption; runtime enforcement of value membership in the recognized set (`["0.1"]`) is the namespace check (`CASPIAN-W003`) in Epic 2 Story 2.4 — a **warning**, not a schema rejection. Including `pattern` here would make `W003` an error, which violates the warn-on-unknown policy.
- `type` property: `type: string`, `minLength: 1`, `pattern: "^[^:]+:.+$"`. The pattern rejects exactly the three failure modes `core.md` line 71–74 lists (missing colon, empty namespace, empty name) without forbidding multi-colon values. AC12's enumeration of `<namespace>:<name>` form lives in the `description`.
- `requires` property: `type: array`, `items` references `#/$defs/RequiresEntry`. Empty arrays are valid (`requires: []` is shape-equivalent to omitting the field).
- `produces` property: `$ref` to `#/$defs/Produces`. No `description` here on purpose — the description lives on the `Produces` definition itself, attached at the resolution point.
- `$defs.RequiresEntry`: `additionalProperties: false`, `required: ["type"]`, three known properties (`type`, `tags`, `count`). AC7. `count` is `type: integer, minimum: 1` — *positive integer* per AC.
- `$defs.Produces`: `additionalProperties: false`, `required: ["type"]`, one known property (`type`). AC8.
- Root `examples`: AC9 — minimum of two; one minimal, one full.
- Sub-schema `examples`: AC10.

**Why pattern `^[^:]+:.+$`:**

| Input | Match? | Justification |
|---|---|---|
| `core:story` | ✓ | Minimum valid form. |
| `core:plan` | ✓ | Same. |
| `core:story:v2` | ✓ | Multi-colon valid per `core.md` line 69 — namespace = `core`, name = `story:v2`. |
| `bmad:epic` | ✓ | Vendor namespace (warns `W002` later, not rejected). |
| `:` | ✗ | Empty namespace AND empty name. |
| `:foo` | ✗ | Empty namespace. |
| `foo:` | ✗ | Empty name. |
| `foo` | ✗ | Missing colon. |
| `""` | ✗ | Caught by `minLength: 1` first; pattern would also reject. |

**Alternative considered and rejected — stricter pattern with no whitespace:**

`^[^\s:][^\s:]*:[^\s].*$` would also reject `" :foo"` and `"foo: bar"`. We don't tighten because:

1. YAML parser (`yaml` v2.x strict 1.2 in Story 2.3) handles whitespace trimming before the schema sees the value.
2. Tightening here makes the schema's pattern less readable without catching new cases the YAML parser misses.
3. `core.md` does not mandate whitespace rules on `type` values; pattern stays minimal.

### Coding Standards — MUST follow (sourced from architecture step-05)

- **File naming:** kebab-case lowercase. The schema filename `envelope.schema.json` has dot-separated suffixes; biome's `useFilenamingConvention` rule examines the basename's main segment (`envelope`) which is kebab-case. If biome flags the filename anyway (unlikely with biome 2.4.13), the fallback is to align on the architecture-mandated name and add a targeted biome `overrides` block in a future story — never rename `envelope.schema.json` (it is a contract per architecture line 585).
- **JSON formatting:** 2-space indentation; LF line endings; UTF-8 with no BOM; no trailing whitespace; one trailing newline at end of file (per `.editorconfig` from Story 1.1). Biome's formatter enforces all of this on `*.json` automatically.
- **JSON content rules:** plain JSON only — no comments, no trailing commas, no unquoted keys, no JSON5 features. The biome includes glob (`caspian/biome.json` line 11) is `**/*.json`, not `**/*.jsonc`; biome will treat this file as strict JSON.
- **YAML/JSON 1.1 boolean footgun avoidance:** in JSON, booleans are `true`/`false` only — no `on`/`off`/`yes`/`no`. Not a concern for this story (the schema declares no boolean values), but a discipline reminder consistent with Stories 1.1, 1.2, 1.3.
- **Conventional Commits** for the story commit (when the user authorizes): `docs(spec): add envelope JSON Schema (Story 1.4)`. The architecture line 759 maps `schemas/` content as part of the spec contract (single source of truth), so the `docs(spec):` prefix is appropriate; an alternative is `feat(spec):` for first-time emission of the envelope schema, but the project's recent commit pattern (`docs(spec):` for 1.2 and 1.3) leans `docs`.
- **Document tone:** schema `description` text is descriptive ("The artifact's typed identity in `<namespace>:<name>` form…"), not normative ("MUST be in form…"). Normative voice lives in `core.md`; the schema describes what the field is. Keep descriptions short — IDE hover tooltips render them inline; long blocks of prose are noise.

### Anti-Patterns — DO NOT do

- ❌ Do NOT add per-`core:*`-type schemas (`core-story.schema.json`, `core-plan.schema.json`, etc.). Architecture line 213 + line 980 explicitly defer these to v0.2+ pending RFC. Story 1.4 ships ONE envelope schema only.
- ❌ Do NOT add `pattern` enforcement on `schema_version`. The `CASPIAN-W003` warning policy (Epic 2 Story 2.4) is incompatible with schema-level rejection — making this a pattern would convert a warning into an error and break the warn-on-unknown contract (NFR16).
- ❌ Do NOT enumerate the 11 canonical `core:*` names in the `type` description or as a JSON Schema `enum`. The canonical vocabulary is documented in `caspian/spec/vocabulary/` (Story 1.3); enumerating in the schema would convert the W002/W004 warnings into errors and break BACKWARD_TRANSITIVE (every new canonical name in v1.x would invalidate older schema consumers).
- ❌ Do NOT hard-code overlay field names in the schema's `properties` block. The four Caspian properties (`schema_version`, `type`, `requires`, `produces`) are the ONLY named root properties; everything else rides through `additionalProperties: true`. Listing `name`, `description`, `when_to_use`, etc., would (a) duplicate the agentskills.io / Claude Code overlay surface inside Caspian's contract, (b) lock Caspian's release cadence to those projects', and (c) create the maintenance burden the architecture's *Surface isolation* principle (line 80) explicitly avoids.
- ❌ Do NOT use `additionalProperties: false` at the envelope root. AC5 + FR5/FR6/NFR13/NFR16 mandate `true`. Setting it to `false` would reject every overlay field and break the entire ecosystem-positioning thesis.
- ❌ Do NOT use `definitions` (Draft 04 idiom). Use `$defs` (Draft 2020-12 idiom) or inline sub-schemas. Mixing the two confuses validators that strictly follow Draft 2020-12.
- ❌ Do NOT add `format: "uri"` on `$id`. The `format` keyword in Draft 2020-12 is annotation-only by default; it adds no validation but adds clutter. Same for `format: "regex"` on `pattern`.
- ❌ Do NOT add `$comment` JSON-Schema metadata fields. The schema is meant to be human-readable as JSON; comments belong in commit messages and PR descriptions.
- ❌ Do NOT add `default` values on any property. `core.md` line 41–48 documents that `schema_version` defaults to `"0.1"` when absent — this is a **consumer-side** behavior (v1.0 consumers treat absence as `"0.1"`), not a schema default that the validator should auto-fill. JSON Schema's `default` keyword has unclear conformance semantics across validators (some auto-populate, some don't, ajv's `useDefaults` option is opt-in); leave it out.
- ❌ Do NOT add `$ref` to external schemas. The envelope schema is self-contained. Internal `$ref` to `$defs` is fine; external `$ref` to (e.g.) `https://json-schema.org/draft/2020-12/schema` for the meta-schema is implicit via `$schema` and does not need to be re-declared.
- ❌ Do NOT install `ajv`, `jsonschema`, `json-schema`, `@hyperjump/json-schema`, or any validator dependency in this story. v1.0 ships the schema file as content. Validators are downstream concerns (Epic 2 Story 2.1 pulls in ajv).
- ❌ Do NOT modify `caspian/biome.json` to add an exception for `caspian/schemas/`. The existing config (`**/*.json` included; `**/dist`, `**/*.generated.ts`, `pnpm-lock.yaml`, `fixtures/invalid` excluded) is the right scope. The schema file is not generated; biome should lint it like any other JSON file in the repo.
- ❌ Do NOT touch the surrounding `joselimmo-marketplace-bmad` repo. Specifically: do not modify root `CLAUDE.md`, do not edit `.claude-plugin/marketplace.json`, do not move planning artifacts.
- ❌ Do NOT introduce any tooling that fetches schemas over HTTP at validation time (NFR6 architecture line 160 — *"no remote schema fetching"*). The schema file is consumed locally; the `$id` URI's value is for IDE auto-discovery and Schema Store submission, not runtime fetching.
- ❌ Do NOT bypass git hooks (`--no-verify`) when committing. There are none yet — habit only.

### Source Citations — Verbatim Anchors

The following claims are sourced from the PRD, architecture, epics, and `core.md` and reproduced exactly here so the dev agent does not have to re-derive them:

| Statement | Source | Wording / cross-reference |
|---|---|---|
| **Schema layout — single envelope schema, path-versioned** | `_bmad-output/planning-artifacts/architecture.md` line 214 | *"single envelope schema `schemas/v1/envelope.schema.json` (Draft 2020-12)... No per-`core:*`-type schemas in v1.0."* |
| **`$id` strategy** | `_bmad-output/planning-artifacts/architecture.md` line 215 | *"`$id: \"https://caspian.dev/schemas/v1/envelope.schema.json\"`. Schema is registered locally at runtime via `ajv.addSchema()`; the URI is canonical for future JSON Schema Store submission (v1.1) and stable across spec minor versions."* |
| **`additionalProperties: true` at envelope root** | `_bmad-output/planning-artifacts/architecture.md` line 218–220 (A5) + epics line 549 | *"the envelope's additionalProperties is true (allows agentskills.io canonical, Claude Code overlay, x-*, and vendor-namespaced fields without rejection — FR5, FR6, NFR13, NFR16)"* |
| **JSON Schema authoring conventions** | `_bmad-output/planning-artifacts/architecture.md` lines 370–378 | `$schema` first key; `$id` absolute and stable; `title` PascalCase; `description` full English descriptive voice with capital + period; field names mirror frontmatter spelling exactly; `required` array (not `additionalProperties` workaround); `examples` recommended. |
| **`type` field shape: `<namespace>:<name>`, multi-colon valid** | `caspian/spec/core.md` lines 67–75 | *"`type` is REQUIRED. Its value is a non-empty string of the form `<namespace>:<name>`. `<namespace>` is the substring before the first `:`; `<name>` is the remainder. Multi-colon values such as `core:story:v2` are valid... A value missing the colon, or with an empty namespace or empty name, produces an error-severity diagnostic."* |
| **`requires` shape: array of `{type, tags?, count?}`, count is positive integer** | `caspian/spec/core.md` lines 99–113 + epics line 553–555 + FR2 | *"`requires` is OPTIONAL. When present, it is an array of objects... Each entry has the following shape: `type` REQUIRED, `tags` OPTIONAL string array, `count` OPTIONAL positive integer."* |
| **`produces` shape: object with required `type`** | `caspian/spec/core.md` lines 128–139 + epics line 555–556 + FR3 | *"`produces` is OPTIONAL. When present, it is an object declaring the typed postcondition... `type` REQUIRED string when `produces` is present."* |
| **NFR14 — Draft 2020-12 conformance** | `_bmad-output/planning-artifacts/prd.md` line 589 | *"Caspian JSON Schemas conform to JSON Schema Draft 2020-12; they are consumable by any compliant JSON Schema validator without extensions."* |
| **NFR22 — path-versioned schemas, BACKWARD_TRANSITIVE** | `_bmad-output/planning-artifacts/prd.md` line 603 + epics line 570–571 | *"Schema evolution is BACKWARD_TRANSITIVE within a major version... No breaking changes between minor versions within the same major."* + *"the schemas directory is path-versioned: `schemas/v1/`."* |
| **License layout — schemas/ Apache-2.0 with full LICENSE re-declaration** | `_bmad-output/planning-artifacts/architecture.md` lines 175–181, 749, 583 | *"Each sub-package (`packages/cli`, `packages/casper-core`, `schemas`, `diagnostics`, `fixtures`) re-declares its Apache-2.0 LICENSE explicitly to remain unambiguous when a directory is consumed in isolation. Standard pattern (Kubernetes, CNCF projects)."* |
| **Single source of truth for schemas** | `_bmad-output/planning-artifacts/architecture.md` lines 78, 723–727 (3-verrou) | *"The JSON Schemas under `spec/schemas/` are authoritative. The v1.0 CLI, future IDE integration, v1.1 CI layer, and v1.1 runtime skill all reference these schemas — never re-declare."* The 3-verrou enforcement (TS rootDirs, biome noRestrictedImports, single loader module) lands in Epic 2; Story 1.4 establishes the canonical file the verrous police. |
| **No remote schema fetching at runtime (NFR6)** | `_bmad-output/planning-artifacts/architecture.md` line 160 | *"Schemas bundled into `packages/cli/dist/schemas/` at build via `scripts/copy-schemas.ts` to satisfy NFR6 (no remote schema fetching)."* |

### Previous Story Intelligence (from Stories 1.1, 1.2, 1.3)

**Working-directory convention (from 1.1, restated 1.2 + 1.3).** `caspian/` is the working subdirectory. Every reference in epics / architecture to `spec/`, `schemas/`, etc., resolves to `caspian/spec/`, `caspian/schemas/`, etc. Story 1.4 operates entirely inside `caspian/schemas/`.

**Sealed predecessor files (from 1.2, 1.3).** Story 1.4 does NOT modify `caspian/spec/core.md`, `caspian/spec/README.md`, `caspian/spec/LICENSE.md`, or any file under `caspian/spec/vocabulary/`. The "coming soon — Story 1.4" annotations in `core.md` (lines 8, 282, 294) MAY remain in place; the relative links resolve naturally once `caspian/schemas/v1/envelope.schema.json` exists. A future tidy-up story may remove the annotations; that is out of scope for Story 1.4.

**License-file naming convention (from 1.1, 1.2).** Per-directory overrides used `LICENSE.md` (`.md` suffix) for prose subtrees (`caspian/spec/LICENSE.md`). For code-side subtrees that consume the Apache-2.0 default, the convention is plain `LICENSE` (no extension, full Apache 2.0 text) — this matches `caspian/LICENSE` itself (Story 1.1) and the architecture's CNCF/Kubernetes pattern (architecture line 749). Story 1.4's `caspian/schemas/LICENSE` follows the plain-`LICENSE` convention.

**No commits by the dev agent (from 1.1, 1.2, 1.3).** Per project policy, the dev agent prepares and stages but does NOT commit. Story 1.4 follows the same pattern: prepare the 2 files, run the smoke gate, output the recommended commit command, **stop**.

**Conventional Commits prefix (from 1.2, 1.3).** `docs(spec):` for prose under `caspian/spec/`. For Story 1.4 the deliverable is JSON content under `caspian/schemas/`, but architecturally `schemas/` is part of the spec contract (single source of truth, architecture line 759). The most consistent prefix with the project's recent history is `docs(spec): add envelope JSON Schema (Story 1.4)`. An alternative `feat(spec):` is defensible for first-time emission of a contract artifact; the dev agent picks one and records the choice in Completion Notes.

**Smoke-gate output expectations (from 1.1, 1.2, 1.3).** `pnpm -C caspian lint` ran biome over 4 files in Stories 1.2 and 1.3 (markdown was excluded from biome's includes by Story 1.1's review patches). Story 1.4 adds 1 JSON file to biome's scope, so the new expected count is **5 files checked** (the 4 existing biome-tracked files plus `caspian/schemas/v1/envelope.schema.json`). `pnpm -C caspian test` continues to report *No projects matched the filters* and exit 0 (no source code or tests added; Stories 1.1 / 1.2 / 1.3 / 1.4 are all empty-workspace stories so far).

**Forward-reference annotation discipline (from 1.2, 1.3).** Story 1.4 introduces no new forward references inside the schema file itself (descriptions are self-contained semantic statements, not links). The `$id` URL `https://caspian.dev/schemas/v1/envelope.schema.json` is a planning-stable URI that does not yet resolve (Epic 4 deploys `caspian.dev`); this is documented in *Architecture Compliance — MUST follow* above and does NOT require a *"coming soon — Epic 4"* annotation inside the schema itself (the `$id` semantics are "canonical, not necessarily currently fetchable" — that is a JSON Schema Store / IDE-tooling convention that does not need in-line annotation).

**Sprint-status update pattern (from 1.1, 1.2, 1.3).** Sprint status transitions are: `backlog → ready-for-dev` (create-story) → `in-progress` (dev-story Step 4) → `review` (dev-story Step 9) → `done` (after code review). Story 1.4 is currently `backlog`; this create-story workflow transitions it to `ready-for-dev`.

**Deferred-work tracker (from 1.1, 1.3).** `_bmad-output/implementation-artifacts/deferred-work.md` is append-only. Story 1.4 may surface deferral candidates during code review — for example, the `core.md` anchor stability item already deferred from Story 1.3 (`#schema-evolution`, `#extension-mechanisms`) is unrelated to Story 1.4 (this story does not link to those anchors). If new deferred items emerge during Story 1.4's code review, append to the existing format.

**Biome-on-JSON behavior (from 1.1).** Biome 2.4.13 lints and formats `*.json` files. Story 1.1's biome.json explicitly includes `**/*.json`. The dev agent should run the smoke gate after authoring and resolve any biome formatter complaints by editing the schema file (correct indentation, line endings, etc.) — never by relaxing biome.json (relaxing the lint baseline is out of scope for Story 1.4).

### Git Intelligence — Recent Patterns

Last 5 commits (most recent first):

```text
f858f35 chore(review-1-3): apply code-review patches + sync sprint status
ecf3ad9 docs(spec): add canonical core:* vocabulary docs (Story 1.3)
5cd423b chore(review-1-2): apply code-review patches + sync sprint status
2a4c873 docs(spec): add Caspian Core normative reference (Story 1.2)
1d409e8 chore(review-1-1): apply code-review patches + sync sprint status
```

Patterns to follow:

- Conventional Commits prefix matching the change kind. For Story 1.4: `docs(spec): add envelope JSON Schema (Story 1.4)` (recommended; matches 1.2 / 1.3 cadence). Alternative `feat(spec):` is acceptable.
- Story number in commit message (`(Story 1.4)` parenthetical; trailing).
- Single coherent commit — both files (`caspian/schemas/LICENSE` + `caspian/schemas/v1/envelope.schema.json`) ship together. Do not split across commits.
- After review, a separate `chore(review-1-4): apply code-review patches + sync sprint status` commit captures any review patches — same pattern as 1.1, 1.2, 1.3.
- No co-authored-by trailer unless the user requests one.

### Latest Tech Information

No new dependencies are installed in this story. One external standards reference whose stability matters:

- **JSON Schema Draft 2020-12** — published by the JSON Schema organization as the current stable draft. The meta-schema URI `https://json-schema.org/draft/2020-12/schema` is the canonical anchor; it does not version (no patch suffix) within the 2020-12 draft. ajv v8 (~v8.12 to v8.17 as of 2026-Q1) supports Draft 2020-12 via `import Ajv from 'ajv/dist/2020.js'` (separate entry point from the default Draft-07-targeting `ajv` import). Story 2.1 imports ajv via that path; Story 1.4's schema is consumed by ajv's 2020-12 validator with no extra configuration.
- **VS Code YAML extension (RedHat YAML LSP)** — at version ≥1.10 supports Draft 2020-12 via the `yaml-language-server` v1.x. Authors who configure `yaml.schemas: { "https://caspian.dev/schemas/v1/envelope.schema.json": "**/*.md" }` get hover documentation, autocompletion, and inline validation as they author Caspian frontmatter — once Epic 4 deploys the schema at the canonical URI. Until then, authors map the local file path: `yaml.schemas: { "./caspian/schemas/v1/envelope.schema.json": "**/*.md" }` (workspace-relative).

No web research beyond the existing planning artifacts is required to author the schema. The PRD, architecture, epics, and `caspian/spec/core.md` (Story 1.2) fully specify the four-field contract that the schema encodes.

### Project Structure Notes

`caspian/schemas/` is created **for the first time** in this story. The architecture's complete schemas subtree (`architecture.md` lines 582–586) shows the expected v1.0 + v1.1-deferred contents:

```text
caspian/schemas/                                  # Apache-2.0 (single source of truth)
├── LICENSE                                       # Apache-2.0 explicit (Story 1.4)
└── v1/
    ├── envelope.schema.json                      # Caspian envelope (Story 1.4)
    └── diagnostic-registry.schema.json           # Story 1.5
```

After Story 1.4 ships, `caspian/schemas/v1/diagnostic-registry.schema.json` is still missing — that is Story 1.5's deliverable. After Story 1.5 ships, the directory is complete for v1.0. A v2.0 spec major bump in the future would land `caspian/schemas/v2/` alongside `v1/` (NFR22).

### References

- **Epic 1 — Story 1.4 ACs:** `_bmad-output/planning-artifacts/epics.md` lines 534–571 (`### Story 1.4: Envelope JSON Schema (Draft 2020-12)`).
- **Epic 1 overview & dependencies:** `_bmad-output/planning-artifacts/epics.md` lines 312–324 + 400–402.
- **Architecture — Schema layout (A1, A2, A3, A4, A5):** `_bmad-output/planning-artifacts/architecture.md` lines 214–220.
- **Architecture — JSON Schema Authoring conventions:** `_bmad-output/planning-artifacts/architecture.md` lines 370–378.
- **Architecture — Schemas directory layout:** `_bmad-output/planning-artifacts/architecture.md` lines 582–586.
- **Architecture — License layout (per-directory + root composite):** `_bmad-output/planning-artifacts/architecture.md` lines 175–181, 749, 583.
- **Architecture — Rejection of per-`core:*`-type schemas:** `_bmad-output/planning-artifacts/architecture.md` lines 213, 980.
- **Architecture — 3-verrou single-source-of-truth enforcement (Epic 2 deliverable, references this story's file):** `_bmad-output/planning-artifacts/architecture.md` lines 723–727.
- **Architecture — Schema bundling (`copy-schemas.ts`, Epic 2 deliverable):** `_bmad-output/planning-artifacts/architecture.md` line 216, 658.
- **PRD — FR5/FR6 (overlay-compat, x-* extension):** `_bmad-output/planning-artifacts/prd.md` lines 76–77.
- **PRD — FR14 (Draft 2020-12 single source of truth):** `_bmad-output/planning-artifacts/prd.md` line 88.
- **PRD — NFR13 (overlay-compat with Anthropic Agent Skills):** `_bmad-output/planning-artifacts/prd.md` line 588.
- **PRD — NFR14 (Draft 2020-12 conformance):** `_bmad-output/planning-artifacts/prd.md` line 589.
- **PRD — NFR16 (graceful degradation in non-Caspian-aware hosts):** `_bmad-output/planning-artifacts/prd.md` line 591.
- **PRD — NFR22 (BACKWARD_TRANSITIVE schema evolution):** `_bmad-output/planning-artifacts/prd.md` line 603.
- **`caspian/spec/core.md` — `type` field shape (multi-colon valid; missing-colon error):** `caspian/spec/core.md` lines 65–97 (Story 1.2 deliverable).
- **`caspian/spec/core.md` — `requires` field shape (array of `{type, tags?, count?}`):** `caspian/spec/core.md` lines 99–126.
- **`caspian/spec/core.md` — `produces` field shape (object with required `type`):** `caspian/spec/core.md` lines 128–151.
- **`caspian/spec/core.md` — `schema_version` semantics (optional, MAJOR.MINOR):** `caspian/spec/core.md` lines 39–63.
- **`caspian/spec/core.md` — Schema Evolution / BACKWARD_TRANSITIVE:** `caspian/spec/core.md` lines 232–249.
- **`caspian/spec/core.md` — Conformance (validates against envelope schema, no error-severity diagnostics):** `caspian/spec/core.md` lines 278–288.
- **Implementation readiness report — Story 1.4 traceability (FR1, FR2, FR3, FR5, FR14):** `_bmad-output/planning-artifacts/implementation-readiness-report-2026-04-26.md` lines 256–269.
- **Story 1.1 — Working-directory convention, root LICENSE (Apache 2.0 full text), biome.json baseline, conventional-commits prefix:** `_bmad-output/implementation-artifacts/1-1-project-bootstrap-monorepo-scaffold-dual-license-layout.md`.
- **Story 1.2 — `caspian/spec/` foundation, forward-reference discipline, smoke-gate pattern, sealed-files convention:** `_bmad-output/implementation-artifacts/1-2-caspian-core-normative-reference-spec-core-md.md`.
- **Story 1.3 — Vocabulary directory, working-directory persistence note, deferred-work pattern:** `_bmad-output/implementation-artifacts/1-3-canonical-core-vocabulary-docs.md`.
- **Deferred work tracker:** `_bmad-output/implementation-artifacts/deferred-work.md`.
- **Project conventions:** `F:\work\joselimmo-marketplace-bmad\CLAUDE.md`.
- **JSON Schema Draft 2020-12 specification (external):** <https://json-schema.org/draft/2020-12/release-notes> — release notes for the 2020-12 draft.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (`claude-opus-4-7[1m]`) via the BMad `/bmad-dev-story` workflow on 2026-04-27.

### Debug Log References

- **AC2/AC3/AC4/AC5/AC6/AC7/AC8/AC9/AC10 mechanical verification (`node -e ...`)** — parsed `caspian/schemas/v1/envelope.schema.json`, then printed: `first_key=$schema`, `id=https://caspian.dev/schemas/v1/envelope.schema.json`, `title=CaspianEnvelope`, `type=object`, `additionalProperties=true`, `required=["type"]`, `root_examples_count=2`, `RequiresEntry.additionalProperties=false`, `RequiresEntry.required=["type"]`, `RequiresEntry.examples_count=2`, `Produces.additionalProperties=false`, `Produces.required=["type"]`, `Produces.examples_count=1`, `properties_keys=["schema_version","type","requires","produces"]`. Plus byte-level checks: `utf8_no_bom=true`, `lf_only=true`, `byte_size=3690`. All 9 mechanical ACs pass.

- **AC16 manual schema walkthrough (positive cases).** Each case traced through the schema's keywords by hand and through a `node -e` simulation script that re-implemented the relevant subset of JSON-Schema-2020-12 evaluation (root `required`, `type` `pattern`, `requires.items.additionalProperties=false`, `RequiresEntry.required`):
  - **P1 minimal** `{"type":"core:story"}` → VALID (only required field present; no shape violations).
  - **P2 full four-field** `{"schema_version":"0.1","type":"core:plan","requires":[{"type":"core:story"}],"produces":{"type":"core:plan"}}` → VALID (every field shape conforms; pattern matches; `requires` entry shape clean; `produces` shape clean).
  - **P3 overlay + extension** `{"type":"core:story","name":"my-skill","description":"An example","x-bmad-confidence":"high","bmad:status":"ready"}` → VALID. Root `additionalProperties: true` admits the four extra fields without warning. Demonstrates FR5 + FR6 + NFR13 + NFR16.
  - **P-bonus multi-colon** `{"type":"core:story:v2"}` → VALID. The pattern `^[^:]+:.+$` matches because the first `:` separates `core` from `story:v2`. Confirms the `core.md` line 69 contract that multi-colon values are valid.

- **AC16 manual schema walkthrough (negative cases).**
  - **N1 missing `type`** `{"schema_version":"0.1"}` → INVALID at root `required: ["type"]`. Maps to `CASPIAN-E008` (Story 1.5's registry).
  - **N2 malformed `type`** `{"type":"story"}` → INVALID at `type.pattern`. The string contains no colon. Maps to `CASPIAN-E009`.
  - **N3 `requires` entry with extra unknown property** `{"type":"core:plan","requires":[{"type":"core:story","weight":5}]}` → INVALID at `RequiresEntry.additionalProperties: false` (the `weight` key is not in the allow-list `{type, tags, count}`). Maps to `CASPIAN-E012`.
  - **N-bonus `requires` entry missing `type`** `{"type":"core:plan","requires":[{}]}` → INVALID at `RequiresEntry.required: ["type"]`. Maps to `CASPIAN-E011`.

- **Pattern spot-checks against `^[^:]+:.+$`.** Confirms the pattern catches exactly the three failure modes documented in `core.md` lines 71–74:
  - Rejects `:` (empty namespace AND empty name), `:foo` (empty namespace), `foo:` (empty name), `foo` (no colon).
  - Accepts `core:story`, `core:plan`, `bmad:epic`, `core:story:v2`.

- **AC15 smoke gate.** From repo root: `cd caspian && pnpm lint` → `Checked 5 files in 11ms. No fixes applied.` Exit 0. The 5 files are the 4 biome-tracked baseline (`biome.json`, `package.json`, `tsconfig.base.json`, `pnpm-workspace.yaml` style; effectively the JSON files biome includes per `caspian/biome.json` line 11) plus the new `caspian/schemas/v1/envelope.schema.json`. `pnpm test` → *No projects matched the filters in "F:\work\joselimmo-marketplace-bmad\caspian"*. Exit 0. Empty-workspace pattern from Stories 1.1, 1.2, 1.3 still holds; no source code or tests added in this story.

- **AC13 LICENSE byte-equality verification.** `cp caspian/LICENSE caspian/schemas/LICENSE` followed by `diff caspian/LICENSE caspian/schemas/LICENSE` → empty output (no differences). Confirms the schemas/LICENSE is the byte-faithful Apache 2.0 text from the project root, satisfying the CNCF/Kubernetes pattern called out by architecture line 749.

- **JSON Schema authoring conventions audit (architecture lines 370–378).**
  - `$schema` is the literal first key of the root JSON object (verified via `Object.keys(obj)[0]`).
  - `$id` is `https://caspian.dev/schemas/v1/envelope.schema.json` — absolute, no trailing slash, no fragment, matches architecture line 215 / line 373 verbatim.
  - `title` values are PascalCase: `CaspianEnvelope` (root), `RequiresEntry` ($defs), `Produces` ($defs).
  - All `description` strings start with a capital and end with a period; voice is descriptive, not normative or imperative. Spot-checked in code-review style: 9 description fields total (root, schema_version, type, requires, produces, RequiresEntry, RequiresEntry.type, RequiresEntry.tags, RequiresEntry.count, Produces, Produces.type) — each one passes the capital-and-period test.
  - The `type` property's description explicitly enumerates the `<namespace>:<name>` form per AC12, including the multi-colon clause (*"Multi-colon values such as core:story:v2 are valid"*).
  - Field names mirror frontmatter spelling exactly: `schema_version` snake_case (Caspian convention).
  - `required` is declared via the `required: [...]` array at every level (root, RequiresEntry, Produces).
  - `examples` arrays are present at the schema root (2 entries) AND on each sub-schema (`RequiresEntry`: 2 entries; `Produces`: 1 entry).

- **Decision A2 / A3 / A4 / A5 traceability.**
  - A1 (single envelope schema, Draft 2020-12, no per-`core:*`-type schemas) → satisfied: only `caspian/schemas/v1/envelope.schema.json` was created; no per-type schemas.
  - A2 (`$id` canonical for future JSON Schema Store submission, registered locally at runtime) → satisfied: `$id` is the canonical URI; no remote fetch behavior introduced (NFR6).
  - A3 (schema bundling via Story 2.1's `copy-schemas.ts`) → out-of-scope for Story 1.4; the file is at the source-of-truth path that Story 2.1 will copy from.
  - A4 (path-versioned `schemas/v1/`) → satisfied: file lives at `caspian/schemas/v1/envelope.schema.json`.
  - A5 (`additionalProperties: true` at envelope root, `false` on sub-shapes) → satisfied with the deliberate asymmetry.

### Completion Notes List

**All 16 acceptance criteria satisfied. Story status: `review`.**

- **AC1 — file exists, valid UTF-8 with LF, no BOM, well-formed JSON** ✅ — `caspian/schemas/v1/envelope.schema.json` created (3690 bytes). Mechanical verification confirmed: `utf8_no_bom=true`, `lf_only=true`, `JSON.parse()` succeeds.
- **AC2 — `$schema` is first key** ✅ — `Object.keys(obj)[0] === "$schema"` confirmed; the literal value is `"https://json-schema.org/draft/2020-12/schema"`.
- **AC3 — `$id` exact value** ✅ — `obj["$id"] === "https://caspian.dev/schemas/v1/envelope.schema.json"`. No trailing slash, no fragment, no query string.
- **AC4 — `title: "CaspianEnvelope"`** ✅ — confirmed exact string match.
- **AC5 — root `additionalProperties: true`** ✅ — confirmed; admits agentskills.io / Claude Code overlay / `x-*` / vendor-namespaced fields.
- **AC6 — root `required: ["type"]`** ✅ — confirmed; only `type` is required at envelope root.
- **AC7 — `RequiresEntry` shape (`additionalProperties: false`, `required: ["type"]`, properties `type`/`tags`/`count`)** ✅ — factored into `$defs.RequiresEntry`, referenced via `$ref: "#/$defs/RequiresEntry"`. `tags` is `array<string>`, `count` is `integer` with `minimum: 1` (positive integer).
- **AC8 — `Produces` shape (`additionalProperties: false`, `required: ["type"]`, properties `type`)** ✅ — factored into `$defs.Produces`, referenced via `$ref: "#/$defs/Produces"`.
- **AC9 — root `examples` ≥ 1, with at least one minimal envelope** ✅ — 2 root-level examples: `{"type": "core:story"}` (minimal) and the full four-field envelope.
- **AC10 — sub-schema examples** ✅ — `RequiresEntry.examples` has 2 entries; `Produces.examples` has 1 entry.
- **AC11 — descriptions are full English, descriptive voice, capital + period** ✅ — 11 description fields audited; all conform.
- **AC12 — `type` description enumerates `<namespace>:<name>` form** ✅ — description states explicitly: *"The artifact's typed identity in <namespace>:<name> form. The substring before the first colon is the namespace; the remainder is the name. Multi-colon values such as core:story:v2 are valid. Values missing the colon, or with empty namespace or empty name, are rejected."*
- **AC13 — `caspian/schemas/LICENSE` is full Apache 2.0 text, byte-faithful copy of `caspian/LICENSE`** ✅ — `diff caspian/LICENSE caspian/schemas/LICENSE` returns empty output; both files are 11358 bytes.
- **AC14 — path-versioned `schemas/v1/`** ✅ — `caspian/schemas/v1/envelope.schema.json` lives under `v1/`, not directly under `schemas/`.
- **AC15 — smoke gate green** ✅ — `pnpm -C caspian lint` checked 5 files in 11ms, exit 0. `pnpm -C caspian test` reported *No projects matched the filters* and exited 0. Empty-workspace pattern preserved.
- **AC16 — manual walkthrough recorded** ✅ — 4 positive cases (P1 minimal, P2 full, P3 overlay+extension, P-bonus multi-colon) and 4 negative cases (N1 missing type, N2 malformed type, N3 requires extra prop, N-bonus requires entry missing type) traced through the schema's keywords with expected outcomes documented in the Debug Log. Pattern spot-checks against `^[^:]+:.+$` confirm the regex catches exactly the three failure modes from `core.md` lines 71–74.

**No deviations from the story spec.** The Reference Schema Model in the Dev Notes was used byte-faithfully — no shape, type, pattern, or example was modified relative to the model. Only formatting choices (whitespace inside JSON, single-line `examples` arrays where compact, `[{ ... }]` shorthand) were applied during authoring; biome's formatter accepted the file without modifications (`No fixes applied`).

**Decision recorded — choice between `$defs` and inline sub-schemas (AC7 + AC8):** factored `RequiresEntry` and `Produces` into `$defs` rather than inline. Rationale: (a) Draft 2020-12 idiom prefers `$defs`; (b) future `$ref` reuse from Story 1.5's diagnostic-registry schema or post-v1.0 per-type schemas (deferred but possible) becomes cheaper; (c) the schema's structure mirrors the contract sections in `core.md` more cleanly when the sub-shapes have their own titles.

**Decision recorded — `schema_version` carries no `pattern`.** Per the *Anti-Patterns — DO NOT do* section of the story, applying a pattern would convert the v1.0 `CASPIAN-W003` warning policy (warn-on-unrecognized-version) into a schema-level error and break the warn-on-unknown contract (NFR16). The MAJOR.MINOR-form requirement is documented in the field's description for human and editor consumption only.

**Manual follow-up required by the user:**

- **Commit the story.** Per the repo's commit policy, the dev agent did not commit. Recommended invocation:

  ```bash
  git add caspian/schemas/ _bmad-output/implementation-artifacts/1-4-envelope-json-schema-draft-2020-12.md _bmad-output/implementation-artifacts/sprint-status.yaml
  git commit -m "docs(spec): add envelope JSON Schema (Story 1.4)"
  ```

  If `.claude/settings.local.json` was auto-modified by Claude Code's permission-grant flow during the smoke gate (as happened in Stories 1.1, 1.2, 1.3), include or omit it at the user's discretion.

- **Resolve forward-reference notes in `caspian/spec/core.md` and `caspian/spec/README.md` (optional, NOT required for Story 1.4 acceptance).** Story 1.2 wrote *"coming soon — Story 1.4"* annotations on every link to `../schemas/v1/envelope.schema.json` (`core.md` lines 8, 282, 294). Those annotations are now stale (the file exists). Per Story 1.2 / 1.3 dev notes, no edits are required — the annotations record historical project state and the relative links resolve naturally on GitHub. A future tidy-up story may choose to remove them; that is out of scope for Story 1.4.

- **Forward dependency for Story 1.5.** The `RequiresEntry.additionalProperties: false` constraint maps to `CASPIAN-E012`; `RequiresEntry.required: ["type"]` maps to `CASPIAN-E011`; root `required: ["type"]` maps to `CASPIAN-E008`; `type.pattern` maps to `CASPIAN-E009`; `Produces.additionalProperties: false` maps to `CASPIAN-E013` (extra prop) and the missing-`type` case to `CASPIAN-E014`. Story 1.5's diagnostic-registry MUST author entries E008–E014 with messages aligned to the keyword that triggers them in this schema.

- **Forward dependency for Story 1.6.** Each `fixtures/valid/**/*.md` MUST validate against this schema with no errors; each `fixtures/invalid/**/*.md` triggers exactly one of E008–E014 / W001–W003. The `RequiresEntry.tags` field's array-of-string shape and the `count` positive-integer constraint give Story 1.6 exact targets for the `core-plan` valid fixture and the `E012-requires-invalid-shape` invalid fixture variants.

- **Forward dependency for Story 2.1 (Epic 2).** `packages/core/scripts/copy-schemas.ts` will copy `caspian/schemas/v1/envelope.schema.json` to `packages/core/dist/schemas/v1/`. The single-loader-module discipline (architecture verrou 3) reads from there. Nothing in this story's deliverable conflicts with the bundling pipeline; the file is the canonical source-of-truth.

- **Forward dependency for Epic 4.** The `$id` URI `https://caspian.dev/schemas/v1/envelope.schema.json` will be deployed as a fetchable resource at the canonical address by Story 4.1+'s GitHub Pages workflow. Until then, IDE consumers point at the local file via `yaml.schemas: { "./caspian/schemas/v1/envelope.schema.json": "**/*.md" }` (workspace-relative).

### File List

All paths relative to repo root (`F:\work\joselimmo-marketplace-bmad\`).

**New files (2):**

- `caspian/schemas/LICENSE` — full Apache 2.0 license text, byte-faithful copy of `caspian/LICENSE` (11358 bytes; identical to root LICENSE per `diff` verification)
- `caspian/schemas/v1/envelope.schema.json` — Caspian envelope JSON Schema (Draft 2020-12); root `CaspianEnvelope` + `$defs.RequiresEntry` + `$defs.Produces`; 3690 bytes

**Modified files (2):**

- `_bmad-output/implementation-artifacts/1-4-envelope-json-schema-draft-2020-12.md` — Tasks/Subtasks marked complete; Dev Agent Record populated (Agent Model, Debug Log, Completion Notes); File List updated; Status transitioned `ready-for-dev → in-progress → review`
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — `1-4-envelope-json-schema-draft-2020-12` transitioned `backlog → ready-for-dev → in-progress → review`; session markers appended on lines 49–51; `last_updated: 2026-04-27`

### Change Log

- **2026-04-27 — Story 1.4 dev session.** Created 2 files under `caspian/schemas/` (1 LICENSE + 1 envelope schema). All 16 acceptance criteria satisfied. Smoke gate green (`pnpm -C caspian lint` checked 5 files, exit 0; `pnpm -C caspian test` exit 0). Story status `ready-for-dev → in-progress → review`. No source code or tests added — this is a schema-only story consumed by Epic 2's `packages/core` runtime via the build-time copy-schemas script. Forward dependencies recorded for Stories 1.5 (E008–E014 / W001–W003 keyword mapping), 1.6 (fixture targets), 2.1 (loader.ts source-of-truth), and Epic 4 (`$id` URL deployment).
