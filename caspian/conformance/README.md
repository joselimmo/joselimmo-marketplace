# Caspian conformance suite

Vendor-neutral parity gate for any Caspian validator.

## Purpose

Caspian's vendor-neutrality story (FR11, NFR17) and its v1.0 → v1.1 transition
into a defense-in-depth validator stack (LSP + CI ajv layer + runtime hook +
install-time validator) hinge on cross-implementation parity. This suite is
the mechanical gate: any validator that can pass it claims conformance with
the v1.0 contract; any validator that cannot is, by definition, drifting.

In v1.0 the suite is exercised by `@caspian-dev/cli` itself as a CI gate (the
CLI eats its own dog food). In v1.1+ the same harness is the parity contract
for the alternate-implementation layers and for any third-party port (e.g., a
future Python `caspian-py` or Rust `caspian-rs`, per the Vision section of the
PRD).

See `architecture.md:715-721` for the full 3-layer vendor-neutrality boundary;
this suite is one of three layers (the other two are dep-cruiser source-level
linting and the lockfile audit, both wired in CI).

## Invocation

```bash
node conformance/runner.mjs <validator-binary-path>
```

The validator binary MUST accept `validate <input.md> --format=json` and emit
a JSON object with the B4 schema (`schemaVersion: "1"`, `results[]`,
`summary{}`). See `packages/cli/README.md` for the canonical schema.

The runner takes one positional argument (the binary path). No environment
variables, no flags, no extra positionals — the contract is intentionally
minimal so future validator implementations have a tight target to hit.

Example invocation against the workspace's CLI build:

```bash
pnpm -F @caspian-dev/cli build
node conformance/runner.mjs ./packages/cli/dist/cli.js
```

Or via the wrapper script:

```bash
pnpm conformance
```

## Case structure

Each case lives under `cases/NNN-<slug>/` with two siblings:

- `input.md` — the validator's input. Identical-byte copy of the corresponding
  fixture under `fixtures/invalid/`.
- `expected.json` — the conformance assertion. Shape:
  ```json
  {
    "diagnostics": [
      { "code": "CASPIAN-EXXX" }
    ]
  }
  ```
  Only `code` is part of the v1.0 contract.

The case → registry-code mapping is one-to-one. v1.0 ships 18 cases, mirroring
the 18 codes in `diagnostics/registry.json` (E001-E014 + W001-W004).

## Comparison policy

The runner extracts the actual diagnostic codes from
`results[0].diagnostics[].code` of the validator's `--format=json` output and
compares them as a **multiset of strings** against the expected codes:

- Order-independent (sort both sides before comparing).
- Multiplicity-sensitive (a duplicate expected code requires a duplicate
  actual code).
- Other diagnostic fields (`line`, `severity`, `field`, `message`, `doc`) are
  ignored. Future v1.1+ extensions may opt in to richer assertions via a
  documented runner flag; v1.0 keeps the contract narrow.

A case passes if and only if the two multisets are equal. Any mismatch (extra
code, missing code, multiplicity drift, parse failure, missing sibling) is a
case failure.

## Adding a case

1. Add the new diagnostic code to `diagnostics/registry.json` (covered by an
   RFC if it is a spec change; ad-hoc otherwise).
2. Run `pnpm gen:codes` to refresh `codes.generated.ts` (Story 2.2 sha256
   gate).
3. Author a fixture under `fixtures/invalid/<CODE>-<rule>/<variant>.md`
   demonstrating the failure mode, plus its `<variant>.expected.json`.
4. Create `cases/NNN-<slug>/input.md` as a byte-identical copy of the fixture.
5. Create `cases/NNN-<slug>/expected.json` with a single-entry `diagnostics`
   array referencing the new code.
6. Re-run `pnpm conformance`.

The case ordering is by directory name (lexicographic), so new cases land at
the appropriate position in `REPORT.md` automatically. v1.0 numbers cases
sequentially; v1.1+ contributors may renumber if the suite expands beyond the
two-decimal range, but renumbering is not required.

## Reporting

Every run writes a fresh `REPORT.md` from `REPORT.template.md`. The report
captures the validator path, the captured `--version`, the per-case table
(expected codes, actual codes, pass/fail), and the summary count.

`REPORT.md` is gitignored. Contributors do not commit it; CI artifacts upload
it from the workflow run if archiving is configured (out of scope for v1.0).

## Conformance scope (v1.0)

- **In scope:** diagnostic-code multiset equality per case.
- **Out of scope (v1.0):** line-number assertions, severity assertions,
  full-message assertions, performance budgets, multi-file inputs per case,
  parameterized runs (e.g., per-OS, per-Node-version). All of these are
  candidate v1.1+ extensions reachable via a `--strict` or
  `--feature=<flag>` opt-in to the runner; v1.0 deliberately keeps the
  contract minimal so the v1.1 alternative implementations have a clear
  starting line.

## Vendor-neutrality boundary cross-reference

This suite is the **conformance** half of Caspian's portability story. The
**vendor-neutrality enforcement** half is the 3-layer mechanism documented in
`architecture.md:715-721`:

1. **Source-level** — `dependency-cruiser` (Story 2.7), lints the import
   graph of `@caspian-dev/{core,cli}`.
2. **Lockfile-level** — `pnpm ls --prod --depth=Infinity --json` + a
   case-insensitive `claude|anthropic` regex (Story 2.7).
3. **Runtime-level** — `docker run --rm node:22-alpine npx @caspian-dev/cli`
   passes the canonical fixture set with no Claude Code installed (Story 2.7;
   wired as a release gate in Story 2.8).

The two halves are independent: a future external validator can pass the
conformance suite without using the same dependency graph (e.g., Python
implementations need not run dep-cruiser), but conformance signals "verdict
parity" while the 3-layer mechanism signals "no Claude Code coupling at the
implementation level."
