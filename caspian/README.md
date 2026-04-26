# Caspian — Composable Agent Skill Protocol

The Claude Code plugin ecosystem grew from zero to thousands of skills, agents, and slash commands in under a year. Every author defines their own frontmatter conventions, so a developer who installs four plugins from four authors has no way to know which skill fires when, in what order, or what each expects and produces. **Caspian** closes that gap with a minimal frontmatter contract — `schema_version`, `type`, `requires`, `produces` — that turns any agent, skill, command, or memory document into a typed, composable unit. Agent-Skills-compatible by construction; every Anthropic SKILL.md field remains valid.

## Get Started in 30 Seconds

- **Read the spec** — [`spec/`](./spec/) — *coming soon* (Stories 1.2–1.3, 5.1–5.2). The 4-field contract, canonical `core:*` vocabulary, governance and RFC process.
- **Install the CLI** — [`packages/cli/`](./packages/cli/) — *coming soon* (Stories 2.1–2.8). `npm install -g caspian` then `caspian validate <path>` to gate your repo on Caspian conformance with zero Claude Code dependency.
- **Try the reference plugin** — [`plugins/casper-core/`](./plugins/casper-core/) — *coming soon* (Stories 3.1–3.5). `/plugin install casper-core@anthropic-marketplace` to demo the `/init-project` → `/discover` → `/plan-story` chain.
- **Contribute via RFC** — [`spec/CONTRIBUTING.md`](./spec/CONTRIBUTING.md) — *coming soon* (Story 5.1). Fork, copy `spec/proposals/TEMPLATE.md`, fill the four mandated sections, open a PR.

## Project Status

This repository is bootstrapping toward Caspian + casper-core **v1.0**. The four artifacts above ship in a single coordinated release. Until then, links above are placeholders that resolve as each story merges.

## Repository Layout

```text
caspian/
├── spec/                  # Caspian Core spec (CC-BY-4.0)
├── schemas/               # JSON Schemas Draft 2020-12 (Apache-2.0)
├── diagnostics/           # Versioned diagnostic registry (Apache-2.0)
├── fixtures/              # Canonical valid + invalid artifact samples
├── examples/              # Author-readable walkthroughs
├── packages/
│   ├── core/              # @caspian/core — vendor-neutral validation engine
│   └── cli/               # caspian — Node CLI on npm
├── plugins/
│   └── casper-core/       # Claude Code reference plugin
├── site/                  # caspian.dev landing site source
└── conformance/           # Vendor-neutral parity test suite
```

Most of the tree above is provisional during bootstrap. Each top-level directory lands with its first story (see the [epics](../_bmad-output/planning-artifacts/epics.md) for the full sequence).

## License

- **Spec prose** is licensed under **CC-BY-4.0** (see [`LICENSE-CC-BY-4.0`](./LICENSE-CC-BY-4.0)). Applies to all files under `spec/`.
- **All code, schemas, and tooling** is licensed under **Apache-2.0** (see [`LICENSE`](./LICENSE)). Applies to everything else.
- Each subdirectory carries an explicit `LICENSE` re-declaration so the licensing remains unambiguous when a directory is consumed in isolation.
