# Caspian conformance report

| Field | Value |
| --- | --- |
| Generated at | `{{generated_at}}` |
| Validator binary | `{{validator_path}}` |
| Validator version | `{{validator_version}}` |

## How to read this report

This report is the per-run output of `conformance/runner.mjs`. Each row in the
table below maps to one case under `conformance/cases/NNN-<slug>/`. The runner
spawns the validator binary as `<validator> validate <input.md> --format=json`
and compares the emitted `results[0].diagnostics[].code` multiset against the
case's `expected.json`. Only the diagnostic `code` is the conformance contract
in v1.0; `line`, `severity`, `field`, `message`, `doc` are informational.

The `Result` cell is `✅ PASS` when the multiset matches exactly, or
`❌ FAIL: <reason>` otherwise. `<reason>` may be `expected [...], got [...]`
(multiset mismatch), `validator emitted non-JSON stdout`, `missing input.md`,
`missing expected.json`, or `malformed expected.json: <message>`.

## Cases

{{cases_table}}

## Summary

**{{summary}}**

---

This report is generated; do not edit. Re-run `pnpm conformance` to refresh.
