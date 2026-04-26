# Caspian Core Specification

Caspian Core defines the four-field YAML frontmatter contract —
`schema_version`, `type`, `requires`, `produces` — that turns any
agent, skill, command, or document into a typed, composable unit.
This directory holds the spec's normative prose, the canonical
`core:*` vocabulary, the RFC governance process, and the proposal
template. The contract is overlay-compatible with Anthropic Agent
Skills and the Claude Code plugin format: every documented SKILL.md
field remains valid alongside Caspian fields.

## Where to start

- **Read the contract** → [`core.md`](./core.md) — the normative reference, ≤10 minutes.
- **Browse canonical types** → [`vocabulary/`](./vocabulary/) — per-`core:*`-type rationale *(coming soon — Story 1.3)*.
- **Contribute via RFC** → [`CONTRIBUTING.md`](./CONTRIBUTING.md) — RFC process and BDFL response SLA *(coming soon — Story 5.1)*.

## What lives elsewhere

- **JSON Schemas** → [`../schemas/v1/`](../schemas/v1/) *(coming soon — Story 1.4)* — machine-readable envelope schema (Draft 2020-12).
- **Diagnostic codes** → [`../diagnostics/registry.json`](../diagnostics/registry.json) *(coming soon — Story 1.5)* — the 17 v1.0 `CASPIAN-EXXX` / `CASPIAN-WXXX` codes.
- **Canonical fixtures** → [`../fixtures/`](../fixtures/) *(coming soon — Story 1.6)* — valid + invalid frontmatter samples consumed by the validator's regression suite.
- **Working examples** → [`../examples/`](../examples/) *(coming soon — Stories 1.7, 2.8)* — author-readable walkthroughs (the 4-line frontmatter delta and the CI-integration snippet).
- **Spec changelog** → [`CHANGELOG.md`](./CHANGELOG.md) *(coming soon — Story 5.2)*.
- **Spec proposals** → [`proposals/`](./proposals/) *(coming soon — Story 5.1 introduces the TEMPLATE; Story 5.2 lands `0001-initial-spec.md`)*.

## License

All files in this directory and its subdirectories are licensed
under **CC-BY-4.0** (see [`LICENSE.md`](./LICENSE.md)) unless an
inner `LICENSE.md` declares otherwise. This override applies to spec
prose only; code, schemas, and tooling outside `caspian/spec/` remain
under the repository-default Apache-2.0 license.
