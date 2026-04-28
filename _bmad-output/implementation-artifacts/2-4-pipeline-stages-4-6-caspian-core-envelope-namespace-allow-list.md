# Story 2.4: Pipeline stages 4–6 in `@caspian-dev/core` (envelope + namespace + allow-list)

Status: review

## Story

As a plugin author,
I want the validator to enforce envelope shape, warn on non-`core:*` types and unknown fields, and offer edit-distance suggestions,
So that I get strict-but-friendly feedback that matches the FR12 (warn on out-of-allow-list) + FR13 (warn-on-unregistered-namespace) + FR9 (suggestion + doc link) contract.

## Working Directory

All paths in this story resolve **inside `caspian/`** — the sub-monorepo under the surrounding `joselimmo-marketplace-bmad` repository. References like `packages/core/`, `diagnostics/`, `schemas/v1/`, `fixtures/`, `biome.json` resolve to `caspian/packages/core/`, etc. Never create files outside `caspian/` (with the single exception of sprint-status / story-file updates under `_bmad-output/implementation-artifacts/`).

`caspian/packages/core/` already exists from Stories 2.1–2.3 with: package skeleton, envelope schema integration via `schemas/loader.ts` + `validator.ts` (ajv 2020-12 instance with `allErrors: true`), typed diagnostic constants (`codes.generated.ts` — 18 entries including E008–E014, W001–W004), `Diagnostic` / `DiagnosticDefinition` / `Severity` types, and pipeline stages 1–3 in `parsers/{byte-reader,frontmatter,yaml}.ts` + `pipeline.ts` + `constants.ts`.

**Story 2.4 plugs stages 4–6 into the existing `pipeline.ts` hook** (`// TODO Story 2.4: stages 4–6`) and creates the three validator modules in `src/validators/`.

This story creates these new files in `caspian/packages/core/`:

- `src/validators/envelope.ts` — stage 4 (ajv envelope shape validation; emits `CASPIAN-E008`–`E014`).
- `src/validators/namespace.ts` — stage 5 (namespace + schema_version warnings; emits `CASPIAN-W002`, `W003`, `W004`).
- `src/validators/allow-list.ts` — stage 6 (22-field allow-list scan + edit-distance suggestion; emits `CASPIAN-W001`).
- `tests/unit/validators/envelope.test.ts`, `tests/unit/validators/namespace.test.ts`, `tests/unit/validators/allow-list.test.ts` — stage-level unit tests.

This story modifies these pre-existing files in place:

- `caspian/packages/core/src/constants.ts` — add `RECOGNIZED_FIELDS`, `SUPPORTED_SCHEMA_VERSIONS`, `CANONICAL_CORE_NAMES` constants.
- `caspian/packages/core/src/pipeline.ts` — replace the `// TODO` placeholder and `void stage3.data` with actual stages 4–6 calls.
- `caspian/packages/core/tests/fixtures-runner.test.ts` — widen the discovery filter from `^E00[1-7]-` to cover E008–E014, W001–W004.
- `caspian/packages/core/tests/unit/pipeline.test.ts` — add stage 4–6 assertions.
- `caspian/packages/core/CHANGELOG.md` — append Story 2.4 bullet.
- `caspian/packages/core/README.md` — update the Pipeline stages table (replace `(Story 2.4)` placeholder with actual modules).

This story does NOT modify `caspian/diagnostics/registry.json` (sealed), `caspian/schemas/v1/*` (sealed), `caspian/fixtures/**` (sealed), `caspian/packages/core/src/diagnostics/*` (sealed by Story 2.2), `caspian/packages/core/src/parsers/*` (sealed by Story 2.3), `caspian/packages/core/src/index.ts` (sealed by Story 2.3), `caspian/packages/core/src/validator.ts` / `src/schemas/loader.ts` (sealed by Story 2.1 — Story 2.4 *consumes* these, does not change them), `caspian/packages/core/package.json` (no new runtime deps — `ajv` and `yaml` already present from Stories 2.1 + 2.3).

## Background

Story 2.3 delivered a real `validateFile` implementation covering pipeline stages 1–3: encoding sniff → frontmatter extraction → YAML parse. On a file passing all three stages, `pipeline.ts` returns `[]` (the `// TODO Story 2.4` placeholder). Files with valid YAML but broken envelope shape, wrong type namespace, or unknown fields silently pass — which is the known gap Story 2.4 closes.

The pipeline ordering is defined by architecture D1 (fail-fast per stage):

```
stage 1 — byte-reader.ts        (E001, E002)                fail-fast
stage 2 — frontmatter.ts        (E004, E005)                fail-fast
stage 3 — yaml.ts               (E003, E006, E007)          fail-fast
──────────────────────────── stage 3 succeeded ─────────────────────────────
stage 4 — validators/envelope.ts     (E008–E014)            continue-and-collect
stage 5 — validators/namespace.ts    (W002, W003, W004)     continue-and-collect
stage 6 — validators/allow-list.ts   (W001)                 continue-and-collect
```

After stage 3 succeeds, stages 4, 5, 6 each emit independent diagnostics — all three always run, and their results are concatenated. This is architecture D2 (continue-and-collect). There is no fail-fast within or between stages 4–6.

Stage 4 uses the existing `getEnvelopeValidator()` from `validator.ts` (Story 2.1 — ajv compiled against `schemas/v1/envelope.schema.json`). Stage 4's job is to map ajv validation errors to Caspian diagnostic codes (E008–E014) and derive per-error line numbers via YAML CST.

Stage 5 uses the parsed `data` object from stage 3 to check the `type` field's namespace and the `schema_version` value.

Stage 6 uses the raw frontmatter text and its CST to enumerate field names and compare against the 22-field allow-list.

The 17 invalid fixtures on disk already cover E008–E014 and W001–W004 (created by Stories 1.6 + 1.8). The fixture-runner test currently filters to `E00[1-7]`; Story 2.4 widens the filter and validates against the full canonical fixture set.

## Acceptance Criteria

### AC1 — Three new constants added to `constants.ts`

**`RECOGNIZED_FIELDS: ReadonlySet<string>`** — the 22-field allow-list for stage 6:

- 4 Caspian core: `schema_version`, `type`, `requires`, `produces`
- 6 agentskills.io canonical: `name`, `description`, `license`, `allowed-tools`, `metadata`, `compatibility`
- 12 Claude Code overlay: `when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `model`, `effort`, `context`, `agent`, `hooks`, `paths`, `shell`

Export as a frozen `ReadonlySet<string>`:

```ts
export const RECOGNIZED_FIELDS: ReadonlySet<string> = Object.freeze(
  new Set([
    "schema_version", "type", "requires", "produces",
    "name", "description", "license", "allowed-tools", "metadata", "compatibility",
    "when_to_use", "argument-hint", "arguments", "disable-model-invocation",
    "user-invocable", "model", "effort", "context", "agent", "hooks", "paths", "shell",
  ]),
);
```

**`SUPPORTED_SCHEMA_VERSIONS: ReadonlySet<string>`** — recognized `schema_version` values for W003:

```ts
export const SUPPORTED_SCHEMA_VERSIONS: ReadonlySet<string> = Object.freeze(
  new Set(["0.1"]),
);
```

**`CANONICAL_CORE_NAMES: ReadonlySet<string>`** — canonical `core:*` names derived from `caspian/spec/vocabulary/*.md` (one file per type, excluding README.md and glossary.md) for W004:

```ts
export const CANONICAL_CORE_NAMES: ReadonlySet<string> = Object.freeze(
  new Set([
    "overview", "plan", "learning", "review",
    "rule", "scratch", "convention", "story", "epic", "adr",
  ]),
);
```

All constants use named exports only (no `export default` — biome rule). Append after the existing `YAML_1_1_UNQUOTED_BOOLEANS` definition; do not change the existing constants.

### AC2 — Stage 4: `validators/envelope.ts`

Create `caspian/packages/core/src/validators/envelope.ts` and export:

```ts
export interface EnvelopeValidateResult {
  diagnostics: Diagnostic[];
}

export async function validateEnvelope(
  data: Record<string, unknown> | null,
  raw: string,
  startLine: number,
): Promise<EnvelopeValidateResult>;
```

Behavior:

- Call `getEnvelopeValidator()` (from `../../validator.js`) to obtain the compiled ajv function. This reuses the Story 2.1 cached validator — no re-compilation.
- If `data === null` (should not happen in normal flow since stage 3 fail-fast guards against it, but defensive): return `[{ code: CASPIAN_E008.code, severity: CASPIAN_E008.severity, line: startLine, message: CASPIAN_E008.message }]`.
- Run `validate(data)`. Collect `validate.errors ?? []`. Map each ajv error to a Caspian diagnostic using the table below:

| ajv error `keyword` | ajv `instancePath` | `params` | Caspian code |
|---|---|---|---|
| `required` | `""` (root) | `missingProperty: "type"` | E008 |
| `minLength` | `"/type"` | — | E008 (type empty) |
| `pattern` | `"/type"` | — | E009 |
| `type` | `"/type"` and `type !== "string"` | — | E008 |
| `type` | `"/requires"` | — | E010 |
| `required` | `/requires/N` | `missingProperty: "type"` | E011 |
| `additionalProperties` | `/requires/N` | `additionalProperty: *` | E012 |
| `type` | `"/produces"` | — | E013 |
| `required` | `"/produces"` | `missingProperty: "type"` | E014 |
| `pattern` or `minLength` | `"/requires/N/type"` | — | skip (covered by above; E008/E009 cascade is blocked by entry-level checks first) |
| any other error | any | — | E008 as fallback (log instancePath in message) |

De-duplication rule: if both E008 (minLength) and E009 (pattern) fire for the same `/type` path, emit only E008 (missing/empty takes precedence). Implement as: skip any `pattern` error at `/type` if a `minLength` or `required` error for `type` was already mapped.

**Line number derivation:** implement a local helper `nodeLineFromPath(raw, startLine, instancePath, additionalProperty?)` that:

1. If `instancePath === ""`: return `startLine` (file-level anchor — convention for absent required fields).
2. Parse: `const doc = parseDocument(raw, { strict: false, version: "1.2" })` — use `strict: false` because data already passed stage 3 parse; re-parsing in permissive mode recovers CST without throwing.
3. Split `instancePath` by `/`, filter empty strings → `parts`.
4. If `additionalProperty` is provided, append it to `parts`.
5. Navigate the CST: for each `part`, if current node is `MAP`, find the pair where `pair.key?.value === part`; step into `pair.value` (except on the last part, step into `pair.key` to get the KEY node position). If current node is `SEQ`, parse `part` as integer index, step into `items[idx]`.
6. If final node has `.range`, return `byteOffsetToLine(raw, node.range[0]) + startLine`.
7. Fallback: return `startLine`.

**`byteOffsetToLine(text, offset)`** — local 1-indexed counter (starts at 1, increments on each `\n`; same pattern as in `parsers/yaml.ts`). Copy the algorithm rather than importing from `yaml.ts` — deferred to future `src/utils/lines.ts` (acknowledged tech debt from Story 2.3 review).

For E012 (`additionalProperties`), pass `params.additionalProperty` as the fourth argument to `nodeLineFromPath` so the function navigates to the extra key's position (not the containing object's position). This is what gives the correct line for the `weight: 5` key in fixture E012.

For E011 (`required` at `/requires/N`), the path `/requires/N` navigates to the array item. In the CST, the SEQ item's `.range[0]` points to the `- ` dash character, which is on the correct file line.

Verify all seven E008–E014 fixture expected lines:

| Fixture | Expected line | Derivation |
|---|---|---|
| E008 `no-type.md` | 1 | `instancePath=""` → `startLine = 1` |
| E009 `bare-name.md` | 2 | `type` key is on raw line 0 (1-indexed: 1) → `1 + 1 = 2` |
| E010 `string-instead.md` | 3 | `requires` key on raw line 1 (1-indexed: 2) → `2 + 1 = 3` |
| E011 `missing-type-key.md` | 4 | `/requires/0` item on raw line 2 (1-indexed: 3) → `3 + 1 = 4` |
| E012 `extra-property.md` | 5 | `/requires/0/weight` key on raw line 3 (1-indexed: 4) → `4 + 1 = 5` |
| E013 `array-instead.md` | 3 | `produces` key on raw line 1 (1-indexed: 2) → `2 + 1 = 3` |
| E014 `empty-object.md` | 3 | `produces` key on raw line 1 (1-indexed: 2) → `2 + 1 = 3` |

If fixture lines don't match: the implementation is wrong, NOT the fixture (fixtures are sealed).

Import typed constants: `import { CASPIAN_E008, CASPIAN_E009, ... } from "../diagnostics/codes.generated.js"` — no string literals.

The function is `async` because `getEnvelopeValidator()` is async (lazy compilation on first call, cached thereafter).

### AC3 — Stage 5: `validators/namespace.ts`

Create `caspian/packages/core/src/validators/namespace.ts` and export:

```ts
export interface NamespaceCheckResult {
  diagnostics: Diagnostic[];
}

export function checkNamespace(
  data: Record<string, unknown> | null,
  raw: string,
  startLine: number,
): NamespaceCheckResult;
```

Behavior (synchronous — no ajv call needed):

**`type` namespace check (W002 + W004):**

- If `data` is null or `data.type` is not a string or is empty: skip (E008/E009 covers this).
- Extract namespace as `typeValue.slice(0, typeValue.indexOf(":"))`. Only proceed if `typeValue.includes(":")` (i.e., the colon is present — stage 4 catches the no-colon case with E009; stage 5 MUST NOT also emit W002 for those, or the E009 fixture test will fail due to extra diagnostics in the array).
- If `namespace !== "core"`: emit `CASPIAN-W002` with `line` = line of the `type` key (via CST).
- If `namespace === "core"`: extract name as `typeValue.slice(typeValue.indexOf(":") + 1)`. If `!CANONICAL_CORE_NAMES.has(name)`: emit `CASPIAN-W004` with `line` = line of the `type` key.
- Multi-colon types (e.g., `core:story:v2`): namespace = first segment before first colon; name = everything after first colon (e.g., `story:v2`). `CANONICAL_CORE_NAMES.has("story:v2") = false` → W004. This is the Story 2.4 defined behavior for multi-colon `core:*` types.

**`schema_version` check (W003):**

- If `"schema_version"` is not a key in `data`: skip (absent = implicit `"0.1"`, no warning).
- If `data.schema_version` is not a string: emit W003 (non-string version is unrecognized).
- If `SUPPORTED_SCHEMA_VERSIONS.has(String(data.schema_version))`: skip.
- Otherwise: emit `CASPIAN-W003` with `line` = line of the `schema_version` key (via CST).

**`findKeyLine(raw, keyName, startLine)` helper** — local helper using `parseDocument(raw, { strict: false, version: "1.2" })`:

```ts
function findKeyLine(raw: string, keyName: string, startLine: number): number {
  const doc = parseDocument(raw, { strict: false, version: "1.2" });
  if (!doc.contents || doc.contents.type !== "MAP") return startLine;
  const pair = doc.contents.items.find((p) => String(p.key?.value) === keyName);
  if (pair?.key?.range) {
    return byteOffsetToLine(raw, pair.key.range[0]) + startLine;
  }
  return startLine;
}
```

Fixture expected lines:
- W002 `bmad-epic.md` (`type: bmad:epic` on file line 2): `findKeyLine("type")` → raw line 0 (1-indexed: 1) → `1 + 1 = 2` ✓
- W003 `version-9-9.md` (`schema_version: "9.9"` on file line 2): same ✓
- W004 `non-canonical-name.md` (`type: core:nonexistent` on file line 2): same ✓

Import `CASPIAN_W002`, `CASPIAN_W003`, `CASPIAN_W004` from typed constants. Import `CANONICAL_CORE_NAMES`, `SUPPORTED_SCHEMA_VERSIONS` from `../constants.js`.

### AC4 — Stage 6: `validators/allow-list.ts`

Create `caspian/packages/core/src/validators/allow-list.ts` and export:

```ts
export interface AllowListScanResult {
  diagnostics: Diagnostic[];
}

export function scanAllowList(
  raw: string,
  startLine: number,
): AllowListScanResult;
```

Behavior (synchronous):

1. Parse the raw frontmatter with `parseDocument(raw, { strict: false, version: "1.2" })`.
2. If `doc.contents?.type !== "MAP"`: return empty diagnostics (non-map root is handled by stage 4).
3. Iterate `doc.contents.items`. For each `pair`:
   - `fieldName = String(pair.key?.value ?? "")` — the top-level frontmatter key as a string.
   - Skip if `fieldName` is empty.
   - Skip if `RECOGNIZED_FIELDS.has(fieldName)`.
   - Skip if `fieldName.startsWith("x-")`.
   - Otherwise: emit `CASPIAN-W001` with `line = byteOffsetToLine(raw, pair.key.range[0]) + startLine`.

**⚠ CRITICAL DISCREPANCY — vendor-namespaced field keys:**

The epics Story 2.4 AC states: *"vendor-namespaced fields (e.g., `bmad:epic-id`) should not emit W001."* However, the **sealed fixture** `caspian/fixtures/invalid/W001-unknown-field/vendor-namespaced.md` has field key `examples:custom-field` (a colon-containing key in `<vendor>:<name>` form) and its `vendor-namespaced.expected.json` expects **CASPIAN-W001 at line 3**.

The principle from Story 2.3 is: **the fixture is authoritative; the implementation is wrong, not the fixture.** Therefore:

- The allow-list scan does **NOT** exempt vendor-colon-namespaced field keys from W001.
- Any field key not in `RECOGNIZED_FIELDS` and not `x-*` prefixed → emits W001, regardless of whether the key contains a colon.
- The AC example about `bmad:epic-id` not getting W001 is **incorrect** and must be disregarded.
- Only `x-*` prefixed keys are exempt (confirmed by both the `x-extension.md` valid fixture and the AC).

**Note:** The `valid/overlay-compat/vendor-namespaced.md` fixture (which was supposed to demonstrate a vendor-namespaced key without W001, per Epic 1 Story 1.6 epics text) was **never created** on disk. Story 2.4 does NOT create it either — this would contradict the sealed invalid fixture. This is acknowledged scope debt.

**Edit-distance suggestion for W001 (FR9):**

When emitting W001, compute the minimum Levenshtein distance between `fieldName` and every string in `RECOGNIZED_FIELDS`. If the minimum distance is ≤ 2, append `Did you mean \`<closest>\`?` to the message. Include the doc link at the end.

Implement a local `levenshtein(a, b)` function (no new npm dep — a 15-line Wagner-Fischer implementation). Do not add a new package for this.

```ts
function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let j = 1; j <= a.length; j++) {
    let prev = dp[0]!;
    dp[0] = j;
    for (let i = 1; i <= b.length; i++) {
      const temp = dp[i]!;
      dp[i] = a[j - 1] === b[i - 1] ? prev : 1 + Math.min(prev, dp[i]!, dp[i - 1]!);
      prev = temp;
    }
  }
  return dp[b.length]!;
}
```

Message format:
- With suggestion: `` `${CASPIAN_W001.message}: \`${fieldName}\`. Did you mean \`${suggestion}\`? See: ${CASPIAN_W001.doc}` ``
- Without suggestion: `` `${CASPIAN_W001.message}: \`${fieldName}\`. See: ${CASPIAN_W001.doc}` ``

The fixture tests only check `code` and `line` — the message format does not affect test correctness. The `field` property (optional on `Diagnostic`) should be set to `fieldName`.

Fixture expected lines:
- W001 `typo-metadat.md` (`metadat: {}` on file line 3): raw line 1 (1-indexed: 2) → `2 + 1 = 3` ✓. Suggestion: `metadata` (distance 1) ✓.
- W001 `vendor-namespaced.md` (`examples:custom-field: vendor-defined-value` on file line 3): raw line 1 (1-indexed: 2) → `2 + 1 = 3` ✓. No close suggestion (distance > 2 for all 22 fields).

### AC5 — `pipeline.ts` updated: stages 4–6 wired

Replace the current placeholder block in `pipeline.ts`:

```ts
// TODO Story 2.4: stages 4–6 (envelope, namespace, allow-list).
// Stage 3's `stage3.data` will be the input for stage 4.
void stage3.data;

return [];
```

With the actual stage 4–6 calls:

```ts
const stage4 = await validateEnvelope(stage3.data, stage2.raw, stage2.startLine);
const stage5 = checkNamespace(stage3.data, stage2.raw, stage2.startLine);
const stage6 = scanAllowList(stage2.raw, stage2.startLine);

return [...stage4.diagnostics, ...stage5.diagnostics, ...stage6.diagnostics];
```

Update the imports at the top of `pipeline.ts`:

```ts
import { validateEnvelope } from "./validators/envelope.js";
import { checkNamespace } from "./validators/namespace.js";
import { scanAllowList } from "./validators/allow-list.js";
```

Remove the `void stage3.data` line. Preserve the existing stage 1–3 structure unchanged.

The pipeline function remains `async` (because `validateEnvelope` is async — it calls `getEnvelopeValidator()` which is async).

**Continue-and-collect semantics:** stages 4, 5, 6 ALL run after stage 3 succeeds regardless of each other's results. A file with both E008 and W001 gets both diagnostics in the same pass (confirmed by the epics AC).

### AC6 — Stage-level unit tests

**`tests/unit/validators/envelope.test.ts`** covers (minimum):

- **E008 — missing type:** `validateEnvelope({ name: "no-type" }, raw, 1)` → `[{ code: "CASPIAN-E008", line: 1 }]`.
- **E009 — type not namespaced:** `validateEnvelope({ type: "epic" }, raw, 1)` → `[{ code: "CASPIAN-E009", line: 2 }]`.
- **E010 — requires not array:** `validateEnvelope({ type: "core:plan", requires: "core:story" }, raw, 1)` → `[{ code: "CASPIAN-E010", line: 3 }]`.
- **E011 — requires entry missing type:** data with `requires: [{ tags: ["r"] }]` → `[{ code: "CASPIAN-E011", line: 4 }]`.
- **E012 — requires entry invalid shape:** data with `requires: [{ type: "core:story", weight: 5 }]` → `[{ code: "CASPIAN-E012", line: 5 }]`.
- **E013 — produces not object:** data with `produces: ["x"]` → `[{ code: "CASPIAN-E013", line: 3 }]`.
- **E014 — produces missing type:** data with `produces: {}` → `[{ code: "CASPIAN-E014", line: 3 }]`.
- **Valid envelope:** `{ type: "core:overview" }` → `[]`.
- Tests provide the matching `raw` string and `startLine` that produced each `data` object (use the fixture content or a minimal inline string). The raw strings must match the exact line counts implied by the expected line numbers.

**`tests/unit/validators/namespace.test.ts`** covers:

- **W002 — non-core namespace:** `checkNamespace({ type: "bmad:epic" }, raw, 1)` → `[{ code: "CASPIAN-W002", line: 2 }]`.
- **W003 — unrecognized schema_version:** `checkNamespace({ type: "core:overview", schema_version: "9.9" }, raw, 1)` → `[{ code: "CASPIAN-W003", line: 2 }]`.
- **W004 — unrecognized core name:** `checkNamespace({ type: "core:nonexistent" }, raw, 1)` → `[{ code: "CASPIAN-W004", line: 2 }]`.
- **No warning — valid core type:** `checkNamespace({ type: "core:overview" }, ...)` → `[]`.
- **No warning — absent schema_version:** `checkNamespace({ type: "core:plan" }, ...)` → `[]`.
- **No W002 — type without colon (E009 case):** `checkNamespace({ type: "epic" }, ...)` → `[]` (no colon → namespace extraction skipped; stage 4 handles via E009).
- **Multi-colon — core:story:v2 → W004:** `checkNamespace({ type: "core:story:v2" }, ...)` → `[{ code: "CASPIAN-W004", line: 2 }]`.

**`tests/unit/validators/allow-list.test.ts`** covers:

- **W001 — unknown field:** `scanAllowList(raw_with_metadat, 1)` → `[{ code: "CASPIAN-W001", line: 3 }]`.
- **W001 — suggestion:** the `metadat` warning's `message` includes `"Did you mean \`metadata\`?"`.
- **No W001 — all 22 recognized fields pass:** raw frontmatter with any known field (e.g., `name: x`) → `[]`.
- **No W001 — x-* prefix:** `x-custom: value` → `[]`.
- **W001 — vendor-colon-namespaced key:** `examples:custom-field: value` → `[{ code: "CASPIAN-W001", line: N }]` (confirms the sealed fixture behavior — vendor-namespaced keys DO get W001).
- **No suggestion — long distance:** a field with no close match (e.g., `zzz: value`) → message does NOT include "Did you mean".

### AC7 — `fixtures-runner.test.ts` expanded

Update the regex filter and the count assertion:

```ts
// Old (Story 2.3):
const STAGES_1_TO_3_DIRS = /^E00[1-7]-/;
// …
it("discovered the expected number of E001–E007 fixture pairs", () => {
  expect(cases).toHaveLength(7);
});

// New (Story 2.4):
const ALL_STAGES_DIRS = /^(E0(0[1-9]|1[0-4])|W00[1-4])-/;
// …
describe("fixtures-runner — all stages (E001–E014, W001–W004)", async () => {
  // …
  it("discovered the expected number of fixture pairs", () => {
    expect(cases).toHaveLength(19); // 14 error + 2 W001 + 1 W002 + 1 W003 + 1 W004
  });
```

Count breakdown: E001–E014 (1 pair each = 14) + W001-unknown-field (2 pairs: `typo-metadat` + `vendor-namespaced`) + W002 (1) + W003 (1) + W004 (1) = **19 total pairs**.

The `it.each` test body is unchanged (`validateFile` against `.md`, compare `code` + `line` with `.expected.json`).

### AC8 — Documentation updates

**`caspian/packages/core/CHANGELOG.md`** — append under `## Unreleased`:

```markdown
- Pipeline stages 4–6 (`validateFile` full implementation): envelope schema
  (`CASPIAN-E008`–`E014` via ajv), namespace check (`CASPIAN-W002`, `W003`,
  `W004`), allow-list scan (`CASPIAN-W001` + edit-distance suggestions).
  Adds `validators/{envelope,namespace,allow-list}.ts`. Adds `RECOGNIZED_FIELDS`
  (22-field set), `SUPPORTED_SCHEMA_VERSIONS`, `CANONICAL_CORE_NAMES` to
  `constants.ts`. `validateFile` now emits diagnostics for all 17 v1.0 codes.
```

**`caspian/packages/core/README.md`** — update the Pipeline stages table (currently shows `(Story 2.4)` placeholder) to:

```
| 4     | `validators/envelope.ts`            | `CASPIAN-E008`–`E014`                    |
| 5     | `validators/namespace.ts`           | `CASPIAN-W002`, `W003`, `W004`           |
| 6     | `validators/allow-list.ts`          | `CASPIAN-W001`                           |
```

Update the prose note below the table: remove the "Stages 4–6 land in Story 2.4" sentence; replace with "The full 6-stage pipeline is now implemented; `validateFile` emits diagnostics for all 17 v1.0 codes."

### AC9 — Smoke gate baseline maintained

After all changes:

- `pnpm -C caspian lint` exits 0. Expected new biome-checked file count: 35 (Story 2.3 baseline) + 3 new `src/validators/*.ts` + 3 new `tests/unit/validators/*.test.ts` + 1 modified `constants.ts` + 1 modified `pipeline.ts` + 1 modified `fixtures-runner.test.ts` + 1 modified `pipeline.test.ts` = approximately **44 biome-checked files** (±1 tolerance). Document actual count in *Completion Notes*.
- `pnpm -C caspian test` exits 0. Expected test counts: 43 (Story 2.3 baseline) + new unit tests for validators + 12 additional fixture-runner cases (19 total - 7 previous = 12 new cases) + new pipeline assertions = ≥ 70 tests. Document actual count.
- `pnpm -C caspian build` exits 0. Verify `dist/validators/envelope.js`, `dist/validators/namespace.js`, `dist/validators/allow-list.js` exist post-build.
- `pnpm -C caspian verify-codes-hash` exits 0 (Story 2.4 imports constants but does not regenerate `codes.generated.ts`).
- `pnpm -C caspian ajv-validate-registry` exits 0 (registry sealed).
- **Live ESM-import smoke check:** validate the `W001-unknown-field/typo-metadat.md` fixture end-to-end:

  ```bash
  cd caspian && node --input-type=module -e "import('./packages/core/dist/index.js').then(m => m.validateFile('./fixtures/invalid/W001-unknown-field/typo-metadat.md').then(d => console.log(d.length, d[0]?.code, d[0]?.line)))"
  ```

  Expected output: `1 CASPIAN-W001 3`. Exit 0.

### AC10 — Manual cross-checks

Record in *Debug Log References* (exact command + output):

1. **E008 — type missing.** `validateFile` against `fixtures/invalid/E008-type-missing/no-type.md`. Expected: `[{ code: "CASPIAN-E008", line: 1 }]`.
2. **E009 — type not namespaced.** Against `E009-type-not-namespaced/bare-name.md`. Expected: `[{ code: "CASPIAN-E009", line: 2 }]`.
3. **E012 — requires invalid shape.** Against `E012-requires-invalid-shape/extra-property.md`. Expected: `[{ code: "CASPIAN-E012", line: 5 }]`. (Highest-index line — validates CST deep navigation for `additionalProperties`.)
4. **W001 — suggestion.** Against `W001-unknown-field/typo-metadat.md`. Expected: `[{ code: "CASPIAN-W001", line: 3 }]`. Also capture `d[0]?.message` and verify it includes "Did you mean `metadata`?".
5. **W001 — vendor-namespaced key gets W001.** Against `W001-unknown-field/vendor-namespaced.md`. Expected: `[{ code: "CASPIAN-W001", line: 3 }]`. Confirms sealed-fixture behavior.
6. **W002 + W001 — continue-and-collect.** Author a synthetic temp fixture with `type: bmad:epic` AND `typo: unknown`. Validate. Expected: two diagnostics — `CASPIAN-W002` (type line) AND `CASPIAN-W001` (typo line). Both present in same pass.
7. **E008 + W001 — continue-and-collect stages 4 + 6.** Author a synthetic temp fixture with no `type` field AND `metadat: x`. Expected: `CASPIAN-E008` (line 1) + `CASPIAN-W001` (line N). Both present.
8. **Valid fixture — no regressions.** `validateFile` against `fixtures/valid/core-overview/minimal.md`. Expected: `[]`.
9. **E001 still short-circuits — regression check.** `validateFile` against `fixtures/invalid/E001-bom/with-bom.md`. Expected: exactly `[{ code: "CASPIAN-E001", line: 1 }]` — stages 4–6 do NOT run.
10. **Offline audit.** `grep -r "fetch\|https\.request\|http\.request\|telemetry" caspian/packages/core/src/validators/`. Expected: zero matches.

Clean up synthetic temp files (cross-checks #6, #7) after capturing output.

## Tasks / Subtasks

- [ ] **Task 1 — Constants** (AC: #1)
  - [ ] Open `caspian/packages/core/src/constants.ts`. Append `RECOGNIZED_FIELDS`, `SUPPORTED_SCHEMA_VERSIONS`, `CANONICAL_CORE_NAMES` after `YAML_1_1_UNQUOTED_BOOLEANS`.
  - [ ] Run `pnpm -C caspian lint` — verify no biome violations.

- [ ] **Task 2 — Stage 4 envelope validator** (AC: #2)
  - [ ] Create `caspian/packages/core/src/validators/envelope.ts`. Implement `validateEnvelope` with ajv error → diagnostic mapping and CST-based line derivation.
  - [ ] Implement local `nodeLineFromPath` and `byteOffsetToLine` helpers.
  - [ ] Import `getEnvelopeValidator` from `../../validator.js`; import typed constants from `../diagnostics/codes.generated.js`.
  - [ ] Run `pnpm -C caspian -F @caspian-dev/core build` — verify `dist/validators/envelope.js` emitted.

- [ ] **Task 3 — Stage 5 namespace checker** (AC: #3)
  - [ ] Create `caspian/packages/core/src/validators/namespace.ts`. Implement `checkNamespace`.
  - [ ] Implement local `findKeyLine` and `byteOffsetToLine` helpers.
  - [ ] Import `CANONICAL_CORE_NAMES`, `SUPPORTED_SCHEMA_VERSIONS` from `../constants.js`.
  - [ ] Verify the `type: "epic"` guard (no colon → skip W002 check) using a unit test before moving on.

- [ ] **Task 4 — Stage 6 allow-list scanner** (AC: #4)
  - [ ] Create `caspian/packages/core/src/validators/allow-list.ts`. Implement `scanAllowList`.
  - [ ] Implement local `levenshtein`, `byteOffsetToLine` helpers.
  - [ ] Import `RECOGNIZED_FIELDS` from `../constants.js`; import `CASPIAN_W001` from `../diagnostics/codes.generated.js`.
  - [ ] Verify W001 fires for `examples:custom-field` key (the sealed fixture behavior).

- [ ] **Task 5 — Wire pipeline** (AC: #5)
  - [ ] Open `caspian/packages/core/src/pipeline.ts`. Replace the `// TODO` block with stage 4–6 calls.
  - [ ] Add the three validator imports.
  - [ ] Run `pnpm -C caspian -F @caspian-dev/core build` — verify full build succeeds.

- [ ] **Task 6 — Stage unit tests** (AC: #6)
  - [ ] Create `tests/unit/validators/envelope.test.ts` (≥ 9 tests).
  - [ ] Create `tests/unit/validators/namespace.test.ts` (≥ 7 tests).
  - [ ] Create `tests/unit/validators/allow-list.test.ts` (≥ 6 tests).
  - [ ] Run `pnpm -C caspian test` — all new tests pass.

- [ ] **Task 7 — Expand fixture runner** (AC: #7)
  - [ ] Open `tests/fixtures-runner.test.ts`. Replace `STAGES_1_TO_3_DIRS` with `ALL_STAGES_DIRS`, update description string, update count assertion to 19.
  - [ ] Run `pnpm -C caspian test` — fixture runner discovers 19 pairs; all pass.

- [ ] **Task 8 — Update pipeline test** (AC: #6 pipeline section)
  - [ ] Open `tests/unit/pipeline.test.ts`. Add tests verifying: stage 4 error collected (E008 from a fixture with no `type`), stage 5 warning collected (W002 from `bmad:epic`), stage 6 warning collected (W001 from unknown field), continue-and-collect (all three fire simultaneously).

- [ ] **Task 9 — Documentation** (AC: #8)
  - [ ] Append Story 2.4 CHANGELOG bullet.
  - [ ] Update README Pipeline stages table.

- [ ] **Task 10 — Smoke gate** (AC: #9)
  - [ ] `pnpm lint` — exits 0.
  - [ ] `pnpm -F @caspian-dev/core test` — all tests pass.
  - [ ] `pnpm -F @caspian-dev/core build` — exits 0, verify dist/validators/*.js exist.
  - [ ] ESM smoke check for W001 fixture.
  - [ ] `pnpm verify-codes-hash` + `pnpm ajv-validate-registry` — both exit 0.

- [ ] **Task 11 — Cross-checks** (AC: #10)
  - [ ] Record all 10 cross-checks in *Debug Log References*.
  - [ ] Clean up synthetic temp fixtures after cross-checks #6 and #7.

- [ ] **Task 12 — Final assembly**
  - [ ] `git status` — verify only expected files modified; no sealed files changed.
  - [ ] Update *Completion Notes List*, *File List*, *Change Log*.

## Dev Notes

### Source authority

- **Primary contract:** Acceptance Criteria above. When AC text and epics text diverge, prefer the AC above — especially for the W001 vendor-namespaced field handling (see AC4 CRITICAL DISCREPANCY).
- **Architecture references:**
  - D1 (pipeline ordering — fail-fast stages 1–3, continue-and-collect stages 4–6): `_bmad-output/planning-artifacts/architecture.md` lines 285–290.
  - D2 (error policy): line 290.
  - File paths (`validators/{envelope,namespace,allow-list}.ts`): architecture line 638.
  - Test file paths (`tests/unit/validators/*.test.ts`): architecture line 652.
  - Data-flow diagram: architecture lines 793–807.
  - Story-004 implementation sequence: architecture lines 901–910.
- **Reference Models:**
  - `caspian/packages/core/src/validator.ts` — the `getEnvelopeValidator()` pattern Stage 4 reuses.
  - `caspian/packages/core/src/parsers/yaml.ts` — the `parseDocument` + `byteOffsetToLine` pattern Stage 4/5/6 replicate.
  - `caspian/packages/core/tests/fixtures-runner.test.ts` — the `it.each` fixture pattern to extend.
  - Story 2.3 dev notes (Stage 3 line-number derivation section) — explains `byteOffsetToLine` is 1-indexed.

### `getEnvelopeValidator()` — async caching behavior

`validator.ts` compiles ajv against the bundled `envelope.schema.json` on first call and caches the compiled function. `validateEnvelope` must `await getEnvelopeValidator()` on every call — the cache makes subsequent calls cheap. Do NOT extract the function call to module-level (module-level `await` requires a top-level await context that may not be available at import time in all environments).

### ajv `allErrors: true` and diagnostic deduplication

With `allErrors: true`, ajv may report multiple errors for the same field path. Example: for `type: ""` (empty string), ajv reports both a `minLength` error (E008) and a `pattern` error (E009). The implementation MUST deduplicate: if `minLength` fires at `/type`, suppress `pattern` at `/type`. Implement as a `Set<string>` of already-mapped paths and skip additional errors for the same path that would produce lower-priority codes.

### CST navigation in envelope.ts — debugging tips

If the CST navigation returns unexpected line numbers:

1. Add a console.log of `doc.contents` to inspect the tree structure for a failing fixture.
2. The yaml library's CST: `MAP.items[n].key.range[0]` = byte offset of the key's start in the `raw` string; `MAP.items[n].value.range[0]` = offset of value start. For SEQ items: `SEQ.items[n].range[0]` = offset of the item's start (the `-` character).
3. Verify `byteOffsetToLine` is 1-indexed (starts at 1 for offset 0) — if line numbers are off by 1, check initialization.

### Deferred items to be aware of (do NOT fix in this story)

From Story 2.3 review — do NOT refactor in Story 2.4:

- **Duplicated `byteOffsetToLine`** — `frontmatter.ts` and `yaml.ts` already have separate copies; Story 2.4 adds three more in the validators. Acknowledged tech debt; candidate for `src/utils/lines.ts` in a future refactoring story.
- **Cache concurrency in `getEnvelopeValidator()`** — double-initialization risk under concurrent callers (harmless in Node single-threaded loop). Deferred from Story 2.1 review.

### Smoke gate baseline tracking

Biome-checked file count for each story:
- Story 2.1: 18 files
- Story 2.2: 24 files (floor for Story 2.3+)
- Story 2.3: 35 files (floor for Story 2.4+)
- Story 2.4: expected ~44 files (35 + 3 new validator src + 3 new validator tests + ~3 modified = 44; ±1 tolerance)

Document the actual count in *Completion Notes*.

## Completion Notes List

- Smoke gate baseline (biome-checked file count): **41 files** (Story 2.3 floor was 35; +6 new files = 41)
- Total tests passing: **89 tests** across 10 test files (Story 2.3 baseline was 43 after patch)
- **Deliberate departure — `nodeLineFromPath` `instanceof` check:** AC2 spec used `.type === "MAP"` / `.type === "SEQ"` in the pseudocode, but yaml v2 does not expose a `.type` string property on `YAMLMap`/`YAMLSeq` nodes at runtime. Using `instanceof YAMLMap` and `instanceof YAMLSeq` is the correct approach and produces all expected fixture line numbers. The import was updated to `import { parseDocument, YAMLMap, YAMLSeq } from "yaml"`.
- **Fixture runner multi-file handling:** W001 directory has 2 fixture pairs (`typo-metadat` + `vendor-namespaced`). The discovery function was updated to pair files by base name instead of taking the first `.md` only — this is the correct behavior and not a departure.
- **`allow-list.test.ts` biome info:** one `lint/style/useTemplate` suggestion (unsafe fix) remains at info level; biome exits 0. The array join is semantically clearer for the 22-field list.

## File List

*(To be filled by developer on completion)*

**New:**
- `caspian/packages/core/src/validators/envelope.ts`
- `caspian/packages/core/src/validators/namespace.ts`
- `caspian/packages/core/src/validators/allow-list.ts`
- `caspian/packages/core/tests/unit/validators/envelope.test.ts`
- `caspian/packages/core/tests/unit/validators/namespace.test.ts`
- `caspian/packages/core/tests/unit/validators/allow-list.test.ts`

**Modified:**
- `caspian/packages/core/src/constants.ts`
- `caspian/packages/core/src/pipeline.ts`
- `caspian/packages/core/tests/fixtures-runner.test.ts`
- `caspian/packages/core/tests/unit/pipeline.test.ts`
- `caspian/packages/core/CHANGELOG.md`
- `caspian/packages/core/README.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-04-28: Story 2.4 implemented (dev-story workflow). Status: in-progress → review.
  - Created `caspian/packages/core/src/validators/envelope.ts` — stage 4 ajv envelope validator with CST-based line derivation using `instanceof YAMLMap/YAMLSeq`
  - Created `caspian/packages/core/src/validators/namespace.ts` — stage 5 namespace + schema_version checker
  - Created `caspian/packages/core/src/validators/allow-list.ts` — stage 6 22-field allow-list scanner with inline Levenshtein suggestion
  - Created `caspian/packages/core/tests/unit/validators/envelope.test.ts` (11 tests)
  - Created `caspian/packages/core/tests/unit/validators/namespace.test.ts` (10 tests)
  - Created `caspian/packages/core/tests/unit/validators/allow-list.test.ts` (8 tests)
  - Modified `caspian/packages/core/src/constants.ts` — appended RECOGNIZED_FIELDS, SUPPORTED_SCHEMA_VERSIONS, CANONICAL_CORE_NAMES
  - Modified `caspian/packages/core/src/pipeline.ts` — replaced TODO placeholder with stages 4–6 calls + imports; biome import sort applied
  - Modified `caspian/packages/core/tests/fixtures-runner.test.ts` — expanded regex + count 7→19; multi-file pairing by base name
  - Modified `caspian/packages/core/tests/unit/pipeline.test.ts` — added 4 new stage 4–6 assertions (9 total)
  - Modified `caspian/packages/core/CHANGELOG.md` — appended Story 2.4 bullet
  - Modified `caspian/packages/core/README.md` — updated Pipeline stages table + validateFile description
  - Modified `_bmad-output/implementation-artifacts/sprint-status.yaml` — story status in-progress → review

## Debug Log References

All 10 cross-checks executed 2026-04-28 against `dist/` build from `pnpm -F @caspian-dev/core build`:

1. **CC1 — E008 type missing:** `validateFile("fixtures/invalid/E008-type-missing/no-type.md")` → `[{"code":"CASPIAN-E008","line":1}]` ✓
2. **CC2 — E009 type not namespaced:** `validateFile("fixtures/invalid/E009-type-not-namespaced/bare-name.md")` → `[{"code":"CASPIAN-E009","line":2}]` ✓
3. **CC3 — E012 requires invalid shape:** `validateFile("fixtures/invalid/E012-requires-invalid-shape/extra-property.md")` → `[{"code":"CASPIAN-E012","line":5}]` ✓
4. **CC4 — W001 suggestion:** `validateFile("fixtures/invalid/W001-unknown-field/typo-metadat.md")` → `[{"code":"CASPIAN-W001","line":3}]`; message includes `"Did you mean \`metadata\`?"` ✓
5. **CC5 — W001 vendor-namespaced:** `validateFile("fixtures/invalid/W001-unknown-field/vendor-namespaced.md")` → `[{"code":"CASPIAN-W001","line":3}]` ✓ (sealed-fixture behavior confirmed)
6. **CC6 — W002+W001 continue-and-collect:** synthetic `type: bmad:epic\ntypo: unknown` → `[{"code":"CASPIAN-W002","line":2},{"code":"CASPIAN-W001","line":3}]` ✓
7. **CC7 — E008+W001 continue-and-collect:** synthetic `metadat: x` (no type) → `[{"code":"CASPIAN-E008","line":1},{"code":"CASPIAN-W001","line":2}]` ✓
8. **CC8 — valid fixture no regressions:** `validateFile("fixtures/valid/core-overview/minimal.md")` → `[]` ✓
9. **CC9 — E001 stage-1 short-circuit regression:** `validateFile("fixtures/invalid/E001-bom/with-bom.md")` → `[{"code":"CASPIAN-E001","line":1}]` ✓
10. **CC10 — offline audit:** `grep -rn "fetch|https.request|http.request|telemetry" packages/core/src/validators/` → zero matches ✓
