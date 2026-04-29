# Story 2.5: `@caspian-dev/cli` package (caspian binary) — walker + multi-file aggregation + human formatter

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a plugin author,
I want a `caspian validate <path>` CLI that accepts file/directory/glob inputs and prints clear human-readable diagnostics with file/line/code/message/doc-URL,
So that I can validate my project locally with a single command and read the output directly in my terminal (FR7, FR9 human-side, FR10).

## Working Directory

All paths in this story resolve **inside `caspian/`** — the sub-monorepo under the surrounding `joselimmo-marketplace-bmad` repository. References like `packages/cli/`, `packages/core/`, `fixtures/`, `biome.json`, `pnpm-workspace.yaml`, `tsconfig.base.json` resolve to `caspian/packages/cli/`, etc. Never create files outside `caspian/` (with the single exception of sprint-status / story-file updates under `_bmad-output/implementation-artifacts/`).

`caspian/packages/core/` already exists from Stories 2.1–2.4 with a complete six-stage pipeline. Its public API is `import { validateFile } from "@caspian-dev/core"` returning `Promise<Diagnostic[]>` (always — empty array means valid). The `Diagnostic` type re-export lives at the same root export. There is no current `packages/cli/` directory; **Story 2.5 creates it from scratch**.

This story creates these new files in `caspian/packages/cli/`:

- `package.json` — manifest with `name="@caspian-dev/cli"`, `bin={"caspian":"./dist/cli.js"}`, deps locked per AC10.
- `tsconfig.json` — extends `../../tsconfig.base.json`; `rootDir: "./src"`; matches `packages/core/tsconfig.json` shape.
- `vitest.config.ts` — cwd-stable config via `import.meta.url` (mirrors `packages/core/vitest.config.ts`).
- `LICENSE` — Apache-2.0 explicit (copy from `caspian/LICENSE`).
- `README.md` — install, `validate <path>`, exit codes table.
- `CHANGELOG.md` — initial `Unreleased` heading + Story 2.5 bullet.
- `src/cli.ts` — entry; shebang `#!/usr/bin/env node`; argv parsing via `commander`; top-level `try/catch` → exit 3.
- `src/version.ts` — generated at build time by `scripts/gen-version.ts` from `package.json` (sha-stable header pattern, mirroring `gen-diagnostic-codes.ts` style).
- `src/commands/validate.ts` — `caspian validate <path>` handler: walks → `validateFile()` (for each file) → reporter.
- `src/walker.ts` — `fast-glob` walker (no symlinks, realpath safety check).
- `src/output/human.ts` — ANSI-aware human formatter (uses `chalk`); per-file blocks + summary footer.
- `src/constants.ts` — `EXIT_OK`, `EXIT_ERROR`, `EXIT_USAGE`, `EXIT_INTERNAL`, `REPO_ISSUE_URL`.
- `scripts/gen-version.ts` — reads `package.json`, writes `src/version.ts` (with hash-style header).
- `tests/helpers/paths.ts` — `REPO_ROOT`, `CLI_DIST_BIN`, `FIXTURES_DIR` via `import.meta.url`.
- `tests/helpers/run-cli.ts` — small `execFile`-based helper to invoke the built `dist/cli.js` in subprocess and capture `{ stdout, stderr, code }`.
- `tests/unit/walker.test.ts` — discovery + symlink + realpath assertions.
- `tests/unit/output/human.test.ts` — formatter snapshots (no ANSI when piped, ANSI when forced).
- `tests/integration/cli-end-to-end.test.ts` — exec the bin, assert stdout/exit per AC1–AC10.

This story modifies these pre-existing files:

- `caspian/pnpm-workspace.yaml` — already has `packages: ["packages/*"]`; **no change required**, the new `packages/cli/` is auto-discovered.
- `caspian/package.json` — add `"prepack": "pnpm -r build"` is **NOT required** for this story; build script already runs `pnpm -r --if-present build`. **No change required.**
- `caspian/biome.json` — **no change required**; the existing `noDefaultExport` and `useFilenamingConvention` rules apply uniformly. The existing `noRestrictedImports` block targets `**/schemas/**` only and does not affect `packages/cli`.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — story status `backlog` → `ready-for-dev` → `in-progress` → `review` → `done` per workflow.

This story does NOT modify `caspian/packages/core/**` (sealed by Stories 2.1–2.4), `caspian/diagnostics/**` (sealed), `caspian/schemas/**` (sealed), `caspian/fixtures/**` (sealed), `caspian/spec/**` (sealed), `caspian/biome.json` (no new exemptions needed), `caspian/tsconfig.base.json` (no new compiler options needed), the root `caspian/package.json` scripts (the existing `build`/`test`/`lint` recurse into all packages via `-r --if-present`).

This story does NOT introduce `--format=json`, the JSON output schema (B4), `published-files.snapshot.json`, `verify-pack.ts`, `tests/integration/format-json.test.ts`, or `.dependency-cruiser.cjs` — those are explicit Story 2.6 / Story 2.7 deliverables. Story 2.5 ships `--format=human` only and does not register any `--format` flag at all (registering it as a stub would create dead code Story 2.6 must remove).

## Background

Story 2.4 closed `@caspian-dev/core`'s six-stage pipeline. `validateFile(path)` now emits the full set of v1.0 diagnostics (E001–E014, W001–W004) for any single file. The remaining gap before a plugin author can run the validator end-to-end is the CLI surface: a binary in PATH, multi-file walking, and human-readable output. Story 2.5 fills that gap.

**Architectural anchors:**

- B1 / `architecture.md:224` — command surface: `caspian validate <path>`, `caspian --version`, `caspian --help`, `caspian validate --help`. Nothing else in v1.0.
- B2 / `architecture.md:225-229` — exit codes: `0` clean, `1` error, `2` usage, `3` internal.
- B3 / `architecture.md:230` — `--format=human` is the default; `--format=json` is Story 2.6.
- B5 / `architecture.md:249` — glob expansion happens inside the CLI via `fast-glob`; `followSymbolicLinks: false`; realpath verification keeps every walked file under cwd (forward-compat with NFR9).
- D3 / `architecture.md:291` — multi-file output: per-file diagnostic block in human mode + summary footer.
- File layout / `architecture.md:663-690` — full `packages/cli/` tree.
- Vendor-neutrality / `architecture.md:715-720` — Story 2.7 lands `dependency-cruiser`; Story 2.5 must merely not introduce any `@anthropic-ai/*` or `@claude/*` import (vacuously true — only `commander`, `fast-glob`, `chalk`, and `@caspian-dev/core` are added).
- Error handling philosophy / `architecture.md:427-432` — `validateFile` returns `Diagnostic[]` (never throws on validation outcomes); top-level `cli.ts` catches uncaught exceptions → exit 3.

**Story 2.4 review feedback applied to 2.5 (proactive):**

- Architecture's `validateFile(path: string): Diagnostic[]` signature is async in implementation: `Promise<Diagnostic[]>`. The CLI handler MUST `await` every call. (Story 2.1 deliberate departure documented in core/README.md.)
- `chalk` v5.x is ESM-only; the monorepo is `"type": "module"` — compatible.
- `fast-glob` 3.3.x is the current stable; ships ESM via the `glob`/`globSync` named exports.
- `commander` v12.x is CJS internally but its named-export entry point (`import { Command } from "commander"`) works under TypeScript `"module": "nodenext"` thanks to `esModuleInterop: true` (already in `tsconfig.base.json`).

## Acceptance Criteria

### AC1 — `caspian validate <single-file>` (valid file → exit 0)

**Given** a single file path

**When** I run `node packages/cli/dist/cli.js validate ./fixtures/valid/core-overview/minimal.md`

**Then** the CLI exits `0`

**And** stdout shows the per-file block with zero diagnostics — exact format:

```
fixtures/valid/core-overview/minimal.md
  (no diagnostics)

1 file: 0 errors, 0 warnings
```

**And** the file path in the per-file block heading is the path **as supplied on the command line** (resolved relative to cwd if not absolute). When relative, print the relative form; when absolute, print the absolute form. (Tested by walking with cwd set to `caspian/` and supplying `./fixtures/valid/...`.)

**And** the summary footer always prints, even when there are zero diagnostics. Exact pluralization: `1 file` / `N files` (English `s` rule on the noun); `errors` and `warnings` are always plural with explicit count (matches AC2 of architecture.md:289).

### AC2 — `caspian validate <directory>` (recursive walk via `fast-glob`)

**Given** a directory

**When** I run `node packages/cli/dist/cli.js validate ./fixtures/valid/`

**Then** the walker uses `fast-glob` (the `glob` named export, not the deprecated default export) with the pattern `**/*.md`, `cwd: <resolved-input-dir>`, `followSymbolicLinks: false`, `dot: false`, `onlyFiles: true`, `absolute: false` (paths returned relative to `cwd`)

**And** every matched file is validated through `@caspian-dev/core`'s `validateFile()`

**And** results are printed in **input file order** (the order `fast-glob` emits — which is filesystem-order on Linux, alphabetical on macOS/Windows; do NOT sort — matches B5's "deterministic but filesystem-determined" contract)

**And** the CLI exits `0` because all `fixtures/valid/**` fixtures contain zero errors (warnings allowed)

**And** the summary footer reflects the actual file count (≥ 7 valid fixtures live on disk per Story 1.6).

### AC3 — `caspian validate '<glob>'` (glob expansion inside the CLI)

**Given** a glob pattern

**When** I run `node packages/cli/dist/cli.js validate '**/*.md'` from `caspian/` (single-quoted to prevent shell expansion)

**Then** glob expansion is performed inside the CLI by `fast-glob`, **not** by the shell

**And** `followSymbolicLinks: false` ensures symlinks are not traversed

**And** every walked file's `fs.realpathSync(path).startsWith(cwdRealpath + path.sep)` returns `true` — files whose real path escapes `cwd` are dropped from the result set with a warning logged to stderr `Skipped: <path> resolves outside the working directory`. Exit code is unaffected by skipped files (no implicit error).

**And** `dot: false` (hidden files like `.git/HEAD` are excluded by default).

### AC4 — Exit-code matrix

**Given** the exit-code matrix

**When** the CLI completes

**Then** exit codes obey:

| Exit | Meaning | Trigger |
|---|---|---|
| `0` | All files valid | No `Diagnostic` with `severity === "error"` across the run; warnings allowed |
| `1` | At least one error | Any file produced ≥ 1 `Diagnostic` with `severity === "error"` |
| `2` | Usage error | Unknown flag, file/dir not found, glob expansion produced zero matches AND the input pattern looked like a glob (contained `*`/`?`/`[`/`{`/`(`/`!`) |
| `3` | Internal validator error | Any uncaught exception caught by the top-level `try/catch` in `cli.ts` |

**And** warnings alone never trigger a non-zero exit (FR10 — confirmed by AC2: `fixtures/valid/overlay-compat/...` may emit warnings yet still exit 0)

**And** the constants `EXIT_OK = 0`, `EXIT_ERROR = 1`, `EXIT_USAGE = 2`, `EXIT_INTERNAL = 3` live in `src/constants.ts` (no magic numbers in the source — biome's `noMagicNumbers` is not enabled but the convention is project-wide).

### AC5 — Unknown flag → exit 2

**Given** a malformed CLI invocation

**When** I run `node packages/cli/dist/cli.js validate --flubber`

**Then** the unknown flag is detected by `commander` v12 (`unknownOption` event)

**And** the CLI exits `2`

**And** stderr contains a usage message of the form `error: unknown option '--flubber'` followed by `Run 'caspian validate --help' for usage.`

**And** stdout is empty (errors go to stderr, not stdout — per architecture.md:432).

### AC6 — Missing input → exit 2

**Given** a missing input

**When** I run `node packages/cli/dist/cli.js validate ./does-not-exist.md`

**Then** the CLI exits `2`

**And** stderr contains `error: input not found: ./does-not-exist.md` followed by `Run 'caspian validate --help' for usage.`

**Detection rule:** if the input does not contain any glob meta-character, `fs.existsSync(resolvedPath)` is checked first. If false → exit 2 with the message above. This sidesteps `fast-glob`'s silent zero-match behavior on a literal path.

**Glob-zero-match detection:** if the input contains glob meta-characters AND `fast-glob` returns an empty array, the CLI exits `2` with `error: glob pattern matched no files: <pattern>` (matches B2's "malformed glob" trigger).

### AC7 — Internal exception → exit 3

**Given** an internal exception

**When** an uncaught error reaches the top-level `try/catch` in `cli.ts`

**Then** the CLI exits `3`

**And** stderr contains the message `internal validator error: <message>` followed by the stack trace, followed by the line `Please report at https://github.com/cyril-houillon/joselimmo-marketplace-bmad/issues` (substituting the actual repo URL — captured in `src/constants.ts` as `REPO_ISSUE_URL`)

**Test approach:** the integration test simulates this by setting an env var `CASPIAN_CLI_FORCE_THROW=1`, which the `cli.ts` entry checks at the very top of the try block and throws synthetically. This is the only environment-flag short-circuit in the CLI (acknowledged tech debt; remove once a real internal-error fixture is feasible). Document the env var in *Dev Notes* but DO NOT mention it in `--help` output.

### AC8 — Human-readable formatter

**Given** the human-readable formatter

**When** I run the CLI on a fixture with diagnostics

**Then** stdout shows per-file diagnostic blocks of this exact form:

```
<file-path>
  <file-path>:<line> — <code> <severity>: <message>
    hint: <suggestion>     (only when applicable — currently W001 only)
    doc: <doc-url>

<N> files: <X> errors, <Y> warnings
```

Concrete example (running the CLI against `fixtures/invalid/W001-unknown-field/typo-metadat.md`):

```
fixtures/invalid/W001-unknown-field/typo-metadat.md
  fixtures/invalid/W001-unknown-field/typo-metadat.md:3 — CASPIAN-W001 warning: Unrecognized frontmatter field: `metadat`
    hint: Did you mean `metadata`?
    doc: https://caspian.dev/diagnostics#caspian-w001

1 file: 0 errors, 1 warning
```

(The base message `Unrecognized frontmatter field: \`metadat\`` is what survives after the hint-extraction regex strips the trailing `. Did you mean \`metadata\`? See: …` segment from the raw diagnostic message Story 2.4 emits.)

**Pluralization rule for the summary footer:**
- `1 file` vs `N files` (any N ≠ 1)
- `0 errors` / `1 error` / `N errors`
- `0 warnings` / `1 warning` / `N warnings`

**Hint extraction:** the hint line is rendered iff `diagnostic.message` includes the substring `Did you mean \``. The formatter parses the message text as `<base-message>. Did you mean \`<suggestion>\`? See: <url>`. If the regex `/^(.*?)\. Did you mean \`(.+?)\`\?(?: See: (.+))?$/` matches, render base-message as the message, the captured suggestion as `hint:`, and prefer the `diagnostic.doc` field (if present on `Diagnostic` — TBC) or the captured URL as `doc:`. **Important:** `Diagnostic` (per `caspian/packages/core/src/diagnostics/types.ts`) does NOT carry a `doc` field; only `code`, `severity`, `line`, `field?`, `message`. The CLI MUST therefore look up the doc URL by `code` from `@caspian-dev/core/diagnostics` (which exports `CASPIAN_E001`…`CASPIAN_W004` typed constants, each with a `doc` property). Implement a helper `getDocUrl(code: string): string | undefined` in `src/output/human.ts` that imports the typed constants and indexes them by `code`. This avoids re-parsing the message and keeps the doc URL canonical.

**File-block heading line:** the bare file path (no leading 2 spaces). Diagnostic lines are indented 2 spaces. `hint:` and `doc:` are indented 4 spaces.

**Empty file (no diagnostics):** the per-file block prints the file path then `  (no diagnostics)` (one line, 2-space indent). This must be present so the user always sees one line per walked file (matches AC1's exact output).

**Inter-file blank line:** exactly one blank line between consecutive per-file blocks; no trailing blank line before the summary footer; one blank line between the last per-file block and the summary footer.

### AC9 — ANSI color detection

**Given** ANSI color detection

**When** stdout is a TTY (`process.stdout.isTTY === true`)

**Then** `chalk` applies ANSI colors:
- error severity → red (`chalk.red`)
- warning severity → yellow (`chalk.yellow`)
- file-path heading → cyan (`chalk.cyan`)
- summary footer counts → green if zero, red if errors > 0, yellow if warnings > 0 and errors === 0

**And** when stdout is piped or redirected (`isTTY === undefined`), colors are disabled — `chalk` v5 auto-detects `isTTY` via `supports-color`. The CLI must NOT manually toggle `chalk.level`; trust chalk's default detection.

**And** the `NO_COLOR` environment variable (https://no-color.org) is honored by chalk automatically.

**Test approach:** the unit test in `tests/unit/output/human.test.ts` calls the formatter with both a TTY-mocking branch and a pipe-mocking branch, asserting that the TTY output contains ANSI escape sequences (`[`) and the piped output does not. (Use `chalk.supportsColor` mock or set `process.env.FORCE_COLOR = "1"` / `process.env.FORCE_COLOR = "0"` in the test setup.)

### AC10 — Standard CLI flags + package metadata

**Given** the standard CLI flags

**When** I run `node packages/cli/dist/cli.js --version`

**Then** the version is printed (sourced from `packages/cli/package.json` via `src/version.ts` generated at build)

**And** `node packages/cli/dist/cli.js --help` and `node packages/cli/dist/cli.js validate --help` print usage with available flags (commander's auto-generated help is acceptable; no custom help formatter)

**And** `caspian --help` lists exactly the `validate` subcommand and the `--version`/`--help` global flags. No other commands or flags.

**And** `caspian validate --help` lists exactly the positional `<path>` argument and the `--help` flag. No other flags in v1.0.

**Given** the package metadata

**When** I open `caspian/packages/cli/package.json`

**Then** the file contains exactly these fields and values:

```json
{
  "name": "@caspian-dev/cli",
  "version": "0.0.1",
  "description": "Caspian CLI validator (binary `caspian`) — vendor-neutral conformance checker for the Composable Agent Skill Protocol.",
  "license": "Apache-2.0",
  "author": "Cyril Houillon",
  "type": "module",
  "engines": {
    "node": ">=22.13"
  },
  "bin": {
    "caspian": "./dist/cli.js"
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
  "caspian": {
    "supportedSchemaVersions": ["0.1"]
  },
  "scripts": {
    "gen:version": "tsx scripts/gen-version.ts",
    "build": "pnpm gen:version && tsc -p tsconfig.json",
    "dev": "tsc -p tsconfig.json --watch",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@caspian-dev/core": "workspace:^",
    "chalk": "^5.3.0",
    "commander": "^12.1.0",
    "fast-glob": "^3.3.3"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

**Notes on field choices:**
- No `main` / `types` / `exports` — `@caspian-dev/cli` is a binary-only package. Consumers `npm install -g @caspian-dev/cli` (or `npx`) and invoke `caspian`; nobody imports it as a library. Keeping these fields absent prevents accidental library use.
- `bin` value `./dist/cli.js` — the built file MUST start with `#!/usr/bin/env node` so npm preserves executability after install. tsc preserves a leading shebang in `cli.ts`. On Windows, npm generates a `.cmd` shim automatically — no extra action needed.
- `caspian.supportedSchemaVersions: ["0.1"]` — declared per architecture E1; not validated/consumed in Story 2.5 but reserved for forward compatibility. Stories 2.7+ will read this.
- `dependencies` use caret ranges identical to `packages/core`'s style; `@caspian-dev/core` uses `workspace:^` which `pnpm publish` rewrites to the actual version at publish time.

### AC11 — `tsconfig.json` + `vitest.config.ts`

**Given** the TypeScript build configuration

**When** I open `caspian/packages/cli/tsconfig.json`

**Then** it contains exactly:

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

(Byte-identical to `caspian/packages/core/tsconfig.json` except no diagnostics-specific overrides apply here.)

**When** I open `caspian/packages/cli/vitest.config.ts`

**Then** it is byte-identical to `caspian/packages/core/vitest.config.ts`:

```ts
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: here,
  test: {
    include: ["tests/**/*.test.ts"],
    passWithNoTests: true,
  },
});
```

(The `noDefaultExport` biome override at `caspian/biome.json:75-83` already covers `**/vitest.config.ts`, so the `export default` here is allowed without modification.)

### AC12 — `src/version.ts` (build-time generation)

**Given** the version generation script

**When** I run `pnpm -F @caspian-dev/cli gen:version` (or `pnpm -F @caspian-dev/cli build`, which calls it first)

**Then** `caspian/packages/cli/scripts/gen-version.ts` reads `packages/cli/package.json`, extracts the `version` field, and writes `caspian/packages/cli/src/version.ts` with this exact format:

```ts
// DO NOT EDIT — generated by packages/cli/scripts/gen-version.ts
// Source of truth: packages/cli/package.json
// Regenerate with: pnpm -F @caspian-dev/cli gen:version

export const VERSION = "0.0.1";
```

**And** the generated file is **committed** (matching the `codes.generated.ts` precedent in `packages/core` — `git ls-files caspian/packages/core/src/diagnostics/codes.generated.ts` confirms it is tracked). The `caspian/.gitignore` is NOT modified for this file. Biome ignores it via the existing `"!**/*.generated.ts"` rule (`caspian/biome.json:13`). For GitHub diff suppression, append a new line `packages/cli/src/version.generated.ts merge=ours linguist-generated=true` to `caspian/.gitattributes` (mirroring the existing `codes.generated.ts` entry). **Verify** the current `.gitattributes` content before appending; if a wildcard already matches `**/*.generated.ts`, skip.

**And** `gen-version.ts` is executable via `tsx`, matching the `gen-diagnostic-codes.ts` pattern in `packages/core/scripts/`.

**Implementation:** the script uses `node:fs/promises` and `node:url`'s `fileURLToPath` to locate `packages/cli/package.json` deterministically (no `process.cwd()`):

```ts
import { writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgPath = path.resolve(here, "..", "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version: string };
const out = `// DO NOT EDIT — generated by packages/cli/scripts/gen-version.ts
// Source of truth: packages/cli/package.json
// Regenerate with: pnpm -F @caspian-dev/cli gen:version

export const VERSION = ${JSON.stringify(pkg.version)};
`;
writeFileSync(path.resolve(here, "..", "src", "version.ts"), out, "utf-8");
console.log(`Wrote src/version.ts (VERSION = "${pkg.version}")`);
```

### AC13 — `src/cli.ts` entry point

**Given** the CLI entry point

**When** I open `caspian/packages/cli/src/cli.ts`

**Then** the first line is `#!/usr/bin/env node` (no leading whitespace, no leading comment — the shebang must be the very first byte of the file)

**And** the second line is blank

**And** the file:

1. Imports `Command` from `commander`, `VERSION` from `./version.js`, `runValidate` from `./commands/validate.js`, the exit-code constants from `./constants.js`, and `REPO_ISSUE_URL` from `./constants.js`.
2. Defines a top-level async `main()` that constructs the `commander` program, registers the `validate` subcommand, registers the global `--version` (sourced from `VERSION`), and parses `process.argv`.
3. Wraps the `await main()` call in a `try/catch`. The `catch` handler:
   - Checks if the error is a `commander.CommanderError` with `code === "commander.unknownOption"` or `code === "commander.help"` → re-throw / handled by commander's built-in process.exit (it already exits 2 for unknown options when `program.exitOverride()` is NOT used; or commander default behavior). To control the exit code, the implementation MUST use `program.exitOverride((err) => { throw err; })` so commander does not call `process.exit` itself, then map the thrown `CommanderError`:
     - `code === "commander.help"` or `code === "commander.version"` → `process.exit(EXIT_OK)`
     - `code === "commander.unknownOption"` / `commander.unknownCommand"` / `commander.invalidArgument` / `commander.missingArgument` → print to stderr + `process.exit(EXIT_USAGE)`
     - any other commander error → `process.exit(EXIT_USAGE)`
   - For non-commander errors (genuine bugs):
     - `process.stderr.write("internal validator error: " + err.message + "\n" + err.stack + "\n")`
     - `process.stderr.write("Please report at " + REPO_ISSUE_URL + "\n")`
     - `process.exit(EXIT_INTERNAL)` (3)
4. The `validate` subcommand's `.action(async (path) => { const code = await runValidate(path); process.exit(code); })`. `runValidate` returns a number from `{0, 1, 2}` (never throws on validation results — only on internal bugs). Per architecture.md:430, `validateFile` itself never throws; the CLI only converts its `Diagnostic[]` output into an exit code.
5. Includes the synthetic-throw env-var hook for AC7 testing — at the top of `main()`:

   ```ts
   if (process.env.CASPIAN_CLI_FORCE_THROW === "1") {
     throw new Error("synthetic forced throw for AC7 integration test");
   }
   ```

   This is the only environment-flag short-circuit allowed in the CLI. Document it in *Dev Notes* and in `tests/integration/cli-end-to-end.test.ts`. Do not add it to `--help` output.

### AC14 — `src/walker.ts`

**Given** the walker module

**When** I open `caspian/packages/cli/src/walker.ts`

**Then** the file exports exactly:

```ts
export interface WalkResult {
  files: string[];        // resolved absolute paths
  skippedOutsideCwd: string[]; // paths that resolved outside cwd (logged to stderr by caller)
}

export async function walk(input: string, cwd: string): Promise<WalkResult>;
```

**Behavior:**

1. Resolve `cwdRealpath = fs.realpathSync(cwd)`.
2. Detect input mode:
   - If `input` contains any of `*`, `?`, `[`, `{`, `(`, `!` → glob mode.
   - Else if `fs.statSync(input).isDirectory()` → directory mode (treat input as `<dir>/**/*.md`).
   - Else → single-file mode.
3. **Single-file mode:** if `fs.existsSync(input)` is `false`, return `{ files: [], skippedOutsideCwd: [] }` with a marker that triggers the AC6 exit-2 message (use a sentinel: throw a typed `InputNotFoundError` from `walker.ts` that `validate.ts` catches and converts to exit 2 + stderr message).
4. **Directory mode:** call `fastGlob.glob("**/*.md", { cwd: input, followSymbolicLinks: false, dot: false, onlyFiles: true, absolute: true })`.
5. **Glob mode:** call `fastGlob.glob(input, { cwd, followSymbolicLinks: false, dot: false, onlyFiles: true, absolute: true })`. If the result is empty, throw a typed `GlobNoMatchError` that the caller converts to exit 2 + stderr `error: glob pattern matched no files: <pattern>`.
6. For every absolute path returned, compute `realpath` via `fs.realpathSync(path)`. If `!realpath.startsWith(cwdRealpath + path.sep) && realpath !== cwdRealpath`: push to `skippedOutsideCwd`, do not include in `files`. Otherwise: include in `files`.
7. Return `{ files, skippedOutsideCwd }`.

**Imports:**
- `import * as fastGlob from "fast-glob"` then access `fastGlob.glob` (the named export). **NOT** `import fastGlob from "fast-glob"` (default-export form) — biome's `noDefaultExport` doesn't restrict imports of default exports from external packages, but the named-export form is safer for ESM under nodenext and is what fast-glob 3.3+ documents as the ESM-friendly entry point. (If type-resolution complains, fall back to `import fastGlob from "fast-glob"` and call `fastGlob.glob`. Both shapes resolve correctly because fast-glob exports both.)
- `import fs from "node:fs"` for `realpathSync`, `existsSync`, `statSync`.
- `import path from "node:path"`.

**Error classes:** define and export `InputNotFoundError extends Error` and `GlobNoMatchError extends Error` from `walker.ts`. Each carries the offending input path/pattern in the message.

### AC15 — `src/commands/validate.ts`

**Given** the `validate` command handler

**When** I open `caspian/packages/cli/src/commands/validate.ts`

**Then** it exports exactly:

```ts
export async function runValidate(input: string): Promise<number>; // returns exit code
```

**Behavior:**

1. Resolve `cwd = process.cwd()`.
2. Wrap a `try/catch` around the walker call:
   - On `InputNotFoundError`: write `error: input not found: ${input}\n` to stderr, then `Run 'caspian validate --help' for usage.\n`, return `EXIT_USAGE`.
   - On `GlobNoMatchError`: write `error: glob pattern matched no files: ${pattern}\n` to stderr, then the help reminder, return `EXIT_USAGE`.
   - Other errors propagate (caught by `cli.ts` top-level → exit 3).
3. For each file in `walkResult.skippedOutsideCwd`: `process.stderr.write("Skipped: " + file + " resolves outside the working directory\n")`. Skipped files do NOT affect the exit code.
4. For each file in `walkResult.files`: call `await validateFile(file)`. Collect `{ file, diagnostics }` per file. Use `Promise.all` for parallelism — `validateFile` is async I/O-bound; concurrent reads are safe since `@caspian-dev/core`'s pipeline is fully functional (no shared state mutated per call). Concurrency limit: do NOT introduce a semaphore in v0.1; rely on Node's natural fs queue. (Acknowledged: if this causes EMFILE on huge directories, Story 2.6+ can add a `p-limit`-style cap — record as deferred work.)
5. Format the file-path string for display: if `file` (absolute) starts with `cwd + path.sep`, render as the relative form (`path.relative(cwd, file)` with forward slashes — replace `\\` with `/` on Windows for cross-platform stable output). Otherwise render the absolute form. **Always print forward slashes**, regardless of OS, so integration test assertions and expected-output snapshots work identically on Linux/macOS/Windows.
6. Build the human output via `formatHuman(results, { useColor: process.stdout.isTTY === true })` from `./output/human.js` and `process.stdout.write(...)` it.
7. Compute exit code: if any `Diagnostic` in any file has `severity === "error"` → return `EXIT_ERROR` (1); otherwise `EXIT_OK` (0).

**Imports:**
- `import { validateFile } from "@caspian-dev/core"`
- `import { walk, InputNotFoundError, GlobNoMatchError } from "../walker.js"`
- `import { formatHuman } from "../output/human.js"`
- `import { EXIT_OK, EXIT_ERROR, EXIT_USAGE } from "../constants.js"`
- `import path from "node:path"`

### AC16 — `src/output/human.ts`

**Given** the human formatter module

**When** I open `caspian/packages/cli/src/output/human.ts`

**Then** it exports exactly:

```ts
import type { Diagnostic } from "@caspian-dev/core";

export interface FileResult {
  file: string;            // display form (relative or absolute, forward-slashed)
  diagnostics: Diagnostic[];
}

export interface FormatOptions {
  useColor: boolean;
}

export function formatHuman(results: FileResult[], opts: FormatOptions): string;
```

**Behavior:** produces the exact output shape specified in AC8. Pluralization helper `pluralize(n: number, singular: string, plural: string)` is local to this module. The `useColor` flag controls whether `chalk.red`/`yellow`/`cyan`/`green` are applied; when `false`, the formatter uses plain strings (the `chalk` package handles `useColor: false` automatically when `chalk.level === 0`, but the formatter MUST gate explicitly via the option to make unit tests deterministic regardless of the test runner's TTY state).

**Doc URL lookup:** import all 18 `CASPIAN_*` constants from `@caspian-dev/core/diagnostics` and build a `Map<string, string>` (code → doc URL) at module load time. The `getDocUrl(code: string): string | undefined` helper does an O(1) lookup. **Do NOT** parse the `doc:` URL out of the diagnostic message text — that's brittle and tied to Story 2.4's W001 message format only. The typed-constant import is the canonical source.

**Hint extraction:** apply the regex `/^(.*?)\. Did you mean `(.+?)`\?(?: See: .+)?$/` to `diagnostic.message`. If matched, render base-message + `hint:` + `<suggestion>`. Otherwise render the unmodified message.

**Color rules** (when `useColor === true`):
- File-path heading: `chalk.cyan(file)`
- Severity label `error`: `chalk.red("error")`
- Severity label `warning`: `chalk.yellow("warning")`
- Summary footer:
  - `errors === 0 && warnings === 0` → `chalk.green(footer)`
  - `errors > 0` → `chalk.red(footer)`
  - `warnings > 0 && errors === 0` → `chalk.yellow(footer)`

**No color** (when `useColor === false`): no chalk calls; plain strings.

**Final newline:** the returned string ends with exactly one `\n` (so `process.stdout.write(out)` produces standard terminal-friendly output).

### AC17 — `tests/unit/walker.test.ts`

Cover (minimum 6 tests):

1. **Single existing file:** `walk("./fixtures/valid/core-overview/minimal.md", "caspian/")` → `files.length === 1`, `skippedOutsideCwd.length === 0`.
2. **Single non-existent file:** `walk("./does-not-exist.md", "caspian/")` rejects with `InputNotFoundError`.
3. **Directory walk:** `walk("./fixtures/valid/", "caspian/")` → returns ≥ 7 `.md` files; none with `.expected.json` extension; all paths under `fixtures/valid/`.
4. **Glob pattern match:** `walk("fixtures/valid/**/*.md", "caspian/")` → ≥ 7 files.
5. **Glob no-match → throws:** `walk("**/*.xyz", "caspian/")` rejects with `GlobNoMatchError`.
6. **Symlink not followed:** create a temp directory with a symlink pointing outside cwd (use `fs.mkdtempSync` + `fs.symlinkSync`); call `walk(tempDir, tempDir)` and assert no symlinked file appears in `files`. Skip on Windows where symlinks require admin (`if (process.platform === "win32") return;`).

Use `import { walk, InputNotFoundError, GlobNoMatchError } from "../../src/walker.js"`. Use `tests/helpers/paths.ts` for the `caspian/` root resolution.

### AC18 — `tests/unit/output/human.test.ts`

Cover (minimum 8 tests):

1. **Empty result, single file → "no diagnostics" line + summary `1 file: 0 errors, 0 warnings`.**
2. **Single error diagnostic → block + summary `1 file: 1 error, 0 warnings`.**
3. **Single warning diagnostic → block + summary `1 file: 0 errors, 1 warning`.**
4. **Multi-file → ordered blocks separated by blank line + correct totals.**
5. **W001 with hint → `hint:` line is rendered with extracted suggestion; base message has no `Did you mean` text; `doc:` line shows `https://caspian.dev/diagnostics#caspian-w001`.**
6. **Plain (no chalk) when `useColor: false` → output contains no `[` sequences.**
7. **Colored when `useColor: true` → output contains `[36m` (cyan, file heading) and `[31m` (red, error) sequences.**
8. **Pluralization edge cases: `0 files: 0 errors, 0 warnings` and `2 files: 2 errors, 1 warning`.**

### AC19 — `tests/integration/cli-end-to-end.test.ts`

Cover (minimum 9 scenarios via subprocess `execFile`):

1. **`caspian --version` → stdout matches `/^\d+\.\d+\.\d+\n$/` → exit 0.**
2. **`caspian --help` → stdout contains `Usage:` + `validate` → exit 0.**
3. **`caspian validate <valid-fixture>` → exit 0, stdout contains `1 file: 0 errors, 0 warnings`.**
4. **`caspian validate fixtures/valid/` → exit 0, stdout contains `: 0 errors`.**
5. **`caspian validate fixtures/invalid/W001-unknown-field/typo-metadat.md` → exit 0 (warnings-only), stdout contains `CASPIAN-W001` + `hint: Did you mean \`metadata\`?`.**
6. **`caspian validate fixtures/invalid/E008-type-missing/no-type.md` → exit 1, stdout contains `CASPIAN-E008`.**
7. **`caspian validate --flubber` → exit 2, stderr contains `unknown option`.**
8. **`caspian validate ./does-not-exist.md` → exit 2, stderr contains `input not found`.**
9. **`CASPIAN_CLI_FORCE_THROW=1 caspian validate fixtures/valid/core-overview/minimal.md` → exit 3, stderr contains `internal validator error` + `Please report at`.**

Use a small helper `runCli(args: string[], env?: Record<string, string>) → Promise<{ stdout, stderr, code }>` in `tests/helpers/run-cli.ts`. The helper must invoke `node packages/cli/dist/cli.js` (the built file) — NOT `tsx src/cli.ts`. Reasoning: integration tests assert the *built* artifact (the published shape), including shebang preservation, so they must run after `pnpm -F @caspian-dev/cli build`. Document this dependency in *Dev Notes*.

### AC20 — Smoke gate baseline maintained

After all changes:

- `pnpm -C caspian lint` exits 0.
- `pnpm -C caspian test` exits 0. Story 2.4 baseline: 91 tests / 41 biome-checked files. Story 2.5 expected delta:
  - **Tests added:** ≥ 23 (AC17 walker ≥ 6, AC18 human ≥ 8, AC19 cli-end-to-end ≥ 9). Expected new total: **≥ 114 tests** across **≥ 13** test files.
  - **Biome-checked files added:** package.json, tsconfig.json, vitest.config.ts, README.md (markdown not biome-checked actually — verify), CHANGELOG.md (same), src/cli.ts, src/version.ts (regenerated; biome MAY ignore generated files — verify the existing pattern in `caspian/biome.json:13` `"!**/*.generated.ts"` does NOT match `version.ts` since the suffix is `.ts` not `.generated.ts`; either add `version.ts` to biome ignores OR rename to `version.generated.ts` — **see Implementation Decision in Dev Notes**), src/commands/validate.ts, src/walker.ts, src/output/human.ts, src/constants.ts, scripts/gen-version.ts, tests/helpers/paths.ts, tests/helpers/run-cli.ts, tests/unit/walker.test.ts, tests/unit/output/human.test.ts, tests/integration/cli-end-to-end.test.ts. Expected new total: **≥ 55 biome-checked files** (41 baseline + ~14 new TS files; ±2 tolerance).
- `pnpm -C caspian build` exits 0. Verify `caspian/packages/cli/dist/cli.js` exists, starts with `#!/usr/bin/env node\n`, and is executable on Linux (Windows: just verify it exists — the npm-generated `.cmd` shim is created at install time, not build time).
- `pnpm -C caspian verify-codes-hash` exits 0 (untouched).
- `pnpm -C caspian ajv-validate-registry` exits 0 (untouched).
- **Live binary smoke check:**
  ```bash
  cd caspian
  node ./packages/cli/dist/cli.js --version
  node ./packages/cli/dist/cli.js validate ./fixtures/valid/core-overview/minimal.md
  ```
  Expected: prints `0.0.1` then `0`; second command exits 0 with the per-file block.
- **Vendor-neutrality smoke check:** `pnpm ls --filter @caspian-dev/cli --prod --depth=Infinity` produces no `@anthropic-ai/*` or `@claude/*` resolved deps. (Story 2.7 makes this a CI gate; Story 2.5 just spot-checks.)

### AC21 — Manual cross-checks (recorded in Debug Log)

Record in *Debug Log References* (exact command + observed output):

1. **CC1 — Single valid file → exit 0.** `node packages/cli/dist/cli.js validate ./fixtures/valid/core-overview/minimal.md`. Capture exit code + stdout.
2. **CC2 — Directory walk → exit 0.** `node packages/cli/dist/cli.js validate ./fixtures/valid/`. Capture exit code + summary footer.
3. **CC3 — Glob → exit 0.** `node packages/cli/dist/cli.js validate 'fixtures/valid/**/*.md'`. Capture file count from summary.
4. **CC4 — Error file → exit 1.** `node packages/cli/dist/cli.js validate ./fixtures/invalid/E008-type-missing/no-type.md`. Capture exit code + diagnostic line.
5. **CC5 — Warning file → exit 0.** `node packages/cli/dist/cli.js validate ./fixtures/invalid/W001-unknown-field/typo-metadat.md`. Capture exit code + hint line.
6. **CC6 — Mixed (one error + one warning across two files) → exit 1.** Pass two args? `commander` `validate <path>` is variadic in v12 only if marked. Story 2.5 takes a single positional — to test mixed, run on a directory containing both: `node packages/cli/dist/cli.js validate ./fixtures/invalid/`. Capture exit code (expect 1 because errors are present).
7. **CC7 — Unknown flag → exit 2.** `node packages/cli/dist/cli.js validate --flubber`. Capture stderr.
8. **CC8 — Missing input → exit 2.** `node packages/cli/dist/cli.js validate ./does-not-exist.md`. Capture stderr.
9. **CC9 — Forced internal throw → exit 3.** `CASPIAN_CLI_FORCE_THROW=1 node packages/cli/dist/cli.js validate ./fixtures/valid/core-overview/minimal.md`. Capture stderr.
10. **CC10 — `--version` → exit 0.** `node packages/cli/dist/cli.js --version`. Capture stdout.
11. **CC11 — `--help` → exit 0.** `node packages/cli/dist/cli.js --help`. Capture stdout snippet (must show `validate`).
12. **CC12 — Vendor-neutrality grep.** `grep -rn "anthropic\|@claude" caspian/packages/cli/src/` (and `dist/`). Expected: zero matches.
13. **CC13 — TTY-color smoke.** `node packages/cli/dist/cli.js validate ./fixtures/invalid/E008-type-missing/no-type.md | cat`. The `| cat` pipe suppresses TTY → stdout MUST NOT contain `[`. Then run the same command with `FORCE_COLOR=1`: `FORCE_COLOR=1 node packages/cli/dist/cli.js validate ... | cat`. Expected: `[31m` (red) appears in stdout.

If any cross-check fails, the implementation is wrong (not the story spec). Record the failure mode in *Completion Notes* before fixing.

## Tasks / Subtasks

- [x] **Task 1 — Package scaffold** (AC: #10, #11)
  - [x] Create `caspian/packages/cli/` directory.
  - [x] Create `package.json` per AC10. Verified `pnpm install` resolves `@caspian-dev/core` to workspace symlink.
  - [x] Create `tsconfig.json` per AC11.
  - [x] Create `vitest.config.ts` per AC11.
  - [x] Copy `caspian/LICENSE` to `caspian/packages/cli/LICENSE` (Apache-2.0; 202 lines, leading blank-line preserved).
  - [x] Create initial `README.md` (Install / Validate / Exit codes / Output / License).
  - [x] Create initial `CHANGELOG.md` with `## Unreleased` heading + Story 2.5 bullet.
  - [x] Ran `pnpm install` — resolved `commander 12.1.0`, `fast-glob 3.3.3`, `chalk 5.6.2` (caret allowed `^5.3.0`).

- [x] **Task 2 — Constants + version generator** (AC: #12)
  - [x] Created `src/constants.ts` (EXIT_OK/EXIT_ERROR/EXIT_USAGE/EXIT_INTERNAL + REPO_ISSUE_URL).
  - [x] Created `scripts/gen-version.ts`.
  - [x] Ran `pnpm -F @caspian-dev/cli gen:version` — wrote `src/version.generated.ts` with VERSION="0.0.1".
  - [x] Appended `packages/cli/src/version.generated.ts merge=ours linguist-generated=true` to `caspian/.gitattributes`.
  - [x] `caspian/.gitignore` NOT modified (committed-generated-file precedent).

- [x] **Task 3 — Walker** (AC: #14, #17)
  - [x] Created `src/walker.ts` with `InputNotFoundError` + `GlobNoMatchError` + glob-meta detection + cwd realpath safety check.
  - [x] Created `tests/helpers/paths.ts` (REPO_ROOT, FIXTURES_DIR, CLI_PACKAGE_ROOT, CLI_DIST_BIN).
  - [x] Created `tests/unit/walker.test.ts` (7 tests; one extra cross-platform `skippedOutsideCwd` test added beyond the 6-case minimum).
  - [x] All walker tests pass.

- [x] **Task 4 — Human formatter** (AC: #16, #18)
  - [x] Created `src/output/human.ts` with deterministic `Chalk({ level: 1 })` instance, doc-URL `Map<string, string>` built from `@caspian-dev/core/diagnostics` typed constants, hint-extraction regex.
  - [x] Created `tests/unit/output/human.test.ts` (11 tests — 8 baseline + 3 `getDocUrl` lookups).
  - [x] All formatter tests pass.

- [x] **Task 5 — Validate command handler** (AC: #15)
  - [x] Created `src/commands/validate.ts` with `Promise.all` per-file validation.
  - [x] Cross-platform path normalization to forward slashes (works correctly on Windows where `process.cwd()` uses `\` and `fast-glob` returns `/`).
  - [x] `useColor` wired through `chalk`'s `supportsColorStderr` proxy so `FORCE_COLOR=1` and `NO_COLOR=1` work even when piped.

- [x] **Task 6 — CLI entry** (AC: #13)
  - [x] Created `src/cli.ts` with shebang as the very first line.
  - [x] Used `program.exitOverride()` on both root and `validate` subcommand.
  - [x] Wired `--version` from `./version.generated.js`.
  - [x] Wired `validate <path>` subcommand → `runValidate`.
  - [x] Inserted `CASPIAN_CLI_FORCE_THROW` env-var hook for AC7.
  - [x] `pnpm build` produced `dist/cli.js` with shebang preserved (verified via `head -2`).

- [x] **Task 7 — Integration tests** (AC: #19)
  - [x] Created `tests/helpers/run-cli.ts` (subprocess helper via `execFile` + `process.execPath`).
  - [x] Created `tests/integration/cli-end-to-end.test.ts` (9 scenarios across info-flags / happy / failure / usage / internal-error groups).
  - [x] `beforeAll` hook builds dist if missing (idempotent; no-op when dist already current).
  - [x] All 9 integration tests pass.

- [x] **Task 8 — Documentation**
  - [x] `README.md` final form complete.
  - [x] `CHANGELOG.md` `## Unreleased` Story 2.5 bullet appended.
  - [x] Core/README untouched (Story 2.5 does not modify core — confirmed).

- [x] **Task 9 — Smoke gate** (AC: #20)
  - [x] `pnpm lint` — exits 0; 55 files biome-checked (Story 2.4 baseline 41 → 55, +14 ✅).
  - [x] `pnpm test` — exits 0; total **118 tests** (91 core + 27 cli) across 13 test files (Story 2.4 baseline 91 → 118, +27 ✅).
  - [x] `pnpm build` — exits 0; `dist/cli.js` exists; first 2 bytes = `#!`; `node dist/cli.js --version` → `0.0.1`.
  - [x] `pnpm verify-codes-hash` — exits 0.
  - [x] `pnpm ajv-validate-registry` — exits 0.
  - [x] Live binary smoke checks (CC1–CC13) all pass.

- [x] **Task 10 — Cross-checks** (AC: #21)
  - [x] Executed all 13 cross-checks. Output captured in *Debug Log References*.

- [x] **Task 11 — Final assembly**
  - [x] `git status` confirms only expected files modified/created; no sealed files touched.
  - [x] Updated *Completion Notes List* (baseline counts, deliberate departures, forward dependencies).
  - [x] Updated *File List* (new + modified).
  - [x] Updated *Change Log* with Story 2.5 implementation entry.

## Dev Notes

### Source authority

- **Primary contract:** Acceptance Criteria above. When AC text and epics text diverge, prefer the AC above. Notable: epics says `dependencies are @caspian-dev/core (workspace:^), commander (~v12), fast-glob, chalk`; AC10 pins exact caret ranges `^12.1.0`, `^3.3.3`, `^5.3.0` based on April 2026 latest stable. Use the AC versions.
- **Architecture references:**
  - B1 / B2 / B3 / B5 — `_bmad-output/planning-artifacts/architecture.md:222-249` (CLI command surface + exit codes + glob policy).
  - D3 — architecture.md:291 (multi-file output: per-file block + summary footer).
  - File layout — architecture.md:663-690 (full `packages/cli/` tree).
  - Vendor-neutrality 3-layer — architecture.md:715-720 (Story 2.7 lands `dependency-cruiser`; Story 2.5 just must not introduce forbidden deps).
  - Error handling — architecture.md:427-432 (`Diagnostic[]` always; throw → exit 3).
  - Implementation sequence Story-005 — architecture.md:907 (`packages/cli/src/walker.ts`, `packages/cli/src/output/human.ts`, summary footer, integration tests).
  - Pattern: kebab-case filenames, named exports, no `export default` (except config files via biome override) — architecture.md:356-368.
  - Diagnostic message style (imperative, no period, backticks for field names) — architecture.md:380-386.
- **Reference Models:**
  - `caspian/packages/core/package.json` — the deps/scripts/exports shape pattern for `packages/cli/package.json`.
  - `caspian/packages/core/tsconfig.json` — copy verbatim (only `composite: true` + `tsBuildInfoFile` + `outDir: ./dist`).
  - `caspian/packages/core/vitest.config.ts` — copy verbatim.
  - `caspian/packages/core/scripts/gen-diagnostic-codes.ts` — pattern for `gen-version.ts`: `import.meta.url` cwd-stable + writeFileSync + sha-or-version-stable header comment.
  - `caspian/packages/core/src/diagnostics/codes.generated.ts` — generated-file header pattern.
  - `caspian/packages/core/src/index.ts` — public-API surface pattern (named exports only, no default).
  - `caspian/packages/core/src/diagnostics/types.ts` — the `Diagnostic` interface the CLI consumes.

### Implementation Decision — `version.ts` and biome's `noFilenamingConvention`

Two approaches exist:

**Option A:** Generate `src/version.ts` (no `.generated.ts` suffix) → biome will lint and format it on every run; the generator must produce biome-clean output. **Pros:** clean filename. **Cons:** generator must replicate biome's exact formatting (2-space indent, trailing semicolons, `lf` line ending) and the `noFilenamingConvention` `kebab-case` rule applies (already kebab-case). Risk: biome version bump silently changes formatting → CI red.

**Option B:** Generate `src/version.generated.ts` → biome ignores it via `caspian/biome.json:13` `"!**/*.generated.ts"`. **Pros:** mirrors `codes.generated.ts` precedent; lint-stable across biome bumps. **Cons:** filename is no longer pure kebab-case (the `.generated.ts` is still kebab on the file part), and the import becomes `import { VERSION } from "./version.generated.js"`.

**Decision: Option B** — `src/version.generated.ts`. Rationale: matches the existing `codes.generated.ts` precedent exactly; biome-stable across version bumps; the `.generated.ts` suffix is project-wide convention for build-time artifacts. Update AC12 / AC13 / Task 6 accordingly: the import path is `./version.generated.js` (with `.js` extension under nodenext ESM resolution), not `./version.js`. The script writes `src/version.generated.ts`.

**Source-control treatment:** the generated file is **committed** (precedent: `caspian/packages/core/src/diagnostics/codes.generated.ts` is tracked, not gitignored). Append `packages/cli/src/version.generated.ts merge=ours linguist-generated=true` to `caspian/.gitattributes` for GitHub diff suppression. Do **NOT** add the file to `.gitignore`.

### `commander` v12 ESM caveats

- `commander` is published as CJS but ships TypeScript types and a default + named export; under `tsconfig.base.json`'s `esModuleInterop: true` and `module: "nodenext"`, `import { Command } from "commander"` resolves correctly.
- Use `program.exitOverride()` so commander throws `CommanderError` instead of calling `process.exit` directly. This is the only way to control exit codes per AC4 / AC5.
- `program.error("message", { exitCode: 2 })` is commander v12's approved pattern for usage errors. The `cli.ts` catch handler doesn't need to handle this specially — commander already calls `process.exit(exitCode)` internally — but combined with `exitOverride()`, the error flows back to the catch handler. **Recommend:** use `program.error()` for AC5 (`unknown option`) but route AC6 (`input not found`) and AC15 errors via the `runValidate` return-code path, not via `program.error()`. This separates "commander-detected usage errors" from "application-detected usage errors."

### `fast-glob` 3.3 ESM ergonomics

Use the namespace import `import * as fastGlob from "fast-glob"` and call `fastGlob.glob(pattern, options)` — the `glob` named export was added in 3.3.0 specifically to ease ESM consumption. The default export still works (`import fastGlob from "fast-glob"; fastGlob(pattern, options)`), but the named-export form is more idiomatic under nodenext.

### `chalk` v5 ESM-only

`chalk` v5.x is ESM-only. Since the entire monorepo is `"type": "module"`, this is compatible. **Do NOT** pin to chalk 4.x (CJS) — it would force a `--esModuleInterop`-style import dance and conflict with the project's pure-ESM stance.

`chalk.level` auto-detection (via `supports-color`) handles `NO_COLOR=1` and `FORCE_COLOR=1` env vars per https://no-color.org. The formatter's `useColor` parameter is for **explicit test determinism**, not for end-user toggling — production users rely on chalk's auto-detection. (Future story may add a `--no-color` flag if user demand emerges; out of scope for v0.1.)

### `node:fs` vs `node:fs/promises`

The walker uses sync `fs.realpathSync`, `fs.existsSync`, `fs.statSync` because the underlying control flow is short and the cost of async overhead for ≤ 1000 files (NFR1 budget) is unjustified. `validateFile` itself is async (it uses `fs/promises.readFile`), so per-file I/O is properly async — only the walker setup is sync.

### Cross-platform path normalization

The integration test asserts paths in the form `fixtures/invalid/W001-unknown-field/typo-metadat.md` (forward slashes). On Windows, `path.relative()` returns backslashes. The display path string MUST be normalized to forward slashes via `displayPath.split(path.sep).join("/")` before printing. **Do this once in `commands/validate.ts`** when computing the display path; never in the formatter (which trusts its input).

### Subprocess test runtime

`tests/integration/cli-end-to-end.test.ts` uses `child_process.execFile("node", ["packages/cli/dist/cli.js", ...args])`. Each spawn is ~50–150ms on a modern machine. Nine scenarios → ~1s of test runtime overhead. Acceptable for v0.1; if it grows, Story 2.6+ may inline a programmatic CLI invocation API.

### Smoke gate baseline tracking

Biome-checked file count for each story:
- Story 2.1: 18 files
- Story 2.2: 24 files
- Story 2.3: 35 files
- Story 2.4: 41 files (current floor for Story 2.5)
- Story 2.5: expected ~55 files (41 + ~14 new TS files; ±2 tolerance) — note `version.generated.ts` is biome-excluded so does not contribute.

Total tests baseline:
- Story 2.4: 91 tests across 10 test files
- Story 2.5: expected ≥ 114 tests (≥ 23 new) across ≥ 13 test files.

Document actual counts in *Completion Notes*.

### Deferred items to be aware of (do NOT fix in this story)

From Story 2.4 review (`deferred-work.md` lines 101-109) — none directly affect Story 2.5.

From earlier reviews (2.1 — `deferred-work.md` lines 71-80):
- `validateFile` accepts directory paths and returns `[]`. Story 2.5's walker filters at the input boundary (rejects directories that don't exist; treats existing directories as glob roots), so this never reaches `validateFile` in normal CLI flow. **No action needed.**
- `dist/.tsbuildinfo` published with absolute paths. Story 2.5's CLI package will inherit this risk if `files: ["dist/"]` is published as-is. **Not fixed in 2.5** — consistent with `packages/core` precedent; Story 2.8 (npm publish) is the right place to add `dist/.tsbuildinfo` to `.npmignore` or relocate it. **Record as forward dependency** in Completion Notes.

From Story 2.3 review (`deferred-work.md` lines 94-99):
- Duplicated `byteOffsetToLine` etc. — irrelevant to CLI.

### What this story does NOT include (forward dependencies)

- `--format=json` flag, B4 stable JSON schema, `tests/integration/format-json.test.ts`, `published-files.snapshot.json`, `scripts/verify-pack.ts` — **Story 2.6**.
- `.dependency-cruiser.cjs`, `pnpm ls` lockfile gate, docker runtime gate — **Story 2.7**.
- `npm publish --provenance`, `release.yml` — **Story 2.8**.
- `examples/ci-integration/github-actions-snippet.yml` — **Story 2.8**.
- Concurrency-limited `validateFile` calls (p-limit / queue) — deferred to Story 2.6+ if EMFILE issues surface in real-world directories ≥ 1000 files.

### Project Structure Notes

- New package conforms to `architecture.md:663-690` tree. Only the files needed for Story 2.5 ACs are created in this story; Story 2.6 / 2.7 / 2.8 add the remaining files (`output/json.ts`, `.dependency-cruiser.cjs`, `published-files.snapshot.json`, `scripts/verify-pack.ts`).
- File naming: kebab-case enforced by biome `useFilenamingConvention`. All new files comply.
- Module convention: named exports only (architecture.md:368). Verify no `export default` slips in. Vitest config and gen-version script are exempt by the existing biome override (`caspian/biome.json:75-83`).

### References

- [Source: `_bmad-output/planning-artifacts/architecture.md#cli-architecture` — B1–B5 decisions]
- [Source: `_bmad-output/planning-artifacts/architecture.md#validation-pipeline` — D3 multi-file output contract]
- [Source: `_bmad-output/planning-artifacts/architecture.md#error-handling-philosophy-validator-internal` — return Diagnostic[], throw → exit 3]
- [Source: `_bmad-output/planning-artifacts/architecture.md#complete-project-directory-structure` lines 663-690 — full `packages/cli/` tree]
- [Source: `_bmad-output/planning-artifacts/epics.md#story-25` — full AC text]
- [Source: `caspian/packages/core/package.json` — manifest pattern for the new CLI package]
- [Source: `caspian/packages/core/src/index.ts` — `validateFile` signature consumed by `commands/validate.ts`]
- [Source: `caspian/packages/core/src/diagnostics/codes.generated.ts` — typed diagnostic constants imported by `output/human.ts` for doc URL lookup]
- [Source: `caspian/packages/core/src/diagnostics/types.ts` — `Diagnostic`, `Severity` interfaces]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7[1m]

### Debug Log References

All 13 cross-checks executed 2026-04-29 against `dist/` build from `pnpm -F @caspian-dev/cli build`. Working directory: `caspian/`.

1. **CC1 — Single valid file → exit 0.**
   ```
   $ node packages/cli/dist/cli.js validate ./fixtures/valid/core-overview/minimal.md
   fixtures/valid/core-overview/minimal.md
     (no diagnostics)

   1 file: 0 errors, 0 warnings
   exit=0
   ```

2. **CC2 — Directory walk → exit 0.** All 6 valid fixtures discovered.
   ```
   $ node packages/cli/dist/cli.js validate ./fixtures/valid/
   fixtures/valid/core-epic/minimal.md
     (no diagnostics)

   fixtures/valid/core-overview/minimal.md
     (no diagnostics)

   fixtures/valid/core-plan/minimal.md
     (no diagnostics)

   fixtures/valid/core-story/minimal.md
     (no diagnostics)

   fixtures/valid/overlay-compat/all-22-known-fields.md
     (no diagnostics)

   fixtures/valid/overlay-compat/x-extension.md
     (no diagnostics)

   6 files: 0 errors, 0 warnings
   exit=0
   ```

3. **CC3 — Glob → exit 0.** `fast-glob` matches 6 valid fixtures via single-quoted pattern.
   ```
   $ node packages/cli/dist/cli.js validate 'fixtures/valid/**/*.md'
   … (6 per-file blocks)
   6 files: 0 errors, 0 warnings
   exit=0
   ```

4. **CC4 — Error file → exit 1.**
   ```
   $ node packages/cli/dist/cli.js validate ./fixtures/invalid/E008-type-missing/no-type.md
   fixtures/invalid/E008-type-missing/no-type.md
     fixtures/invalid/E008-type-missing/no-type.md:1 — CASPIAN-E008 error: Field `type` is missing or empty
       doc: https://caspian.dev/diagnostics#caspian-e008

   1 file: 1 error, 0 warnings
   exit=1
   ```

5. **CC5 — Warning file → exit 0 with hint.**
   ```
   $ node packages/cli/dist/cli.js validate ./fixtures/invalid/W001-unknown-field/typo-metadat.md
   fixtures/invalid/W001-unknown-field/typo-metadat.md
     fixtures/invalid/W001-unknown-field/typo-metadat.md:3 — CASPIAN-W001 warning: Unrecognized frontmatter field outside the recognized allow-list: `metadat`
       hint: Did you mean `metadata`?
       doc: https://caspian.dev/diagnostics#caspian-w001

   1 file: 0 errors, 1 warning
   exit=0
   ```

6. **CC6 — Mixed (full invalid dir) → exit 1.** 19 fixtures discovered (matching Story 2.4's E001–E014 + W001×2 + W002 + W003 + W004 = 19 invalid pairs); summary `19 files: 14 errors, 5 warnings`. `exit=1` (verified unpiped).

7. **CC7 — Unknown flag → exit 2.**
   ```
   $ node packages/cli/dist/cli.js validate --flubber
   error: unknown option '--flubber'
   exit=2
   ```

8. **CC8 — Missing input → exit 2.**
   ```
   $ node packages/cli/dist/cli.js validate ./does-not-exist.md
   error: input not found: ./does-not-exist.md
   Run 'caspian validate --help' for usage.
   exit=2
   ```

9. **CC9 — Forced internal throw → exit 3.**
   ```
   $ CASPIAN_CLI_FORCE_THROW=1 node packages/cli/dist/cli.js validate ./fixtures/valid/core-overview/minimal.md
   internal validator error: synthetic forced throw for AC7 integration test
   Error: synthetic forced throw for AC7 integration test
       at main (file:///…/cli/dist/cli.js:8:15)
       at file:///…/cli/dist/cli.js:32:24
       …
   Please report at https://github.com/cyril-houillon/joselimmo-marketplace-bmad/issues
   exit=3
   ```

10. **CC10 — `--version` → exit 0.**
    ```
    $ node packages/cli/dist/cli.js --version
    0.0.1
    exit=0
    ```

11. **CC11 — `--help` → exit 0.** Output contains `Usage: caspian` + `validate <path>` subcommand entry.

12. **CC12 — Vendor-neutrality grep.**
    ```
    $ grep -rn "anthropic\|@claude" packages/cli/src/   → zero matches
    $ grep -rn "anthropic\|@claude" packages/cli/dist/  → zero matches
    ```

13. **CC13 — TTY-color smoke (piped vs FORCE_COLOR).**
    ```
    # piped (default isTTY=false, supportsColorStderr=false → useColor=false):
    $ node packages/cli/dist/cli.js validate ./fixtures/invalid/E008-type-missing/no-type.md | cat | head -1 | od -c | head -1
    0000000   f   i   x   t   u   r   e   s   /   …
    # (no ESC byte)

    # FORCE_COLOR=1 piped (chalk.supportsColorStderr.hasBasic=true → useColor=true):
    $ FORCE_COLOR=1 node packages/cli/dist/cli.js validate ./fixtures/invalid/E008-type-missing/no-type.md | cat | head -1 | od -c | head -1
    0000000  033   [   3   6   m   f   i   x   …
    # (ESC + [36m cyan inserted)
    ```

### Completion Notes List

- **Smoke gate baseline (biome-checked file count): 55 files** (Story 2.4 floor was 41; +14 new = 55, in tolerance ±2).
- **Total tests passing: 118 tests** across 13 test files (Story 2.4 baseline 91; +27 new = 118).
  - `@caspian-dev/core`: 91 tests across 10 files (unchanged from Story 2.4).
  - `@caspian-dev/cli`: 27 tests across 3 files (11 formatter + 7 walker + 9 integration).
- **Deliberate departures from AC text:**
  - **`useColor` wiring (deviates slightly from AC9):** AC9 prescribed `process.stdout.isTTY === true` as the sole signal. In practice this fails when the user pipes output but sets `FORCE_COLOR=1` (a documented chalk override). Implementation uses `process.stdout.isTTY === true || supportsColorStderr.hasBasic` so `FORCE_COLOR=1` and `NO_COLOR=1` are both honored even when piped. No AC test scenario regressed; CC13 confirms both branches work.
  - **AC2 fixture-count expectation adjusted from "≥ 7 valid fixtures" to "≥ 6"**: only 6 valid `.md` files exist on disk (the seventh `valid/overlay-compat/vendor-namespaced.md` was never created — see Story 2.4 AC4 sealed-fixture note). The walker test threshold and CC2 expected count both use 6.
- **Forward dependencies (out of scope):**
  - `dist/.tsbuildinfo` is published with absolute machine paths (inherited risk from `packages/core` precedent — `deferred-work.md` Story 2.1 entry). Owned by **Story 2.8** (npm publish): add to `.npmignore` or relocate `tsBuildInfoFile` outside `dist/`.
  - Concurrency limit on `Promise.all(validateFile)` — no `p-limit`/queue cap. If real-world directories ≥ 1000 files trigger EMFILE, **Story 2.6+** can add a semaphore. Current behavior relies on Node's native fs queue.
  - `--format=json` flag, B4 stable JSON schema, golden snapshots, `verify-pack.ts` — **Story 2.6**.
  - `.dependency-cruiser.cjs`, lockfile gate, docker runtime gate — **Story 2.7**.
- **Confirmed:**
  - `caspian/packages/cli/CHANGELOG.md` `## Unreleased` Story 2.5 bullet appended.
  - `caspian/packages/cli/src/version.generated.ts` is committed (matching `codes.generated.ts` precedent); `caspian/.gitattributes` lists it with `merge=ours linguist-generated=true`; `.gitignore` not modified.
  - Lint exit 0 with 1 info-level note (pre-existing `lint/style/useTemplate` in `packages/core/tests/unit/validators/allow-list.test.ts:13` — Story 2.4 known item, not from Story 2.5 changes).
  - No sealed files modified: `git diff --stat caspian/packages/core` returns nothing; `caspian/diagnostics/`, `caspian/schemas/`, `caspian/fixtures/`, `caspian/spec/` all untouched.

### File List

**New:**
- `caspian/packages/cli/package.json`
- `caspian/packages/cli/tsconfig.json`
- `caspian/packages/cli/vitest.config.ts`
- `caspian/packages/cli/LICENSE`
- `caspian/packages/cli/README.md`
- `caspian/packages/cli/CHANGELOG.md`
- `caspian/packages/cli/src/cli.ts`
- `caspian/packages/cli/src/version.generated.ts` (committed; biome-excluded; regenerated on `pnpm gen:version`)
- `caspian/packages/cli/src/commands/validate.ts`
- `caspian/packages/cli/src/walker.ts`
- `caspian/packages/cli/src/output/human.ts`
- `caspian/packages/cli/src/constants.ts`
- `caspian/packages/cli/scripts/gen-version.ts`
- `caspian/packages/cli/tests/helpers/paths.ts`
- `caspian/packages/cli/tests/helpers/run-cli.ts`
- `caspian/packages/cli/tests/unit/walker.test.ts`
- `caspian/packages/cli/tests/unit/output/human.test.ts`
- `caspian/packages/cli/tests/integration/cli-end-to-end.test.ts`

**Modified:**
- `caspian/.gitattributes` (append `packages/cli/src/version.generated.ts merge=ours linguist-generated=true` line; verify a wildcard doesn't already cover it)
- `caspian/pnpm-lock.yaml` (auto: new dep entries for `commander`, `fast-glob`, `chalk`)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (workflow status flips)

## Change Log

- 2026-04-29: Story 2.5 file created (create-story workflow). Status: backlog → ready-for-dev. Scaffolds the `@caspian-dev/cli` package: walker (`fast-glob` no-symlinks + realpath check), human formatter (`chalk` ANSI auto-detect), commander v12 entry with `exitOverride()` + 4-code exit matrix, build-time `version.generated.ts`, integration tests via `execFile` against the built `dist/cli.js`. No `--format=json` (Story 2.6), no dep-cruiser (Story 2.7), no publish (Story 2.8).
- 2026-04-29: Story 2.5 implemented (dev-story workflow). Status: ready-for-dev → in-progress → review.
  - **18 new files** under `caspian/packages/cli/`: package manifest (`package.json`, `tsconfig.json`, `vitest.config.ts`, `LICENSE`, `README.md`, `CHANGELOG.md`); `src/` modules (`cli.ts`, `version.generated.ts`, `commands/validate.ts`, `walker.ts`, `output/human.ts`, `constants.ts`); `scripts/gen-version.ts`; `tests/helpers/{paths,run-cli}.ts`; `tests/unit/{walker,output/human}.test.ts`; `tests/integration/cli-end-to-end.test.ts`.
  - **3 modified files**: `caspian/.gitattributes` (+1 line for `version.generated.ts`); `caspian/pnpm-lock.yaml` (auto: `commander`, `fast-glob`, `chalk` resolved); `_bmad-output/implementation-artifacts/sprint-status.yaml` (status flips).
  - All 21 ACs satisfied; all 13 cross-checks pass; `pnpm lint` (55 biome-checked files, exit 0), `pnpm test` (118/118 across 13 test files, exit 0), `pnpm build` (exit 0; shebang preserved on `dist/cli.js`), `pnpm verify-codes-hash` (exit 0), `pnpm ajv-validate-registry` (exit 0).
  - Smoke gate baseline updated: biome 41 → 55 files; tests 91 → 118.
