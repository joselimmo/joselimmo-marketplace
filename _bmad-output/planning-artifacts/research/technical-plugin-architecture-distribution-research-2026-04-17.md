---
stepsCompleted: [1, 2]
inputDocuments:
  - _bmad-output/brainstorming/brainstorming-session-2026-04-17-1545.md
  - _bmad-output/planning-artifacts/research/domain-agentic-workflows-ecosystem-research-2026-04-17.md
workflowType: 'research'
lastStep: 1
research_type: 'technical'
research_topic: 'Claude Code Plugin Architecture, Manifest Schema, and Marketplace Distribution Mechanics'
research_goals: 'Produce the factual basis required to finalize (1) the directory layout of plugins/<name>/, (2) the manifest schema for plugin.json and marketplace.json, (3) the installation and resolution rules Claude Code applies at load time, (4) the versioning and publishing conventions, and (5) the acceptance criteria for inclusion in the official Anthropic marketplace. Output will directly inform Day-1 of the 7-day MVP roadmap from the brainstorming.'
user_name: 'Cyril'
date: '2026-04-17'
web_research_enabled: true
source_verification: true
research_track: '1 of 5'
related_research:
  - 'Research #2 — Frontmatter Schemas for Typed Artifacts (planned)'
  - 'Research #3 — Subagents as Context-Isolation Primitives (planned)'
  - 'Research #4 — MCP for Tool Integration (planned)'
  - 'Research #5 — SessionStart Hook & Hook Lifecycle (planned)'
scope_exclusions:
  - 'Hooks lifecycle and SessionStart mechanics (covered in Research #5)'
  - 'Frontmatter schemas of skills/agents/commands (covered in Research #2)'
  - 'Subagent definition and invocation (covered in Research #3)'
  - 'MCP server configuration (covered in Research #4)'
---

# Research Report: Claude Code Plugin Architecture & Distribution

**Date:** 2026-04-17
**Author:** Cyril
**Research Type:** Technical (track 1 of 5)

---

## Research Overview

This is the first of five sequential technical research reports scoped jointly with the project owner on 2026-04-17. The reports share a single implementation target — a Claude Code plugin positioned as an anti-BMAD, AIDD-inspired, token-efficient workflow layer with a portable memory convention (see inputs in frontmatter). Each report is focused on one implementation-decision cluster to avoid cross-report duplication.

**This report (Track 1)** covers the Claude Code plugin architecture and distribution substrate:

- Plugin repository layout conventions (`plugin.json`, `marketplace.json`, `skills/`, `agents/`, `commands/`).
- Manifest schemas: required vs optional fields, version semantics, compatibility declarations.
- Installation and resolution: local paths, Git URLs, marketplace registration, load-time path resolution inside Claude Code.
- Versioning, namespacing, and publishing conventions.
- Distribution surfaces: community marketplaces vs the official Anthropic marketplace; acceptance criteria where publicly documented.

Findings inform Day-1 of the 7-day MVP roadmap (plugin skeleton + marketplace registration).

---

<!-- Content will be appended sequentially through research workflow steps -->

## Technical Research Scope Confirmation

**Research Topic:** Claude Code Plugin Architecture, Manifest Schema, and Marketplace Distribution Mechanics

**Research Goals:** produce the factual basis required to finalize (1) the directory layout of `plugins/<name>/`, (2) the manifest schema for `plugin.json` and `marketplace.json`, (3) the installation and resolution rules Claude Code applies at load time, (4) the versioning and publishing conventions, and (5) the acceptance criteria for inclusion in the official Anthropic marketplace.

**Technical Research Scope:**

- Architecture Analysis — plugin layout, separation between marketplace and plugin, naming conventions
- Implementation Approaches — patterns observed in official and community plugins (Anthropic reference, Superpowers, wshobson, etc.)
- Technology Stack — manifest schemas (JSON), Claude Code `/plugin` CLI, validation tooling
- Integration Patterns — discovery/installation flows, namespacing, version-compatibility declarations
- Distribution & Governance — community marketplaces vs the official Anthropic marketplace; publicly documented acceptance criteria

**Explicit Exclusions (delegated to sibling research tracks):**

- Hooks lifecycle & SessionStart mechanics → Research #5
- Skill / agent / command frontmatter schemas → Research #2
- Subagents → Research #3
- MCP integration → Research #4

**Research Methodology:**

- Current web data with rigorous source verification (official docs at `code.claude.com`, Anthropic blog, GitHub)
- Multi-source validation for critical technical claims (required manifest fields, marketplace criteria)
- Confidence level framework for uncertain information
- Comprehensive technical coverage focused on implementation-decision enablement

**Scope Confirmed:** 2026-04-17

---

## Technology Stack Analysis

> **Domain-adapted interpretation**: for a Claude Code plugin, the "technology stack" is the set of host-defined schemas, runtime conventions, CLI tooling, and distribution infrastructure the plugin is expected to honor. Generic categories (programming languages, databases, cloud providers) are replaced below by the equivalent plugin-layer categories. Source citations follow each subsection.

### Manifest Languages and Schemas

The plugin substrate is **JSON-only** at the manifest layer. Two manifest files drive discovery and loading:

- **`.claude-plugin/plugin.json`** — the plugin manifest. Optional when the plugin uses default component locations; when present, only `name` is required (kebab-case, unique, used for namespacing — e.g. a plugin named `plugin-dev` exposes its `agent-creator` agent as `plugin-dev:agent-creator`). Supported fields cover metadata (`version`, `description`, `author`, `homepage`, `repository`, `license`, `keywords`), component paths (`skills`, `commands`, `agents`, `hooks`, `mcpServers`, `outputStyles`, `lspServers`, `monitors`), user configuration (`userConfig` — with sensitive-value storage in the system keychain and substitution via `${user_config.KEY}`), message channels (`channels`), and inter-plugin dependencies (`dependencies` with semver constraints).
- **`.claude-plugin/marketplace.json`** — the marketplace catalog. Required fields: `name` (kebab-case, certain names are reserved for Anthropic — `claude-code-marketplace`, `anthropic-marketplace`, `claude-plugins-official`, etc.), `owner.name`, and `plugins[]` (each entry requires `name` + `source`). Optional `metadata.pluginRoot` lets entries use short `"source": "formatter"` when a prefix is common. A `strict` flag per plugin entry (default `true`) controls whether `plugin.json` is the authority for component definitions or the marketplace entry is.

_Popular language: JSON with documented schemas. No YAML for manifests. Schemas are published at `https://anthropic.com/claude-code/marketplace.schema.json` (referenced by `$schema` in the file)._

_Emerging: a community-maintained JSON Schema (`hesreallyhim/claude-code-json-schema`) provides IDE autocompletion and `ajv`-compatible validation. It declares itself **unofficial** but tracks official docs; the maintainer documents known deviations from `claude plugin validate` CLI behavior (notably around version formatting and naming conventions)._

_Evolution: the manifest schema has expanded through 2025–2026 to accommodate monitors, channels, user configuration, LSP servers, and dependencies. The only required field has remained `name` since v1._

_Performance characteristics: manifest parsing is negligible; the token-relevant axis is what the manifest **loads** — skills are not all resident; hooks and monitors run out of process; MCP servers run as subprocesses._

_Sources:_
- [Plugins reference (plugins-reference)](https://code.claude.com/docs/en/plugins-reference) — accessed 2026-04-17
- [Create and distribute a plugin marketplace (plugin-marketplaces)](https://code.claude.com/docs/en/plugin-marketplaces) — accessed 2026-04-17
- [hesreallyhim/claude-code-json-schema](https://github.com/hesreallyhim/claude-code-json-schema) — accessed 2026-04-17

### Component Types (the Plugin "Frameworks")

Plugins compose seven first-class component types, each with a default directory and a path override via the manifest. Components must live at the plugin root — **never** inside `.claude-plugin/`, which holds only the manifest.

| Component        | Default location            | Unit format                                        | Notes / risk surface                                                                                       |
| :--------------- | :-------------------------- | :------------------------------------------------- | :--------------------------------------------------------------------------------------------------------- |
| Skills           | `skills/<name>/SKILL.md`    | Directory with `SKILL.md` + optional assets        | Auto-invokable by Claude unless `disable-model-invocation: true`; namespaced as `/plugin-name:skill`       |
| Commands (legacy)| `commands/*.md`             | Flat markdown files                                | Superseded by `skills/` for new plugins — still supported                                                  |
| Agents           | `agents/*.md`               | Markdown with YAML frontmatter                     | `hooks`, `mcpServers`, `permissionMode` explicitly **forbidden** for plugin-shipped agents (security)      |
| Hooks            | `hooks/hooks.json` or inline | JSON event→command mapping                         | ~27 lifecycle events exposed (covered in Research #5); four execution types: `command`/`http`/`prompt`/`agent` |
| MCP servers      | `.mcp.json` or inline       | Standard MCP config                                | Run as subprocesses with `${CLAUDE_PLUGIN_ROOT}` substitution; covered in Research #4                      |
| LSP servers      | `.lsp.json` or inline       | Per-language config                                | Binary must be installed separately by the user                                                            |
| Monitors         | `monitors/monitors.json`    | Persistent stdout → notifications                  | Requires Claude Code ≥ v2.1.105; runs unsandboxed at hook trust level                                      |
| Output styles    | `output-styles/*`           | Style definitions                                  | Low implementation priority for our MVP                                                                    |
| Executables      | `bin/*`                     | Files added to Bash tool's `PATH`                  | Invokable as bare commands while plugin is enabled                                                         |
| Settings         | `settings.json` (root)      | JSON default settings                              | Only `agent` and `subagentStatusLine` keys currently honored                                               |

Key runtime variables injected into all components and subprocesses:

- **`${CLAUDE_PLUGIN_ROOT}`** — absolute path to the installed plugin directory (changes on update; do not write here).
- **`${CLAUDE_PLUGIN_DATA}`** — persistent per-plugin directory, resolves to `~/.claude/plugins/data/{id}/`, survives updates. Canonical use: cached dependencies (`node_modules`, venvs) keyed on a manifest diff.

_Major framework: Claude Code native components. No cross-host framework exists at this layer (MCP is cross-host only for agent↔tool, not for components)._

_Ecosystem maturity: documented, versioned, and with a `/plugin validate` CLI for schema conformance — this is the most mature segment of the plugin stack._

_Source: [Plugins reference — components section](https://code.claude.com/docs/en/plugins-reference) — accessed 2026-04-17._

### Storage, Cache, and State (the Plugin "Databases")

Plugin state lives in four well-defined locations; none are user-writable by convention:

- **Plugin cache** — `~/.claude/plugins/cache/`. Installed plugins are copied here at install time (not used in-place), each version in a separate directory. Orphaned versions are garbage-collected after **7 days** to support concurrent sessions. This is why `../shared-utils` paths inside a plugin **do not work** post-install: files outside the plugin root aren't copied. Workaround: symlinks (preserved through the cache).
- **Persistent data** — `~/.claude/plugins/data/{id}/` (exposed as `${CLAUDE_PLUGIN_DATA}`). Survives updates; deleted on last-scope uninstall unless `--keep-data` is passed. Intended for installed dependencies (`node_modules`, venvs), generated code, caches.
- **Known marketplaces registry** — `~/.claude/plugins/known_marketplaces.json`. Stored once per user, not per project.
- **Seed directory (optional, for containers/CI)** — `$CLAUDE_CODE_PLUGIN_SEED_DIR` — mirrors `~/.claude/plugins` structure; read-only; `extraKnownMarketplaces` entries that match seed entries use the seed copy. Use `CLAUDE_CODE_PLUGIN_CACHE_DIR` during image build to populate a seed.

Settings storage is layered by scope:

| Scope     | File                                 | Purpose                                      |
| :-------- | :----------------------------------- | :------------------------------------------- |
| `user`    | `~/.claude/settings.json`            | Personal across all projects (default)       |
| `project` | `.claude/settings.json`              | Team-shared via version control              |
| `local`   | `.claude/settings.local.json`        | Personal, repo-scoped, gitignored            |
| `managed` | Managed settings file (OS-specific)  | Org policy (read-only, update-only)          |

_Source: [Plugins reference — caching / scopes sections](https://code.claude.com/docs/en/plugins-reference) — accessed 2026-04-17._

### Development Tools and CLI Surface

Claude Code ships two interface layers — an interactive UI (`/plugin …`) and a non-interactive CLI (`claude plugin …`) — with equivalent capabilities. Both should be supported as testing surfaces for a plugin project.

**Interactive (inside Claude Code):**

| Command                                  | Purpose                                                           |
| :--------------------------------------- | :---------------------------------------------------------------- |
| `/plugin`                                | Opens tabbed manager: Discover / Installed / Marketplaces / Errors |
| `/plugin marketplace add <source>`       | Register a marketplace (GitHub `owner/repo`, git URL, local path, remote URL) |
| `/plugin marketplace list \| update \| remove` | Manage marketplaces (alias `rm`)                              |
| `/plugin install <name>@<marketplace>`   | Install a plugin from a known marketplace                         |
| `/plugin enable \| disable \| uninstall` | State management                                                  |
| `/plugin validate <path>`                | Schema-validate `plugin.json`, `marketplace.json`, component frontmatter, `hooks/hooks.json` |
| `/reload-plugins`                        | Hot-reload after changes without restarting the session           |

**Non-interactive (scripting/CI):**

| Command                                                        | Purpose                                    |
| :------------------------------------------------------------- | :----------------------------------------- |
| `claude --plugin-dir ./my-plugin`                              | Load a local plugin for dev (no install)   |
| `claude plugin install \| uninstall \| enable \| disable \| update \| list` | Plugin lifecycle                           |
| `claude plugin marketplace add \| list \| remove \| update`    | Marketplace lifecycle                      |
| `claude plugin validate .`                                     | Same as `/plugin validate`                 |
| `claude --debug`                                               | Shows plugin loading traces (required for diagnosis) |

All lifecycle commands accept `-s, --scope <user|project|local>`. Uninstall accepts `--keep-data` to preserve the persistent data directory.

**Environment variables of note:**

- `CLAUDE_CODE_PLUGIN_SEED_DIR` — pre-populate plugins for containers/CI
- `CLAUDE_CODE_PLUGIN_CACHE_DIR` — redirect install cache at build time
- `CLAUDE_CODE_PLUGIN_KEEP_MARKETPLACE_ON_FAILURE=1` — retain stale cache when `git pull` fails (airgapped environments)
- `CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS` — raise the 120s git timeout for large repos
- `DISABLE_AUTOUPDATER` + `FORCE_AUTOUPDATE_PLUGINS=1` — disable Claude Code auto-update but keep plugin auto-updates
- Private-repo tokens: `GITHUB_TOKEN`/`GH_TOKEN`, `GITLAB_TOKEN`/`GL_TOKEN`, `BITBUCKET_TOKEN` (required for background auto-update of private marketplaces)

**Recommended tooling for plugin authors:**

- `claude plugin validate` in CI as a pre-commit / pre-publish gate.
- The unofficial JSON Schema repo (`hesreallyhim/claude-code-json-schema`) for IDE autocompletion.
- The community plugin template (`ivan-magda/claude-code-plugin-template`) as a scaffolding reference (scaffolding + validation commands + hooks + skills + agents + CI/CD workflows — confidence: medium, not audited here).

_Sources:_
- [Plugins reference — CLI commands](https://code.claude.com/docs/en/plugins-reference) — accessed 2026-04-17
- [Discover and install prebuilt plugins](https://code.claude.com/docs/en/discover-plugins) — accessed 2026-04-17
- [ivan-magda/claude-code-plugin-template](https://github.com/ivan-magda/claude-code-plugin-template) — referenced 2026-04-17

### Distribution Infrastructure (the Plugin "Cloud")

The five supported plugin-source types define how a marketplace entry resolves a plugin at install time:

| Source type     | Fields                                | Notes                                                                                  |
| :-------------- | :------------------------------------ | :------------------------------------------------------------------------------------- |
| Relative path   | `string` starting with `./`           | In-repo; resolved against marketplace root; **only works for git-based marketplaces** (not URL-based) |
| `github`        | `repo`, `ref?`, `sha?`                | `ref` = branch/tag; `sha` = exact 40-char commit for immutability                      |
| `url`           | `url`, `ref?`, `sha?`                 | Any git host (HTTPS or `git@`); `.git` suffix optional (Azure DevOps, AWS CodeCommit) |
| `git-subdir`    | `url`, `path`, `ref?`, `sha?`         | Sparse partial clone — efficient for monorepos                                         |
| `npm`           | `package`, `version?`, `registry?`    | Standard npm install; supports private registries                                      |

Distribution tiers observed in April 2026:

- **Official Anthropic marketplace** — `claude-plugins-official`, automatically available on startup. Repository layout distinguishes `plugins/` (Anthropic-developed) from `external_plugins/` (third-party, reviewed). Contains ~28 plugins spanning LSP (clangd, gopls, jdtls, kotlin, lua, php, pyright, rust-analyzer, sourcekit, typescript), external integrations (github, gitlab, atlassian, asana, linear, notion, figma, vercel, firebase, supabase, slack, sentry), development workflows (commit-commands, pr-review-toolkit, agent-sdk-dev, plugin-dev), and output styles. Source: community Reddit thread cross-validated with the public repo.
- **Demo marketplace** — `anthropics/claude-code` (must be added manually with `/plugin marketplace add anthropics/claude-code`). Example plugins illustrating capabilities.
- **Community marketplaces** — e.g. `obra/superpowers-marketplace`, `buildwithclaude.com`, `claudemarketplaces.com`, `claudepluginhub.com`. Low curation, high volume.
- **Managed / seeded marketplaces** — enterprises pre-seed container images via `CLAUDE_CODE_PLUGIN_SEED_DIR`; `extraKnownMarketplaces` in `.claude/settings.json` auto-registers marketplaces when a team member trusts the repo; `strictKnownMarketplaces` in managed settings restricts which marketplaces can be added (supports `hostPattern` and `pathPattern` regex for GitHub Enterprise / internal hosts).

**Release channels** are implementable via two marketplaces pointing to different refs of the same repo (e.g. `stable-tools` → `ref: stable`, `latest-tools` → `ref: latest`), then assigned to different user groups through managed settings. Critical constraint: the plugin's `plugin.json` must declare a **different version** at each pinned ref or commit, otherwise Claude Code treats them as identical and skips the update.

**Versioning**: SemVer. When both `plugin.json` and the marketplace entry declare a version, `plugin.json` wins silently — the recommendation is to set it in one place only (marketplace entry for relative-path plugins, `plugin.json` for all other source types).

_Sources:_
- [Plugin marketplaces — sources / hosting / restrictions](https://code.claude.com/docs/en/plugin-marketplaces) — accessed 2026-04-17
- [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) — accessed 2026-04-17
- [Reddit: 28 official Claude Code plugins](https://www.reddit.com/r/ClaudeAI/comments/1r4tk3u/there_are_28_official_claude_code_plugins_most/) — accessed 2026-04-17

### Technology Adoption Trends

- **Manifest-first is converged.** Every surveyed plugin ships a `.claude-plugin/plugin.json`, even when only `name` is required. The community treats the optional manifest as de-facto mandatory.
- **SemVer versioning is universal.** `MAJOR.MINOR.PATCH` aligned with the Anthropic recommendation. Pre-release suffixes (`-beta.1`) are accepted and used by active projects.
- **Git-based distribution dominates.** Local paths are for development; npm is rare; the bulk of publicly shared plugins distribute via GitHub with `ref` pinning (tags) or `sha` pinning (immutable). `git-subdir` is emerging for monorepos.
- **Auto-update is on for official marketplaces, off by default for third-party.** Third-party marketplaces can opt in via the UI.
- **Scoped installation is maturing.** `project` scope (committed to `.claude/settings.json`) is the primary team-sharing mechanism; `local` scope is the personal-within-a-repo escape hatch.
- **Community templates converge on the Anthropic-documented layout.** `ivan-magda/claude-code-plugin-template` and `anthropics/claude-plugins-official` share the same top-level shape — our plugin should adopt it without deviation. A meaningful deviation would need explicit justification.
- **Legacy `commands/` directory is being phased out** in favor of `skills/` with `SKILL.md`. Documentation explicitly recommends `skills/` for new plugins; both still work.

_Source: cross-reference of [plugins](https://code.claude.com/docs/en/plugins), [plugins-reference](https://code.claude.com/docs/en/plugins-reference), [discover-plugins](https://code.claude.com/docs/en/discover-plugins), and public plugin repositories — accessed 2026-04-17._
