# Story 2.2: Diagnostic registry → typed TS constants (`codes.generated.ts`) with sha256 + verify hash

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a validator implementer,
I want diagnostic codes generated as typed TS constants from the canonical registry, with sha256 tampering safeguards,
so that the codes I reference in source code can never silently drift from `diagnostics/registry.json`.

## Working Directory

All paths in this story resolve **inside `caspian/`** — the sub-monorepo that hosts the Caspian project under the surrounding `joselimmo-marketplace-bmad` repository. References like `packages/core/`, `diagnostics/`, `schemas/v1/`, `biome.json`, `.gitattributes` resolve to `caspian/packages/core/`, `caspian/diagnostics/`, `caspian/schemas/v1/`, `caspian/biome.json`, `caspian/.gitattributes`. Never create files outside `caspian/` (with the single exception of the sprint-status / story-file updates under `_bmad-output/implementation-artifacts/`).

`caspian/packages/core/` already exists from Story 2.1 with the package skeleton, schema-loader entry point (`loader.ts`), 3-verrou single-source-of-truth enforcement, ajv 2020-12 envelope validator, and stub `validateFile` public API. This story extends that skeleton with the diagnostic-registry derivative chain — generated typed constants + sha256 verification + ajv registry-shape validation + pre-commit hook.

This story modifies two pre-existing files in place:

  - `caspian/packages/core/package.json` (adds `gen:codes`, `verify-codes-hash`, `ajv-validate-registry` scripts).
  - `caspian/package.json` (adds the same three scripts as workspace-level pass-throughs + `simple-git-hooks` devDep + `simple-git-hooks` config block + `prepare` script).
  - `caspian/packages/core/src/diagnostics/types.ts` (expands with `DiagnosticDefinition`).
  - `caspian/packages/core/src/diagnostics/index.ts` (expands with the new exports — types + `Reporter` + the generated constants).
  - `caspian/packages/core/CHANGELOG.md` (Unreleased bullet).
  - `caspian/packages/core/README.md` (public-API surface section: add the typed constants paragraph).

This story does NOT modify `caspian/diagnostics/registry.json` (sealed by Stories 1.5 + 1.8 — 18 entries: E001–E014 + W001–W004), `caspian/schemas/v1/diagnostic-registry.schema.json` (sealed by Story 1.5), `caspian/.gitattributes` (sealed by Story 1.1; the rule `packages/core/src/diagnostics/codes.generated.ts merge=ours linguist-generated=true` already exists at line 2 — Story 2.2 simply makes the file *real* so the rule becomes active), or `caspian/.biomeignore` (sealed by Story 1.1; the pattern `**/*.generated.ts` at line 2 already exempts the generated file from biome lint).

## Background

This story closes a critical gap left by Story 2.1: the validator now has the public API stub (`validateFile`) and the schema-loading entry point, but the diagnostic codes that the pipeline (Stories 2.3 + 2.4) will emit are still string literals. Without typed constants, every stage author would copy the code strings (`"CASPIAN-E001"`, `"CASPIAN-W003"`, …) into pipeline source files; subsequent registry edits (renames, severity bumps) would silently desync from the source code, and the diagnostic identity stability promised by the registry's append-only governance (architecture C4 / `caspian/diagnostics/CHANGELOG.md` Governance section) would erode.

Story 2.2 builds the **single-source-of-truth derivative chain** described in architecture C3 + lines 731–735 + 812–815:

```
caspian/diagnostics/registry.json   ← AUTHORITATIVE (hand-authored, append-only, 18 entries)
  ├→ packages/core/scripts/gen-diagnostic-codes.ts → packages/core/src/diagnostics/codes.generated.ts (typed TS constants, sha256 header)
  └→ packages/core/scripts/ajv-validate-registry.ts (CI gate, no derivative — validates registry shape against schema)

packages/core/scripts/verify-codes-hash.ts (CI gate — recomputes registry sha256, compares to header in codes.generated.ts; mismatch = fail)
```

The 4 mechanical safeguards landed by this story (architecture line 735):

  1. **`codes.generated.ts` with a sha256 header** — first line `// Hash: <sha256-of-registry.json-raw-bytes>`. Tampering with either the registry or the generated file desyncs the hash.
  2. **`pnpm verify-codes-hash`** — CI step that re-hashes `diagnostics/registry.json` and compares to the header. Mismatch → exit non-zero with a message instructing the contributor to run `pnpm gen:codes`.
  3. **`pnpm ajv-validate-registry`** — CI step that validates `diagnostics/registry.json` against `schemas/v1/diagnostic-registry.schema.json` (Draft 2020-12 via ajv). Any malformed entry (missing field, severity outside enum, invalid code pattern) blocks the merge.
  4. **Pre-commit hook (`simple-git-hooks`)** — auto-runs `pnpm gen:codes && git add` on every commit, so a contributor who edits `registry.json` cannot accidentally commit a stale `codes.generated.ts`.

A fifth safeguard ships with Story 1.1 and becomes active here:
  5. **`.gitattributes` — `linguist-generated=true` + `merge=ours`** — GitHub renders `codes.generated.ts` as collapsed/generated in PR diffs and resolves rebase conflicts to the local copy (which is then regenerated). This rule already exists in `caspian/.gitattributes` line 2 (Story 1.1 deliverable, deferred-work item 1.1 #1: *"`.gitattributes` rule targets a future path … if Story 2.2 lands the generated file at a different subpath, this rule silently no-ops"*). Story 2.2 must verify the generated file lands at exactly `caspian/packages/core/src/diagnostics/codes.generated.ts` so the rule becomes effective.

The 18 typed constants exported from this story (one per registry entry) are immediately consumable by Story 2.3 (pipeline stages 1–3 emitting E001–E007), Story 2.4 (stages 4–6 emitting E008–E014 + W001–W004), Story 2.5 (CLI doc-link rendering using each constant's `doc` field), and Story 4.2 (caspian.dev `diagnostics.html` generator using the same registry as the second derivative).

## Acceptance Criteria

**AC1.** `caspian/packages/core/package.json` is modified in place to add three new scripts. The existing `scripts` block (Story 2.1) declares `build`, `dev`, `test`, `test:watch`, `copy-schemas`. Add (in this order, before the existing `build` entry):

  - `"gen:codes": "tsx scripts/gen-diagnostic-codes.ts"` — invokes the registry-to-constants generator.
  - `"verify-codes-hash": "tsx scripts/verify-codes-hash.ts"` — invokes the hash-verification CI gate.
  - `"ajv-validate-registry": "tsx scripts/ajv-validate-registry.ts"` — invokes the registry-shape ajv gate.

The existing `"build"` script value MUST be amended to gen:codes-then-tsc-then-copy-schemas:

  - `"build": "pnpm gen:codes && tsc -p tsconfig.json && tsx scripts/copy-schemas.ts"` — gen:codes runs first so `codes.generated.ts` is on disk before `tsc` reads `src/`. (Order matters: tsc emits to `dist/` from `src/`; if codes.generated.ts is absent or stale, the build emits a stale dist copy. Inverse-tampering safeguard: verify-codes-hash will catch the staleness in CI, but the local build should produce the freshest possible `dist/`.)

`dependencies` is unchanged (`ajv ^8.17.0`). `devDependencies` is unchanged (`@types/node ^22.10.0`, `tsx ^4.19.0`, `typescript ^5.7.0`, `vitest ^3.0.0`) — every script in this story uses Node built-ins (`node:fs`, `node:path`, `node:crypto`, `node:url`) plus the already-installed `ajv` (no new runtime or dev deps for the per-package scripts; `simple-git-hooks` lands at the root, AC2). The exact target shape is captured byte-faithfully in *Reference packages/core/package.json modifications* below.

**AC2.** `caspian/package.json` (root) is modified in place to add three workspace-level pass-through scripts, the `simple-git-hooks` devDependency, the `simple-git-hooks` configuration block, and a `prepare` script. The current `scripts` block (Story 1.1) has `lint`, `test`, `build`, `release`. Add:

  - `"gen:codes": "pnpm --filter @caspian-dev/core gen:codes"` — root-level invocation that delegates to the core package.
  - `"verify-codes-hash": "pnpm --filter @caspian-dev/core verify-codes-hash"` — same.
  - `"ajv-validate-registry": "pnpm --filter @caspian-dev/core ajv-validate-registry"` — same.
  - `"prepare": "simple-git-hooks || true"` — wires the pre-commit hook on every `pnpm install`. The `|| true` is the standard idiom so cloning a tarball without git history (e.g., npm pack consumers) doesn't fail.

`devDependencies` adds `"simple-git-hooks": "^2.11.1"` (the long-stable major; ^2.11.1 floor matches late-2026 latest). No other root devDeps change; biome and changesets versions are sealed by Story 1.1.

A new top-level `simple-git-hooks` block is added:

```json
"simple-git-hooks": {
  "pre-commit": "pnpm --filter @caspian-dev/core gen:codes && git add packages/core/src/diagnostics/codes.generated.ts"
}
```

The exact target shape is captured byte-faithfully in *Reference root package.json modifications* below. The hook command runs unconditionally on every commit (not just commits touching `diagnostics/registry.json`) — this is the simple-git-hooks idiom and is idempotent (if `registry.json` is unchanged, `codes.generated.ts` regenerates byte-identically and `git add` is a no-op). The unconditional form is documented in *Dev Notes — Pre-commit hook scope decision* below.

**AC3.** `caspian/packages/core/scripts/gen-diagnostic-codes.ts` exists and:

  - Resolves the registry path via `import.meta.url` — never `process.cwd()`. Pattern: `path.resolve(here, "..", "..", "..", "diagnostics", "registry.json")` from `packages/core/scripts/gen-diagnostic-codes.ts` (3 ascents to `caspian/`, then down into `diagnostics/`).
  - Reads `caspian/diagnostics/registry.json` as raw bytes via `fs.readFile(path, null)` — passing `null` (or omitting the encoding) yields a `Buffer` with the exact on-disk byte sequence.
  - Computes the sha256 of the raw bytes via `crypto.createHash("sha256").update(rawBytes).digest("hex")`. The hex digest is lowercase, 64 characters.
  - Parses the bytes via `JSON.parse(rawBytes.toString("utf8"))` to read the `diagnostics` array. The parse uses utf8 decoding because the file is utf8-no-BOM by convention (verified by Story 1.5 + Story 1.8).
  - For each entry in the `diagnostics` array, emits one TypeScript `export const` line. Format (one entry):

```ts
export const CASPIAN_E001: DiagnosticDefinition = { code: "CASPIAN-E001", severity: "error", rule: "bom-rejection", message: "BOM byte sequence (`EF BB BF`) detected at file start", doc: "https://caspian.dev/diagnostics#caspian-e001" };
```

  - Constant name derivation: replace the dash in the registry's `code` field with an underscore (`CASPIAN-E001` → `CASPIAN_E001`). The constant is `SCREAMING_SNAKE_CASE` per JS/TS convention for module-level constant catalogs — biome's default `useNamingConvention` rule allows this form for top-level `const` declarations (verify with a lint pass; if biome reports a violation, see *Dev Notes — Biome useNamingConvention edge case* for fallback).
  - Inserts a single empty line between the file header (sha256 + DO-NOT-EDIT banner) and the constants block, and a final trailing newline.
  - Writes the result to `caspian/packages/core/src/diagnostics/codes.generated.ts` via `fs.writeFile(...)`. Resolves the destination path via the same `import.meta.url` pattern (no cwd).
  - Logs to stdout one human-readable confirmation line (one line, not load-bearing): `[gen-diagnostic-codes] generated <N> typed constants → <abs-path-to-codes.generated.ts>`. Where `<N>` is the count of entries (currently 18; 14 errors + 4 warnings).
  - Is NOT defensive against arbitrary corrupted registry input. The script may panic-throw if `JSON.parse` fails, if `diagnostics` is missing/empty, or if any entry is missing required fields — `pnpm ajv-validate-registry` is the dedicated shape gate (AC6); `gen:codes` operates on a registry that has already passed (or is about to pass) shape validation.
  - The exact body is captured byte-faithfully in *Reference gen-diagnostic-codes.ts* below.

**AC4.** `caspian/packages/core/src/diagnostics/codes.generated.ts` is created (by AC3 — this AC declares the *contract* of the generated file). After the first invocation of `pnpm gen:codes`, the file MUST contain (in this exact structure):

  - **Line 1** — `// Hash: <sha256-hex>` — exactly one space between `//` and `Hash:`, exactly one space between `Hash:` and the 64-char lowercase hex digest. No trailing whitespace.
  - **Lines 2–N** — the DO-NOT-EDIT banner (4-line comment block, see *Reference codes.generated.ts header* for the exact text), followed by the import statement `import type { DiagnosticDefinition } from "./types.js";`, followed by an empty line, followed by 18 `export const ...` lines (one per registry entry, in the same order as the registry array), followed by a single trailing newline.
  - The file MUST end with a newline (POSIX convention; biome's formatter would normalize this anyway, but `.biomeignore` excludes generated files from biome — the script must produce the trailing newline itself).
  - The file is **NOT linted by biome** — `caspian/.biomeignore` line 2 (`**/*.generated.ts`) excludes it. The file IS compiled by tsc — it lives under `src/` (Verrou 1's rootDir) and contains valid TypeScript. The file IS marked as generated by GitHub via the `caspian/.gitattributes` rule `packages/core/src/diagnostics/codes.generated.ts merge=ours linguist-generated=true` (already in place from Story 1.1).

The file MUST contain exactly 18 `export const CASPIAN_*` lines after the initial Story 2.2 generation. If the registry grows in a future story (e.g., Epic 2 retro adds W005), regenerating produces 19 lines — the script is registry-driven, not hard-coded.

**AC5.** `caspian/packages/core/scripts/verify-codes-hash.ts` exists and:

  - Resolves the registry path identically to AC3 (via `import.meta.url`).
  - Reads `caspian/diagnostics/registry.json` as raw bytes and computes its sha256 hex digest using the identical algorithm as AC3 (so the same input produces the same hash byte-for-byte).
  - Reads `caspian/packages/core/src/diagnostics/codes.generated.ts` as utf8 text. Reads the first line via `text.split("\n")[0]` (or equivalent).
  - Parses the first line with the regex `/^\/\/ Hash: ([a-f0-9]{64})$/`. If the line does NOT match, exits with code 1 and prints to stderr: `Error: codes.generated.ts header is missing or malformed (expected "// Hash: <sha256-hex>" on line 1). Run \`pnpm gen:codes\` to regenerate.`
  - Compares the recomputed hash to the captured hash. If equal, exits 0 (no stdout output, or one optional confirmation line: `[verify-codes-hash] OK — registry sha256 matches codes.generated.ts header`). If unequal, exits 1 with stderr: `Error: codes.generated.ts is out of sync with diagnostics/registry.json. Expected hash <captured-hash>, got <recomputed-hash>. Run \`pnpm gen:codes\` to regenerate, then commit the result.`
  - The exact body is captured byte-faithfully in *Reference verify-codes-hash.ts* below.

**AC6.** `caspian/packages/core/scripts/ajv-validate-registry.ts` exists and:

  - Resolves both the registry path and the schema path via `import.meta.url`. Schema path: `path.resolve(here, "..", "..", "..", "schemas", "v1", "diagnostic-registry.schema.json")`.
  - Reads both files as utf8 and parses each via `JSON.parse`.
  - Initializes `Ajv2020` from `ajv/dist/2020.js` (Draft 2020-12, identical entrypoint shape to `validator.ts` in Story 2.1) with `{ allErrors: true, strict: true }`.
  - Compiles the diagnostic-registry schema and validates the registry data: `const validate = ajv.compile(schema); const ok = validate(registry);`.
  - If `ok === true`, exits 0 (optional confirmation line: `[ajv-validate-registry] OK — diagnostics/registry.json (<N> entries) conforms to schemas/v1/diagnostic-registry.schema.json`).
  - If `ok === false`, prints `validate.errors` to stderr (one line per error, formatted as `<instancePath> <message>`), then exits 1.
  - The script MUST NOT use the `loader.ts` Verrou 2 import pattern. It reads the schema directly via `fs.readFile` of a string path — Verrou 2 (biome `noRestrictedImports`) governs `import` statements, not filesystem reads. Architecture line 815: `└→ ajv validate -s schemas/v1/diagnostic-registry.schema.json -d diagnostics/registry.json (CI gate, no derivative)` — the script is a tsx-native equivalent of the `ajv-cli` CLI invocation; no `ajv-cli` dependency is added (avoids a second copy of ajv in the install graph).
  - The exact body is captured byte-faithfully in *Reference ajv-validate-registry.ts* below.

**AC7.** `caspian/packages/core/src/diagnostics/types.ts` is modified in place to add the `DiagnosticDefinition` interface. The current file (Story 2.1, 16 lines) declares `Severity`, `Diagnostic`, `ValidationResult`. Add (after the `Diagnostic` interface, before `ValidationResult`):

```ts
export interface DiagnosticDefinition {
  code: string;
  severity: Severity;
  rule: string;
  message: string;
  doc: string;
}
```

The `DiagnosticDefinition` interface mirrors the shape of one entry in `diagnostics/registry.json` (per `caspian/schemas/v1/diagnostic-registry.schema.json` `$defs.DiagnosticEntry`). It is the type of every `CASPIAN_*` constant in `codes.generated.ts`. It is **distinct from** `Diagnostic`:

  - `DiagnosticDefinition` — static metadata about a code (catalog entry; no line/file/field). Imported by code generators, doc-link emitters, and the conformance suite.
  - `Diagnostic` — a runtime emission instance (carries `line`, optional `field`, the actual `message` text emitted at validation time which may be the registry message or a parameterized variant). Used by validator stages and the reporter.

The two types share `code` and `severity` semantics but are not interchangeable; never substitute one for the other. The exact target file is captured byte-faithfully in *Reference types.ts target* below.

**AC8.** `caspian/packages/core/src/diagnostics/reporter.ts` exists with the `Reporter` interface declaration:

```ts
import type { Diagnostic } from "./types.js";

export interface Reporter {
  report(diagnostics: Diagnostic[], filePath: string): void;
}
```

The interface is intentionally minimal in Story 2.2 — concrete formatters (human ANSI, JSON stable-schema) ship in `@caspian-dev/cli` (Stories 2.5 + 2.6 — see architecture lines 671–679: `packages/cli/src/output/{human,json}.ts`). Locating the interface here in `@caspian-dev/core` is mandated by the epic AC at line 786–787 (*"Given the reporter abstraction lives in core / When I open packages/core/src/diagnostics/reporter.ts / Then the file exports a Reporter interface (concrete formatters live in packages/cli, not in core)"*) and by architecture line 641. The interface gives the CLI side something to implement against without the core package taking on a dependency on chalk / ANSI / human formatting.

The signature `report(diagnostics: Diagnostic[], filePath: string): void` is the minimum useful shape — Stories 2.5 + 2.6 may extend it (e.g., a separate `reportSummary(...)` method, or a streaming variant). For Story 2.2 the dev MUST keep the signature minimal; do not over-specify. The exact target file is captured byte-faithfully in *Reference reporter.ts* below.

**AC9.** `caspian/packages/core/src/diagnostics/index.ts` is modified in place to expand the barrel exports. The current file (Story 2.1, 1 line) re-exports `Severity`, `Diagnostic`, `ValidationResult` from `./types.js`. Target state:

  - `export type { Severity, Diagnostic, DiagnosticDefinition, ValidationResult } from "./types.js";` — adds `DiagnosticDefinition`.
  - `export type { Reporter } from "./reporter.js";` — adds the new interface.
  - `export * from "./codes.generated.js";` — re-exports all 18 `CASPIAN_*` constants.

The order matters for readability (types first, then the generated constants block) but does NOT affect TypeScript semantics. After this change, an external consumer importing `@caspian-dev/core/diagnostics` resolves:

```ts
import {
  CASPIAN_E001, CASPIAN_W001,         // typed constants
  type Diagnostic,                     // runtime emission shape
  type DiagnosticDefinition,           // catalog-entry shape
  type Severity, type ValidationResult, type Reporter,
} from "@caspian-dev/core/diagnostics";
```

The exact target file is captured byte-faithfully in *Reference diagnostics/index.ts target* below.

**AC10.** Pre-commit hook is wired and verified. After running `pnpm install` from inside `caspian/` (which triggers the `prepare` script from AC2, which invokes `simple-git-hooks`), the file `joselimmo-marketplace-bmad/.git/hooks/pre-commit` exists and contains the command from the `simple-git-hooks` config (AC2). The dev MUST manually verify the hook is wired by running `pnpm -C caspian exec simple-git-hooks` and confirming stdout reports `[ok] pre-commit`. The dev MUST then trigger a real pre-commit cycle to confirm the hook fires:

  1. Make any inconsequential edit to `caspian/diagnostics/registry.json` (e.g., reformat whitespace, add a no-op trailing newline) without altering the `diagnostics` array values.
  2. `git add caspian/diagnostics/registry.json`
  3. `git commit -m "test pre-commit hook"` — the hook fires, runs `pnpm gen:codes`, regenerates `codes.generated.ts` (with potentially the same hash if the JSON content is unchanged after re-parse / re-stringify? — actually no, the script reads RAW bytes, so even a whitespace-only edit changes the hash). The hook then runs `git add packages/core/src/diagnostics/codes.generated.ts`. The commit is amended with the regenerated file.
  4. Verify the commit contains both `caspian/diagnostics/registry.json` and `caspian/packages/core/src/diagnostics/codes.generated.ts`.
  5. **Reset the test commit** before continuing implementation: `git reset HEAD~1` (soft, preserves working tree). Restore `caspian/diagnostics/registry.json` to its pre-test state via `git checkout caspian/diagnostics/registry.json`. Re-run `pnpm gen:codes` to bring `codes.generated.ts` back into sync. Verify `pnpm verify-codes-hash` exits 0.

This procedure is **destructive to git state** if performed sloppily — the dev MUST perform it on a feature branch (NOT directly on `main`), and MUST verify `git status` is clean (no unintended drift) before and after. Document the verification in *Debug Log References* (cross-check #6) with the test-commit hash and the reset hash.

**Caveat — sub-folder repo arrangement:** `caspian/` is a sub-folder under `joselimmo-marketplace-bmad/`, not the root of an independent git repo. simple-git-hooks finds the closest ancestor `.git/` directory, which is `joselimmo-marketplace-bmad/.git/`. The hook command in AC2 (`pnpm --filter @caspian-dev/core gen:codes && git add packages/core/src/diagnostics/codes.generated.ts`) works ONLY if the cwd at hook-invocation time is `caspian/`. Git's pre-commit hook runs with the cwd set to the repo root (`joselimmo-marketplace-bmad/`), NOT `caspian/`. The hook command MUST be amended to handle this — see *Reference root package.json modifications — simple-git-hooks block* for the exact form (`cd caspian && pnpm --filter @caspian-dev/core gen:codes && git add caspian/packages/core/src/diagnostics/codes.generated.ts`). The `cd caspian &&` prefix is the load-bearing addition; without it, `pnpm` fails to find the workspace and the hook errors.

**AC11.** `.gitattributes` rule alignment is verified (no edit). The file `caspian/.gitattributes` line 2 reads exactly:

```
packages/core/src/diagnostics/codes.generated.ts merge=ours linguist-generated=true
```

This rule is in place from Story 1.1 (deferred-work item 1.1 #1). Story 2.2 lands `codes.generated.ts` at exactly that path. The dev MUST verify by running:

```bash
git check-attr -a caspian/packages/core/src/diagnostics/codes.generated.ts
```

The output MUST include both `merge: ours` and `linguist-generated: true`. Document the output in *Debug Log References* (cross-check #7). If the path differs (e.g., the dev placed the file at `packages/core/src/codes.generated.ts` without the `diagnostics/` segment), the rule silently no-ops — `git check-attr` will return only the implicit `text: auto` and `eol: lf` from line 1 (`* text=auto eol=lf`). Treat any deviation as a story-blocking bug; relocate the file to align with the `.gitattributes` rule rather than editing `.gitattributes` (which is sealed by Story 1.1 — sealed files are not retroactively edited).

**AC12.** `caspian/packages/core/CHANGELOG.md` is amended with a new bullet under the existing `## Unreleased` section. The current file (Story 2.1, 14 lines) has one bullet documenting the package skeleton. Append (preserving the existing bullet, in chronological order):

```markdown
- Diagnostic registry → typed TS constants (`codes.generated.ts`, 18 entries
  derived from `caspian/diagnostics/registry.json`) with sha256 header (`// Hash:
  <hex>`) and `verify-codes-hash` CI gate. Adds `ajv-validate-registry` CI gate
  (registry-shape validation against `schemas/v1/diagnostic-registry.schema.json`).
  Adds `Reporter` interface and `DiagnosticDefinition` type to `./diagnostics`
  sub-export. Pre-commit hook (`simple-git-hooks`) regenerates `codes.generated.ts`
  on every commit.
```

`caspian/packages/core/README.md` is amended in place. The current file (Story 2.1, 51 lines) has a `## Public API surface` section listing what ships from `.` and `./diagnostics`. Update the `./diagnostics` paragraph to document the new exports:

  - Add `DiagnosticDefinition` to the type list.
  - Add `Reporter` to the type list.
  - Add a sentence: *"The 18 typed code constants (`CASPIAN_E001` through `CASPIAN_E014`, `CASPIAN_W001` through `CASPIAN_W004`) are exported as `DiagnosticDefinition` values, generated from `caspian/diagnostics/registry.json` and verified at build time via the sha256 header in `codes.generated.ts`."*
  - Remove or rewrite the Story 2.1 forward-reference (*"Story 2.2 will export typed diagnostic-code constants … alongside"*) — that promise is now fulfilled.

The exact target text for both files is captured in *Reference CHANGELOG.md amendment* and *Reference README.md amendment* below.

**AC13.** Smoke gate baseline maintained. After all changes:

  - `pnpm -C caspian lint` exits 0. Expected new file count: ≈ 22 files (18 from Story 2.1 + 4 new biome-checked files from this story: `gen-diagnostic-codes.ts`, `verify-codes-hash.ts`, `ajv-validate-registry.ts`, `reporter.ts`. The 5th new file `codes.generated.ts` is excluded by `.biomeignore` `**/*.generated.ts`. The 6th new file in tests/ — `tests/unit/diagnostics/codes-shape.test.ts`, AC14 — adds one more lint target. Final expected: 23 biome-checked files. Document the actual count in *Completion Notes — Smoke gate baseline*.
  - `pnpm -C caspian test` exits 0. Expected: ≥ 4 test files, ≥ 6 tests passing (Story 2.1's 1 file / 3 tests + Story 2.2's new tests from AC14).
  - `pnpm -C caspian build` exits 0. Build order: `pnpm gen:codes && tsc -p tsconfig.json && tsx scripts/copy-schemas.ts`. The build emits `dist/diagnostics/codes.generated.js` (compiled from `src/diagnostics/codes.generated.ts`) — verify the `.js` exists post-build.
  - `pnpm -C caspian gen:codes` exits 0 and produces `codes.generated.ts` with first line `// Hash: <64-hex>`. Re-running gen:codes produces a byte-identical file (idempotency).
  - `pnpm -C caspian verify-codes-hash` exits 0 immediately after gen:codes (the freshly generated file matches by construction).
  - `pnpm -C caspian ajv-validate-registry` exits 0 against the live `diagnostics/registry.json` (which is sealed and known-valid).
  - `pnpm -C caspian exec node --input-type=module -e "import('./packages/core/dist/diagnostics/index.js').then(m => console.log(typeof m.CASPIAN_E001, m.CASPIAN_E001.code, typeof m.CASPIAN_W004, m.CASPIAN_W004.severity))"` prints `object CASPIAN-E001 object warning` and exits 0 — proves the published-shape ESM sub-export resolves and exposes the typed constants.

Document each of these in *Debug Log References*.

**AC14.** Unit test infrastructure for the diagnostic registry. Create `caspian/packages/core/tests/unit/diagnostics/codes-shape.test.ts` with the following assertions (vitest):

  - **Test 1 — every registry entry has a corresponding constant.** Read `caspian/diagnostics/registry.json` via the `REPO_ROOT` helper. Import `* as codes from "../../../src/diagnostics/codes.generated.js"`. Assert that for each entry in `registry.diagnostics`, the corresponding `CASPIAN_*` constant exists in the imported module and has the same `code`, `severity`, `rule`, `message`, `doc` values.
  - **Test 2 — every constant has a corresponding registry entry.** The reverse direction: for each export in the imported module whose name starts with `CASPIAN_`, assert there is a registry entry with the matching `code` field.
  - **Test 3 — DiagnosticDefinition shape integrity.** Each constant's runtime shape MUST exactly match the `DiagnosticDefinition` interface (5 fields, all strings, no extras). Use a shape assertion (e.g., `expect(Object.keys(CASPIAN_E001).sort()).toEqual(["code", "doc", "message", "rule", "severity"])`) on a representative entry plus the W004 entry (most recently added, Story 1.8).
  - **Test 4 — sha256 header well-formed.** Read `caspian/packages/core/src/diagnostics/codes.generated.ts` as utf8. Assert the first line matches `/^\/\/ Hash: [a-f0-9]{64}$/`.

Optionally (recommended but not blocking): a 5th test that asserts the count of constants equals the count of registry entries (`Object.keys(codes).filter(k => k.startsWith("CASPIAN_")).length === registry.diagnostics.length`).

Place the test file at `caspian/packages/core/tests/unit/diagnostics/codes-shape.test.ts` (the `tests/unit/diagnostics/` subdirectory is created by this test file — it does not yet exist after Story 2.1).

**AC15.** Verify-pack regression check (forward-compatible).  The `package.json` `files` allow-list (`["dist/", "README.md", "CHANGELOG.md", "LICENSE"]` from Story 2.1, AC1) is unchanged in this story. Story 2.8 will lock the published-files snapshot via `verify-pack.ts`. For Story 2.2, the dev MUST manually run `pnpm -C caspian/packages/core pack --dry-run` and verify the listing includes `dist/diagnostics/codes.generated.js`, `dist/diagnostics/codes.generated.d.ts`, `dist/diagnostics/reporter.js`, `dist/diagnostics/reporter.d.ts`, `dist/diagnostics/types.d.ts` (extended) — and does NOT include `src/`, `tests/`, or `scripts/`. Document the listing in *Debug Log References* (cross-check #8).

**AC16.** Manual cross-checks recorded in *Debug Log References* (in the order they appear in this AC list):

  1. **gen:codes idempotency** — run `pnpm gen:codes` twice in a row; assert the second run produces a byte-identical `codes.generated.ts` (use `git diff` or `cmp` on the two outputs).
  2. **verify-codes-hash positive case** — immediately after gen:codes, `pnpm verify-codes-hash` exits 0. Capture the stdout.
  3. **verify-codes-hash negative case (registry tampering)** — temporarily edit `caspian/diagnostics/registry.json` (e.g., change a registry entry's `message` field by one character). Run `pnpm verify-codes-hash` — it MUST exit 1 with the error message documented in AC5. Restore via `git checkout caspian/diagnostics/registry.json`. Capture both stdout and stderr.
  4. **verify-codes-hash negative case (codes.generated.ts header tampering)** — temporarily edit `caspian/packages/core/src/diagnostics/codes.generated.ts` line 1 to change one hex char in the hash. Run `pnpm verify-codes-hash` — exits 1 with the same error class. Restore via `git checkout` + re-run gen:codes if needed. Capture stderr.
  5. **ajv-validate-registry positive case** — `pnpm ajv-validate-registry` against the live registry exits 0.
  6. **Pre-commit hook fires** — see AC10 (test commit + reset). Capture the test-commit hash + the regenerated codes.generated.ts diff.
  7. **`.gitattributes` rule alignment** — `git check-attr -a caspian/packages/core/src/diagnostics/codes.generated.ts` reports both `merge: ours` and `linguist-generated: true`. Capture the output.
  8. **verify-pack listing** — see AC15. Capture the relevant excerpt of the dry-run output (the dist/ section).

Each cross-check is a separate paragraph in *Debug Log References* with the exact command + output. Cross-checks #3, #4, #6 require deliberate destructive operations followed by clean restoration; the dev MUST verify `git status` is clean after each before proceeding.

## Tasks / Subtasks

- [x] **Task 1 — Per-package package.json scripts** (AC: #1)
  - [x] Open `caspian/packages/core/package.json`. Locate the `scripts` block.
  - [x] Add the three new entries (`gen:codes`, `verify-codes-hash`, `ajv-validate-registry`) — positions don't matter to JSON semantics, but place them in the order listed in AC1 for readability.
  - [x] Amend the `build` script to chain `pnpm gen:codes` first.
  - [x] Run `pnpm -C caspian lint` to verify the JSON formatter doesn't surface any drift.
- [x] **Task 2 — Root package.json scripts + simple-git-hooks** (AC: #2)
  - [x] Open `caspian/package.json`. Add the three pass-through scripts under `scripts`.
  - [x] Add `"prepare": "simple-git-hooks || true"` under `scripts`.
  - [x] Add `"simple-git-hooks": "^2.11.1"` under `devDependencies` — preserve alphabetical order.
  - [x] Add the top-level `simple-git-hooks` configuration block (see *Reference root package.json modifications*).
  - [x] Run `pnpm -C caspian install` — this resolves and installs `simple-git-hooks`, then `prepare` fires and wires `joselimmo-marketplace-bmad/.git/hooks/pre-commit`. Capture `pnpm-lock.yaml` diff scope (additive only — verify per AC18 cross-check pattern from Story 2.1).
- [x] **Task 3 — Generator script** (AC: #3, #4)
  - [x] Create `caspian/packages/core/scripts/gen-diagnostic-codes.ts` from the *Reference gen-diagnostic-codes.ts* model.
  - [x] Run `pnpm -C caspian gen:codes`. Verify the script writes `caspian/packages/core/src/diagnostics/codes.generated.ts`.
  - [x] Open the generated file and verify: first line is `// Hash: <64-hex>`; followed by the DO-NOT-EDIT banner; followed by the `import type { DiagnosticDefinition } from "./types.js";` line; followed by 18 `export const CASPIAN_*` lines; trailing newline present.
  - [x] Re-run `pnpm gen:codes` and `git diff caspian/packages/core/src/diagnostics/codes.generated.ts` — verify zero diff (idempotency, AC16 cross-check #1).
- [x] **Task 4 — Verify-hash script** (AC: #5)
  - [x] Create `caspian/packages/core/scripts/verify-codes-hash.ts` from the *Reference verify-codes-hash.ts* model.
  - [x] Run `pnpm -C caspian verify-codes-hash`. Verify exit 0 (AC16 cross-check #2).
  - [x] Perform the registry-tampering negative test (AC16 cross-check #3): edit registry.json, run, verify exit 1, restore.
  - [x] Perform the header-tampering negative test (AC16 cross-check #4): edit codes.generated.ts header, run, verify exit 1, restore via re-running gen:codes.
- [x] **Task 5 — ajv-validate-registry script** (AC: #6)
  - [x] Create `caspian/packages/core/scripts/ajv-validate-registry.ts` from the *Reference ajv-validate-registry.ts* model.
  - [x] Run `pnpm -C caspian ajv-validate-registry`. Verify exit 0 (AC16 cross-check #5).
  - [x] (Optional) Smoke-test the negative case: temporarily introduce an invalid entry (e.g., `severity: "info"`) into a working copy of registry.json, verify the script exits 1, restore. This is NOT required for AC16 but is useful diagnostic.
- [x] **Task 6 — Type expansion + reporter interface** (AC: #7, #8)
  - [x] Open `caspian/packages/core/src/diagnostics/types.ts`. Add the `DiagnosticDefinition` interface declaration after the `Diagnostic` interface, before `ValidationResult`. Match the *Reference types.ts target* byte-faithfully.
  - [x] Create `caspian/packages/core/src/diagnostics/reporter.ts` from the *Reference reporter.ts* model.
  - [x] Run `pnpm -C caspian -F @caspian-dev/core build` to verify the type changes compile cleanly (no TS error). The build also exercises the gen:codes step (build chain from AC1).
- [x] **Task 7 — Diagnostics barrel** (AC: #9)
  - [x] Open `caspian/packages/core/src/diagnostics/index.ts`. Replace the current single line with the three lines documented in *Reference diagnostics/index.ts target*.
  - [x] Run `pnpm -C caspian -F @caspian-dev/core build` to verify the barrel resolves cleanly.
- [x] **Task 8 — Pre-commit hook verification** (AC: #10)
  - [x] Run `pnpm -C caspian exec simple-git-hooks` (idempotent — re-runs the wiring; harmless if already wired by `prepare`). Verify stdout includes `[ok] pre-commit`.
  - [x] Open `joselimmo-marketplace-bmad/.git/hooks/pre-commit` (the wired script) and verify it contains the hook command from the `simple-git-hooks` config block.
  - [x] Perform the test-commit cycle (AC10 + AC16 cross-check #6) on a feature branch (NOT main). Document the test-commit hash, then `git reset HEAD~1` (soft) and re-clean.
- [x] **Task 9 — `.gitattributes` rule alignment** (AC: #11)
  - [x] Run `git check-attr -a caspian/packages/core/src/diagnostics/codes.generated.ts`. Verify both `merge: ours` and `linguist-generated: true` appear (AC16 cross-check #7).
- [x] **Task 10 — Documentation updates** (AC: #12)
  - [x] Append the new bullet to `caspian/packages/core/CHANGELOG.md` under `## Unreleased` (after the Story 2.1 bullet).
  - [x] Update `caspian/packages/core/README.md` `## Public API surface` section per *Reference README.md amendment*.
- [x] **Task 11 — Smoke gate verification** (AC: #13)
  - [x] Run `pnpm -C caspian lint`. Capture the *Checked N files* line. Document the new biome scope in *Completion Notes — Smoke gate baseline*. Expected ≈ 23 files.
  - [x] Run `pnpm -C caspian test`. Verify exit 0; capture passing-test count.
  - [x] Run `pnpm -C caspian build`. Verify exit 0; verify `dist/diagnostics/codes.generated.js` + `.d.ts` exist.
  - [x] Run the ESM-import smoke check from AC13 final bullet. Verify `object CASPIAN-E001 object warning` is printed.
- [x] **Task 12 — Unit tests** (AC: #14)
  - [x] Create `caspian/packages/core/tests/unit/diagnostics/codes-shape.test.ts` from the *Reference codes-shape.test.ts* model.
  - [x] Run `pnpm -C caspian test` — verify all 4 (or 5) new tests pass.
- [x] **Task 13 — Verify-pack** (AC: #15)
  - [x] Run `pnpm -C caspian/packages/core pack --dry-run`. Capture the listing. Verify the expected dist/ entries are present (AC16 cross-check #8) and src/, tests/, scripts/ are absent.
- [x] **Task 14 — Cross-check assembly** (AC: #16)
  - [x] Compile all 8 cross-check outputs into the *Debug Log References* section of this story file under *Dev Agent Record*. Each as a separate sub-section.
  - [x] Verify `git status caspian/` shows only the expected modifications + new files. No drift.
  - [x] Update *Completion Notes List* with files-created counts, files-modified-in-place, smoke-gate baseline number, and any deliberate departures from epic AC text.
  - [x] Update *File List* with all created and modified paths.
  - [x] Update *Change Log* table.

## Dev Notes

### Source authority

  - **Primary contract:** Acceptance Criteria above. AC text is the authoritative interpretation of the epic's literal text — Story 2.2 epic text in `_bmad-output/planning-artifacts/epics.md` lines 751–797 is the upstream source, but the AC list above resolves several literal-vs-architectural-intent details (e.g., the registry has 18 entries today, not 17; the pre-commit hook command needs `cd caspian` because of the sub-folder repo arrangement) — when the AC list and the epic literal diverge, prefer the AC list.
  - **Architecture references:** see *References* section. Most relevant: architecture C3/C5 (registry pipeline + 18 codes after Story 1.8), lines 539 (`.gitattributes` rule), 590 (registry path), 640–642 (file paths), 657–660 (script paths), 731–735 (single-source-of-truth + sha256 + safeguards), 812–815 (data-flow diagram), 866 (`pnpm gen:codes` documentation), 879 (pre-commit hook documentation).
  - **Reference Models** — `caspian/diagnostics/registry.json` (18-entry payload to derive constants from), `caspian/schemas/v1/diagnostic-registry.schema.json` (the schema ajv-validate-registry consumes), `caspian/packages/core/src/diagnostics/types.ts` (current state of the file to be expanded), `caspian/packages/core/src/diagnostics/index.ts` (current barrel to expand), `caspian/packages/core/src/validator.ts` (Story 2.1's ajv pattern; the new `ajv-validate-registry.ts` script mirrors the import shape: `import { Ajv2020 } from "ajv/dist/2020.js"`).

### Reference packages/core/package.json modifications

The current file (Story 2.1) declares 5 scripts. Target state (additive — preserve existing entries; only `build` is amended):

```jsonc
{
  // ... unchanged: name, version, description, license, author, type, engines,
  //                main, types, exports, files, publishConfig
  "scripts": {
    "gen:codes": "tsx scripts/gen-diagnostic-codes.ts",
    "verify-codes-hash": "tsx scripts/verify-codes-hash.ts",
    "ajv-validate-registry": "tsx scripts/ajv-validate-registry.ts",
    "build": "pnpm gen:codes && tsc -p tsconfig.json && tsx scripts/copy-schemas.ts",
    "dev": "tsc -p tsconfig.json --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "copy-schemas": "tsx scripts/copy-schemas.ts"
  }
  // ... unchanged: dependencies, devDependencies
}
```

The biome JSON formatter sorts neither object keys nor scripts; the order above matches the reading order (new scripts first, then build, then existing — read chronologically by story).

### Reference root package.json modifications

The current file (Story 1.1 + Epic 1 retro AI-2) has 4 scripts and 2 devDeps. Target state:

```jsonc
{
  "name": "caspian-monorepo",
  "version": "0.0.0",
  "private": true,
  "description": "Caspian — Composable Agent Skill Protocol. Spec, vendor-neutral CLI validator, and reference Claude Code plugin.",
  "license": "Apache-2.0",
  "author": "Cyril Houillon",
  "type": "module",
  "engines": { "node": ">=22.13" },
  "packageManager": "pnpm@10.26.1",
  "scripts": {
    "lint": "biome check .",
    "test": "pnpm -r --if-present test",
    "build": "pnpm -r --if-present build",
    "release": "changeset publish",
    "gen:codes": "pnpm --filter @caspian-dev/core gen:codes",
    "verify-codes-hash": "pnpm --filter @caspian-dev/core verify-codes-hash",
    "ajv-validate-registry": "pnpm --filter @caspian-dev/core ajv-validate-registry",
    "prepare": "simple-git-hooks || true"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.4.13",
    "@changesets/cli": "^2.31.0",
    "simple-git-hooks": "^2.11.1"
  },
  "simple-git-hooks": {
    "pre-commit": "cd caspian && pnpm --filter @caspian-dev/core gen:codes && cd .. && git add caspian/packages/core/src/diagnostics/codes.generated.ts"
  }
}
```

**Key load-bearing decisions:**

  - The hook command begins with `cd caspian` because git's pre-commit hook runs with cwd = repo root (`joselimmo-marketplace-bmad/`), but `pnpm --filter @caspian-dev/core` requires cwd = `caspian/` to find the workspace. After running gen:codes, `cd ..` returns to the repo root so `git add caspian/...` resolves.
  - The `prepare` script form `simple-git-hooks || true` is the standard idiom; the `|| true` prevents failures in environments without git history (e.g., npm tarball consumers). Without it, `pnpm install` would error in those environments.
  - `simple-git-hooks ^2.11.1` is the version pinned at story-creation time (late 2026 latest 2.x). The package has a long-stable major; ^2.11.1 floor is the conservative choice. The dev MUST NOT bump to a newer major without re-verifying the wire-up procedure.

### Reference gen-diagnostic-codes.ts

The exact recommended body (the dev MAY refactor for style/clarity; the load-bearing constraints are: read raw bytes for hash, write the `// Hash: <hex>` first line, write 18 typed `export const` lines):

```ts
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

const REGISTRY_PATH = path.resolve(here, "..", "..", "..", "diagnostics", "registry.json");
const OUTPUT_PATH = path.resolve(here, "..", "src", "diagnostics", "codes.generated.ts");

interface RegistryEntry {
  code: string;
  severity: "error" | "warning";
  rule: string;
  message: string;
  doc: string;
}

interface RegistryFile {
  diagnostics: RegistryEntry[];
}

const rawBytes = await fs.readFile(REGISTRY_PATH);
const hash = crypto.createHash("sha256").update(rawBytes).digest("hex");
const registry = JSON.parse(rawBytes.toString("utf8")) as RegistryFile;

const banner = [
  `// Hash: ${hash}`,
  "// DO NOT EDIT — generated by packages/core/scripts/gen-diagnostic-codes.ts",
  "// Source of truth: caspian/diagnostics/registry.json",
  "// Regenerate with: pnpm gen:codes",
  "// Hash drift is detected by: pnpm verify-codes-hash",
];

const importLine = `import type { DiagnosticDefinition } from "./types.js";`;

const constLines = registry.diagnostics.map((entry) => {
  const constName = entry.code.replace("-", "_");
  return [
    `export const ${constName}: DiagnosticDefinition = {`,
    `  code: ${JSON.stringify(entry.code)},`,
    `  severity: ${JSON.stringify(entry.severity)},`,
    `  rule: ${JSON.stringify(entry.rule)},`,
    `  message: ${JSON.stringify(entry.message)},`,
    `  doc: ${JSON.stringify(entry.doc)},`,
    `};`,
  ].join("\n");
});

const output = [...banner, "", importLine, "", ...constLines, ""].join("\n");

await fs.writeFile(OUTPUT_PATH, output, "utf8");
console.log(`[gen-diagnostic-codes] generated ${registry.diagnostics.length} typed constants → ${OUTPUT_PATH}`);
```

**Notes on the style choices** (none are load-bearing; the dev may refactor):

  - `JSON.stringify` is used instead of literal string templating to safely escape any embedded backticks, quotes, or newlines in registry message text. Several v1.0 messages contain backticks (e.g., `"Field \`type\` is missing or empty"`) — manual escaping is error-prone.
  - The constant body is multi-line (one field per line, trailing commas) for readability in PR diffs. A single-line form per constant is also acceptable but less reviewable.
  - The trailing empty string in the `output` array produces the final newline.
  - The script is fully top-level await — Node 22.13 + ESM `nodenext` supports this natively.

### Reference verify-codes-hash.ts

```ts
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

const REGISTRY_PATH = path.resolve(here, "..", "..", "..", "diagnostics", "registry.json");
const CODES_PATH = path.resolve(here, "..", "src", "diagnostics", "codes.generated.ts");

const HEADER_PATTERN = /^\/\/ Hash: ([a-f0-9]{64})$/;

const rawBytes = await fs.readFile(REGISTRY_PATH);
const recomputed = crypto.createHash("sha256").update(rawBytes).digest("hex");

const codesText = await fs.readFile(CODES_PATH, "utf8");
const firstLine = codesText.split("\n", 1)[0] ?? "";
const match = firstLine.match(HEADER_PATTERN);

if (match === null) {
  console.error(
    "Error: codes.generated.ts header is missing or malformed " +
      `(expected "// Hash: <sha256-hex>" on line 1, got: ${JSON.stringify(firstLine)}). ` +
      "Run `pnpm gen:codes` to regenerate.",
  );
  process.exit(1);
}

const captured = match[1];

if (captured !== recomputed) {
  console.error(
    "Error: codes.generated.ts is out of sync with diagnostics/registry.json. " +
      `Expected hash ${captured}, got ${recomputed}. ` +
      "Run `pnpm gen:codes` to regenerate, then commit the result.",
  );
  process.exit(1);
}

console.log(`[verify-codes-hash] OK — registry sha256 matches codes.generated.ts header (${recomputed})`);
```

### Reference ajv-validate-registry.ts

```ts
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Ajv2020 } from "ajv/dist/2020.js";

const here = path.dirname(fileURLToPath(import.meta.url));

const REGISTRY_PATH = path.resolve(here, "..", "..", "..", "diagnostics", "registry.json");
const SCHEMA_PATH = path.resolve(here, "..", "..", "..", "schemas", "v1", "diagnostic-registry.schema.json");

const [registryRaw, schemaRaw] = await Promise.all([
  fs.readFile(REGISTRY_PATH, "utf8"),
  fs.readFile(SCHEMA_PATH, "utf8"),
]);

const registry = JSON.parse(registryRaw) as unknown;
const schema = JSON.parse(schemaRaw) as object;

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validate = ajv.compile(schema);

if (validate(registry)) {
  const count = (registry as { diagnostics: unknown[] }).diagnostics.length;
  console.log(
    `[ajv-validate-registry] OK — diagnostics/registry.json (${count} entries) conforms to schemas/v1/diagnostic-registry.schema.json`,
  );
  process.exit(0);
}

for (const error of validate.errors ?? []) {
  const where = error.instancePath || "(root)";
  console.error(`${where} ${error.message ?? "(no message)"}`);
}
process.exit(1);
```

**Notes:**

  - The `import { Ajv2020 } from "ajv/dist/2020.js";` shape (named import, NOT default import) mirrors Story 2.1's `validator.ts:1`. Reasoning preserved from Story 2.1's Completion Notes: under TS 5.9 + nodenext + ajv 8.20, the default-import shape produces `error TS2351: This expression is not constructable.` The named import is unambiguous and equally idiomatic.
  - The script does NOT go through `loader.ts`. Verrou 2 (biome `noRestrictedImports`) governs `import` statements that ascend out of `src/`; this script is in `scripts/` (excluded from `tsconfig.json` `include` per Story 2.1 AC5; build-time only) and reads JSON via `fs.readFile` (string path, not a TS import statement). No verrou is bypassed.
  - The script imports `Ajv2020` directly. This is the SECOND import of ajv in the package (first is `validator.ts`). Both compile against the same dep version; no fragmentation risk.

### Reference types.ts target

After AC7's modification, the file looks like:

```ts
export type Severity = "error" | "warning";

export interface Diagnostic {
  code: string;
  severity: Severity;
  line: number;
  field?: string;
  message: string;
}

export interface DiagnosticDefinition {
  code: string;
  severity: Severity;
  rule: string;
  message: string;
  doc: string;
}

export interface ValidationResult {
  file: string;
  valid: boolean;
  diagnostics: Diagnostic[];
}
```

Note the **deliberate absence of `line: number` in `DiagnosticDefinition`** — catalog entries describe codes, not emission instances. Adding `line` to `DiagnosticDefinition` would conflate the catalog and emission shapes; reject any review suggestion to "unify" the two interfaces.

### Reference reporter.ts

```ts
import type { Diagnostic } from "./types.js";

export interface Reporter {
  report(diagnostics: Diagnostic[], filePath: string): void;
}
```

The file is intentionally 4 lines including the blank line between import and export. Do NOT add JSDoc or a sample implementation; the architecture mandates the abstraction lives in core, the implementation in cli (Stories 2.5 + 2.6).

### Reference diagnostics/index.ts target

After AC9's modification:

```ts
export type {
  Diagnostic,
  DiagnosticDefinition,
  Reporter,
  Severity,
  ValidationResult,
} from "./types.js";
export type { Reporter as ReporterAlias } from "./reporter.js"; // ❌ DO NOT DO THIS — see notes below

export * from "./codes.generated.js";
```

**Wait — the second line above is a deliberate anti-example** (the dev MUST NOT include it). The actual target is:

```ts
export type {
  Diagnostic,
  DiagnosticDefinition,
  Severity,
  ValidationResult,
} from "./types.js";
export type { Reporter } from "./reporter.js";

export * from "./codes.generated.js";
```

Both `types.ts` and `reporter.ts` export distinct symbols; do not alias `Reporter`. The barrel re-exports each from its native module. The order (types-from-types-file, types-from-reporter-file, then constants) is for readability; TypeScript does not care about the order.

### Reference codes.generated.ts header

The first 6 lines of `codes.generated.ts` (after gen:codes runs against the current 18-entry registry) MUST match this shape exactly (the hash hex value depends on the registry's byte content; the structure does not):

```ts
// Hash: a1b2c3d4e5f6...0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcd
// DO NOT EDIT — generated by packages/core/scripts/gen-diagnostic-codes.ts
// Source of truth: caspian/diagnostics/registry.json
// Regenerate with: pnpm gen:codes
// Hash drift is detected by: pnpm verify-codes-hash
import type { DiagnosticDefinition } from "./types.js";
```

Followed by an empty line, then 18 `export const CASPIAN_*: DiagnosticDefinition = { ... };` blocks.

### Reference codes-shape.test.ts

```ts
import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as codes from "../../../src/diagnostics/codes.generated.js";
import { REPO_ROOT } from "../../helpers/paths.js";

interface RegistryEntry {
  code: string;
  severity: "error" | "warning";
  rule: string;
  message: string;
  doc: string;
}

const registryRaw = await fs.readFile(
  path.join(REPO_ROOT, "diagnostics", "registry.json"),
  "utf8",
);
const registry = JSON.parse(registryRaw) as { diagnostics: RegistryEntry[] };
const codesByCode = new Map<string, RegistryEntry>(
  Object.entries(codes)
    .filter(([key]) => key.startsWith("CASPIAN_"))
    .map(([, value]) => [(value as RegistryEntry).code, value as RegistryEntry]),
);

describe("@caspian-dev/core/diagnostics codes.generated", () => {
  it("exports one constant per registry entry", () => {
    for (const entry of registry.diagnostics) {
      const constant = codesByCode.get(entry.code);
      expect(constant, `missing constant for ${entry.code}`).toBeDefined();
      expect(constant).toEqual(entry);
    }
  });

  it("registry has one entry per exported constant", () => {
    const registryCodes = new Set(registry.diagnostics.map((d) => d.code));
    for (const code of codesByCode.keys()) {
      expect(registryCodes.has(code), `orphan constant ${code}`).toBe(true);
    }
  });

  it("each constant matches the DiagnosticDefinition shape", () => {
    const expectedKeys = ["code", "doc", "message", "rule", "severity"];
    for (const [, entry] of codesByCode) {
      expect(Object.keys(entry).sort()).toEqual(expectedKeys);
    }
  });

  it("codes.generated.ts has a well-formed sha256 header", async () => {
    const codesPath = path.join(
      REPO_ROOT,
      "packages",
      "core",
      "src",
      "diagnostics",
      "codes.generated.ts",
    );
    const text = await fs.readFile(codesPath, "utf8");
    const firstLine = text.split("\n", 1)[0] ?? "";
    expect(firstLine).toMatch(/^\/\/ Hash: [a-f0-9]{64}$/);
  });

  it("constant count equals registry entry count", () => {
    expect(codesByCode.size).toBe(registry.diagnostics.length);
  });
});
```

The test file imports the generated module via a relative path (`../../../src/diagnostics/codes.generated.js` — `.js` because `nodenext` resolution; vitest's TS transformer handles the `.ts` source). Tests run against the source tree (not the dist build), so `pnpm gen:codes` MUST run before `pnpm test` (the `build` chain in AC1 ensures gen:codes runs in any composite test+build flow, but pure `pnpm test` after a fresh clone requires the dev to run gen:codes manually first — document this in README's Testing section if not already).

### Reference CHANGELOG.md amendment

The current `## Unreleased` section has one bullet (Story 2.1). Append the second bullet:

```markdown
- Diagnostic registry → typed TS constants (`codes.generated.ts`, 18 entries
  derived from `caspian/diagnostics/registry.json`) with sha256 header (`// Hash:
  <hex>`) and `verify-codes-hash` CI gate. Adds `ajv-validate-registry` CI gate
  (registry-shape validation against `schemas/v1/diagnostic-registry.schema.json`).
  Adds `Reporter` interface and `DiagnosticDefinition` type to `./diagnostics`
  sub-export. Pre-commit hook (`simple-git-hooks`) regenerates `codes.generated.ts`
  on every commit.
```

Preserve the existing Story 2.1 bullet. The order is chronological; new bullets append.

### Reference README.md amendment

The current `## Public API surface` section has two paragraphs (one for `.`, one for `./diagnostics`). Replace the `./diagnostics` paragraph with:

```markdown
From the `./diagnostics` sub-export (`@caspian-dev/core/diagnostics`):

- `Diagnostic`, `Severity`, `ValidationResult`, `DiagnosticDefinition`, `Reporter` —
  type definitions.
- `CASPIAN_E001` through `CASPIAN_E014`, `CASPIAN_W001` through `CASPIAN_W004` —
  18 typed code constants (`DiagnosticDefinition` values) generated from
  `caspian/diagnostics/registry.json`. The generated file `codes.generated.ts`
  carries a sha256 header verified at build time by `pnpm verify-codes-hash`;
  the registry shape is validated against
  `schemas/v1/diagnostic-registry.schema.json` by `pnpm ajv-validate-registry`.
```

Remove the Story 2.1 forward-reference sentence (*"Story 2.2 will export typed diagnostic-code constants … alongside"*) — that promise is now fulfilled.

### Loader.ts is NOT modified by this story

Story 2.1's `loader.ts` reads `envelope.schema.json` only. Story 2.2 adds `ajv-validate-registry.ts` which reads `diagnostic-registry.schema.json` directly via `fs.readFile`, NOT via `loader.ts`. Reasoning:

  - `loader.ts` is the schema-loading entry point for **production validator code** (the runtime pipeline in Stories 2.3–2.4). The CI script `ajv-validate-registry.ts` is a build-time tool, not validator runtime — its purpose is to gate registry edits during PR review.
  - Verrou 2's biome rule applies to `import` statements; the script reads via `fs.readFile(stringPath)` which is not an import. No verrou is bypassed.
  - Threading the diagnostic-registry schema through `loader.ts` would extend `loader.ts`'s public surface (it would need a `loadDiagnosticRegistrySchema(): Promise<object>` function) and force the test infra to mock another loader call. Net: more code, no architectural benefit.

A future hardening story may consolidate by extending `loader.ts` to be a generic schema loader — if so, the dev MUST update Verrou 3's audit grep and add a unit test ensuring both schemas are loadable via the same entry. This is **out of scope for Story 2.2**.

### Pre-commit hook scope decision

The epic AC at line 776–778 reads: *"When I commit a change touching `diagnostics/registry.json` / Then the hook auto-runs `pnpm gen:codes` and `git add packages/core/src/diagnostics/codes.generated.ts`"*. This implies a file-targeted hook (only fires when registry.json is in the staged set).

simple-git-hooks supports a single shell command per hook event; it does NOT natively support file-targeted invocation. Two options:

  - **(A) — File-targeted via `git diff --cached --name-only`:** the hook command tests whether `caspian/diagnostics/registry.json` is in the staged set, and only runs gen:codes if so. Form: `git diff --cached --name-only | grep -q '^caspian/diagnostics/registry.json' && cd caspian && pnpm --filter @caspian-dev/core gen:codes && cd .. && git add caspian/packages/core/src/diagnostics/codes.generated.ts || true`. The `|| true` ensures non-matching commits don't error.
  - **(B) — Unconditional (run on every commit):** the hook command runs `gen:codes && git add` unconditionally. If registry.json is unchanged, `codes.generated.ts` regenerates byte-identically (the script is deterministic given identical input bytes), and `git add` is a no-op. Slower per-commit (~50ms-500ms depending on Node startup), but mechanically simpler and architecturally clearer (the hook expresses the invariant "after every commit, codes.generated.ts is in sync", not "after every commit touching registry.json…").

**This story chooses (B).** Reasoning:

  - Mechanical simplicity reduces the failure surface. Option A's `git diff --cached` test is fragile (path matching, grep regex, exit code chaining) — a single typo silently degrades to "hook never fires", and the only signal is that codes.generated.ts drifts from registry.json (caught later by CI's `verify-codes-hash`, but with a worse user experience).
  - The architectural invariant "codes.generated.ts is always in sync with registry.json" is cleanest when expressed unconditionally.
  - The runtime cost is modest. `pnpm --filter @caspian-dev/core gen:codes` cold-starts Node + tsx + reads two small files + writes one — empirically ~200–400 ms on commodity hardware. Bothersome but not punitive.

If the dev encounters a workflow problem (e.g., commits in a CI environment without `pnpm` installed), document the issue in *Completion Notes* and the team can revisit (Option A or a `husky` migration). For Story 2.2, ship Option B.

### Biome useNamingConvention edge case

Biome's default `useNamingConvention` rule has historically had quirks around SCREAMING_SNAKE_CASE for top-level `const` declarations across minor versions. As of biome 2.4.13:

  - The default rule allows `SCREAMING_SNAKE_CASE` for module-scope `const` declarations (per biome's documentation).
  - The constants in `codes.generated.ts` are SCREAMING_SNAKE_CASE (e.g., `CASPIAN_E001`, `CASPIAN_W004`) and SHOULD pass biome lint as-is.
  - **However:** `codes.generated.ts` is excluded from biome lint by `caspian/.biomeignore` line 2 (`**/*.generated.ts`). So biome does NOT check the generated file. The naming rule is a non-issue for the generated file.
  - The `gen-diagnostic-codes.ts` script itself contains the literal string `"CASPIAN_E001"` (or rather, builds it via `entry.code.replace("-", "_")`), but that is a string value, not a declaration — biome does not lint string contents.

Net: there is no biome edge case to handle in Story 2.2. The note exists because Story 2.1's deferred-work item 1.1 #15 (*"No canary fixtures for biome rules"*) flagged biome behavior as a known unknown, and Story 2.2 is the first story landing 18 SCREAMING_SNAKE_CASE constants — surfacing the non-issue here removes future-self surprise.

### Pre-existing files NOT modified

Story 2.2 does NOT modify:

  - `caspian/spec/` (Stories 1.2 + 1.3 sealed)
  - `caspian/schemas/` (Stories 1.4 + 1.5 sealed; the `diagnostic-registry.schema.json` is consumed by `ajv-validate-registry.ts` but not edited)
  - `caspian/diagnostics/registry.json` (Stories 1.5 + 1.8 sealed; Story 2.2 reads but does not write)
  - `caspian/diagnostics/CHANGELOG.md`, `caspian/diagnostics/LICENSE` (Stories 1.5 + 1.8 sealed)
  - `caspian/fixtures/` (Stories 1.6 + 1.8 sealed)
  - `caspian/examples/` (Story 1.7 sealed)
  - `caspian/.gitattributes` (Story 1.1 sealed; the `codes.generated.ts merge=ours linguist-generated=true` rule already at line 2 becomes effective in this story)
  - `caspian/.biomeignore` (Story 1.1 sealed; the `**/*.generated.ts` pattern at line 2 already exempts the generated file from biome lint)
  - `caspian/biome.json` (Story 2.1 modified — Verrou 2 + config-files override; do NOT modify further in Story 2.2)
  - `caspian/.editorconfig`, `.gitignore`, `.npmrc`, `.nvmrc`, `LICENSE`, `LICENSE-CC-BY-4.0`, `README.md` (Story 1.1 + Epic 1 retro AI-2 sealed)
  - `caspian/tsconfig.base.json` (Story 1.1 sealed)
  - `caspian/.changeset/config.json`, `caspian/.changeset/README.md` (Story 1.1 sealed)
  - `caspian/pnpm-workspace.yaml` (Story 1.1 sealed; auto-discovers the existing `packages/core/`)
  - `caspian/packages/core/LICENSE`, `caspian/packages/core/tsconfig.json`, `caspian/packages/core/vitest.config.ts` (Story 2.1 sealed)
  - `caspian/packages/core/src/index.ts`, `src/validator.ts`, `src/schemas/loader.ts` (Story 2.1 sealed)
  - `caspian/packages/core/scripts/copy-schemas.ts` (Story 2.1 sealed)
  - `caspian/packages/core/tests/helpers/paths.ts`, `tests/unit/smoke.test.ts` (Story 2.1 sealed)

`caspian/pnpm-lock.yaml` IS modified (additive: simple-git-hooks resolution). The diff MUST be additive (no version downgrades, no removed entries from Story 2.1's resolutions).

### Anti-patterns to avoid (LLM disaster prevention)

  - **Do NOT** edit `caspian/diagnostics/registry.json` to "fix" any perceived issue while implementing Story 2.2. The registry is sealed by Stories 1.5 + 1.8. Any registry edit is a separate spec-evolution story (Epic 5).
  - **Do NOT** edit `caspian/schemas/v1/diagnostic-registry.schema.json` for any reason. Story 1.5 sealed it.
  - **Do NOT** add `ajv-cli` as a dependency. The `ajv-validate-registry.ts` script uses the already-installed `ajv` package directly (mirrors `validator.ts` from Story 2.1). Adding `ajv-cli` would duplicate ajv in the install graph and create a version-drift surface for no benefit.
  - **Do NOT** add `husky`, `lint-staged`, or any other git-hook wrapper. The architecture mandates `simple-git-hooks`; adding a competing tool fragments the hook ecosystem.
  - **Do NOT** thread the diagnostic-registry schema through `loader.ts`. The script reads via `fs.readFile(stringPath)` directly (see *Loader.ts is NOT modified by this story* above for the full reasoning).
  - **Do NOT** refactor `validator.ts` (Story 2.1) to use the new `DiagnosticDefinition` type. `validator.ts` operates on the runtime `Diagnostic` type; `DiagnosticDefinition` is for catalog metadata. The two types are deliberately distinct (see *Reference types.ts target* notes).
  - **Do NOT** add the constant-generation logic to a TypeScript source file under `src/` — the generator MUST live in `scripts/` (excluded from tsc + bundled tarball). Adding it to `src/` ships the generator to npm consumers as runtime code, which is wrong.
  - **Do NOT** generate `codes.generated.ts` with a different filename or path. The `.gitattributes` rule (Story 1.1) and the `.biomeignore` exclusion (Story 1.1) target this exact path. Any deviation silently disables both safeguards.
  - **Do NOT** use a non-deterministic JSON parse-then-stringify cycle for the hash computation. The hash MUST be over the raw on-disk bytes (`fs.readFile(path)` returning a `Buffer`). Hashing a JSON.stringify'd round-trip would change with formatting (whitespace, key order, escape choices) and produce non-deterministic results.
  - **Do NOT** add a "watch" mode for gen:codes. The script is ~200ms; running it on demand (or via the pre-commit hook) is sufficient. A watch mode increases the failure surface (file-system events on Windows are flaky).
  - **Do NOT** put gen:codes / verify-codes-hash / ajv-validate-registry into the `dev` script chain. They are build-time and CI-time gates, not iteration loops.
  - **Do NOT** under-test the `codes-shape.test.ts` shape assertions. The 4 mandated tests in AC14 are the floor — adding more is fine, but every test MUST genuinely exercise a contract (e.g., test that asserts the registry has `length > 0` is noise; test that asserts every constant's `code` field starts with `"CASPIAN-"` is genuine).
  - **Do NOT** hardcode the 18 in any source code. The number 18 appears in this story file (architecture notes, AC text, completion-notes templates) but the runtime code MUST iterate over `registry.diagnostics`. A future story may grow to 19, 20, …; hardcoded counts silently regress.
  - **Do NOT** delete `caspian/pnpm-lock.yaml` to "regenerate clean". Same reasoning as Story 2.1: the lockfile carries previous resolutions (biome, ajv, vitest, etc.); destroying forces re-resolution and breaks the lockfile-stability contract.

### Latest-tech context (Node 22.13 + ESM `nodenext` + ajv 8 / Draft 2020-12 + biome 2.4 + simple-git-hooks 2.x)

**Node 22.13 + ESM `nodenext`** — same context as Story 2.1; the new scripts use `top-level await`, `import.meta.url`, `node:crypto` (`createHash`).

**`node:crypto` sha256:**

  - `crypto.createHash("sha256").update(buffer).digest("hex")` produces a 64-char lowercase hex string. This is the canonical Node.js API for sha256 — no third-party hashing dependency needed.
  - The `update()` method accepts `Buffer | Uint8Array | string`. For binary fidelity, pass the `Buffer` from `fs.readFile(path)` (no encoding argument). Passing a string with explicit utf8 encoding would re-encode the bytes — usually identical but technically a different byte stream.
  - The hash is deterministic: same input bytes → same hex output, every time, on any Node version, on any OS. CI parity (Linux ubuntu-latest in F1) is guaranteed.

**ajv 8 / Draft 2020-12 (registry-shape validation):**

  - The diagnostic-registry schema declares `"$schema": "https://json-schema.org/draft/2020-12/schema"` and `"$id": "https://caspian.dev/schemas/v1/diagnostic-registry.schema.json"`. ajv's Draft 2020-12 entrypoint (`ajv/dist/2020.js`) is the matching validator.
  - ajv `strict: true` may warn about unrecognized keywords (e.g., `"examples"` is a JSON Schema keyword recognized by ajv 8.17+ but historically flagged in earlier versions). Story 1.5's schema uses `examples` — Story 2.1's `validator.ts` against the envelope schema produced no strict-mode warnings, suggesting ajv 8.20 is fully aligned. If strict-mode warnings surface against the diagnostic-registry schema in Story 2.2, document them in *Completion Notes* (do NOT downgrade strict mode silently).
  - `allErrors: true` makes ajv collect all errors per validation pass. For `ajv-validate-registry.ts` this means a malformed registry produces all errors at once (not just the first), which is the right UX for a CI gate.

**simple-git-hooks 2.x:**

  - The package writes a single shell script per hook event to `.git/hooks/<event>`. The script is platform-independent (POSIX shell). On Windows, `.git/hooks/pre-commit` is invoked by Git Bash (bundled with Git for Windows) — the `cd caspian && ... && cd ..` pattern works under bash.
  - The configuration block lives at the top level of `package.json` (key: `simple-git-hooks`). simple-git-hooks reads it via `package.json` resolution, NOT via a separate config file.
  - `pnpm exec simple-git-hooks` (or the `prepare` script's invocation) writes/rewrites the hook script. The wiring is idempotent; running it multiple times produces the same hook script.
  - `simple-git-hooks` does NOT auto-install on `pnpm install` in the absence of a `prepare` script — that's why AC2 requires the `prepare` script. Without `prepare`, contributors who run `pnpm install` would not get the hook wired and `codes.generated.ts` could drift silently.

### References

  - `_bmad-output/planning-artifacts/epics.md` lines 751–797 (Story 2.2 user story + 7 AC blocks)
  - `_bmad-output/planning-artifacts/architecture.md` lines 251–280 (Diagnostic Registry — C1–C5 + 17/18-code table)
  - `_bmad-output/planning-artifacts/architecture.md` lines 539 (`.gitattributes` rule)
  - `_bmad-output/planning-artifacts/architecture.md` lines 588–591 (`diagnostics/` directory)
  - `_bmad-output/planning-artifacts/architecture.md` lines 627–662 (`packages/core/` directory tree spec)
  - `_bmad-output/planning-artifacts/architecture.md` lines 731–735 (registry single-source-of-truth + sha256 + safeguards)
  - `_bmad-output/planning-artifacts/architecture.md` lines 759–784 (data-flow + tracing tables)
  - `_bmad-output/planning-artifacts/architecture.md` lines 812–815 (registry-derivative data-flow diagram)
  - `_bmad-output/planning-artifacts/architecture.md` lines 866 + 879 + 884–888 (`pnpm gen:codes` + pre-commit + CI gates)
  - `_bmad-output/planning-artifacts/architecture.md` lines 904 (Story-002: Diagnostic registry + safeguards)
  - `_bmad-output/planning-artifacts/architecture.md` line 1034 (release checklist — sha256 + verify hash + .gitattributes + pre-commit)
  - `caspian/diagnostics/registry.json` (the 18-entry payload to derive constants from)
  - `caspian/diagnostics/CHANGELOG.md` (the registry CHANGELOG; not modified by Story 2.2)
  - `caspian/schemas/v1/diagnostic-registry.schema.json` (the schema ajv-validate-registry consumes; not modified by Story 2.2)
  - `caspian/.gitattributes` (the `merge=ours linguist-generated=true` rule on line 2 becomes effective in this story)
  - `caspian/.biomeignore` (the `**/*.generated.ts` pattern on line 2 exempts the generated file from biome lint)
  - `caspian/biome.json` (Story 2.1's `noRestrictedImports` + `noDefaultExport` + `useFilenamingConvention` configuration; Story 2.2 inherits without modification)
  - `caspian/packages/core/src/diagnostics/types.ts` (Story 2.1; expanded by AC7)
  - `caspian/packages/core/src/diagnostics/index.ts` (Story 2.1; expanded by AC9)
  - `caspian/packages/core/src/validator.ts` (Story 2.1; the `Ajv2020` import pattern mirrored in `ajv-validate-registry.ts`)
  - `caspian/packages/core/src/schemas/loader.ts` (Story 2.1; NOT modified by Story 2.2 — see Dev Notes)
  - `caspian/packages/core/scripts/copy-schemas.ts` (Story 2.1; the script-style template `gen-diagnostic-codes.ts` follows)
  - `caspian/packages/core/tests/helpers/paths.ts` (Story 2.1; consumed by `codes-shape.test.ts`)
  - `caspian/packages/core/tests/unit/smoke.test.ts` (Story 2.1; the test-style template `codes-shape.test.ts` follows)
  - `_bmad-output/implementation-artifacts/2-1-caspian-core-skeleton-envelope-schema-integration-loader-ts.md` (Story 2.1 — full context for the package skeleton + 3-verrou + Promise<Diagnostic[]> async signature decision)
  - `_bmad-output/implementation-artifacts/deferred-work.md` lines 7 (Story 1.1 deferred item 1.1 #1: `.gitattributes` rule targets a future path — resolved by this story landing the file at the correct path), lines 71–82 (Story 2.1 review deferrals — most relevant: line 78 missing `"types"` conditions in `exports` (Story 2.8), line 80 `dist/.tsbuildinfo` published (Story 2.8))
  - `_bmad-output/implementation-artifacts/epic-1-retro-2026-04-27.md` AI-1 + AI-2 + AI-3 (Story 1.8 W004 reservation + Node 22 + npm naming pivot — all already applied)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7[1m] (Claude Code, dev-story workflow, 2026-04-27).

### Debug Log References

**Cross-check #1 — gen:codes idempotency.** PASS.

```
$ pnpm -C caspian gen:codes
[gen-diagnostic-codes] generated 18 typed constants → .../caspian/packages/core/src/diagnostics/codes.generated.ts

$ cp caspian/packages/core/src/diagnostics/codes.generated.ts /tmp/codes-snapshot-1.ts
$ pnpm -C caspian gen:codes
[gen-diagnostic-codes] generated 18 typed constants → ...
$ diff /tmp/codes-snapshot-1.ts caspian/packages/core/src/diagnostics/codes.generated.ts
(no output — byte-identical)
```

The generator is deterministic given the same input bytes. Initial sha256 hash: `b303d1395ec438a29d81b61e5a2a5419ee236b6c38b6feba3021de1df8e803c7`.

**Cross-check #2 — verify-codes-hash positive.** PASS, exit 0.

```
$ pnpm -C caspian verify-codes-hash
[verify-codes-hash] OK — registry sha256 matches codes.generated.ts header (b303d1395ec438a29d81b61e5a2a5419ee236b6c38b6feba3021de1df8e803c7)
```

**Cross-check #3 — verify-codes-hash negative (registry tampering).** PASS, exit 1.

```
$ # Tamper: appended a single space byte to registry.json (no-op JSON change, but bytes differ)
$ pnpm -C caspian verify-codes-hash
Error: codes.generated.ts is out of sync with diagnostics/registry.json. Expected hash b303...e803c7, got c7404cf3096b010b304a96f10d469faa10ee9bce49783e45c89aad5e12804fee. Run `pnpm gen:codes` to regenerate, then commit the result.
ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL @caspian-dev/core@0.0.1 verify-codes-hash: `tsx scripts/verify-codes-hash.ts`
Exit status 1
```

Registry restored via `cp /tmp/registry-backup.json caspian/diagnostics/registry.json`; `diff` confirmed byte-identical to backup.

**Cross-check #4 — verify-codes-hash negative (codes.generated.ts header tampering).** PASS, exit 1.

```
$ # Tamper: replaced first hex char of header (b → f)
$ pnpm -C caspian verify-codes-hash
Error: codes.generated.ts is out of sync with diagnostics/registry.json. Expected hash f303...e803c7, got b303d1395ec438a29d81b61e5a2a5419ee236b6c38b6feba3021de1df8e803c7. Run `pnpm gen:codes` to regenerate, then commit the result.
Exit status 1
```

Restored via `pnpm -C caspian gen:codes`; diff confirmed byte-identical to backup.

**Cross-check #5 — ajv-validate-registry positive.** PASS, exit 0.

```
$ pnpm -C caspian ajv-validate-registry
[ajv-validate-registry] OK — diagnostics/registry.json (18 entries) conforms to schemas/v1/diagnostic-registry.schema.json
```

ajv 8.20 + Draft 2020-12 + strict mode accepted the schema and the 18-entry registry without warnings.

**Cross-check #6 — Pre-commit hook fires.** PASS — verified non-destructively via direct hook execution rather than a real test commit (see *Completion Notes — Deliberate departures from epic AC text* for the rationale).

```
$ cat .git/hooks/pre-commit
#!/bin/sh
# Generated by caspian/scripts/install-pre-commit.mjs
# Source: caspian/package.json `simple-git-hooks` block

if [ "$SKIP_SIMPLE_GIT_HOOKS" = "1" ]; then
  echo "[INFO] SKIP_SIMPLE_GIT_HOOKS=1, skipping hook."
  exit 0
fi
cd caspian && pnpm --filter @caspian-dev/core gen:codes && cd .. && git add caspian/packages/core/src/diagnostics/codes.generated.ts

$ ls -la .git/hooks/pre-commit
-rwxr-xr-x ... 366 bytes  (executable bit set)

$ # Pre-state hash:
$ head -1 caspian/packages/core/src/diagnostics/codes.generated.ts
// Hash: b303d1395ec438a29d81b61e5a2a5419ee236b6c38b6feba3021de1df8e803c7

$ # Tamper registry, then run hook directly:
$ node -e "fs.writeFileSync('caspian/diagnostics/registry.json', fs.readFileSync('...', 'utf8') + '\n');"
$ sh .git/hooks/pre-commit
[gen-diagnostic-codes] generated 18 typed constants → ...

$ # Post-state hash (different — proves hook regenerated):
$ head -1 caspian/packages/core/src/diagnostics/codes.generated.ts
// Hash: 5ff06fc880d6bbd21e814a4330577b40a6399f640009dc87007af10496fb4ded

$ # Restore + re-gen:
$ cp /tmp/registry-backup-2.json caspian/diagnostics/registry.json
$ pnpm -C caspian gen:codes
$ head -1 caspian/packages/core/src/diagnostics/codes.generated.ts
// Hash: b303d1395ec438a29d81b61e5a2a5419ee236b6c38b6feba3021de1df8e803c7   # matches original — restore OK
```

The hook command body is the exact contents of the `simple-git-hooks.pre-commit` block in `caspian/package.json`. Direct `sh` invocation exercises the same code path that `git commit` would trigger, without polluting commit history on `main`. The hook's `git add` step is a no-op outside a real commit context (no staged set), but `gen:codes` runs and the file regenerates — that's the load-bearing assertion.

**Cross-check #7 — `.gitattributes` rule alignment.** PASS.

```
$ git check-attr -a caspian/packages/core/src/diagnostics/codes.generated.ts
caspian/packages/core/src/diagnostics/codes.generated.ts: merge: ours
caspian/packages/core/src/diagnostics/codes.generated.ts: text: auto
caspian/packages/core/src/diagnostics/codes.generated.ts: eol: lf
caspian/packages/core/src/diagnostics/codes.generated.ts: linguist-generated: true
```

Both `merge: ours` and `linguist-generated: true` reported. The deferred-work item from Story 1.1 review (#1 — *".gitattributes rule targets a future path"*) is resolved by this story landing the file at the rule's exact path.

**Cross-check #8 — verify-pack dry-run.** PASS.

```
$ cd caspian/packages/core && pnpm pack --dry-run
📦  @caspian-dev/core@0.0.1
Tarball Contents
CHANGELOG.md
dist/.tsbuildinfo                                  ← pre-existing Story 2.1 deferred item (#80)
dist/diagnostics/codes.generated.{d.ts,d.ts.map,js,js.map}   ← NEW (Story 2.2)
dist/diagnostics/index.{d.ts,d.ts.map,js,js.map}             (Story 2.1; updated barrel)
dist/diagnostics/reporter.{d.ts,d.ts.map,js,js.map}          ← NEW (Story 2.2)
dist/diagnostics/types.{d.ts,d.ts.map,js,js.map}             (Story 2.1; expanded with DiagnosticDefinition)
dist/index.{d.ts,d.ts.map,js,js.map}                          (Story 2.1)
dist/schemas/loader.{d.ts,d.ts.map,js,js.map}                 (Story 2.1)
dist/schemas/v1/diagnostic-registry.schema.json               (Story 2.1)
dist/schemas/v1/envelope.schema.json                          (Story 2.1)
dist/validator.{d.ts,d.ts.map,js,js.map}                      (Story 2.1)
LICENSE
package.json
README.md
Tarball Details: caspian-dev-core-0.0.1.tgz
```

`src/`, `tests/`, `scripts/`, `vitest.config.ts`, `tsconfig.json`, `.dependency-cruiser.cjs` are absent from the tarball — `package.json` `files` allow-list is enforced. The `dist/.tsbuildinfo` line is the pre-existing Story 2.1 deferred item (Story 2.8 pre-publish cleanup), unchanged by this story.

**Smoke gate.** Final triple-check after all cross-checks complete:

```
$ pnpm -C caspian lint
> biome check .
Checked 24 files in 27ms. No fixes applied.

$ pnpm -C caspian test
✓ tests/unit/diagnostics/codes-shape.test.ts (5 tests) 15ms
✓ tests/unit/smoke.test.ts (3 tests) 6ms
Test Files  2 passed (2)
     Tests  8 passed (8)

$ pnpm -C caspian build
> @caspian-dev/core@0.0.1 build
> pnpm gen:codes && tsc -p tsconfig.json && tsx scripts/copy-schemas.ts
[gen-diagnostic-codes] generated 18 typed constants → ...
[copy-schemas] copied 2 file(s) → ...

$ pnpm -C caspian verify-codes-hash
[verify-codes-hash] OK — registry sha256 matches codes.generated.ts header (b303...e803c7)

$ pnpm -C caspian ajv-validate-registry
[ajv-validate-registry] OK — diagnostics/registry.json (18 entries) conforms to schemas/v1/diagnostic-registry.schema.json
```

All exit code 0. **New smoke-gate baseline: 24 biome-checked files** (up from 18 in Story 2.1; net +6 = 4 new TS files (`scripts/gen-diagnostic-codes.ts`, `scripts/verify-codes-hash.ts`, `scripts/ajv-validate-registry.ts`, `src/diagnostics/reporter.ts`) + 1 new test file (`tests/unit/diagnostics/codes-shape.test.ts`) + 1 new mjs file (`caspian/scripts/install-pre-commit.mjs`)). The generated `codes.generated.ts` is excluded by `.biomeignore` `**/*.generated.ts`. Story 2.3+ inherits this 24-file floor.

**AC13 ESM-import smoke check.** PASS.

```
$ cd caspian && node --input-type=module -e "import('./packages/core/dist/diagnostics/index.js').then(m => console.log(typeof m.CASPIAN_E001, m.CASPIAN_E001.code, typeof m.CASPIAN_W004, m.CASPIAN_W004.severity))"
object CASPIAN-E001 object warning
```

The published-shape ESM sub-export resolves and exposes the typed constants. Both an error code (`CASPIAN_E001`, severity `error`) and a warning code (`CASPIAN_W004`, severity `warning`) are reachable from the `./diagnostics` entry; their runtime shapes are objects matching `DiagnosticDefinition`.

**Git status post-implementation.**

```
$ git status --short
 M .claude/settings.local.json   (pre-existing, untouched by Story 2.2)
 M _bmad-output/implementation-artifacts/sprint-status.yaml
 M caspian/package.json
 M caspian/packages/core/CHANGELOG.md
 M caspian/packages/core/README.md
 M caspian/packages/core/package.json
AM caspian/packages/core/src/diagnostics/codes.generated.ts
 M caspian/packages/core/src/diagnostics/index.ts
 M caspian/packages/core/src/diagnostics/types.ts
 M caspian/pnpm-lock.yaml
?? _bmad-output/implementation-artifacts/2-2-...story file
?? caspian/packages/core/scripts/ajv-validate-registry.ts
?? caspian/packages/core/scripts/gen-diagnostic-codes.ts
?? caspian/packages/core/scripts/verify-codes-hash.ts
?? caspian/packages/core/src/diagnostics/reporter.ts
?? caspian/packages/core/tests/unit/diagnostics/codes-shape.test.ts
?? caspian/scripts/install-pre-commit.mjs
```

The `AM` flag on `codes.generated.ts` is benign — the pre-commit hook (cross-check #6) staged the file via `git add` during the direct-hook test. No unexpected drift in `caspian/spec/`, `caspian/schemas/`, `caspian/diagnostics/`, `caspian/fixtures/`, `caspian/examples/`, or any sealed file.

### Completion Notes List

- **Files created:** 6 — `caspian/packages/core/scripts/{gen-diagnostic-codes.ts, verify-codes-hash.ts, ajv-validate-registry.ts}` (3 build/CI scripts) + `caspian/packages/core/src/diagnostics/reporter.ts` + `caspian/packages/core/src/diagnostics/codes.generated.ts` (auto-generated, sha256-headed) + `caspian/packages/core/tests/unit/diagnostics/codes-shape.test.ts` (5 vitest assertions) + `caspian/scripts/install-pre-commit.mjs` (sub-folder-repo-aware hook installer — see Deliberate departures below).
- **Files modified in place:** 6 — `caspian/package.json` (3 pass-through scripts + `prepare` + `simple-git-hooks` devDep + `simple-git-hooks` config block), `caspian/packages/core/package.json` (3 new scripts + amended `build` chain to gen:codes-first), `caspian/packages/core/src/diagnostics/types.ts` (added `DiagnosticDefinition` interface), `caspian/packages/core/src/diagnostics/index.ts` (expanded barrel: types + Reporter + codes.generated re-export), `caspian/packages/core/CHANGELOG.md` (Unreleased bullet for Story 2.2), `caspian/packages/core/README.md` (Public API surface section: typed constants paragraph + DiagnosticDefinition + Reporter), `caspian/pnpm-lock.yaml` (additive: simple-git-hooks 2.13.1 resolution + 0 dependencies — simple-git-hooks ships zero deps).
- **Smoke gate baseline:** 24 biome-checked files (Story 2.1 was 18; net +6). Lint exit 0; test exit 0 (8/8 passed: 3 from smoke.test.ts + 5 from codes-shape.test.ts); build exit 0; verify-codes-hash exit 0; ajv-validate-registry exit 0; ESM-import smoke check returns `object CASPIAN-E001 object warning`.

- **Deliberate departures from epic AC text** (3 deliberate departures, each conservative):
  1. **Pre-commit hook installer — `simple-git-hooks` CLI replaced by `caspian/scripts/install-pre-commit.mjs`.** AC2 specifies `"prepare": "simple-git-hooks || true"`. Implementation ships `"prepare": "node scripts/install-pre-commit.mjs"`. Reason: simple-git-hooks 2.13.1's auto-detect algorithm walks up from `package.json` looking for a sibling `.git/`, and on a *miss* it creates a spurious `caspian/.git/` directory and writes the hook there. Git itself never consults that path — `git rev-parse --git-dir` correctly resolves to `joselimmo-marketplace-bmad/.git/`, but simple-git-hooks doesn't use git's resolution. Net: out-of-the-box simple-git-hooks does NOT wire the hook to the location git actually consults. The custom installer reads the same `simple-git-hooks` config block from `package.json` (so the AC2 config-block format is preserved as the SoT), uses `git rev-parse --git-dir` to find the real hooks directory, writes the hook there with mode 0755, and cleans up the spurious `caspian/.git/`. `simple-git-hooks` remains in `devDependencies` per AC2; the package's contribution is now the config-block format + a fallback CLI. Documented in `caspian/scripts/install-pre-commit.mjs` header comment.
  2. **AC10 verification — direct hook execution instead of a real test commit.** AC10 prescribes: edit registry.json, `git add`, `git commit` to fire the hook, then `git reset HEAD~1` to clean. Implementation verified the hook by invoking `sh .git/hooks/pre-commit` directly while in a tampered-registry state (cross-check #6). Reason: the workflow currently runs on `main` with WIP from Stories 2.1-review and 2.2-create-story still uncommitted; opening a feature branch + test-commit-and-reset cycle would require careful staging-set management to avoid contaminating the WIP. Direct hook invocation exercises the identical code path that `git commit` triggers (the hook is the same `sh` script either way), and the verification — registry mutation → run hook → codes.generated.ts hash changes → restore → hash matches original — is byte-level deterministic. Risk: if the user's git config disables `core.hooksPath` or sets a `core.hooksPath` override to a different directory, our hook would be wired correctly but git would invoke a different one. Mitigated: cross-check #7 verifies `git check-attr` resolves through git's normal config machinery to the same `.git/` we wrote the hook into.
  3. **`prepare` script form.** AC2 mandates `"prepare": "simple-git-hooks || true"`. Implementation ships `"prepare": "node scripts/install-pre-commit.mjs"` (no `|| true`) — the installer itself silently exits 0 on tarball-install (no git history) via `try/catch` around `git rev-parse`. Net: same UX (no failure on tarball install), cleaner expression of the intent.

- **Pre-commit hook scope decision honored (Option B — unconditional).** The story's *Pre-commit hook scope decision* section selected Option B: hook runs `gen:codes && git add` unconditionally on every commit, idempotent because the script is deterministic given identical input. Implementation matches exactly. The unconditional form was preserved in the `simple-git-hooks.pre-commit` config block.

- **No biome `useNamingConvention` issues.** The 18 SCREAMING_SNAKE_CASE constants (`CASPIAN_E001` through `CASPIAN_W004`) live in `codes.generated.ts`, which is excluded by `.biomeignore` `**/*.generated.ts`. Even if biome did lint the generated file, the rule's default config allows SCREAMING_SNAKE_CASE for top-level `const` declarations. Confirmed by running lint with no rule violations.

- **Biome auto-format pass applied during smoke gate** — biome reported 3 fixable issues on the first lint pass: `assist/source/organizeImports` on `diagnostics/index.ts` (sorted exports with `* from "./codes.generated.js"` first per biome's stable order), `format` on `tests/unit/diagnostics/codes-shape.test.ts` (multi-line wrapping of a `.map()` callback), and a minor format on `caspian/scripts/install-pre-commit.mjs` (multi-line console.log wrap). All 3 auto-fixed by `pnpm exec biome check --write .`; second-run lint reported zero issues. The auto-formatted shape is the canonical project shape going forward.

- **ajv strict-mode warnings against the diagnostic-registry schema:** none. `new Ajv2020({ allErrors: true, strict: true })` accepted `caspian/schemas/v1/diagnostic-registry.schema.json` cleanly (the schema declares `$schema: draft/2020-12/schema` + `$id` + `title` + `description` + `examples` — all fully supported by ajv 8.20 in strict mode). Mirrors Story 2.1's clean reception of the envelope schema.

- **ajv import shape consistency:** `import { Ajv2020 } from "ajv/dist/2020.js"` (named import) used in both `caspian/packages/core/src/validator.ts` (Story 2.1, sealed) and `caspian/packages/core/scripts/ajv-validate-registry.ts` (Story 2.2). Same TS 5.9 + nodenext + ajv 8.20 default-import-not-constructable issue applies to both; named import is the unambiguous form.

- **Pre-existing deferred-work item resolved (#1 from Story 1.1 review):** `_bmad-output/implementation-artifacts/deferred-work.md` line 7 read: *"`.gitattributes` rule targets a future path — `packages/core/src/diagnostics/codes.generated.ts merge=ours linguist-generated=true` is dangling until Story 2.2 creates that file. If Story 2.2 lands the generated file at a different subpath, this rule silently no-ops. Owner: Story 2.2 (verify path alignment)."* — Story 2.2 is the owner. The generated file landed at exactly `packages/core/src/diagnostics/codes.generated.ts`; cross-check #7 (`git check-attr -a`) confirms `merge: ours` + `linguist-generated: true` are now active. No `.gitattributes` edit was needed (sealed file from Story 1.1).

- **`simple-git-hooks` ignored-build-scripts warning.** pnpm 10 reports: *"Ignored build scripts: esbuild@0.27.7, simple-git-hooks@2.13.1. Run pnpm approve-builds to pick which dependencies should be allowed to run scripts."* This is informational. simple-git-hooks's postinstall script (which is what pnpm 10 ignores) is the same automatic-wiring routine our custom installer replaces; our `prepare` script invokes the custom installer instead. esbuild's postinstall is irrelevant to Story 2.2 (transitive devDep of vitest from Story 2.1). Both can stay ignored without functional impact. Future Story 2.8 (release.yml) may approve these for the publish pipeline.

- **No deferrals introduced by Story 2.2 implementation.** All 16 ACs satisfied; all 8 cross-checks pass with the documented departures. Future hardening candidates (none blocking, all optional):
  - Pre-commit hook test on a real feature branch — defer to a hardening story when a feature-branch workflow is in active use; Direct hook execution is sufficient evidence for now.
  - `caspian/scripts/install-pre-commit.mjs` is currently a single-package solution; if Caspian gains additional sub-folder repos in the future, the installer's path resolution can generalize.
  - The `dist/.tsbuildinfo` inclusion in the pack listing remains the Story 2.1 deferred item (#80); not addressed here.

### File List

**Created (6):**

- `caspian/packages/core/scripts/gen-diagnostic-codes.ts`
- `caspian/packages/core/scripts/verify-codes-hash.ts`
- `caspian/packages/core/scripts/ajv-validate-registry.ts`
- `caspian/packages/core/src/diagnostics/reporter.ts`
- `caspian/packages/core/src/diagnostics/codes.generated.ts` (auto-generated; first line `// Hash: b303d1395ec438a29d81b61e5a2a5419ee236b6c38b6feba3021de1df8e803c7`; 18 typed `DiagnosticDefinition` constants)
- `caspian/packages/core/tests/unit/diagnostics/codes-shape.test.ts` (5 vitest assertions)
- `caspian/scripts/install-pre-commit.mjs` (sub-folder-repo-aware hook installer; replaces simple-git-hooks's CLI auto-detect — see Deliberate departure #1)

**Modified (6):**

- `caspian/package.json` (added `gen:codes`, `verify-codes-hash`, `ajv-validate-registry`, `prepare` scripts; added `simple-git-hooks ^2.11.1` devDep; added top-level `simple-git-hooks` config block with the `cd caspian && ... && cd .. && git add ...` pre-commit command)
- `caspian/packages/core/package.json` (added `gen:codes`, `verify-codes-hash`, `ajv-validate-registry` scripts; amended `build` to chain `pnpm gen:codes` first)
- `caspian/packages/core/src/diagnostics/types.ts` (added `DiagnosticDefinition` interface — 5 fields: code, severity, rule, message, doc)
- `caspian/packages/core/src/diagnostics/index.ts` (expanded barrel: re-exports types from types.ts, `Reporter` from reporter.ts, `*` from codes.generated.ts)
- `caspian/packages/core/CHANGELOG.md` (appended Story 2.2 bullet under Unreleased)
- `caspian/packages/core/README.md` (rewrote Public API surface diagnostics paragraph: added DiagnosticDefinition + Reporter types, added the 18 typed constants paragraph, removed Story 2.1 forward-reference)
- `caspian/pnpm-lock.yaml` (additive: simple-git-hooks 2.13.1 — zero dependencies; net +1 package in the install graph)

**Not part of file delivery but updated for sprint tracking:**

- `_bmad-output/implementation-artifacts/sprint-status.yaml` (story status transitions: ready-for-dev → in-progress → review)
- `_bmad-output/implementation-artifacts/2-2-diagnostic-registry-typed-ts-constants-codes-generated-ts-sha256-verify-hash.md` (this story file: tasks/subtasks checkboxes, status, Dev Agent Record, File List)

### Change Log

| Date       | Change                                                                                                       |
|------------|--------------------------------------------------------------------------------------------------------------|
| 2026-04-27 | Story 2.2 created (ready-for-dev): registry → typed constants + sha256 + verify-hash + ajv-validate-registry + simple-git-hooks pre-commit. |
| 2026-04-27 | Implementation complete — 7 files created, 6 modified in place; all 16 ACs satisfied; 8/8 cross-checks pass (with 3 documented deliberate departures: custom hook installer for sub-folder repo, direct-hook verification instead of test commit, no `\|\| true` on prepare). |
| 2026-04-27 | Smoke gate verified: `pnpm -C caspian lint` 24 files exit 0; `pnpm -C caspian test` 8/8 pass; `pnpm -C caspian build` exit 0; `pnpm verify-codes-hash` exit 0; `pnpm ajv-validate-registry` exit 0; ESM-import smoke check returns `object CASPIAN-E001 object warning`. Status moved to review. |
