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
