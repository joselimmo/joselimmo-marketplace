# Caspian Diagnostic Registry — Changelog

This file tracks changes to the Caspian diagnostic-code registry
(`registry.json`). It records the addition, deprecation, and (rarely)
correction of `CASPIAN-EXXX` and `CASPIAN-WXXX` codes.

## Governance

The Caspian diagnostic registry is **append-only**. A retired code is
never reused; a new diagnostic for an existing rule receives a new
code; semantic changes to a code's meaning require a new code (the
existing code MUST be deprecated and a successor allocated). This
discipline preserves stable diagnostic identity across spec versions
and across the validator implementations that emit those codes.

The registry's semver is **decoupled** from the spec's semver, the
`@caspian-dev/cli` package's semver, and the `@caspian-dev/core` package's semver. The
registry has its own version timeline. A spec minor bump may ship with
no registry changes; a registry-only minor bump may ship between spec
releases. Cross-references between the four CHANGELOGs
(`spec/CHANGELOG.md`, `diagnostics/CHANGELOG.md`,
`packages/cli/CHANGELOG.md`, `packages/core/CHANGELOG.md`) are
maintained at release time, not enforced by tooling.

## Unreleased

- Initial registry shape established with the 17 v1.0 codes
  (`CASPIAN-E001`–`CASPIAN-E014` plus `CASPIAN-W001`–`CASPIAN-W003`).
  The registry is validated structurally by
  [`../schemas/v1/diagnostic-registry.schema.json`](../schemas/v1/diagnostic-registry.schema.json).
