# @caspian-dev/core changelog

This file tracks `@caspian-dev/core` semver. Decoupled from spec-level
semver (see `caspian/spec/CHANGELOG.md`) and from the CLI semver
(see `caspian/packages/cli/CHANGELOG.md`).

## Unreleased

- Initial package skeleton: ESM `@caspian-dev/core` with the canonical
  schema-loading entry point (`loader.ts`), 3-verrou single-source-of-truth
  enforcement, ajv 2020-12 envelope schema registration, and stub
  `validateFile(path)` public API. Pipeline stages 1–6 implement the full
  validation path.
- Diagnostic registry → typed TS constants (`codes.generated.ts`, 18 entries
  derived from `caspian/diagnostics/registry.json`) with sha256 header (`// Hash:
  <hex>`) and `verify-codes-hash` CI gate. Adds `ajv-validate-registry` CI gate
  (registry-shape validation against `schemas/v1/diagnostic-registry.schema.json`).
  Adds `Reporter` interface and `DiagnosticDefinition` type to `./diagnostics`
  sub-export. Pre-commit hook (`simple-git-hooks` config block) regenerates
  `codes.generated.ts` on every commit.
- Pipeline stages 1–3 (`validateFile` real implementation): byte-level (`CASPIAN-E001`,
  `CASPIAN-E002`), frontmatter extraction (`CASPIAN-E004`, `CASPIAN-E005`),
  YAML parse (`CASPIAN-E003`, `CASPIAN-E006`, `CASPIAN-E007`) via `yaml` v2.x
  strict 1.2 safe-load + post-parse tab-indent and YAML 1.1 unquoted-boolean
  scans. Adds `parsers/{byte-reader,frontmatter,yaml}.ts`, `pipeline.ts`,
  `constants.ts` (4 KB cap, YAML 1.1 boolean keyword set). Adds runtime
  dependency `yaml ^2.6.0`.
- Pipeline stages 4–6 (continue-and-collect): envelope schema validation
  (`CASPIAN-E008`–`CASPIAN-E014`, ajv 2020-12) via `validators/envelope.ts`;
  namespace checks (`CASPIAN-W002`, `CASPIAN-W003`, `CASPIAN-W004`) via
  `validators/namespace.ts`; allow-list scan (`CASPIAN-W001`, 22 known fields +
  `x-*` prefix, inline Levenshtein suggestion) via `validators/allow-list.ts`.
  Extends `constants.ts` with `RECOGNIZED_FIELDS`, `SUPPORTED_SCHEMA_VERSIONS`,
  `CANONICAL_CORE_NAMES`. Fixture runner expanded from 7 (E001–E007) to 19
  (E001–E014 + W001–W004) pairs.
- Additive export `DIAGNOSTIC_DEFINITIONS: readonly DiagnosticDefinition[]` from
  `@caspian-dev/core/diagnostics`. Canonical iteration source for downstream
  consumers (replaces export-shape duck-typing in the CLI's doc-URL lookup).
  The registry sha256 header in `codes.generated.ts` is unchanged because the
  hash is computed over `caspian/diagnostics/registry.json` bytes, not over
  the generator output.
- Vendor-neutrality of `@caspian-dev/core` is mechanically enforced by
  `dependency-cruiser` (source-level lint at `packages/cli/.dependency-cruiser.cjs`)
  + lockfile audit (`scripts/audit-lockfile-vendor-neutrality.mjs` rejecting any
  resolved transitive matching `claude` or `anthropic`) + docker runtime
  release-gate (`scripts/vendor-neutrality-docker.mjs`, wired into `release.yml`
  for the v0.1.0 publish). No source change; the boundary is enforced by
  external tooling.
- First public npm release as `@caspian-dev/core@0.1.0` with provenance
  attestation. Published alongside `@caspian-dev/cli@0.1.0` from the same
  `release.yml` run via GitHub Actions OIDC + Sigstore. `dist/.tsbuildinfo`
  excluded from the published tarball (`tsBuildInfoFile` relocated outside
  `dist/`). `package.json` gains `repository`/`homepage`/`bugs`/`keywords`
  metadata fields. No source change; this release is process / infra.
