# @caspian-dev/cli

Caspian CLI validator — the vendor-neutral conformance checker for the Composable Agent Skill Protocol. Installs the `caspian` binary into your `PATH`.

## Install

```bash
# global (recommended for CI gates)
npm install -g @caspian-dev/cli

# or run without installing
npx @caspian-dev/cli validate ./
```

Requires Node.js ≥ 22.13.

## Validate

```bash
caspian validate <path>
```

`<path>` may be a single `.md` file, a directory (walked recursively for `*.md`), or a glob pattern (expanded by the CLI, not the shell — quote your patterns).

```bash
caspian validate ./skills/my-skill.md
caspian validate ./
caspian validate '**/*.md'
```

## Exit codes

| Exit | Meaning |
|---|---|
| `0` | All files valid (warnings allowed) |
| `1` | At least one file produced an error diagnostic |
| `2` | Usage error (unknown flag, missing input, glob matched nothing) |
| `3` | Internal validator error (please report) |

## Output

Default output is human-readable with ANSI colors when stdout is a TTY (auto-detected via `chalk`; honors `NO_COLOR`). Each file gets a per-file block with `<file>:<line> — <code> <severity>: <message>`, optional `hint:` and `doc:` sub-lines, followed by a summary footer `<N> files: <X> errors, <Y> warnings`.

See [JSON output](#json-output---format-json) below for the machine-readable mode.

## JSON output (`--format=json`)

Programmatic CI consumers, jq pipelines, and third-party dashboards should use `--format=json`. The output is a single JSON document on stdout, pretty-printed with 2-space indent.

```bash
caspian validate --format=json ./skills/
```

### Schema (v1)

```json
{
  "schemaVersion": "1",
  "results": [
    {
      "file": "skills/maya-lint.md",
      "valid": true,
      "diagnostics": [
        {
          "code": "CASPIAN-W001",
          "severity": "warning",
          "line": 7,
          "field": "metadata",
          "message": "Unrecognized frontmatter field outside the recognized allow-list: `metadat`. Did you mean `metadata`?",
          "doc": "https://caspian.dev/diagnostics#caspian-w001"
        }
      ]
    }
  ],
  "summary": {
    "files": 12,
    "errors": 0,
    "warnings": 3
  }
}
```

- `schemaVersion` is the stable contract identifier. v1.0 ships `"1"`.
- `results[].file` is the path as walked, with forward slashes regardless of OS.
- `results[].valid` is `true` iff no `severity: "error"` diagnostic is present (warnings are allowed).
- `diagnostics[].field` is omitted when the diagnostic does not target a specific field (e.g., `CASPIAN-E001` BOM).
- `diagnostics[].doc` is omitted only for unknown codes (not present in the v1.0 18-code registry — should never occur).
- `summary.files` counts walked-and-validated files (skipped files emit warnings on stderr; they are not included in the summary).

### Schema stability

`schemaVersion: "1"` is a stable contract. Adding optional fields (e.g., a future `summary.skipped` count or `diagnostic.hint` field) is **non-breaking** and does NOT bump the version. Removing or renaming any field, changing a field's type, or changing the semantics of an existing field bumps `schemaVersion` to `"2"` (or higher).

When `schemaVersion` is bumped, the prior version is documented as deprecated in `CHANGELOG.md` for at least one minor release before the old shape is removed. Downstream consumers should pin against `parsed.schemaVersion === "1"` and emit a warning when they encounter a different value.

### Strict-warnings recipe

Default exit semantics: `caspian` exits 0 when only warnings are present. To gate CI on a zero-warnings, zero-errors invariant, pipe through `jq`:

```bash
caspian validate --format=json ./skills/ | jq -e '.summary.errors == 0 and .summary.warnings == 0'
```

`jq -e` exits non-zero when the predicate evaluates to `false`, propagating a failing exit code to the surrounding CI step.

## See also

- [Caspian spec landing](https://caspian.dev) — 30-second pitch + 4-line frontmatter quickstart.
- [Diagnostic codes reference](https://caspian.dev/diagnostics) — every `CASPIAN-EXXX` / `CASPIAN-WXXX` code with its rule, rationale, and stable anchor.
- [`@caspian-dev/core`](https://www.npmjs.com/package/@caspian-dev/core) — the validation library this CLI wraps.

## License

Apache-2.0. See `LICENSE`.
