---
stepsCompleted: [1, 2, 3, 4]
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

---

## Integration Patterns Analysis

> **Domain-adapted interpretation**: for a Claude Code plugin, "integration patterns" covers (1) the discovery/install protocol between user, marketplace, and host, (2) the loading/registration contract between plugin and Claude Code, (3) the invocation protocols exposing plugin functionality to Claude, (4) inter-plugin interoperability (dependencies, namespacing, strict mode), (5) the trust/permission boundary, and (6) the event/hook protocol. Standard protocols (REST, GraphQL, Kafka, AMQP) do not apply at this layer.

### Discovery & Installation Protocol

The host-marketplace-plugin protocol is built on three primitives: **marketplace registration**, **plugin resolution**, and **local caching**.

**Registration flow** (marketplace → host):

1. User runs `/plugin marketplace add <source>`, where `<source>` resolves to one of: GitHub `owner/repo`, git URL, local path, or a remote URL to a `marketplace.json`.
2. Claude Code clones (for git-based) or downloads (for URL-based) the catalog into `~/.claude/plugins/marketplaces/<name>/`.
3. The marketplace name becomes the user-facing identifier (`@<marketplace>`), subject to the reserved-names list.
4. Entry is persisted in `~/.claude/plugins/known_marketplaces.json` (user-scoped).

**Installation flow** (marketplace entry → plugin cache):

1. `/plugin install <name>@<marketplace>` looks up the entry in the registered marketplace.
2. The `source` field dispatches the fetcher (path / github / url / git-subdir / npm).
3. The plugin files are **copied** (not symlinked, not used in-place) to `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`. A separate directory per version. Orphans garbage-collected after 7 days.
4. The plugin's entry is added to the scope's settings file (`enabledPlugins` in `~/.claude/settings.json` for `user` scope, `.claude/settings.json` for `project`, `.claude/settings.local.json` for `local`).
5. If the plugin declares `dependencies`, they are auto-installed and listed at the end of the install output (requires Claude Code ≥ v2.1.110).

**Update flow**:

- Auto-update runs at session start for marketplaces with auto-update enabled (on by default for official marketplaces, off for third-party/local dev).
- Private marketplaces require `GITHUB_TOKEN` / `GITLAB_TOKEN` / `BITBUCKET_TOKEN` in the environment for background auto-update (interactive flows use existing `git` credential helpers / SSH agent).
- `/reload-plugins` is the equivalent of "hot reload" — picks up plugin file changes without restart, including skills, agents, hooks, plugin MCP servers, plugin LSP servers.

_Confidence: high — all flows explicitly documented._

_Source: [Discover and install plugins](https://code.claude.com/docs/en/discover-plugins), [Plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces) — accessed 2026-04-17._

### Host Loading & Component Registration

When a plugin is enabled, Claude Code registers its components in the active session on a deterministic order:

1. **Parse `plugin.json`** (if present). Extract metadata + path overrides. If the manifest is absent, fall back to default locations and derive the plugin name from the directory.
2. **Discover components** at each default (or overridden) location: `skills/`, `commands/`, `agents/`, `hooks/hooks.json`, `.mcp.json`, `.lsp.json`, `monitors/monitors.json`, `bin/`, `settings.json`, `output-styles/`.
3. **Validate frontmatter** of every component file. Invalid YAML frontmatter on a skill/agent/command loads the file with no metadata (degraded) and surfaces a warning. A malformed `hooks/hooks.json` prevents the **entire plugin** from loading (hard failure).
4. **Register components** with host namespacing:
   - Skills and commands → `/<plugin-name>:<skill-name>` (namespace prevents collisions across plugins).
   - Agents → appear in `/agents` interface and are invokable by Claude based on `description`.
   - Hooks → registered against their declared lifecycle events.
   - MCP servers → spawned as subprocesses with `${CLAUDE_PLUGIN_ROOT}` substitution.
   - Monitors → spawned at session start (or on-skill-invoke, per `when` field).
   - `bin/` entries → added to the Bash tool `PATH` for the session.
5. **Apply `settings.json`** from the plugin root. Only `agent` and `subagentStatusLine` are currently honored; unknown keys silently ignored. `settings.json` takes priority over inline `settings` in `plugin.json`.

**Scope precedence & conflicts**:

- Same-name skills across levels: **enterprise > personal > project** (plugins use namespacing, so no conflict with those levels).
- Same-name plugin in `--plugin-dir` and an installed marketplace: the `--plugin-dir` copy wins (dev-override pattern). Exception: marketplace plugins force-enabled by managed settings.
- `strict: false` in marketplace entry: the marketplace entry defines all components; a `plugin.json` that also declares components produces a conflict error — plugin fails to load.

**Observability**:

- `claude --debug` exposes per-plugin loading trace: which components registered, parse errors, MCP initialization.
- `/plugin` → **Errors** tab surfaces parse/load errors for each installed plugin.
- `/doctor` surfaces dependency errors (`range-conflict`, `dependency-version-unsatisfied`, `no-matching-tag`) alongside other health checks.

_Confidence: high._

_Source: [Plugins reference — debugging section](https://code.claude.com/docs/en/plugins-reference), [Skills](https://code.claude.com/docs/en/skills) — accessed 2026-04-17._

### Invocation Protocols (Host ↔ Plugin Components)

Claude Code exposes plugin functionality through **three invocation protocols**. Each has a different trust and activation model.

**Protocol 1 — Explicit slash invocation (user-triggered).** The user types `/<plugin-name>:<skill-name> [args]`. This is the primary protocol for skills with side effects. The skill's `SKILL.md` content is rendered (with `$ARGUMENTS`, `$0..$N`, `${CLAUDE_SESSION_ID}`, `${CLAUDE_SKILL_DIR}` substitutions) and enters the conversation as a single message. Claude Code does **not** re-read the skill file on later turns — write guidance as standing instructions, not one-time steps.

**Protocol 2 — Model-driven invocation (auto-activation).** Claude selects a skill/agent based on the `description` frontmatter field. Discoverability rules:

- Skill descriptions are loaded into context at session start so Claude knows what's available. Full skill content loads only on invocation.
- Each entry's combined `description + when_to_use` is truncated at **1,536 characters** in the listing. Front-load the key use case.
- Total skill-listing budget scales at **1% of context window**, fallback 8,000 chars, overridable via `SLASH_COMMAND_TOOL_CHAR_BUDGET`.
- Setting `disable-model-invocation: true` removes the skill from Claude's context entirely (only user-invocable).
- Setting `user-invocable: false` keeps the description in context but hides the skill from the `/` menu (only Claude-invocable).

**Protocol 3 — Preprocessed shell injection.** The `` !`command` `` inline syntax (and the ` ```! ` fenced block form) runs shell commands **before** the skill content is sent to Claude. Command output replaces the placeholder — Claude sees actual data, not the command. Disable org-wide with `disableSkillShellExecution: true` in managed settings.

**Argument passing**:

- `$ARGUMENTS` → full argument string as typed.
- `$ARGUMENTS[N]` / `$N` → shell-style quoted positional args (`"hello world"` is one arg).
- If the skill doesn't include `$ARGUMENTS` and the user passed arguments, they're appended as `ARGUMENTS: <value>`.

**Skill content lifecycle**:

- Invoked skill content stays in the conversation for the rest of the session (not re-read).
- Auto-compaction carries invoked skills forward with a budget: **first 5,000 tokens of each most-recent invocation**, combined budget **25,000 tokens**, filled from most recent back. Older invocations may be dropped.

**Invocation pathways for our plugin**:

- Workflow commands (`/backlog`, `/discover`, `/plan-story`, `/implement`, `/reflect`) → Protocol 1, with `disable-model-invocation: true` to prevent Claude from self-triggering workflow stages.
- State/advisor skill (`state-manager`) → candidate for Protocol 2 (auto-activation when user asks "what's next") and/or Protocol 3 (preprocessing to read `ACTIVE.md` + `INDEX.md`).
- Background-loading context (glossaries, overviews) → `user-invocable: false` and/or loaded as conversation context, not commands.

_Confidence: high — all semantics explicitly documented._

_Source: [Skills — invocation sections](https://code.claude.com/docs/en/skills) — accessed 2026-04-17._

### Inter-Plugin Interoperability

Three mechanisms govern how plugins interact with each other and with host-level configuration.

**Mechanism 1 — Dependencies field (plugin ↔ plugin).** A plugin declares `dependencies: [...]` in `plugin.json`. Each entry is a bare string (tracks latest of the named plugin) or an object `{ name, version?, marketplace? }`.

- `version` accepts any Node `semver` range: `~2.1.0`, `^2.0`, `>=1.4`, `=2.1.0`. Pre-releases excluded unless range opts in (`^2.0.0-0`).
- Resolution: against **git tags** on the marketplace repository, using the `{plugin-name}--v{version}` naming convention. Marketplace maintainers must tag releases with this convention for resolution to work.
- Cross-marketplace deps: require the target marketplace be allowlisted in the root marketplace's `marketplace.json` — **blocked by default**.
- Auto-install: Claude Code resolves + installs declared deps on install, listing added deps at the end.
- Multi-plugin range intersection: constraints from all installed plugins are intersected; highest satisfying version wins. Auto-update respects the intersection. `range-conflict` error if empty intersection.
- Errors: `range-conflict`, `dependency-version-unsatisfied`, `no-matching-tag` — surfaced in `/plugin` UI, `claude plugin list --json` (via `errors` field), and `/doctor`.
- Requires Claude Code ≥ **v2.1.110**.
- For `npm` sources: tag-based resolution does not apply; constraint checked at load time only.

**Mechanism 2 — Strict mode (plugin ↔ marketplace entry).** The marketplace entry's `strict` boolean controls authority:

- `strict: true` (default) — `plugin.json` is the authority. Marketplace entry can supplement with extra components.
- `strict: false` — marketplace entry is the whole definition. If the plugin repo ships a `plugin.json` declaring components, that's a conflict — plugin fails to load. Useful when a marketplace operator wants to curate a plugin differently than its author intended.

**Mechanism 3 — Namespacing (plugin ↔ host).** Every plugin component is namespaced by `<plugin-name>:<component-name>` for user-visible invocations. Plugin skills cannot collide with enterprise/personal/project skills because those levels use non-namespaced names. **Reserved marketplace names** (e.g. `claude-plugins-official`, `anthropic-marketplace`) are blocked at marketplace-creation time.

**Important constraint observed**: plugin-shipped agents **cannot** declare `hooks`, `mcpServers`, or `permissionMode` in their frontmatter (security restriction). Non-plugin agents (`.claude/agents/*`) can.

_Confidence: high. Known gap: there is no `engines` field in `plugin.json` to pin Claude Code minimum version — requested as a feature in [issue #17272](https://github.com/anthropics/claude-code/issues/17272); missing as of Apr 2026. Plugins must document their minimum Claude Code version in their README._

_Sources:_
- [Constrain plugin dependency versions](https://code.claude.com/docs/en/plugin-dependencies) — accessed 2026-04-17
- [Plugin marketplaces — strict mode section](https://code.claude.com/docs/en/plugin-marketplaces) — accessed 2026-04-17
- [GitHub issue #17272: `engines` field request](https://github.com/anthropics/claude-code/issues/17272) — open, Apr 2026

### Permission & Trust Boundaries

Plugins run at full user trust by default — they can execute arbitrary code via hooks, bin executables, MCP server subprocesses, and monitors. The Claude Code permission model is layered on top of that trust and governs **tool-call approval**, not code execution.

**Three-tier permission system** (evaluated in order — **deny > ask > allow**, first match wins):

- **Allow**: tool runs without prompt.
- **Ask**: prompt shown before each use.
- **Deny**: tool call blocked.

**Scopes of permission rules** (most → least restrictive):

1. Managed (org policy, OS-specific managed settings file) — highest priority.
2. User (`~/.claude/settings.json`).
3. Project (`.claude/settings.json`).
4. Local (`.claude/settings.local.json`).
5. Plugin-declared (`allowed-tools` in a skill frontmatter, plugin `settings.json`).

**Critical invariant**: permissions that are restricted in an outer scope **cannot be loosened in an inner scope** (`deny` cannot become `ask`/`allow`; `ask` cannot become `allow`). This protects against malicious plugins trying to escalate.

**Plugin-scoped permissions**:

- A skill can declare `allowed-tools: Bash(git add *) Bash(git commit *)` to pre-approve specific tools **only while the skill is active**. Anything not listed still goes through the session's normal permission rules.
- To build a locked-down agent, pair `allowedTools` with `permissionMode: dontAsk` — listed tools approved, everything else denied outright. **This combination is NOT available to plugin-shipped agents** — `permissionMode` is among the forbidden frontmatter fields for plugin agents.
- Plugin `settings.json` can ship default permission rules, but they are subject to the outer-scope-wins invariant.

**Skill access control** (Claude-invocation only):

- Deny all skills: add `Skill` to the deny rule list.
- Permit/deny specific skills: `Skill(name)` for exact, `Skill(name *)` for prefix+any-args.
- `disable-model-invocation: true` also blocks Skill-tool programmatic invocation (stronger than `user-invocable: false`, which only hides from menu).

**Sandboxing (complementary to permissions)**:

- OS-level Bash sandboxing is enabled per-environment (macOS Seatbelt, Linux namespaces) and restricts filesystem + network for the Bash tool and child processes. Does not apply to MCP servers or hook commands.
- Hooks run **unsandboxed** at hook trust level, same as monitors.
- Supply-chain risk: plugins can ship bin/ executables added to PATH, MCP servers as subprocesses, hook scripts, and monitor scripts. A Snyk audit cited in the prior domain research reported **36%** of audited published skills contained prompt-injection vectors. The documentation explicitly warns: *"Plugins and marketplaces are highly trusted components that can execute arbitrary code on your machine with your user privileges. Only install plugins and add marketplaces from sources you trust."*

**Managed marketplace lockdown** (`strictKnownMarketplaces` in managed settings):

- Empty array `[]`: users cannot add any marketplace.
- Allowlist of sources: exact match on each field (`repo`, `ref`, `url`, etc.).
- `hostPattern` / `pathPattern` regex: allow entire host (GitHub Enterprise) or filesystem path (`^/opt/approved/`).
- Paired with `extraKnownMarketplaces` in managed settings, admins can pre-register allowed marketplaces so users don't need to add them.

_Confidence: high. Weak signal: there is no documented cryptographic signing or verification of plugins or marketplaces as of Apr 2026. Security rests on host-platform blessing (official marketplace), source trust, and managed-settings allowlists. See also prior research for community fatigue around this gap._

_Sources:_
- [Configure permissions](https://code.claude.com/docs/en/permissions) — accessed 2026-04-17
- [Skills — pre-approve tools / restrict access](https://code.claude.com/docs/en/skills) — accessed 2026-04-17
- [GitHub issue #10093: tool permissions in agents/plugins](https://github.com/anthropics/claude-code/issues/10093) — open, Apr 2026
- Prior domain research (`domain-agentic-workflows-ecosystem-research-2026-04-17.md`) — Snyk 36% prompt-injection finding

### Event & Hook Integration Pattern

Hooks are the event-driven integration surface. A full inventory of the ~27 lifecycle events and detailed execution semantics is deferred to **Research #5 (SessionStart Hook & Hook Lifecycle)**. This section documents only the plugin-relevant integration pattern.

**Declaration surfaces** (priority order):

1. `hooks/hooks.json` at plugin root — preferred for multi-hook plugins.
2. Inline `hooks` key in `plugin.json` — acceptable for simple cases.
3. Additional hook files via manifest `"hooks": ["./a.json", "./b.json"]` — multi-file composition.

**Event → handler binding**:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{ "type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/scripts/format.sh" }]
      }
    ]
  }
}
```

**Four handler types**:

- `command` — shell execution. Hook input arrives on stdin as JSON; parse with `jq -r '.tool_input.file_path'`.
- `http` — POST the event JSON to a URL. Zero shell dependency, good for observability.
- `prompt` — evaluate a prompt with an LLM. `$ARGUMENTS` placeholder for context.
- `agent` — run an agentic verifier for complex validation.

**Integration points for the plugin's needs**:

- `SessionStart` → lean-boot content (Research #5, hard target ≤ 500 tokens).
- `PostToolUse(Write|Edit)` → opportunistic context capture (v2 post-edit reflection channel per brainstorming).
- `InstructionsLoaded` → detect when a CLAUDE.md or `.claude/rules/*.md` is loaded, useful for scope-aware behavior.
- `PreCompact` / `PostCompact` → protect architectural decisions through compaction (aligns with host native compaction documented in prior domain research).
- `Stop` / `SessionEnd` → flush `ACTIVE.md` state, update `INDEX.md`.

**Critical constraint**: malformed `hooks/hooks.json` blocks the entire plugin from loading (hard failure). CI should run `claude plugin validate` on every commit that touches hooks.

_Source: [Plugins reference — Hooks section](https://code.claude.com/docs/en/plugins-reference) — accessed 2026-04-17. Full lifecycle analysis deferred to Research #5._

### Integration Security Patterns (plugin-specific)

- **Supply-chain trust** — no cryptographic signing exists. Trust rests on: (a) host marketplace blessing (Anthropic-verified badge), (b) repo provenance (public GitHub, known author), (c) code review before install. Advise users to prefer `sha`-pinned plugin sources over `ref`-pinned, for tamper-evidence.
- **Path-traversal containment** — plugins cannot reference `../` outside their own directory post-install (files aren't copied). Symlinks are preserved through the cache if absolute paths are needed.
- **Private-repo auth** — HTTPS via `gh auth login` / macOS Keychain / `git-credential-store` works for interactive flows. Background auto-update requires `GITHUB_TOKEN` / `GL_TOKEN` / `BITBUCKET_TOKEN` environment variables.
- **Managed lockdown** — `strictKnownMarketplaces: []` disables user-added marketplaces entirely; allowlist with `hostPattern`/`pathPattern` regex covers internal hosts.
- **Plugin-data isolation** — `${CLAUDE_PLUGIN_DATA}` is keyed on `<plugin-id>` (sanitized), each plugin has a dedicated directory. No shared-data mechanism between plugins by design.
- **User-config sensitive values** — stored in system keychain (or `~/.claude/.credentials.json` fallback), ~2 KB total shared with OAuth tokens. Non-sensitive values in `settings.json` under `pluginConfigs[<id>].options`.
- **MCP server permissions** — `.mcp.json` or inline; servers start as subprocesses, all tools they expose must still pass the session's permission evaluation. MCP tools appear under the MCP tool namespace — deny/allow rules can target them specifically.

_Source: [Plugins reference — caching / auth / env var sections](https://code.claude.com/docs/en/plugins-reference), [Plugin marketplaces — private repos section](https://code.claude.com/docs/en/plugin-marketplaces) — accessed 2026-04-17._

---

## Architectural Patterns and Design

> **Domain-adapted interpretation**: this section examines the architectural patterns that a Claude Code plugin targeting an anti-BMAD, token-efficient workflow must adopt or reject. It synthesizes findings from the Claude Code host docs, cross-framework observations from the domain research, named industry patterns (Progressive Disclosure, Unix Pipeline, Porcelain/Plumbing), and the 9 architectural principles from the brainstorming. Validation against three questions: (a) does the host substrate support it? (b) is it converging across competing frameworks? (c) does it solve an observed failure mode in this ecosystem?

### System Architecture Patterns

**Pattern 1 — Unix Pipeline Philosophy** (brainstorming principle #1 — confirmed).

Transformations are small, typed, pure, composable. Each plugin command produces and consumes typed artifacts (markdown files with YAML frontmatter). No command is aware of the next; composition emerges from artifact chaining.

- _Host fit_: Claude Code components are already file-first. Skills are markdown; artifacts are markdown; hooks are JSON. No orthogonal state store.
- _Industry convergence_: observed in AGENTS.md, AIDD, and in Spec-kit's Spec → Plan → Tasks → Implement chain. Not observed in BMAD's agent-dialogue model (which is the anti-pattern being rejected).
- _Risk_: the "Unix test" — a third-party skill producing or consuming the same typed artifact — is a gate this plugin must pass, per the domain research recommendation.

**Pattern 2 — Porcelain vs Plumbing** (brainstorming principle #3 — confirmed).

Two-layer split inspired by Git: **porcelain** = user-facing slash commands; **plumbing** = composable skills that porcelain commands invoke.

- _Host fit_: Claude Code supports both. `commands/` and `skills/` are structurally equivalent (both expose `/name` invocations), but a plugin can enforce the split by convention: porcelain `skills/` carry full workflow context; plumbing `skills/` expose focused primitives.
- _Anti-pattern warning_: industry sources explicitly flag "a long list of complex custom slash commands" as an anti-pattern (context-engineering community consensus). Our brainstorming plans **8 porcelain commands + 6 plumbing skills**. This is at the boundary. Mitigation: 80% of invocations should flow through `/backlog` (primary UX surface), with `state-manager` recommending the next command. The user rarely memorizes the 8 commands — they react to the advisor.
- _Industry convergence_: Superpowers' 5-phase discipline (clarify → design → plan → code → verify) is porcelain-only; wshobson/agents exposes porcelain over a plumbing catalog of ~55 agents; Agent OS uses `/plan-product → /shape-spec → /write-spec → /create-tasks → /implement-tasks`. The pattern is converging.

**Pattern 3 — Precondition-Driven Orchestration** (brainstorming principle #4 — confirmed).

No hard-coded command sequence. Each porcelain command declares `requires: [...]`, `produces: type`, `memory_scope: [...]` in frontmatter. A state-manager introspects current artifacts and emits the list of runnable commands.

- _Host fit_: the `description` field of a skill already carries this role for Claude. Extending with explicit `requires`/`produces`/`memory_scope` fields is a non-official convention — documented in the spec, not required by the host.
- _Industry convergence_: **not yet converged**. This is a differentiator. Most frameworks either enforce a rigid sequence (BMAD) or a loose catalog (Anthropic Skills). Precondition declarations sit in the gap.

**Pattern 4 — Ambient Capture, No Dedicated Docs Phase** (brainstorming principle #7 — confirmed).

Memory capture is a byproduct of `/reflect`, not a separate step. Three channels: deferred byproduct, explicit `/remember`, and v2+ post-edit reflection.

- _Host fit_: Claude Code's `PostToolUse(Write|Edit)` hook is the natural trigger point for the v2+ channel. `Stop` / `SessionEnd` hooks for flushing state.
- _Industry convergence_: no competing framework has explicitly formalized this, but the direction-of-travel validates it (no framework in the domain research ships a separate "docs update" command).

_Sources:_
- [Progressive disclosure as system design pattern (SwirlAI)](https://www.newsletter.swirlai.com/p/agent-skills-progressive-disclosure) — accessed 2026-04-17
- [Progressive disclosure in AI agents (MindStudio)](https://www.mindstudio.ai/blog/progressive-disclosure-ai-agents-context-management) — accessed 2026-04-17
- [Claude Code Best Practices — anti-pattern warning on slash commands](https://rosmur.github.io/claudecode-best-practices/) — accessed 2026-04-17
- Brainstorming document, principles #1, #3, #4, #7 — `_bmad-output/brainstorming/brainstorming-session-2026-04-17-1545.md`

### Design Principles and Best Practices

**Principle 1 — Progressive Disclosure** (formally named industry pattern, validates brainstorming principle #6).

Originally a UX pattern (show only what is needed at the current step), now a formalized AI-agent architecture pattern with a documented three-layer structure:

- **Layer 1 — Index**: lightweight metadata (title, description, token count, capabilities). Always loaded.
- **Layer 2 — Details**: full content, loaded on relevance.
- **Layer 3 — Deep dive**: reference docs, examples, scripts. Loaded on explicit need.

Claude Code's native skill model already implements this: descriptions in context, full `SKILL.md` loaded on invocation, supporting files (`reference.md`, scripts/) loaded only when referenced. Our plugin must preserve this at the memory layer — a skill that loads `memory/project/glossary.md` on every call defeats the pattern.

**Operational rule**: each skill's `memory_scope` frontmatter declares which memory files it loads. Scopes are fixed-enum (MVP): `glossary`, `overviews`, `adr-summaries`, `adrs-by-tag`, `conventions`, `learnings-by-tag`. Progressive disclosure is enforced at the scope layer, not inside skill content.

**Principle 2 — Single Responsibility per Skill**.

Plumbing skills do one thing. `state-manager` reads state + recommends + refreshes INDEX. `load-memory-scope` reads files matching scopes/tags. `validate-artifact-frontmatter` validates. `extract-diff-patterns` mines learnings. No skill accumulates concerns.

**Principle 3 — Artifact-as-Contract** (brainstorming principle #2).

Skills are pure functions over typed files. Input type → output type. No side effects beyond the declared output artifact. A skill that reads `epic.md` and writes `plan.md` must not silently update `INDEX.md` — that's the `state-manager`'s job.

**Principle 4 — Write Guidance, Not Scripts** (derived from Claude Code skill lifecycle).

Invoked skill content enters the conversation once and stays — Claude Code does **not** re-read the skill file on later turns. Write `SKILL.md` as standing instructions ("When reviewing code, check for..."), not as step-by-step scripts that assume per-turn re-execution.

**Principle 5 — Description-Front-Loaded** (derived from host truncation rules).

Skill descriptions are truncated at **1,536 characters** in the listing (and the total listing budget scales at 1% of context window, fallback 8,000 chars). Front-load the key use case in the first sentence. Rear-loaded descriptions get silently truncated and skills fail to auto-activate.

**Principle 6 — Anti-Pattern Catalog** (from brainstorming + industry sources, cross-validated).

Explicit rejection list:

- ❌ BMAD-style persona dialogue between agents — high token cost, validated as declining (community criticism + BMAD v6 response).
- ❌ Monolithic session-scoped planning — fidelity loss across stages (Spec-kit community note, validates brainstorming principle #9 on story-scoped budget).
- ❌ External vector DB for agent memory — AutoGPT reversal (rare clear "this was wrong" signal in the domain).
- ❌ Long list of complex slash commands as primary UX — context-engineering community consensus. Mitigation: `/backlog` as the single primary entry point; the 8 porcelain commands are reactive surfaces.
- ❌ Monolithic MCP installation (>20k tokens of MCP tool listings) — "cripples Claude" per industry sources. For our plugin, MCP servers are **opt-in per project** via `.workflow.yaml`, not bundled.
- ❌ Draft+consolidation ritual (killed on YAGNI in brainstorming Phase 3). Quality filter at write time instead.

_Sources:_
- [Skill authoring best practices (Anthropic)](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) — accessed 2026-04-17
- [Progressive Disclosure Matters (aipositive)](https://aipositive.substack.com/p/progressive-disclosure-matters) — accessed 2026-04-17
- Prior domain research — for BMAD / AutoGPT / Spec-kit anti-pattern citations

### Scalability and Performance Patterns (Context Engineering)

For a workflow plugin, "scalability" is measured in **tokens per story cycle**, not in requests per second. The brainstorming set targets: `SessionStart ≤ 500` (hard), first command call `1.5–3k` (soft), full story cycle `15–25k` (indicative — overflow = decomposition failure). The following patterns protect that budget.

**Pattern 1 — Index-First, Content-Lazy** (brainstorming principle #5/#6 × Progressive Disclosure).

Always-loaded: `INDEX.md` of `memory/project/` + `ACTIVE.md` pointer. On-demand: full content by scope. `state-manager` refreshes `INDEX.md` on every pass (read-your-writes invariant — prevents stale pointers).

**Pattern 2 — Selective Memory Loading by Workflow Phase** (brainstorming principle #6 — **rare, underdeployed differentiator**).

Per-command `memory_scope` declaration. `/discover` loads glossary + overviews + ADR summaries + product details. `/plan-story` loads tech details + ADRs by tag. `/implement` loads patterns + learnings by domain. Never load "everything that might be relevant" — that is the context-rot failure mode named in progressive-disclosure literature.

**Pattern 3 — Story-Scoped Context Budget** (brainstorming principle #9).

The budget is evaluated per story cycle (plan → implement → reflect), not per session. If a single need overflows, `/discover` must decompose until each story fits ~15–25k. Industry echo: "token efficiency is not a feature — it is the acceptance test" (prior domain research synthesis).

**Pattern 4 — Compaction-Aware Skill Design** (derived from Claude Code compaction rules).

Auto-compaction carries invoked skills forward with a 25k-token total budget, filled from most recent back. After a long session, earlier skills may be dropped. Implications:

- Put the most important instructions **at the top** of `SKILL.md` (first 5k tokens survive compaction).
- Hook `PreCompact` / `PostCompact` to preserve architectural decisions (`ACTIVE.md` contents should survive).
- `state-manager` can re-attach itself after compaction if critical — a skill that needs to stay resident must be re-invoked.

**Pattern 5 — Epic-Level Isolation** (brainstorming principle #8).

No cross-epic dependencies by design. Multi-epic parallel workspaces under `memory/backlog/epic-XXX/` with `/switch-epic` for clean context switch. Avoids the failure mode of an in-flight epic contaminating another's reasoning context.

**Pattern 6 — MCP Budget Ceiling** (derived from industry cap).

If MCP servers are bundled, their combined tool listings must stay well below the documented "20k tokens cripples Claude" threshold. Our plugin ships zero MCP servers in v1; optional `.workflow.yaml` entries let consumers opt in per project.

**Pattern 7 — Subagent for Context Isolation, Never for Personas** (brainstorming Lens 1 / Lens 6).

Use `context: fork` on skills when a task needs isolation (codebase exploration, research, adversarial review). The subagent inherits from a chosen agent type (`Explore`, `Plan`, `general-purpose`), not from a "persona." Benefits: fork context is separate from the main conversation — heavy exploration does not pollute the 25k budget of the parent.

_Sources:_
- [Progressive Disclosure in AI Agents (Medium/Fernández)](https://medium.com/@martia_es/progressive-disclosure-the-technique-that-helps-control-context-and-tokens-in-ai-agents-8d6108b09289) — accessed 2026-04-17
- [Skill content lifecycle / compaction](https://code.claude.com/docs/en/skills) — accessed 2026-04-17
- Brainstorming principles #5–#9

### Composition and Orchestration Patterns

Industry sources catalogue **five agentic workflow patterns** observed in the Claude Code ecosystem (MindStudio / Anthropic nomenclature):

| Pattern           | Description                                                               | Fit for our plugin                                                                  |
| :---------------- | :------------------------------------------------------------------------ | :---------------------------------------------------------------------------------- |
| Sequential        | Fixed-order pipeline (A → B → C).                                         | ❌ Rejected. Our plugin uses precondition-driven, not sequential.                   |
| Operator          | One orchestrator + multiple tool calls.                                   | ✅ Partial fit for `state-manager` (recommends, does not execute).                  |
| Split-and-merge   | Fan-out parallel subtasks, merge results.                                 | ⚠️ Useful inside a story (`explore-codebase` + `research-web` in parallel). Not at the workflow level.  |
| Agent teams       | Personas debating each other.                                             | ❌ Rejected (BMAD anti-pattern; token-inefficient).                                 |
| Headless          | Fully autonomous, no human gates.                                         | ❌ Rejected at workflow level; the `/reflect` review loop requires user approval.   |

**Our composition model** — explicit naming: **Advisor + Reactive Porcelain**.

- `state-manager` (skill, plumbing) is the **advisor** — it reads state, proposes the next command, never executes.
- Porcelain commands are **reactive** — each declares preconditions and is invokable only when its inputs exist.
- The user's primary interaction is `/backlog` → see advisor's recommendation → run the suggested command.
- No automatic chaining. No hidden orchestration. The user remains the conductor; the plugin provides the score.

**Advantages**:

- Token-transparent: the user sees exactly what is invoked and why.
- Composable with third parties: a native Anthropic Skill or hand-written skill that produces a typed artifact fits the precondition model without modification.
- Failure-observable: a precondition miss is visible before any token is spent on a doomed command.

**Constraints**:

- Requires discipline in artifact frontmatter — every typed file must declare its `type` for precondition matching to work.
- Not suited for long-running autonomous tasks; that is not this plugin's positioning.

**Reuse of host-native subagents**:

- Prefer native `Explore` subagent for codebase scans over a custom `explore-codebase` skill, where feasible. Reduces maintenance surface and demonstrates plugin-composes-with-host rather than plugin-replaces-host.
- Decision deferred to Research #3 (Subagents as Context-Isolation Primitives).

_Sources:_
- [5 Claude Code Workflow Patterns (MindStudio)](https://www.mindstudio.ai/blog/claude-code-5-workflow-patterns-explained) — accessed 2026-04-17
- [wshobson/agents — agent catalog reference](https://github.com/wshobson/agents) — accessed 2026-04-17

### Security Architecture Patterns

**Pattern 1 — Trust Boundary at Plugin Install**.

A plugin is trusted with full user privileges once installed. The security budget is spent at install time (source review, provenance, signing when available). Runtime permissions govern **tool approval**, not code execution — a malicious plugin can already execute arbitrary code.

**Pattern 2 — Minimum Viable Permission Declaration**.

For each skill, declare `allowed-tools` as narrowly as possible. A commit skill needs `Bash(git add *) Bash(git commit *) Bash(git status *)`, not `Bash`. Narrow permissions reduce blast radius and surface intent.

**Pattern 3 — Hook-Based Validation at Artifact Boundaries**.

`PreToolUse` hooks can block a tool call outright or force a prompt. For our plugin: validate that artifact writes honor the frontmatter schema before the `Write` tool persists them. `validate-artifact-frontmatter` is the enforcement point, called both by the `/reflect` memory-capture flow and by a `PreToolUse(Write)` hook matched against `memory/**/*.md`.

**Pattern 4 — Fail-Closed on Hook Parse Errors**.

A malformed `hooks/hooks.json` blocks the entire plugin from loading. Our CI must run `claude plugin validate` on every commit that touches hooks. A failing validate in CI is a hard fail, not a warning.

**Pattern 5 — Zero Bundled Secrets**.

The `userConfig` block prompts the user for secrets at enable time and stores sensitive values in the system keychain (~2 KB limit, shared with OAuth tokens). No secret lives in the plugin repo or in the cache directory. `sensitive: true` per secret key.

**Pattern 6 — No Cross-Plugin Data Sharing**.

Each plugin has its own `${CLAUDE_PLUGIN_DATA}` directory. Do not rely on shared-state patterns between plugins. If plugins must coordinate, they do so via typed artifacts in `memory/`, which are user-owned, not plugin-owned.

_Source: [Configure permissions](https://code.claude.com/docs/en/permissions), [Plugins reference — userConfig / env vars](https://code.claude.com/docs/en/plugins-reference) — accessed 2026-04-17._

### Data (Memory) Architecture Patterns

**Pattern 1 — Two-Tier Memory Split** (brainstorming principle #5).

- `memory/project/` — **curated, permanent**. Glossary, overviews, ADRs, conventions, learnings. Consumer-repo-owned; committed to version control.
- `memory/backlog/` — **ephemeral workflow artifacts**. `ACTIVE.md`, `BACKLOG.md`, per-epic folders. Committed or gitignored depending on team preference.

Naming `memory/` (not `aidd_docs/` or `.claude/memory/`) makes the structure discoverable without reading plugin docs. A third-party skill authoring the frontmatter schema can write to `memory/project/` without importing this plugin.

**Pattern 2 — Frontmatter-Typed Artifacts**.

Every `.md` file in `memory/` and `memory/backlog/` carries a YAML frontmatter block with at minimum:

```yaml
---
type: adr | convention | learning | glossary | overview | epic | story | plan | review | rule
title: <human-readable>
tags: [<tag>, <tag>]
status: draft | active | superseded | archived
superseded_by: <file-id>  # if status=superseded
---
```

Type taxonomy is a fixed MVP enum. Unknown types fail validation. Extensions go through a versioning process (spec evolution) — not individual plugin decisions.

**Pattern 3 — Auto-Maintained `INDEX.md`**.

`memory/project/INDEX.md` is machine-generated — never hand-edited. `state-manager` rewrites it on every pass (read-your-writes). Contents: one line per entry (`<relative-path>` — `<title>` — `[<tags>]` — `<status>`). Enables fast Tier-1 loading (index) without opening each file.

**Pattern 4 — No-Archive Policy**.

Epics are either **finished** (their artifacts remain in `memory/backlog/epic-XXX/`) or **abandoned** (`/abandon-epic` deletes the folder). No `archived/` subtree. Finished epics contribute to `memory/project/learnings/*` via deferred capture, and their raw artifacts remain for reference but are not proactively indexed in `INDEX.md` once closed.

**Pattern 5 — Ambient Capture Channels**.

- **Deferred byproduct**: `/reflect` mines the review loop on `approved` and proposes capture candidates.
- **On-demand**: `/remember` accepts an inline observation and writes to the appropriate `memory/project/` target (type declared in the invocation).
- **Post-edit (v2+)**: `PostToolUse(Write|Edit)` hook flags candidate captures passively — reviewed during `/reflect`.

**Pattern 6 — Path-Based Domain Auto-Detection**.

`.workflow.yaml` declares a `domain-map` mapping path globs to domain tags (`src/auth/** → auth`, `src/payments/** → billing`). Skills that read `memory/project/learnings/*` filter by the domain tag of the current story's main edit paths. Avoids loading unrelated learnings.

**Pattern 7 — Separate Spec from Implementation** (from domain research, positioning refinement).

The memory convention and composition protocol are published as a **portable spec** (`spec/memory-convention.md`, `spec/skill-composition.md`) — a third party can implement them without importing our plugin. The plugin is the **reference implementation**. This separation is architectural, not cosmetic: `spec/` cannot reference `plugin/` internals.

_Sources:_
- Brainstorming principles #5, #6, #8, and domain research positioning refinement
- [Plugins — settings/hooks semantics](https://code.claude.com/docs/en/plugins) — accessed 2026-04-17

### Deployment and Operations Architecture

**Pattern 1 — Git-Tagged Releases as Primary Version Source**.

The plugin repo uses semver tags on `main`. The marketplace repo (same or different repo) references the plugin via a `ref:` matching those tags. For multi-plugin monorepos hosting our plugin alongside others, use the `{plugin-name}--v{version}` tag convention (required for plugin-dependency resolution).

**Pattern 2 — Release Channel Split via Marketplace Duplication**.

If release channels are needed, two separate marketplace catalogs (same repo, different `ref:`). `stable-<name>` points at `ref: stable`, `latest-<name>` at `ref: latest`. Users assigned to channels via `extraKnownMarketplaces` in managed settings. Critical constraint: different refs **must** declare different `version` in `plugin.json`; same-version refs are treated as identical and updates are skipped.

**Pattern 3 — Validation in CI**.

Every push must run `claude plugin validate .` as a hard gate. Catches: invalid JSON, missing required fields, malformed YAML frontmatter in skills/agents/commands, invalid `hooks/hooks.json`. A failure here blocks merge.

**Pattern 4 — Dogfood Against a Real Project**.

The brainstorming roadmap ends with Day 7 = full-cycle run on a real project with two parallel epics. This is the acceptance test, not a nice-to-have. Architectural decisions that fail dogfood get rolled back before v1.

**Pattern 5 — Spec-First Documentation**.

Day-1 ships a `spec/memory-convention.md v0.1` alongside the plugin skeleton. The spec is shorter than the code and published before or at the same time. Positioning per domain research: the spec is the primary distribution asset, the plugin is the proof-of-implementation.

**Pattern 6 — Minimal Marketplace Surface at Launch**.

Publish to `joselimmo-marketplace` only at v1. Submission to the official Anthropic marketplace (`claude-plugins-official`) is a v2 target — the marketplace accepts via [claude.ai/settings/plugins/submit](https://claude.ai/settings/plugins/submit) or [platform.claude.com/plugins/submit](https://platform.claude.com/plugins/submit), with basic automated review + optional "Anthropic Verified" badge for plugins that pass a quality/safety review. No public acceptance criteria — empirically, plugins that ship with tests, docs, security hygiene, and a clean README stand a better chance.

**Pattern 7 — Observable Failure Modes**.

Rely on `claude --debug`, `/plugin` Errors tab, and `/doctor` for field diagnostics. Ship a one-page troubleshooting section in the README that names the five most likely failure modes (invalid manifest, wrong directory structure, non-executable hook script, missing `${CLAUDE_PLUGIN_ROOT}`, absolute path). Every failure mode has a documented fix.

_Sources:_
- [Plugin marketplaces — version resolution / release channels](https://code.claude.com/docs/en/plugin-marketplaces) — accessed 2026-04-17
- [Plugins reference — debugging section](https://code.claude.com/docs/en/plugins-reference) — accessed 2026-04-17
- Brainstorming 7-day roadmap; domain-research positioning refinement
