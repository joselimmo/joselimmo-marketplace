---
stepsCompleted: [1, 2, 3]
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
