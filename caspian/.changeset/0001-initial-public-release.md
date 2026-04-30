---
"@caspian-dev/core": minor
"@caspian-dev/cli": minor
---

First public npm release of the Caspian validator stack — `@caspian-dev/core@0.1.0` and `@caspian-dev/cli@0.1.0` published with provenance attestations via GitHub Actions OIDC + Sigstore.

This bumps both packages from the placeholder `0.0.1` to `0.1.0` per `architecture.md:296` (E1 — *"v1.0 ships CLI `0.1.0` + spec `schema_version: \"0.1\"`"*). The `0.1.0` version couples to the v0.1 spec the validator implements; future minor / patch CLI releases continue to support the same `schema_version` until a v0.2 spec is ratified.

**Cumulative surface (Stories 2.1 → 2.8):**

- **`@caspian-dev/core`** — pure validation library. 6-stage pipeline (byte-level encoding/BOM checks, frontmatter extraction with 4 KB cap, strict YAML 1.2 parse + post-parse boolean-coercion scan, ajv envelope validation against bundled JSON Schema Draft 2020-12, namespace warnings, allow-list scan with Levenshtein suggestions). 18 diagnostic codes (E001–E014 errors + W001–W004 warnings), each with stable doc URL `https://caspian.dev/diagnostics#caspian-<code>`. Public API: `validateFile(path: string): Promise<Diagnostic[]>` plus `DIAGNOSTIC_DEFINITIONS` constant. Runtime deps: `ajv ^8.17.0`, `yaml ^2.6.0`. No vendor coupling.

- **`@caspian-dev/cli`** — CLI wrapper around `@caspian-dev/core` (binary in PATH = `caspian` per `bin` field). `caspian validate <path>` accepts file / directory / glob inputs. Walker uses `fast-glob` with `followSymbolicLinks: false` and a realpath safety check. Exit-code matrix: `0` clean, `1` errors present, `2` usage error, `3` internal validator error. Two output formats: `--format=human` (default; ANSI colors auto-detected via `chalk`, hint extraction, doc-URL footer) and `--format=json` with stable B4 schema (`schemaVersion: "1"`, `results[]`, `summary{files,errors,warnings}`; insertion-order keys; `field?` / `doc?` keys conditionally omitted). Runtime deps: `@caspian-dev/core` (workspace), `chalk ^5.3.0`, `commander ^12.1.0`, `fast-glob ^3.3.3`. No vendor coupling.

- **Quality gates** — `verify-pack` published-files snapshot guard (40 files baseline); 18-case `conformance/` parity suite consumed by the CLI as a CI dog-food gate; 3-layer vendor-neutrality enforcement (`dependency-cruiser` source-level forbidden rule + `pnpm ls` lockfile audit transitive + docker-runtime release gate against `node:22-alpine`); pre-commit hook regenerating typed diagnostic-codes constants with sha256 verification.

- **Distribution** — npm provenance via `publishConfig.provenance: true` on both packages; OIDC token from GitHub Actions; no long-lived `NPM_TOKEN`. New `examples/ci-integration/` ships a 3-line `npx @caspian-dev/cli` snippet for plugin authors' GitHub Actions PR gates (FR36).

**License**: Apache-2.0 for both packages. Each package re-declares the license explicitly so isolated consumers see the boundary unambiguously.

**Engines**: Node.js `>=22.13` (the v1.0 floor, locked via `.nvmrc` and `engines.node` on both packages).
