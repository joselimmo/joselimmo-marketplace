# CI Integration — `npx @caspian-dev/cli` in GitHub Actions

Gate your repository's pull requests on Caspian frontmatter conformance with a copy-pasteable 3-line GitHub Actions step. No custom action, no global install, no host-specific runtime required.

## What you get

- A PR check that runs `caspian validate` against your skill files on every pull request.
- Default semantics: **fail the PR on any error diagnostic** (warnings tolerated).
- Optional **strict-warnings gate**: fail the PR on warnings as well.
- Vendor-neutral: runs on stock Node 22 in any GitHub Actions runner; no host-specific runtime or extension shims required (NFR17, NFR20).

## Prerequisites

- A GitHub repository with Actions enabled.
- Skill / command / artifact `.md` files carrying Caspian frontmatter (see [`../minimal-skill-adoption/`](../minimal-skill-adoption/) for the 4-line frontmatter delta).

That is it. Caspian's CLI is fetched via `npx` on demand; no setup beyond Node 22 in the runner.

## Setup (3 steps)

1. **Copy the snippet.** Take the contents of [`github-actions-snippet.yml`](./github-actions-snippet.yml) into your repo at `.github/workflows/validate-caspian.yml` (or any name you like).
2. **Adjust the path.** Replace `./skills/` in the `run:` line with the directory you want validated (e.g., `./agents/`, `./commands/`, or `./` for everything).
3. **Commit and push.** From the next pull request onward, the workflow runs and gates the PR.

## The snippet

```yaml
name: Validate Caspian frontmatter

on:
  pull_request:
    paths:
      - 'skills/**/*.md'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - name: Validate Caspian frontmatter
        run: npx @caspian-dev/cli@0.1.0 validate ./skills/
        shell: bash
```

The validation step is exactly three YAML lines (`- name`, `  run`, `  shell`) per FR36; the `actions/checkout` and `actions/setup-node` steps are standard GitHub Actions boilerplate.

## Default exit semantics (errors-only gate)

The `caspian validate` command exits with these codes:

| Exit | Meaning |
|---|---|
| `0` | All files valid (warnings allowed) |
| `1` | At least one error diagnostic emitted |
| `2` | Usage error (unknown flag, missing input, glob matched nothing) |
| `3` | Internal validator error |

GitHub Actions fails any step with a non-zero exit, so the snippet above gates your PR on errors but tolerates warnings. This matches PRD Journey 6 (*"Maya's PR fails fast on a real schema violation"*).

## Strict-warnings gate (optional)

To fail the PR on warnings as well as errors, swap the `run:` line for the JSON-output variant and pipe through `jq`:

```yaml
      - name: Validate Caspian frontmatter (strict)
        run: npx @caspian-dev/cli@0.1.0 validate --format=json ./skills/ | jq -e '.summary.errors == 0 and .summary.warnings == 0'
        shell: bash
```

`jq -e` exits non-zero when the predicate evaluates to `false`, so any warning fails the step. `jq` is preinstalled on `ubuntu-latest` runners.

## Pinning the CLI version

The snippet pins `@caspian-dev/cli@0.1.0` deliberately. A floating `@latest` would let a future CLI minor bump silently change validator behavior in your CI on the day npm publishes it. Bumping the pin should be a deliberate PR — coordinated with whatever spec / fixture changes it brings.

When you bump the pin, re-run the snippet locally first (`npx @caspian-dev/cli@<new-version> validate ./skills/`) to confirm your repo still passes.

## Vendor-neutrality notice

This snippet contains zero references to any vendor-bound runtime. The Caspian CLI is published as a standard npm package and runs on any Node ≥ 22 host. The package's vendor-neutrality is mechanically enforced (source-level dependency-cruiser rule + lockfile audit + `node:22-alpine` runtime release gate) — see the project [README](../../README.md) and `architecture.md:715-721`.

## Offline operation

After the first `npx` fetch (cached by `actions/setup-node`'s `cache: pnpm`-equivalent or by GitHub Actions' default npm cache on subsequent runs), `caspian validate` performs **zero network I/O** at validate time (NFR20). All schemas are bundled with the package; doc-URL emission is local string concatenation.

## Troubleshooting

- **`npx` cannot find `@caspian-dev/cli`** — confirm the runner has internet access and the version pin matches a real tag on [npmjs.com/package/@caspian-dev/cli](https://www.npmjs.com/package/@caspian-dev/cli).
- **Step fails with exit 2** — the validator is reporting a usage error. Verify the path you passed (`./skills/`) exists in the repo and contains `.md` files.
- **Step succeeds but you expect failures** — confirm your `.md` files actually have Caspian frontmatter (`schema_version`, `type`). Files without frontmatter are skipped (warning on stderr, not counted toward exit code in v1.0).
- **Strict-warnings gate emits "jq: error: ..."** — verify the JSON output is valid by running locally: `npx @caspian-dev/cli@0.1.0 validate --format=json ./skills/ > /tmp/out.json && cat /tmp/out.json | jq .`.

## See also

- [`../minimal-skill-adoption/`](../minimal-skill-adoption/) — the 4-line frontmatter delta to add Caspian to an existing Anthropic SKILL.md.
- [`../../packages/cli/README.md`](../../packages/cli/README.md) — full CLI surface reference (install, exit codes, JSON schema).
- [Caspian spec landing](https://caspian.dev) (Epic 4 — link goes live when the site ships).
