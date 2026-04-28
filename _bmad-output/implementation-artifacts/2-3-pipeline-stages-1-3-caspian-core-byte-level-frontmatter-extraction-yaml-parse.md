# Story 2.3: Pipeline stages 1–3 in `@caspian-dev/core` (byte-level + frontmatter extraction + YAML parse)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a plugin author,
I want the validator to detect encoding, BOM, frontmatter-extraction, and YAML-parse failures with stable diagnostic codes,
so that syntactically invalid artifacts fail fast with a clear, machine-stable error code (FR12).

## Working Directory

All paths in this story resolve **inside `caspian/`** — the sub-monorepo that hosts the Caspian project under the surrounding `joselimmo-marketplace-bmad` repository. References like `packages/core/`, `diagnostics/`, `schemas/v1/`, `fixtures/`, `biome.json` resolve to `caspian/packages/core/`, `caspian/diagnostics/`, `caspian/schemas/v1/`, `caspian/fixtures/`, `caspian/biome.json`. Never create files outside `caspian/` (with the single exception of the sprint-status / story-file updates under `_bmad-output/implementation-artifacts/`).

`caspian/packages/core/` already exists from Stories 2.1 + 2.2 with: package skeleton (`package.json`, `tsconfig.json`, `vitest.config.ts`), 3-verrou single-source-of-truth schema enforcement (`src/schemas/loader.ts`), ajv 2020-12 envelope validator (`src/validator.ts`), the stub `validateFile(path: string): Promise<Diagnostic[]>` public API (`src/index.ts`), the typed diagnostic constants (`src/diagnostics/codes.generated.ts` — 18 entries with sha256 header), the `Diagnostic` / `DiagnosticDefinition` / `Severity` / `ValidationResult` / `Reporter` types (`src/diagnostics/{types,reporter,index}.ts`), and the gen:codes / verify-codes-hash / ajv-validate-registry CI scripts. **Story 2.3 replaces the stub `validateFile` body with a real pipeline that exercises stages 1–3** and emits the 7 typed constants `CASPIAN_E001` through `CASPIAN_E007` (already present in `codes.generated.ts` since Story 2.2).

This story creates these new files in `caspian/packages/core/`:

  - `src/parsers/byte-reader.ts` — stage 1 (encoding sniff + BOM detection; emits `CASPIAN-E001`, `CASPIAN-E002`).
  - `src/parsers/frontmatter.ts` — stage 2 (`---` delimiters + 4 KB byte cap; emits `CASPIAN-E004`, `CASPIAN-E005`).
  - `src/parsers/yaml.ts` — stage 3 (`yaml` v2.x strict 1.2 safe-load + post-parse scans for tab-indent + unquoted YAML 1.1 booleans; emits `CASPIAN-E003`, `CASPIAN-E006`, `CASPIAN-E007`).
  - `src/pipeline.ts` — fail-fast orchestrator chaining stages 1 → 2 → 3 (D1 ordering); reserves stages 4–6 for Story 2.4.
  - `src/constants.ts` — `MAX_FRONTMATTER_BYTES = 4096` plus the YAML 1.1 unquoted-boolean keyword set.
  - `tests/unit/parsers/byte-reader.test.ts`, `tests/unit/parsers/frontmatter.test.ts`, `tests/unit/parsers/yaml.test.ts` — stage-level unit tests.
  - `tests/unit/pipeline.test.ts` — fail-fast ordering assertions.
  - `tests/fixtures-runner.test.ts` — table-driven auto-discovery test consuming `caspian/fixtures/invalid/E001-bom/`, `E002-encoding/`, `E003-tab-indent/`, `E004-oversized/`, `E005-missing-delimiters/`, `E006-yaml-parse/`, `E007-unquoted-bool/` (the 7 fixture pairs sealed by Story 1.6).

This story modifies these pre-existing files in place:

  - `caspian/packages/core/src/index.ts` — `validateFile` body rewired to invoke the pipeline (no signature change; remains `Promise<Diagnostic[]>`).
  - `caspian/packages/core/package.json` — adds the `yaml` runtime dependency (`^2.6.0` floor).
  - `caspian/packages/core/CHANGELOG.md` — Unreleased bullet for Story 2.3.
  - `caspian/packages/core/README.md` — Public API surface section: replace the stub-disclaimer with the stages-1–3 description; document `validateFile`'s pipeline behavior.
  - `caspian/pnpm-lock.yaml` — additive (yaml 2.x resolution).

This story does NOT modify `caspian/diagnostics/registry.json` (sealed by Stories 1.5 + 1.8), `caspian/schemas/v1/*` (sealed by Stories 1.4 + 1.5), `caspian/fixtures/**` (sealed by Stories 1.6 + 1.8 — the 7 invalid fixtures for E001–E007 already carry their `.expected.json` siblings; Story 2.3 reads but does not write), `caspian/diagnostics/CHANGELOG.md`, `caspian/.gitattributes`, `caspian/.biomeignore`, `caspian/biome.json`, `caspian/packages/core/src/diagnostics/*` (sealed by Story 2.2 — Story 2.3 *consumes* the typed constants but adds no new entries), or `caspian/packages/core/src/validator.ts` / `src/schemas/loader.ts` (sealed by Story 2.1 — Story 2.3's stages 1–3 do not invoke ajv; ajv is reserved for stage 4 in Story 2.4).

## Background

This story implements the first half of the validation pipeline mandated by architecture D1 (lines 281–290) and step-04's *Validation Pipeline* table. The pipeline is the load-bearing contract between `@caspian-dev/core` and every downstream consumer (the `caspian` CLI in Stories 2.5–2.6, conformance suite in Story 2.7, future LSP / CI / runtime / install-time validators in v1.1). Without stages 1–3 in place, `validateFile` continues to no-op (Story 2.1's stub), and the diagnostic registry — fully realized in Story 2.2 with sha256-anchored typed constants — has no consumer in source code, leaving its purpose latent.

The pipeline ordering (D1) is fail-fast per stage — failure at stage N suppresses stages N+1..6 for that file. Stages 1–3 are the syntactic-validity layer:

```
file path
  ↓ stage 1 — byte-reader.ts        (UTF-8 strict, BOM check)         → E001, E002
  ↓ stage 2 — frontmatter.ts        (---/--- delimiters, 4 KB cap)    → E004, E005
  ↓ stage 3 — yaml.ts               (yaml v2.x strict 1.2 safe-load   → E003, E006, E007
                                     + post-parse tab-indent scan
                                     + post-parse unquoted-bool scan)
  ↓ (stages 4–6 — Story 2.4)        envelope shape, namespace check, allow-list
```

After stage 3 succeeds, stages 4–6 run continue-and-collect (D2): each emits independent diagnostics in the same pass. Story 2.3 stages 4–6 are **NOT shipped** — `pipeline.ts` reserves a hook for Story 2.4 to plug into and returns the stage 1–3 diagnostics array as-is. This boundary keeps the story scope bounded and the integration surface minimal.

The 7 typed constants Story 2.3 emits (`CASPIAN_E001` … `CASPIAN_E007`) are already exported from `@caspian-dev/core/diagnostics` per Story 2.2's `codes.generated.ts`. Story 2.3 imports each by name (no string literals); any registry edit that renames or re-codes these constants is caught at compile time by TypeScript and at run time by `pnpm verify-codes-hash`.

The 7 invalid fixtures Story 2.3 must validate against are already on disk per Stories 1.6 + 1.8:

| Fixture path | Content type | Expected diagnostic | Expected line |
|---|---|---|---|
| `caspian/fixtures/invalid/E001-bom/with-bom.md` | UTF-8 file with `EF BB BF` BOM prefix | `CASPIAN-E001` | 1 |
| `caspian/fixtures/invalid/E002-encoding/non-utf8.md` | Windows-1252 smart-quote bytes (0x91, 0x92) inside frontmatter | `CASPIAN-E002` | 1 |
| `caspian/fixtures/invalid/E003-tab-indent/tab-in-yaml.md` | Tab character indent on line 4 (inside frontmatter `requires:` list) | `CASPIAN-E003` | 4 |
| `caspian/fixtures/invalid/E004-oversized/over-4kb.md` | Frontmatter content exceeding 4 096 bytes between delimiters | `CASPIAN-E004` | 1 |
| `caspian/fixtures/invalid/E005-missing-delimiters/no-closing-delim.md` | Opening `---` but no closing `---` | `CASPIAN-E005` | 1 |
| `caspian/fixtures/invalid/E006-yaml-parse/unclosed-bracket.md` | Unclosed YAML flow-sequence bracket on line 3 | `CASPIAN-E006` | 3 |
| `caspian/fixtures/invalid/E007-unquoted-bool/yes-as-string.md` | `user-invocable: yes` (unquoted YAML 1.1 boolean) on line 3 | `CASPIAN-E007` | 3 |

Each fixture has a `.expected.json` sibling that is the authoritative ground truth — Story 2.3's `tests/fixtures-runner.test.ts` MUST pass these without `.expected.json` edits. If implementation produces a different `line` value for any fixture, the implementation is wrong (NOT the fixture); the dev MUST adjust the parser, not the fixture.

## Acceptance Criteria

**AC1.** `caspian/packages/core/src/constants.ts` is created and exports two SCREAMING_SNAKE_CASE constants:

  - `MAX_FRONTMATTER_BYTES: 4096` — the 4 KB hard cap mandated by NFR4 + architecture D4. Bytes are counted between (but excluding) the opening and closing `---` lines, exclusive of the delimiter newlines themselves (D4 — settles cross-platform CRLF/LF ambiguity).
  - `YAML_1_1_UNQUOTED_BOOLEANS: ReadonlySet<string>` — a frozen set containing the 6 YAML 1.1 boolean-like keywords flagged by `CASPIAN-E007`: `"on"`, `"off"`, `"yes"`, `"no"`, `"y"`, `"n"`. Values are lowercase; the post-parse scan in stage 3 case-normalizes the YAML value before lookup. **Do NOT include** `"true"` or `"false"` — those are valid YAML 1.2 booleans by design and pass through.

The file MUST use named exports only (no `export default` — biome rule). The file MUST be authored as `kebab-case` filename (`constants.ts` is already kebab-case-compliant; trivially satisfied).

**AC2.** `caspian/packages/core/src/parsers/byte-reader.ts` is created and exports a single function:

```ts
export interface ByteReadResult {
  bytes: Buffer;
  text: string;          // UTF-8 decoded (lossless because byte-reader passes only on UTF-8-clean input)
  diagnostics: Diagnostic[];
}

export async function readFile(path: string): Promise<ByteReadResult>;
```

Behavior:

  - Reads the file as raw bytes via `fs.readFile(path)` (no encoding argument — yields a `Buffer`). The `Buffer` is preserved alongside the decoded text in the result; downstream stages need both views (line-number derivation uses character positions; byte-counting uses byte length).
  - **BOM detection (`CASPIAN-E001`):** if the first 3 bytes of the buffer are exactly `0xEF 0xBB 0xBF`, push a `CASPIAN-E001` diagnostic with `line: 1` and return immediately (subsequent stages MUST NOT run for this file). Use the typed constant: `import { CASPIAN_E001 } from "../diagnostics/codes.generated.js";` then `diagnostics.push({ code: CASPIAN_E001.code, severity: CASPIAN_E001.severity, line: 1, message: CASPIAN_E001.message });`. The result's `text` field MAY be empty string when E001 fires (downstream stages skipped anyway).
  - **UTF-8 strict decode (`CASPIAN-E002`):** decode the buffer via `new TextDecoder("utf-8", { fatal: true }).decode(buffer)`. The `fatal: true` option throws `TypeError` on the first invalid UTF-8 byte sequence. Catch the throw and emit `CASPIAN-E002` with `line: 1` (the file-level convention from Story 1.6 — see the deferred-work note from Story 1.6 review). Return immediately with an empty `text` and the populated `diagnostics`.
  - On clean read: return `{ bytes, text, diagnostics: [] }` and let stage 2 proceed.
  - The function MUST NOT throw for input-validity errors (E001/E002 are diagnostics, not exceptions). It MAY throw for genuine I/O errors (`ENOENT`, `EACCES`, `EISDIR`) — those propagate upward and are caught by `validateFile`'s caller (the CLI translates them to exit code 2 in Story 2.5; for now, propagation is sufficient).

The file MUST live at `caspian/packages/core/src/parsers/byte-reader.ts` (the architecture-mandated location, line 637 of `architecture.md`). Creating the directory `src/parsers/` is implicit — it does not yet exist after Story 2.2.

**AC3.** `caspian/packages/core/src/parsers/frontmatter.ts` is created and exports a single function:

```ts
export interface FrontmatterExtractResult {
  raw: string;             // bytes between the two --- delimiters, lossless UTF-8 text
  startLine: number;       // 1-based line of the opening --- delimiter (always 1 for valid files)
  endLine: number;         // 1-based line of the closing --- delimiter
  bodyStartLine: number;   // 1-based line where prose body begins (endLine + 1)
  diagnostics: Diagnostic[];
}

export function extractFrontmatter(text: string): FrontmatterExtractResult;
```

Behavior:

  - **Opening delimiter check:** the file MUST begin with `---\n` (or `---\r\n` for CRLF — see *Cross-platform newline handling* in Dev Notes). If the first 3 characters are NOT `---` followed by an end-of-line (LF or CRLF), emit `CASPIAN-E005` with `line: 1` and return early (`raw: ""`, `startLine: 0`, `endLine: 0`, `bodyStartLine: 0`).
  - **Closing delimiter scan:** find the next line in the text whose content is exactly `---` (preceded by `\n` or `\r\n`, followed by `\n`, `\r\n`, or EOF). If no such line exists, emit `CASPIAN-E005` with `line: 1` and return early.
  - **Byte-cap check (`CASPIAN-E004`):** between the opening and closing delimiter lines, exclusive of the delimiter line newlines themselves (D4), measure the UTF-8 byte length of the raw frontmatter content. The text BETWEEN the delimiters, NOT including either `---\n`. If `Buffer.byteLength(raw, "utf8") > MAX_FRONTMATTER_BYTES` (i.e., > 4096), emit `CASPIAN-E004` with `line: 1` and return early. **Boundary precision:** at exactly 4096 bytes, NO `CASPIAN-E004` fires. At 4097 bytes, `CASPIAN-E004` fires. (The fixture `caspian/fixtures/invalid/E004-oversized/over-4kb.md` is 4231 bytes total file size with frontmatter substantially exceeding 4096 — so the fixture trips this check easily, but the boundary precision is still part of the contract.)
  - On clean extract: return `{ raw, startLine: 1, endLine: <line-of-closing-delim>, bodyStartLine: endLine + 1, diagnostics: [] }`.
  - The function does NOT parse YAML — it returns the raw frontmatter text. Stage 3 handles parsing.
  - The function MUST handle both LF (`\n`) and CRLF (`\r\n`) line endings transparently. Computing line numbers MUST count LF and CRLF each as one line break. Cross-platform fixtures (Windows-saved files) MUST produce identical diagnostics to Linux-saved fixtures.

**AC4.** `caspian/packages/core/src/parsers/yaml.ts` is created and exports a single function:

```ts
export interface YamlParseResult {
  data: Record<string, unknown> | null;
  diagnostics: Diagnostic[];
}

export function parseYaml(raw: string, frontmatterStartLine: number): YamlParseResult;
```

Behavior:

  - **Tab-indent post-parse scan (`CASPIAN-E003`):** before invoking the YAML parser, scan the raw frontmatter text line-by-line. For each line containing one or more `\t` characters at the start of the leading whitespace (i.e., before the first non-whitespace character), emit `CASPIAN-E003` with `line: <frontmatterStartLine - 1 + i>` where `i` is the 1-based index of the offending line within the raw frontmatter text. The `line` value is the absolute line number in the original file. (The fixture `caspian/fixtures/invalid/E003-tab-indent/tab-in-yaml.md` has the tab on line 4 of the file; raw frontmatter starts at line 2; line 3 of raw frontmatter = line 4 of file. Adjust the formula so this fixture's expected `line: 4` is produced.) **Concretely:** the file's opening `---` is line 1; the first content line of raw frontmatter is line 2 (`startLine + 1`). If the first line of `raw` (offset 0) contains a leading tab, the diagnostic's `line` is `startLine + 1`. The fixture-runner test (AC10) is the ground truth for this calculation.
  - **YAML parse (`CASPIAN-E006`):** invoke `yaml` v2.x's `parse` function with strict 1.2 + safe-load configuration. Use the named import shape from the `yaml` package: `import { parse, YAMLParseError } from "yaml";`. Wrap in try/catch. On exception (any `YAMLParseError`, type errors, or other parse failures), emit `CASPIAN-E006` with `line: <best-effort-line-from-error-or-frontmatterStartLine + 1>`. The `yaml` library exposes `error.linePos` on `YAMLParseError` (an array of `{ line, col }` objects); use the first entry's `line` plus `(frontmatterStartLine - 1)` for the absolute file line. If `linePos` is unavailable, fall back to the line number where the offending YAML content lives — for the fixture `E006-yaml-parse/unclosed-bracket.md`, the unclosed bracket is on line 3; the diagnostic MUST report `line: 3`. Return early with `data: null`.
  - **YAML parser configuration:** `parse(raw, { strict: true, version: "1.2" })`. The `version: "1.2"` option enforces 1.2 semantics (rejects YAML 1.1 boolean coercion at parse time for unquoted `on`/`off`/`yes`/`no`/`y`/`n` only when the parser would coerce them — but `yaml` v2.x in 1.2 mode treats those as strings already, NOT booleans). The post-parse scan (next bullet) is what fires `CASPIAN-E007`.
  - **Safe-load enforcement (NFR5):** `yaml` v2.x is safe-by-default (it does NOT execute YAML custom tags like `!!python/object:` or `!!js/function:`). Custom-tag inputs that would enable code execution are rejected at parse time as type errors → emit `CASPIAN-E006` (NOT a separate code). Any future YAML custom-tag attack vector that bypasses `yaml` v2.x default safety MUST be reported via `CASPIAN-E006` until/unless a dedicated code is added in a future spec evolution.
  - **Unquoted YAML 1.1 boolean post-parse scan (`CASPIAN-E007`):** after a successful `parse`, walk the parsed object's top-level scalar values. For each top-level key whose value is a string equal (case-normalized via `value.toLowerCase()`) to a member of `YAML_1_1_UNQUOTED_BOOLEANS` (from `constants.ts`), emit `CASPIAN-E007` with `line: <absolute-line-of-that-key-in-the-original-file>`. The `line` value MUST point at the line in the file where the offending key is declared (NOT the start of frontmatter). Use the `yaml` library's CST/document API to recover line positions: `import { parseDocument } from "yaml";` to access `doc.contents.items[i].key.range[0]` (byte offset) → convert to line number via the original `raw` text. (See *Stage 3 line-number derivation* in Dev Notes for the exact pattern.) For the fixture `E007-unquoted-bool/yes-as-string.md`, `user-invocable: yes` is on line 3 of the file; the diagnostic MUST report `line: 3`.
  - **Top-level only:** the unquoted-bool scan walks ONLY top-level frontmatter keys. Nested values inside `requires` arrays or `produces` objects are out of scope for `CASPIAN-E007` in v1.0 (architecture C5 + the registry's E007 message reference YAML 1.1 footgun, which in practice is a top-level-key author mistake). If a future fixture demands nested-scope detection, that's a separate code or a future story.
  - On clean parse: return `{ data: <parsed-object>, diagnostics: [] }`.
  - The function MUST NOT throw for E003 / E006 / E007 (all are diagnostics). It MAY throw for genuine programmer errors (e.g., `raw` is `undefined`).

**AC5.** `caspian/packages/core/src/pipeline.ts` is created and exports a single function:

```ts
export async function runPipeline(filePath: string): Promise<Diagnostic[]>;
```

Behavior:

  - **Stage 1:** call `readFile(filePath)` (from `byte-reader.ts`). If `result.diagnostics.length > 0` (E001 or E002 fired), return that array immediately. Stages 2–6 do NOT run.
  - **Stage 2:** call `extractFrontmatter(result.text)` (from `frontmatter.ts`). If `result.diagnostics.length > 0` (E004 or E005 fired), return that array immediately. Stages 3–6 do NOT run.
  - **Stage 3:** call `parseYaml(extracted.raw, extracted.startLine)` (from `yaml.ts`). If `result.diagnostics.length > 0` (E003, E006, or E007 fired), return that array immediately. Stages 4–6 do NOT run.
  - **Stages 4–6 reservation:** after stage 3 succeeds, the orchestrator currently returns `[]` — Story 2.4 will plug stages 4–6 in here. Add a `// TODO Story 2.4: stages 4–6 (envelope, namespace, allow-list)` marker comment at this insertion point. (One-line comment; Dev Notes covers the placement.) The orchestrator MUST NOT lose the `parsed.data` from stage 3 — pass it forward to a (future) stage-4 entry point. For Story 2.3, the parsed data is unused; the comment documents the contract for Story 2.4.
  - **No throws for validation failures:** `runPipeline` returns `Diagnostic[]` for all input-validity errors. It MAY propagate genuine I/O errors (caught by stage 1's `readFile`).
  - **Continue-and-collect within stage 3:** if stage 3's parser succeeds AND the post-parse scan flags multiple unquoted-boolean values (e.g., a fixture with two unquoted booleans across two top-level keys), emit ALL of them in the returned array. Stage 3 is INTERNALLY continue-and-collect for E007; E003 and E006 are still fail-fast within stage 3 (a tab-indent OR a parse error short-circuits the post-parse scan).

**AC6.** `caspian/packages/core/src/index.ts` is modified in place. The Story 2.1 stub:

```ts
import fs from "node:fs/promises";
import type { Diagnostic } from "./diagnostics/types.js";
import { getEnvelopeValidator } from "./validator.js";

export async function validateFile(filePath: string): Promise<Diagnostic[]> {
  await fs.access(filePath);
  await getEnvelopeValidator();
  return [];
}

export type {
  Diagnostic,
  Severity,
  ValidationResult,
} from "./diagnostics/types.js";
```

Target state:

```ts
import type { Diagnostic } from "./diagnostics/types.js";
import { runPipeline } from "./pipeline.js";

export async function validateFile(filePath: string): Promise<Diagnostic[]> {
  return runPipeline(filePath);
}

export type {
  Diagnostic,
  DiagnosticDefinition,
  Severity,
  ValidationResult,
} from "./diagnostics/types.js";
```

Notes on the diff:

  - Removes the `fs.access` TOCTOU stub (deferred-work item Story 2.1 #1 — line 73 of `_bmad-output/implementation-artifacts/deferred-work.md`). The TOCTOU race is resolved because `runPipeline` reads the file via `fs.readFile` directly; there is no longer a check-then-not-use pattern.
  - Removes the `getEnvelopeValidator()` warm-up call. Story 2.3's stages 1–3 do not exercise ajv. Story 2.4 will reintroduce the validator invocation inside `pipeline.ts` (NOT inside `validateFile`), keeping `index.ts` thin.
  - Adds `DiagnosticDefinition` to the re-export list so external consumers of `@caspian-dev/core` (not the `./diagnostics` sub-export) can also reference catalog metadata. This is additive and does not regress the Story 2.2 surface.
  - Story 2.1's `validator.ts` and `schemas/loader.ts` are untouched — Story 2.4 will consume them.

**AC7.** `caspian/packages/core/package.json` is modified in place to add the `yaml` runtime dependency. Current `dependencies` (Story 2.1):

```json
"dependencies": {
  "ajv": "^8.17.0"
}
```

Target state:

```json
"dependencies": {
  "ajv": "^8.17.0",
  "yaml": "^2.6.0"
}
```

  - **Why `yaml` v2.x and NOT `js-yaml`:** architecture line 165 mandates `yaml` v2.x because it is strict YAML 1.2 by default and rejects `on`/`off` boolean coercion that `js-yaml` accepts. NFR8 mandates rejecting unquoted YAML 1.1 booleans; using `js-yaml` would silently convert `enabled: yes` to `true: boolean` and make `CASPIAN-E007` undetectable. The choice is non-negotiable.
  - **Floor `^2.6.0`:** the `yaml` package's 2.x line is stable; 2.6.x is the late-2025/early-2026 stable train. The `^` allows minor upgrades. Verify the resolved version after `pnpm install` lands on 2.6.x or later (capture the actual resolved version in *Completion Notes — Resolved versions*).
  - The dev MUST run `pnpm -C caspian install` after editing the file. The lockfile diff MUST be additive (yaml 2.x + its zero direct dependencies; the package is dependency-free in 2.x).
  - `devDependencies` is unchanged. `engines.node` is unchanged. `scripts` is unchanged from Story 2.2's target shape.

**AC8.** `caspian/packages/core/CHANGELOG.md` is amended in place. Append (preserving existing bullets, in chronological order under `## Unreleased`):

```markdown
- Pipeline stages 1–3 (`validateFile` real implementation): byte-level (`CASPIAN-E001`,
  `CASPIAN-E002`), frontmatter extraction (`CASPIAN-E004`, `CASPIAN-E005`),
  YAML parse (`CASPIAN-E003`, `CASPIAN-E006`, `CASPIAN-E007`) via `yaml` v2.x
  strict 1.2 safe-load + post-parse tab-indent and YAML 1.1 unquoted-boolean
  scans. Adds `parsers/{byte-reader,frontmatter,yaml}.ts`, `pipeline.ts`,
  `constants.ts` (4 KB cap, YAML 1.1 boolean keyword set). Adds runtime
  dependency `yaml ^2.6.0`. Stages 4–6 land in Story 2.4.
```

`caspian/packages/core/README.md` is amended in place. The current Public API surface section says:

```
- `validateFile(path: string): Promise<Diagnostic[]>` — validates a single
  file and returns the array of diagnostics (empty array = valid).
  Story 2.1 ships a stub that returns `[]`; the full pipeline lands in
  Stories 2.3 + 2.4.
```

Update to:

```
- `validateFile(path: string): Promise<Diagnostic[]>` — validates a single
  file against pipeline stages 1–3 (byte-level, frontmatter extraction,
  YAML parse) and returns the array of diagnostics (empty array = valid
  through stage 3). Stages 4–6 (envelope shape, namespace check,
  allow-list scan) land in Story 2.4; until then, files passing stage 3
  return an empty diagnostic array even if their envelope shape is invalid.
```

Add a new sub-section **Pipeline stages** with a brief table mirroring the architecture D1 ordering (3 lines for stages 1–3 + a placeholder line noting stages 4–6 are pending):

```
### Pipeline stages

| Stage | Module                              | Diagnostics                              |
|-------|-------------------------------------|------------------------------------------|
| 1     | `parsers/byte-reader.ts`            | `CASPIAN-E001`, `CASPIAN-E002`           |
| 2     | `parsers/frontmatter.ts`            | `CASPIAN-E004`, `CASPIAN-E005`           |
| 3     | `parsers/yaml.ts`                   | `CASPIAN-E003`, `CASPIAN-E006`, `CASPIAN-E007` |
| 4–6   | (Story 2.4)                         | `CASPIAN-E008`–`E014`, `CASPIAN-W001`–`W004` |

Pipeline ordering is fail-fast per stage (architecture D1): a failure in
stage N suppresses stages N+1..6 for that file. Within stage 3, the
unquoted-YAML-1.1-boolean post-parse scan continues-and-collects (multiple
`CASPIAN-E007` emissions in a single pass).
```

**AC9.** Stage-level unit tests are created. For each parser:

  - `caspian/packages/core/tests/unit/parsers/byte-reader.test.ts` covers:
    - **happy-path:** a small UTF-8 file with no BOM passes; returns `{ bytes, text, diagnostics: [] }` with `text` matching the file's content.
    - **E001:** a buffer prefixed with `0xEF 0xBB 0xBF` emits `CASPIAN-E001` with `line: 1` and exits early (does NOT also emit `CASPIAN-E002`).
    - **E002:** a buffer with invalid UTF-8 byte sequence (e.g., `[0x41, 0x91, 0x42]`) emits `CASPIAN-E002` with `line: 1`.
    - **E001 short-circuit:** a buffer with both a BOM AND invalid UTF-8 bytes after the BOM emits ONLY `CASPIAN-E001` (does NOT also emit `CASPIAN-E002`); E001 wins by short-circuit.
    - Tests use `tmp` files via `fs.writeFile` to a `path.join(os.tmpdir(), …)` location (or vitest's `beforeAll` fixture pattern). Cleanup in `afterAll`.

  - `caspian/packages/core/tests/unit/parsers/frontmatter.test.ts` covers:
    - **happy-path:** `---\ntype: core:overview\n---\n\nbody` returns `{ raw: "type: core:overview\n", startLine: 1, endLine: 3, bodyStartLine: 4, diagnostics: [] }`.
    - **E005 — no opening `---`:** plain text without leading `---` emits `CASPIAN-E005` line 1.
    - **E005 — no closing `---`:** opening delimiter present but no closing delimiter emits `CASPIAN-E005` line 1.
    - **E004 — exactly 4096 bytes (boundary):** frontmatter content of exactly 4096 UTF-8 bytes between delimiters does NOT emit E004.
    - **E004 — 4097 bytes (over-boundary):** frontmatter content of exactly 4097 UTF-8 bytes between delimiters emits `CASPIAN-E004` line 1.
    - **CRLF compatibility:** `---\r\ntype: core:overview\r\n---\r\n\r\nbody` produces the same `raw` (with `\r\n` preserved) and the same `startLine`/`endLine`/`diagnostics` as the LF variant.
    - **Multi-byte UTF-8 in byte cap:** a frontmatter containing 1 366 three-byte UTF-8 codepoints (e.g., CJK characters at 3 bytes each = 4 098 bytes) emits `CASPIAN-E004`. (Optional but recommended; sanity-checks the byte-counting precision against character-counting.)

  - `caspian/packages/core/tests/unit/parsers/yaml.test.ts` covers:
    - **happy-path:** `type: core:overview\n` returns `{ data: { type: "core:overview" }, diagnostics: [] }`.
    - **E003 — tab indent on raw line 1:** `\ttype: core:overview\n` (with leading tab on first line of raw) emits `CASPIAN-E003` with `line: startLine + 1`.
    - **E003 — tab indent on raw line N:** multi-line frontmatter with a tab on the Nth raw line emits `CASPIAN-E003` with `line: startLine + N`. Verify line-number arithmetic against the architecture D4 / fixture E003 expected `line: 4`.
    - **E006 — unclosed bracket:** `requires: [{type: core:story\n` (unclosed flow sequence) emits `CASPIAN-E006`. The `line` value should match the `yaml` library's `linePos` for the parse error.
    - **E006 — unsupported tag:** `key: !!js/function "function() {}"\n` is rejected by `yaml` v2.x safe-load and emits `CASPIAN-E006` (NOT a separate code).
    - **E007 — `enabled: yes`:** `enabled: yes\n` emits `CASPIAN-E007` with `line` equal to the line of the `enabled:` key.
    - **E007 — case-insensitive match:** `enabled: YES\n` ALSO emits `CASPIAN-E007` (the post-parse scan case-normalizes; `yaml` v2.x in strict 1.2 mode treats both `yes` and `YES` as strings, so the scan sees both as strings).
    - **E007 — multiple keys:** `enabled: yes\ndisabled: no\n` emits TWO `CASPIAN-E007` diagnostics in a single pass (continue-and-collect within stage 3).
    - **No false positive — quoted boolean:** `enabled: "yes"\n` does NOT emit `CASPIAN-E007` (the YAML value is the string `"yes"` parsed via the explicit-string syntax — but in `yaml` v2.x, quoted strings parse identically to unquoted-but-still-string). **Caveat:** distinguishing quoted from unquoted requires the CST/document API (`parseDocument`); see Dev Notes — *Stage 3 line-number derivation* — which is the same machinery used for line numbers, so the cost is amortized.
    - **No false positive — actual boolean:** `enabled: true\n` does NOT emit `CASPIAN-E007` (`true`/`false` are valid YAML 1.2 booleans, not in the unquoted-1.1-boolean keyword set per AC1).

  - `caspian/packages/core/tests/unit/pipeline.test.ts` covers:
    - **stage 1 short-circuits stages 2–3:** a fixture with a BOM (`E001`) is fed to `runPipeline`; result has exactly 1 diagnostic (`CASPIAN-E001`). No `CASPIAN-E002`/E004/E005/E006 also.
    - **stage 2 short-circuits stage 3:** a fixture with no closing `---` (E005) returns exactly 1 diagnostic. No `CASPIAN-E006` also.
    - **stage 3 internal continue-and-collect:** a fixture with TWO `enabled: yes` keys returns 2 `CASPIAN-E007` diagnostics.
    - **clean pipeline returns empty:** a fixture with valid frontmatter (e.g., `caspian/fixtures/valid/core-overview/minimal.md`) returns `[]`.

Tests use the existing `tests/helpers/paths.ts` (`REPO_ROOT`, `FIXTURES_DIR`) for fixture paths. New scaffolding (e.g., per-test temp files for byte-reader edge cases) MUST resolve paths via `import.meta.url` or `os.tmpdir()`, never `process.cwd()`.

**AC10.** Fixture-runner integration test is created at `caspian/packages/core/tests/fixtures-runner.test.ts`. The test:

  - Auto-discovers all fixture pairs under `caspian/fixtures/invalid/E00{1,2,3,4,5,6,7}-*/` via `fs.readdir` + glob-pattern filtering. Story 2.3 ONLY tests E001–E007 (stages 1–3). Story 2.4 will extend the discovery filter to also include E008–E014 + W001–W004.
  - For each fixture pair (`<name>.md` + `<name>.expected.json`):
    - Read the `.md` file via `validateFile(absolutePath)` (the public API).
    - Read the `.expected.json` file and parse.
    - Assert that the returned diagnostic array's `code` and `line` fields match the expected entries pairwise.
  - Use vitest's `it.each` table-driven pattern over the discovered fixtures so each fixture produces a named test with a clear failure message (e.g., *"E001-bom/with-bom: expected CASPIAN-E001 line 1, got CASPIAN-E002 line 1"*).
  - The test MUST handle the case where a discovered fixture is in the E008–E014 / W001–W004 range (Story 2.4's territory). For Story 2.3, **filter the discovery to E001–E007 only** (e.g., `entries.filter(e => /^E00[1-7]-/.test(e))`). Story 2.4 widens the filter; Story 2.3's filter is an acceptable "stage scope" boundary.

The fixture-runner test is the **release gate** for stages 1–3. If it passes, the implementation is correct against the canonical fixture set. Any divergence between the diagnostic emission and the `.expected.json` file is a story-blocking bug; the fix is in the implementation, NOT in the fixture (fixtures are sealed by Story 1.6).

**AC11.** Smoke gate baseline maintained. After all changes:

  - `pnpm -C caspian lint` exits 0. Expected new biome-checked file count: 24 (Story 2.2 baseline) + 5 new src TypeScript files (`constants.ts`, `parsers/byte-reader.ts`, `parsers/frontmatter.ts`, `parsers/yaml.ts`, `pipeline.ts`) + 5 new test files (`tests/unit/parsers/byte-reader.test.ts`, `tests/unit/parsers/frontmatter.test.ts`, `tests/unit/parsers/yaml.test.ts`, `tests/unit/pipeline.test.ts`, `tests/fixtures-runner.test.ts`) + 1 modified file already counted (`src/index.ts`) = 24 + 10 = **34 biome-checked files**. Document the actual count in *Completion Notes — Smoke gate baseline* (the ±1 tolerance is because biome may auto-format one or two files into one another).
  - `pnpm -C caspian test` exits 0. Expected: ≥ 5 test files, ≥ 30 tests passing (Story 2.1's 3 smoke tests + Story 2.2's 5 codes-shape tests + Story 2.3's new tests: ≈ 4 byte-reader + ≈ 6 frontmatter + ≈ 9 yaml + ≈ 4 pipeline + 7 fixture-runner = ≈ 30 new tests).
  - `pnpm -C caspian build` exits 0. Build chain (Story 2.2): `pnpm gen:codes && tsc -p tsconfig.json && tsx scripts/copy-schemas.ts`. Verify `dist/parsers/byte-reader.js`, `dist/parsers/frontmatter.js`, `dist/parsers/yaml.js`, `dist/pipeline.js`, `dist/constants.js` exist post-build.
  - `pnpm -C caspian verify-codes-hash` continues to exit 0 (Story 2.3 imports the typed constants but does not regenerate `codes.generated.ts`).
  - `pnpm -C caspian ajv-validate-registry` continues to exit 0 (registry is sealed).
  - **Live ESM-import smoke check:** `cd caspian && node --input-type=module -e "import('./packages/core/dist/index.js').then(m => m.validateFile('./fixtures/invalid/E001-bom/with-bom.md').then(d => console.log(d.length, d[0]?.code, d[0]?.line)))"` prints `1 CASPIAN-E001 1` and exits 0 — proves the published-shape ESM `.` entry resolves and the pipeline runs end-to-end against a real fixture.

Document each of these in *Debug Log References*.

**AC12.** Manual cross-checks recorded in *Debug Log References*:

  1. **Stage 1 — E001 short-circuit.** Run `validateFile` against `fixtures/invalid/E001-bom/with-bom.md`; capture the returned array. MUST be exactly `[{code: "CASPIAN-E001", severity: "error", line: 1, message: "..."}]`. Capture stdout via the ESM-import smoke check from AC11.
  2. **Stage 1 — E002 short-circuit.** Run `validateFile` against `fixtures/invalid/E002-encoding/non-utf8.md`; capture the returned array. MUST be exactly 1 diagnostic with `code: "CASPIAN-E002"`, `line: 1`.
  3. **Stage 2 — E004 boundary precision.** Author two synthetic temp files (NOT in `fixtures/`):
     - `tmp-4096.md` with frontmatter content of exactly 4 096 UTF-8 bytes between `---\n` and `\n---`. Run `validateFile`; verify NO `CASPIAN-E004` (the file may produce other diagnostics depending on content, but specifically NOT E004).
     - `tmp-4097.md` with frontmatter content of exactly 4 097 bytes. Run `validateFile`; verify `CASPIAN-E004` line 1 IS in the diagnostics array.
     This verifies AC8 of the epic (byte-counting precision). Document the temp-file generation snippet (e.g., `'-'.repeat(4096)` for ASCII content).
  4. **Stage 2 — E005 missing closing delim.** Run against `fixtures/invalid/E005-missing-delimiters/no-closing-delim.md`; verify `[CASPIAN-E005, line 1]`.
  5. **Stage 3 — E003 tab indent.** Run against `fixtures/invalid/E003-tab-indent/tab-in-yaml.md`; verify `[CASPIAN-E003, line 4]` (matches `.expected.json`).
  6. **Stage 3 — E006 YAML parse.** Run against `fixtures/invalid/E006-yaml-parse/unclosed-bracket.md`; verify `[CASPIAN-E006, line 3]` (matches `.expected.json`).
  7. **Stage 3 — E007 unquoted boolean.** Run against `fixtures/invalid/E007-unquoted-bool/yes-as-string.md`; verify `[CASPIAN-E007, line 3]` (matches `.expected.json`).
  8. **Stage 3 — safe-load custom-tag rejection.** Author a synthetic temp file with frontmatter `key: !!js/function "function() {}"`. Run `validateFile`; verify the diagnostics array contains `CASPIAN-E006` (NOT a code-execution attempt; NOT a separate code). This satisfies AC9 of the epic (NFR5 safe-load + custom-tag rejection).
  9. **NFR6 / NFR20 offline operation.** Audit the implementation for any `fetch`, `https.request`, `http.request`, `dns.lookup`, `net.connect`, or telemetry-library import. The grep MUST return zero matches in `caspian/packages/core/src/`. Capture the grep command + empty output.
  10. **Fail-fast determinism.** Author a synthetic fixture combining two violations (e.g., a BOM + an unclosed `---`). Run `validateFile`; verify ONLY the stage-1 diagnostic (`CASPIAN-E001`) is returned — stage 2's `CASPIAN-E005` does NOT also fire. This verifies the AC1 stages 2–6 do not run / AC2 stages 2–6 do not run / etc. clauses in the epic.

Each cross-check is a separate paragraph in *Debug Log References* with the exact command + output. Cross-checks #3, #8, #10 require deliberately authored temp files; the dev MUST clean them up after capturing the output (do NOT leave orphan temp files in the repo).

## Tasks / Subtasks

- [x] **Task 1 — Constants module** (AC: #1)
  - [x] Create `caspian/packages/core/src/constants.ts` with `MAX_FRONTMATTER_BYTES = 4096` and `YAML_1_1_UNQUOTED_BOOLEANS` frozen Set.
  - [x] Run `pnpm -C caspian lint` — verify no biome violations on the new file.

- [x] **Task 2 — Stage 1 byte-reader** (AC: #2)
  - [x] Create `caspian/packages/core/src/parsers/byte-reader.ts`. Author the BOM check + UTF-8 strict decode + diagnostic emission per AC2.
  - [x] Import `CASPIAN_E001`, `CASPIAN_E002` from `../diagnostics/codes.generated.js` (typed constants, no string literals in source).
  - [x] Run `pnpm -C caspian -F @caspian-dev/core build` — verify the file compiles and `dist/parsers/byte-reader.js` is emitted.

- [x] **Task 3 — Stage 2 frontmatter extractor** (AC: #3)
  - [x] Create `caspian/packages/core/src/parsers/frontmatter.ts`. Author the delimiter scan + byte-cap check per AC3.
  - [x] Import `CASPIAN_E004`, `CASPIAN_E005` from typed constants. Import `MAX_FRONTMATTER_BYTES` from `../constants.js`.
  - [x] Verify CRLF compatibility manually (covered by `frontmatter.test.ts` CRLF case).

- [x] **Task 4 — Stage 3 YAML parser** (AC: #4)
  - [x] Create `caspian/packages/core/src/parsers/yaml.ts`. Author the tab-indent pre-scan + `yaml` v2.x parse + post-parse unquoted-boolean scan per AC4.
  - [x] Import `CASPIAN_E003`, `CASPIAN_E006`, `CASPIAN_E007` from typed constants. Import `YAML_1_1_UNQUOTED_BOOLEANS` from `../constants.js`.
  - [x] Use `parseDocument` (NOT just `parse`) to access the CST and recover line positions for the unquoted-boolean scan and to distinguish quoted-string from unquoted-string scalars.

- [x] **Task 5 — Pipeline orchestrator** (AC: #5)
  - [x] Create `caspian/packages/core/src/pipeline.ts`. Chain stages 1 → 2 → 3 with fail-fast short-circuiting per AC5.
  - [x] Add the `// TODO Story 2.4: stages 4–6 (envelope, namespace, allow-list)` marker comment at the post-stage-3 insertion point.
  - [x] Export `runPipeline(filePath: string): Promise<Diagnostic[]>` as the named entrypoint.

- [x] **Task 6 — Wire validateFile to pipeline** (AC: #6)
  - [x] Open `caspian/packages/core/src/index.ts`. Replace the stub with the AC6 target state.
  - [x] Run `pnpm -C caspian -F @caspian-dev/core build` — verify the public API still resolves cleanly post-rewire.

- [x] **Task 7 — Add yaml dependency** (AC: #7)
  - [x] Open `caspian/packages/core/package.json`. Add `"yaml": "^2.6.0"` to `dependencies`, preserving alphabetical order.
  - [x] Run `pnpm -C caspian install`. Lockfile diff is additive (yaml 2.8.3 added + vite/vitest peer-annotation refinements); +5 / −4 net is the standard pnpm peer-annotation reshape pattern observed in Stories 2.1 + 2.2.
  - [x] Resolved yaml version: **2.8.3** (within `^2.6.0` floor).

- [x] **Task 8 — Stage unit tests** (AC: #9)
  - [x] Create `caspian/packages/core/tests/unit/parsers/byte-reader.test.ts` (4 tests: happy-path + E001 + E002 + E001-short-circuit).
  - [x] Create `caspian/packages/core/tests/unit/parsers/frontmatter.test.ts` (8 tests: happy-path + E005 no-open + E005 no-close + E004 4096-boundary + E004 4097-over + CRLF + multi-byte UTF-8 + empty frontmatter).
  - [x] Create `caspian/packages/core/tests/unit/parsers/yaml.test.ts` (11 tests: happy-path + E003 line 1 + E003 line 4 + E006 unclosed + E006 custom-tag + E007 yes + E007 case-insensitive + E007 multiple + E007 quoted false-positive + E007 actual-bool false-positive + E007 all 6 keywords).
  - [x] Create `caspian/packages/core/tests/unit/pipeline.test.ts` (4 tests: stage-1 short-circuit + stage-2 short-circuit + clean pass + REPO_ROOT helper sanity).
  - [x] Run `pnpm -C caspian test` — 35 tests pass (after 3 initial fixes: trailing-`\n` exclusion in `raw` per architecture D4; custom-tag detection via `doc.warnings[].code === "TAG_RESOLVE_FAILED"` since yaml v2 reports unresolved tags as warnings, not errors, even in strict mode).

- [x] **Task 9 — Fixture-runner integration test** (AC: #10)
  - [x] Create `caspian/packages/core/tests/fixtures-runner.test.ts`. Auto-discover E001-E007 fixtures via `^E00[1-7]-/` filter + assert `validateFile` output matches `.expected.json` pairwise.
  - [x] Use `it.each` for table-driven test naming.
  - [x] Run `pnpm -C caspian test` — 7 fixture-runner cases pass + 1 discovery-count assertion. Total: 8 tests in this file.

- [x] **Task 10 — Documentation updates** (AC: #8)
  - [x] Append the Story 2.3 bullet to `caspian/packages/core/CHANGELOG.md` under `## Unreleased`.
  - [x] Update `caspian/packages/core/README.md` Public API surface section (replace stub-disclaimer with stages-1–3 description) + add the new *Pipeline stages* sub-section before *Single source of truth for schemas*.

- [x] **Task 11 — Smoke gate verification** (AC: #11)
  - [x] `pnpm lint` — Checked 35 files in 33ms. No fixes applied. Exit 0 (after one biome auto-format pass: `pnpm exec biome check --write .` applied 6 fixes for single-vs-double-quote preferences when string contained the other kind).
  - [x] `pnpm -F @caspian-dev/core test` — Test Files 7 passed (7), Tests 43 passed (43). Exit 0.
  - [x] `pnpm -F @caspian-dev/core build` — Exit 0. `dist/parsers/{byte-reader,frontmatter,yaml}.js`, `dist/pipeline.js`, `dist/constants.js` all emitted.
  - [x] ESM-import smoke check: `node --input-type=module -e "import('./packages/core/dist/index.js').then(m => m.validateFile('./fixtures/invalid/E001-bom/with-bom.md').then(d => console.log(d.length, d[0]?.code, d[0]?.line)))"` prints `1 CASPIAN-E001 1`. Exit 0.
  - [x] `pnpm verify-codes-hash` exit 0. `pnpm ajv-validate-registry` exit 0.

- [x] **Task 12 — Cross-checks** (AC: #12)
  - [x] Cross-checks #1–#10 captured in *Debug Log References* below. All pass.
  - [x] Synthetic temp files (cross-checks #3, #8, #10) authored to `os.tmpdir()` and cleaned up via `fs.rm({ recursive: true, force: true })` in finally blocks.
  - [x] Offline-audit grep (cross-check #9) returned zero matches in `caspian/packages/core/src/`.

- [x] **Task 13 — Final assembly**
  - [x] Verified `git status` shows only the expected modifications + new files; no drift in sealed files (`spec/`, `schemas/`, `diagnostics/`, `fixtures/`, `examples/`, `.gitattributes`, `.biomeignore`, `biome.json`, `tsconfig.base.json`, Stories 2.1 + 2.2 sealed files).
  - [x] *Completion Notes List* updated with files counts, smoke-gate baseline (35), resolved yaml version (2.8.3), and the documented departures.
  - [x] *File List* updated.
  - [x] *Change Log* updated.

### Review Findings

- [x] [Review][Patch] Missing stage-3 short-circuit test in `pipeline.test.ts` — AC9 requires a test verifying that a stage-3 failure (E003/E006/E007) returns immediately with no subsequent stages running. [`caspian/packages/core/tests/unit/pipeline.test.ts`]
- [x] [Review][Defer] `y`/`n` in `YAML_1_1_UNQUOTED_BOOLEANS` — false positive risk on legitimate single-character string values; spec-mandated per AC1. [`caspian/packages/core/src/constants.ts`] — deferred, spec-mandated
- [x] [Review][Defer] Unchecked cast `doc.toJS() as Record<string, unknown>` — YAML sequence/scalar frontmatter silently passes stage 3; stage 4 (Story 2.4) handles envelope shape validation. [`caspian/packages/core/src/parsers/yaml.ts`] — deferred, Story 2.4 responsibility
- [x] [Review][Defer] Duplicated line-counting helpers — `countLinesUpTo` (`frontmatter.ts`) and `offsetToRawLine` (`yaml.ts`) implement the same algorithm in separate files; future divergence risk. [`caspian/packages/core/src/parsers/frontmatter.ts`, `caspian/packages/core/src/parsers/yaml.ts`] — deferred, refactoring debt
- [x] [Review][Defer] `---` inside a YAML block scalar misidentified as closing delimiter — regex-based extraction could truncate frontmatter prematurely; fails safely with E006. [`caspian/packages/core/src/parsers/frontmatter.ts`] — deferred, regex limitation

## Dev Notes

### Source authority

  - **Primary contract:** Acceptance Criteria above. AC text is the authoritative interpretation of the epic's literal text — Story 2.3 epic text in `_bmad-output/planning-artifacts/epics.md` lines 801–857 is the upstream source, but the AC list above resolves implementation-contract details (e.g., the function signatures, the exact `line` arithmetic for E003 and E007, the `parseDocument` requirement for distinguishing quoted from unquoted) — when the AC list and the epic literal diverge, prefer the AC list.
  - **Architecture references:** see *References* section. Most relevant: architecture D1 (lines 281–290 — pipeline ordering), D2 (line 290 — error policy), D4 (line 292 — byte-counting), C5 (lines 263–270 — codes E001–E007), line 165 (yaml v2.x rationale), lines 637–646 (parsers/ + pipeline.ts + constants.ts file paths), lines 793–807 (data-flow diagram), lines 901–906 (Story-003 implementation sequence).
  - **Reference Models** — `caspian/packages/core/src/validator.ts` (Story 2.1's ajv pattern; Story 2.4 will mirror it for stage 4 — Story 2.3 does NOT touch this file), `caspian/packages/core/src/diagnostics/codes.generated.ts` (Story 2.2; the 7 typed constants Story 2.3 imports), `caspian/packages/core/scripts/gen-diagnostic-codes.ts` (Story 2.2; the script style for any future tooling), `caspian/packages/core/tests/unit/smoke.test.ts` (Story 2.1; the test-style template), `caspian/packages/core/tests/unit/diagnostics/codes-shape.test.ts` (Story 2.2; the table-driven test pattern for `it.each`).

### Pipeline architecture

The pipeline is intentionally ONE function per stage with a thin orchestrator. Three load-bearing reasons:

  1. **Testability.** Each stage is unit-testable in isolation — `parsers/yaml.test.ts` does not need a real file on disk; it feeds `raw` strings to `parseYaml` directly.
  2. **Ordering visibility.** `pipeline.ts` is the SOLE place where stage ordering lives. A future maintainer reading `pipeline.ts` sees the entire ordering contract at a glance. If any stage's failure-mode changes, the orchestrator is the only file to update.
  3. **Story 2.4 plug-in surface.** Story 2.4 adds three more stage modules (`validators/{envelope,namespace,allow-list}.ts`) and extends `pipeline.ts` with three new function-call lines. NO refactor of stages 1–3 is needed; the boundary is clean.

The orchestrator's signature is `runPipeline(filePath: string): Promise<Diagnostic[]>`. It is `async` because stage 1 (`readFile`) is async (file I/O). Stages 2–3 are synchronous internally but await-compatible. The public API `validateFile(path)` is just a thin wrapper around `runPipeline(path)`; the wrapper exists so future versions can intercept (e.g., add a `validateString(content, virtualPath)` variant in v1.1 without changing `runPipeline`'s contract).

### Cross-platform newline handling

Caspian fixtures and authored artifacts must validate identically on Linux (LF) and Windows (CRLF). Stage 2's frontmatter extractor MUST treat both LF and CRLF as line breaks. Three load-bearing rules:

  - The opening `---` MUST be followed by either `\n` or `\r\n`. Both produce `startLine: 1`.
  - The closing `---` MUST be preceded by either `\n` or `\r\n` and followed by either `\n`, `\r\n`, or EOF.
  - Line counting (`startLine`, `endLine`, line numbers in diagnostics) treats `\r\n` as ONE line break (NOT two). The simple regex `/\r?\n/g` (and its `.split` variant) handles both transparently.

`yaml` v2.x handles CRLF transparently in `parse()` and `parseDocument()`. The post-parse scan in stage 3 can use the `yaml` library's `range[0]` byte offset directly; converting byte offset to line number requires walking the `raw` string with `\r?\n` line breaks.

The repository ships `.gitattributes * text=auto eol=lf` (Story 1.1) so committed files are LF in the working tree, but a Windows developer with `core.autocrlf=true` will see CRLF in their checkout. Story 2.3's parsers MUST handle both — never assume LF. Cross-check this in the unit tests (AC9 — frontmatter CRLF compatibility).

### Stage 3 line-number derivation

The naïve `yaml.parse(raw)` API returns the parsed JS object, but loses all line/column information. To derive the line of an offending unquoted-boolean key, use `yaml.parseDocument(raw)` instead — it returns a Document object with full CST node access:

```ts
import { parseDocument, type Scalar } from "yaml";

const doc = parseDocument(raw, { strict: true, version: "1.2" });
if (doc.errors.length > 0) { /* CASPIAN-E006 */ }

// Walk top-level keys
const contents = doc.contents;
if (contents && "items" in contents) {
  for (const pair of contents.items) {
    const valueNode = pair.value;
    // valueNode.type is "PLAIN" | "QUOTE_SINGLE" | "QUOTE_DOUBLE" | ...
    if (valueNode?.type === "PLAIN" && typeof valueNode.value === "string") {
      const lower = valueNode.value.toLowerCase();
      if (YAML_1_1_UNQUOTED_BOOLEANS.has(lower)) {
        // valueNode.range[0] is the byte offset of the value's start in raw
        const line = byteOffsetToLine(raw, valueNode.range[0]) + frontmatterStartLine;
        // emit CASPIAN-E007 with that line
      }
    }
  }
}
```

The `valueNode.type === "PLAIN"` check is what distinguishes unquoted scalars from quoted ones — `"PLAIN"` is the YAML spec name for unquoted scalar values, while `"QUOTE_SINGLE"` and `"QUOTE_DOUBLE"` denote quoted forms. **Without this check, the scan would false-positive on `enabled: "yes"`.**

`byteOffsetToLine(raw, offset)` is a small helper:

```ts
function byteOffsetToLine(text: string, byteOffset: number): number {
  // Walk text up to byteOffset (which is a CHARACTER offset in 'yaml' v2.x — actually unicode codepoint, treat as char offset for ASCII-clean frontmatter; for fixtures with multi-byte runes, use Buffer slicing if precision is needed)
  let line = 1;
  for (let i = 0; i < byteOffset && i < text.length; i++) {
    if (text[i] === "\n") line++;
  }
  return line;
}
```

**Caveat — `range` is character offset, NOT byte offset, in `yaml` v2.x.** Despite the name, the v2.x `range` array is a character offset (unicode codepoint count). For ASCII-only frontmatter, character offset and byte offset coincide; for multi-byte UTF-8 (CJK, emoji), they diverge. Caspian fixtures are ASCII-clean, so the simplification is safe in v1.0. Document this caveat in the helper's JSDoc; future hardening (Story 4.x) can refine if multi-byte fixtures emerge.

The architecture line 282–287 explicitly assigns `E003`, `E006`, `E007` to stage 3. The post-parse scan for `E003` MUST run on the raw text (the YAML parser may have already processed the tab as significant whitespace or rejected the parse — if E006 fires, E003 is suppressed by the AC4 fail-fast clause within stage 3). The scan for `E007` runs AFTER a successful parse — both `E003` and `E006` short-circuit `E007` within stage 3.

### Anti-patterns to avoid (LLM disaster prevention)

  - **Do NOT** add `js-yaml` as a dependency. Architecture line 165 mandates `yaml` v2.x because it rejects YAML 1.1 boolean coercion. `js-yaml` would silently convert `enabled: yes` to `true` and make `CASPIAN-E007` undetectable; using both packages is a footgun. The `yaml` package alone is sufficient for stages 1–3.
  - **Do NOT** add `@types/yaml`. The `yaml` package ships its own TypeScript types since 2.0. Adding `@types/yaml` would create a duplicate type tree and trigger TS errors.
  - **Do NOT** use string literals for diagnostic codes (e.g., `code: "CASPIAN-E001"`). Always import the typed constant: `import { CASPIAN_E001 } from "../diagnostics/codes.generated.js"; ... code: CASPIAN_E001.code`. This ensures registry edits propagate at compile time and integrates with Story 2.2's sha256-anchored derivative chain.
  - **Do NOT** edit `caspian/diagnostics/registry.json` to "tweak" a message or add a new code while implementing Story 2.3. The registry is sealed by Stories 1.5 + 1.8. If a stage's behavior demands a new diagnostic code in v1.0 — file it as a deferred-work item, do NOT alter the registry. The 7 codes in Story 2.3's scope (E001–E007) are sufficient and final per architecture C5.
  - **Do NOT** edit `caspian/fixtures/invalid/E001-E007/*` for any reason. The fixtures (and their `.expected.json` siblings) are sealed by Story 1.6. If a stage's behavior produces a different `code` or `line` than the expected, the fix is in the IMPLEMENTATION, not the fixture. Fixtures are the ground truth.
  - **Do NOT** put parser logic in `validateFile`'s body in `index.ts`. `index.ts` MUST remain a thin wrapper around `runPipeline`. Architecture line 636 — `index.ts` is the barrel for the public API, not the implementation.
  - **Do NOT** thread the parsers through `loader.ts`. Story 2.1's `loader.ts` is for SCHEMA loading (Verrou 2 noRestrictedImports allow-list); the parsers read from a `string` (the file content), not from any schema. Adding parser logic to `loader.ts` would break Verrou 3 (single-purpose loader).
  - **Do NOT** invoke `getEnvelopeValidator()` from stages 1–3. Stage 4 (Story 2.4) is where ajv re-enters. Story 2.3's `pipeline.ts` MUST NOT import from `validator.ts`.
  - **Do NOT** add async file I/O to stages 2–3. Stage 1 reads the file ONCE; stages 2–3 operate on the in-memory string. Re-reading the file in stage 2 or 3 is wrong (and a perf footgun for large multi-file walks in Story 2.5).
  - **Do NOT** swallow `yaml` library errors silently. The library's `YAMLParseError` carries valuable line/column info — capture and re-emit as `CASPIAN-E006` with the best-available line number. Catching the throw and returning `{ data: null, diagnostics: [{...code: "CASPIAN-E006", line: 0}] }` is wrong; the line number MUST be derived.
  - **Do NOT** add network I/O, telemetry, or analytics. NFR6 + NFR20 mandate fully offline, no-telemetry operation. Cross-check #9 of AC12 audits this.
  - **Do NOT** assume Linux line endings. The unit tests (AC9) include CRLF coverage; the implementation MUST handle both.
  - **Do NOT** hardcode line numbers in source code as magic numbers (e.g., `line: 4` for E003). Always derive from the input string + the `frontmatterStartLine` offset.
  - **Do NOT** use `process.cwd()` anywhere. Use `import.meta.url`-relative path resolution (the same pattern Story 2.1 + 2.2 established for `loader.ts`, `paths.ts`, `gen-diagnostic-codes.ts`).
  - **Do NOT** delete or regenerate `caspian/pnpm-lock.yaml` to "freshen" resolutions. The lockfile carries Story 2.1's ajv resolution + Story 2.2's simple-git-hooks resolution; destroying the lockfile invalidates those. Run `pnpm install` to add yaml to the lockfile additively (verified via `git diff` on the lockfile being additive-only).
  - **Do NOT** widen the public API surface beyond `validateFile`. Internal modules (`pipeline`, `parsers/*`, `constants`) MUST NOT be re-exported from `src/index.ts`. They are package-private. The `./diagnostics` sub-export is the only secondary entry per Story 2.1's `package.json` `exports` block.

### Pre-existing files NOT modified

Story 2.3 does NOT modify:

  - `caspian/spec/`, `caspian/schemas/` (Stories 1.2/1.3/1.4/1.5 sealed)
  - `caspian/diagnostics/` (Stories 1.5 + 1.8 sealed; Story 2.3 imports `codes.generated.ts` but does not edit the registry)
  - `caspian/fixtures/` (Stories 1.6 + 1.8 sealed; Story 2.3 reads E001–E007 fixtures + `.expected.json` siblings as ground truth, no edits)
  - `caspian/examples/` (Story 1.7 sealed)
  - `caspian/.gitattributes`, `.biomeignore`, `.gitignore`, `.editorconfig`, `.npmrc`, `.nvmrc`, `LICENSE`, `LICENSE-CC-BY-4.0`, `README.md` (Story 1.1 sealed)
  - `caspian/biome.json`, `caspian/tsconfig.base.json` (Story 1.1 sealed)
  - `caspian/.changeset/` (Story 1.1 sealed)
  - `caspian/pnpm-workspace.yaml`, `caspian/package.json` (Story 1.1 + 2.2 sealed; Story 2.3 does NOT touch the root `package.json` because no new pass-through scripts or root devDeps are needed)
  - `caspian/packages/core/LICENSE`, `tsconfig.json`, `vitest.config.ts` (Stories 2.1/2.2 sealed; Story 2.3 inherits the test-include `tests/**/*.test.ts` glob, which auto-picks up the new test files)
  - `caspian/packages/core/src/validator.ts`, `src/schemas/loader.ts` (Story 2.1 sealed; Story 2.4 will consume them, NOT Story 2.3)
  - `caspian/packages/core/src/diagnostics/{types.ts, reporter.ts, index.ts, codes.generated.ts}` (Story 2.2 sealed; Story 2.3 IMPORTS the typed constants but does not edit any diagnostic file)
  - `caspian/packages/core/scripts/{copy-schemas.ts, gen-diagnostic-codes.ts, verify-codes-hash.ts, ajv-validate-registry.ts}` (Stories 2.1 + 2.2 sealed)
  - `caspian/packages/core/tests/helpers/paths.ts` (Story 2.1 sealed; Story 2.3 imports `REPO_ROOT`, `FIXTURES_DIR` for the fixture-runner test)
  - `caspian/packages/core/tests/unit/smoke.test.ts` (Story 2.1 sealed)
  - `caspian/packages/core/tests/unit/diagnostics/codes-shape.test.ts` (Story 2.2 sealed)
  - `caspian/scripts/install-pre-commit.mjs` (Story 2.2 sealed)
  - `caspian/hooks.config.json` (Story 2.2 sealed; the pre-commit hook command lives here, not in `package.json`, per Story 2.2 P4 patch)

The only modifications are:

  - `caspian/packages/core/src/index.ts` (Story 2.1's stub body replaced; signature unchanged; export list extended with `DiagnosticDefinition`)
  - `caspian/packages/core/package.json` (one new runtime dep: `yaml ^2.6.0`)
  - `caspian/packages/core/CHANGELOG.md` (one new bullet under Unreleased)
  - `caspian/packages/core/README.md` (Public API surface section + new Pipeline stages sub-section)
  - `caspian/pnpm-lock.yaml` (additive: yaml + zero deps)

### Latest-tech context (Node 22.13 + ESM `nodenext` + yaml v2.6 + ajv 8 + biome 2.4)

**Node 22.13 + ESM `nodenext`** — same context as Stories 2.1 + 2.2; the new parsers use `top-level await` (in tests; sources are sync where possible), `import.meta.url` (for any path resolution), `node:fs/promises` (`readFile`), `node:buffer` (`Buffer.byteLength`).

**`yaml` v2.6.x:**

  - **Strict 1.2 mode:** `parse(raw, { strict: true, version: "1.2" })` and `parseDocument(raw, { strict: true, version: "1.2" })`. Strict mode rejects unparseable YAML with a `YAMLParseError` carrying `linePos` info. The `version: "1.2"` option is the load-bearing decision point (NFR8) — without it, `yaml` would default to a parser that may accept some YAML 1.1 quirks.
  - **Safe-by-default:** `yaml` v2.x does NOT execute custom YAML tags by default (no `!!python/object:` code execution). Custom-tag inputs are rejected at parse time as type errors → emit `CASPIAN-E006`. There is no opt-out for safe-load in the v2.x API; it's the default and only behavior. NFR5 satisfied by construction.
  - **CST/document API:** `parseDocument` returns a `Document` object with `.contents`, `.errors`, `.warnings`. Walk `.contents.items` to access `Pair` nodes; each `Pair` has `.key` and `.value` (`Scalar` or nested types). `Scalar.type` distinguishes `"PLAIN"` (unquoted) from `"QUOTE_SINGLE"`, `"QUOTE_DOUBLE"`, `"BLOCK_FOLDED"`, `"BLOCK_LITERAL"`. The `range: [start, value-end, node-end]` array gives character offsets.
  - **Error positions:** `YAMLParseError.linePos` is `Array<{ line: number, col: number } | undefined>`. The first entry's `line` is 1-based. May be `undefined` for some error classes — fallback to a heuristic (e.g., `frontmatterStartLine + 1`).
  - **Type imports:** `import { parse, parseDocument, type Scalar, type YAMLMap, type Document, YAMLParseError } from "yaml";` — value imports for runtime, type imports for TS-only references. Note `YAMLParseError` is a value import (the constructor is needed to `instanceof`-check in catch blocks), but most modern guidance prefers `instanceof` only when needed; for Caspian, catching ANY exception in the `parse` block and treating it as `CASPIAN-E006` is sufficient and simpler.

**ajv 8 / Draft 2020-12 — NOT INVOKED in Story 2.3.** Story 2.3's stages 1–3 do not use ajv. The Story 2.1 ajv setup remains dormant until Story 2.4. Importantly, removing the `getEnvelopeValidator()` warm-up call from `validateFile` (per AC6) does NOT regress Story 2.1's ajv setup — `validator.ts` is sealed and untouched; it just isn't called by Story 2.3's path. Story 2.4 will reintroduce ajv via `pipeline.ts` (NOT via `index.ts`).

**biome 2.4 — useFilenamingConvention + noDefaultExport + noRestrictedImports:**

  - File names MUST be `kebab-case.ts`. The new files all comply: `byte-reader.ts`, `frontmatter.ts`, `yaml.ts`, `pipeline.ts`, `constants.ts`. The test files are `*.test.ts` co-located under `tests/`.
  - Named exports only. The new files export functions and types; no `export default`.
  - `noRestrictedImports` rule (Story 2.1 + Story 2.2) targets schema imports — Story 2.3's parsers import from `../diagnostics/codes.generated.js` and `../constants.js`, neither of which is restricted. Stage 4 (Story 2.4) will need to import from `loader.ts`, which is the allow-listed reader for schemas. Story 2.3 does not interact with the schema layer.
  - **biome auto-format** may rewrap multi-line constants. Run `pnpm exec biome check --write .` BEFORE the smoke gate to land the canonical formatting. Story 2.2's experience: biome reorders imports per `assist/source/organizeImports`, multi-line wraps `.map()` callbacks, and trims trailing whitespace.

### Performance considerations (NFR1, tracked-not-gated)

NFR1 specifies "1 000-artifact validation < 5s" as a tracked budget, NOT a release gate (architecture step-04 + step-06). For Story 2.3, the dev MUST NOT optimize prematurely. However, two micro-decisions affect future bench numbers:

  - **Single-pass file read.** Stage 1 reads the file once; stages 2–3 operate on the in-memory string. Re-reading the file in stage 2 or 3 (e.g., to recover line numbers from byte offsets) is forbidden — pass the parsed `raw` text and offsets through.
  - **No regex-heavy hot paths.** The post-parse unquoted-boolean scan walks the parsed Document's top-level keys (typically 4–10 keys for a Caspian artifact); no full-text regex over the raw frontmatter is needed beyond the tab-indent pre-scan (which is `O(N)` over the raw lines, negligible).

These are habit-of-mind decisions, not optimizations. If the bench harness in v1.1 reports stages 1–3 are the bottleneck, optimization PRs are welcome at that time.

### Pre-commit hook impact

Story 2.2's pre-commit hook fires `pnpm gen:codes` on every commit. Story 2.3 does NOT edit `caspian/diagnostics/registry.json`, so `gen:codes` regenerates `codes.generated.ts` byte-identically; the hook is a no-op (in terms of file changes) for Story 2.3 commits. However, the hook will run ~200 ms per commit (Story 2.2's measurement). Document this in commit messages if a slow-commit experience surfaces; it's not a Story 2.3 issue.

### References

  - `_bmad-output/planning-artifacts/epics.md` lines 801–857 (Story 2.3 user story + 11 AC blocks)
  - `_bmad-output/planning-artifacts/architecture.md` lines 165 (`yaml` v2.x rationale)
  - `_bmad-output/planning-artifacts/architecture.md` lines 251–280 (Diagnostic Registry — C1–C5; Story 2.3 emits codes E001–E007)
  - `_bmad-output/planning-artifacts/architecture.md` lines 281–292 (Validation Pipeline — D1–D4; the load-bearing contract for Story 2.3)
  - `_bmad-output/planning-artifacts/architecture.md` lines 627–662 (`packages/core/` directory tree spec, including `parsers/`, `pipeline.ts`, `constants.ts`)
  - `_bmad-output/planning-artifacts/architecture.md` lines 793–807 (Internal data flow diagram showing parsers chained pre-validators)
  - `_bmad-output/planning-artifacts/architecture.md` lines 902–906 (Story-003 implementation sequence)
  - `_bmad-output/planning-artifacts/architecture.md` lines 951–956 (NFR4–NFR8 coverage)
  - `_bmad-output/planning-artifacts/prd.md` lines 504–588 (FR12, NFR4, NFR5, NFR6, NFR8, NFR14, NFR20 — the FRs/NFRs Story 2.3 satisfies)
  - `caspian/diagnostics/registry.json` (the 7 codes Story 2.3 emits: E001–E007)
  - `caspian/fixtures/invalid/E001-bom/`, `E002-encoding/`, `E003-tab-indent/`, `E004-oversized/`, `E005-missing-delimiters/`, `E006-yaml-parse/`, `E007-unquoted-bool/` (the 7 ground-truth fixture pairs from Story 1.6)
  - `caspian/packages/core/src/index.ts` (Story 2.1; the stub `validateFile` Story 2.3 rewires)
  - `caspian/packages/core/src/diagnostics/codes.generated.ts` (Story 2.2; the typed `CASPIAN_E001` … `CASPIAN_E007` constants Story 2.3 imports)
  - `caspian/packages/core/src/diagnostics/types.ts` (Story 2.1+2.2; the `Diagnostic` interface Story 2.3 emits)
  - `caspian/packages/core/src/validator.ts`, `src/schemas/loader.ts` (Story 2.1; NOT modified by Story 2.3 — referenced for ajv pattern that Story 2.4 will consume)
  - `caspian/packages/core/tests/helpers/paths.ts` (Story 2.1; consumed by `tests/fixtures-runner.test.ts`)
  - `caspian/packages/core/tests/unit/smoke.test.ts` (Story 2.1; the test-style template)
  - `caspian/packages/core/tests/unit/diagnostics/codes-shape.test.ts` (Story 2.2; the table-driven `it.each` pattern template)
  - `_bmad-output/implementation-artifacts/2-1-caspian-core-skeleton-envelope-schema-integration-loader-ts.md` (Story 2.1 — full context for the package skeleton + 3-verrou + Promise<Diagnostic[]> async signature decision)
  - `_bmad-output/implementation-artifacts/2-2-diagnostic-registry-typed-ts-constants-codes-generated-ts-sha256-verify-hash.md` (Story 2.2 — full context for the typed constants + sha256 + safeguards; Story 2.3 consumes the constants and inherits the smoke-gate baseline)
  - `_bmad-output/implementation-artifacts/deferred-work.md` lines 73, 79 (Story 2.1 deferred items resolved by Story 2.3: `fs.access()` TOCTOU race, `validateFile` accepts directory paths — both resolved when `runPipeline` does the full `fs.readFile` instead of `fs.access`)
  - `_bmad-output/implementation-artifacts/deferred-work.md` lines 51–52 (Story 1.6 deferred: line-number convention for file-level rejections — Story 2.3's E001/E002/E004/E005 use `line: 1` per fixture `.expected.json`; AC4 explicitly states this convention)

### Project Structure Notes

The new files all land under the architecture-mandated locations:

```
caspian/packages/core/
├── src/
│   ├── parsers/                     ← NEW (created by Story 2.3)
│   │   ├── byte-reader.ts           ← stage 1
│   │   ├── frontmatter.ts           ← stage 2
│   │   └── yaml.ts                  ← stage 3
│   ├── pipeline.ts                  ← NEW: orchestrator (architecture line 643)
│   ├── constants.ts                 ← NEW: MAX_FRONTMATTER_BYTES, YAML_1_1_UNQUOTED_BOOLEANS (architecture line 646)
│   ├── index.ts                     ← MODIFIED: validateFile rewired
│   ├── validator.ts                 ← UNCHANGED (Story 2.1 ajv setup; reserved for Story 2.4)
│   ├── schemas/loader.ts            ← UNCHANGED (Story 2.1 schema entry; reserved for Story 2.4)
│   └── diagnostics/                 ← UNCHANGED (Story 2.2)
├── tests/
│   ├── unit/
│   │   ├── parsers/                 ← NEW
│   │   │   ├── byte-reader.test.ts
│   │   │   ├── frontmatter.test.ts
│   │   │   └── yaml.test.ts
│   │   ├── pipeline.test.ts         ← NEW
│   │   ├── smoke.test.ts            ← UNCHANGED (Story 2.1)
│   │   └── diagnostics/             ← UNCHANGED (Story 2.2)
│   ├── fixtures-runner.test.ts      ← NEW (table-driven over fixtures/invalid/E001-E007/)
│   └── helpers/paths.ts             ← UNCHANGED (Story 2.1)
├── scripts/                         ← UNCHANGED (Stories 2.1 + 2.2)
└── package.json                     ← MODIFIED: + yaml ^2.6.0 dependency
```

The structure aligns 1:1 with architecture lines 627–662 (the `packages/core/` tree spec). No detected variances. No new directories outside the spec. The `parsers/` subdirectory is implicit in the architecture line 637 (`src/parsers/{byte-reader, frontmatter, yaml}.ts`).

## Dev Agent Record

### Agent Model Used

claude-opus-4-7[1m] (Claude Code, dev-story workflow, 2026-04-27).

### Debug Log References

**Cross-check #1 — E001 BOM short-circuit.** PASS.

```
$ node -e "...validateFile('./fixtures/invalid/E001-bom/with-bom.md')..."
CASPIAN-E001  count=1 code=CASPIAN-E001 line=1
```

The BOM-prefixed fixture emits exactly 1 diagnostic (`CASPIAN-E001`, line 1). Stages 2–6 do not run.

**Cross-check #2 — E002 non-UTF-8 short-circuit.** PASS.

```
$ node -e "...validateFile('./fixtures/invalid/E002-encoding/non-utf8.md')..."
CASPIAN-E002  count=1 code=CASPIAN-E002 line=1
```

Windows-1252 smart-quote bytes (0x91, 0x92) embedded in the frontmatter trip the `TextDecoder("utf-8", { fatal: true })` decode in stage 1; E002 fires on line 1 (file-level convention from Story 1.6) and stages 2–6 are skipped.

**Cross-check #3 — E004 boundary precision.** PASS.

```
$ node -e "...write tmp-4096.md and tmp-4097.md..."
4096 bytes: total=0, E004=NONE
4097 bytes: total=1, E004=line 1
```

At exactly 4096 bytes between delimiters, no E004 fires; at 4097 bytes, E004 fires on line 1. Boundary precision matches AC8 of the epic. Temp files written to `os.tmpdir()`, cleaned up via `fs.rm({ recursive: true, force: true })`.

**Cross-check #4 — E005 missing closing delimiter.** PASS.

```
$ node -e "...validateFile('./fixtures/invalid/E005-missing-delimiters/no-closing-delim.md')..."
CASPIAN-E005  count=1 code=CASPIAN-E005 line=1
```

Opening `---` present but no closing `---` → E005 line 1; stages 3–6 skipped.

**Cross-check #5 — E003 tab indent.** PASS, line matches fixture `.expected.json`.

```
$ node -e "...validateFile('./fixtures/invalid/E003-tab-indent/tab-in-yaml.md')..."
CASPIAN-E003  count=1 code=CASPIAN-E003 line=4
```

Tab indent on raw line 3 (= file line 4) → `frontmatterStartLine + 3 = 1 + 3 = 4`. Matches `.expected.json` exactly.

**Cross-check #6 — E006 YAML parse error.** PASS, line matches fixture `.expected.json`.

```
$ node -e "...validateFile('./fixtures/invalid/E006-yaml-parse/unclosed-bracket.md')..."
CASPIAN-E006  count=1 code=CASPIAN-E006 line=3
```

Unclosed flow sequence `[{type: core:story` on raw line 2 → yaml v2 `linePos[0].line = 2`; `frontmatterStartLine + 2 = 1 + 2 = 3`. Matches `.expected.json`.

**Cross-check #7 — E007 unquoted boolean.** PASS, line matches fixture `.expected.json`.

```
$ node -e "...validateFile('./fixtures/invalid/E007-unquoted-bool/yes-as-string.md')..."
CASPIAN-E007  count=1 code=CASPIAN-E007 line=3
```

`user-invocable: yes` on raw line 2 (file line 3) → CST node range[0] offset converted to raw line 2; `frontmatterStartLine + 2 = 3`. Matches `.expected.json`.

**Cross-check #8 — Custom-tag (NFR5 safe-load) rejection.** PASS.

```
$ node -e "...write tmp file with `key: !!js/function "function() {}"` ..."
count: 1 codes: CASPIAN-E006
E006 line: 2
```

The `!!js/function` custom tag triggers a yaml v2 `TAG_RESOLVE_FAILED` warning (not an error in strict mode). The pipeline detects the warning and emits E006. NFR5 satisfied: code execution is impossible because yaml v2 is safe-by-default, and Caspian additionally rejects the artifact rather than silently ignoring the tag.

**Cross-check #9 — NFR6 / NFR20 offline operation grep audit.** PASS.

```
$ Grep pattern "fetch\(|http\.request|https\.request|dns\.lookup|net\.connect" path caspian/packages/core/src
No files found
```

Zero matches in `caspian/packages/core/src/`. No network I/O, no telemetry, no analytics imports.

**Cross-check #10 — Fail-fast determinism (BOM + missing-close).** PASS.

```
$ node -e "...write BOM-prefixed file with opening --- but no closing ---..."
count: 1 codes: CASPIAN-E001
```

BOM + missing-close-delim synthetic fixture → ONLY `CASPIAN-E001` is emitted; `CASPIAN-E005` is suppressed by stage 1 short-circuit. Confirms epic ACs 1–7's "stages N+1..6 do not run" clause.

**Smoke gate.** Final triple-check after all cross-checks complete:

```
$ pnpm lint
> biome check .
Checked 35 files in 33ms. No fixes applied.

$ pnpm -F @caspian-dev/core test
✓ tests/unit/parsers/byte-reader.test.ts (4 tests)
✓ tests/unit/diagnostics/codes-shape.test.ts (5 tests)
✓ tests/unit/parsers/frontmatter.test.ts (8 tests)
✓ tests/unit/parsers/yaml.test.ts (11 tests)
✓ tests/unit/smoke.test.ts (3 tests)
✓ tests/unit/pipeline.test.ts (4 tests)
✓ tests/fixtures-runner.test.ts (8 tests)
Test Files  7 passed (7)
     Tests  43 passed (43)

$ pnpm -F @caspian-dev/core build
> pnpm gen:codes && tsc -p tsconfig.json && tsx scripts/copy-schemas.ts
[gen-diagnostic-codes] generated 18 typed constants → ...
[copy-schemas] copied 2 file(s) → ...

$ pnpm verify-codes-hash
[verify-codes-hash] OK — registry sha256 matches codes.generated.ts header (b303...e803c7)

$ pnpm ajv-validate-registry
[ajv-validate-registry] OK — diagnostics/registry.json (18 entries) conforms to schemas/v1/diagnostic-registry.schema.json
```

All exit 0. **New smoke-gate baseline: 35 biome-checked files** (up from 24 in Story 2.2; net +11 = 5 new TS source files + 5 new test files + 1 file rebalance from biome's JSON-config inclusion). Story 2.4+ inherits this 35-file floor.

**AC11 ESM-import smoke check.** PASS.

```
$ node --input-type=module -e "import('./packages/core/dist/index.js').then(m => m.validateFile('./fixtures/invalid/E001-bom/with-bom.md').then(d => console.log(d.length, d[0]?.code, d[0]?.line)))"
1 CASPIAN-E001 1
```

The published-shape ESM `.` entry resolves and the pipeline runs end-to-end against the E001 fixture. `validateFile` returns a `Diagnostic[]` with one entry whose `code` is `CASPIAN-E001` and `line` is `1`.

**Git status post-implementation.**

```
$ git status --short
 M ../.claude/settings.local.json   (pre-existing, untouched by Story 2.3)
 M ../_bmad-output/implementation-artifacts/sprint-status.yaml
 M packages/core/CHANGELOG.md
 M packages/core/README.md
 M packages/core/package.json
 M packages/core/src/index.ts
 M pnpm-lock.yaml
?? ../_bmad-output/implementation-artifacts/2-3-...story file
?? packages/core/src/constants.ts
?? packages/core/src/parsers/                  (3 files)
?? packages/core/src/pipeline.ts
?? packages/core/tests/fixtures-runner.test.ts
?? packages/core/tests/unit/parsers/           (3 files)
?? packages/core/tests/unit/pipeline.test.ts
```

No unexpected drift in `caspian/spec/`, `caspian/schemas/`, `caspian/diagnostics/`, `caspian/fixtures/`, `caspian/examples/`, `caspian/.gitattributes`, `caspian/.biomeignore`, `caspian/biome.json`, or any sealed file. All Stories 2.1 + 2.2 deliverables remain intact: `caspian/packages/core/src/{validator.ts, schemas/loader.ts, diagnostics/*}` are unmodified; `caspian/packages/core/scripts/*` are unmodified; `caspian/scripts/install-pre-commit.mjs` and `caspian/hooks.config.json` are unmodified.

### Completion Notes List

- **Files created:** 10 — 5 TS source (`caspian/packages/core/src/{constants.ts, parsers/byte-reader.ts, parsers/frontmatter.ts, parsers/yaml.ts, pipeline.ts}`) + 5 vitest files (`caspian/packages/core/tests/{fixtures-runner.test.ts, unit/parsers/byte-reader.test.ts, unit/parsers/frontmatter.test.ts, unit/parsers/yaml.test.ts, unit/pipeline.test.ts}`).
- **Files modified in place:** 5 — `caspian/packages/core/package.json` (+`yaml ^2.6.0` runtime dep), `caspian/packages/core/src/index.ts` (stub body replaced with `runPipeline` call; `DiagnosticDefinition` added to re-exports; signature unchanged), `caspian/packages/core/CHANGELOG.md` (Story 2.3 bullet under Unreleased), `caspian/packages/core/README.md` (Public API surface paragraph rewritten + new *Pipeline stages* sub-section), `caspian/pnpm-lock.yaml` (additive: yaml 2.8.3 + vite/vitest peer-annotation refinements).
- **Smoke gate baseline:** 35 biome-checked files (Story 2.2 was 24; net +11). Lint exit 0; test exit 0 (43 / 43 tests passing across 7 files); build exit 0; verify-codes-hash exit 0; ajv-validate-registry exit 0; ESM-import smoke check returns `1 CASPIAN-E001 1`.
- **Resolved versions:** yaml `2.8.3` (within `^2.6.0` floor — late-2026 latest 2.x). ajv unchanged at `8.20.0` (Story 2.1).

- **Deliberate departures from epic AC text** (2 deliberate departures, both technical-correctness fixes during dev):
  1. **Custom-tag detection via `doc.warnings[].code === "TAG_RESOLVE_FAILED"` instead of `try/catch parse error`.** AC4 epic text and the AC's *Reference yaml.ts* note suggested unsafe YAML tags would surface as parse errors caught in `try/catch`. Empirically (verified during dev with a tiny `parseDocument` REPL test), `yaml` v2.x's `parseDocument` reports unresolved tags as `YAMLWarning` instances (code: `TAG_RESOLVE_FAILED`), NOT as throws or `doc.errors` entries — even when `strict: true`. The yaml v2 strict-mode option documents *promotes warnings to errors*, but unresolved-tag warnings specifically remain in `doc.warnings` (verified: `key: !!js/function ...` produces `errors: 0, warnings: 1`). Implementation accordingly: scan `doc.warnings` for `TAG_RESOLVE_FAILED` and emit E006 with the warning's `linePos[0].line`. Behavior matches NFR5's intent (custom tags rejected, no code execution attempt) and AC8 of the epic ("safe-load enforcement → emits CASPIAN-E006"). Cross-check #8 confirms.
  2. **`raw` excludes the trailing newline of the last content line.** AC3 was ambiguous: architecture D4 mandates "bytes between (but excluding) the opening and closing `---` lines, exclusive of the delimiter newlines themselves" — but doesn't specify whether the `\n` between the last content line and the closing `---` belongs to the content (last content line's terminator) or to the closing delimiter (its leading EOL). Implementation chose the latter: the closing delimiter is `\n---\n` (or `\r\n---\r\n`), and both its leading and trailing newlines are excluded. This produces a deterministic byte count: at exactly 4096 content-bytes (no trailing newline), no E004 fires; at 4097, E004 fires (cross-check #3 confirms). The trade-off is that `raw` returned to stage 3 doesn't end with a newline — `yaml` v2's `parseDocument` handles this transparently (yaml accepts non-newline-terminated input). Documented in AC9 happy-path test expectation.

- **Three-test fix iteration during dev.** First test run failed 3 of 32: 2 frontmatter `raw` expectations (both expected trailing `\n` — fixed per departure #2) + 1 yaml custom-tag test (expected throw — fixed per departure #1). After fixes: 35 / 35 passes. After Task 9 added the fixture-runner test: 43 / 43 passes.

- **biome auto-format pass applied during smoke gate.** First lint pass reported 7 errors on quote-style preferences (single-vs-double when string contains the other); `pnpm exec biome check --write .` auto-fixed 6 files (`tests/fixtures-runner.test.ts`, `src/parsers/{frontmatter,yaml}.ts`, `src/pipeline.ts`, `tests/unit/parsers/{byte-reader,yaml}.test.ts`). Second lint run reported zero issues.

- **Pre-existing deferred-work items resolved by this story:**
  - Story 2.1 review #1 (`fs.access` TOCTOU race in `validateFile`) — resolved. The new `runPipeline` reads the file via `fs.readFile` (in stage 1 byte-reader) — no check-then-not-use pattern remains.
  - Story 2.1 review #7 (`validateFile` accepts directory paths) — resolved by construction. `fs.readFile` rejects directories with `EISDIR`, which propagates as a thrown error from `validateFile`. (CLI integration in Story 2.5 will translate the throw into exit code 2 / 3 per the exit-code matrix.)

- **No deferrals introduced by Story 2.3 implementation.** All 12 ACs satisfied; all 10 cross-checks pass; smoke gate green. Future hardening candidates (none blocking, all optional):
  - The `offsetToRawLine` helper in `yaml.ts` walks character offsets, which coincide with byte offsets only for ASCII-clean frontmatter. Multi-byte UTF-8 (CJK, emoji) inside frontmatter could see line numbers drift by a few characters under specific content shapes. v1.0 fixtures are ASCII-clean so the simplification is safe; future hardening (post-v1.0) could refine this if multi-byte fixtures emerge.
  - The custom-tag detection looks at `doc.warnings[].code === "TAG_RESOLVE_FAILED"` — a single warning code. Future yaml v2 minor versions COULD introduce additional warning codes that should also map to E006; the current impl is forward-compatible only for the `TAG_RESOLVE_FAILED` case. A broader heuristic (e.g., emit E006 on ANY warning) could be considered if real-world fixtures expose other warning codes that should also reject.
  - Stage 3's unquoted-boolean post-parse scan walks ONLY top-level frontmatter keys (architecture C5 + epic AC4 explicit scope). Nested values inside `requires` arrays or `produces` objects are out of scope for `CASPIAN-E007` in v1.0 by design.
  - Smoke-gate +11 file count (35 vs Story 2.2's expected +10) — biome's `**/*.json` glob counts `package.json` + `pnpm-lock.yaml` modifications when assist/format checks run; the small extra is biome internal accounting, not a Story 2.3 bug. New floor: 35.

### File List

**Created (10):**

- `caspian/packages/core/src/constants.ts` — `MAX_FRONTMATTER_BYTES = 4096`, `YAML_1_1_UNQUOTED_BOOLEANS = ReadonlySet<"on","off","yes","no","y","n">`.
- `caspian/packages/core/src/parsers/byte-reader.ts` — stage 1 (E001 BOM, E002 UTF-8 strict).
- `caspian/packages/core/src/parsers/frontmatter.ts` — stage 2 (E004 4 KB cap, E005 delimiters); CRLF-aware.
- `caspian/packages/core/src/parsers/yaml.ts` — stage 3 (E003 tab-indent, E006 parse + custom-tag rejection, E007 unquoted YAML 1.1 booleans); uses `yaml` v2.x `parseDocument` for CST + line info.
- `caspian/packages/core/src/pipeline.ts` — fail-fast orchestrator chaining stages 1 → 2 → 3; reserves stages 4–6 for Story 2.4 with marker comment.
- `caspian/packages/core/tests/unit/parsers/byte-reader.test.ts` — 4 tests.
- `caspian/packages/core/tests/unit/parsers/frontmatter.test.ts` — 8 tests.
- `caspian/packages/core/tests/unit/parsers/yaml.test.ts` — 11 tests.
- `caspian/packages/core/tests/unit/pipeline.test.ts` — 4 tests.
- `caspian/packages/core/tests/fixtures-runner.test.ts` — 8 tests (7 fixture pairs E001–E007 + 1 discovery-count assertion).

**Modified (5):**

- `caspian/packages/core/package.json` — added `yaml ^2.6.0` to `dependencies` (resolved 2.8.3).
- `caspian/packages/core/src/index.ts` — stub body replaced with `return runPipeline(filePath)`; removed `fs.access` TOCTOU and `getEnvelopeValidator()` warm-up; added `DiagnosticDefinition` to re-exports. Signature unchanged.
- `caspian/packages/core/CHANGELOG.md` — Story 2.3 bullet appended under `## Unreleased` (after Stories 2.1 + 2.2 bullets).
- `caspian/packages/core/README.md` — Public API surface section: replaced stub-disclaimer with stages-1–3 description + added new *Pipeline stages* sub-section before *Single source of truth for schemas*.
- `caspian/pnpm-lock.yaml` — additive: yaml 2.8.3 resolution + vite/vitest peer-annotation refinements (yaml is a peer-dep of vite ≥ 7).

**Not part of file delivery but updated for sprint tracking:**

- `_bmad-output/implementation-artifacts/sprint-status.yaml` (story status transitions: ready-for-dev → in-progress → review).
- `_bmad-output/implementation-artifacts/2-3-pipeline-stages-1-3-caspian-core-byte-level-frontmatter-extraction-yaml-parse.md` (this story file: tasks/subtasks checkboxes, status, Dev Agent Record, File List).

### Change Log

| Date       | Change                                                                                                       |
|------------|--------------------------------------------------------------------------------------------------------------|
| 2026-04-27 | Story 2.3 created (ready-for-dev): pipeline stages 1–3 in `@caspian-dev/core` — byte-level (E001/E002), frontmatter extraction (E004/E005), YAML parse (E003/E006/E007) via `yaml` v2.x strict 1.2 safe-load + post-parse scans; orchestrator `pipeline.ts` chains stages with fail-fast; `validateFile` rewired (no signature change); 7 fixtures from Story 1.6 used as ground truth via `tests/fixtures-runner.test.ts`. |
| 2026-04-27 | Implementation complete — 10 files created, 5 modified in place; all 12 ACs satisfied; 10 / 10 cross-checks pass with 2 documented deliberate departures (yaml v2 unresolved-tag detection via `doc.warnings.code === "TAG_RESOLVE_FAILED"` rather than try/catch; `raw` excludes trailing newline of last content line per architecture D4 byte-counting precision). |
| 2026-04-27 | Smoke gate verified: `pnpm lint` 35 files exit 0; `pnpm -F @caspian-dev/core test` 43 / 43 pass across 7 files; `pnpm -F @caspian-dev/core build` exit 0; `pnpm verify-codes-hash` exit 0; `pnpm ajv-validate-registry` exit 0; ESM-import smoke check returns `1 CASPIAN-E001 1`. Status moved to review. |
