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

`--format=json` lands in a future release.

## License

Apache-2.0. See `LICENSE`.
