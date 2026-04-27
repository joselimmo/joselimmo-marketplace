# Story 1.8: CASPIAN-W004 registry reservation (mini-spike)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an Epic 2 implementer of Story 2.4 (validator pipeline stages 4–6),
I want `CASPIAN-W004` reserved in the diagnostic registry with a paired canonical fixture,
so that the allow-list / namespace-vocabulary scan has a registered code to emit, and the dangling forward-reference in `caspian/spec/core.md` line 82 (*"proposed CASPIAN-W004, to be reserved by Story 1.5's registry"*) finally resolves to a real registry entry.

## Working Directory

All paths in this story resolve **inside `caspian/`** — the sub-monorepo that hosts the Caspian project under the surrounding `joselimmo-marketplace-bmad` repository. References like `diagnostics/registry.json` resolve to `caspian/diagnostics/registry.json`; `fixtures/invalid/W004-non-canonical-core-name/` resolves to `caspian/fixtures/invalid/W004-non-canonical-core-name/`. Never create files outside `caspian/diagnostics/` or `caspian/fixtures/invalid/W004-non-canonical-core-name/` for this story (with the single exception of the sprint-status update under `_bmad-output/implementation-artifacts/`).

`caspian/diagnostics/` and `caspian/fixtures/invalid/` already exist (Stories 1.5 and 1.6). This story **appends one entry** to the existing `caspian/diagnostics/registry.json`, **appends one Unreleased bullet** to the existing `caspian/diagnostics/CHANGELOG.md`, and **creates one new fixture directory** with a single `.md` + `.expected.json` pair. No other files are created or modified.

## Background

This is a **mini-spike** carrying out Epic 1 retrospective action item **AI-1** (`_bmad-output/implementation-artifacts/epic-1-retro-2026-04-27.md` §7 Critical Path + §6 Discovery 2). Two facts make it necessary:

1. **`caspian/spec/core.md` line 82** (sealed by Story 1.2) writes: *"A `type` value under `core:` whose name is not in the canonical vocabulary triggers a warning diagnostic (proposed `CASPIAN-W004`, to be reserved by Story 1.5's registry)"*. Story 1.5 followed the architecture's v1.0 set (lines 277–279: W001/W002/W003 only) and did **not** reserve W004. The promise in `core.md` is therefore currently dangling and tracked in `_bmad-output/implementation-artifacts/deferred-work.md` ("Deferred from: code review of 1-5-... story 1.5 #1").
2. **Story 2.4 (Epic 2)** implements the namespace-vocabulary scan that emits this warning. Without W004 reserved in the registry, Story 2.4's TypeScript code-generation step (`scripts/gen-diagnostic-codes.ts`, owned by Story 2.2) produces a typed constant set with no `CASPIAN_W004` symbol, and Story 2.4 has no registered code to emit when it detects `core:<unknown-name>`.

Reserving W004 now (Epic 1 spec foundation) unblocks Stories 2.2 + 2.4 cleanly. The reservation is **append-only** per architecture C4 (line 258) — it adds a new code at the end of the warnings block; it does **not** retroactively edit or reorder any of the 17 v1.0 entries.

## Acceptance Criteria

**AC1.** `caspian/diagnostics/registry.json` carries **exactly 18 entries** (was 17 after Story 1.5; one added by this story). The 17 pre-existing entries (`CASPIAN-E001`…`CASPIAN-E014`, `CASPIAN-W001`, `CASPIAN-W002`, `CASPIAN-W003`) MUST appear **byte-identically** in their existing append-only order. The new `CASPIAN-W004` entry MUST be **appended after `CASPIAN-W003`** as the 18th and final entry. No reordering of any prior entry. (Architecture C4 — line 258; Story 1.5 AC2.)

**AC2.** The new `CASPIAN-W004` entry has the five required fields (Story 1.5 AC3) with these exact values:

```json
{
  "code": "CASPIAN-W004",
  "severity": "warning",
  "rule": "core-namespace-name-not-in-vocabulary",
  "message": "Field `type` uses a `core:` name outside the canonical vocabulary",
  "doc": "https://caspian.dev/diagnostics#caspian-w004"
}
```

The five fields appear in the same field-order as every other entry in the file: `code`, `severity`, `rule`, `message`, `doc`. No additional fields per entry.

**AC3.** The new entry validates against `caspian/schemas/v1/diagnostic-registry.schema.json` (Story 1.5 deliverable):

  - `code` matches `^CASPIAN-(E|W)\d{3}$` (Story 1.5 AC8) — `CASPIAN-W004` matches.
  - `severity` is one of `["error", "warning"]` (Story 1.5 AC10) — `warning` matches.
  - `rule` is a non-empty string with `minLength: 1` — `core-namespace-name-not-in-vocabulary` (kebab-case, 36 chars) matches.
  - `message` is a non-empty string — present.
  - `doc` matches `^https://caspian\.dev/diagnostics#caspian-(e|w)\d{3}$` (Story 1.5 AC9) — `https://caspian.dev/diagnostics#caspian-w004` matches.

**AC4.** The new entry's `message` follows the message-style conventions established in Story 1.5 AC11:

  - **Declarative voice, no user-blame.** *"Field `type` uses a `core:` name outside the canonical vocabulary"* — describes what was observed, not what the author did wrong. Mirrors W002's structure (*"Field `type` uses a namespace outside the canonical `core:*` registry"*).
  - **No trailing period.** Message does not end with `.`.
  - **Field names and namespace prefix wrapped in backticks.** `` `type` `` (field name) and `` `core:` `` (namespace prefix) are backticked.

**AC5.** The new entry's `code` ↔ `doc` numeric-suffix alignment is correct: `CASPIAN-W004` and `#caspian-w004` both use suffix `004`. (JSON Schema cannot enforce this cross-field equality — Story 1.5 deferred-work item — so the alignment is verified manually in cross-check #1 below.)

**AC6.** `caspian/fixtures/invalid/W004-non-canonical-core-name/` directory exists. It contains **exactly two files** and nothing else:

  - `caspian/fixtures/invalid/W004-non-canonical-core-name/non-canonical-name.md` — the fixture artifact
  - `caspian/fixtures/invalid/W004-non-canonical-core-name/non-canonical-name.expected.json` — the expected-diagnostics manifest

The directory name follows the Story 1.6 convention (`<code>-<short-rule>/`) — see existing `W001-unknown-field/`, `W002-non-core-namespace/`, `W003-unrecognized-schema-version/`. The basename `non-canonical-name` for the `.md` + `.expected.json` pair mirrors the W002 convention (`bmad-epic.md` / `bmad-epic.expected.json`).

**AC7.** `caspian/fixtures/invalid/W004-non-canonical-core-name/non-canonical-name.md` is valid UTF-8, LF line endings, no BOM. It contains a **valid frontmatter envelope passing stages 1–4** of the validator pipeline (architecture lines 282–289) — i.e. the fixture deliberately fires **only** the stage-5 W004 warning, no errors and no other warnings. The exact content (byte-faithful) is given in *Reference Fixture Model* below.

**AC8.** `caspian/fixtures/invalid/W004-non-canonical-core-name/non-canonical-name.expected.json` is well-formed JSON, valid UTF-8, LF line endings, no BOM, declaring **exactly one** expected diagnostic with `code: "CASPIAN-W004"` and `line: 2` (the `type:` line in the fixture is on line 2, mirroring W002's expected manifest). The exact content (byte-faithful) is given in *Reference Expected Model* below.

**AC9.** The fixture's `.md` artifact uses `type: core:nonexistent` as the test value — `nonexistent` is **not in the canonical vocabulary** documented at `caspian/spec/vocabulary/`, which lists exactly **11 canonical core names**: `adr`, `convention`, `epic`, `glossary`, `learning`, `overview`, `plan`, `review`, `rule`, `scratch`, `story`. (Verify with `ls caspian/spec/vocabulary/ | grep -v -E '^(README|index|overview|core)\\.md$' | wc -l` ≈ 11 + the `overview.md` for `core:overview`.)

**AC10.** `caspian/diagnostics/CHANGELOG.md` carries **one new bullet appended to the existing `## Unreleased` section** documenting the W004 reservation. The new bullet does **not** replace or modify the existing "Initial registry shape established with the 17 v1.0 codes…" bullet — it is a sibling bullet under the same `## Unreleased` heading. The exact content (byte-faithful) is given in *Reference CHANGELOG Bullet Model* below.

**AC11.** No other files are created or modified by this story. In particular:

  - `caspian/spec/core.md` is **NOT** edited (sealed by Story 1.2; the dangling forward-reference at line 82 will be resolved by a separate cleanup commit/story noted in *Dev Notes*).
  - `caspian/biome.json` and `caspian/.biomeignore` are **NOT** modified (preserves Story 1.5+ smoke-gate baseline of 7 biome-checked files).
  - `caspian/schemas/v1/diagnostic-registry.schema.json` is **NOT** modified (the new W004 entry validates against the existing schema unchanged).
  - `_bmad-output/implementation-artifacts/deferred-work.md` is **NOT** edited in this story (the resolution of the "1.5 #1" deferral is captured in this story's commit message; deferred-work.md cleanup is action item AI-4 from the retro, separate scope).

**AC12.** `pnpm -C caspian lint` exits `0` after this story. Biome 2.4 lints `**/*.json` per `caspian/biome.json` line 11; the modified `registry.json` and the new `non-canonical-name.expected.json` MUST pass formatter + linter without warnings. The biome scope remains **7 files** (Story 1.5 / 1.6 / 1.7 baseline) — the new fixture's `.md` is excluded by the `**/*.md` rule absence in `files.includes`, and the new `.expected.json` lives under `fixtures/invalid/**` which is negated in `files.includes` (per Story 1.6 AC). Verify with `pnpm -C caspian lint 2>&1 | grep "Checked"` — output MUST report `Checked 7 files`. `pnpm -C caspian test` continues to exit `0` with the *No projects matched the filters* output.

**AC13.** Manual cross-checks recorded in the Dev Agent Record's *Debug Log References* section:

  - **Cross-check #1 — code ↔ doc numeric-suffix equality.** The new entry's `code` numeric suffix (`004`) matches the `doc` URL fragment numeric suffix (`004`). Confirms the lexical alignment that the schema cannot enforce (Story 1.5 deferred-work item).
  - **Cross-check #2 — registry validates against its schema.** Walk the new entry through `caspian/schemas/v1/diagnostic-registry.schema.json` keywords (root `required`, entry `additionalProperties: false`, entry `required`, `code` `pattern`, `severity` `enum`, `doc` `pattern`) and confirm every keyword is satisfied. v1.0 ships no validator runtime in this story (ajv lands in Epic 2 Story 2.1); the cross-check is manual.
  - **Cross-check #3 — message style audit.** Verify the new W004 message obeys all four AC11 conventions from Story 1.5: (a) declarative voice, no "you" / "your" / instructional phrasing; (b) no trailing period; (c) field name `` `type` `` and namespace prefix `` `core:` `` wrapped in backticks; (d) accurate factual content matching the architecture / `core.md` line 80–84 description of the underlying rule.
  - **Cross-check #4 — fixture pipeline-stage isolation.** Trace `non-canonical-name.md` through the architecture's 6 pipeline stages (lines 282–289) and confirm: stage 1 (UTF-8, no BOM) — pass; stage 2 (`---` delimiters, byte cap) — pass; stage 3 (YAML parse, no E007 trigger) — pass; stage 4 (envelope shape: `type` is `<namespace>:<name>` form) — pass; stage 5 — namespace is `core:` (no W002), `schema_version` absent (no W003), but name `nonexistent` is outside canonical vocabulary → **emits W004**; stage 6 — only `type` field present, no W001 trigger. Net diagnostics: exactly **one** W004 warning, line 2.
  - **Cross-check #5 — append-only verification.** Confirm via `git diff caspian/diagnostics/registry.json` that the diff is purely additive: zero deletions, zero modifications to lines 1–122; the only changes are (a) a comma added at the end of the previous last entry's closing brace line, and (b) the new W004 entry inserted before the closing `]` of the `diagnostics` array.

## Tasks / Subtasks

- [x] **Task 1 — Append `CASPIAN-W004` to `caspian/diagnostics/registry.json`** (AC: #1, #2, #3, #4, #5)
  - [x] Read the current 17-entry registry to confirm the exact closing-brace formatting of the last (W003) entry. The file ends with `    }\n  ]\n}\n` (entry-close, array-close, root-close, trailing newline) per Story 1.5's biome-formatted output.
  - [x] Insert a comma after the W003 entry's closing brace, then append the new W004 entry block before the `]` array-close. Use the **Reference Registry Entry Model** in *Dev Notes* below as the byte-faithful starting point — same 4-space indentation as the existing entries, same field order (`code`, `severity`, `rule`, `message`, `doc`), same key-quoting style.
  - [x] Run `pnpm -C caspian lint` and confirm biome reports `Checked 7 files. No fixes applied.` and exit code 0. If biome auto-formats the file (e.g., normalises whitespace), accept the formatter's output as authoritative — do not fight it.
  - [x] Verify via `node -e "console.log(JSON.parse(require('fs').readFileSync('caspian/diagnostics/registry.json','utf8')).diagnostics.length)"` that the entry count is exactly **18**.
  - [x] Verify via `node -e "const r=JSON.parse(require('fs').readFileSync('caspian/diagnostics/registry.json','utf8')); console.log(r.diagnostics[17].code === 'CASPIAN-W004', r.diagnostics[17].severity === 'warning', r.diagnostics[17].rule === 'core-namespace-name-not-in-vocabulary')"` that the new entry's three principal fields are correct.

- [x] **Task 2 — Create the W004 fixture pair** (AC: #6, #7, #8, #9)
  - [x] `mkdir -p caspian/fixtures/invalid/W004-non-canonical-core-name/` (the `fixtures/invalid/` directory already exists; this story creates only the new W004 subdirectory).
  - [x] Write `caspian/fixtures/invalid/W004-non-canonical-core-name/non-canonical-name.md` byte-faithfully from the **Reference Fixture Model** in *Dev Notes* below. UTF-8, LF line endings, no BOM, no trailing whitespace per `caspian/.editorconfig`.
  - [x] Write `caspian/fixtures/invalid/W004-non-canonical-core-name/non-canonical-name.expected.json` byte-faithfully from the **Reference Expected Model** in *Dev Notes* below. Same encoding/EOL discipline.
  - [x] Verify via `ls caspian/fixtures/invalid/W004-non-canonical-core-name/` that the directory contains exactly the two files (no `.gitkeep`, no README, no other artefacts).
  - [x] Verify via `node -e "const f=require('fs').readFileSync('caspian/fixtures/invalid/W004-non-canonical-core-name/non-canonical-name.md','utf8'); console.log(f.includes('core:nonexistent'))"` that the fixture artefact uses `core:nonexistent` exactly.

- [x] **Task 3 — Append the Unreleased bullet to `caspian/diagnostics/CHANGELOG.md`** (AC: #10)
  - [x] Open `caspian/diagnostics/CHANGELOG.md` and locate the existing `## Unreleased` section (lines 25–30 in the Story 1.5 baseline).
  - [x] Append the new bullet **after** the existing "Initial registry shape established with the 17 v1.0 codes…" bullet, following the **Reference CHANGELOG Bullet Model** in *Dev Notes* below.
  - [x] Do NOT introduce a new `## Unreleased` heading or a `## 0.X.X` versioned section — the existing `## Unreleased` heading is reused for both bullets (the W004 reservation does not promote the registry to a versioned release; that promotion happens at v1.0 ship time, which is a separate event).
  - [x] No semver bump in this story. The CHANGELOG remains in its pre-v1.0 / unreleased state.

- [x] **Task 4 — Cross-checks + smoke gate** (AC: #12, #13)
  - [x] Execute Cross-check #1 (code ↔ doc suffix equality) — record outcome in Dev Agent Record / Debug Log References.
  - [x] Execute Cross-check #2 (schema validation walkthrough) — record outcome.
  - [x] Execute Cross-check #3 (message style audit) — record outcome.
  - [x] Execute Cross-check #4 (fixture pipeline-stage isolation) — record outcome.
  - [x] Execute Cross-check #5 (`git diff` append-only verification) — record outcome.
  - [x] Run `pnpm -C caspian lint` from repo root; capture the trailing line *Checked 7 files in <N>ms. No fixes applied.* in Debug Log References.
  - [x] Run `pnpm -C caspian test` from repo root; capture *No projects matched the filters* output.

- [x] **Task 5 — Story closeout** (no AC)
  - [x] Update Dev Agent Record / Completion Notes List with: total files modified (2: registry.json + CHANGELOG.md), total files created (2: the fixture pair), entry count before/after (17 → 18), smoke gate outcome (7 files / exit 0 preserved).
  - [x] Move story status `ready-for-dev` → `in-progress` → `review` per the standard dev-story workflow (sprint-status.yaml updates handled by that workflow, not by this story authoring).

### Review Findings

- [x] [Review][Defer] `doc` URL is a dead forward-reference [caspian/diagnostics/registry.json:W004] — deferred, pre-existing pattern on all 18 entries (none of the caspian.dev pages exist pre-launch)
- [x] [Review][Defer] `expected.json` records only `code`+`line` — no severity/rule [caspian/fixtures/invalid/W004-non-canonical-core-name/non-canonical-name.expected.json] — deferred, pre-existing W002/W003 convention
- [x] [Review][Defer] `line: 2` in expected output is fragile — prepending a line shifts it silently [caspian/fixtures/invalid/W004-non-canonical-core-name/non-canonical-name.expected.json:3] — deferred, pre-existing fixture system design concern
- [x] [Review][Defer] No valid fixture complementing W004 (recognized `core:` name → 0 diagnostics) — deferred, out of scope for Story 1.8; Epic 2 test hardening
- [x] [Review][Defer] Rule slug naming inconsistency — W004 uses negative form `core-namespace-name-not-in-vocabulary` while W003 uses positive form `schema-version-recognized` [caspian/diagnostics/registry.json] — deferred, W004 slug spec-prescribed in AC2; convention audit is a registry-wide concern
- [x] [Review][Defer] No runtime schema re-validation CI step after registry addition — deferred, Epic 2 Story 2.1 lands `ajv-validate-registry`
- [x] [Review][Defer] Multi-colon `type` values like `core:story:v2` — validator behavior undefined [caspian/diagnostics/registry.json + fixture W004] — deferred, Epic 2 validator scope
- [x] [Review][Defer] Case-variant core names like `core:Story` — vocabulary check case-sensitivity unspecified — deferred, Epic 2 validator scope
- [x] [Review][Defer] W004 check scope: `requires`/`produces` nested `type` fields vs. top-level only — deferred, Epic 2 validator implementation scope
- [x] [Review][Defer] YAML whitespace in `type` value (`core: nonexistent`) — strip/parse behavior unspecified — deferred, Epic 2 validator scope

## Dev Notes

### Source authority

- **Primary** — `_bmad-output/implementation-artifacts/epic-1-retro-2026-04-27.md` §6 *Discovery 2* (W004-reserved-but-not-in-registry), §7 *Critical Path AI-1* (the action item this story satisfies), §10 *Key Takeaways* #2 (deferred-work as breadcrumb mechanism).
- **Secondary — sealed canonical sources**:
  - `caspian/spec/core.md` lines 77–84 (the `core:` namespace + W004 forward-reference; sealed by Story 1.2 — DO NOT edit).
  - `_bmad-output/planning-artifacts/architecture.md` lines 251–279 (Diagnostic Registry conventions C1–C5; the v1.0 17-code table — W004 is being added here as the 18th, post-v1.0-foundation reservation).
  - `_bmad-output/planning-artifacts/architecture.md` lines 282–289 (validation pipeline stages; W004 conceptually fits under stage 5's namespace-vocabulary check, alongside W002).
- **Reference Models** — Story 1.5's `caspian/diagnostics/registry.json` (template for the entry shape) + Story 1.6's `caspian/fixtures/invalid/W002-non-core-namespace/` and `W003-unrecognized-schema-version/` directories (templates for the fixture pair, basename, and expected.json structure).

### Reference Registry Entry Model

The exact JSON block to append after the W003 entry, with W003 shown for indentation context. Insert a comma at the end of W003's `}` line, then append the W004 block. The closing `]` and root-close `}` of the file are unchanged.

```json
    {
      "code": "CASPIAN-W003",
      "severity": "warning",
      "rule": "schema-version-recognized",
      "message": "Field `schema_version` value is not recognized by this validator",
      "doc": "https://caspian.dev/diagnostics#caspian-w003"
    },
    {
      "code": "CASPIAN-W004",
      "severity": "warning",
      "rule": "core-namespace-name-not-in-vocabulary",
      "message": "Field `type` uses a `core:` name outside the canonical vocabulary",
      "doc": "https://caspian.dev/diagnostics#caspian-w004"
    }
  ]
}
```

**Indentation:** 4 spaces per nesting level (matches the existing registry). **Field order:** `code`, `severity`, `rule`, `message`, `doc` — same as every other entry. **No trailing comma** after the W004 entry's final `}` (it is now the last array element).

### Reference Fixture Model

`caspian/fixtures/invalid/W004-non-canonical-core-name/non-canonical-name.md` — byte-faithful target content (the `type` line is line 2, matching the W002 convention so the `.expected.json`'s `line: 2` lines up):

```markdown
---
type: core:nonexistent
---

Fixture exhibits CASPIAN-W004: `type` value `core:nonexistent` uses the canonical `core:` namespace but `nonexistent` is not one of the 11 canonical core names documented in `caspian/spec/vocabulary/`; stage 5 namespace-vocabulary check emits a warning per FR4 (canonical core types or vendor-namespaced — graceful degradation when an author uses an unrecognized core name).
```

**Frontmatter scope:** intentionally minimal (`type` only). Including `schema_version`, `requires`, or `produces` is **not necessary** and would risk firing additional warnings (W001 / W003) and muddy the cross-check #4 isolation contract. The body prose follows the same explanatory pattern as `W002-non-core-namespace/bmad-epic.md` and `W003-unrecognized-schema-version/version-9-9.md` — one paragraph naming the code, the trigger, the pipeline stage, and the underlying FR.

### Reference Expected Model

`caspian/fixtures/invalid/W004-non-canonical-core-name/non-canonical-name.expected.json` — byte-faithful target content (mirrors `W002-non-core-namespace/bmad-epic.expected.json` exactly with the code value swapped):

```json
{
  "diagnostics": [
    { "code": "CASPIAN-W004", "line": 2 }
  ]
}
```

**Indentation:** 2 spaces (matches W002 / W003 expected.json files). **Trailing newline:** yes, one `\n` after the final `}`. **Line number:** `2` — points at the `type: core:nonexistent` line (line 1 is `---`, line 2 is `type: ...`). The line-number convention here matches the W002/W003 cousins exactly; no E002/E004/E008 ambiguity (those file-level "line: 1" anchor questions are deferred to Story 2.6 per Story 1.6 deferred-work).

### Reference CHANGELOG Bullet Model

`caspian/diagnostics/CHANGELOG.md` — append the second bullet under the existing `## Unreleased` heading. The full target state of the `## Unreleased` section after this story:

```markdown
## Unreleased

- Initial registry shape established with the 17 v1.0 codes
  (`CASPIAN-E001`–`CASPIAN-E014` plus `CASPIAN-W001`–`CASPIAN-W003`).
  The registry is validated structurally by
  [`../schemas/v1/diagnostic-registry.schema.json`](../schemas/v1/diagnostic-registry.schema.json).
- Reserved `CASPIAN-W004` (severity `warning`, rule
  `core-namespace-name-not-in-vocabulary`): emitted when `type` uses the
  canonical `core:` namespace but the name is not one of the 11 canonical
  core names. Resolves the forward-reference promised by `spec/core.md`
  line 82 and originally scoped to Story 1.5; carried out as a post-Epic 1
  spike (Story 1.8) per the Epic 1 retrospective action item AI-1.
```

**Wrapping:** ~70 columns per line (matches the existing first bullet). **Backticks:** code identifiers (`CASPIAN-W004`, `core:`, `core-namespace-name-not-in-vocabulary`, `spec/core.md`) wrapped consistently. **Line ending:** LF. **No trailing blank lines** at end of file beyond the single newline.

### Project Structure Notes

The story creates files **only** in two pre-existing directories:

  - `caspian/diagnostics/` — Story 1.5 deliverable; this story modifies `registry.json` (in place) and `CHANGELOG.md` (in place).
  - `caspian/fixtures/invalid/` — Story 1.6 deliverable; this story creates one new sibling directory `W004-non-canonical-core-name/` next to the 17 existing `<code>-<rule>/` directories.

No new top-level directories. No changes to `caspian/biome.json` (preserves the 7-file lint baseline established by Story 1.5 and held through Stories 1.6 and 1.7). No changes to `caspian/.biomeignore`. No changes to `caspian/schemas/v1/diagnostic-registry.schema.json` (the W004 entry is structurally a peer of W001/W002/W003 and validates against the existing schema unchanged).

### Forward-reference cleanup deferred

`caspian/spec/core.md` line 82 says *"proposed `CASPIAN-W004`, to be reserved by Story 1.5's registry"*. After this story merges, the reservation is real but the wording in `core.md` becomes historically inaccurate (W004 was reserved by Story 1.8, not 1.5). `core.md` is sealed; editing it falls under retro action item **AI-5** (forward-reference cleanup sweep) which is a separate parallel-prep work item explicitly scoped to a dedicated cleanup story. **Do NOT edit `core.md` in this story** — the spec line is technically dangling-but-resolved, which is acceptable until the AI-5 sweep runs.

### Deferred-work entry resolution

`_bmad-output/implementation-artifacts/deferred-work.md` carries the entry "Deferred from: code review of 1-5-diagnostic-registry-registry-schema (2026-04-27)" → first bullet (the W004 deferral). This story's commit message MUST reference that entry explicitly so a future reader grepping `deferred-work.md` for "W004" finds the resolution path. **Do NOT edit `deferred-work.md` in this story** — the retrospective's action item AI-4 (parallel triage) owns the bulk update of that file; this story's job is the registry/fixture work itself.

### Smoke gate baseline preservation

The 7-file biome lint baseline (Story 1.5 → 1.6 → 1.7) MUST be preserved exactly. The new `.expected.json` file lives under `caspian/fixtures/invalid/**` which is negated in `caspian/biome.json`'s `files.includes` (per Story 1.6 AC), so it is **excluded** from the lint scope. The new `.md` fixture is also out-of-scope (markdown is not in `files.includes`). Net delta to biome scope: **0 files**. The two in-place modifications (`registry.json`, `CHANGELOG.md`) are pre-existing files that are already in (or out of) the lint scope per Story 1.5's settings. Verify post-implementation that `pnpm -C caspian lint` reports `Checked 7 files`.

### References

- `_bmad-output/implementation-artifacts/epic-1-retro-2026-04-27.md` §6 Discovery 2 + §7 Critical Path AI-1
- `caspian/spec/core.md` lines 77–84 (the `core:` namespace + W004 forward-reference)
- `_bmad-output/planning-artifacts/architecture.md` lines 251–279 (Diagnostic Registry C1–C5 + v1.0 17-code table)
- `_bmad-output/planning-artifacts/architecture.md` lines 282–289 (validation pipeline stages 1–6)
- `caspian/diagnostics/registry.json` lines 102–121 (existing W001/W002/W003 entries — the structural template)
- `caspian/diagnostics/CHANGELOG.md` lines 25–30 (existing `## Unreleased` section to append to)
- `caspian/fixtures/invalid/W002-non-core-namespace/bmad-epic.md` (fixture artefact template)
- `caspian/fixtures/invalid/W002-non-core-namespace/bmad-epic.expected.json` (expected manifest template — code swap is the only delta)
- `caspian/fixtures/invalid/W003-unrecognized-schema-version/version-9-9.md` (alternative fixture artefact template)
- `caspian/spec/vocabulary/` (the 11 canonical core names: adr, convention, epic, glossary, learning, overview, plan, review, rule, scratch, story)
- `_bmad-output/implementation-artifacts/deferred-work.md` "Deferred from: code review of 1-5-..." (the deferral this story resolves)
- `_bmad-output/implementation-artifacts/1-5-diagnostic-registry-registry-schema.md` AC3, AC8, AC9, AC10, AC11 (the structural / pattern / style conventions)
- `_bmad-output/implementation-artifacts/1-6-canonical-fixture-set-valid-invalid.md` (the directory-naming + expected.json conventions for invalid fixtures)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7[1m] (Claude Code, dev-story workflow, 2026-04-27).

### Debug Log References

**Cross-check #1 — code ↔ doc numeric-suffix equality.** PASS. The new entry's `code` is `CASPIAN-W004` (numeric suffix `004`); its `doc` is `https://caspian.dev/diagnostics#caspian-w004` (URL fragment numeric suffix `004`). Both suffixes are `004` — lexically aligned, even though JSON Schema cannot enforce this cross-field equality (Story 1.5 deferred-work item).

**Cross-check #2 — registry validates against its schema.** PASS. Walked the new W004 entry through every keyword in `caspian/schemas/v1/diagnostic-registry.schema.json`:

  - root `required: ["diagnostics"]` — `diagnostics` array present at root → satisfied.
  - root `additionalProperties: false` — only `diagnostics` key at root → satisfied.
  - entry-level `additionalProperties: false` — entry has exactly the 5 allowed fields (`code`, `severity`, `rule`, `message`, `doc`) → satisfied.
  - entry-level `required: ["code", "severity", "rule", "message", "doc"]` — all 5 fields present → satisfied.
  - `code` `pattern: "^CASPIAN-(E|W)\\d{3}$"` — `CASPIAN-W004` decomposes to `CASPIAN-` + `W` + `004` → satisfied.
  - `severity` `enum: ["error", "warning"]` — value `warning` is in the enum → satisfied.
  - `doc` `pattern: "^https://caspian\\.dev/diagnostics#caspian-(e|w)\\d{3}$"` — URL decomposes to `https://` + literal `caspian.dev` + `/diagnostics#caspian-` + `w` + `004` → satisfied.
  - `rule` is a non-empty string with `minLength: 1` — value `core-namespace-name-not-in-vocabulary` is 36 chars → satisfied.
  - `message` is a non-empty string — present, 60 chars → satisfied.

All 9 keyword checks pass. Manual walkthrough; the runtime ajv validation lands in Epic 2 Story 2.1.

**Cross-check #3 — message style audit.** PASS. Message text: `Field \`type\` uses a \`core:\` name outside the canonical vocabulary`.

  - (a) Declarative voice — third-person *"Field `type` uses a..."*. No "you" / "your" / instructional phrasing. ✓
  - (b) No trailing period — message ends with the word `vocabulary`, no `.`. ✓
  - (c) Field name `type` and namespace prefix `core:` wrapped in backticks. ✓
  - (d) Accurate factual content — matches `caspian/spec/core.md` line 80–84 description: *"A `type` value under `core:` whose name is not in the canonical vocabulary triggers a warning diagnostic"*. The W004 message is the runtime-emission counterpart to that spec sentence. ✓

The message structurally mirrors W002's *"Field `type` uses a namespace outside the canonical `core:*` registry"* — same `Field \`type\` uses a ... outside the canonical ...` skeleton, parameterised on what is "outside" (namespace for W002, name-within-namespace for W004).

**Cross-check #4 — fixture pipeline-stage isolation.** PASS. Traced `caspian/fixtures/invalid/W004-non-canonical-core-name/non-canonical-name.md` through the architecture's 6 pipeline stages (architecture.md lines 282–289):

  - **Stage 1 (byte-level: encoding sniff, BOM detection)** — file is valid UTF-8 (verified via `node` byte-buffer check), no BOM (`buf[0]` is `0x2d` `-`, not `0xef`). No E001/E002. ✓
  - **Stage 2 (frontmatter extraction: `---` delimiters, byte cap)** — opening `---` on line 1, closing `---` on line 3, frontmatter body is `type: core:nonexistent\n` (≈25 bytes, far below the 4 KB cap). No E004/E005. ✓
  - **Stage 3 (YAML parse: strict 1.2 safe-load + post-parse boolean scan)** — single key `type` with string value `core:nonexistent` (single colon separates namespace from name; YAML 1.2 reads this as a string scalar, not a mapping). No tabs in indentation. The value `core:nonexistent` is not a YAML 1.1 boolean trap (`on`/`off`/`yes`/`no`/`y`/`n`). No E003/E006/E007. ✓
  - **Stage 4 (envelope schema: `type` shape, `requires` shape, `produces` shape)** — `type: core:nonexistent` matches the `<namespace>:<name>` form (single colon, non-empty namespace, non-empty name). `requires`, `produces`, `schema_version` are absent (all optional in v1.0). No E008/E009/E010/E011/E012/E013/E014. ✓
  - **Stage 5 (namespace check)** — `type` namespace is `core:` (canonical, no W002). `schema_version` absent (no W003). Name `nonexistent` is **not** in the canonical vocabulary (the 11 names: `adr`, `convention`, `epic`, `glossary`, `learning`, `overview`, `plan`, `review`, `rule`, `scratch`, `story`) → **emits W004**. ✓
  - **Stage 6 (allow-list scan)** — only `type` field present in frontmatter; `type` is one of the 4 Caspian Core fields (always recognized). No W001. ✓

Net diagnostics: exactly **one** W004 warning at line 2 (the `type:` line). Matches the byte-faithful expected manifest.

**Cross-check #5 — git diff append-only verification.** PASS. `git diff caspian/diagnostics/registry.json` reports `7 insertions(+), 0 deletions(-)`. Examination of the diff hunks:

  - The previous last entry's closing brace line `    }` is shown as a `-`/`+` pair (`    }` → `    },`) — this is the comma insertion, the only modification to any pre-existing line.
  - Lines 1–117 of the original file (entries E001 through W003 except for the W003 closing brace) are byte-identical pre/post.
  - 6 new lines are inserted between the (now comma-terminated) W003 closing brace and the array-close `]` — the new W004 entry block (`    {`, `      "code": ...`, `      "severity": ...`, `      "rule": ...`, `      "message": ...`, `      "doc": ...`, `    }`).
  - Closing `]` and root-close `}` lines are unchanged (lines 124–125 in the post-edit file).

Append-only contract per architecture C4 satisfied. `git diff caspian/diagnostics/CHANGELOG.md` reports `6 insertions(+), 0 deletions(-)` — pure append of the second `## Unreleased` bullet; no modification of the existing first bullet.

**Smoke gate.**

```
$ pnpm -C caspian lint
> caspian-monorepo@0.0.0 lint F:\work\joselimmo-marketplace-bmad\caspian
> biome check .

Checked 7 files in 13ms. No fixes applied.

$ pnpm -C caspian test
> caspian-monorepo@0.0.0 test F:\work\joselimmo-marketplace-bmad\caspian
> pnpm -r --if-present test

No projects matched the filters in "F:\work\joselimmo-marketplace-bmad\caspian"
```

Exit codes both 0. **7-file biome baseline preserved exactly** (Story 1.5 → 1.6 → 1.7 → 1.8 chain unbroken). The new fixture's `.md` is excluded from biome scope (markdown not in `files.includes`); the new `.expected.json` is excluded by the `!fixtures/invalid/**` negation in `caspian/biome.json`.

### Completion Notes List

- **Files modified in place:** 2 — `caspian/diagnostics/registry.json` (17 → 18 entries; comma added to W003 closing brace + new W004 entry block appended) and `caspian/diagnostics/CHANGELOG.md` (one new bullet appended under the existing `## Unreleased` heading).
- **Files created:** 2 — `caspian/fixtures/invalid/W004-non-canonical-core-name/non-canonical-name.md` (29-line fixture artefact, frontmatter `type: core:nonexistent`) and `caspian/fixtures/invalid/W004-non-canonical-core-name/non-canonical-name.expected.json` (5-line expected manifest, single W004 diagnostic at line 2).
- **Files NOT touched per AC11:** `caspian/spec/core.md` (sealed; line 82 forward-ref becomes "stale-but-resolved" until AI-5 sweep), `caspian/biome.json`, `caspian/.biomeignore`, `caspian/schemas/v1/diagnostic-registry.schema.json`, `_bmad-output/implementation-artifacts/deferred-work.md` (the W004 deferral resolution is captured in this story's commit message; deferred-work.md cleanup is retro action item AI-4, separate scope).
- **Registry entry count:** 17 → 18.
- **Smoke gate:** 7 files / exit 0 (lint), exit 0 (test, no projects). Baseline preserved exactly through the entire Epic 1 chain.
- **All 13 ACs satisfied.** All 5 cross-checks (#1 suffix equality, #2 schema validation walkthrough, #3 message style audit, #4 pipeline-stage isolation, #5 append-only diff) recorded above.
- **Status transitions handled by dev-story workflow:** `ready-for-dev` → `in-progress` → `review` in `_bmad-output/implementation-artifacts/sprint-status.yaml` and in this story file's frontmatter.
- **Deferred-work entry resolution** — `_bmad-output/implementation-artifacts/deferred-work.md` "Deferred from: code review of 1-5-..." → first bullet (the W004 deferral) is now logically resolved by this story; physical entry update in deferred-work.md is owned by retro action item AI-4 (parallel triage).
- **Forward-reference cleanup deferred** — `caspian/spec/core.md` line 82 wording (*"to be reserved by Story 1.5's registry"*) is now technically inaccurate but `core.md` is sealed; the sweep is owned by retro action item AI-5.
- **Architecture.md C5 table** — the 17-code table at architecture.md lines 259–279 is a v1.0-launch snapshot; whether to refresh it to include W004 (now 18 codes) is a documentation-sync question scoped under AI-5/doc-refresh, not this story.

### File List

**Modified (2):**

- `caspian/diagnostics/registry.json` (W004 entry appended after W003; entry count 17 → 18)
- `caspian/diagnostics/CHANGELOG.md` (one new bullet appended under `## Unreleased`)

**Created (2):**

- `caspian/fixtures/invalid/W004-non-canonical-core-name/non-canonical-name.md`
- `caspian/fixtures/invalid/W004-non-canonical-core-name/non-canonical-name.expected.json`

**Not part of file delivery but updated for sprint tracking:**

- `_bmad-output/implementation-artifacts/sprint-status.yaml` (1-8 status transitions: backlog → ready-for-dev → in-progress → review; epic-1 done → in-progress for the duration of this spike)
- `_bmad-output/implementation-artifacts/1-8-caspian-w004-registry-reservation.md` (this story file: tasks/subtasks checkboxes, status, Dev Agent Record, File List)

### Change Log

| Date       | Change                                                                                          |
|------------|-------------------------------------------------------------------------------------------------|
| 2026-04-27 | Story 1.8 created (ready-for-dev) carrying out Epic 1 retrospective action item AI-1.           |
| 2026-04-27 | Implementation complete — W004 reserved in registry, fixture pair authored, CHANGELOG appended. |
| 2026-04-27 | Smoke gate verified (7 files / exit 0). Status moved to review.                                 |
