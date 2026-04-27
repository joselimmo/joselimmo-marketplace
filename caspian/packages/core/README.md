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

- `Diagnostic`, `Severity`, `ValidationResult`, `DiagnosticDefinition`, `Reporter`
  — type definitions.
- `CASPIAN_E001` through `CASPIAN_E014`, `CASPIAN_W001` through `CASPIAN_W004` —
  18 typed code constants (`DiagnosticDefinition` values) generated from
  `caspian/diagnostics/registry.json`. The generated file `codes.generated.ts`
  carries a sha256 header verified at build time by `pnpm verify-codes-hash`;
  the registry shape is validated against
  `schemas/v1/diagnostic-registry.schema.json` by `pnpm ajv-validate-registry`.

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
