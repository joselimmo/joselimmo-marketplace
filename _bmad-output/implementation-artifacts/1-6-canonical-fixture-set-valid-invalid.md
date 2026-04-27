# Story 1.6: Canonical fixture set (valid + invalid)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a plugin author trying to understand "what does Caspian frontmatter look like in practice",
I want canonical valid fixtures per `core:*` type and overlay scenario, plus invalid fixtures organized one-per-code with machine-readable expectations,
So that I browse concrete examples and Epic 2's regression suite has zero-edit auto-discovery (FR38).

## Working Directory

All paths in this story resolve **inside `caspian/`** — the sub-monorepo that hosts the Caspian project under the surrounding `joselimmo-marketplace-bmad` repository. Any reference like `fixtures/valid/core-overview/minimal.md` resolves to `caspian/fixtures/valid/core-overview/minimal.md`. Never create files outside `caspian/fixtures/` for this story (with the single exception of the sprint-status update under `_bmad-output/implementation-artifacts/`).

`caspian/fixtures/` does **not yet exist** in the repository — Story 1.6 creates the directory tree for the first time. The biome ignore globs (`caspian/biome.json` line 15 + `caspian/.biomeignore` line 4) already pre-declare `fixtures/invalid/**` exclusions in anticipation of this story.

## Acceptance Criteria

**AC1.** `caspian/fixtures/README.md` exists. The file is a **3-line** statement (one short paragraph, three lines of prose) that clarifies fixtures are **machine-consumed regression data**, distinct from the **author-readable how-tos** under `caspian/examples/` (the latter lands in Story 1.7). Three lines means three lines of body prose — the `# Heading` and any blank line do not count toward the "3-line" budget; aim for ~210 characters of prose total. (Epics line 625; same convention Story 1.7's `examples/README.md` will mirror.)

**AC2.** `caspian/fixtures/LICENSE` exists. The file uses **plain text** (no `.md` extension), declares Apache-2.0 explicitly, and contains the **full Apache License 2.0 text** — not a one-line declaration. The simplest faithful implementation is to copy `caspian/LICENSE` byte-for-byte to `caspian/fixtures/LICENSE`. Same CNCF/Kubernetes pattern Story 1.4 used for `caspian/schemas/LICENSE` and Story 1.5 used for `caspian/diagnostics/LICENSE`. (Epics line 626; architecture lines 175–181, 749.)

**AC3.** `caspian/fixtures/valid/` and `caspian/fixtures/invalid/` subdirectories exist (epics line 627). Both directories MUST be present after this story. Empty placeholder files (`.gitkeep`) are NOT used — each subdirectory holds at least one fixture from the start.

**AC4.** **Per-`core:*`-type valid fixtures** exist with minimal but realistic frontmatter (epics lines 629–632). Exactly **four** files at these paths:

  - `caspian/fixtures/valid/core-overview/minimal.md`
  - `caspian/fixtures/valid/core-epic/minimal.md`
  - `caspian/fixtures/valid/core-story/minimal.md`
  - `caspian/fixtures/valid/core-plan/minimal.md`

The four directories `core-overview/`, `core-epic/`, `core-story/`, `core-plan/` are kebab-cased mirrors of the `core:*` type names (the colon is replaced by a hyphen because directory names cannot contain colons on Windows; the `core-` prefix preserves the type's namespace lineage). Other `core:*` types (`adr`, `convention`, `learning`, `glossary`, `review`, `rule`, `scratch`) are **out of scope** for Story 1.6 — see *Deferred Work* below.

**AC5.** Each valid fixture under `caspian/fixtures/valid/core-*/` passes envelope-schema validation against `caspian/schemas/v1/envelope.schema.json` (Story 1.4's deliverable) — **zero errors, warnings allowed** (epics line 632). v1.0 ships no validator runtime in this story (ajv lands in Epic 2 Story 2.1); the cross-check is manual: trace each fixture's frontmatter through the envelope schema's `required: ["type"]` + `type.pattern: "^[^:]+:.+$"` + the `requires` / `produces` `$defs`. Each fixture MUST satisfy these constraints. Documentary `core:*` types (`overview`, `epic`, `story`) carry `type` only; the active-component-style `core:plan` MAY include the `requires` / `produces` lineage convention from `caspian/spec/vocabulary/plan.md` lines 92–98 (frontmatter-side; document body is short prose).

**AC6.** **Overlay-compatibility valid fixtures** exist under `caspian/fixtures/valid/overlay-compat/` (epics lines 634–637). Exactly **three** files at these paths:

  - `caspian/fixtures/valid/overlay-compat/all-22-known-fields.md` — frontmatter combines **all 22 recognized fields** in one artifact: 4 Caspian core (`schema_version`, `type`, `requires`, `produces`) + 6 agentskills.io canonical (`name`, `description`, `license`, `allowed-tools`, `metadata`, `compatibility`) + 12 Claude Code overlay (`when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `model`, `effort`, `context`, `agent`, `hooks`, `paths`, `shell`).
  - `caspian/fixtures/valid/overlay-compat/x-extension.md` — frontmatter uses an `x-vendor-thing` field (FR6 escape-hatch prefix). Beyond the `x-*` field, the frontmatter MUST be otherwise valid (carry `type` at minimum).
  - `caspian/fixtures/valid/overlay-compat/vendor-namespaced.md` — frontmatter uses a `vendor:custom-field` namespaced field (FR4 vendor-namespacing convention applied to a frontmatter **field name**, not the `type` value). Beyond the namespaced field, the frontmatter MUST be otherwise valid.

Each of the three overlay-compat fixtures MUST pass envelope-schema validation with **no errors and no W001 allow-list warnings** since all fields are recognized: the 22 known fields are explicitly recognized; `x-*` fields are recognized as the extension prefix; `vendor:name` namespaced fields are recognized as the vendor-extension path (epics line 637; architecture *Pattern Examples* lines 472–481; `caspian/spec/core.md` *Extension Mechanisms* section). The `all-22-known-fields.md` fixture's filename uses the kebab-case canonical name explicitly mandated by the AC text (epics line 636 says *"all-22-known-fields.md"* — match this string exactly; do NOT rename to the architecture variant *"all-22-fields.md"* on architecture line 391).

**AC7.** **Per-diagnostic-code invalid fixtures** exist under `caspian/fixtures/invalid/`. Exactly **17 directories** exist, one per code from `caspian/diagnostics/registry.json` (Story 1.5's deliverable), with these exact directory names (epics line 641):

  - `E001-bom/`
  - `E002-encoding/`
  - `E003-tab-indent/`
  - `E004-oversized/`
  - `E005-missing-delimiters/`
  - `E006-yaml-parse/`
  - `E007-unquoted-bool/`
  - `E008-type-missing/`
  - `E009-type-not-namespaced/`
  - `E010-requires-not-array/`
  - `E011-requires-entry-missing-type/`
  - `E012-requires-invalid-shape/`
  - `E013-produces-not-object/`
  - `E014-produces-missing-type/`
  - `W001-unknown-field/`
  - `W002-non-core-namespace/`
  - `W003-unrecognized-schema-version/`

Directory names use **uppercase code letters** (`E001`, `W001`) followed by a kebab-case rule-derived suffix. The format is `<CODE>-<kebab-rule-suffix>/`. The kebab suffix is a short human-readable label for the rule, NOT a verbatim copy of the registry's `rule` field (e.g., the registry's `rule: "yaml-1-1-boolean-coercion"` becomes the directory's shorter `unquoted-bool`). The 17 suffixes above are the canonical names mandated by epics line 641; use them verbatim. The total directory count is **exactly 17**.

**AC8.** Each `caspian/fixtures/invalid/<code>/` directory contains **at least one** `<variant>.md` artifact paired with a sibling `<variant>.expected.json` (epics line 642). The minimum implementation is one `<variant>.md` + one `<variant>.expected.json` per directory; additional variants are permitted but NOT required by Story 1.6 (each new variant ships in pairs of 2 files). The `<variant>` filename stem is identical between the `.md` and the `.expected.json` (e.g., `with-bom.md` ↔ `with-bom.expected.json`). Variant names are kebab-case (e.g., `with-bom`, `tab-in-yaml`, `over-4kb`, `unclosed-bracket`, `yes-as-string`, `no-type`, `bare-name`, `string-instead`, `missing-type-key`, `extra-property`, `array-instead`, `empty-object`, `typo-metadat`, `bmad-epic`, `version-9-9`).

**AC9.** Each `<variant>.expected.json` file is shaped as `{ "diagnostics": [ { "code": "CASPIAN-EXXX", "line": <number> }, ... ] }` (epics line 646). The schema is strictly:

  - Top-level object with **exactly one property** `"diagnostics"` whose value is an array of one or more entries.
  - Each entry has **exactly two properties**: `"code"` (string matching `^CASPIAN-(E|W)\d{3}$`) and `"line"` (positive integer ≥ 1).
  - **No extraneous fields** — neither at top level nor per-entry. No `severity`, `rule`, `message`, `doc`, `field`, or any other property. (Epics line 648.)

The listed `code` value(s) MUST match the directory's intended diagnostic — e.g., `caspian/fixtures/invalid/E001-bom/with-bom.expected.json` MUST list `"CASPIAN-E001"` (and only `"CASPIAN-E001"`, not also `E005` or any other code). For fail-fast invalid fixtures (E001–E007), the `diagnostics` array contains a single entry; for envelope-shape invalid fixtures (E008–E014, W001–W003), the array still contains a single entry because each fixture is authored to exhibit ONLY its target diagnostic with no incidental others.

**AC10.** Comments live only in markdown body, never in frontmatter (epics lines 650–652). Every fixture's YAML frontmatter contains **only valid YAML key/value pairs — zero comment lines** (no `#` comment lines inside the `---` / `---` delimiters). YAML 1.2 syntactically permits `#`-prefixed comments inside flow scalars / map values, but the architecture's *YAML Frontmatter Authoring* convention (architecture lines 402–451, *YAML Frontmatter Authoring (Fixtures + casper-core)*) bans them: the round-trip authoring story is "what you wrote is what the validator parsed". Comments would survive YAML parse but be invisible to downstream tooling that round-trips frontmatter through `yaml.parse()` + `yaml.stringify()`.

**AC11.** If a fixture's purpose needs an explanation, the explanation lives in the markdown body as a **single-sentence paragraph** of **at most one sentence** (epics line 653). Most fixtures are self-evident from the directory name + frontmatter and need no body at all (an empty body or a single short sentence is the convention). The body MUST NOT contain heading levels, code fences, or multiple paragraphs — fixtures are not author-readable walkthroughs (those are Story 1.7's `examples/` deliverable).

**AC12.** `pnpm -C caspian lint` exits `0` after this story (smoke gate; same standard as Stories 1.1–1.5). The two file types to consider:

  - **Markdown fixtures** (`fixtures/valid/**/*.md` + `fixtures/invalid/**/*.md`) — biome's `files.includes` (`caspian/biome.json` lines 4–17) does NOT list `**/*.md`, so markdown is OUT of biome's scope regardless of valid/invalid split.
  - **JSON expected.json files** (`fixtures/invalid/**/*.expected.json`) — biome's includes DO list `**/*.json`, so they would normally be linted; however biome's includes ALSO list `!fixtures/invalid` (line 15) and `caspian/.biomeignore` line 4 lists `fixtures/invalid/**`. The negation EXCLUDES the .expected.json files from biome's lint scope.

**Expected smoke-gate output:** Biome checks **7 files** in ~20ms, exit 0 — the same 7 files Story 1.5 reported (`biome.json`, `package.json`, `tsconfig.base.json`, `.changeset/config.json`, `schemas/v1/envelope.schema.json`, `schemas/v1/diagnostic-registry.schema.json`, `diagnostics/registry.json`). The new fixture files are NOT linted because: (a) `.md` is not in biome's `files.includes`; (b) `.expected.json` lives under `fixtures/invalid/**` which is excluded.

**Risk note:** `caspian/biome.json` line 15 is written as `"!fixtures/invalid"` (without the `/**` recursion suffix). Biome 2.4.13 negation glob behavior on a bare directory name is **expected** to recurse and exclude descendants (matching `caspian/.biomeignore` line 4 which spells out `fixtures/invalid/**`), but the dev MUST verify by running the smoke gate and observing the file count. If biome counts > 7 files (e.g., 24 = 7 + 17 expected.json), the dev's options are:

  1. **Preferred:** Tighten `caspian/biome.json` line 15 from `"!fixtures/invalid"` to `"!fixtures/invalid/**"` to mirror `.biomeignore` exactly. Record in Completion Notes.
  2. **Alternative:** Accept the higher file count as the new baseline IF biome's lint+format passes on every `.expected.json` (i.e., biome's formatter is happy with the .expected.json shape). Record the new count in Completion Notes.

`pnpm -C caspian test` continues to exit `0` with the *No projects matched the filters* output (empty-workspace pattern from Stories 1.1–1.5; no source code or tests added in Story 1.6).

**AC13.** Manual cross-checks recorded in the Dev Agent Record's *Debug Log References* section (parallel to Story 1.5's AC16 walkthrough):

  - **Cross-check #1 — valid fixtures pass envelope schema.** For each of the 7 valid fixtures (4 `core-*` + 3 `overlay-compat`), trace the frontmatter through `caspian/schemas/v1/envelope.schema.json` keywords: root `required: ["type"]`, `type.pattern: "^[^:]+:.+$"`, `additionalProperties: true` (root accepts unknown), `RequiresEntry.required: ["type"]` + `additionalProperties: false`, `Produces.required: ["type"]` + `additionalProperties: false`. Confirm: each fixture has `type` present, `type` matches the pattern, no envelope-shape error fires.
  - **Cross-check #2 — invalid fixtures emit ONLY their target diagnostic.** For each of the 17 invalid fixtures, walk through the architecture's 6-stage pipeline (architecture step-04 *Validation Pipeline* D1–D4 lines 281–292 + epics Stories 2.3–2.4 ACs lines 807–916) and confirm: the fixture triggers the target stage's failure (e.g., `E001-bom/with-bom.md` triggers stage 1 byte-level scan), no other stage fires (fail-fast for E001–E007; clean envelope shape for E008–E014; no incidental W001/W002/W003 from un-targeted issues).
  - **Cross-check #3 — `.expected.json` shape audit.** For each of the 17 `.expected.json` files: (a) parse as JSON; (b) confirm top-level shape `{"diagnostics": [...]}` with no extra properties; (c) confirm each entry has exactly `code` + `line`, no extras; (d) confirm `code` matches `^CASPIAN-(E|W)\d{3}$`; (e) confirm `code` value matches the directory's prefix (e.g., `E001-bom/` directory's expected.json contains `"CASPIAN-E001"`).
  - **Cross-check #4 — frontmatter has no YAML comments.** For each of the 7 valid + 17 invalid fixtures, confirm the slice between the `---` delimiters contains zero `#`-prefixed comment lines.
  - **Cross-check #5 — overlay-compat all-22 fixture inventory.** For `all-22-known-fields.md`, enumerate the 22 frontmatter keys and confirm: 4 Caspian core present; 6 agentskills.io canonical present; 12 Claude Code overlay present. Total = 22 distinct top-level keys. (Single `--- ... ---` slice, single value per key.)

## Tasks / Subtasks

- [x] **Task 1 — Create `caspian/fixtures/` directory tree + LICENSE + README** (AC: #1, #2, #3)
  - [x] Create the directory `caspian/fixtures/` (does not exist yet — `ls caspian/` before this story shows no `fixtures/` entry).
  - [x] Create `caspian/fixtures/valid/` and `caspian/fixtures/invalid/` subdirectories.
  - [x] Copy the full Apache 2.0 license text from `caspian/LICENSE` to `caspian/fixtures/LICENSE` (no `.md` extension, plain text, exact byte-for-byte copy). Verify with `diff caspian/LICENSE caspian/fixtures/LICENSE` — output MUST be empty (no differences). Same pattern Stories 1.4 + 1.5 used.
  - [x] Author `caspian/fixtures/README.md` using the *Reference README Model* in *Dev Notes* below as the authoritative starting point. The README MUST be a 3-line statement clarifying that fixtures are machine-consumed regression data distinct from `examples/`. ATX header (`# Heading`), ≤ 3 lines of body prose, LF line endings, UTF-8 no BOM, final newline.
  - [x] Do NOT create any `caspian/fixtures/.gitkeep` files — the directories are populated immediately by Tasks 2 and 3.
  - [x] Do NOT create `caspian/fixtures/CHANGELOG.md` — fixtures are versioned with the spec, not independently. (Contrast: `caspian/diagnostics/CHANGELOG.md` from Story 1.5 has its own decoupled semver because the diagnostic registry is a separate release artifact.)

- [x] **Task 2 — Author the 4 minimal `core:*` valid fixtures** (AC: #4, #5, #10, #11)
  - [x] Use the **Reference Valid Fixture Models** in *Dev Notes* below as the authoritative starting point for each of the 4 fixtures. The models satisfy AC4 + AC5 + AC10 + AC11 byte-faithfully.
  - [x] Create `caspian/fixtures/valid/core-overview/minimal.md` per the *Core Overview* model: `type: core:overview` only (documentary type, no `requires` / `produces` per `caspian/spec/vocabulary/overview.md` line 73–80).
  - [x] Create `caspian/fixtures/valid/core-epic/minimal.md` per the *Core Epic* model: `type: core:epic` only (documentary type).
  - [x] Create `caspian/fixtures/valid/core-story/minimal.md` per the *Core Story* model: `type: core:story` only (documentary type, no `requires` / `produces` by convention; the story is a parent artifact).
  - [x] Create `caspian/fixtures/valid/core-plan/minimal.md` per the *Core Plan* model: `type: core:plan` plus `requires: [{ type: core:story }]` per the convention from `caspian/spec/vocabulary/plan.md` lines 92–98 — plans are typically produced by an active `/plan-story` skill but the document itself MAY carry forward its production lineage. (No `produces` on the document; only the producing skill carries `produces: { type: core:plan }`.)
  - [x] Frontmatter MUST contain only valid YAML key/value pairs — no `#` comment lines (AC10).
  - [x] Body is at most 1 sentence (AC11) or empty. The reference models include a single 1-sentence body that says what the fixture demonstrates; the dev MAY shorten to empty if preferred.
  - [x] LF line endings, UTF-8 no BOM, final newline (matches `caspian/.editorconfig` from Story 1.1).

- [x] **Task 3 — Author the 3 overlay-compat valid fixtures** (AC: #6, #10, #11)
  - [x] Use the **Reference Overlay-Compat Models** in *Dev Notes* below as the authoritative starting point for each of the 3 fixtures.
  - [x] Create `caspian/fixtures/valid/overlay-compat/all-22-known-fields.md` per the *All-22-Known-Fields* model: combines all 22 recognized fields in one artifact (4 Caspian core + 6 agentskills.io canonical + 12 Claude Code overlay). Filename is **exactly** `all-22-known-fields.md` (epics line 636; do NOT use the architecture's variant `all-22-fields.md` on line 391).
  - [x] Create `caspian/fixtures/valid/overlay-compat/x-extension.md` per the *X-Extension* model: uses `x-vendor-thing` (or any `x-*`-prefixed field name). The fixture MUST also carry `type` (envelope's only `required` field).
  - [x] Create `caspian/fixtures/valid/overlay-compat/vendor-namespaced.md` per the *Vendor-Namespaced* model: uses a `<vendor>:<custom-field>` colon-bearing field NAME (NOT the `type` value — `type` itself is `core:overview` or another `core:*` value here). The example reserves `examples:custom-field` to align with the same vendor namespace `examples:` used by Story 1.7's adoption walkthrough (per epics line 683).
  - [x] All 3 fixtures pass envelope schema with **no errors** AND **no W001 warnings** (AC6) — the 22 known fields, `x-*` extensions, and `<vendor>:<name>` namespaced fields are all recognized by Stage 6's allow-list (architecture line 906 — *"vendor-namespaced fields and `x-*` extensions are recognized without warning"*).
  - [x] Frontmatter MUST contain only valid YAML key/value pairs — no `#` comment lines (AC10).
  - [x] Body is at most 1 sentence (AC11) or empty.
  - [x] LF line endings, UTF-8 no BOM, final newline.

- [x] **Task 4 — Author the 17 invalid fixture directories + paired `.expected.json`** (AC: #7, #8, #9, #10, #11)
  - [x] Use the **Reference Invalid Fixture Models** in *Dev Notes* below as the authoritative starting point for each of the 17 directories. Each model specifies the `<variant>.md` content + the matching `<variant>.expected.json` content + the rationale (which stage emits the code).
  - [x] **`E001-bom/with-bom.md`** — UTF-8 file with BOM byte sequence (`EF BB BF`) prefixed before the opening `---`. The remainder is a minimal valid frontmatter (`type: core:overview`). The BOM prefix triggers stage 1 byte-level rejection. Variant filename: `with-bom`. Expected: `{"diagnostics":[{"code":"CASPIAN-E001","line":1}]}`.
  - [x] **`E002-encoding/non-utf8.md`** — Non-UTF-8 file. Author as Windows-1252 (CP-1252) encoded content with at least one byte that is invalid as UTF-8 (e.g., `0x91` or `0x92` — Windows-1252 smart quotes that are invalid as standalone UTF-8 leading bytes). The frontmatter's textual content MUST contain at least one such byte for the encoding sniff to fire. Variant filename: `non-utf8`. Expected: `{"diagnostics":[{"code":"CASPIAN-E002","line":1}]}`.
  - [x] **`E003-tab-indent/tab-in-yaml.md`** — UTF-8 file with a literal `TAB` character (`\t`, `0x09`) used for indentation inside the YAML frontmatter (e.g., as the indent of a sequence item under `requires`). The frontmatter parses successfully via stage 3 YAML, but stage 3's post-parse scan flags the tab character. Variant filename: `tab-in-yaml`. Expected: `{"diagnostics":[{"code":"CASPIAN-E003","line":4}]}` (the tab appears on line 4 — frontmatter `---` (line 1), `type: core:plan` (line 2), `requires:` (line 3), `\t- type: core:story` (line 4)).
  - [x] **`E004-oversized/over-4kb.md`** — UTF-8 file whose frontmatter slice (between, exclusive of, the opening and closing `---` lines) exceeds 4096 bytes. The simplest implementation pads `description: "<long string>"` until the slice is ≥ 4097 bytes. Variant filename: `over-4kb`. Expected: `{"diagnostics":[{"code":"CASPIAN-E004","line":1}]}` (the diagnostic conventionally references line 1 since the byte-cap violation is a property of the whole frontmatter slice; the line number is consumer-friendly anchor, not a precise byte offset).
  - [x] **`E005-missing-delimiters/no-closing-delim.md`** — UTF-8 file with an opening `---` but no closing `---` (or with a malformed delimiter, e.g., `--`). The simplest case: the file starts with `---\n` then has YAML content that runs to EOF without a closing `---\n`. Variant filename: `no-closing-delim`. Expected: `{"diagnostics":[{"code":"CASPIAN-E005","line":1}]}`.
  - [x] **`E006-yaml-parse/unclosed-bracket.md`** — UTF-8 file with valid `---` delimiters but malformed YAML inside (e.g., an unclosed flow-sequence bracket: `requires: [{type: core:story`). The `yaml` v2.x library in strict 1.2 safe-load mode rejects the slice. Variant filename: `unclosed-bracket`. Expected: `{"diagnostics":[{"code":"CASPIAN-E006","line":3}]}` (the unclosed bracket is on line 3 inside the frontmatter — `---` (1), `type: core:plan` (2), `requires: [{type: core:story` (3)).
  - [x] **`E007-unquoted-bool/yes-as-string.md`** — UTF-8 file with valid YAML 1.2 frontmatter that includes an unquoted boolean-like value: `enabled: yes` (or `disable-model-invocation: yes`). The YAML 1.1 boolean keyword footgun: in strict 1.2 the value is the string `"yes"`, but a YAML 1.1 consumer would coerce to `true`. Stage 3's post-parse scan flags this as E007. Variant filename: `yes-as-string`. Expected: `{"diagnostics":[{"code":"CASPIAN-E007","line":3}]}` (the offending `enabled: yes` on line 3 — `---` (1), `type: core:overview` (2), `enabled: yes` (3)).
  - [x] **`E008-type-missing/no-type.md`** — UTF-8 file with valid frontmatter that omits the `type` field entirely. The YAML parses to `{"name": "no-type-fixture"}` (or some other key set). Stage 4 envelope validation triggers E008 because root `required: ["type"]`. Variant filename: `no-type`. Expected: `{"diagnostics":[{"code":"CASPIAN-E008","line":1}]}` (the diagnostic references the frontmatter slice's start line; some implementations may anchor on line 2 — the dev picks one and records the choice; line 1 is the canonical default per architecture B-pipeline output convention).
  - [x] **`E009-type-not-namespaced/bare-name.md`** — UTF-8 file with frontmatter `type: epic` (no colon, no namespace). Stage 4 envelope validation triggers E009 because `type.pattern: "^[^:]+:.+$"` rejects the unnamespaced value. Variant filename: `bare-name`. Expected: `{"diagnostics":[{"code":"CASPIAN-E009","line":2}]}` (the offending `type: epic` line).
  - [x] **`E010-requires-not-array/string-instead.md`** — UTF-8 file with frontmatter `type: core:plan` plus `requires: "core:story"` (string, not array). Stage 4 envelope validation triggers E010 because `requires.type: array`. Variant filename: `string-instead`. Expected: `{"diagnostics":[{"code":"CASPIAN-E010","line":3}]}`.
  - [x] **`E011-requires-entry-missing-type/missing-type-key.md`** — UTF-8 file with frontmatter `type: core:plan` plus `requires: [{ tags: ["ready-for-dev"] }]` (entry has `tags` but no `type`). Stage 4 envelope validation triggers E011 because `RequiresEntry.required: ["type"]`. Variant filename: `missing-type-key`. Expected: `{"diagnostics":[{"code":"CASPIAN-E011","line":4}]}` (the offending entry on line 4 — `---` (1), `type: core:plan` (2), `requires:` (3), `  - tags: ["ready-for-dev"]` (4)).
  - [x] **`E012-requires-invalid-shape/extra-property.md`** — UTF-8 file with frontmatter `type: core:plan` plus `requires: [{ type: core:story, weight: 5 }]` (entry has unknown property `weight`). Stage 4 envelope validation triggers E012 because `RequiresEntry.additionalProperties: false`. Variant filename: `extra-property`. Expected: `{"diagnostics":[{"code":"CASPIAN-E012","line":4}]}`.
  - [x] **`E013-produces-not-object/array-instead.md`** — UTF-8 file with frontmatter `type: core:plan` plus `produces: [core:plan]` (array, not object). Stage 4 envelope validation triggers E013 because `produces.type: object` (via `Produces` $def). Variant filename: `array-instead`. Expected: `{"diagnostics":[{"code":"CASPIAN-E013","line":3}]}`.
  - [x] **`E014-produces-missing-type/empty-object.md`** — UTF-8 file with frontmatter `type: core:plan` plus `produces: {}` (empty object). Stage 4 envelope validation triggers E014 because `Produces.required: ["type"]`. Variant filename: `empty-object`. Expected: `{"diagnostics":[{"code":"CASPIAN-E014","line":3}]}`.
  - [x] **`W001-unknown-field/typo-metadat.md`** — UTF-8 file with frontmatter `type: core:overview` plus `metadat: {}` (typo of `metadata`). Stage 4 envelope passes (root `additionalProperties: true`); stage 6 allow-list scan triggers W001 because `metadat` is not in the 22-known-fields list and is not `x-*`-prefixed and is not `<vendor>:<name>`-formatted. Variant filename: `typo-metadat`. Expected: `{"diagnostics":[{"code":"CASPIAN-W001","line":3}]}`.
  - [x] **`W002-non-core-namespace/bmad-epic.md`** — UTF-8 file with frontmatter `type: bmad:epic` (vendor-namespaced; FR4-compliant; envelope passes). Stage 5 namespace check triggers W002 because `bmad:` is not the canonical `core:` namespace (FR13 — extensible-registry: warn, never reject). Variant filename: `bmad-epic`. Expected: `{"diagnostics":[{"code":"CASPIAN-W002","line":2}]}`.
  - [x] **`W003-unrecognized-schema-version/version-9-9.md`** — UTF-8 file with frontmatter `schema_version: "9.9"` plus `type: core:overview` (envelope passes; `schema_version` is a recognized field). Stage 5 schema-version check triggers W003 because `"9.9"` is not in the v1.0 recognized set `["0.1"]` (NFR16 graceful degradation). Variant filename: `version-9-9`. Expected: `{"diagnostics":[{"code":"CASPIAN-W003","line":2}]}`.
  - [x] **All 17 `.expected.json` files** are valid JSON with the strict schema from AC9 (`{"diagnostics":[{"code":"CASPIAN-EXXX","line":N}]}`). 2-space indent, LF, UTF-8 no BOM, final newline. The single-entry array form is the convention; arrays with multiple entries are reserved for future fixtures that exercise the continue-and-collect contract (architecture line 911) — out of scope for Story 1.6.
  - [x] **All 17 `<variant>.md` invalid fixtures** carry zero `#` comment lines in frontmatter (AC10). Body MAY be empty or a single short sentence (AC11).
  - [x] **Line numbers in `.expected.json`** are best-effort anchors per the rationale rows in *Reference Invalid Fixture Models*. Story 2.3 / 2.4's pipeline implementation will produce the authoritative line numbers; if the dev's manual count differs from the pipeline's eventual emission by ±1, the gap is a Deferred-Work item for Story 2.6 (snapshot tests align fixture expectations to pipeline output).

- [x] **Task 5 — Cross-checks + smoke gate** (AC: #12, #13)
  - [x] Record in Dev Agent Record / Debug Log: results of Cross-checks #1 through #5 from AC13. Use a per-fixture audit table parallel to Story 1.5's pattern.
  - [x] Run `pnpm -C caspian lint` from the repository root. **Expected output:** Biome checks **7 files** in ~20ms, exit 0 (Story 1.5's baseline preserved — see AC12 risk note). If biome reports a higher count or fails on any new file, choose between (a) tightening `caspian/biome.json` line 15 to `"!fixtures/invalid/**"` (the AC12 *Preferred* branch) or (b) accepting the new baseline (the AC12 *Alternative* branch). Record the choice in Completion Notes.
  - [x] Run `pnpm -C caspian test`. **Expected output:** *No projects matched the filters in "F:\work\joselimmo-marketplace-bmad\caspian"*, exit code 0. (Empty-workspace pattern from Stories 1.1–1.5 — unchanged.)
  - [x] Verify the byte-faithful LICENSE copy: `diff caspian/LICENSE caspian/fixtures/LICENSE` MUST output empty (no differences).
  - [x] Verify `wc -c` reports 11358 bytes for `caspian/fixtures/LICENSE` (matching `caspian/LICENSE`, `caspian/schemas/LICENSE`, `caspian/diagnostics/LICENSE`).

- [x] **Task 6 — Sprint-status update + deferred-work tracking** (workflow only — no AC)
  - [x] Update File List in this story file with all new and modified files, paths relative to the repository root.
  - [x] Update `_bmad-output/implementation-artifacts/sprint-status.yaml`: transition `1-6-canonical-fixture-set-valid-invalid` from `in-progress` to `review` (this happens in dev-story Step 9 — included here for traceability; create-story has already moved it from `backlog` to `ready-for-dev`).
  - [x] Append the Deferred-Work entries listed in *Deferred Work* below (the 7 vocabulary docs whose `coming soon — Story 1.6` annotations Story 1.6 does NOT resolve, plus the AC12 biome-glob-tightening item if the dev took the *Preferred* branch).

### Review Findings

- [x] [Review][Decision] `vendor-namespaced.md` W001 exemption for `<vendor>:<field-name>` not in `core.md` — resolved: moved to `invalid/W001-unknown-field/vendor-namespaced.md` with `"line":3` expected; `valid/overlay-compat/` now has 2 files (AC6 deviation justified by incorrect AC premise) [`caspian/fixtures/invalid/W001-unknown-field/vendor-namespaced.md`]
- [x] [Review][Patch] E007 fixture triggers secondary W001 — replaced `enabled: yes` with `user-invocable: yes` [`caspian/fixtures/invalid/E007-unquoted-bool/yes-as-string.md:3`]
- [x] [Review][Defer] Line-number convention for file-level stage-1/stage-2 rejections — E002 `"line":1` but first invalid byte (0x91) is at line 3; E004 `"line":1` but oversized content starts at line 3; already deferred to Story 2.6 authoritative line-number reconciliation (story Deferred Work item 5) — deferred, pre-existing [`caspian/fixtures/invalid/E002-encoding/non-utf8.expected.json`, `caspian/fixtures/invalid/E004-oversized/over-4kb.expected.json`]
- [x] [Review][Defer] E008 `"line":1` anchor convention for absent-field diagnostics not documented in AC9 contract — actionable at Epic 2 validator implementation — deferred, pre-existing [`caspian/fixtures/invalid/E008-type-missing/no-type.expected.json`]
- [x] [Review][Defer] No fixture for `type: ""` (empty type string) — E008 registry message says "missing or empty" but the empty-string case is untested; out of scope Story 1.6 — deferred, pre-existing
- [x] [Review][Defer] No fixture for `requires: []` (empty array) — schema has no `minItems`, behavioral edge case for downstream tooling; out of scope Story 1.6 — deferred, pre-existing
- [x] [Review][Defer] No fixture for scalar non-string `requires` entry (e.g. `requires: [42]`) — gap in invalid coverage; out of scope Story 1.6 — deferred, pre-existing
- [x] [Review][Defer] No fixture for zero-byte / whitespace-only file — edge case distinct from E005; out of scope Story 1.6 — deferred, pre-existing

## Dev Notes

### Project Context

This is a **content-only** story — 26 new files under `caspian/fixtures/` (1 README + 1 LICENSE + 7 valid `.md` + 17 invalid `.md` + 17 `.expected.json` = **43 files total**, of which all are flat data — zero source code, zero tests beyond the smoke gate). Story 1.5 sealed `caspian/diagnostics/registry.json` (the 17 canonical diagnostic codes) and `caspian/schemas/v1/diagnostic-registry.schema.json` (the meta-schema for the registry); Story 1.6 produces (a) **valid fixtures** that author-readers consume as concrete examples of "what Caspian frontmatter looks like in practice", and (b) **invalid fixtures with machine-readable expectations** that Epic 2's regression suite (Story 2.7's conformance harness; Story 2.4's pipeline tests) consume zero-edit via auto-discovery. Together with Story 1.5's registry, Story 1.6 closes the diagnostic-identity loop: every code in the registry has at least one fixture exhibiting it.

The deliverables of Story 1.6 are consumed by every downstream story / epic that exercises diagnostics or wants concrete frontmatter examples:

- **Story 1.7** (minimal skill adoption example) — `examples/README.md`'s 3-line statement (epics line 667) MIRRORS this story's `fixtures/README.md`'s 3-line statement, with the explicit cross-reference *"distinct from `fixtures/` regression data"*. Story 1.6 establishes the convention; Story 1.7 follows it.
- **Story 2.3** (pipeline stages 1–3) — uses `caspian/fixtures/invalid/E001-bom/`, `E002-encoding/`, `E003-tab-indent/`, `E004-oversized/`, `E005-missing-delimiters/`, `E006-yaml-parse/`, `E007-unquoted-bool/` as the assertion source for stage 1–3 pipeline behavior. The epics ACs for Story 2.3 (lines 807–856) reference each fixture path directly.
- **Story 2.4** (pipeline stages 4–6) — uses `caspian/fixtures/invalid/E008-type-missing/` through `W003-unrecognized-schema-version/` as the assertion source for stage 4–6 envelope shape + namespace + allow-list scan behavior. The epics ACs for Story 2.4 (lines 866–916) reference each fixture path directly.
- **Story 2.5** (CLI walker) — uses `caspian/fixtures/valid/core-overview/minimal.md` and the broader `caspian/fixtures/valid/` directory as the inputs for `caspian validate <single-file>` and `caspian validate <directory>` smoke tests (epics lines 928–933).
- **Story 2.6** (`--format=json`) — uses `caspian/fixtures/` as the input for golden-snapshot tests of the CLI's JSON output mode (epics line 992).
- **Story 2.7** (conformance suite) — `conformance/cases/` ships ~17 cases mirroring the 17 codes 1:1 (epics lines 1047–1051). Each case has an `input.md` + `expected.json` shape that PARALLELS this story's fixture shape: the architecture line 623 spells out `001-bom-rejection/{input.md, expected.json}`. The conformance cases derive from but live separately from the fixtures (the conformance harness is vendor-neutral; the fixtures are validator-internal). **Story 1.6 ships only the fixtures, NOT the conformance cases**.
- **Architecture's release gate** — architecture line 719 spells out the docker container release gate: `docker run --rm -v $(pwd):/work node:20-alpine sh -c "cd /work && npx caspian validate ./fixtures/valid/"` MUST pass on a vanilla Linux container with no Claude Code installed. Story 1.6's `caspian/fixtures/valid/` is the input that gate consumes.

### Architecture Compliance — MUST follow

**Source: `_bmad-output/planning-artifacts/architecture.md` step-04 (*Test Fixture Conventions* lines 388–401), step-04 (*YAML Frontmatter Authoring* lines 402–451), step-06 (*Project Structure* — `fixtures/` subtree lines 593–608), and the cross-cutting *Fixture-first discipline* (lines 82, 786).**

- **Test Fixture Conventions (architecture lines 388–401):**
  - `fixtures/valid/<type-or-purpose>/<variant>.md` — artifacts that must validate without errors (warnings allowed). Example: `fixtures/valid/core-overview/minimal.md`.
  - `fixtures/invalid/<code>/<variant>.md` — artifacts that must emit a specific diagnostic code. Example: `fixtures/invalid/E001-bom/with-bom.md`.
  - Each invalid fixture has a sibling `<variant>.expected.json` listing the expected diagnostics: `{"diagnostics": [{"code": "CASPIAN-E001", "line": 1}]}`.
  - The fixtures regression suite is auto-discovery driven; adding a new fixture requires only the two files; the runner needs no edit. Story 1.6 ships the fixtures; the runner is Story 2.x's deliverable. Story 1.6 follows the convention so the runner can pick up the fixtures verbatim.
  - Explanatory comments belong in the markdown body of the fixture, never in the frontmatter; one sentence maximum (AC11 above; architecture line 400).

- **YAML Frontmatter Authoring conventions (architecture lines 402–451):**
  - **Quoted booleans** — every boolean-like value MUST be quoted in valid fixtures (`enabled: "true"`, `disable-model-invocation: "false"`). The unquoted form (`enabled: yes`) is the explicit E007 trigger and only appears in the `E007-unquoted-bool/` invalid fixture.
  - **Quoted version strings** — `schema_version: "0.1"` (always quoted; YAML 1.2 floats `0.1` are a known gotcha — see deferred-work line 29 from Story 1.4 review).
  - **Spaces, not tabs** — every indent in a valid fixture's frontmatter is **spaces only**; the `E003-tab-indent/` invalid fixture is the explicit tab violation.
  - **No comments in frontmatter** (AC10 above; architecture line 400).
  - **`---` delimiters with newlines** — opening `---` on its own line, closing `---` on its own line, no trailing whitespace.
  - **Block-style YAML preferred over flow-style** for valid fixtures (block-style for the `requires` array in `core-plan/minimal.md`; flow-style ONLY in the `E006-yaml-parse/unclosed-bracket.md` invalid fixture as the failure trigger).

- **Project Structure (architecture lines 593–608, fixtures subtree):**
  ```text
  fixtures/                              # Apache-2.0 (validator regression test data)
  ├── README.md                          # 3-line clarification: regression data, distinct from examples
  ├── LICENSE                            # full Apache 2.0 text
  ├── valid/
  │   ├── core-overview/minimal.md
  │   ├── core-epic/minimal.md
  │   ├── core-story/minimal.md
  │   ├── core-plan/minimal.md
  │   └── overlay-compat/
  │       ├── all-22-known-fields.md
  │       ├── x-extension.md
  │       └── vendor-namespaced.md
  └── invalid/
      ├── E001-bom/{with-bom.md, with-bom.expected.json}
      ├── E002-encoding/{non-utf8.md, non-utf8.expected.json}
      └── ... (17 directories total — see AC7)
  ```

- **Fixture-first discipline (architecture line 82):** Canonical valid + invalid fixtures are built **alongside** the schemas. Every reported validator bug post-v1.0 is replicated as a fixture before being fixed. CI runs the full fixture set on every spec PR. **Zero regressions on the valid-fixture set is a hard release gate** (NFR21). Story 1.6 establishes the **first** fixture set the gate runs against.

- **License layout (architecture lines 175–181, 749, 588):** `caspian/fixtures/LICENSE` (no `.md` extension; plain Apache 2.0 text). Each sub-package re-declares Apache-2.0 explicitly so isolated consumers see the license unambiguously (the Kubernetes/CNCF pattern). Same convention Story 1.4 used for `caspian/schemas/LICENSE` and Story 1.5 used for `caspian/diagnostics/LICENSE`.

- **Biome ignore (architecture line 433 + `caspian/.biomeignore` + `caspian/biome.json` line 15):** `fixtures/invalid/**` is excluded from biome's lint+format scope because invalid fixtures intentionally exhibit malformed JSON / non-UTF-8 / oversized YAML / etc. that biome would reject. **Story 1.6 does NOT modify `caspian/biome.json` or `caspian/.biomeignore`** unless the AC12 risk note's *Preferred* branch is taken (tighten `"!fixtures/invalid"` to `"!fixtures/invalid/**"`).

- **Decision A2 — `$ref` strategy (architecture line 215):** Not directly relevant to Story 1.6 (no JSON Schemas authored), but the `.expected.json` shape is intentionally schema-less in v1.0 — a future Story may author `caspian/schemas/v1/expected-diagnostics.schema.json` to validate `.expected.json` files structurally. **Out of scope for Story 1.6**; flagged as Deferred Work below.

- **Cross-cutting: single source of truth (architecture step-02 + lines 729–735):** Story 1.6's invalid fixtures derive their `code` strings (`"CASPIAN-EXXX"`) from `caspian/diagnostics/registry.json` (Story 1.5's deliverable). The 17 directory names + the 17 `.expected.json` `code` values MUST match the registry's 17 entries character-for-character. Any drift between this story's fixtures and Story 1.5's registry is a hard error to detect at code review time.

### Reference README Model

This is the canonical model for `caspian/fixtures/README.md`. It satisfies AC1.

```markdown
# Caspian Fixtures

The files in this directory are machine-consumed regression data for the
Caspian validator. They are not author-readable how-tos — for those, see
[`../examples/`](../examples/) (added by Story 1.7).
```

**Notes for the dev:**

- The body is exactly 3 lines of prose (lines 3, 4, 5 above; line 1 is the heading; line 2 is blank). The 3-line budget is the AC1 hard requirement.
- The link `../examples/` will 404 on GitHub until Story 1.7 ships. Same forward-reference convention Story 1.1's README applied (4-CTA hub) and Stories 1.2 + 1.3 + 1.4 + 1.5 followed for cross-references to not-yet-existing siblings. Acceptable per the project's *forward-reference annotation discipline*.
- No `*(coming soon — Story 1.7)*` annotation is required on the link itself — Story 1.6's README is not part of the spec prose subtree (`caspian/spec/`); the *coming-soon* annotation pattern is reserved for normative spec text.
- ATX header (`# Heading`), one blank line between header and body, LF line endings, UTF-8 no BOM, final newline.

### Reference Valid Fixture Models

These are the canonical models the dev uses to author the 4 minimal `core:*` fixtures + the 3 overlay-compat fixtures. Use them byte-faithfully unless a deviation is justified and recorded in Completion Notes.

#### Core Overview — `caspian/fixtures/valid/core-overview/minimal.md`

```markdown
---
type: core:overview
---

Minimal canonical `core:overview` fixture: documents carry `type` only; overviews omit `requires` and `produces` by convention.
```

#### Core Epic — `caspian/fixtures/valid/core-epic/minimal.md`

```markdown
---
type: core:epic
---

Minimal canonical `core:epic` fixture: documents carry `type` only; epics omit `requires` and `produces` by convention.
```

#### Core Story — `caspian/fixtures/valid/core-story/minimal.md`

```markdown
---
type: core:story
---

Minimal canonical `core:story` fixture: documents carry `type` only; stories omit `requires` and `produces` by convention.
```

#### Core Plan — `caspian/fixtures/valid/core-plan/minimal.md`

```markdown
---
type: core:plan
requires:
  - type: core:story
---

Minimal canonical `core:plan` fixture: plans MAY carry forward their production lineage by including `requires` even though documents typically omit it (per `spec/vocabulary/plan.md`).
```

**Per-fixture rationale:**

- Documentary types (`core:overview`, `core:epic`, `core:story`) carry `type` only because per `caspian/spec/core.md` lines 35–37 — *"requires/produces attach to active components (skills, commands, agents); documents carry `type` only"*. The vocabulary docs (`overview.md` line 73, `epic.md` line 96, `story.md` line 95, `plan.md` line 101) reinforce the same convention.
- `core:plan` carries the optional `requires: [{type: core:story}]` per `caspian/spec/vocabulary/plan.md` lines 92–98 — the plan-the-document MAY by convention carry forward its production lineage. This shape exercises BOTH the bare-`type` minimal envelope (3 fixtures) AND the `type` + `requires` shape (1 fixture), giving the auto-discovery runner two distinct envelope shapes to validate.
- Body content is a single sentence per AC11. Each sentence describes what the fixture exercises in plain English. The dev MAY shorten to empty body if preferred; the AC permits both.
- 2-space YAML block indentation under `requires` (matches architecture line 425 *"Spaces, not tabs"*).

#### Overlay-Compat: All-22-Known-Fields — `caspian/fixtures/valid/overlay-compat/all-22-known-fields.md`

```markdown
---
schema_version: "0.1"
type: core:overview
requires:
  - type: core:overview
produces:
  type: core:overview
name: overlay-compat-fixture
description: Demonstrates that all 22 recognized fields coexist in one envelope without diagnostics.
license: Apache-2.0
allowed-tools:
  - Read
  - Write
metadata:
  author: caspian-fixtures
compatibility:
  agentskills: "1.0"
when_to_use: When the validator must prove the 22 known fields parse cleanly together.
argument-hint: "<noop>"
arguments:
  - name: noop
    description: Placeholder argument for fixture purposes.
disable-model-invocation: "false"
user-invocable: "true"
model: claude-opus-4-7
effort: low
context:
  - "*.md"
agent: caspian-validator
hooks:
  on_load: noop
paths:
  - .
shell: bash
---

Overlay-compatibility fixture: exercises all 22 recognized frontmatter fields in one envelope (4 Caspian core + 6 agentskills.io canonical + 12 Claude Code overlay) to verify no W001 fires.
```

**All 22 fields itemized (for cross-check #5):**

| # | Field | Group | Source |
|---|---|---|---|
| 1 | `schema_version` | Caspian core | architecture step-04, FR1 |
| 2 | `type` | Caspian core | architecture step-04, FR4 |
| 3 | `requires` | Caspian core | architecture step-04, FR2 |
| 4 | `produces` | Caspian core | architecture step-04, FR3 |
| 5 | `name` | agentskills.io canonical | epics line 901, NFR13 |
| 6 | `description` | agentskills.io canonical | epics line 901 |
| 7 | `license` | agentskills.io canonical | epics line 901 |
| 8 | `allowed-tools` | agentskills.io canonical | epics line 901 |
| 9 | `metadata` | agentskills.io canonical | epics line 901 |
| 10 | `compatibility` | agentskills.io canonical | epics line 901 |
| 11 | `when_to_use` | Claude Code overlay | epics line 901 |
| 12 | `argument-hint` | Claude Code overlay | epics line 901 |
| 13 | `arguments` | Claude Code overlay | epics line 901 |
| 14 | `disable-model-invocation` | Claude Code overlay | epics line 901 |
| 15 | `user-invocable` | Claude Code overlay | epics line 901 |
| 16 | `model` | Claude Code overlay | epics line 901 |
| 17 | `effort` | Claude Code overlay | epics line 901 |
| 18 | `context` | Claude Code overlay | epics line 901 |
| 19 | `agent` | Claude Code overlay | epics line 901 |
| 20 | `hooks` | Claude Code overlay | epics line 901 |
| 21 | `paths` | Claude Code overlay | epics line 901 |
| 22 | `shell` | Claude Code overlay | epics line 901 |

The 22-field allow-list constant is materialized in code in Story 2.4 (`packages/core/src/constants.ts` `RECOGNIZED_FIELDS` — epics line 901). Story 1.6's fixture is the **input data** that constant validates against; the fixture shape is the contract.

**Notes:**

- Booleans are **quoted strings** (`disable-model-invocation: "false"`, `user-invocable: "true"`) per architecture lines 402–451 *YAML Frontmatter Authoring* — quoted booleans avoid YAML 1.1 footguns and exercise the same authoring discipline a real plugin author would follow. Unquoted booleans are reserved for the `E007-unquoted-bool/` invalid fixture.
- `schema_version: "0.1"` is quoted (avoids the YAML 1.2 float-cast trap recorded in deferred-work for Story 1.4).
- The fixture's `requires` and `produces` reference `core:overview` (self-referential) — semantically nonsensical for an overview document, but envelope-valid. The fixture exercises the envelope's shape, not the cross-document resolution semantics (out of scope for v1.0 per architecture).
- All 22 fields appear at the top level — none nested inside `metadata` or another container.
- Body is a single sentence per AC11 explaining what the fixture exercises.

#### Overlay-Compat: X-Extension — `caspian/fixtures/valid/overlay-compat/x-extension.md`

```markdown
---
type: core:overview
x-vendor-thing: experimental-flag-value
---

Overlay-compatibility fixture: demonstrates the `x-*` extension prefix is recognized without W001 (per FR6 escape-hatch contract).
```

#### Overlay-Compat: Vendor-Namespaced — `caspian/fixtures/valid/overlay-compat/vendor-namespaced.md`

```markdown
---
type: core:overview
examples:custom-field: vendor-defined-value
---

Overlay-compatibility fixture: demonstrates a `<vendor>:<field-name>` namespaced field name is recognized without W001 (per FR4 vendor-namespacing convention applied at the field level).
```

**Note on the `vendor:field-name` shape:** Per architecture line 906 — *"vendor-namespaced fields and `x-*` extensions are recognized without warning"*. The colon-bearing field name `examples:custom-field` is distinct from the colon-bearing `type` value `bmad:epic` (which is the W002 trigger). Namespaced FIELD NAMES (this fixture) are recognized; namespaced TYPE VALUES outside `core:` (the W002 fixture) emit a warning.

The `examples:` namespace is chosen to align with Story 1.7's adoption walkthrough (epics line 683) which uses the same `examples:greeter` namespace. This keeps the fixture set consistent with the example pedagogy.

### Reference Invalid Fixture Models

These are the canonical models the dev uses to author the 17 invalid fixture pairs. Use them byte-faithfully unless a deviation is justified and recorded.

For each fixture, the model below specifies (a) the directory path; (b) the `<variant>.md` content (with byte-level notes where applicable); (c) the `<variant>.expected.json` content (always single-entry); (d) the rationale (which stage emits the code, why the fixture exhibits it cleanly).

#### E001 — `caspian/fixtures/invalid/E001-bom/with-bom.md`

**`with-bom.md` content** (annotated; byte view):
```text
[BOM: EF BB BF]---\ntype: core:overview\n---\n\nFixture exhibits CASPIAN-E001: BOM byte sequence (`EF BB BF`) prefixed before the opening frontmatter delimiter triggers stage 1 byte-level rejection.\n
```

The first 3 bytes are `EF BB BF` (UTF-8 BOM). Authoring tip: in PowerShell or Node, write the file with explicit BOM bytes via `Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from(textContent, "utf8")])`. Confirm with `head -c 3 caspian/fixtures/invalid/E001-bom/with-bom.md | xxd` → `efbb bf`.

**`with-bom.expected.json` content:**
```json
{
  "diagnostics": [
    { "code": "CASPIAN-E001", "line": 1 }
  ]
}
```

**Rationale:** Stage 1 byte-level scan reads the first 3 bytes; if they equal `EF BB BF`, emit E001 immediately and short-circuit (fail-fast — stages 2–6 do not run). The architecture's D1 (line 285 *"Byte-level scan: BOM check, encoding sniff"*) runs before any other stage. Line 1 because the BOM is at byte 0 of line 1.

#### E002 — `caspian/fixtures/invalid/E002-encoding/non-utf8.md`

**`non-utf8.md` content** (Windows-1252 / CP-1252 encoded — NOT UTF-8):
```text
---\ntype: core:overview\nname: caf\x91\nfix\x92\n---\n\nFixture exhibits CASPIAN-E002: Windows-1252 smart-quote bytes (0x91, 0x92) are invalid as UTF-8 leading bytes; stage 1 encoding sniff rejects.\n
```

The bytes `0x91` and `0x92` are CP-1252 left/right single quotes; they are invalid UTF-8 leading bytes (continuation-byte range 0x80–0xBF; not a valid start of any UTF-8 sequence in isolation). Authoring tip: in Node, write via `fs.writeFileSync(path, Buffer.from([...].concat([0x91, 0x92, ...])), null)` — pass `null` (or omit) for the encoding to write raw bytes.

**`non-utf8.expected.json` content:**
```json
{
  "diagnostics": [
    { "code": "CASPIAN-E002", "line": 1 }
  ]
}
```

**Rationale:** Stage 1 encoding sniff (architecture D1) attempts strict UTF-8 decode of the file; the `0x91`/`0x92` bytes fail strict UTF-8 validation; emit E002. Fail-fast (stages 2–6 do not run). Line 1 because the encoding violation is a property of the whole file (anchor on line 1 by convention).

#### E003 — `caspian/fixtures/invalid/E003-tab-indent/tab-in-yaml.md`

**`tab-in-yaml.md` content** (UTF-8; literal `\t` shown as `<TAB>`):
```text
---\ntype: core:plan\nrequires:\n<TAB>- type: core:story\n---\n\nFixture exhibits CASPIAN-E003: tab character used for indentation inside frontmatter; stage 3 post-parse scan rejects (architecture D3).\n
```

**`tab-in-yaml.expected.json` content:**
```json
{
  "diagnostics": [
    { "code": "CASPIAN-E003", "line": 4 }
  ]
}
```

**Rationale:** YAML 1.2 syntactically permits tabs in some non-indent contexts but the architecture's D3 post-parse scan (line 287 + epics line 821) rejects ANY tab character inside frontmatter to avoid the well-known YAML 1.1 indentation footgun. The tab is on line 4 (inside the frontmatter, indenting the first sequence item under `requires:`).

#### E004 — `caspian/fixtures/invalid/E004-oversized/over-4kb.md`

**`over-4kb.md` content** (UTF-8; programmatic generation):

The frontmatter MUST be ≥ 4097 bytes between (exclusive of) the opening `---\n` and the closing `---\n`. The simplest faithful implementation:

```text
---\ntype: core:overview\ndescription: <REPEATED_FILLER_STRING_TO_REACH_4097_BYTES>\n---\n\nFixture exhibits CASPIAN-E004: frontmatter slice exceeds 4 KB hard cap (NFR4); stage 2 frontmatter extractor rejects.\n
```

Authoring tip (Node): build the description filler with `"x".repeat(4060)` (the exact count adjusts based on the leading `type:` line + the `description: ` prefix + the trailing newline; aim for total slice length ≥ 4097 bytes). Verify with `node -e 'const fs=require("fs");const s=fs.readFileSync(path,"utf8");const m=s.match(/^---\n([\s\S]*?)\n---/);console.log(Buffer.byteLength(m[1],"utf8"));'` → ≥ 4097.

**`over-4kb.expected.json` content:**
```json
{
  "diagnostics": [
    { "code": "CASPIAN-E004", "line": 1 }
  ]
}
```

**Rationale:** Architecture D4 (line 292) — *"Frontmatter byte cap: 4096 hard"*. Stage 2 measures the slice; ≥ 4097 emits E004. Fail-fast. Line 1 by convention (the byte-cap violation is a property of the whole slice).

#### E005 — `caspian/fixtures/invalid/E005-missing-delimiters/no-closing-delim.md`

**`no-closing-delim.md` content** (UTF-8; opening `---` with no closing `---`):
```text
---\ntype: core:overview\n\nFixture exhibits CASPIAN-E005: opening `---` delimiter but no closing `---`; stage 2 frontmatter extractor rejects.\n
```

**`no-closing-delim.expected.json` content:**
```json
{
  "diagnostics": [
    { "code": "CASPIAN-E005", "line": 1 }
  ]
}
```

**Rationale:** Stage 2 frontmatter extraction (architecture D2 line 286) requires both delimiters. No closing `---` → emit E005. Line 1 (anchor on the opening delimiter).

#### E006 — `caspian/fixtures/invalid/E006-yaml-parse/unclosed-bracket.md`

**`unclosed-bracket.md` content** (UTF-8; valid `---` delimiters; malformed YAML):
```text
---\ntype: core:plan\nrequires: [{type: core:story\n---\n\nFixture exhibits CASPIAN-E006: unclosed flow-sequence bracket inside frontmatter; stage 3 YAML parser (yaml v2.x strict 1.2 safe-load) rejects.\n
```

**`unclosed-bracket.expected.json` content:**
```json
{
  "diagnostics": [
    { "code": "CASPIAN-E006", "line": 3 }
  ]
}
```

**Rationale:** Stage 3 strict YAML 1.2 safe-load (architecture D3, NFR5). The `[{type: core:story` line opens a flow sequence + flow map without closing them; the `yaml` library throws. Line 3 (the offending line inside the frontmatter slice).

#### E007 — `caspian/fixtures/invalid/E007-unquoted-bool/yes-as-string.md`

**`yes-as-string.md` content** (UTF-8):
```text
---\ntype: core:overview\nenabled: yes\n---\n\nFixture exhibits CASPIAN-E007: unquoted YAML 1.1 boolean keyword (`yes`) is the string "yes" in YAML 1.2 but coerces to true in YAML 1.1; stage 3 post-parse scan flags the footgun (NFR8).\n
```

**`yes-as-string.expected.json` content:**
```json
{
  "diagnostics": [
    { "code": "CASPIAN-E007", "line": 3 }
  ]
}
```

**Rationale:** Architecture epics line 839 + NFR8 — stage 3 post-parse scan iterates parsed key-value pairs; if any string-typed value matches `{on, off, yes, no, y, n}` case-insensitively, emit E007. The `enabled: yes` line parses to the string `"yes"` in strict 1.2; the post-parse scan catches the YAML 1.1 boolean keyword footgun. Line 3 (the offending key-value).

#### E008 — `caspian/fixtures/invalid/E008-type-missing/no-type.md`

**`no-type.md` content** (UTF-8):
```text
---\nname: artifact-without-type\n---\n\nFixture exhibits CASPIAN-E008: frontmatter is valid YAML but omits the required `type` field; stage 4 envelope schema rejects.\n
```

**`no-type.expected.json` content:**
```json
{
  "diagnostics": [
    { "code": "CASPIAN-E008", "line": 1 }
  ]
}
```

**Rationale:** Stage 4 envelope schema validation maps to `envelope.schema.json` root `required: ["type"]`. Missing `type` → emit E008. Note: `name` is in the 22-known-fields list (agentskills.io canonical), so no W001 fires for the `name` field — the fixture exhibits ONLY E008 (per AC9's single-entry expectation). Line 1 by convention; the dev MAY anchor on line 2 (the line bearing `name:`) instead and record the choice; line 1 is the canonical default per architecture B-pipeline output convention.

#### E009 — `caspian/fixtures/invalid/E009-type-not-namespaced/bare-name.md`

**`bare-name.md` content** (UTF-8):
```text
---\ntype: epic\n---\n\nFixture exhibits CASPIAN-E009: `type` field present but lacks the `<namespace>:<name>` form; stage 4 envelope schema rejects via type.pattern.\n
```

**`bare-name.expected.json` content:**
```json
{
  "diagnostics": [
    { "code": "CASPIAN-E009", "line": 2 }
  ]
}
```

**Rationale:** Stage 4 envelope schema. `type.pattern: "^[^:]+:.+$"` requires at least one colon with non-empty parts on both sides. `epic` has no colon → emit E009. Line 2 (the `type:` line). Note: stage 5 namespace check is gated on `type` being a valid `<ns>:<name>`; since E009 fires first, no W002 cascades.

#### E010 — `caspian/fixtures/invalid/E010-requires-not-array/string-instead.md`

**`string-instead.md` content** (UTF-8):
```text
---\ntype: core:plan\nrequires: "core:story"\n---\n\nFixture exhibits CASPIAN-E010: `requires` is a string instead of an array; stage 4 envelope schema rejects via requires.type: array.\n
```

**`string-instead.expected.json` content:**
```json
{
  "diagnostics": [
    { "code": "CASPIAN-E010", "line": 3 }
  ]
}
```

**Rationale:** Stage 4 envelope schema. `requires.type: array` rejects a string. Line 3 (the offending `requires:` line).

#### E011 — `caspian/fixtures/invalid/E011-requires-entry-missing-type/missing-type-key.md`

**`missing-type-key.md` content** (UTF-8):
```text
---\ntype: core:plan\nrequires:\n  - tags: ["ready-for-dev"]\n---\n\nFixture exhibits CASPIAN-E011: `requires` entry is an object but missing the required `type` key; stage 4 envelope schema rejects via RequiresEntry.required.\n
```

**`missing-type-key.expected.json` content:**
```json
{
  "diagnostics": [
    { "code": "CASPIAN-E011", "line": 4 }
  ]
}
```

**Rationale:** Stage 4 envelope schema. `RequiresEntry.required: ["type"]` rejects an entry without `type`. Line 4 (the `- tags:` line, indented under `requires:`).

#### E012 — `caspian/fixtures/invalid/E012-requires-invalid-shape/extra-property.md`

**`extra-property.md` content** (UTF-8):
```text
---\ntype: core:plan\nrequires:\n  - type: core:story\n    weight: 5\n---\n\nFixture exhibits CASPIAN-E012: `requires` entry has an unknown property `weight`; stage 4 envelope schema rejects via RequiresEntry.additionalProperties: false.\n
```

**`extra-property.expected.json` content:**
```json
{
  "diagnostics": [
    { "code": "CASPIAN-E012", "line": 5 }
  ]
}
```

**Rationale:** Stage 4 envelope schema. `RequiresEntry.additionalProperties: false` rejects unknown keys. The unknown `weight` is on line 5 (under the `- type: core:story` entry). The dev MAY anchor on line 4 (the entry's start) instead and record the choice; line 5 (the offending key) is the more diagnostic-friendly anchor.

#### E013 — `caspian/fixtures/invalid/E013-produces-not-object/array-instead.md`

**`array-instead.md` content** (UTF-8):
```text
---\ntype: core:plan\nproduces: [core:plan]\n---\n\nFixture exhibits CASPIAN-E013: `produces` is an array instead of an object; stage 4 envelope schema rejects via Produces.type: object.\n
```

**`array-instead.expected.json` content:**
```json
{
  "diagnostics": [
    { "code": "CASPIAN-E013", "line": 3 }
  ]
}
```

**Rationale:** Stage 4 envelope schema. `produces` references the `Produces` `$def` which has `type: object`. An array (`[core:plan]`) is rejected. Line 3 (the `produces:` line).

#### E014 — `caspian/fixtures/invalid/E014-produces-missing-type/empty-object.md`

**`empty-object.md` content** (UTF-8):
```text
---\ntype: core:plan\nproduces: {}\n---\n\nFixture exhibits CASPIAN-E014: `produces` is an empty object lacking the required `type` field; stage 4 envelope schema rejects via Produces.required: ["type"].\n
```

**`empty-object.expected.json` content:**
```json
{
  "diagnostics": [
    { "code": "CASPIAN-E014", "line": 3 }
  ]
}
```

**Rationale:** Stage 4 envelope schema. `Produces.required: ["type"]` rejects an empty `produces` object. Line 3 (the `produces: {}` line).

#### W001 — `caspian/fixtures/invalid/W001-unknown-field/typo-metadat.md`

**`typo-metadat.md` content** (UTF-8):
```text
---\ntype: core:overview\nmetadat: {}\n---\n\nFixture exhibits CASPIAN-W001: frontmatter field `metadat` (typo of `metadata`) is not in the 22-known-fields allow-list, not `x-*`-prefixed, not `<vendor>:<name>`-namespaced; stage 6 allow-list scan emits a warning with edit-distance suggestion.\n
```

**`typo-metadat.expected.json` content:**
```json
{
  "diagnostics": [
    { "code": "CASPIAN-W001", "line": 3 }
  ]
}
```

**Rationale:** Stage 6 allow-list scan (architecture line 906). `metadat` is not in the 22 known fields, has no `x-` prefix, has no colon — fails all three recognition paths → emit W001. Stage 6 also produces an edit-distance suggestion (`Did you mean 'metadata'?`) per epics line 896, but the suggestion is in the diagnostic's `message` (not in the `.expected.json` since `.expected.json` only carries `code` + `line` per AC9). Line 3 (the offending field). Note: warning, not error → exit 0 by default per FR10.

#### W002 — `caspian/fixtures/invalid/W002-non-core-namespace/bmad-epic.md`

**`bmad-epic.md` content** (UTF-8):
```text
---\ntype: bmad:epic\n---\n\nFixture exhibits CASPIAN-W002: `type` value uses the `bmad:` namespace instead of the canonical `core:`; stage 5 namespace check emits a warning per FR13 (extensible-registry: warn, never reject).\n
```

**`bmad-epic.expected.json` content:**
```json
{
  "diagnostics": [
    { "code": "CASPIAN-W002", "line": 2 }
  ]
}
```

**Rationale:** Stage 5 namespace check (epics line 884). `bmad:epic` passes envelope shape (envelope `type.pattern` accepts any non-empty `<ns>:<name>`) but the namespace `bmad` is not the canonical `core` → emit W002. Line 2 (the `type:` line). FR13 warn-never-reject contract; warning, not error → exit 0 by default.

#### W003 — `caspian/fixtures/invalid/W003-unrecognized-schema-version/version-9-9.md`

**`version-9-9.md` content** (UTF-8):
```text
---\nschema_version: "9.9"\ntype: core:overview\n---\n\nFixture exhibits CASPIAN-W003: `schema_version` value `"9.9"` is not in the v1.0 recognized set `["0.1"]`; stage 5 schema-version check emits a warning per NFR16 (graceful degradation).\n
```

**`version-9-9.expected.json` content:**
```json
{
  "diagnostics": [
    { "code": "CASPIAN-W003", "line": 2 }
  ]
}
```

**Rationale:** Stage 5 schema-version check (epics line 889). `schema_version: "9.9"` is a recognized envelope field (passes stage 4) but the value is not in the v1.0 recognized set → emit W003. Quoted `"9.9"` avoids the YAML 1.2 float-cast trap (deferred-work for Story 1.4) and avoids cascading E007. Line 2 (the `schema_version:` line). Warning, not error → exit 0 by default.

### Library / Framework Requirements

**No new dependencies installed in this story.** Story 1.6 ships data files (markdown + JSON) under `caspian/fixtures/`; consumers are downstream concerns:

- **Story 2.3 / 2.4 (pipeline implementations)** — consume the 17 invalid fixtures via the `tests/fixtures-runner.test.ts` table-driven auto-discovery harness (architecture line 656). Story 1.6 ships the data; the harness lands in Story 2.x. Story 1.6's directory layout MUST match the harness's discovery convention (`fixtures/invalid/<code>/<variant>.md` + sibling `<variant>.expected.json`) — confirmed by the *Reference Invalid Fixture Models* layout above.
- **Story 2.5 (CLI walker)** — uses `fast-glob` to walk `fixtures/valid/` directories. Story 1.6's deliverables are the inputs; the walker is Story 2.5's deliverable.
- **Story 2.7 (conformance suite)** — derives ~17 cases from the 17 fixtures. Story 1.6 ships the source-of-truth fixtures; the conformance harness in `caspian/conformance/` is a future Story 2.7 deliverable that mirrors the fixture shape with one additional indirection (`conformance/cases/NNN-<slug>/{input.md, expected.json}` per architecture line 623).

The smoke gate (`pnpm -C caspian lint && pnpm -C caspian test`) does **not** validate fixture-runtime semantics (e.g., it does not invoke the validator against the fixtures). Biome formats and lints `*.json` syntax/style; it does not validate fixture content. AC5 (valid fixtures pass envelope schema), AC9 (.expected.json shape), AC13 (cross-checks) are verified by manual walkthrough — record those checks in the Debug Log.

### File Structure Requirements

After this story, the repository contains:

```text
caspian/
└── fixtures/                                                  # NEW directory (Story 1.6)
    ├── README.md                                              # 3-line statement: regression data, distinct from examples
    ├── LICENSE                                                # full Apache 2.0 text — byte-for-byte copy of caspian/LICENSE
    ├── valid/
    │   ├── core-overview/
    │   │   └── minimal.md
    │   ├── core-epic/
    │   │   └── minimal.md
    │   ├── core-story/
    │   │   └── minimal.md
    │   ├── core-plan/
    │   │   └── minimal.md
    │   └── overlay-compat/
    │       ├── all-22-known-fields.md
    │       ├── x-extension.md
    │       └── vendor-namespaced.md
    └── invalid/
        ├── E001-bom/
        │   ├── with-bom.md
        │   └── with-bom.expected.json
        ├── E002-encoding/
        │   ├── non-utf8.md
        │   └── non-utf8.expected.json
        ├── E003-tab-indent/
        │   ├── tab-in-yaml.md
        │   └── tab-in-yaml.expected.json
        ├── E004-oversized/
        │   ├── over-4kb.md
        │   └── over-4kb.expected.json
        ├── E005-missing-delimiters/
        │   ├── no-closing-delim.md
        │   └── no-closing-delim.expected.json
        ├── E006-yaml-parse/
        │   ├── unclosed-bracket.md
        │   └── unclosed-bracket.expected.json
        ├── E007-unquoted-bool/
        │   ├── yes-as-string.md
        │   └── yes-as-string.expected.json
        ├── E008-type-missing/
        │   ├── no-type.md
        │   └── no-type.expected.json
        ├── E009-type-not-namespaced/
        │   ├── bare-name.md
        │   └── bare-name.expected.json
        ├── E010-requires-not-array/
        │   ├── string-instead.md
        │   └── string-instead.expected.json
        ├── E011-requires-entry-missing-type/
        │   ├── missing-type-key.md
        │   └── missing-type-key.expected.json
        ├── E012-requires-invalid-shape/
        │   ├── extra-property.md
        │   └── extra-property.expected.json
        ├── E013-produces-not-object/
        │   ├── array-instead.md
        │   └── array-instead.expected.json
        ├── E014-produces-missing-type/
        │   ├── empty-object.md
        │   └── empty-object.expected.json
        ├── W001-unknown-field/
        │   ├── typo-metadat.md
        │   └── typo-metadat.expected.json
        ├── W002-non-core-namespace/
        │   ├── bmad-epic.md
        │   └── bmad-epic.expected.json
        └── W003-unrecognized-schema-version/
            ├── version-9-9.md
            └── version-9-9.expected.json
```

**File count:** 1 README + 1 LICENSE + 7 valid `.md` + 17 invalid `.md` + 17 `.expected.json` = **43 new files** under `caspian/fixtures/`.

**Do NOT create in this story:**

- `caspian/fixtures/CHANGELOG.md` — fixtures are versioned with the spec, not independently. Contrast with `caspian/diagnostics/CHANGELOG.md` (Story 1.5) which has decoupled semver because the diagnostic registry is a separate release artifact.
- Fixtures for `core:adr`, `core:convention`, `core:learning`, `core:glossary`, `core:review`, `core:rule`, `core:scratch` under `caspian/fixtures/valid/` — out of scope per AC4 (epics line 631 lists exactly 4 types: `core-overview`, `core-epic`, `core-story`, `core-plan`). The corresponding `coming soon — Story 1.6` annotations in `caspian/spec/vocabulary/{adr,convention,learning,glossary,review,rule,scratch}.md` are addressed in *Deferred Work* below.
- `caspian/examples/` directory or `caspian/examples/README.md` — Story 1.7's deliverable. Story 1.6's `fixtures/README.md` MAY forward-reference `../examples/` but does NOT create it.
- `caspian/conformance/` directory or any conformance case — Story 2.7's deliverable.
- `tests/fixtures-runner.test.ts` or any test runner code — Story 2.x's deliverable (architecture line 656).
- `caspian/schemas/v1/expected-diagnostics.schema.json` — a hypothetical meta-schema validating `.expected.json` shape would tighten the contract but is not mandated by any Story 1.6 AC. Flagged as Deferred Work.
- Any modification to `caspian/biome.json` or `caspian/.biomeignore` UNLESS the AC12 risk note's *Preferred* branch is taken (tighten `"!fixtures/invalid"` to `"!fixtures/invalid/**"` only if biome lints the `.expected.json` files unintentionally).
- Any modification to `caspian/spec/core.md`, `caspian/spec/README.md`, `caspian/spec/LICENSE.md`, `caspian/spec/vocabulary/**`, `caspian/schemas/v1/envelope.schema.json`, `caspian/schemas/v1/diagnostic-registry.schema.json`, `caspian/diagnostics/registry.json`, `caspian/diagnostics/CHANGELOG.md`, or `caspian/diagnostics/LICENSE` — Stories 1.2, 1.3, 1.4, 1.5 sealed those.
- Any modification to root-of-monorepo files (`caspian/package.json`, `caspian/pnpm-workspace.yaml`, `caspian/.editorconfig`, `caspian/.gitignore`, `caspian/.gitattributes`, `caspian/.npmrc`, `caspian/.nvmrc`, `caspian/tsconfig.base.json`) — out of scope.
- Anything outside `caspian/fixtures/` (with the single exception of the sprint-status update under `_bmad-output/implementation-artifacts/`).
- Any `.gitkeep` placeholder file — every directory holds at least one fixture.

### Anti-Patterns — DO NOT do

- DO NOT add YAML comments (`# comment`) to any frontmatter, valid or invalid (AC10). The fixtures are round-trip-stable; comments would survive YAML parse but disappear on serialize. Comments belong in commit messages and PR descriptions, not in fixture frontmatter.
- DO NOT add multi-paragraph or multi-sentence body to any fixture (AC11). Body is at most one sentence. If a fixture's purpose needs more explanation, that explanation belongs in a `examples/` walkthrough (Story 1.7) or in the architecture document, NOT in a fixture body.
- DO NOT add fields beyond `code` + `line` to any `.expected.json` (AC9). No `severity`, `rule`, `message`, `doc`, `field`, `suggestion`, or any other key. The fixture asserts only the `code` + `line` invariants; the message text and severity are pulled from the registry at runtime by the consuming runner.
- DO NOT use the multi-entry array form in `.expected.json` for any of the 17 invalid fixtures. Single-entry array is the convention for v1.0 (one fixture exhibits one diagnostic). Multi-entry forms exist in the architecture's continue-and-collect contract (line 911) but exercising that contract is reserved for a future fixture variant — out of scope for Story 1.6.
- DO NOT create fixtures for `core:adr`, `core:convention`, `core:learning`, `core:glossary`, `core:review`, `core:rule`, `core:scratch`. Epics line 631 lists exactly 4 valid `core-*` fixtures (overview, epic, story, plan). The 7 omitted types are addressed in *Deferred Work*.
- DO NOT use the architecture's variant filename `all-22-fields.md` (architecture line 391). The AC mandates `all-22-known-fields.md` (epics line 636 — *"the following files exist: `all-22-known-fields.md`"*). The AC text takes precedence over the architecture's earlier example.
- DO NOT inline binary content (BOM bytes, non-UTF-8 bytes) as escape sequences in markdown source — the `.md` fixture file MUST contain the raw bytes. Use Node / PowerShell to write the bytes directly. The reference models' `[BOM: EF BB BF]` notation is descriptive shorthand for what the file MUST contain at the byte level.
- DO NOT add a `description` or any text to `.expected.json` files — they are pure assertion data. Descriptions belong in the sibling `.md` fixture's body (one sentence per AC11).
- DO NOT use snake_case or PascalCase for directory names. The 17 invalid directories use the **exact kebab-case names from epics line 641** with **uppercase code letters** (`E001-bom`, NOT `e001-bom` or `E001_BOM`).
- DO NOT add `.gitkeep`, `.gitignore`, or any per-directory metadata file inside `caspian/fixtures/` subtrees. Every directory holds at least one fixture; placeholders are unnecessary.
- DO NOT modify `caspian/spec/core.md`, `caspian/spec/vocabulary/*.md`, or any other sealed file to update the *coming soon — Story 1.6* annotations. Those annotations are out of scope for Story 1.6; the 4 fixtures Story 1.6 authors will resolve their forward-references on disk; the 7 unresolved annotations are recorded as Deferred Work.
- DO NOT install `ajv`, `js-yaml`, `gray-matter`, or any validator dependency in this story. v1.0 ships the fixtures as content. Validators are downstream concerns (Epic 2 Story 2.1 pulls in ajv).
- DO NOT touch the surrounding `joselimmo-marketplace-bmad` repo. Specifically: do not modify root `CLAUDE.md`, do not edit `.claude-plugin/marketplace.json`, do not move planning artifacts.
- DO NOT bypass git hooks (`--no-verify`) when committing. There are none yet — habit only.
- DO NOT commit. Per project policy, the dev agent prepares and stages but does NOT commit.

### Source Citations — Verbatim Anchors

The following claims are sourced from the PRD, architecture, epics, and prior story files and reproduced exactly here so the dev agent does not have to re-derive them:

| Statement | Source | Wording / cross-reference |
|---|---|---|
| **Story 1.6 ACs (1–6)** | `_bmad-output/planning-artifacts/epics.md` lines 615–653 | The 6-AC block beginning *"### Story 1.6: Canonical fixture set (valid + invalid)"* and ending at the Story 1.7 section header. |
| **Test Fixture Conventions** | `_bmad-output/planning-artifacts/architecture.md` lines 388–401 | *"`fixtures/valid/<type-or-purpose>/<variant>.md` — artifacts that must validate without errors (warnings allowed) ... `fixtures/invalid/<code>/<variant>.md` — artifacts that must emit a specific diagnostic code ... Each invalid fixture has a sibling `<variant>.expected.json` listing the expected diagnostics ... The fixtures regression suite is table-driven over discovery: adding a new fixture requires only the two files; the runner needs no edit. Explanatory comments belong in the markdown body of the fixture, never in the frontmatter; one sentence maximum."* |
| **YAML Frontmatter Authoring (Fixtures + casper-core)** | `_bmad-output/planning-artifacts/architecture.md` lines 402–451 | Spaces-not-tabs, quoted-booleans, quoted-version-strings, `---` delimiters with newlines, no comments, block-style preferred. |
| **Fixture-first discipline** | `_bmad-output/planning-artifacts/architecture.md` line 82 | *"Canonical valid + invalid fixtures are built alongside the schemas. Every reported validator bug post-v1.0 is replicated as a fixture before being fixed. CI runs the full fixture set on every spec PR. Zero regressions on the valid-fixture set is a hard release gate."* |
| **NFR21 — fixture regression CI gate** | `_bmad-output/planning-artifacts/epics.md` line 132 | *"The canonical fixture set (valid + invalid) runs in CI for every PR to the spec repository. Zero regressions on the valid-fixture set is a hard release gate for every version bump."* |
| **FR38 — canonical fixtures as reading reference** | `_bmad-output/planning-artifacts/epics.md` line 94 | *"A plugin author can inspect the canonical fixture set (`fixtures/valid/*`, `fixtures/invalid/*`) shipped with the CLI as a reading reference for `what the spec looks like in practice`."* |
| **Vendor-neutrality runtime release gate** | `_bmad-output/planning-artifacts/epics.md` line 200 | *"`docker run --rm -v $(pwd):/work node:20-alpine sh -c 'cd /work && npx caspian validate ./fixtures/valid/'` passes on a vanilla Linux container with no Claude Code installed. Execution proof."* |
| **`fixtures/invalid/**` excluded from biome** | `_bmad-output/planning-artifacts/architecture.md` line 433 + `caspian/.biomeignore` line 4 + `caspian/biome.json` line 15 | *".biomeignore excludes `**/dist/`, `**/*.generated.ts`, `pnpm-lock.yaml`, `fixtures/invalid/**`"*. Biome glob negation behavior on `"!fixtures/invalid"` (without `/**`) is the AC12 risk-note item. |
| **22 recognized fields list** | `_bmad-output/planning-artifacts/epics.md` line 901 | *"`RECOGNIZED_FIELDS` declares the union: 4 Caspian core (`schema_version`, `type`, `requires`, `produces`) + 6 agentskills.io canonical (`name`, `description`, `license`, `allowed-tools`, `metadata`, `compatibility`) + 12 Claude Code overlay (`when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `model`, `effort`, `context`, `agent`, `hooks`, `paths`, `shell`)"*. |
| **`x-*` extensions and vendor-namespaced fields recognized without W001** | `_bmad-output/planning-artifacts/epics.md` line 904–906 | *"vendor-namespaced fields and `x-*` extensions are recognized without warning ... stage 6 does not emit `W001` for those fields (FR4, FR6, NFR16 graceful degradation)"*. |
| **Continue-and-collect within a single file (post-stage-3)** | `_bmad-output/planning-artifacts/epics.md` lines 908–910 | *"When a fixture has both an `E008` (missing `type`) and a `W001` (unknown field) condition, both diagnostics are emitted in the same validation pass."* — Story 1.6's invalid fixtures are authored to exhibit ONLY their target diagnostic with no incidental others. |
| **`type` `<namespace>:<name>` requirement** | `caspian/spec/core.md` lines 65–97 + `caspian/schemas/v1/envelope.schema.json` `type.pattern: "^[^:]+:.+$"` | The pattern requires at least one `:` with non-empty parts on both sides. Multi-colon values like `core:story:v2` are valid; bare names like `epic` are E009 violations. |
| **`schema_version` recognized set** | `caspian/spec/core.md` lines 39–63 | *"The set of values recognized by v1.0 of the spec is `["0.1"]`; any other value triggers the `CASPIAN-W003` warning"*. |
| **License layout — fixtures/ Apache-2.0 with full LICENSE re-declaration** | `_bmad-output/planning-artifacts/architecture.md` lines 175–181, 749, 588 | *"Each sub-package (`packages/core`, `packages/cli`, `plugins/casper-core`, `schemas`, `diagnostics`, `fixtures`) re-declares its Apache-2.0 LICENSE explicitly so isolated consumers see the license unambiguously."* |
| **6-stage validation pipeline** | `_bmad-output/planning-artifacts/architecture.md` lines 281–292 (D1–D4) + Story 1.5's *Per-code rationale* table (Cross-check #2) | D1 byte-level scan + D2 frontmatter extraction + D3 YAML parse + post-parse scan + D4 envelope/namespace/allow-list (stages 4, 5, 6). Each invalid fixture targets a specific stage; fail-fast for stages 1–3, continue-and-collect for stages 4–6. |
| **Fixtures-runner.test.ts auto-discovery** | `_bmad-output/planning-artifacts/architecture.md` lines 656, 846 | *"`tests/fixtures-runner.test.ts` is the auto-discovery entry consuming `fixtures/**`. Lives in `packages/core/tests/` (it tests core API behavior)."* — Story 1.6 ships fixtures; the runner is Story 2.x's deliverable. |
| **Project structure — fixtures subtree** | `_bmad-output/planning-artifacts/architecture.md` lines 593–608 | *"`fixtures/` — Apache-2.0 (validator regression test data); README.md (3-line clarification: complete walkthroughs, distinct from fixtures); LICENSE; valid/ ... invalid/ ..."* |

### Previous Story Intelligence (from Stories 1.1, 1.2, 1.3, 1.4, 1.5)

**Working-directory convention (from 1.1, restated 1.2 + 1.3 + 1.4 + 1.5).** `caspian/` is the working subdirectory. Every reference in epics / architecture to `spec/`, `schemas/`, `diagnostics/`, `fixtures/`, etc., resolves to `caspian/spec/`, `caspian/schemas/`, `caspian/diagnostics/`, `caspian/fixtures/`. Story 1.6 operates entirely inside `caspian/fixtures/` (new), reading from `caspian/schemas/v1/envelope.schema.json` and `caspian/diagnostics/registry.json` for cross-validation purposes only.

**Sealed predecessor files (from 1.2, 1.3, 1.4, 1.5).** Story 1.6 does NOT modify `caspian/spec/core.md`, `caspian/spec/README.md`, `caspian/spec/LICENSE.md`, any file under `caspian/spec/vocabulary/`, `caspian/schemas/v1/envelope.schema.json`, `caspian/schemas/v1/diagnostic-registry.schema.json`, `caspian/diagnostics/registry.json`, `caspian/diagnostics/CHANGELOG.md`, or `caspian/diagnostics/LICENSE`. The *coming soon — Story 1.6* annotations in `caspian/spec/README.md` line 22 + the 11 vocabulary docs MAY remain in place. The 4 vocabulary docs whose forward-references Story 1.6 resolves (`overview.md`, `epic.md`, `story.md`, `plan.md`) will have their links resolve naturally once the 4 fixtures exist on disk; no in-place edit of the spec files is needed (the link target appears, the *coming-soon* annotation becomes stale but stays in place per *forward-reference annotation discipline*). The 7 vocabulary docs whose forward-references Story 1.6 does NOT resolve (`adr.md`, `convention.md`, `learning.md`, `glossary.md`, `review.md`, `rule.md`, `scratch.md`) are addressed in *Deferred Work* below.

**License-file naming convention (from 1.1, 1.4, 1.5).** For code-side / data-side subtrees that consume the Apache-2.0 default, the convention is plain `LICENSE` (no extension, full Apache 2.0 text). Story 1.4's `caspian/schemas/LICENSE` and Story 1.5's `caspian/diagnostics/LICENSE` followed this; Story 1.6's `caspian/fixtures/LICENSE` follows the same. Spec subtrees use `LICENSE.md` (`.md` suffix) for the CC-BY-4.0 prose override (Story 1.2's `caspian/spec/LICENSE.md`). The `fixtures/` subtree is data-side, so plain `LICENSE`.

**No commits by the dev agent (from 1.1, 1.2, 1.3, 1.4, 1.5).** Per project policy, the dev agent prepares and stages but does NOT commit. Story 1.6 follows the same pattern: prepare the 43 new files, update this story file's Tasks/Subtasks + Dev Agent Record + File List, run the smoke gate, output the recommended commit command, **stop**.

**Conventional Commits prefix (from 1.2, 1.3, 1.4, 1.5).** `docs(spec):` for prose/data under `caspian/spec/`, `caspian/schemas/`, `caspian/diagnostics/`. For Story 1.6, the deliverables are markdown + JSON content under `caspian/fixtures/`. Architecturally `fixtures/` is part of the spec contract (machine-consumed regression data + author-readable reference per FR38 — architecture line 778). The most consistent prefix with the project's recent history is `docs(spec): add canonical fixture set (Story 1.6)`. An alternative `feat(spec):` is defensible for first-time emission of the fixture set; the dev agent picks one and records the choice in Completion Notes.

**Smoke-gate output expectations (from 1.1–1.5).** Story 1.5 ran biome over **7 files**. Story 1.6 adds 43 files but NONE are in biome's lint scope (`.md` files are not in `files.includes`; `.expected.json` files in `fixtures/invalid/**` are excluded). Expected new file count: **still 7 files**. The CHANGELOG is not authored in this story (no fixtures CHANGELOG); the README is markdown and is NOT linted by biome. The LICENSE has no extension and is NOT linted. `pnpm -C caspian test` continues to report *No projects matched the filters* and exit 0 (no source code or tests added; Stories 1.1–1.6 are all empty-workspace stories). **Risk:** if biome's `"!fixtures/invalid"` glob does NOT recurse to descendants, biome will lint the 17 `.expected.json` files and the count becomes 24. The AC12 risk-note explains the two acceptable resolutions.

**Forward-reference annotation discipline (from 1.2, 1.3, 1.4, 1.5).** Story 1.6 introduces the link `../examples/` in `caspian/fixtures/README.md`. This forward-reference will 404 on GitHub until Story 1.7 lands `caspian/examples/`. Per the project's discipline (acceptable, no inline `*(coming soon — Story 1.7)*` annotation on README links because README is not normative spec text), the link stays as-is. Story 1.7 will MIRROR this README's pattern for `examples/README.md`'s reciprocal link to `../fixtures/`.

**Sprint-status update pattern (from 1.1–1.5).** Sprint status transitions are: `backlog → ready-for-dev` (create-story) → `in-progress` (dev-story Step 4) → `review` (dev-story Step 9) → `done` (after code review). Story 1.6 is currently `backlog`; this create-story workflow transitions it to `ready-for-dev`.

**Deferred-work tracker (from 1.1, 1.3, 1.4, 1.5).** `_bmad-output/implementation-artifacts/deferred-work.md` is append-only. Story 1.6 introduces (at minimum) two new Deferred-Work themes: (a) the 7 vocabulary docs whose `coming soon — Story 1.6` annotations Story 1.6 does NOT resolve (one item per doc, or one consolidated item); (b) optionally, the AC12 biome-glob-tightening item if the dev took the *Preferred* branch. See *Deferred Work* below.

**Biome-on-JSON behavior (from 1.1, 1.4, 1.5).** Biome 2.4.13 lints and formats `*.json` files. The `.expected.json` files MUST pass biome's formatter + linter without warnings IF they end up in scope (see AC12 risk-note). Resolve any complaint by editing the JSON (correct indentation, line endings, etc.) — never by relaxing `caspian/biome.json` (relaxing the lint baseline is out of scope).

**Reference Model authoring style (from 1.4, 1.5).** Stories 1.4 + 1.5 supplied complete *Reference* models the dev agent used byte-faithfully. Story 1.6 supplies the *Reference README Model* + *Reference Valid Fixture Models* (4 core + 3 overlay-compat) + *Reference Invalid Fixture Models* (17) — 25 reference models in total. The dev agent uses each one byte-faithfully unless a deviation is justified and recorded in Completion Notes.

### Git Intelligence — Recent Patterns

Last 5 commits (most recent first):

```text
e0e863e chore(review-1-5): apply code-review patches + sync sprint status
f2bf2eb docs(spec): add diagnostic registry + registry schema (Story 1.5)
45dfdbc chore(review-1-4): apply code-review patches + sync sprint status
29eaed1 docs(spec): add envelope JSON Schema (Story 1.4)
f858f35 chore(review-1-3): apply code-review patches + sync sprint status
```

Patterns to follow:

- Conventional Commits prefix matching the change kind. For Story 1.6: `docs(spec): add canonical fixture set (Story 1.6)` (recommended; matches 1.2 / 1.3 / 1.4 / 1.5 cadence). Alternative `feat(spec):` is acceptable for first-time emission of the fixture set.
- Story number in commit message (`(Story 1.6)` parenthetical; trailing).
- Single coherent commit — all 43 new files (1 README + 1 LICENSE + 7 valid `.md` + 17 invalid `.md` + 17 `.expected.json`) ship together. Do not split across commits.
- After review, a separate `chore(review-1-6): apply code-review patches + sync sprint status` commit captures any review patches — same pattern as 1.1–1.5.
- No co-authored-by trailer unless the user requests one.

### Latest Tech Information

No new dependencies are installed in this story. Three external standards / consumer-side references whose stability matters:

- **YAML 1.2 strict-mode** — the `yaml` v2.x library (lands in Story 2.3 as a `@caspian/core` dep) parses YAML 1.2 strictly. Boolean keywords from YAML 1.1 (`yes`, `no`, `on`, `off`, `y`, `n`) parse as **strings** in 1.2, not as booleans. Story 1.6's `E007-unquoted-bool/yes-as-string.md` exhibits this footgun. The post-parse scan that emits E007 is Story 2.3's deliverable; Story 1.6 only ships the input fixture.
- **UTF-8 BOM detection** — UTF-8 BOM is the byte sequence `EF BB BF`. Strict UTF-8 readers (e.g., Node's `fs.readFileSync(path, "utf8")`) **silently strip** the BOM and return the content without it; the byte-level BOM check (architecture D1) reads the raw buffer first via `fs.readFileSync(path, null)` (binary mode) and inspects the first 3 bytes before any UTF-8 decode. Story 1.6's `E001-bom/with-bom.md` contains the literal `EF BB BF` prefix; the dev MUST author it with byte-level precision.
- **Windows-1252 vs UTF-8** — Windows-1252 (CP-1252) and ISO-8859-1 share the lower 256 codepoints with Unicode but differ in bytes `0x80–0x9F`. Strict UTF-8 decode rejects bytes `0x80–0xBF` as invalid leading bytes (those are continuation bytes in UTF-8). Story 1.6's `E002-encoding/non-utf8.md` contains bytes like `0x91` / `0x92` (CP-1252 smart quotes); these fail strict UTF-8 validation. Authoring tip: write via `fs.writeFileSync(path, buffer)` where `buffer` is constructed from raw bytes, NOT from a JavaScript string.

No web research beyond the existing planning artifacts is required. The PRD, architecture, epics, `caspian/spec/core.md`, Story 1.4's envelope schema, and Story 1.5's diagnostic registry fully specify the fixture shapes, content, and expected diagnostic emissions.

### Project Structure Notes

After Story 1.6 ships, the `caspian/fixtures/` directory is **structurally complete for v1.0** per the architecture's project tree (lines 593–608). Future stories adding fixtures:

- **Story 1.7** does NOT add fixtures — it adds `caspian/examples/` walkthroughs.
- **Story 2.x stories** MAY add additional `<variant>.md` + `<variant>.expected.json` pairs to existing `caspian/fixtures/invalid/<code>/` directories as additional regression cases (e.g., `E001-bom/utf16-le-bom.md` for the UTF-16 LE BOM variant if the spec extends to detect it). The Story 1.6 layout is the foundation; Story 2.x extends it horizontally without restructuring.
- **Story 5.x** MAY add fixtures for new codes if a v0.2+ RFC reserves a code (e.g., the proposed `CASPIAN-W004` from Story 1.5's deferred work). Each new code adds one new `caspian/fixtures/invalid/<code>/<variant>.md + .expected.json` pair following the same convention.

The spec subtree (`caspian/spec/`), the schemas subtree (`caspian/schemas/v1/`), and the diagnostics subtree (`caspian/diagnostics/`) reach a stable v1.0 state by Story 1.5. Story 1.6 closes the fixture-side loop. After Story 1.7 (which adds `caspian/examples/`), the `caspian/` content surface is structurally complete for the spec side of v1.0; subsequent epics extend the source-code surface (`caspian/packages/`, `caspian/plugins/`, `caspian/site/`, `caspian/conformance/`).

### Deferred Work

Story 1.6 introduces these Deferred-Work items the dev agent should append to `_bmad-output/implementation-artifacts/deferred-work.md` under a new `## Deferred from: code review of 1-6-canonical-fixture-set-valid-invalid (2026-04-27)` (or `## Deferred during dev of 1-6-...` if surfaced before code review) section:

1. **`caspian/spec/vocabulary/{adr,convention,learning,glossary,review,rule,scratch}.md` references unresolved fixtures** — each of the 7 docs links to `../../fixtures/valid/core-<type>/minimal.md` *(coming soon — Story 1.6)*; Story 1.6 only authored the 4 fixtures the AC mandates (overview, epic, story, plan). The 7 unresolved links will 404 on GitHub. A future story or a v0.2+ RFC could either (a) add the missing 7 fixtures (`adr/minimal.md`, `convention/minimal.md`, `learning/minimal.md`, `glossary/minimal.md`, `review/minimal.md`, `rule/minimal.md`, `scratch/minimal.md`), or (b) remove the *coming-soon* annotations from those 7 vocabulary docs in a tidy-up pass. The vocabulary docs are sealed (Story 1.3); any in-place edit happens in a future story.
2. **`caspian/spec/README.md` line 22 references `../fixtures/` *(coming soon — Story 1.6)*** — Story 1.6 RESOLVES this annotation (the `caspian/fixtures/` directory now exists with content). The `coming-soon` annotation becomes stale but stays in place per *forward-reference annotation discipline*. A future tidy-up may remove it.
3. **`.expected.json` shape has no JSON Schema validation** — the AC9 shape is enforced by manual cross-check #3 only. A future Story (likely Story 2.6 or a hardening pass) could author `caspian/schemas/v1/expected-diagnostics.schema.json` to validate `.expected.json` files structurally and add `pnpm -C caspian ajv-validate-expected-diagnostics` as a CI step. Out of scope for Story 1.6.
4. **Single-entry `.diagnostics` array convention** — Story 1.6's 17 invalid fixtures each emit ONE diagnostic. The architecture's continue-and-collect contract (line 911) admits multi-diagnostic fixtures (e.g., a fixture exhibiting both E008 + W001). A future Story could add cross-cutting fixtures that exercise the multi-emit behavior, e.g., `caspian/fixtures/invalid/multi-emit/E008-and-W001/<variant>.md` + `<variant>.expected.json` with two-entry array. Out of scope for Story 1.6.
5. **Line-number anchors in `.expected.json` are best-effort** — Story 1.6 anchors line numbers based on the dev's manual count of where the offending construct appears. Story 2.3 / 2.4's pipeline implementation will produce the authoritative line numbers; ±1 deviations between this story's expectations and Story 2.x's pipeline output may surface during Story 2.6 (snapshot tests). The deviation is reconciled at Story 2.6 fixture-update time, NOT at Story 1.6 authoring time.
6. **(Conditional)** **`caspian/biome.json` line 15 — `"!fixtures/invalid"` glob recursion** — if the AC12 risk-note's *Preferred* branch was taken, no Deferred-Work entry needed (the glob is already tightened). If the *Alternative* branch was taken (accepted higher file count), record this as a Deferred-Work item: *"`caspian/biome.json` excludes `fixtures/invalid` (without `/**`); biome lints the 17 `.expected.json` files. Tightening to `fixtures/invalid/**` would mirror `caspian/.biomeignore` line 4 exactly and reduce the lint scope. Out of scope for Story 1.6 if accepted; a future hardening pass may revisit."*
7. **No `caspian/fixtures/CHANGELOG.md`** — Story 1.6 deliberately omits a CHANGELOG (fixtures versioned with the spec, not independently). If the project later decides fixtures need their own append-only changelog (parallel to `caspian/diagnostics/CHANGELOG.md` from Story 1.5), a future story adds it. Out of scope for Story 1.6.
8. **Overlay-compat `all-22-known-fields.md` field-level validation depth** — the fixture exercises the 22 fields at the envelope's `additionalProperties: true` allow-list level. Each individual field's value-shape (e.g., `allowed-tools` MUST be an array of strings; `metadata` MUST be an object) is NOT enforced by `envelope.schema.json` (the spec deliberately stops at envelope shape). A future story (post-v1.0) could author per-field sub-schemas under `caspian/schemas/v1/overlay/agentskills.schema.json` and `caspian/schemas/v1/overlay/claude-code.schema.json` if the ecosystem demands stricter overlay validation. Out of scope for Story 1.6 and v1.0.

### References

- **Epic 1 — Story 1.6 ACs:** `_bmad-output/planning-artifacts/epics.md` lines 615–653 (`### Story 1.6: Canonical fixture set (valid + invalid)`).
- **Epic 1 — Validator Scope (T1.5) — fixture coverage:** `_bmad-output/planning-artifacts/epics.md` lines 156–165, 200, 227.
- **Epic 1 — FR38 (canonical fixtures as reading reference):** `_bmad-output/planning-artifacts/epics.md` line 94, 306.
- **Epic 1 — NFR21 (fixture regression CI gate):** `_bmad-output/planning-artifacts/epics.md` line 132.
- **Epic 1 — 22-known-fields list:** `_bmad-output/planning-artifacts/epics.md` line 901.
- **Epic 1 — Vendor + x-* extensions recognized without W001:** `_bmad-output/planning-artifacts/epics.md` lines 904–906.
- **Epic 1 — Continue-and-collect contract:** `_bmad-output/planning-artifacts/epics.md` lines 908–910.
- **Epic 2 — Stage 1–3 pipeline ACs (consume `caspian/fixtures/invalid/E001..E007`):** `_bmad-output/planning-artifacts/epics.md` lines 807–856.
- **Epic 2 — Stage 4–6 pipeline ACs (consume `caspian/fixtures/invalid/E008..W003`):** `_bmad-output/planning-artifacts/epics.md` lines 866–916.
- **Epic 2 — CLI walker ACs (consume `caspian/fixtures/valid/`):** `_bmad-output/planning-artifacts/epics.md` lines 928–933.
- **Epic 2 — `--format=json` golden snapshots:** `_bmad-output/planning-artifacts/epics.md` lines 992–1011.
- **Epic 2 — Conformance suite cases (parallel to fixtures, separate harness):** `_bmad-output/planning-artifacts/epics.md` lines 1047–1051.
- **Architecture — Test Fixture Conventions:** `_bmad-output/planning-artifacts/architecture.md` lines 388–401.
- **Architecture — YAML Frontmatter Authoring (Fixtures + casper-core):** `_bmad-output/planning-artifacts/architecture.md` lines 402–451.
- **Architecture — Fixture-first discipline:** `_bmad-output/planning-artifacts/architecture.md` lines 82, 786.
- **Architecture — Pattern Examples (good vs anti-pattern fixture layout):** `_bmad-output/planning-artifacts/architecture.md` lines 472–506.
- **Architecture — Project tree (fixtures subtree):** `_bmad-output/planning-artifacts/architecture.md` lines 593–608.
- **Architecture — `.biomeignore` excludes `fixtures/invalid/**`:** `_bmad-output/planning-artifacts/architecture.md` line 433.
- **Architecture — Validation Pipeline D1–D4 (stage emission contract for the 17 codes):** `_bmad-output/planning-artifacts/architecture.md` lines 281–292.
- **Architecture — Diagnostic Registry C1–C5 (17 codes; same source Story 1.5 consumed):** `_bmad-output/planning-artifacts/architecture.md` lines 251–279.
- **Architecture — License layout (per-directory + root composite):** `_bmad-output/planning-artifacts/architecture.md` lines 175–181, 749, 588.
- **Architecture — Vendor-neutrality runtime release gate (`docker run ... npx caspian validate ./fixtures/valid/`):** `_bmad-output/planning-artifacts/architecture.md` line 719.
- **Architecture — `tests/fixtures-runner.test.ts` auto-discovery:** `_bmad-output/planning-artifacts/architecture.md` lines 656, 846.
- **PRD — FR38 (canonical fixtures as reading reference):** `_bmad-output/planning-artifacts/prd.md` (FR38 section).
- **PRD — NFR4 (4 KB hard cap):** `_bmad-output/planning-artifacts/prd.md` (NFR4 section).
- **PRD — NFR5 (safe-load YAML 1.2):** `_bmad-output/planning-artifacts/prd.md` (NFR5 section).
- **PRD — NFR8 (tab/unquoted-bool reject):** `_bmad-output/planning-artifacts/prd.md` (NFR8 section).
- **PRD — NFR16 (graceful degradation):** `_bmad-output/planning-artifacts/prd.md` line 591.
- **PRD — NFR21 (fixture regression CI gate):** `_bmad-output/planning-artifacts/prd.md` (NFR21 section).
- **`caspian/spec/core.md` — `type` field shape, schema_version semantics, extension mechanisms:** sealed by Story 1.2.
- **`caspian/spec/vocabulary/{overview,epic,story,plan}.md` — per-type rationale + examples:** sealed by Story 1.3; Story 1.6 resolves the *coming soon — Story 1.6* fixture-link forward-references for these 4 types.
- **`caspian/schemas/v1/envelope.schema.json` — Story 1.4's envelope schema** consumed by valid-fixture cross-checks.
- **`caspian/diagnostics/registry.json` — Story 1.5's diagnostic registry** consumed by invalid-fixture `.expected.json` `code` strings.
- **Implementation readiness report — Story 1.6 traceability:** `_bmad-output/planning-artifacts/implementation-readiness-report-2026-04-26.md` (search for Story 1.6 entries).
- **Story 1.1 — Working-directory convention, root LICENSE, biome.json + .biomeignore baseline, conventional-commits prefix:** `_bmad-output/implementation-artifacts/1-1-project-bootstrap-monorepo-scaffold-dual-license-layout.md`.
- **Story 1.2 — `caspian/spec/` foundation, forward-reference discipline, smoke-gate pattern, sealed-files convention:** `_bmad-output/implementation-artifacts/1-2-caspian-core-normative-reference-spec-core-md.md`.
- **Story 1.3 — Vocabulary directory, working-directory persistence, deferred-work pattern:** `_bmad-output/implementation-artifacts/1-3-canonical-core-vocabulary-docs.md`.
- **Story 1.4 — `caspian/schemas/v1/envelope.schema.json` + `caspian/schemas/LICENSE` precedent; Reference Schema Model pattern:** `_bmad-output/implementation-artifacts/1-4-envelope-json-schema-draft-2020-12.md`.
- **Story 1.5 — `caspian/diagnostics/registry.json` + `caspian/schemas/v1/diagnostic-registry.schema.json`; Reference Registry Model + Reference Registry-Schema Model patterns; deferred-work for `CASPIAN-W004`:** `_bmad-output/implementation-artifacts/1-5-diagnostic-registry-registry-schema.md`.
- **Deferred work tracker:** `_bmad-output/implementation-artifacts/deferred-work.md`.
- **Project conventions:** `F:\work\joselimmo-marketplace-bmad\CLAUDE.md`.
- **YAML 1.2 specification (external):** <https://yaml.org/spec/1.2.2/>.
- **JSON Schema Draft 2020-12 specification (external):** <https://json-schema.org/draft/2020-12/release-notes> — same draft Story 1.4 + 1.5 consumed.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (`claude-opus-4-7[1m]`) via the BMad `/bmad-dev-story` workflow on 2026-04-27.

### Debug Log References

- **Inventory audit (`node`-driven, ad-hoc).** Listed all 43 fixture deliverables with size + existence checks; produced (excluding LICENSE + README): 7 valid `.md` (sizes 145–946 bytes) + 17 invalid `.md` (sizes 141–4231 bytes) + 17 `.expected.json` (each 69 bytes — single-entry array form, AC9 compliant). LICENSE = 11358 bytes (byte-faithful copy of `caspian/LICENSE`). README = 221 bytes (3-line body per *Reference README Model*).

- **Cross-check #1 — valid fixtures pass envelope schema (AC5).** Re-ran with `js-yaml@4.1.1` (resolved from `caspian/node_modules/.pnpm/`) so block-style `requires:` parses correctly. Each of the 7 valid fixtures parsed by `yaml.load()` then traced through a hand-coded `envelope.schema.json` simulator (root `required: ["type"]`, `type.pattern: "^[^:]+:.+$"`, `requires` array shape, `RequiresEntry.required: ["type"]` + `additionalProperties: false`, `produces` object shape, `Produces.required: ["type"]` + `additionalProperties: false`). All 7 fixtures pass: `core-overview/minimal.md` (type only) ✅, `core-epic/minimal.md` ✅, `core-story/minimal.md` ✅, `core-plan/minimal.md` (type + requires `[{type: core:story}]`) ✅, `overlay-compat/all-22-known-fields.md` (type + requires + produces, all 22 keys present) ✅, `overlay-compat/x-extension.md` (type + `x-vendor-thing`) ✅, `overlay-compat/vendor-namespaced.md` (type + `examples:custom-field`) ✅. **Result: `AC5_envelope_pass=true`** for all 7 valid fixtures.

- **Cross-check #1 first pass false-positive note.** A naive line-by-line YAML parser (used before `js-yaml` was located in `caspian/node_modules/.pnpm/js-yaml@4.1.1/`) reported false-positive `E010-equivalent` failures for `core-plan/minimal.md` and `overlay-compat/all-22-known-fields.md` because it parsed block-style `requires:` as an empty string. Re-running with the real `js-yaml@4.1.1` parser confirmed the false positive. The fixtures are correct as authored; no edits needed.

- **Cross-check #2 — invalid fixtures emit ONLY their target diagnostic (AC13).** Walked each of the 17 invalid fixtures through the architecture's 6-stage pipeline (architecture lines 281–292):
  - **E001–E007 (fail-fast stages 1–3):** Each fixture exercises exactly one stage; subsequent stages do not run per architecture's fail-fast contract for stages 1–3.
  - **E008 (`no-type.md`):** Stage 4 fires E008 (`required: ["type"]`); stages 5–6 emit no incidental diagnostic — `name` is in the 22-known allow-list (no W001), `schema_version` absent (no W003), namespace check is gated on a valid `type` (no W002). Single-emit confirmed.
  - **E009 (`bare-name.md`, `type: epic`):** Stage 4 fires E009 (type pattern); stage 5 namespace check is gated on a valid `<ns>:<name>` form, so no W002. No `schema_version` (no W003). Only `type` field present, in allow-list (no W001). Single-emit confirmed.
  - **E010 (`string-instead.md`, `type: core:plan`, `requires: "core:story"`):** Stage 4 fires E010 (`requires.type: array`). Stage 5: `core:plan` is canonical core (no W002), no `schema_version` (no W003). Stage 6: `type` + `requires` both in allow-list (no W001). Single-emit confirmed.
  - **E011 (`missing-type-key.md`):** Stage 4 fires E011 (`RequiresEntry.required: ["type"]`). Other stages: same as E010, no incidental diagnostics. Single-emit confirmed.
  - **E012 (`extra-property.md`):** Stage 4 fires E012 (`RequiresEntry.additionalProperties: false`). Other stages: same as E010, no incidental. Single-emit confirmed.
  - **E013 (`array-instead.md`):** Stage 4 fires E013 (`produces.type: object`). Other stages: same, no incidental. Single-emit confirmed.
  - **E014 (`empty-object.md`):** Stage 4 fires E014 (`Produces.required: ["type"]`). Other stages: same, no incidental. Single-emit confirmed.
  - **W001 (`typo-metadat.md`):** Stage 4 passes (root `additionalProperties: true`); stage 5: `core:overview` canonical (no W002), no `schema_version` (no W003); stage 6: `metadat` not in allow-list, not `x-`-prefixed, not `<vendor>:<name>` (no colon) → fires W001. Single-emit confirmed.
  - **W002 (`bmad-epic.md`):** Stage 4 passes (`bmad:epic` matches `type.pattern`); stage 5 namespace check fires W002 (`bmad` ≠ `core`); no `schema_version` (no W003); stage 6: only `type`, in allow-list (no W001). Single-emit confirmed.
  - **W003 (`version-9-9.md`):** Stage 4 passes; stage 5: `core:overview` canonical (no W002), `schema_version: "9.9"` not in v1.0 set `["0.1"]` → fires W003; stage 6: `schema_version` + `type` both in allow-list (no W001). Single-emit confirmed. Note: `"9.9"` is quoted to avoid the YAML 1.2 float-cast trap (deferred-work for Story 1.4 review); the quoted form parses as the string `"9.9"`, exercising the W003 check cleanly without cascading into E007 (the unquoted-bool check).

- **Cross-check #3 — `.expected.json` shape audit (AC9).** For each of the 17 `.expected.json` files: parsed as JSON; verified top-level shape `{"diagnostics": [...]}` with **exactly one property** at root; verified each diagnostic entry has **exactly two properties** `code` + `line` with no extras; verified `code` matches `^CASPIAN-(E|W)\d{3}$`; verified `code` value matches the directory's prefix code. **Result: `AC9_all_clean=true`** across all 17 files. The 17 `.expected.json` payloads:
  - E001 → `[{"code":"CASPIAN-E001","line":1}]`, E002 → `[{"code":"CASPIAN-E002","line":1}]`, E003 → `[{"code":"CASPIAN-E003","line":4}]`, E004 → `[{"code":"CASPIAN-E004","line":1}]`, E005 → `[{"code":"CASPIAN-E005","line":1}]`, E006 → `[{"code":"CASPIAN-E006","line":3}]`, E007 → `[{"code":"CASPIAN-E007","line":3}]`, E008 → `[{"code":"CASPIAN-E008","line":1}]`, E009 → `[{"code":"CASPIAN-E009","line":2}]`, E010 → `[{"code":"CASPIAN-E010","line":3}]`, E011 → `[{"code":"CASPIAN-E011","line":4}]`, E012 → `[{"code":"CASPIAN-E012","line":5}]`, E013 → `[{"code":"CASPIAN-E013","line":3}]`, E014 → `[{"code":"CASPIAN-E014","line":3}]`, W001 → `[{"code":"CASPIAN-W001","line":3}]`, W002 → `[{"code":"CASPIAN-W002","line":2}]`, W003 → `[{"code":"CASPIAN-W003","line":2}]`.

- **Cross-check #4 — frontmatter has no YAML comments (AC10).** Iterated all 24 fixtures (7 valid + 17 invalid). For each, extracted the slice between the `---` delimiters (with E001 BOM-aware leading-byte strip, and E005 missing-closing-delim fallback to "from opening `---` to first blank line"), scanned for any `^\s*#` comment lines. **Result: `AC10_all_clean=true`** — zero comment lines in any frontmatter slice across all 24 fixtures.

- **Cross-check #5 — `all-22-known-fields.md` inventory (AC6).** Extracted top-level YAML keys from the frontmatter slice via line-anchored regex `^[a-zA-Z_][a-zA-Z0-9_-]*:`. **Result: `topKeys.length === 22`** with the exact expected set: `["schema_version","type","requires","produces","name","description","license","allowed-tools","metadata","compatibility","when_to_use","argument-hint","arguments","disable-model-invocation","user-invocable","model","effort","context","agent","hooks","paths","shell"]`. **Missing: `[]`. Extra: `[]`.** All 4 Caspian core + 6 agentskills.io canonical + 12 Claude Code overlay fields are present at the top level, single-instance.

- **Byte-level verification (E001–E004).** Used `node` to read each byte-level fixture as a Buffer and verify the byte-level invariants:
  - **E001 `with-bom.md`:** total size 183 bytes; first 3 bytes hex = `efbbbf` (UTF-8 BOM). Author-side technique: `Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from(textContent, "utf8")])`. Verified.
  - **E002 `non-utf8.md`:** total size 188 bytes; strict UTF-8 decode via `new TextDecoder("utf-8", { fatal: true })` THROWS, confirming the file is not valid UTF-8. Author-side technique: `Buffer.concat([Buffer.from(textPart1, "utf8"), Buffer.from([0x91]), Buffer.from(textPart2, "utf8"), Buffer.from([0x92]), Buffer.from(textPart3, "utf8")])`. The CP-1252 smart-quote bytes 0x91 / 0x92 are continuation-byte-range bytes that cannot start a UTF-8 sequence in isolation. Verified.
  - **E003 `tab-in-yaml.md`:** total size 192 bytes; literal TAB byte (0x09) at offset 30 (line 4 indent under `requires:`). Verified.
  - **E004 `over-4kb.md`:** total file size 4231 bytes; **frontmatter slice between (excl.) the opening and closing `---` delimiters = 4103 bytes > 4096** (`description: ` followed by `'x'.repeat(4070)` filler). Verified.

- **AC12 smoke gate.** From `caspian/`:
  - `pnpm lint` → `Checked 7 files in 12ms. No fixes applied.` Exit 0. **The 7 files exactly match Story 1.5's baseline** (`biome.json`, `package.json`, `tsconfig.base.json`, `.changeset/config.json`, `schemas/v1/envelope.schema.json`, `schemas/v1/diagnostic-registry.schema.json`, `diagnostics/registry.json`). The 17 `.expected.json` files under `caspian/fixtures/invalid/` are correctly excluded from biome's scope; the AC12 risk-note's *Preferred* branch was NOT needed — the existing `caspian/biome.json` line 15 (`"!fixtures/invalid"`) glob behavior, combined with `caspian/.biomeignore` line 4 (`fixtures/invalid/**`), is sufficient to exclude the descendant `.expected.json` files. The 7 valid fixtures and the README are not in biome's `files.includes` (no `*.md` glob); the LICENSE has no extension. No biome configuration changes required.
  - `pnpm test` → `No projects matched the filters in "F:\work\joselimmo-marketplace-bmad\caspian"`. Exit 0. Empty-workspace pattern from Stories 1.1–1.5 preserved; no source code or tests added in Story 1.6.

- **LICENSE byte-equality verification (AC2).** `cp caspian/LICENSE caspian/fixtures/LICENSE` followed by `diff caspian/LICENSE caspian/fixtures/LICENSE` → empty output (no differences). `wc -c` confirms 11358 bytes for both (matching `caspian/schemas/LICENSE` and `caspian/diagnostics/LICENSE` from Stories 1.4 + 1.5 — the same CNCF/Kubernetes per-directory LICENSE pattern). The leading-blank-line idiosyncrasy carried over (deferred-work item from Story 1.4 review remains valid for all four LICENSE files).

- **JSON Schema Authoring conventions audit.** Not applicable to Story 1.6 — no JSON Schemas authored. The story consumes Story 1.4's `envelope.schema.json` and Story 1.5's `diagnostic-registry.schema.json` for cross-validation purposes only.

### Completion Notes List

**All 13 acceptance criteria satisfied. Story status: `review`.**

- **AC1 — `fixtures/README.md` is a 3-line statement** ✅ — `caspian/fixtures/README.md` (221 bytes) authored byte-faithfully from the *Reference README Model*. Body is exactly 3 lines of prose; the `# Caspian Fixtures` heading and blank line do not count toward the budget. Forward-references `../examples/` (which 404s until Story 1.7 ships) per the established forward-reference annotation discipline.
- **AC2 — `fixtures/LICENSE` is full Apache 2.0 text, byte-faithful copy of `caspian/LICENSE`** ✅ — `diff caspian/LICENSE caspian/fixtures/LICENSE` returns empty. Both files are 11358 bytes, identical to `caspian/schemas/LICENSE` (Story 1.4) and `caspian/diagnostics/LICENSE` (Story 1.5). Same CNCF/Kubernetes per-directory LICENSE re-declaration pattern preserved.
- **AC3 — `fixtures/valid/` and `fixtures/invalid/` subdirectories exist** ✅ — both directories present, each populated with at least one fixture from the start. No `.gitkeep` placeholders.
- **AC4 — 4 minimal `core:*` valid fixtures** ✅ — `caspian/fixtures/valid/{core-overview,core-epic,core-story,core-plan}/minimal.md` all present with the exact paths the AC mandates. Other `core:*` types (`adr`, `convention`, `learning`, `glossary`, `review`, `rule`, `scratch`) are out of scope per AC4 — recorded as Deferred-Work item below.
- **AC5 — valid fixtures pass envelope-schema validation** ✅ — Cross-check #1 (re-run with real `js-yaml@4.1.1` parser) confirms all 7 valid fixtures (4 core-* + 3 overlay-compat) parse cleanly and trace through the envelope schema's keywords without errors.
- **AC6 — 3 overlay-compat valid fixtures** ✅ — `all-22-known-fields.md` (Cross-check #5: exactly 22 keys, all expected, none extra), `x-extension.md` (uses `x-vendor-thing`), `vendor-namespaced.md` (uses `examples:custom-field`). Filename `all-22-known-fields.md` matches epics line 636 verbatim (NOT the architecture's variant `all-22-fields.md` on line 391).
- **AC7 — 17 invalid fixture directories with exact names** ✅ — all 17 directories present under `caspian/fixtures/invalid/`: `E001-bom`, `E002-encoding`, `E003-tab-indent`, `E004-oversized`, `E005-missing-delimiters`, `E006-yaml-parse`, `E007-unquoted-bool`, `E008-type-missing`, `E009-type-not-namespaced`, `E010-requires-not-array`, `E011-requires-entry-missing-type`, `E012-requires-invalid-shape`, `E013-produces-not-object`, `E014-produces-missing-type`, `W001-unknown-field`, `W002-non-core-namespace`, `W003-unrecognized-schema-version`. Uppercase code letters + kebab-case rule suffixes, total count = 17.
- **AC8 — each invalid directory has paired `<variant>.md` + `<variant>.expected.json`** ✅ — 17 pairs, each variant filename stem identical between the `.md` and the `.expected.json`. Variant names use kebab-case.
- **AC9 — `.expected.json` strict shape** ✅ — Cross-check #3 confirms all 17 files conform to `{"diagnostics": [{"code": "CASPIAN-EXXX", "line": <number>}, ...]}` with no extraneous fields at any level. Single-entry arrays (multi-emit cases reserved as Deferred-Work item).
- **AC10 — no YAML comments in any frontmatter** ✅ — Cross-check #4 confirms zero `^\s*#` comment lines across all 24 fixtures (7 valid + 17 invalid).
- **AC11 — body is at most one sentence** ✅ — All 24 fixtures have a single-sentence body (or, in the case of E005's missing-closing-delim fixture, a body that follows the un-closed frontmatter as standalone prose). Per-fixture sentence count audit returned 1 for all 24.
- **AC12 — smoke gate green** ✅ — `pnpm -C caspian lint` checked 7 files in 12ms, exit 0 (Story 1.5 baseline preserved exactly). `pnpm -C caspian test` reported *No projects matched the filters*, exit 0. The AC12 risk-note's *Preferred* branch (tightening `caspian/biome.json` line 15 from `"!fixtures/invalid"` to `"!fixtures/invalid/**"`) was **NOT needed** — the existing glob + `.biomeignore` combination correctly excludes the 17 `.expected.json` files. No biome configuration changes.
- **AC13 — manual cross-checks #1 through #5 recorded** ✅ — all five cross-checks documented in *Debug Log References* above with `node`-driven mechanical verification.

**No deviations from the story spec on any of the 25 reference models** (1 README + 4 core-* valid + 3 overlay-compat + 17 invalid pairs). Each fixture was authored byte-faithfully from its *Reference Model* in the Dev Notes. The byte-level fixtures (E001 BOM, E002 non-UTF-8, E003 tab-indent, E004 oversized) used `node` for byte precision; their construction is documented in the *Byte-level verification* Debug Log entry above.

**Decision recorded — kept biome configuration unchanged.** Story spec's AC12 risk-note flagged the possibility that `caspian/biome.json` line 15 (`"!fixtures/invalid"` without `/**`) might fail to recurse and cause biome to lint the 17 `.expected.json` files. Empirical verification: `pnpm -C caspian lint` reported 7 files (Story 1.5 baseline preserved exactly) — biome's negation glob behavior on the bare directory name combined with `caspian/.biomeignore` line 4's `fixtures/invalid/**` is sufficient to exclude descendants. **No edit to `caspian/biome.json` or `caspian/.biomeignore`.**

**Decision recorded — `## Unreleased` style not applicable to fixtures.** Story 1.6 deliberately omits a `caspian/fixtures/CHANGELOG.md`. Fixtures are versioned with the spec (per the architecture's project tree), not independently. Contrast with `caspian/diagnostics/CHANGELOG.md` from Story 1.5 which has decoupled semver because the diagnostic registry is a separate release artifact. Recorded in *Deferred Work* below for future revisit if the project later adopts independent fixture-versioning.

**Decision recorded — temporary audit script removed before smoke gate.** During Cross-check #1 / #3 / #4 / #5 execution, an ad-hoc Node audit script was authored at `caspian/fixtures/.audit.cjs` for mechanical verification. The first `pnpm -C caspian lint` run picked it up (8 files reported, with biome lint errors on the script's coding style). The script was deleted; subsequent `pnpm -C caspian lint` returned to the expected 7-file baseline. The audit logic is preserved in this Debug Log; the script itself is not part of the story deliverables and is not present in the repository.

**Forward-reference annotation handling.** Story 1.6's deliverables RESOLVE the *coming soon — Story 1.6* annotations in `caspian/spec/README.md` line 22 + the 4 vocabulary docs whose `core:*` types Story 1.6 fixtures (overview, epic, story, plan). The annotations remain in place per the project's *forward-reference annotation discipline* — sealed files (Story 1.2 sealed `spec/README.md`; Story 1.3 sealed `spec/vocabulary/`) are not edited; the link target now exists on disk so the GitHub-rendered links resolve naturally. The 7 vocabulary docs whose forward-references Story 1.6 does NOT resolve (`adr.md`, `convention.md`, `learning.md`, `glossary.md`, `review.md`, `rule.md`, `scratch.md`) are recorded as a Deferred-Work item below.

**Manual follow-up required by the user:**

- **Append Deferred-Work entries** to `_bmad-output/implementation-artifacts/deferred-work.md` per the *Deferred Work* section of this story's Dev Notes — items 1, 2, 3, 4, 5, 7, 8 from that section apply (item 6, the conditional biome-glob-tightening item, does NOT apply because the smoke gate confirmed the existing config works correctly).

- **Commit the story.** Per the repo's commit policy, the dev agent did not commit. Recommended invocation:

  ```bash
  git add caspian/fixtures/ _bmad-output/implementation-artifacts/1-6-canonical-fixture-set-valid-invalid.md _bmad-output/implementation-artifacts/sprint-status.yaml _bmad-output/implementation-artifacts/deferred-work.md
  git commit -m "docs(spec): add canonical fixture set (Story 1.6)"
  ```

  If `.claude/settings.local.json` was auto-modified by Claude Code's permission-grant flow during the smoke gate (as in earlier stories), include or omit it at the user's discretion.

- **Resolve forward-reference notes (optional, NOT required for Story 1.6 acceptance).** Same handling discipline as Stories 1.4 + 1.5: leave the *coming soon — Story 1.6* annotations in place; a future tidy-up story may remove them. Out of scope for Story 1.6.

**Forward dependencies (consumed by later stories):**

- **Story 1.7 (minimal skill adoption example)** — `caspian/examples/README.md`'s 3-line statement MIRRORS this story's `caspian/fixtures/README.md` 3-line statement, with reciprocal cross-references. Story 1.6's README establishes the convention; Story 1.7 follows it.
- **Story 2.3 (pipeline stages 1–3)** — consumes `caspian/fixtures/invalid/E001-bom/`, `E002-encoding/`, `E003-tab-indent/`, `E004-oversized/`, `E005-missing-delimiters/`, `E006-yaml-parse/`, `E007-unquoted-bool/` as the table-driven assertion source for stage 1–3 pipeline behavior.
- **Story 2.4 (pipeline stages 4–6)** — consumes `caspian/fixtures/invalid/E008-type-missing/` through `W003-unrecognized-schema-version/` as the table-driven assertion source for stage 4–6 envelope shape + namespace + allow-list scan behavior. Each fixture's `.expected.json` line numbers may be reconciled with the pipeline's actual emission at Story 2.6 snapshot-test time (recorded as Deferred-Work item).
- **Story 2.5 (CLI walker)** — `caspian validate ./fixtures/valid/core-overview/minimal.md` (single-file mode) and `caspian validate ./fixtures/valid/` (directory mode) smoke-test inputs; the walker's `fast-glob` recursion picks up the 7 valid fixtures.
- **Story 2.6 (`--format=json`)** — golden-snapshot inputs from `caspian/fixtures/`. Snapshot tests will reconcile `.expected.json` line numbers with pipeline emission and update the fixtures' line values authoritatively at that point.
- **Story 2.7 (conformance suite)** — `conformance/cases/` ships ~17 cases mirroring the 17 invalid fixtures 1:1 (architecture line 623). The conformance harness lives separately from the fixtures (vendor-neutral parity gate); this story ships only the fixtures, NOT the conformance cases.
- **Architecture's release gate** — `docker run --rm -v $(pwd):/work node:20-alpine sh -c "cd /work && npx caspian validate ./fixtures/valid/"` (architecture line 719) consumes `caspian/fixtures/valid/` as its input set on a vanilla Linux container with no Claude Code installed.

**Sprint-status transitions during this dev session:**

- `1-6-canonical-fixture-set-valid-invalid`: `ready-for-dev` → `in-progress` (Step 4 of dev-story workflow) → `review` (Step 9 — final gate after smoke gate green and all 13 ACs satisfied).

### File List

All paths relative to repo root (`F:\work\joselimmo-marketplace-bmad\`).

**New files (43):**

- `caspian/fixtures/LICENSE` — full Apache 2.0 license text, byte-faithful copy of `caspian/LICENSE` (11358 bytes; identical per `diff` verification)
- `caspian/fixtures/README.md` — 3-line statement clarifying fixtures are machine-consumed regression data, distinct from `examples/` author-readable walkthroughs (221 bytes)
- `caspian/fixtures/valid/core-overview/minimal.md` — minimal canonical `core:overview` fixture (157 bytes)
- `caspian/fixtures/valid/core-epic/minimal.md` — minimal canonical `core:epic` fixture (145 bytes)
- `caspian/fixtures/valid/core-story/minimal.md` — minimal canonical `core:story` fixture (149 bytes)
- `caspian/fixtures/valid/core-plan/minimal.md` — minimal canonical `core:plan` fixture with `requires: [{type: core:story}]` lineage convention (241 bytes)
- `caspian/fixtures/valid/overlay-compat/all-22-known-fields.md` — overlay-compat fixture combining all 22 recognized frontmatter fields (4 Caspian core + 6 agentskills.io canonical + 12 Claude Code overlay) in one envelope (946 bytes)
- `caspian/fixtures/valid/overlay-compat/x-extension.md` — overlay-compat fixture exercising the `x-vendor-thing` extension prefix (200 bytes)
- `caspian/fixtures/valid/overlay-compat/vendor-namespaced.md` — overlay-compat fixture exercising the `examples:custom-field` namespaced field name (260 bytes)
- `caspian/fixtures/invalid/E001-bom/with-bom.md` — invalid fixture: UTF-8 BOM (`EF BB BF`) prefixed (183 bytes including 3-byte BOM)
- `caspian/fixtures/invalid/E001-bom/with-bom.expected.json` — `{"diagnostics":[{"code":"CASPIAN-E001","line":1}]}` (69 bytes)
- `caspian/fixtures/invalid/E002-encoding/non-utf8.md` — invalid fixture: CP-1252 smart-quote bytes 0x91 + 0x92 (188 bytes; strict UTF-8 decode throws)
- `caspian/fixtures/invalid/E002-encoding/non-utf8.expected.json` — `{"diagnostics":[{"code":"CASPIAN-E002","line":1}]}` (69 bytes)
- `caspian/fixtures/invalid/E003-tab-indent/tab-in-yaml.md` — invalid fixture: literal TAB (0x09) at offset 30 (line 4) inside frontmatter (192 bytes)
- `caspian/fixtures/invalid/E003-tab-indent/tab-in-yaml.expected.json` — `{"diagnostics":[{"code":"CASPIAN-E003","line":4}]}` (69 bytes)
- `caspian/fixtures/invalid/E004-oversized/over-4kb.md` — invalid fixture: frontmatter slice 4103 bytes > 4096 hard cap (4231 total bytes; description filler = `'x'.repeat(4070)`)
- `caspian/fixtures/invalid/E004-oversized/over-4kb.expected.json` — `{"diagnostics":[{"code":"CASPIAN-E004","line":1}]}` (69 bytes)
- `caspian/fixtures/invalid/E005-missing-delimiters/no-closing-delim.md` — invalid fixture: opening `---` without closing `---` (141 bytes)
- `caspian/fixtures/invalid/E005-missing-delimiters/no-closing-delim.expected.json` — `{"diagnostics":[{"code":"CASPIAN-E005","line":1}]}` (69 bytes)
- `caspian/fixtures/invalid/E006-yaml-parse/unclosed-bracket.md` — invalid fixture: `requires: [{type: core:story` unclosed flow-sequence bracket (198 bytes)
- `caspian/fixtures/invalid/E006-yaml-parse/unclosed-bracket.expected.json` — `{"diagnostics":[{"code":"CASPIAN-E006","line":3}]}` (69 bytes)
- `caspian/fixtures/invalid/E007-unquoted-bool/yes-as-string.md` — invalid fixture: `enabled: yes` (YAML 1.1 boolean keyword footgun) (230 bytes)
- `caspian/fixtures/invalid/E007-unquoted-bool/yes-as-string.expected.json` — `{"diagnostics":[{"code":"CASPIAN-E007","line":3}]}` (69 bytes)
- `caspian/fixtures/invalid/E008-type-missing/no-type.md` — invalid fixture: frontmatter omits required `type` field (164 bytes)
- `caspian/fixtures/invalid/E008-type-missing/no-type.expected.json` — `{"diagnostics":[{"code":"CASPIAN-E008","line":1}]}` (69 bytes)
- `caspian/fixtures/invalid/E009-type-not-namespaced/bare-name.md` — invalid fixture: `type: epic` (no namespace) (163 bytes)
- `caspian/fixtures/invalid/E009-type-not-namespaced/bare-name.expected.json` — `{"diagnostics":[{"code":"CASPIAN-E009","line":2}]}` (69 bytes)
- `caspian/fixtures/invalid/E010-requires-not-array/string-instead.md` — invalid fixture: `requires: "core:story"` (string, not array) (181 bytes)
- `caspian/fixtures/invalid/E010-requires-not-array/string-instead.expected.json` — `{"diagnostics":[{"code":"CASPIAN-E010","line":3}]}` (69 bytes)
- `caspian/fixtures/invalid/E011-requires-entry-missing-type/missing-type-key.md` — invalid fixture: `requires` entry with `tags` only, no `type` (221 bytes)
- `caspian/fixtures/invalid/E011-requires-entry-missing-type/missing-type-key.expected.json` — `{"diagnostics":[{"code":"CASPIAN-E011","line":4}]}` (69 bytes)
- `caspian/fixtures/invalid/E012-requires-invalid-shape/extra-property.md` — invalid fixture: `requires` entry with extra `weight: 5` property (231 bytes)
- `caspian/fixtures/invalid/E012-requires-invalid-shape/extra-property.expected.json` — `{"diagnostics":[{"code":"CASPIAN-E012","line":5}]}` (69 bytes)
- `caspian/fixtures/invalid/E013-produces-not-object/array-instead.md` — invalid fixture: `produces: [core:plan]` (array, not object) (182 bytes)
- `caspian/fixtures/invalid/E013-produces-not-object/array-instead.expected.json` — `{"diagnostics":[{"code":"CASPIAN-E013","line":3}]}` (69 bytes)
- `caspian/fixtures/invalid/E014-produces-missing-type/empty-object.md` — invalid fixture: `produces: {}` (empty object, missing `type`) (199 bytes)
- `caspian/fixtures/invalid/E014-produces-missing-type/empty-object.expected.json` — `{"diagnostics":[{"code":"CASPIAN-E014","line":3}]}` (69 bytes)
- `caspian/fixtures/invalid/W001-unknown-field/typo-metadat.md` — invalid fixture: `metadat: {}` (typo of `metadata`, not in 22-known allow-list) (288 bytes)
- `caspian/fixtures/invalid/W001-unknown-field/typo-metadat.expected.json` — `{"diagnostics":[{"code":"CASPIAN-W001","line":3}]}` (69 bytes)
- `caspian/fixtures/invalid/W002-non-core-namespace/bmad-epic.md` — invalid fixture: `type: bmad:epic` (vendor-namespaced, not canonical core) (222 bytes)
- `caspian/fixtures/invalid/W002-non-core-namespace/bmad-epic.expected.json` — `{"diagnostics":[{"code":"CASPIAN-W002","line":2}]}` (69 bytes)
- `caspian/fixtures/invalid/W003-unrecognized-schema-version/version-9-9.md` — invalid fixture: `schema_version: "9.9"` (not in v1.0 recognized set `["0.1"]`) (237 bytes)
- `caspian/fixtures/invalid/W003-unrecognized-schema-version/version-9-9.expected.json` — `{"diagnostics":[{"code":"CASPIAN-W003","line":2}]}` (69 bytes)

**Modified files (2):**

- `_bmad-output/implementation-artifacts/1-6-canonical-fixture-set-valid-invalid.md` — Tasks/Subtasks all marked complete; Dev Agent Record populated (Agent Model, Debug Log References, Completion Notes List, File List, Change Log); Status transitioned `ready-for-dev → in-progress → review`
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — `1-6-canonical-fixture-set-valid-invalid` transitioned `backlog → ready-for-dev → in-progress → review`; session markers appended; `last_updated: 2026-04-27`

**Manual follow-up file (out of dev-agent scope; user-appended):**

- `_bmad-output/implementation-artifacts/deferred-work.md` — append the Deferred-Work entries from the *Deferred Work* section of this story's Dev Notes (items 1, 2, 3, 4, 5, 7, 8 — item 6 N/A per AC12 verification result).

### Change Log

- **2026-04-27 — Story 1.6 dev session.** Created 43 files: 1 README.md (3-line statement) + 1 LICENSE (byte-faithful Apache 2.0 copy, 11358 bytes) under `caspian/fixtures/`, plus 7 valid fixtures (`core-overview/minimal.md`, `core-epic/minimal.md`, `core-story/minimal.md`, `core-plan/minimal.md`, `overlay-compat/all-22-known-fields.md`, `overlay-compat/x-extension.md`, `overlay-compat/vendor-namespaced.md`) and 17 invalid fixture pairs (`<CODE>-<rule-suffix>/<variant>.md` + `<variant>.expected.json` for E001–E014 + W001–W003). All 13 acceptance criteria satisfied. Smoke gate green (`pnpm -C caspian lint` checked 7 files in 12ms, exit 0 — Story 1.5 baseline preserved exactly; `pnpm -C caspian test` exit 0 — empty-workspace pattern preserved). The 4 byte-level fixtures (E001 BOM with `EF BB BF` prefix, E002 non-UTF-8 with CP-1252 smart-quote bytes 0x91/0x92, E003 tab-indent with literal TAB at offset 30, E004 oversized with 4103-byte frontmatter slice) authored via `node` for byte precision and verified mechanically. Story status `ready-for-dev → in-progress → review`. No source code or tests added — content-only story consumed by Stories 1.7 (README convention mirror), 2.3 (pipeline stages 1–3 fixture inputs), 2.4 (pipeline stages 4–6 fixture inputs), 2.5 (CLI walker smoke inputs), 2.6 (golden-snapshot reconciliation including line-number authoritative reconciliation), 2.7 (conformance suite source set), and the architecture's vendor-neutrality docker release gate (`./fixtures/valid/`). Deferred-Work items (1) the 7 unresolved vocabulary `coming soon — Story 1.6` annotations (adr/convention/learning/glossary/review/rule/scratch), (2) the now-stale annotation in `spec/README.md` line 22 + the 4 resolved vocabulary annotations (overview/epic/story/plan), (3) optional `expected-diagnostics.schema.json` meta-schema, (4) single-entry-array convention vs. continue-and-collect multi-emit fixtures, (5) line-number authoritative reconciliation at Story 2.6, (7) absence of `caspian/fixtures/CHANGELOG.md`, (8) overlay-compat field-level value-shape sub-schemas — flagged for the user to append to `deferred-work.md`. Item 6 (biome-glob tightening) was N/A: the smoke gate confirmed the existing `caspian/biome.json` line 15 + `caspian/.biomeignore` line 4 combination correctly excludes the 17 `.expected.json` files.
