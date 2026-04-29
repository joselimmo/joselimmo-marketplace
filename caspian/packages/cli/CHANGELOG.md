# Changelog — @caspian-dev/cli

This changelog tracks the CLI's own semver. The CLI is decoupled from the spec's `schema_version`. The set of `schema_version` values the CLI knows how to validate is declared in `package.json` as `caspian.supportedSchemaVersions` (currently `["0.1"]`).

## Unreleased

- Initial CLI surface (Story 2.5): `caspian validate <path>` accepting file / directory / glob inputs. Walker uses `fast-glob` with `followSymbolicLinks: false` and a realpath check that drops files resolving outside `cwd`. Human formatter renders per-file diagnostic blocks plus a `<N> files: <X> errors, <Y> warnings` summary footer; ANSI colors auto-detected via `chalk`. Exit code matrix: `0` clean, `1` errors present, `2` usage error, `3` internal validator error. `--version` and `--help` flags are wired via `commander` v12 (with `exitOverride()` so commander never calls `process.exit` itself). The version literal is generated at build time from `package.json` into `src/version.generated.ts`.
