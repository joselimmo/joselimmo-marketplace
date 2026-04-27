# Story 2.1: `@caspian-dev/core` skeleton + envelope schema integration (loader.ts)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a CLI implementer (or future alternative-host implementer of Caspian validation),
I want a vendor-neutral `@caspian-dev/core` package with a single canonical schema-loading entry point,
so that all validation layers share one bundled schema source and the single-source-of-truth invariant is mechanically enforced.

## Working Directory

All paths in this story resolve **inside `caspian/`** — the sub-monorepo that hosts the Caspian project under the surrounding `joselimmo-marketplace-bmad` repository. References like `packages/core/`, `schemas/v1/`, `biome.json` resolve to `caspian/packages/core/`, `caspian/schemas/v1/`, `caspian/biome.json`. Never create files outside `caspian/` (with the single exception of the sprint-status / story-file updates under `_bmad-output/implementation-artifacts/`).

`caspian/` already exists (Story 1.1) with the root scaffold: `package.json`, `pnpm-workspace.yaml` (`packages: ["packages/*"]`), `tsconfig.base.json`, `biome.json`, `.biomeignore`, `.gitattributes`, `.gitignore`, `.editorconfig`, `.npmrc`, `.nvmrc` (22.13), `.changeset/`, `LICENSE`, `LICENSE-CC-BY-4.0`, `README.md`. The `packages/` directory does **not** yet exist — this story creates it and lands the first sub-package `packages/core/`. The `packages/cli/` skeleton is **out of scope** here (Story 2.5).

This story also modifies one root file in place: `caspian/biome.json` (activate `noRestrictedImports` for `**/schemas/**` with the `loader.ts` allow-list — Verrou 2). All other Epic 1 outputs (`spec/`, `schemas/`, `diagnostics/`, `fixtures/`, `examples/`) are **untouched**.

## Background

This story opens **Epic 2: CLI Validator & CI Integration**. Epic 1 sealed the spec foundation (normative reference, vocabulary, envelope schema, diagnostic registry, fixtures, minimal-skill-adoption example, W004 reservation). Epic 2 builds the validator that **enforces** the spec: a vendor-neutral TypeScript validator runtime (`@caspian-dev/core`) consumed by an npm CLI (`@caspian-dev/cli`, binary `caspian`) that runs on any vanilla Node ≥22 machine without Claude Code installed.

Epic 2's implementation is sequenced so each story is independently reviewable:

1. **Story 2.1 (this story)** — `@caspian-dev/core` package skeleton + the schema-loading entry point (`loader.ts`) + the 3-verrou single-source-of-truth enforcement (`tsconfig` `rootDirs` + `biome` `noRestrictedImports` + sole `loader.ts` module). No validation logic ships yet; `validateFile()` is a callable public API stub returning `[]`.
2. **Story 2.2** — Diagnostic registry → typed TS constants (`codes.generated.ts`) with sha256 + verify-hash CI step + types colocation (`Diagnostic`, `Severity`, `ValidationResult`).
3. **Story 2.3** — Pipeline stages 1–3 (byte-level + frontmatter extraction + YAML parse) — fixture coverage for E001–E007.
4. **Story 2.4** — Pipeline stages 4–6 (envelope schema validation + namespace check + allow-list scan) — fixture coverage for E008–E014, W001–W004.
5. **Story 2.5** — `@caspian-dev/cli` package + walker + multi-file aggregation + human formatter.
6. **Story 2.6** — `--format=json` stable schema + golden snapshots + verify-pack.
7. **Story 2.7** — Conformance suite + 3-layer vendor-neutrality enforcement.
8. **Story 2.8** — npm publish with provenance + `examples/ci-integration/` + CI matrix.

Story 2.1's job is to **lock in the architectural verrou before any validation code is written**: once `loader.ts` is the sole reader of `schemas/v1/`, every subsequent stage author (Stories 2.3, 2.4, 2.7) is mechanically prevented from inlining a duplicate schema import. The 3-verrou (TypeScript `rootDirs` + biome `noRestrictedImports` + audit grep) is the architecture's response to the recurring brownfield disaster of "someone copy-pasted the schema into a second module and the two drifted silently". Establishing it on day one of Epic 2 (this story) is cheaper than retrofitting it after Story 2.3/2.4 land.

## Acceptance Criteria

**AC1.** `caspian/packages/core/package.json` declares the canonical package identity and shape:

  - `name = "@caspian-dev/core"` (scoped npm name, per Epic 1 retro AI-3 pivot from unscoped `caspian-core`).
  - `version = "0.0.1"` (pre-1.0 development series; per architecture E3 the first published version is `0.1.0` from Story 2.8 — until then the package is pre-published).
  - `description` is a concise one-liner: *"Vendor-neutral validator runtime for the Caspian Composable Agent Skill Protocol — pure validation logic, consumed by `@caspian-dev/cli`."*
  - `license = "Apache-2.0"`, `author = "Cyril Houillon"` (matches the root `caspian/package.json`).
  - `type = "module"` (ESM-only package).
  - `engines.node = ">=22.13"` (matches the root engine constraint locked by Epic 1 retro AI-2).
  - `exports` declares exactly `{ ".": "./dist/index.js", "./diagnostics": "./dist/diagnostics/index.js" }` (no other entrypoints in v1.0).
  - `main = "./dist/index.js"` and `types = "./dist/index.d.ts"` (Node.js compatibility for non-ESM consumers reading legacy fields; the `exports` map is authoritative).
  - `files` is a restrictive allow-list: `["dist/", "README.md", "CHANGELOG.md", "LICENSE"]` — `src/`, `tests/`, `scripts/`, `tsconfig.json`, `vitest.config.ts`, `.dependency-cruiser.cjs` are NOT published.
  - `publishConfig.access = "public"` (required for scoped packages on npm; without it `pnpm publish` errors on a scoped name).
  - `publishConfig.provenance = true` (per architecture E2; provenance OIDC publish is wired by Story 2.8 — declaring the intent here is harmless and forward-compatible).
  - `scripts` includes at minimum: `build`, `test`, `dev`, `copy-schemas`. Exact command bodies are specified in *Reference scripts* below.
  - `dependencies` declares exactly `{ "ajv": "^8.17.0" }` (the only runtime dep; no `js-yaml` here — Story 2.3 brings `yaml` v2.x).
  - `devDependencies` declares at minimum: `typescript ^5.7.0`, `vitest ^3.0.0`, `@types/node ^22.10.0`, `tsx ^4.19.0` (used to run TS scripts like `copy-schemas.ts` directly without a separate compile step).

**AC2.** `caspian/packages/core/LICENSE` is byte-identical to the unmodified Apache-2.0 text already used at `caspian/LICENSE` (and `caspian/schemas/LICENSE`, `caspian/diagnostics/LICENSE`, `caspian/fixtures/LICENSE`). Per-package re-declaration discipline (Story 1.1 AC2; architecture lines 749 / 181). Verify byte-equality with `cmp caspian/LICENSE caspian/packages/core/LICENSE` → exit 0.

**AC3.** `caspian/packages/core/README.md` exists with the following sections in order:

  1. **Title** — `# @caspian-dev/core`.
  2. **One-paragraph pitch** — describes the package as the vendor-neutral validation runtime, consumed by `@caspian-dev/cli` (Story 2.5+) and any future alternative host (LSP, CI ajv layer, runtime hook).
  3. **Status** — explicit "Pre-1.0 — public API is stabilizing across Epic 2; the first published version is `0.1.0` (Story 2.8). The semver promise applies from `1.0.0`."
  4. **Public API surface** — names the exports: `validateFile(path: string): Diagnostic[]` from the `.` entry; `Diagnostic`, `Severity`, `ValidationResult` types from `./diagnostics`. State explicitly that named exports only are used (no `export default`).
  5. **License** — Apache-2.0 (link to `./LICENSE`).

The README must NOT promise behaviors that ship in later stories (full validation pipeline, CLI binary, etc.); it documents the package's *current* surface and references "future stories" abstractly.

**AC4.** `caspian/packages/core/CHANGELOG.md` exists with a `## Unreleased` header and a single bullet documenting Story 2.1's establishment of the package skeleton:

```markdown
# @caspian-dev/core changelog

This file tracks `@caspian-dev/core` semver. Decoupled from spec-level
semver (`caspian/spec/CHANGELOG.md`, Story 5.2) and from the CLI semver
(`caspian/packages/cli/CHANGELOG.md`, Story 2.5).

## Unreleased

- Initial package skeleton: ESM `@caspian-dev/core` with the canonical
  schema-loading entry point (`loader.ts`), 3-verrou single-source-of-truth
  enforcement, ajv 2020-12 envelope schema registration, and stub
  `validateFile(path)` public API. Pipeline stages 1–6 land in Stories
  2.3–2.4.
```

The CHANGELOG file MUST exist now — even though no version is yet published — so that subsequent Epic 2 stories (2.2, 2.3, 2.4) have a stable file to append `## Unreleased` bullets to without recreating the header. The file is part of the npm-published `files` allow-list (AC1).

**AC5.** Verrou 1 — TypeScript ascent lockdown. `caspian/packages/core/tsconfig.json` extends `../../tsconfig.base.json` and declares:

  - `compilerOptions.rootDir = "./src"` (singular) — restricts source-file scope to `./src/`. Any source file outside `./src/` (e.g., relative ascent into `../../../schemas/`) raises a TypeScript compile error: `error TS6059: File '...' is not under 'rootDir'`.
  - `compilerOptions.outDir = "./dist"` — emit destination.
  - `compilerOptions.composite = true` (enables project-references; required for clean monorepo `tsc --build` semantics in Story 2.5+ when `packages/cli` references this package).
  - `compilerOptions.tsBuildInfoFile = "./dist/.tsbuildinfo"` (incremental build cache; gitignored per existing `caspian/.gitignore` line 4).
  - `include = ["src/**/*"]` — production source set.
  - `exclude = ["node_modules", "dist", "tests/**/*", "scripts/**/*", "vitest.config.ts"]` — keeps tests and scripts out of the npm-published build (vitest compiles its own files via vitest's TS transformer).

**Note on `rootDir` vs `rootDirs`:** the epic AC text and `architecture.md` line 725 both say `rootDirs: ["./src"]` (plural), but TypeScript's `rootDirs` is for *virtual directory unification* (e.g., merging `src/` with a `generated/` folder so they appear as one root) — it does NOT restrict source-file scope. The mechanism that **actually rejects** `import schema from '../../../schemas/v1/envelope.schema.json'` is the singular `rootDir: "./src"` setting. This story uses `rootDir` (singular) to honor the architectural intent — the dev MAY add `rootDirs: ["./src"]` alongside if the literal-text-of-AC reading is preferred for documentation clarity, but the load-bearing setting is the singular `rootDir`. (See *Dev Notes — Verrou 1 implementation hazard* for full reasoning.)

**AC6.** Verrou 2 — biome import lockdown. `caspian/biome.json` is modified in place (no separate `biome.json` per package) to activate the `noRestrictedImports` rule. The current state (line 32–37) has the rule level set to `"off"` with empty `paths`. Target state:

  - Rule level set to `"error"`.
  - `paths` declares an entry forbidding any import specifier matching the `**/schemas/**` glob pattern, with a custom message instructing the contributor to import via `packages/core/src/schemas/loader.ts` instead.
  - An `overrides` block at the root of `biome.json` exempts the single file `packages/core/src/schemas/loader.ts` from the rule (so `loader.ts` IS allowed to read from `**/schemas/**`).

The exact block (target state of `caspian/biome.json` lines 32–37 + new `overrides` block) is captured byte-faithfully in *Reference biome.json modifications* below.

**Verrou 2 implementation hazard:** biome's `noRestrictedImports` rule (per the deferred-work note from Story 1.1 review at line 8: *"`noDefaultExport` future conflict with config files — Lint rule with no `overrides` block will reject `vitest.config.ts`, `rollup.config.ts` ..."*) and biome's general API churn between minor versions means the exact rule-path / option-name MAY differ slightly from the form documented here. The dev MUST run `pnpm -C caspian lint` after the biome edit and confirm: (a) the lint passes on `loader.ts` (allowed), (b) the lint **fails** on a deliberately-introduced violation (e.g., temporarily add `import schema from '../../../schemas/v1/envelope.schema.json'` to `packages/core/src/index.ts`, verify lint reports the error, then remove the violation). If biome's installed version doesn't support glob patterns in `noRestrictedImports.paths`, fall back to a literal-path entry (`"../../../../schemas/v1/envelope.schema.json"` plus alternate ascent depths) and document the fallback in *Completion Notes*. Verrou 2 is the **lint-time enforcement layer**; Verrou 1 (TypeScript `rootDir`) is the **compile-time enforcement layer**; Verrou 3 (single-module audit) is the **CI-time enforcement layer** — all three must operate independently.

**AC7.** Verrou 3 — single loader module audit. `caspian/packages/core/src/schemas/loader.ts` is the sole file under `caspian/packages/core/src/` that references the string `envelope.schema`. Verify with the audit command:

```bash
grep -rn "envelope.schema" caspian/packages/core/src
```

The output MUST contain exactly **one** match, on a line in `caspian/packages/core/src/schemas/loader.ts` (the file's path-resolution code referencing `envelope.schema.json`). No other file in `caspian/packages/core/src/` may contain the string `envelope.schema` (no test fixtures, no comments referring to it, no second loader). The audit is recorded in *Debug Log References* as cross-check #3 (see *Cross-checks* below).

**AC8.** `caspian/packages/core/src/schemas/loader.ts` implements the dual-mode resolution:

  - The module exports a single named function `loadEnvelopeSchema(): Promise<object>` (or a synchronous variant — see *Dev Notes — Loader signature decision* below) that returns the parsed JSON object of `envelope.schema.json`.
  - **Production mode** (loader called from `dist/schemas/loader.js`): resolves `path.resolve(__dirname, '../schemas/v1/envelope.schema.json')` — relative path from `dist/schemas/loader.js` to `dist/schemas/v1/envelope.schema.json`, populated by `copy-schemas.ts` at build time.
  - **Dev mode fallback** (loader called from `src/schemas/loader.ts` running via vitest / `tsx` / `ts-node` before any `dist/` output exists): if the production-mode resolved path does NOT exist on disk, fall back to a path resolved relative to `import.meta.url` that points at the repo-root `caspian/schemas/v1/envelope.schema.json`.
  - Under ESM, `__dirname` is not a built-in. The standard pattern (and the one the dev MUST use) is:

```ts
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
```

  - The function MUST cache its result (lazy initialization — load once, return same parsed object on subsequent calls). The cache lives at module scope.
  - The function MUST emit a clear, actionable error if neither path resolves (e.g., dev mode fallback fails because the schemas directory was relocated). Format: `Error: cannot locate envelope.schema.json — checked <prod-path> and <dev-path>`.

**AC9.** ajv Draft 2020-12 conformance. A new module `caspian/packages/core/src/validator.ts` exists that:

  - Imports ajv via the Draft 2020-12 entrypoint exactly: `import Ajv2020 from 'ajv/dist/2020.js';` (NOT `import Ajv from 'ajv';` — the default ajv export is Draft-07). The `.js` extension on the import is required under ESM `nodenext` resolution.
  - Lazily initializes a singleton `Ajv2020` instance with `{ allErrors: true, strict: true }` options (architecture A2/A5 + style consistency with future ajv-validate-registry CI step).
  - Calls `loadEnvelopeSchema()` from `./schemas/loader.js` (note `.js` extension — required under ESM `nodenext` resolution even though the source is `.ts`) and registers the schema via `ajv.addSchema(schema, "https://caspian.dev/schemas/v1/envelope.schema.json")`. The schema's `$id` is the canonical key; if `addSchema()` is called without an explicit second argument, ajv reads the `$id` from the schema body — both forms are acceptable; the explicit form is documented for future-self readability.
  - Exports a named `getEnvelopeValidator(): ValidateFunction` function that returns ajv's compiled validator for the envelope schema. Story 2.4 (envelope validation stage) will consume this function; Story 2.1 ships only the function shape and verifies the validator compiles successfully (i.e., the schema body is well-formed and ajv accepts it without throwing at compile time).

**AC10.** Public API surface. `caspian/packages/core/src/index.ts` is the barrel that defines the `.` entry point. It exports exactly:

  - `validateFile(path: string): Promise<Diagnostic[]>` — the canonical validation entry point. **Story 2.1 implementation:** a stub that:
    1. Reads the file at `path` (verifying the path exists; throws if not — same UX as the future production version).
    2. Calls `getEnvelopeValidator()` once to verify the validator is wired (no-op assertion that the ajv chain is healthy).
    3. Returns an empty array `[]` (always-array contract per epic AC: "always returns array; empty = valid"). The pipeline stages that produce real diagnostics land in Stories 2.3 and 2.4.
  - **Named exports only** — no `export default` anywhere in the package (biome `noDefaultExport` rule is already active per Story 1.1; the rule will catch any accidental default export).

The signature uses `Promise<Diagnostic[]>` (asynchronous) rather than `Diagnostic[]` (synchronous) as the epic AC literally states, because:
  - File reading is asynchronous in modern Node.js (`fs/promises`).
  - The future pipeline (Story 2.3+) will need async I/O for byte-level encoding sniff.
  - Locking the public surface as `Promise<Diagnostic[]>` from day one prevents a breaking-change refactor in Story 2.3.

This is a **deliberate departure from the literal epic AC wording** (which says `Diagnostic[]`). The dev MUST keep the deliberate departure documented in `packages/core/README.md` (AC3.4) and in *Completion Notes — Deliberate departures from epic AC text*. The architecture allows this kind of clarification at first-implementation time (architecture B4 uses the phrase "defined during first implementation story"; the same flexibility applies here).

**AC11.** `caspian/packages/core/src/diagnostics/types.ts` exists with the minimal type set Story 2.1 needs to compile its public API:

  - `export type Severity = "error" | "warning";` — discriminating union, no `info` or `hint` levels (architecture C2; epics Story 2.2 AC for `Severity`).
  - `export interface Diagnostic { code: string; severity: Severity; line: number; field?: string; message: string; }` — minimal shape. Story 2.2 will *expand* this interface (e.g., adding `doc: string` per registry, adding `column?: number`, etc.); Story 2.1 ships the smallest superset that allows the `validateFile` signature to compile.
  - `export interface ValidationResult { file: string; valid: boolean; diagnostics: Diagnostic[]; }` — placeholder shape consumed by future multi-file aggregation (Story 2.5 walker output). Defined here for forward-compatibility; not used by Story 2.1's stub.

`caspian/packages/core/src/diagnostics/index.ts` exists as the barrel for the `./diagnostics` sub-export. Story 2.1 implementation: re-exports from `./types.js`:

```ts
export type { Severity, Diagnostic, ValidationResult } from "./types.js";
```

Story 2.2 will expand this barrel with the typed code constants (`CASPIAN_E001`, etc.) — Story 2.1 ships only the types so that `import { Diagnostic } from "@caspian-dev/core/diagnostics"` already resolves correctly today.

**AC12.** Build-time schema bundling. `caspian/packages/core/scripts/copy-schemas.ts` exists and:

  - Reads from `caspian/schemas/v1/*.json` (resolved via `import.meta.url` — never `process.cwd()`, per architecture line 845).
  - Copies all matching `.json` files into `caspian/packages/core/dist/schemas/v1/` (creates the destination directory if absent).
  - Is invoked by the `build` script in `package.json`:
    - `"build": "tsc -p tsconfig.json && tsx scripts/copy-schemas.ts"`
    - Order matters: `tsc` first (produces `dist/schemas/loader.js`), then `copy-schemas.ts` (populates `dist/schemas/v1/*.json` next to the loader).
  - The script supports both `pnpm --filter @caspian-dev/core build` (run from repo root) and `pnpm build` (run from `caspian/packages/core/`). Path resolution via `import.meta.url` makes both invocation contexts work identically.
  - Logs to stdout the count of files copied and the destination path (one line of human-readable confirmation; the line is fine in a CI log and is not a load-bearing contract).

The script does NOT need to be defensive against arbitrary user paths; it operates on a fixed layout and may panic-throw if the source schemas are missing.

**AC13.** Test infrastructure. `caspian/packages/core/vitest.config.ts` exists and:

  - Resolves the test root and any path constants via `import.meta.url` — never `process.cwd()` (architecture line 845; epic AC at line 746).
  - Sets `test.include = ["tests/**/*.test.ts"]` (matches both `tests/unit/` and `tests/integration/` per architecture lines 650–656).
  - Sets `test.passWithNoTests = true` (Story 2.1 ships no tests yet — Story 2.3+ adds the unit suite; without this flag, `pnpm test` exits non-zero on an empty test set, breaking CI).

`caspian/packages/core/tests/helpers/paths.ts` exists and exports:

  - `REPO_ROOT: string` — absolute path to `caspian/` (the sub-monorepo root).
  - `FIXTURES_DIR: string` — `${REPO_ROOT}/fixtures/` (Story 1.6 deliverable).
  - `SCHEMAS_DIR: string` — `${REPO_ROOT}/schemas/` (Story 1.4 / 1.5 deliverable).

All three constants resolve via `import.meta.url` — never `process.cwd()`. The cwd-stability invariant is the cross-cutting test-infra contract every Epic 2 + Epic 4 story will inherit; getting it wrong here propagates failures through every downstream story. Implementation pattern:

```ts
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
// here = caspian/packages/core/tests/helpers/
export const REPO_ROOT = path.resolve(here, '../../../..');
export const FIXTURES_DIR = path.join(REPO_ROOT, 'fixtures');
export const SCHEMAS_DIR = path.join(REPO_ROOT, 'schemas');
```

The `tests/` directory may otherwise be empty in Story 2.1 (one trivial `.gitkeep` in `tests/unit/` is acceptable to keep the directory in git — vitest doesn't require any actual test files thanks to `passWithNoTests`). Adding a placeholder smoke test like `tests/unit/smoke.test.ts` containing `it('package compiles and imports cleanly', () => { expect(true).toBe(true); })` is RECOMMENDED (so the test runner is exercised at least once) but not required by AC.

**AC14.** Vendor-neutrality at the source level. `caspian/packages/core/package.json` MUST NOT declare any dependency whose name matches `@anthropic-ai/*` or `@claude/*`. `caspian/packages/core/src/**/*.ts` MUST NOT contain any import statement whose module specifier matches `@anthropic-ai/*` or `@claude/*`. Verify with:

```bash
grep -rEn "@(anthropic-ai|claude)/" caspian/packages/core/package.json caspian/packages/core/src/
# Expected output: empty (exit 1 from grep, which is the success state for a "no match" check)
```

This contract is also enforced at the lockfile level by Story 2.7's CI step (per architecture lines 717–719); Story 2.1's job is to ship a clean source tree that doesn't violate the contract from day one.

**AC15.** `pnpm install` from `caspian/` succeeds and resolves `@caspian-dev/core` as a workspace member. Verify with:

```bash
pnpm -C caspian list --filter @caspian-dev/core --depth 0
# Expected: shows the package + its dependencies (ajv, devDeps).
```

The pre-existing `caspian/pnpm-lock.yaml` will be updated to include the new package's resolution. The lockfile diff MUST be additive (new entries for ajv, vitest, typescript, etc.; no resolution changes for previously-locked packages such as biome / changesets).

**AC16.** Smoke-level verification end-to-end:

  - `pnpm -C caspian lint` exits `0`. Biome scope grows from the Story 1.5 / 1.6 / 1.7 / 1.8 baseline of **7 files** to a new baseline that includes the new `.ts` files under `packages/core/src/` plus `packages/core/package.json`, `packages/core/tsconfig.json`, `packages/core/vitest.config.ts`, `packages/core/scripts/copy-schemas.ts`, `packages/core/tests/helpers/paths.ts`. The exact post-Story-2.1 file count is documented in *Completion Notes* and becomes the new floor for Story 2.2+ smoke gates. Document the count by capturing the trailing line *Checked N files in <X>ms.* in *Debug Log References*.
  - `pnpm -C caspian build` exits `0`. Output: `caspian/packages/core/dist/` exists with `index.js`, `validator.js`, `schemas/loader.js`, `schemas/v1/envelope.schema.json`, `schemas/v1/diagnostic-registry.schema.json`, `diagnostics/types.js`, `diagnostics/index.js`, plus `.d.ts` siblings.
  - `pnpm -C caspian test` exits `0`. With `passWithNoTests = true`, vitest reports a passing run with zero test files, OR if the optional smoke test was added, reports `1 passed`.
  - `pnpm -C caspian/packages/core exec node --input-type=module -e "import('./dist/index.js').then(m => console.log(typeof m.validateFile))"` prints `function` and exits `0` — proves the published-shape ESM entry resolves and the public API is callable. (This is a manual smoke check, not a vitest assertion; record the output in *Debug Log References*.)

**AC17.** `pnpm -C caspian` invariants from prior stories are preserved:

  - `caspian/spec/`, `caspian/schemas/`, `caspian/diagnostics/`, `caspian/fixtures/`, `caspian/examples/` are NOT modified (this story is purely additive under `packages/core/` plus one in-place edit of `caspian/biome.json`).
  - `caspian/.changeset/`, `caspian/.gitattributes`, `caspian/.editorconfig`, `caspian/.gitignore`, `caspian/.npmrc`, `caspian/.nvmrc`, `caspian/LICENSE`, `caspian/LICENSE-CC-BY-4.0`, `caspian/README.md`, `caspian/tsconfig.base.json`, `caspian/.biomeignore`, `caspian/pnpm-workspace.yaml` are NOT modified.
  - `caspian/package.json` is NOT modified (the new package's scripts run via `pnpm --filter @caspian-dev/core <script>` or `pnpm -C caspian/packages/core <script>`; the root-level scripts (`lint`, `test`, `build`, `release`) already iterate via `pnpm -r --if-present` and pick up the new package automatically — confirm by reviewing the existing root scripts at `caspian/package.json` lines 14–18).

  Verify with `git status caspian/` after implementation: only `caspian/biome.json` (modified) + `caspian/pnpm-lock.yaml` (modified) + new files under `caspian/packages/core/` should appear.

**AC18.** Manual cross-checks recorded in *Debug Log References*:

  - **Cross-check #1 — Verrou 1 negative test.** Temporarily add `import schemaTest from '../../../schemas/v1/envelope.schema.json';` to `packages/core/src/index.ts`. Run `pnpm --filter @caspian-dev/core build`. Verify TypeScript reports an error: `error TS6059: File '...envelope.schema.json' is not under 'rootDir'`. Remove the test import. Document the exact error message in the debug log.
  - **Cross-check #2 — Verrou 2 negative test.** Temporarily add `import schemaTest from '../../../schemas/v1/envelope.schema.json';` to `packages/core/src/index.ts` (assuming Verrou 1 doesn't trip first; if it does, instead add the import to a freshly-created `packages/core/src/schemas/sneaky.ts` which IS under rootDir but is NOT the allow-listed `loader.ts`). Run `pnpm -C caspian lint`. Verify biome reports the `noRestrictedImports` violation pointing at `**/schemas/**`. Remove the test import / file.
  - **Cross-check #3 — Verrou 3 audit.** Run `grep -rn "envelope.schema" caspian/packages/core/src/`. Confirm exactly **one** match in `loader.ts`. Record the full grep output in the debug log.
  - **Cross-check #4 — ajv 2020-12 import shape.** Run `pnpm -C caspian/packages/core exec node --input-type=module -e "import Ajv2020 from 'ajv/dist/2020.js'; const ajv = new Ajv2020({ strict: true }); console.log(typeof ajv.compile);"` from repo root. Output: `function`. This proves the Draft 2020-12 entrypoint is reachable under the package's ESM resolution.
  - **Cross-check #5 — Loader dev-mode fallback.** Before running `pnpm build` (so `dist/` is empty), invoke `loadEnvelopeSchema()` from a one-off TS script via `tsx`. Confirm the function returns a JSON object whose `$id` equals `https://caspian.dev/schemas/v1/envelope.schema.json` (matching the actual Story 1.4 schema). Record the assertion in the debug log.
  - **Cross-check #6 — Loader production-mode resolution.** Run `pnpm build`. Then invoke `node --input-type=module -e "import { loadEnvelopeSchema } from './packages/core/dist/schemas/loader.js'; const s = await loadEnvelopeSchema(); console.log(s.\$id);"` from `caspian/`. Confirm the `$id` matches. This proves the production-mode `__dirname`-based resolution works against the bundled dist output.
  - **Cross-check #7 — Vendor-neutrality grep.** Run `grep -rEn "@(anthropic-ai|claude)/" caspian/packages/core/package.json caspian/packages/core/src/`. Confirm zero matches.
  - **Cross-check #8 — Lockfile diff.** Run `git diff caspian/pnpm-lock.yaml | grep -E "^[+-]" | grep -v "^[+-]{3}"` and visually verify that the diff is purely **additive** (new dep entries) with no resolution changes for biome / @changesets/cli / their transitive deps. Record any unexpected non-additive change in *Completion Notes* as a deferral.

## Tasks / Subtasks

- [x] **Task 1 — Create `caspian/packages/core/` scaffolding** (AC: #1, #2, #3, #4, #14, #17)
  - [x] Create the directory tree: `caspian/packages/core/{src/{schemas,diagnostics},tests/{helpers,unit,integration},scripts}`. Use `mkdir -p` so re-running is idempotent.
  - [x] Author `caspian/packages/core/package.json` from the *Reference package.json* model below. Field order matches the model exactly (biome's JSON formatter will normalize; lock the model first then run lint).
  - [x] Copy `caspian/LICENSE` → `caspian/packages/core/LICENSE` byte-faithfully (`cp caspian/LICENSE caspian/packages/core/LICENSE`). Verify with `cmp`.
  - [x] Author `caspian/packages/core/README.md` from the *Reference README.md* model.
  - [x] Author `caspian/packages/core/CHANGELOG.md` from the *Reference CHANGELOG.md* model.
  - [x] Run `pnpm -C caspian install` to add the new workspace member to the lockfile. Inspect the `pnpm-lock.yaml` diff and confirm only additive changes.

- [x] **Task 2 — TypeScript baseline (Verrou 1)** (AC: #5, #18 cross-check #1)
  - [x] Author `caspian/packages/core/tsconfig.json` from the *Reference tsconfig.json* model.
  - [x] Run `pnpm --filter @caspian-dev/core exec tsc --noEmit` (dry-run compile against the in-progress `src/` tree) — at this point `src/` is empty so tsc reports no files; that's expected. The check verifies tsconfig itself is well-formed.
  - [x] Defer Cross-check #1 (negative test) to Task 8 — it requires the full `src/` tree to be in place first.

- [x] **Task 3 — biome `noRestrictedImports` activation (Verrou 2)** (AC: #6, #18 cross-check #2)
  - [x] Open `caspian/biome.json`. Replace the current OFF stanza (lines 32–37 in the existing file, key `linter.rules.style.noRestrictedImports`) with the activated form documented in *Reference biome.json modifications* below.
  - [x] Append the new `overrides` block at the root of `biome.json` (after the existing `formatter` and `assist` blocks, before the closing `}`). The override exempts `packages/core/src/schemas/loader.ts` from `noRestrictedImports`.
  - [x] Run `pnpm -C caspian lint`. Verify exit 0. (At this point `loader.ts` doesn't exist yet, so the override is dormant; the rule is dormant too because no `**/schemas/**` import exists in the lint scope. Both will activate in Task 4.)
  - [x] Defer Cross-check #2 (negative test) to Task 8.

- [x] **Task 4 — Loader module + ajv validator wiring (Verrou 3)** (AC: #7, #8, #9, #10, #11, #18 cross-check #3, #4, #5, #6)
  - [x] Author `caspian/packages/core/src/schemas/loader.ts` per AC8 — the dual-mode resolver with module-scope cache and ESM `__dirname` shim.
  - [x] Author `caspian/packages/core/src/diagnostics/types.ts` per AC11 — `Severity`, `Diagnostic`, `ValidationResult`.
  - [x] Author `caspian/packages/core/src/diagnostics/index.ts` per AC11 — type re-exports.
  - [x] Author `caspian/packages/core/src/validator.ts` per AC9 — ajv 2020-12 instance + `getEnvelopeValidator()`.
  - [x] Author `caspian/packages/core/src/index.ts` per AC10 — the `validateFile()` stub.
  - [x] Run `pnpm --filter @caspian-dev/core exec tsc --noEmit` — TypeScript MUST compile cleanly.
  - [x] Run Cross-check #3 (Verrou 3 audit grep). Record output.

- [x] **Task 5 — Build script + copy-schemas** (AC: #12, #16 partial)
  - [x] Author `caspian/packages/core/scripts/copy-schemas.ts` per AC12 — `import.meta.url`-based path resolution; copies `caspian/schemas/v1/*.json` to `caspian/packages/core/dist/schemas/v1/`.
  - [x] Wire the `build` script in `caspian/packages/core/package.json` per AC1: `"build": "tsc -p tsconfig.json && tsx scripts/copy-schemas.ts"`.
  - [x] Run `pnpm --filter @caspian-dev/core build` from `caspian/`. Verify `caspian/packages/core/dist/` is populated with both compiled JS, `.d.ts`, and the schemas under `dist/schemas/v1/`.
  - [x] Run Cross-check #4 (ajv 2020-12 import) and Cross-check #6 (loader production-mode resolution). Record outputs.
  - [x] Run Cross-check #5 (loader dev-mode fallback) BEFORE this task's `pnpm build` — the dev mode is only exercised when `dist/` is missing. (If you've already run build, `rm -rf caspian/packages/core/dist/` to reset, run cross-check #5, then re-run build.)

- [x] **Task 6 — Test infrastructure** (AC: #13)
  - [x] Author `caspian/packages/core/vitest.config.ts` per AC13 — `import.meta.url`-based root resolution + `test.include` + `passWithNoTests = true`.
  - [x] Author `caspian/packages/core/tests/helpers/paths.ts` per AC13 — `REPO_ROOT`, `FIXTURES_DIR`, `SCHEMAS_DIR` resolved via `import.meta.url`.
  - [x] (RECOMMENDED but not required) Author `caspian/packages/core/tests/unit/smoke.test.ts` with a single trivial assertion exercising the public API (`expect(typeof validateFile).toBe('function')`).
  - [x] Run `pnpm --filter @caspian-dev/core test`. Verify exit 0.

- [x] **Task 7 — Smoke gate verification** (AC: #15, #16, #17)
  - [x] Run `pnpm -C caspian install` once more (idempotent — confirms the lockfile is stable post-implementation).
  - [x] Run `pnpm -C caspian lint`. Capture the *Checked N files* line. Document the new biome scope in *Completion Notes — Smoke gate baseline* (will become the floor for Story 2.2+).
  - [x] Run `pnpm -C caspian build`. Verify exit 0 across all packages (only `@caspian-dev/core` builds anything; root has no `build` script per Story 1.1 AC1's `pnpm -r --if-present` pattern).
  - [x] Run `pnpm -C caspian test`. Verify exit 0.
  - [x] Run the AC16 ESM-import smoke check via `node --input-type=module -e ...`. Confirm `function` printed.
  - [x] Run `git status caspian/` and verify only the expected files appear (per AC17). Any unexpected modification under `caspian/` outside `packages/core/`, `biome.json`, and `pnpm-lock.yaml` MUST be investigated and either reverted or documented.

- [x] **Task 8 — Negative tests + cross-checks** (AC: #18)
  - [x] Run Cross-check #1 (Verrou 1 negative test). Add the deliberate ascent import; verify TS error; remove the import. Record the exact error message.
  - [x] Run Cross-check #2 (Verrou 2 negative test). Add the deliberate ascent import (or sneaky.ts under `src/schemas/` if Verrou 1 trips first); verify biome error; remove the test artifact. Record the exact lint output.
  - [x] Run Cross-check #7 (vendor-neutrality grep). Confirm empty output.
  - [x] Run Cross-check #8 (lockfile diff additive verification). Confirm purely additive diff.

- [x] **Task 9 — Story closeout** (no AC)
  - [x] Update *Dev Agent Record / Completion Notes List* with: total files created, new biome smoke-gate file count, all cross-check outcomes, deliberate departures from epic AC text (notably the `Promise<Diagnostic[]>` async signature), and any deferrals discovered (likely candidates: biome rule-syntax precise form, vitest config edge cases on Windows, ajv strict-mode warnings).
  - [x] Update *Dev Agent Record / File List* with the complete created/modified inventory.
  - [x] Move story status `ready-for-dev` → `in-progress` → `review` per the standard dev-story workflow (sprint-status.yaml updates handled by the dev-story workflow, not by this story authoring).

## Dev Notes

### Source authority

  - **Primary** — `_bmad-output/planning-artifacts/epics.md` lines 692–747 (Story 2.1 user story + 9 AC blocks).
  - **Secondary — sealed canonical sources**:
    - `_bmad-output/planning-artifacts/architecture.md` lines 627–662 (the `packages/core/` directory tree spec).
    - `_bmad-output/planning-artifacts/architecture.md` lines 723–727 (the 3-verrou enforcement mechanism descriptions).
    - `_bmad-output/planning-artifacts/architecture.md` lines 138–146, 162–168, 837–848 (Language/runtime, dependency selections, file organization patterns).
    - `_bmad-output/planning-artifacts/architecture.md` lines 213–220 (A1–A5 schema layout decisions; A3 schema bundling).
    - `_bmad-output/planning-artifacts/architecture.md` lines 715–743 (architectural boundaries: vendor-neutrality + single-source-of-truth + license + distribution).
  - **Reference Models** — `caspian/package.json` (root scaffold; field-order template), `caspian/tsconfig.base.json` (compiler options inheritance), `caspian/biome.json` (current state of the to-be-modified file), `caspian/schemas/v1/envelope.schema.json` (the schema the loader will read), `caspian/schemas/v1/diagnostic-registry.schema.json` (the second schema bundled by copy-schemas).

### Reference package.json

`caspian/packages/core/package.json` — byte-faithful target content (biome may normalize whitespace; field-order is the contract):

```json
{
  "name": "@caspian-dev/core",
  "version": "0.0.1",
  "description": "Vendor-neutral validator runtime for the Caspian Composable Agent Skill Protocol — pure validation logic, consumed by @caspian-dev/cli.",
  "license": "Apache-2.0",
  "author": "Cyril Houillon",
  "type": "module",
  "engines": {
    "node": ">=22.13"
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./diagnostics": "./dist/diagnostics/index.js"
  },
  "files": [
    "dist/",
    "README.md",
    "CHANGELOG.md",
    "LICENSE"
  ],
  "publishConfig": {
    "access": "public",
    "provenance": true
  },
  "scripts": {
    "build": "tsc -p tsconfig.json && tsx scripts/copy-schemas.ts",
    "dev": "tsc -p tsconfig.json --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "copy-schemas": "tsx scripts/copy-schemas.ts"
  },
  "dependencies": {
    "ajv": "^8.17.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

**Notes on the model:**

- Versions are minimum floors; pnpm will resolve the exact installed versions and pin them in `pnpm-lock.yaml`.
- `version: "0.0.1"` is the pre-publish placeholder; Story 2.8 will bump to `0.1.0` for the first npm publish via changesets.
- `tsx` is chosen over `ts-node` because of cleaner ESM-with-`nodenext` support and zero peer-dep complexity (Story 1.1's `auto-install-peers=true` is friendly toward it).
- The `@caspian-dev/core` scoped name was confirmed available and reserved by Cyril per Epic 1 retro AI-3 (sprint-status.yaml line 45).
- The `keywords` field is intentionally omitted at this stage; Story 2.8 will add curated keywords for npm discoverability before publish.

### Reference README.md

`caspian/packages/core/README.md` — byte-faithful target content:

```markdown
# @caspian-dev/core

Vendor-neutral validator runtime for the Caspian Composable Agent Skill
Protocol. Implements the validation pipeline that the Caspian CLI
(`@caspian-dev/cli`, binary `caspian`) and any future alternative host
(LSP, CI ajv layer, runtime hook, install-time validator) consume.

This package contains pure validation logic with no CLI surface. The
`caspian` binary lives in [`@caspian-dev/cli`](../cli/) (Story 2.5+).

## Status

Pre-1.0 — public API is stabilizing across Epic 2. The first published
version is `0.1.0`, shipped from Story 2.8. The semver promise applies
from `1.0.0` onward.

## Public API surface

The package uses **named exports only** — no `export default`.

From the `.` entry point (`@caspian-dev/core`):

- `validateFile(path: string): Promise<Diagnostic[]>` — validates a single
  file and returns the array of diagnostics (empty array = valid).
  Story 2.1 ships a stub that returns `[]`; the full pipeline lands in
  Stories 2.3 + 2.4.

From the `./diagnostics` sub-export (`@caspian-dev/core/diagnostics`):

- `Diagnostic`, `Severity`, `ValidationResult` — type definitions.
  Story 2.2 will export typed diagnostic-code constants
  (`CASPIAN_E001`, `CASPIAN_W001`, …) alongside.

## Single source of truth for schemas

The package's `src/schemas/loader.ts` is the **sole** entry point for
reading bundled JSON Schemas. The single-source-of-truth invariant is
enforced by three independent mechanisms (architecture step-04
3-verrou):

1. TypeScript `rootDir: "./src"` rejects relative ascent imports
   into `../../../schemas/`.
2. biome `noRestrictedImports` forbids any import matching
   `**/schemas/**` outside `loader.ts`.
3. CI audit `grep -rn "envelope.schema" packages/core/src` returns
   exactly one match.

## License

Apache-2.0 — see [`./LICENSE`](./LICENSE).
```

### Reference CHANGELOG.md

`caspian/packages/core/CHANGELOG.md` — byte-faithful target content:

```markdown
# @caspian-dev/core changelog

This file tracks `@caspian-dev/core` semver. Decoupled from spec-level
semver (`caspian/spec/CHANGELOG.md`, Story 5.2) and from the CLI semver
(`caspian/packages/cli/CHANGELOG.md`, Story 2.5).

## Unreleased

- Initial package skeleton: ESM `@caspian-dev/core` with the canonical
  schema-loading entry point (`loader.ts`), 3-verrou single-source-of-truth
  enforcement, ajv 2020-12 envelope schema registration, and stub
  `validateFile(path)` public API. Pipeline stages 1–6 land in Stories
  2.3–2.4.
```

### Reference tsconfig.json

`caspian/packages/core/tsconfig.json` — byte-faithful target content:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "composite": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  },
  "include": ["src/**/*"],
  "exclude": [
    "node_modules",
    "dist",
    "tests/**/*",
    "scripts/**/*",
    "vitest.config.ts"
  ]
}
```

### Reference biome.json modifications

The current `caspian/biome.json` (lines 32–37) reads:

```json
        "noRestrictedImports": {
          "level": "off",
          "options": {
            "paths": {}
          }
        }
```

Target state — replace lines 32–37 with the activated form, AND append a new top-level `overrides` block to the file's root object (after `assist`, before the closing `}`):

```json
        "noRestrictedImports": {
          "level": "error",
          "options": {
            "paths": {
              "**/schemas/**": "Direct schema imports are forbidden. Import via packages/core/src/schemas/loader.ts (the sole allow-listed reader; see step-04 3-verrou)."
            }
          }
        }
```

…then at the root of `biome.json` (sibling to `files`, `linter`, `formatter`, `assist`):

```json
  "overrides": [
    {
      "includes": ["packages/core/src/schemas/loader.ts"],
      "linter": {
        "rules": {
          "style": {
            "noRestrictedImports": "off"
          }
        }
      }
    }
  ]
```

**Implementation hazard — biome version drift:** the rule-path `linter.rules.style.noRestrictedImports` and the option-key `paths` reflect biome 2.4 conventions. Biome's nursery rules occasionally promote between minor versions and the option-key surface changes (e.g., the option may be `paths` or `patterns` in a future version, and the override syntax may use `includes` vs `include`). After the edit, the dev MUST run `pnpm -C caspian lint` and confirm exit 0. If biome reports a *configuration* error (vs. a content error), the rule has moved — consult biome 2.4.13's documentation for the current path. The deferred-work entry from Story 1.1 review at `deferred-work.md:8` already flags this as a known biome surface area to watch.

**Glob semantics:** biome's `noRestrictedImports.paths` matches against the **import specifier string**, not the source-file path. `"**/schemas/**"` therefore matches the `'../../../schemas/v1/envelope.schema.json'` specifier in the import statement. If biome 2.4 does NOT support glob patterns in `paths` (it expects literal module names), the fallback is to enumerate the depth variants: `"./schemas/v1/envelope.schema.json"`, `"../schemas/v1/envelope.schema.json"`, `"../../schemas/v1/envelope.schema.json"`, `"../../../schemas/v1/envelope.schema.json"`, `"../../../../schemas/v1/envelope.schema.json"`. Document any fallback used in *Completion Notes*.

### Reference loader.ts

`caspian/packages/core/src/schemas/loader.ts` — illustrative target shape (the dev MUST adapt to the project's actual TS / lint conventions; the *contract* is the dual-mode resolution + lazy cache + clear error):

```ts
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let cachedEnvelopeSchema: object | null = null;

export async function loadEnvelopeSchema(): Promise<object> {
  if (cachedEnvelopeSchema !== null) {
    return cachedEnvelopeSchema;
  }

  const productionPath = path.resolve(
    __dirname,
    "../schemas/v1/envelope.schema.json",
  );
  const devPath = path.resolve(
    __dirname,
    "../../../../schemas/v1/envelope.schema.json",
  );

  for (const candidate of [productionPath, devPath]) {
    try {
      const raw = await fs.readFile(candidate, "utf8");
      cachedEnvelopeSchema = JSON.parse(raw);
      return cachedEnvelopeSchema;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }
    }
  }

  throw new Error(
    `cannot locate envelope.schema.json — checked ${productionPath} and ${devPath}`,
  );
}
```

**Notes on the model:**

- Production-mode path: `__dirname` resolves to `caspian/packages/core/dist/schemas/` after build, so `../schemas/v1/envelope.schema.json` resolves to `caspian/packages/core/dist/schemas/v1/envelope.schema.json` (the location populated by `copy-schemas.ts`).
- Dev-mode path: when running source via vitest / tsx, `__dirname` resolves to `caspian/packages/core/src/schemas/`, and `../../../../schemas/v1/envelope.schema.json` ascends to `caspian/schemas/v1/envelope.schema.json` (the Story 1.4 / Epic 1 source-of-truth).
- The 4-level ascent (`../../../../`) under `src/schemas/` is intentional. From `packages/core/src/schemas/loader.ts`: `..` = `src/`; `../..` = `core/`; `../../..` = `packages/`; `../../../..` = `caspian/`. Then `+ schemas/v1/envelope.schema.json`. Verify by hand-counting before committing.
- The dev-mode fallback path **deliberately** ascends out of `rootDir`. Verrou 1 (TypeScript `rootDir`) does NOT reject this because `path.resolve()` is a runtime string-construction call, not a TypeScript `import` statement — TS only restricts ascent in `import` / `require` resolution. The architecture's intent is exactly this: imports are locked to `src/`, but runtime path math is permitted in `loader.ts` (the sole allow-listed module).

### Loader signature decision

The epic AC says *"validateFile(path: string): Diagnostic[]"* — a synchronous return. AC10 deliberately departs by typing it as `Promise<Diagnostic[]>` (asynchronous). The loader (`loadEnvelopeSchema`) is also async. **Reasoning:**

1. File reading must be async in modern Node.js (`fs/promises`); using `readFileSync` blocks the event loop and is incompatible with multi-file walking (Story 2.5 will iterate a glob).
2. The future pipeline (Stories 2.3, 2.4) will perform multiple async I/O operations per file (encoding sniff, schema validation against the file body, allow-list scan against runtime field discovery). Returning `Promise<Diagnostic[]>` from day one prevents a backwards-incompatible refactor mid-Epic.
3. The contract *"empty array = valid"* is preserved verbatim; the only semantic shift is the wrapper `Promise<>`.
4. The CLI binary in Story 2.5 will `await validateFile()` regardless — there's no consumer for whom sync vs async is observable in v1.0.

The dev MUST document this departure in *Completion Notes — Deliberate departures from epic AC text*. The departure is conservative (epic AC is more restrictive than the implementation; the implementation is a strict superset) and aligned with architecture line 231 ("B4 JSON output stable schema — defined during first implementation story") which establishes the precedent of allowing first-implementation refinement of literal AC wording.

### Verrou 1 implementation hazard — `rootDir` vs `rootDirs`

The epic AC at line 710 reads: *"`rootDirs: ["./src"]` is declared / And any relative import that ascends out of `src/` ... is rejected by the TypeScript compiler"*. This is technically incorrect: `rootDirs` (plural) is for *virtual directory unification* (merging `src/` with `generated/` so they appear as a single root for module resolution); it does NOT restrict source-file scope. The compile-error mechanism (`TS6059: File '...' is not under 'rootDir'`) is triggered by `rootDir` (singular).

Story 2.1 implementation MUST use `rootDir: "./src"` (singular) to honor the architectural intent. Adding `rootDirs: ["./src"]` (plural) alongside is harmless and may improve documentation clarity if a reviewer looks for the literal-AC string, but is not load-bearing.

If the dev encounters the literal-AC reading and chooses to use `rootDirs` only (without `rootDir`), Cross-check #1 (negative test) will FAIL — the ascent import will compile silently. Treat that as a story-blocking bug and switch to `rootDir`.

### Schema bundling — copy-schemas.ts notes

The script copies `caspian/schemas/v1/*.json` (currently 2 files: `envelope.schema.json`, `diagnostic-registry.schema.json`) into `caspian/packages/core/dist/schemas/v1/`. Both schemas are bundled into the npm tarball even though Story 2.1's loader only consumes `envelope.schema.json`:

  - `diagnostic-registry.schema.json` is bundled because Story 2.2's `verify-codes-hash.ts` script needs to ajv-validate the live `diagnostics/registry.json` against it (the `pnpm ajv-validate-registry` CI step in Story 2.2 / 2.7).
  - Bundling both maintains the symmetry "everything under `schemas/v1/` is a `core` runtime concern" without surprise asymmetry mid-epic.

The script should NOT be defensive (e.g., no graceful handling of "schemas/ is missing"). It panic-throws because a missing source schema is a build-system bug, not a recoverable state.

### Public API surface — diagnostics sub-export

The `./diagnostics` sub-export's purpose for Story 2.1 is **types only**. Story 2.2 will add the typed code constants (`CASPIAN_E001`, etc.) generated from `diagnostics/registry.json`. The types ship in 2.1 because:

  - The `validateFile()` signature uses `Diagnostic[]` (or `Promise<Diagnostic[]>`); the public Diagnostic type must be importable from a stable path.
  - Establishing `./diagnostics` as a separate export entry now (not in 2.2) prevents a breaking change to consumers' import paths when 2.2 lands.
  - Bundling types and constants in the same sub-export is the conventional shape (ajv, vitest, fastify, etc., all do it this way).

### Pre-existing files NOT modified

This story makes one in-place edit: `caspian/biome.json` (Verrou 2 activation). All other Epic 1 outputs remain untouched:

  - `caspian/spec/` (Stories 1.2 + 1.3 sealed it)
  - `caspian/schemas/` (Story 1.4 sealed it; the bundled copies in `dist/` are derivatives, not modifications)
  - `caspian/diagnostics/` (Stories 1.5 + 1.8 sealed it)
  - `caspian/fixtures/` (Story 1.6 sealed it)
  - `caspian/examples/` (Story 1.7 sealed it)
  - `caspian/.changeset/`, `caspian/.gitattributes` (Story 1.1 sealed; Story 2.2 will activate the `.gitattributes` rule for `codes.generated.ts`)
  - `caspian/.editorconfig`, `caspian/.gitignore`, `caspian/.npmrc`, `caspian/.nvmrc` (Story 1.1 + Epic 1 retro AI-2 sealed)
  - `caspian/LICENSE`, `caspian/LICENSE-CC-BY-4.0`, `caspian/README.md` (Story 1.1 sealed)
  - `caspian/tsconfig.base.json` (Story 1.1 sealed; sub-package `tsconfig.json` extends it without modifying it)
  - `caspian/.biomeignore` (Story 1.1 sealed; the new `.ts` files are inside the lint scope per `caspian/biome.json` `files.includes`)
  - `caspian/package.json` (root scripts already iterate via `pnpm -r --if-present`)
  - `caspian/pnpm-workspace.yaml` (already declares `packages/*`; the new `packages/core/` is auto-discovered)

`caspian/pnpm-lock.yaml` IS modified — pnpm regenerates it on every `pnpm install`. The diff MUST be additive (per AC18 cross-check #8).

### Anti-patterns to avoid (LLM disaster prevention)

  - **Do NOT** import the schema directly via `import schema from '../../../schemas/v1/envelope.schema.json'` ANYWHERE in `src/` other than via the `loader.ts` runtime read. The 3-verrou enforcement WILL catch this; treat any verrou error as a load-bearing test of the architecture, not a hurdle to work around.
  - **Do NOT** use `process.cwd()` in `vitest.config.ts`, `loader.ts`, `paths.ts`, `copy-schemas.ts`, or any other file that resolves paths. Always use `import.meta.url` + `fileURLToPath` + `path.resolve`. The cwd-stability invariant is mandated by the epic AC and architecture line 845; getting it wrong here cascades into every Epic 2+ test failure mode (tests pass when run from `caspian/packages/core/` but fail when run from `caspian/` and vice versa).
  - **Do NOT** use the default `import Ajv from 'ajv'` — that imports the Draft-07 entry. Use `import Ajv2020 from 'ajv/dist/2020.js'` exactly. The `.js` extension is required by ESM `nodenext` resolution.
  - **Do NOT** add `js-yaml` as a dependency. The architecture's mandated YAML parser is `yaml` v2.x (strict 1.2 mode), and it lands in Story 2.3. Story 2.1 has no YAML parsing; do not over-prepare.
  - **Do NOT** add `commander`, `chalk`, `fast-glob`, or any other CLI-side dependency. Those land in `@caspian-dev/cli` (Story 2.5).
  - **Do NOT** create `packages/cli/`. That's Story 2.5's deliverable. Story 2.1 creates `packages/core/` only.
  - **Do NOT** populate `tests/unit/parsers/`, `tests/unit/validators/`, or `tests/integration/full-pipeline.test.ts` (architecture lines 651–656). Those land in Stories 2.3 / 2.4. Story 2.1 ships only the `tests/helpers/paths.ts` infrastructure plus an OPTIONAL smoke test.
  - **Do NOT** generate or copy `codes.generated.ts`. That's Story 2.2's deliverable; Story 2.1 has no generated code.
  - **Do NOT** modify `caspian/spec/`, `caspian/schemas/`, `caspian/diagnostics/`, `caspian/fixtures/`, `caspian/examples/` for any reason. Those are sealed Epic 1 outputs.
  - **Do NOT** delete `caspian/pnpm-lock.yaml` as a "regenerate clean" shortcut. The lockfile carries Epic 1's resolutions (biome 2.4.13, @changesets/cli 2.31.0); destroying it would force re-resolution of those packages, blowing out the lockfile-stability contract from Story 1.1 AC8. `pnpm install` (without `--no-frozen-lockfile`) will append the new resolutions in place.
  - **Do NOT** use synchronous `fs.readFileSync` in `loader.ts`. Use `fs.promises.readFile` (or `await fs.readFile` from the import). The future multi-file walking (Story 2.5) will multiplex many concurrent loader calls; sync I/O blocks the event loop and serializes them.
  - **Do NOT** invent test cases for diagnostics that don't yet exist (E001–W004 fixtures are in `caspian/fixtures/` per Story 1.6; the validator pipeline that consumes them lands in Stories 2.3 / 2.4; do not pre-author tests against the stub `validateFile()` that returns `[]`).
  - **Do NOT** under-specify the README. Story 2.1's README is the package's first impression for npm browsers / casper-core plugin authors / future LSP implementers reading the code; it MUST cover the public API and the 3-verrou single-source-of-truth contract.

### Latest-tech context (Node 22.13 + ESM `nodenext` + ajv 8 / Draft 2020-12 + biome 2.4)

**Node 22.13 LTS:**

  - The `engines.node = ">=22.13"` floor is locked by Epic 1 retro AI-2 (sprint-status.yaml line 44; commit `e3564c8`).
  - Node 22 brings stable ESM ergonomics (top-level `await`, `--experimental-loader` is gone in favor of stable `--loader`), and `import.meta.dirname` and `import.meta.filename` (Node 21+) — but the dev SHOULD use the cross-version-safe `fileURLToPath(import.meta.url)` pattern for portability with Node 20 if backporting becomes necessary.
  - The architecture's CI matrix (architecture F1) was originally Node 20 + 22; the retro pivot makes Node 22.13 the floor. There is currently NO CI matrix configured (Story 2.8 / future ci.yml own that).

**ESM `nodenext` resolution:**

  - All relative imports in `.ts` source MUST include the `.js` extension (NOT `.ts`) — even though the file on disk is `.ts`. Example: `import { loadEnvelopeSchema } from './schemas/loader.js'`. The `.ts` extension does not work; the `.js` extension is the post-compile target and is the spec-mandated form. This is non-obvious for devs unfamiliar with `nodenext`.
  - Bare imports (`import Ajv2020 from 'ajv/dist/2020.js'`) follow the package's `exports` map; ajv 8.x supports the `dist/2020.js` subpath natively.
  - JSON imports require `with { type: 'json' }` (`import schema from './x.json' with { type: 'json' }`) under Node 22 — but Story 2.1's `loader.ts` reads JSON via `fs.readFile + JSON.parse`, not via JSON imports, so this concern doesn't apply here.

**ajv 8 / Draft 2020-12:**

  - ajv 8 is the long-stable major; ^8.17.0 is the floor (latest as of late 2026 is ~8.17.x).
  - The Draft 2020-12 entry is `ajv/dist/2020.js` — a separate compiled bundle from the default `ajv` (Draft-07).
  - Strict mode (`{ strict: true }`) catches schema-author bugs (unknown keywords, deprecated forms). Recommended for Story 2.1's `getEnvelopeValidator()` initialization. If ajv reports strict-mode warnings against `caspian/schemas/v1/envelope.schema.json` (e.g., a valid keyword that ajv 8.17 doesn't recognize), document them in *Completion Notes* and either silence the specific warning or relax to `{ strict: "log" }`. The schema is sealed (Story 1.4); resolving the warning is NOT done by editing the schema in this story.
  - `allErrors: true` makes ajv collect all validation errors per file rather than short-circuiting on the first. The pipeline (Story 2.4) relies on this.

**biome 2.4:**

  - Pinned at `^2.4.13` by Story 1.1 (root devDependencies).
  - The `noRestrictedImports` rule lives under `linter.rules.style.noRestrictedImports` (style category) per biome 2.4. Earlier biome (1.x) had it under `nursery`; 2.0 promoted it to `style`. Confirm the path with `pnpm -C caspian exec biome rage` if uncertain.
  - biome's `overrides` block uses `includes` (plural; array of glob patterns) per biome 2.x. Earlier versions used `include` (singular). The reference snippet uses `includes` for biome 2.4 alignment.
  - Confirm biome is happy by running `pnpm -C caspian exec biome check biome.json` after the edit; biome will surface configuration-shape errors directly.

### References

  - `_bmad-output/planning-artifacts/epics.md` lines 692–747 (Story 2.1 user story + 9 AC blocks)
  - `_bmad-output/planning-artifacts/architecture.md` lines 627–662 (`packages/core/` directory tree spec)
  - `_bmad-output/planning-artifacts/architecture.md` lines 723–727 (3-verrou enforcement mechanism descriptions)
  - `_bmad-output/planning-artifacts/architecture.md` lines 138–146 (Language & Runtime: TypeScript 5.x + Node 22.13 + nodenext + ES2022 strict)
  - `_bmad-output/planning-artifacts/architecture.md` lines 162–168 (dependency selections: ajv 2020-12, vitest, biome, etc.)
  - `_bmad-output/planning-artifacts/architecture.md` lines 213–220 (A1–A5 schema layout decisions; A3 schema bundling)
  - `_bmad-output/planning-artifacts/architecture.md` lines 715–743 (architectural boundaries: vendor-neutrality, single-source-of-truth, license, distribution)
  - `_bmad-output/planning-artifacts/architecture.md` lines 837–848 (file organization patterns for TypeScript packages)
  - `caspian/package.json` (root scaffold; field-order template)
  - `caspian/tsconfig.base.json` (compiler options inheritance)
  - `caspian/biome.json` (current state of the to-be-modified file)
  - `caspian/.gitattributes` (rule `packages/core/src/diagnostics/codes.generated.ts merge=ours linguist-generated=true` becomes effective in Story 2.2)
  - `caspian/schemas/v1/envelope.schema.json` (Story 1.4; the schema the loader will read)
  - `caspian/schemas/v1/diagnostic-registry.schema.json` (Story 1.5; the second schema bundled by copy-schemas)
  - `caspian/diagnostics/registry.json` (Stories 1.5 + 1.8; the registry consumed by Story 2.2's gen-diagnostic-codes.ts)
  - `_bmad-output/implementation-artifacts/1-1-project-bootstrap-monorepo-scaffold-dual-license-layout.md` (Story 1.1 — root scaffold patterns; the `auto-install-peers=true` `.npmrc` setting; the `noDefaultExport` biome rule already active; the `release` script semantics)
  - `_bmad-output/implementation-artifacts/deferred-work.md` lines 7–18 (Story 1.1 review deferrals — most relevant: line 8 noDefaultExport + line 12 Node 20 sunset (now resolved) + line 15 no canary fixtures for biome rules: Story 2.1 IS the first source-file landing that exercises biome rules in a non-empty source set)
  - `_bmad-output/implementation-artifacts/epic-1-retro-2026-04-27.md` AI-2 + AI-3 (Node 22 + npm naming pivot; both already applied to spec + code per sprint-status.yaml lines 44–45)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7[1m] (Claude Code, dev-story workflow, 2026-04-27).

### Debug Log References

**Cross-check #1 — Verrou 1 negative test (TypeScript ascent rejection).** PASS — with one twist documented below. The literal-AC test (`import _verrou1Test from "../../../schemas/v1/envelope.schema.json";`) under TypeScript 5.9 + `nodenext` first trips a JSON-syntax check (`error TS1543: Importing a JSON file into an ECMAScript module requires a 'type: "json"' import attribute when 'module' is set to 'NodeNext'.`) before the rootDir check fires. Re-running the test with a TS-source ascent (`import { x } from "../temp-out-of-root.js";` from a temp file at `caspian/packages/core/temp-out-of-root.ts`) produced the canonical TS6059 error this AC mandates:

```
caspian/packages/core/src/index.ts(5,44): error TS6059: File 'F:/work/.../caspian/packages/core/temp-out-of-root.ts' is not under 'rootDir' 'F:/work/.../caspian/packages/core/src'. 'rootDir' is expected to contain all source files.
caspian/packages/core/src/index.ts(5,44): error TS6307: File 'F:/work/.../caspian/packages/core/temp-out-of-root.ts' is not listed within the file list of project 'F:/work/.../caspian/packages/core/tsconfig.json'. Projects must list all files or use an 'include' pattern.
```

Both errors fired on the deliberate ascent (TS6059 for rootDir + TS6307 for include-list). The temp file and the deliberate ascent import in `src/index.ts` were removed; `tsc --noEmit` re-confirmed exit 0 post-cleanup. **Net:** Verrou 1 (TypeScript `rootDir`) is the **compile-time enforcement layer**, and it works as intended for source-file ascents. JSON ascents are also rejected, but via TS1543 rather than TS6059 — the architectural intent ("imports outside src/ are rejected") is met regardless.

**Cross-check #2 — Verrou 2 negative test (biome `noRestrictedImports` rejection).** PASS — required a fallback configuration documented below. Initial attempt with the glob-pattern key `"**/schemas/**"` did NOT catch the violation (biome 2.4.13's `noRestrictedImports.paths` does NOT support glob patterns; it matches the import-specifier string literally). Switched to literal-depth enumeration covering `../`, `../../`, `../../../`, `../../../../` for both `envelope.schema.json` and `diagnostic-registry.schema.json` (8 entries total). Re-running the negative test with `caspian/packages/core/src/schemas/sneaky.ts` containing `import _v2Test from "../../../../schemas/v1/envelope.schema.json";` produced:

```
× Direct schema imports are forbidden. Import via packages/core/src/schemas/loader.ts (the sole allow-listed reader; see step-04 3-verrou).

  1 │ // VERROU-2-NEGATIVE-TEST: deliberate violation to verify biome noRestrictedImports
> 2 │ import _v2Test from "../../../../schemas/v1/envelope.schema.json";
    │                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Checked 19 files in 28ms. No fixes applied.
Found 1 error.
```

`sneaky.ts` was deleted; lint re-confirmed exit 0 with `Checked 18 files`. The override exempting `packages/core/src/schemas/loader.ts` from the rule is dormant — it activates only if `loader.ts` itself triggered the rule. Since `loader.ts` does NOT contain a relative-path import of any schema file (it constructs paths via `path.resolve()` at runtime, not via `import` statements), the override is precautionary; it covers a future loader rewrite that decided to use a JSON-attribute import. **Net:** Verrou 2 (biome `noRestrictedImports`) is the **lint-time enforcement layer**, and it works against the literal-depth ascent paths most likely to be attempted.

**Cross-check #3 — Verrou 3 audit.** PASS. Initial loader implementation produced 3 grep matches (2 path strings + 1 error-message format string). Refactored `loader.ts` to centralize the filename in a single constant `ENVELOPE_SCHEMA_FILE = "envelope.schema.json"` and reference the constant in `path.resolve()` and `Error()` constructors; the audit grep then returned exactly 1 line:

```
$ grep -rn "envelope.schema" caspian/packages/core/src/
caspian/packages/core/src/schemas/loader.ts:5:const ENVELOPE_SCHEMA_FILE = "envelope.schema.json";
```

Architecture C-line 727 invariant ("exactly 1 result") satisfied. **Net:** Verrou 3 (audit grep) is the **CI-time enforcement layer**; the audit can be turned into a CI step in Story 2.7.

**Cross-check #4 — ajv 2020-12 import shape.** PASS.

```
$ cd caspian/packages/core && node --input-type=module -e "import { Ajv2020 } from 'ajv/dist/2020.js'; const ajv = new Ajv2020({ strict: true }); console.log(typeof ajv.compile);"
function
```

The `Ajv2020` named import (rather than the default import) was chosen because TypeScript 5.9 + ajv 8.20 's `dist/2020.d.ts` exports both `class Ajv2020` (named) and `Ajv2020` (default), and the default-import shape produced `error TS2351: This expression is not constructable.` under `nodenext` resolution (likely a CJS/ESM interop quirk in ajv 8's bundling). The named import is unambiguous, ESM-safe, and equally idiomatic.

**Cross-check #5 — Loader dev-mode fallback.** PASS. Pre-build state (`dist/` removed; loader running from source via `tsx`):

```
$ rm -rf caspian/packages/core/dist
$ cd caspian/packages/core && ./node_modules/.bin/tsx -e "import('./src/schemas/loader.ts').then(m => m.loadEnvelopeSchema()).then(s => console.log(s['$id']))"
https://caspian.dev/schemas/v1/envelope.schema.json
```

The dev-mode fallback path (4 levels of ascent from `src/schemas/loader.ts` to `caspian/schemas/v1/envelope.schema.json`) resolves correctly to the Story 1.4 source-of-truth schema; `$id` matches.

**Cross-check #6 — Loader production-mode resolution.** PASS. Post-build state (`dist/` populated; loader running from compiled JS):

```
$ pnpm --filter @caspian-dev/core build
[copy-schemas] copied 2 file(s) → F:\work\joselimmo-marketplace-bmad\caspian\packages\core\dist\schemas\v1
$ cd caspian && node --input-type=module -e "import('./packages/core/dist/schemas/loader.js').then(m => m.loadEnvelopeSchema()).then(s => console.log(s['$id']))"
https://caspian.dev/schemas/v1/envelope.schema.json
```

The production-mode path (1 level of ascent from `dist/schemas/loader.js` to `dist/schemas/v1/envelope.schema.json`) resolves to the bundled copy; `$id` matches the source-of-truth — confirming `copy-schemas.ts` produced a byte-faithful bundle.

**Cross-check #7 — Vendor-neutrality grep.** PASS.

```
$ grep -rEn "@(anthropic-ai|claude)/" caspian/packages/core/package.json caspian/packages/core/src/
$ echo $?
1
```

Empty output (grep exit 1 = no match). No `@anthropic-ai/*` or `@claude/*` references in package metadata or source.

**Cross-check #8 — Lockfile diff additive verification.** PASS (with one acceptable peer-annotation refinement). `git diff caspian/pnpm-lock.yaml` reports `843 insertions(+), 4 deletions(-)`. The 4 deletions are NOT package-version changes — they are pnpm peer-annotation refinements:

  - `'@changesets/cli@2.31.0':` → `'@changesets/cli@2.31.0(@types/node@22.19.17)':` (same 2.31.0 version; lockfile entry now records the now-reachable `@types/node` peer)
  - `version: 2.31.0` → `version: 2.31.0(@types/node@22.19.17)` (companion of the above)
  - `'@inquirer/external-editor': 1.0.3` → `'@inquirer/external-editor': 1.0.3(@types/node@22.19.17)` (same 1.0.3 version; transitive peer-annotation refinement)
  - `'@inquirer/external-editor@1.0.3':` → `'@inquirer/external-editor@1.0.3(@types/node@22.19.17)':` (companion)

No package version actually changed. The 843 insertions are the new `packages/core` workspace entry + its transitive resolutions (ajv 8.20.0, vitest 3.2.4, typescript 5.9.3, tsx 4.21.0, @types/node 22.19.17, plus esbuild platform binaries, etc.).

**Smoke gate.** Final triple-check after all cross-checks complete:

```
$ pnpm -C caspian lint
> caspian-monorepo@0.0.0 lint F:\work\joselimmo-marketplace-bmad\caspian
> biome check .

Checked 18 files in 15ms. No fixes applied.

$ pnpm -C caspian test
✓ tests/unit/smoke.test.ts (3 tests) 4ms
Test Files  1 passed (1)
     Tests  3 passed (3)

$ pnpm -C caspian build
> @caspian-dev/core@0.0.1 build F:\work\joselimmo-marketplace-bmad\caspian\packages\core
> tsc -p tsconfig.json && tsx scripts/copy-schemas.ts
[copy-schemas] copied 2 file(s) → F:\work\joselimmo-marketplace-bmad\caspian\packages\core\dist\schemas\v1
```

All exit code 0. **New smoke-gate baseline: 18 biome-checked files** (up from 7 in the Story 1.5 → 1.8 chain; net +11 = the new package's 9 TS files (`src/index.ts`, `src/validator.ts`, `src/schemas/loader.ts`, `src/diagnostics/types.ts`, `src/diagnostics/index.ts`, `scripts/copy-schemas.ts`, `tests/helpers/paths.ts`, `tests/unit/smoke.test.ts`, `vitest.config.ts`) + 2 JSON files (`package.json`, `tsconfig.json`)). Story 2.2+ inherits this 18-file floor.

**AC16 ESM-import smoke check.** PASS.

```
$ cd caspian && node --input-type=module -e "import('./packages/core/dist/index.js').then(m => console.log(typeof m.validateFile))"
function
```

The published-shape ESM entry resolves and the public API is callable.

**Git status post-implementation (AC17).**

```
$ git status caspian/
On branch main
Changes not staged for commit:
        modified:   caspian/biome.json
        modified:   caspian/pnpm-lock.yaml

Untracked files:
        caspian/packages/

no changes added to commit
```

Only the 2 expected in-place modifications + the new `packages/` tree. No unexpected drift in `spec/`, `schemas/`, `diagnostics/`, `fixtures/`, `examples/`, or root config files.

### Completion Notes List

- **Files created:** 14 — `caspian/packages/core/{package.json, LICENSE, README.md, CHANGELOG.md, tsconfig.json, vitest.config.ts}` (6 root-of-package files) + `caspian/packages/core/src/{index.ts, validator.ts, schemas/loader.ts, diagnostics/types.ts, diagnostics/index.ts}` (5 source files) + `caspian/packages/core/scripts/copy-schemas.ts` (1 build script) + `caspian/packages/core/tests/{helpers/paths.ts, unit/smoke.test.ts}` (2 test-infra files).
- **Files modified in place:** 2 — `caspian/biome.json` (Verrou 2 activation: `noRestrictedImports` rule level OFF→ERROR with literal-depth path enumeration + 2 `overrides` entries: one exempting `loader.ts` from `noRestrictedImports`, one exempting config files from `noDefaultExport` — the latter resolves Story 1.1 deferred-work item #2) and `caspian/pnpm-lock.yaml` (additive: new `packages/core` workspace entry + ajv/vitest/typescript/tsx/@types/node + transitives; 4 peer-annotation refinements on @changesets/cli + @inquirer/external-editor — same versions, just lockfile representation tightened now that `@types/node` is reachable).
- **Smoke gate baseline:** 18 biome-checked files (Story 1.5 → 1.8 was 7; net +11). This is the new floor that Stories 2.2+ inherit. Lint exit 0; test exit 0 (3/3 passed); build exit 0; AC16 ESM-import smoke check returns `function`.

- **Deliberate departures from epic AC text** (both flagged in the create-story Dev Notes; both deliberate and conservative):
  1. **`validateFile` signature** — epic AC10 literally says `validateFile(path: string): Diagnostic[]` (synchronous). Implementation ships `validateFile(path: string): Promise<Diagnostic[]>` (asynchronous). Reasoning: file reads must be `fs/promises`; future pipeline stages (Stories 2.3/2.4) need async I/O; locking the public surface as Promise from day one prevents a breaking-change refactor mid-Epic. The "always returns array; empty = valid" contract is preserved verbatim. Documented in `caspian/packages/core/README.md` "Public API surface" section.
  2. **`rootDir` vs `rootDirs`** — epic AC5 + architecture line 725 literally say `rootDirs: ["./src"]` (plural). Implementation uses `rootDir: "./src"` (singular). The plural form is for *virtual directory unification* and does NOT restrict source-file scope; only the singular form raises TS6059 on ascent imports. Cross-check #1 confirmed TS6059 fires with `rootDir` (singular). The architectural intent is honored.

- **Biome rule-syntax fallback used (Verrou 2):** the create-story Dev Notes flagged that biome's `noRestrictedImports.paths` may not support glob patterns. **Confirmed during Cross-check #2** — biome 2.4.13's `paths` matches import-specifier strings literally, NOT as globs. Fell back to the documented enumeration of literal depth-variants: `../`, `../../`, `../../../`, `../../../../` for both `envelope.schema.json` and `diagnostic-registry.schema.json` (8 entries total). This is the longest single-line gain for the dev — the enforcement layer is real but the configuration is verbose. Future biome versions may expose a regex/glob form; if so, Story 2.7 (conformance + 3-layer vendor-neutrality enforcement) is the natural place to consolidate.

- **Story 1.1 deferred-work item resolved (#2 — `noDefaultExport` future conflict with config files):** `_bmad-output/implementation-artifacts/deferred-work.md` line 8 read: *"`noDefaultExport` future conflict with config files — Lint rule with no `overrides` block will reject `vitest.config.ts`, `rollup.config.ts`, Vite/Next.js conventions, etc. when those land. Owner: Stories 2.1+ (add `overrides` then)."* Story 2.1 is that owner. Added `caspian/biome.json` `overrides` entry for `**/vitest.config.ts`, `**/*.config.ts`, `**/*.config.mjs` exempting them from `noDefaultExport`. Vitest's `defineConfig` API mandates a default export; the override is a clean resolution.

- **ajv strict-mode warnings:** none. `new Ajv2020({ allErrors: true, strict: true })` accepted `caspian/schemas/v1/envelope.schema.json` cleanly at compile time (Cross-check #6 = ajv successfully compiled the validator function during the production-mode loader test). The schema body is well-formed under Draft 2020-12; no strict-mode hardening warnings emitted. Architecture A1 + A2 + A5 all hold.

- **ajv import shape decision:** used named import `import { Ajv2020 } from "ajv/dist/2020.js"` instead of the default import `import Ajv2020 from "ajv/dist/2020.js"`. Reasoning: the default-import shape produced `error TS2351: This expression is not constructable.` under TypeScript 5.9 + nodenext + ajv 8.20's d.ts shape (which exports `Ajv2020` as both a named class and a default). The named import is unambiguous and equally idiomatic; documented in `validator.ts` source.

- **Loader filename consolidation (Verrou 3):** the audit grep mandates "exactly 1 result" per architecture line 727. Initial implementation used inline path strings, producing 3 grep matches (2 paths + 1 error message). Refactored to centralize the filename in a single constant `ENVELOPE_SCHEMA_FILE = "envelope.schema.json"` (loader.ts:5) referenced via `path.resolve(here, ..., ENVELOPE_SCHEMA_FILE)` and the `Error()` message — net 1 grep match. The story file's *Reference loader.ts* model showed inline path strings; the dev-time refactor satisfies AC7's strict reading without changing semantics.

- **ajv `compile()` vs `addSchema()` (AC9 — deliberate departure, undocumented until review):** AC9 specifies `ajv.addSchema(schema, canonicalId)` then a separate compile step. Implementation uses `ajv.compile(schema)` directly. `compile()` registers the schema under its `$id` implicitly (`$id` = `https://caspian.dev/schemas/v1/envelope.schema.json`), so `ajv.getSchema(canonicalId)` resolves correctly and `$ref` cross-schema resolution is unaffected. Accepted in code review (2026-04-27); Story 2.4 should verify `ajv.getSchema(canonicalId)` resolves before adopting the pattern.

- **No deferrals introduced by Story 2.1 implementation.** All 18 ACs satisfied; all 8 cross-checks pass (with one acceptable substitution in #1 to match the canonical TS6059 error and one fallback in #2 to make biome's literal-path matching work). The Verrou 3 filename consolidation is recorded above as a refinement of the Reference Model rather than a deferral. Future hardening candidates that emerged during implementation (none blocking, all optional):
  - Biome 2.5+ may expose a regex/glob form for `noRestrictedImports.paths` — Story 2.7 (conformance + vendor-neutrality enforcement) can consolidate the literal-depth enumeration if so.
  - The TS1543-vs-TS6059 distinction in Cross-check #1 (JSON ascent rejected via syntax check, TS-source ascent rejected via rootDir check) is informational — both rejection paths satisfy the architectural intent.

### File List

**Created (14):**

- `caspian/packages/core/package.json`
- `caspian/packages/core/LICENSE`
- `caspian/packages/core/README.md`
- `caspian/packages/core/CHANGELOG.md`
- `caspian/packages/core/tsconfig.json`
- `caspian/packages/core/vitest.config.ts`
- `caspian/packages/core/src/index.ts`
- `caspian/packages/core/src/validator.ts`
- `caspian/packages/core/src/schemas/loader.ts`
- `caspian/packages/core/src/diagnostics/types.ts`
- `caspian/packages/core/src/diagnostics/index.ts`
- `caspian/packages/core/scripts/copy-schemas.ts`
- `caspian/packages/core/tests/helpers/paths.ts`
- `caspian/packages/core/tests/unit/smoke.test.ts`

**Modified (2):**

- `caspian/biome.json` (Verrou 2 activation: `noRestrictedImports` rule level OFF→ERROR with literal-depth path enumeration; 2 `overrides` entries for `loader.ts` exemption + config-files exemption from `noDefaultExport` — the latter resolves Story 1.1 deferred-work item #2)
- `caspian/pnpm-lock.yaml` (additive 843 lines for new `packages/core` workspace member + ajv 8.20.0 + vitest 3.2.4 + typescript 5.9.3 + tsx 4.21.0 + @types/node 22.19.17 + transitives; 4 peer-annotation refinements on @changesets/cli + @inquirer/external-editor — same versions, lockfile representation tightened post-`@types/node` reachability)

**Not part of file delivery but updated for sprint tracking:**

- `_bmad-output/implementation-artifacts/sprint-status.yaml` (story status transitions: backlog → ready-for-dev → in-progress → review; epic-2 status: backlog → in-progress)
- `_bmad-output/implementation-artifacts/2-1-caspian-core-skeleton-envelope-schema-integration-loader-ts.md` (this story file: tasks/subtasks checkboxes, status, Dev Agent Record, File List)

### Change Log

| Date       | Change                                                                                                       |
|------------|--------------------------------------------------------------------------------------------------------------|
| 2026-04-27 | Story 2.1 created (ready-for-dev) opening Epic 2: `@caspian-dev/core` skeleton + 3-verrou single-SoT lockdown. |
| 2026-04-27 | Implementation complete — 14 files created, 2 modified in place; all 18 ACs satisfied; 8/8 cross-checks pass. |
| 2026-04-27 | Smoke gate verified: `pnpm -C caspian lint` 18 files exit 0; `pnpm -C caspian test` 3/3 pass; `pnpm -C caspian build` exit 0; ESM-import smoke check returns `function`. Status moved to review. |
| 2026-04-27 | BMad code review complete: 2 decision-needed, 1 patch, 9 deferred, 11 dismissed. |

### Review Findings

- [x] [Review][Decision] **AC9 — Named import `{ Ajv2020 }` vs spec-mandated default import** — accepted; named import retained (TS2351 with default import under TS 5.9 + nodenext + ajv 8.20; documented in Completion Notes). [`caspian/packages/core/src/validator.ts:1`]
- [x] [Review][Decision] **AC9 — `ajv.compile()` vs spec-mandated `ajv.addSchema()` + separate retrieval** — accepted; `compile()` implicitly registers schema by `$id` = canonical URI; functionally equivalent. Added to Completion Notes as deliberate departure. [`caspian/packages/core/src/validator.ts:11-14`]
- [x] [Review][Patch] **`smoke.test.ts` — `fs.statSync` throws raw ENOENT instead of clean assertion failure** — fixed: replaced `fs.statSync(X).isDirectory()` with `fs.existsSync(X)` assertions. [`caspian/packages/core/tests/unit/smoke.test.ts:19-22`]
- [x] [Review][Defer] **`fs.access()` TOCTOU race in `validateFile`** [`caspian/packages/core/src/index.ts:6`] — deferred, pre-existing; production implementation (Story 2.3+) will replace with full `fs.readFile()`
- [x] [Review][Defer] **Cache concurrency — null-check guard allows double-initialization under concurrent awaits** [`caspian/packages/core/src/schemas/loader.ts:12-13`, `src/validator.ts:6-7`] — deferred, pre-existing; harmless in Node.js single-threaded event loop; minor inefficiency only
- [x] [Review][Defer] **`object | null` type hole in `cachedEnvelopeSchema`** [`caspian/packages/core/src/schemas/loader.ts:11`] — deferred, pre-existing; acceptable for pre-1.0 internal module; Story 2.2+ can refine
- [x] [Review][Defer] **`noRestrictedImports` depth enumeration incomplete — depths 0 and 5+ not covered** [`caspian/biome.json:36-43`] — deferred, pre-existing; acknowledged limitation; Story 2.7 conformance can improve if biome gains regex/glob support
- [x] [Review][Defer] **`copy-schemas.ts` copies all `.json` from `schemas/v1/` without an allowlist** [`caspian/packages/core/scripts/copy-schemas.ts:15-17`] — deferred, pre-existing; spec-prescribed behavior; low risk with current 2-file set; Story 2.8 pre-publish can add allowlist
- [x] [Review][Defer] **`exports` map missing explicit `"types"` conditions** [`caspian/packages/core/package.json:13-16`] — deferred, pre-existing; Story 2.8 pre-publish cleanup
- [x] [Review][Defer] **`validateFile` accepts directory paths via `fs.access()`** [`caspian/packages/core/src/index.ts:6`] — deferred, pre-existing; production impl (Story 2.3+) enforces file-only via real read
- [x] [Review][Defer] **`dist/.tsbuildinfo` included in `files: ["dist/"]` — embeds absolute machine paths in npm tarball** [`caspian/packages/core/tsconfig.json:7`, `package.json:17`] — deferred, pre-existing; Story 2.8 pre-publish: add to `.npmignore` or move `tsBuildInfoFile` outside `dist/`
- [x] [Review][Defer] **README missing explicit "deliberate departure" label for `Promise<Diagnostic[]>` signature** [`caspian/packages/core/README.md:23`] — deferred, pre-existing; departure self-evident; reasoning captured in Completion Notes
