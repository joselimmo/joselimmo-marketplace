# @caspian-dev/core

Vendor-neutral validator runtime for the Caspian Composable Agent Skill
Protocol. Implements the validation pipeline that the Caspian CLI
(`@caspian-dev/cli`, binary `caspian`) and any future alternative host
(LSP, CI ajv layer, runtime hook, install-time validator) consume.

This package contains pure validation logic with no CLI surface. The
`caspian` binary lives in [`@caspian-dev/cli`](../cli/).

## Status

Pre-1.0 — the first published version is `0.1.0`. The semver promise
(stable public API, semver-compatible releases) applies from `1.0.0`
onward.

## Public API surface

The package uses **named exports only** — no `export default`.

From the `.` entry point (`@caspian-dev/core`):

- `validateFile(path: string): Promise<Diagnostic[]>` — validates a single
  file against all 6 pipeline stages (byte-level, frontmatter extraction,
  YAML parse, envelope schema, namespace check, allow-list scan) and returns
  the array of diagnostics (empty array = valid).

From the `./diagnostics` sub-export (`@caspian-dev/core/diagnostics`):

- `Diagnostic`, `Severity`, `ValidationResult`, `DiagnosticDefinition`, `Reporter`
  — type definitions.
- `CASPIAN_E001` through `CASPIAN_E014`, `CASPIAN_W001` through `CASPIAN_W004` —
  18 typed code constants (`DiagnosticDefinition` values) generated from
  `caspian/diagnostics/registry.json`. The generated file `codes.generated.ts`
  carries a sha256 header verified at build time by `pnpm verify-codes-hash`;
  the registry shape is validated against
  `schemas/v1/diagnostic-registry.schema.json` by `pnpm ajv-validate-registry`.

## Pipeline stages

| Stage | Module                              | Diagnostics                              | Mode |
|-------|-------------------------------------|------------------------------------------|------|
| 1     | `parsers/byte-reader.ts`            | `CASPIAN-E001`, `CASPIAN-E002`           | fail-fast |
| 2     | `parsers/frontmatter.ts`            | `CASPIAN-E004`, `CASPIAN-E005`           | fail-fast |
| 3     | `parsers/yaml.ts`                   | `CASPIAN-E003`, `CASPIAN-E006`, `CASPIAN-E007` | fail-fast |
| 4     | `validators/envelope.ts`            | `CASPIAN-E008`–`CASPIAN-E014`           | continue-and-collect |
| 5     | `validators/namespace.ts`           | `CASPIAN-W002`, `CASPIAN-W003`, `CASPIAN-W004` | continue-and-collect |
| 6     | `validators/allow-list.ts`          | `CASPIAN-W001`                           | continue-and-collect |

Pipeline ordering is fail-fast for stages 1–3 (architecture D1): a failure in
stage N suppresses stages N+1..6 for that file. Stages 4–6 always run together
and collect all diagnostics.

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

## See also

- [Caspian spec landing](https://caspian.dev) — 30-second pitch + 4-line frontmatter quickstart.
- [Diagnostic codes reference](https://caspian.dev/diagnostics) — every `CASPIAN-EXXX` / `CASPIAN-WXXX` code with its rule and rationale.
- [`@caspian-dev/cli`](https://www.npmjs.com/package/@caspian-dev/cli) — the CLI wrapper that exposes this library as the `caspian` binary.

## License

Apache-2.0 — see [`./LICENSE`](./LICENSE).
