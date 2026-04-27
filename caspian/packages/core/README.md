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
  file against pipeline stages 1–3 (byte-level, frontmatter extraction,
  YAML parse) and returns the array of diagnostics (empty array = valid
  through stage 3). Stages 4–6 (envelope shape, namespace check,
  allow-list scan) land in Story 2.4; until then, files passing stage 3
  return an empty diagnostic array even if their envelope shape is invalid.

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
