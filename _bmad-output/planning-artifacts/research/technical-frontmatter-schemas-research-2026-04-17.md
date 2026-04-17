---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - _bmad-output/brainstorming/brainstorming-session-2026-04-17-1545.md
  - _bmad-output/planning-artifacts/research/domain-agentic-workflows-ecosystem-research-2026-04-17.md
  - _bmad-output/planning-artifacts/research/technical-plugin-architecture-distribution-research-2026-04-17.md
workflowType: 'research'
lastStep: 1
research_type: 'technical'
research_topic: 'Frontmatter Schemas and Validation Patterns for Typed Artifacts in Agentic Frameworks'
research_goals: 'Produce the factual basis required to finalize (1) the YAML frontmatter schema for every artifact type in the plugin (skills, agents, commands, memory items), (2) the fixed MVP type enum and its extensibility rules, (3) the validation mechanism (JSON Schema vs custom linter vs claude plugin validate), (4) the auto-activation semantics tied to the description field, and (5) the interop contract third-party skills must honor to participate in the Unix-pipeline composition.'
user_name: 'Cyril'
date: '2026-04-17'
web_research_enabled: true
source_verification: true
research_track: '2 of 5'
related_research:
  - 'Research #1 — Plugin Architecture & Distribution (completed 2026-04-17)'
  - 'Research #3 — Subagents as Context-Isolation Primitives (planned)'
  - 'Research #4 — MCP for Tool Integration (planned)'
  - 'Research #5 — SessionStart Hook & Hook Lifecycle (planned)'
scope_exclusions:
  - 'plugin.json / marketplace.json manifest schemas (covered in Research #1)'
  - 'Subagent output contracts (covered in Research #3)'
  - 'Hooks frontmatter fields (covered in Research #5)'
  - 'MCP server configuration (covered in Research #4)'
---

# Research Report: Frontmatter Schemas for Typed Artifacts

**Date:** 2026-04-17
**Author:** Cyril
**Research Type:** Technical (track 2 of 5)

---

## Research Overview

This is the second of five sequential technical research reports scoped jointly with the project owner on 2026-04-17. Track 1 (plugin architecture and distribution) established the host substrate; this track sharpens the **artifact-layer contract** — the YAML frontmatter schema every typed file must honor.

**This report (Track 2)** covers:

- State of the art on YAML frontmatter schemas across Claude Code (SKILL.md, agent files, command files), AGENTS.md, and adjacent frameworks (Superpowers, Spec-kit, Agent OS, AIDD).
- The full set of fields observed in the wild, with convergent vs divergent signals.
- The fixed MVP type enum for memory artifacts and its extensibility rules.
- Validation mechanisms — JSON Schema (ajv, VSCode integration), `claude plugin validate`, custom linters (`validate-artifact-frontmatter` skill) — with cost/benefit analysis.
- The `requires` / `produces` / `memory_scope` declaration pattern that powers the precondition-driven orchestration model.
- Auto-activation semantics: how the `description` field drives model-invocation, truncation rules, and the over-triggering vs under-triggering trade-off.
- The interop contract: minimum fields a third-party skill must honor to produce or consume our typed artifacts (Unix test).

Findings inform the Day-1 `validate-artifact-frontmatter` skill + the Day-1 `spec/memory-convention.md` + every skill/agent/command file we will write.

**Key findings at a glance** (detailed in the Research Synthesis at the end):

- _(populated after step-06 synthesis)_

---

## Technical Research Scope Confirmation

**Research Topic:** Frontmatter Schemas and Validation Patterns for Typed Artifacts in Agentic Frameworks

**Research Goals:** produce the factual basis required to finalize (1) the YAML frontmatter schema for every artifact type in the plugin (skills, agents, commands, memory items), (2) the fixed MVP type enum and extensibility rules, (3) the validation mechanism (JSON Schema vs custom linter vs `claude plugin validate`), (4) auto-activation semantics tied to the description field, and (5) the interop contract third-party skills must honor to participate in the Unix-pipeline composition.

**Technical Research Scope:**

- Architecture Analysis — state-of-the-art YAML frontmatter schemas across Claude Code (Skills, agents, commands), AGENTS.md, and adjacent frameworks (Superpowers, Spec-kit, Agent OS, AIDD)
- Implementation Approaches — declarative `requires` / `produces` / `memory_scope` patterns, type taxonomies observed in the wild
- Technology Stack — JSON Schema, validators (ajv, jsonschema, zod/pydantic-like), IDE integration (JSON Schema Store, LSP), `claude plugin validate` extensibility
- Integration Patterns — `description` → auto-activation semantics, truncation budgets, over- vs under-triggering trade-offs
- Governance — schema versioning (`schema_version`), migration rules, third-party interop contract

**Explicit Exclusions (delegated to sibling research tracks):**

- `plugin.json` / `marketplace.json` manifest schemas → Research #1 (completed)
- Subagent output contracts → Research #3
- Hooks frontmatter fields → Research #5
- MCP server configuration → Research #4

**Research Methodology:**

- Current web data with rigorous source verification (official docs at `code.claude.com`, AGENTS.md spec, public framework repos)
- Multi-source validation for critical technical claims (required fields, truncation budgets, frontmatter conventions)
- Confidence level framework for uncertain information
- Comprehensive technical coverage focused on implementation-decision enablement

**Scope Confirmed:** 2026-04-17

---

## Technology Stack Analysis

> **Domain-adapted interpretation**: for frontmatter schemas, the "technology stack" is the serialization format, the schema language(s) used to validate it, the validators themselves, the IDE integration layer, and the cross-framework field conventions. Standard categories (databases, cloud providers) are not meaningful and are replaced below by the equivalent schema-layer categories.

### Serialization Language (YAML Frontmatter)

**YAML is the universal serialization for artifact frontmatter** across every framework surveyed. No major framework uses TOML, JSON, or INI frontmatter. The convention is a YAML block delimited by `---` at the top of a Markdown file, followed by the artifact body.

- **Specification**: YAML 1.2 semantics, UTF-8 encoding **without BOM**. A real bug class: `openai/codex` Issue #13918 shipped a skill loader that silently rejected UTF-8-with-BOM SKILL.md files. Our `validate-artifact-frontmatter` must accept UTF-8 no-BOM and reject BOM early with a clear error message, or strip the BOM before parsing.
- **Why YAML, not JSON**: YAML tolerates comments, multi-line strings, and is less visually noisy in a file that is primarily Markdown prose. Tooling exists. JSON remains the right choice for `plugin.json` / `marketplace.json` (manifests) and `hooks/hooks.json` / `.mcp.json` (configs) because they are not embedded in prose.
- **Common pitfalls to validate against**:
  - Indentation sensitivity (tabs vs spaces — YAML forbids tabs for indentation).
  - Unquoted strings that YAML interprets as booleans (`on`, `off`, `yes`, `no`, `true`, `false`).
  - Unquoted strings with colons (`description: Use when X: do Y` — the second colon breaks parsing).
  - Empty required values silently evaluating to `null`.
  - Multi-line strings: prefer `|` (literal) over `>` (folded) for descriptions, to preserve line breaks Claude will actually see.

_Source: [OpenAI Codex skill loader BOM issue](https://github.com/openai/codex/issues/13918) — accessed 2026-04-17; YAML 1.2 specification._

### Frontmatter Fields by Component Type

Fields observed across Claude Code components. Flagged **required** vs **optional**, with confidence levels where the host docs disagree with the writing-skills skill (a known documentation conflict in Superpowers Issue #195 / #882).

**Skills (`SKILL.md`) — Claude Code**:

| Field                        | Required    | Constraints / semantics                                                                                          |
| :--------------------------- | :---------- | :--------------------------------------------------------------------------------------------------------------- |
| `name`                       | Recommended | ≤64 chars, `[a-z0-9-]+`, no XML, no reserved words. If omitted, directory name used.                             |
| `description`                | Recommended | ≤1,024 chars in spec; truncated at **1,536 chars** combined with `when_to_use` in the skill listing. "Use when…" convention advised. |
| `when_to_use`                | Optional    | Appended to `description` in listing; counts toward the 1,536-char cap.                                          |
| `argument-hint`              | Optional    | Autocomplete hint, e.g. `[issue-number]` or `[filename] [format]`.                                               |
| `disable-model-invocation`   | Optional    | Default `false`. `true` = user-only invocation.                                                                  |
| `user-invocable`             | Optional    | Default `true`. `false` = hidden from `/` menu; Claude-only invocation.                                          |
| `allowed-tools`              | Optional    | Space-separated string or YAML list. Pre-approves tools while skill is active.                                   |
| `model`                      | Optional    | Override session model.                                                                                          |
| `effort`                     | Optional    | `low \| medium \| high \| xhigh \| max` (model-dependent).                                                       |
| `context`                    | Optional    | `fork` = run in a subagent.                                                                                      |
| `agent`                      | Optional    | Subagent type when `context: fork` (built-in: `Explore`, `Plan`, `general-purpose`; or custom from `.claude/agents/`). Default `general-purpose`. |
| `hooks`                      | Optional    | Skill-scoped hook definitions. Format in "Hooks in skills and agents" doc.                                       |
| `paths`                      | Optional    | Glob patterns restricting auto-activation to matching files.                                                     |
| `shell`                      | Optional    | `bash` (default) or `powershell` (requires `CLAUDE_CODE_USE_POWERSHELL_TOOL=1`).                                 |

At least **11 frontmatter fields** are supported in 2026, per the Anthropic Complete Guide to Building Skills. The `obra/superpowers` writing-skills skill has a documented-incorrect claim that only `name` and `description` are supported — this is a known bug (Issues #195, #882) that has spread to downstream skills. Our spec must explicitly list the full set.

**Agents (`agents/<name>.md`) — Claude Code**:

Plugin-shipped agent fields (from Research #1):

| Field              | Required    | Constraints / semantics                                                                               |
| :----------------- | :---------- | :---------------------------------------------------------------------------------------------------- |
| `name`             | Required    | Kebab-case identifier.                                                                                |
| `description`      | Required    | When Claude should invoke this agent.                                                                 |
| `model`            | Optional    | Override default.                                                                                     |
| `effort`           | Optional    | `low \| medium \| high \| xhigh \| max`.                                                              |
| `maxTurns`         | Optional    | Turn budget for agent runs. Guard against runaway loops.                                              |
| `tools`            | Optional    | Explicit tool allowlist for the agent.                                                                |
| `disallowedTools`  | Optional    | Explicit tool denylist.                                                                               |
| `skills`           | Optional    | Preload skills into the agent's context.                                                              |
| `memory`           | Optional    | Persistent memory directory (survives conversations).                                                 |
| `background`       | Optional    | Background-agent semantics.                                                                           |
| `isolation`        | Optional    | Only valid value: `"worktree"`. Creates isolated git worktree.                                        |
| `hooks`            | **Forbidden for plugin agents** | Non-plugin agents only. Security restriction.                                                      |
| `mcpServers`       | **Forbidden for plugin agents** | Non-plugin agents only.                                                                             |
| `permissionMode`   | **Forbidden for plugin agents** | Non-plugin agents only. Non-plugin: pairs with `tools` to build a locked-down agent.                |

**Commands (legacy, `commands/*.md`)**: superseded by `skills/` for new plugins; same frontmatter as skills (Claude Code docs: "A file at `.claude/commands/deploy.md` and a skill at `.claude/skills/deploy/SKILL.md` both create `/deploy` and work the same way").

**Memory artifacts (`memory/project/**/*.md`, `memory/backlog/**/*.md`)** — **our plugin's convention, not a host schema**. See next subsection on cross-framework landscape before locking.

_Sources:_
- [Skills — frontmatter reference](https://code.claude.com/docs/en/skills) — accessed 2026-04-17
- [Plugins reference — agents section](https://code.claude.com/docs/en/plugins-reference) — accessed 2026-04-17
- [Superpowers Issue #195 / #882 — doc bug on frontmatter fields](https://github.com/obra/superpowers/issues/195) — referenced 2026-04-17
- Research #1 (Track 1 of 5) — agent field restrictions for plugin-shipped agents

### Schema Languages and Validators

The authoritative validator in 2026 is **`claude plugin validate`** (the host CLI). It is the only validator guaranteed to track Claude Code semantics. Every other tool complements it; none replaces it.

| Validator                                 | Role                                                                 | Notes                                                                                                     |
| :---------------------------------------- | :------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| `claude plugin validate`                  | Canonical, host-native                                               | Validates `plugin.json`, `marketplace.json`, YAML frontmatter of skills/agents/commands, `hooks/hooks.json`. Hard CI gate. |
| [`hesreallyhim/claude-code-json-schema`](https://github.com/hesreallyhim/claude-code-json-schema) | IDE autocomplete + linting | Unofficial JSON Schema files for `plugin.json` and `marketplace.json`. Documents known deviations from `claude plugin validate`. |
| `ajv` (Node.js)                           | Programmatic validation                                              | Fast. Pairs with custom schemas for **memory artifact frontmatter** (not covered by host validator).       |
| `jsonschema` (Python)                     | Programmatic validation                                              | Alternative for Python-based CI tooling.                                                                   |
| `redhat-developer/yaml-language-server`   | IDE / editor                                                          | JSON Schema validation of YAML, including frontmatter in Markdown (with caveats — see `vscode-yaml` Issue #207). |
| Custom `validate-artifact-frontmatter` skill | Plugin-layer validation                                           | Validates memory artifact frontmatter against the plugin's own schema (the host validator has no opinion on memory content). |

**Schema language choice — JSON Schema, not Zod / Pydantic**:

- JSON Schema is the host's native contract (Anthropic publishes `plugin.json` schema at `https://anthropic.com/claude-code/marketplace.schema.json`). Matching it reduces impedance.
- Zod and Pydantic are language-bound (TS/Python). A JSON Schema can be consumed by validators in every language and by IDEs via the JSON Schema Store convention.
- Zod/Pydantic can still be used as implementation detail inside the `validate-artifact-frontmatter` skill — but the **published spec** must ship a JSON Schema, not a Zod file.

**Validation layers for our plugin** (defense in depth):

1. **Author-time** (IDE): JSON Schema in `schemas/` + `.vscode/settings.json` mapping to register it as the schema for `memory/**/*.md` and skill/agent files. Catches typos at keystroke time.
2. **Commit-time** (CI / pre-commit hook): `claude plugin validate` + a custom linter for memory artifact frontmatter (not covered by host). Hard fail on errors.
3. **Runtime** (plugin itself): `validate-artifact-frontmatter` skill called by `/reflect` memory-capture flow and by a `PreToolUse(Write)` hook matched against `memory/**/*.md`. Fail-closed on schema violations.
4. **Install-time** (Claude Code host): `claude plugin validate` runs implicitly when a plugin is installed. Catches any residual issue — last-line defense.

_Sources:_
- [Plugins reference — validation section](https://code.claude.com/docs/en/plugins-reference) — accessed 2026-04-17
- [hesreallyhim/claude-code-json-schema](https://github.com/hesreallyhim/claude-code-json-schema) — accessed 2026-04-17
- [redhat-developer/vscode-yaml — Issue #207 on frontmatter](https://github.com/redhat-developer/vscode-yaml/issues/207) — referenced 2026-04-17

### IDE / Editor Integration

**JSON Schema Store convention**: a schema lives at a stable URL (or relative path) and is referenced via `$schema` at the top of the target file, or via editor config mapping.

**Setup for VSCode** (primary tooling target):

```jsonc
// .vscode/settings.json
{
  "yaml.schemas": {
    "./schemas/memory-artifact.schema.json": [
      "memory/project/**/*.md",
      "memory/backlog/**/*.md"
    ],
    "./schemas/skill.schema.json": [
      "plugins/*/skills/*/SKILL.md"
    ]
  },
  "json.schemas": [
    {
      "fileMatch": ["**/.claude-plugin/plugin.json"],
      "url": "https://raw.githubusercontent.com/hesreallyhim/claude-code-json-schema/main/schemas/plugin.schema.json"
    },
    {
      "fileMatch": ["**/.claude-plugin/marketplace.json"],
      "url": "https://raw.githubusercontent.com/hesreallyhim/claude-code-json-schema/main/schemas/marketplace.schema.json"
    }
  ]
}
```

The YAML Language Server is required for the frontmatter validation (install `redhat.vscode-yaml` extension). Known caveat: YAML frontmatter inside a Markdown file is handled, but some edge cases (e.g., `$schema` comment positioning) have open issues. Plan a smoke test on the developer's actual setup.

**JetBrains IDEs**: JSON Schema mappings in Settings → Languages & Frameworks → Schemas and DTDs → JSON Schema Mappings. Same schema files reusable.

**Non-VSCode / headless**: schemas are plain files; `ajv --spec=draft-07 -s schemas/memory-artifact.schema.json -d memory/**/*.md` equivalent works in CI.

**Documentation for plugin users**:

- README section: "Enable schema validation in your editor" with copy-paste VSCode config.
- A `CONTRIBUTING.md` pointer for contributors editing memory artifacts — schema violations are caught before PR.

_Sources:_
- [YAML Language Support by Red Hat (marketplace)](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) — accessed 2026-04-17
- [Configure YAML schema (Red Hat Developer)](https://developers.redhat.com/blog/2020/11/25/how-to-configure-yaml-schema-to-make-editing-files-easier) — accessed 2026-04-17

### Cross-Framework Landscape

**Critical distinction up front**: **AGENTS.md is NOT a frontmatter schema**. Multiple sources initially confused it with one. AGENTS.md is plain Markdown with **no YAML, no JSON, no special syntax** — just conventional section headings (`# Build & Test`, `# Architecture Overview`, `# Security`, `# Git Workflows`, `# Conventions & Patterns`) at the repo root. It serves the **repo-to-agent briefing** role (like README.md but for agents), stewarded by the Agentic AI Foundation (Linux Foundation) since late 2025.

**Our plugin should generate an AGENTS.md** via `/init-project` — it is complementary to the frontmatter schema, not a competitor. Target ≤150 lines per the authors' best-practices guidance.

**Frontmatter schema landscape (YAML-based)**:

| Framework            | Frontmatter convention                                          | Declarative fields beyond `name`/`description`                                 | Notes                                                                  |
| :------------------- | :--------------------------------------------------------------- | :----------------------------------------------------------------------------- | :--------------------------------------------------------------------- |
| Claude Code (host)   | ≥11 fields documented in 2026 docs                              | `allowed-tools`, `paths` (glob restriction), `hooks` (skill-scoped), `context: fork` | Canonical for our plugin.                                              |
| Anthropic Skills (open standard, agentskills.io) | YAML front matter; `name` + `description` required             | Subset of Claude Code fields + planned extensions                              | Referenced by OpenCode and others. Spec URL fetch blocked — relying on secondary sources. |
| Superpowers (`obra/superpowers`) | "Use when…" convention for descriptions; 2 required + 9+ optional | Inherits Claude Code fields                                                    | Documented bug in its own writing-skills skill (Issues #195, #882) claiming only 2 fields — don't propagate. |
| Spec-kit (`github/spec-kit`) | YAML frontmatter in command templates; placeholder tokens (`[PROJECT_NAME]`) processed at release-build time | `[CONSTITUTION_VERSION]` SemVer in constitution.md; "SYNC IMPACT REPORT" HTML comment prepended on updates | Different role — not a skill-frontmatter convention but a **template-processing** convention. |
| Agent OS             | Commands + standards with YAML frontmatter; profiles and personas | Unclear declarative preconditions — no public spec                              | Commercial/OSS-mixed. Lower confidence.                                |
| AIDD (`paralleldrive/aidd`) | Metaprograms + prompt modules in markdown                      | Specification-first but unclear formal schema                                    | Direct inspiration for our memory approach; unclear formal schema.     |
| OpenCode skills      | Follows Agent Skills open standard                              | Inherits open-standard fields                                                  | Cross-host adoption of the standard validates it as a convergence point. |

**Convergence signals** (3+ frameworks adopt):

- `name` + `description` required, everything else optional — universal.
- "Use when X" convention for descriptions (trigger-focused, not capability-focused) — cross-framework best practice.
- `allowed-tools` for per-skill permission — Claude Code native, adopted by Superpowers, OpenCode.
- Hidden/user-only flags (`disable-model-invocation`, `user-invocable`) — Claude Code + Superpowers convergent.

**Divergence signals**:

- **No framework has a `requires` / `produces` declarative field.** This is novel to our plugin design. The brainstorming's precondition-driven orchestration model depends on it. **Differentiator confirmed** — and a risk: we must publish it as part of the spec, not assume other skills will understand.
- **No framework has `memory_scope`.** Same category — novel differentiator, must be in the spec.
- **Schema versioning approach varies.** Spec-kit uses `[CONSTITUTION_VERSION]` SemVer + HTML-comment change report; Claude Code does not version skill frontmatter. Our plugin needs an explicit `schema_version` field on memory artifacts to enable safe migration.

_Sources:_
- [AGENTS.md spec site](https://agents.md/) — accessed 2026-04-17
- [How to write a great agents.md (GitHub Blog)](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/) — accessed 2026-04-17
- [Deep Dive SKILL.md (Medium / Kumar)](https://abvijaykumar.medium.com/deep-dive-skill-md-part-1-2-09fc9a536996) — accessed 2026-04-17
- [SKILL.md pattern (Medium / Poudel)](https://bibek-poudel.medium.com/the-skill-md-pattern-how-to-write-ai-agent-skills-that-actually-work-72a3169dd7ee) — accessed 2026-04-17
- [obra/superpowers lib/skills-core.js](https://github.com/obra/superpowers/blob/main/lib/skills-core.js) — referenced 2026-04-17
- [github/spec-kit constitution.md template](https://github.com/github/spec-kit/blob/main/templates/commands/constitution.md) — accessed 2026-04-17

### Technology Adoption Trends

- **YAML frontmatter is converged.** Every surveyed framework uses YAML in a `---`-delimited block. TOML and JSON have not penetrated this niche.
- **"Description as trigger-phrase, not capability statement" is converging.** Superpowers + Anthropic best practices guide + community tutorials all recommend `description: Use when …`. Our skills must follow this convention or risk under-activation.
- **`allowed-tools` is universal** where tool permissions exist. No framework ignores it.
- **Schema publishing is fragmented.** Anthropic ships `plugin.json` / `marketplace.json` schemas at public URLs; nobody publishes a SKILL.md schema on a public URL. The unofficial `hesreallyhim` schemas fill part of the gap. Our publishing of `schemas/memory-artifact.schema.json` in the `joselimmo-marketplace` repo is incremental to the ecosystem.
- **JSON Schema is the cross-language equaliser.** Zod and Pydantic are language-internal implementation details; the publishable artifact is always JSON Schema.
- **`claude plugin validate` is gaining mindshare as the CI gate.** Every serious plugin template (`ivan-magda/claude-code-plugin-template`, Anthropic's own) runs it on PR. We must too.
- **UTF-8 without BOM is an unwritten rule.** Violations cause silent skill-loading failures (OpenAI Codex Issue #13918). Our validator must enforce it.

_Source: cross-reference of the framework docs cited above + community tutorials referenced in this section._

---

## Integration Patterns Analysis

> **Domain-adapted interpretation**: for frontmatter schemas, "integration patterns" covers (1) how frontmatter is discovered and loaded at runtime, (2) how the `description` field integrates with model decision-making (auto-activation), (3) how declarative fields (`requires`/`produces`/`memory_scope`) integrate with the plugin's advisor/orchestration layer, (4) schema evolution and migration across versions, (5) the interop contract third-party skills must honor, and (6) the error / diagnostic protocol when frontmatter is malformed. Generic API patterns (REST, GraphQL, gRPC) are not applicable at this layer.

### Discovery and Loading Protocol

Claude Code's host discovers and parses frontmatter on a deterministic sequence (from Research #1):

1. Scan default component directories (`skills/`, `agents/`, `commands/`) + any manifest-declared overrides.
2. For each `.md` file, extract the YAML block delimited by the first two `---` markers. Fail-soft on parse errors: the file loads with **no metadata** and surfaces a warning in the `/plugin` Errors tab. It does **not** block plugin load (this contrasts with `hooks/hooks.json` which IS fail-closed — cf. Research #1 § Event & Hook Integration Pattern).
3. Validate required fields (`name` may be required in spec; Claude Code falls back to directory name if omitted on a skill).
4. Register the component in the session: skills under `/<plugin-name>:<skill-name>`, agents in `/agents`, etc.
5. Skill descriptions are injected into the session's skill listing (budget: ~1% of context window, fallback 8,000 chars, override via `SLASH_COMMAND_TOOL_CHAR_BUDGET`).

**Memory artifact loading is different**. Memory files are not discovered by Claude Code — they are loaded explicitly by the plugin's skills via `load-memory-scope`. The plugin is responsible for scanning `memory/project/` and `memory/backlog/`, parsing frontmatter, applying the `memory_scope` filter, and injecting the resulting content into the current skill's rendering.

**Read-your-writes invariant**: when `state-manager` writes `INDEX.md`, it must flush before any subsequent read. Since both operations happen in the same skill context, this is trivially satisfied by the sequential tool-call model — no race.

_Source: [Skills — discovery and loading](https://code.claude.com/docs/en/skills), [Plugins reference — loading](https://code.claude.com/docs/en/plugins-reference) — accessed 2026-04-17._

### Auto-Activation Protocol (description → model invocation)

The `description` field is the **only signal** Claude uses to auto-activate a skill. This is not a human-readable summary — it is a trigger phrase for a model. Six mechanics govern its behavior:

**Mechanic 1 — Truncation budget.** Combined `description + when_to_use` per skill is truncated at **1,536 characters** in the skill listing. The total listing budget is ~1% of context window (fallback 8,000 chars). If many skills are installed, individual descriptions are shortened proportionally. At ~60 skills, target ≤130 chars per description to avoid cascading truncation.

**Mechanic 2 — Front-loading.** The model reads descriptions as plain text. Content past the truncation cap is silently dropped. **Always put the triggering condition in the first sentence**; supporting detail after. A description that buries the trigger under capability rhetoric fails to activate.

**Mechanic 3 — "Use when …" convention.** Industry best practice (Superpowers, Anthropic guide, community tutorials all agree): descriptions should describe **when to use**, not **what the skill does**. A model matching "review code for bugs" against user intent "I want to check this PR" needs the trigger phrase, not the mechanics of the review.

**Mechanic 4 — Specificity trade-off.**

- Too vague ("Use when working with code") → under-triggering; the model cannot disambiguate from other skills.
- Too narrow ("Use when reviewing Python 3.12 FastAPI endpoints with JWT auth") → under-triggering on variations the author did not anticipate.
- Sweet spot: concrete triggering situations + explicit examples of user phrases that should activate it.

**Mechanic 5 — `when_to_use` field**. Lets the author add trigger phrases without polluting the primary description. Counts toward the 1,536-char cap. Useful for capturing common user phrasings.

**Mechanic 6 — `paths` restriction**. A skill with `paths: ["src/auth/**"]` only auto-activates when the conversation involves files in that path. Scopes auto-activation by file context; useful for domain-specific skills that would over-trigger otherwise.

**Operational implication for our plugin**: descriptions for the 8 porcelain commands must be crafted carefully. `/backlog` should trigger on "what's next", "status", "where am I". `/discover` should trigger on "new feature", "let's plan", "I need to figure out". The `state-manager` skill (advisor) should have `disable-model-invocation: true` — it is a plumbing helper, not something Claude should decide to invoke.

_Sources:_
- [Skills — invocation & truncation budget](https://code.claude.com/docs/en/skills) — accessed 2026-04-17
- [Skill authoring best practices (Anthropic)](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) — accessed 2026-04-17
- [How Claude Code auto-triggers skills (BSWEN)](https://docs.bswen.com/blog/2026-03-24-skill-triggering/) — accessed 2026-04-17
- [2 fixes for 100% activation (DEV / Adesewa)](https://dev.to/oluwawunmiadesewa/claude-code-skills-not-triggering-2-fixes-for-100-activation-3b57) — accessed 2026-04-17

### Precondition-Driven Composition Protocol

No cross-framework standard exists. This is the plugin's novel contract, per Research #1 and Research #2 findings. Three declarative fields extend the base Claude Code skill frontmatter:

```yaml
---
name: plan-story
description: Use when a story exists without a technical plan and you want to produce one.
requires:
  - type: story
    status: active
produces:
  type: plan
memory_scope:
  - overviews
  - adr-summaries
  - adrs-by-tag
  - conventions
schema_version: "0.1"
---
```

**Field semantics**:

- `requires: [...]` — list of input artifact constraints. Each entry `{ type, status?, tags?, count? }`. The skill is only invokable when **all** constraints are satisfied by artifacts in `memory/backlog/<active-epic>/`. The `state-manager` introspects and emits the set of runnable skills.
- `produces: {...}` — output artifact descriptor `{ type, status? }`. Declares what the skill will write to `memory/backlog/<active-epic>/`. Used for downstream precondition matching.
- `memory_scope: [...]` — fixed MVP enum controlling which `memory/project/` content is loaded at skill invocation. Values: `glossary | overviews | adr-summaries | adrs-by-tag | conventions | learnings-by-tag`. Enforces progressive disclosure at the skill-author level.

**Composition protocol**:

1. User invokes `/backlog` (or `state-manager` is triggered internally).
2. `state-manager` reads `ACTIVE.md` + `INDEX.md` + current epic folder.
3. For each registered porcelain skill, evaluate its `requires` block against the current artifact set.
4. Emit the list of runnable skills with a recommendation ("Next: `/plan-story` — story `story-017-kebab-slug` is active without a plan").
5. User invokes the recommended skill. Skill loads memory per `memory_scope`, executes, writes the output artifact declared in `produces`.
6. `state-manager` re-indexes on next invocation. Read-your-writes.

**Interop implication**: a third-party skill that wants to plug into this pipeline must declare `requires` + `produces` + `memory_scope` in its frontmatter. Claude Code will parse them as unknown extra fields (no-op); our `state-manager` will introspect them and honor the protocol. The third-party skill does not need to import our plugin — the only contract is the schema.

**Risk identified**: Claude Code may at some future version reject unknown frontmatter fields with a warning. Mitigation: prefix extension fields with a project-specific namespace if host behavior changes, e.g. `x-requires`, `x-produces`, `x-memory-scope`. Current docs do not suggest imminent rejection, so no prefix in MVP. Document the risk in the spec.

_Source: novel to this plugin; no direct external validation. Cross-checked against Claude Code's permissive frontmatter parsing (unknown fields ignored) — current behavior as of Apr 2026._

### Schema Evolution Protocol

Frontmatter schemas evolve. Four rules protect against breakage.

**Rule 1 — Every artifact carries a `schema_version`.** MVP: start at `"0.1"`. Bump by convention:

- `0.1 → 0.2` — additive-only (new optional fields).
- `0.2 → 0.3` — deprecations announced, old fields still accepted with warning.
- `0.3 → 1.0` — breaking changes only after a deprecation cycle.
- `1.0 → 2.0` — major. Migration tool shipped.

**Rule 2 — `validate-artifact-frontmatter` reads `schema_version` and applies the matching schema.** An artifact written under `schema_version: "0.1"` validates against the 0.1 schema even after the plugin bumps to 0.2. This is **backward-compatible validation** (Confluent terminology: BACKWARD_TRANSITIVE).

**Rule 3 — Producers write at the latest known version; consumers accept current and all prior.** A skill writing `plan.md` stamps `schema_version: "0.2"`. A skill reading `plan.md` accepts 0.1 and 0.2, ignoring unknown fields from a potentially newer version it has not been upgraded to.

**Rule 4 — Schema migrations are additive-only between minor versions.** Adding a new optional field is always safe. Renaming or removing a field is a major version bump and requires:

- Deprecation notice in CHANGELOG + spec release notes.
- Support for both old and new fields for at least one minor release before removal.
- Optional migration script in `scripts/migrate-vX-to-vY.sh` shipped with the plugin.

**Spec-kit pattern worth borrowing**: its `[CONSTITUTION_VERSION]` field follows SemVer, and each update prepends a "SYNC IMPACT REPORT" HTML comment block to `constitution.md` as an audit trail. Our artifacts can carry a trailing `<!-- SCHEMA MIGRATION: v0.1 → v0.2 on 2026-05-01 -->` comment when upgraded.

**Spec versioning independence**: the plugin's `plugin.json` version (e.g., `1.2.0`) is **independent** of `schema_version` on artifacts. The spec document (`spec/memory-convention.md`) is versioned with its own SemVer line at the top. A plugin release can bump its own version without touching the spec; a spec bump requires a plugin release that understands it.

_Sources:_
- [Confluent: Schema Evolution and Compatibility](https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html) — accessed 2026-04-17
- [Backward Compatibility in Schema Evolution (dataexpert.io)](https://www.dataexpert.io/blog/backward-compatibility-schema-evolution-guide) — accessed 2026-04-17
- [github/spec-kit constitution.md — SYNC IMPACT REPORT pattern](https://github.com/github/spec-kit/blob/main/templates/commands/constitution.md) — accessed 2026-04-17

### Third-Party Interop Contract (Unix Test)

Per the domain research's positioning refinement, a third-party skill must be able to produce or consume our typed artifacts **without importing our plugin**. This is the Unix test. The contract below is the minimum the third-party skill must honor.

**For a third party to produce an artifact our plugin consumes** (e.g., write a `learning.md` that our `/reflect` picks up):

```yaml
---
schema_version: "0.1"
type: learning
title: <human-readable title>
tags:
  - <tag>
  - <tag>
status: active
date: 2026-04-17
---

<body markdown>
```

- **Required**: `schema_version`, `type` (must be in the MVP enum), `title`, `status` (must be in the MVP enum: `draft | active | superseded | archived`).
- **Recommended**: `tags`, `date`.
- **Forbidden**: arbitrary fields not in the published schema. Our validator rejects them.
- **Location**: write to `memory/project/learnings/<kebab-slug>.md`. Use a stable kebab-case filename.

**For a third party to consume an artifact our plugin produces** (e.g., read an `epic.md` or `plan.md`):

- Parse YAML frontmatter; expect `schema_version`, `type`, `title`, `status` at minimum.
- Honor `status: superseded` by following `superseded_by` pointer to the replacement artifact.
- Tolerate unknown optional fields (forward compatibility).

**Publishing requirements** (so a third-party author can implement this):

1. `spec/memory-convention.md` — prose description of the two-tier layout, the type enum, the status enum, the naming rules.
2. `schemas/memory-artifact.schema.json` — machine-readable JSON Schema. The single source of truth a validator can consume.
3. `examples/` directory — one fully-annotated example per type. Third-party authors copy-paste and modify.
4. A minimal README in `spec/` with a ≤20-line example of producing and consuming an artifact, without plugin imports.

**Non-negotiable separation rule**: `spec/` cannot reference anything in `plugins/`. If a design choice can only be implemented by our plugin, it does not belong in the spec. Validate this on every spec change — an automated check is feasible (grep for `plugins/` in spec files).

**Unix test as a release gate (v1.1)**: one demonstrable test where a non-plugin skill (hand-written markdown file, another plugin's skill, or a native Anthropic Skill that writes markdown) produces an artifact our plugin consumes cleanly, or vice versa. Scripted, automatable, documented in the README.

_Source: novel to this plugin; positioning per domain research (`domain-agentic-workflows-ecosystem-research-2026-04-17.md`, § Positioning Refinement)._

### Error and Diagnostic Protocol

Four failure surfaces; each has a distinct response strategy.

**Surface 1 — YAML parse error in a skill/agent/command file.**

- Host behavior: file loads with **no metadata**, surfaces a warning. Does not block plugin load.
- Plugin behavior: `claude plugin validate` in CI catches this before commit. A file that slips through CI still loads but is nearly useless (no description → no auto-activation). Users see the warning in the `/plugin` Errors tab.
- Mitigation: strict CI gate; example `[CONTRIBUTING.md]` section on YAML common pitfalls.

**Surface 2 — Schema violation in a memory artifact.**

- Host behavior: none. The host does not know about our memory schema.
- Plugin behavior: `validate-artifact-frontmatter` is called by `/reflect` at write time and by a `PreToolUse(Write)` hook matching `memory/**/*.md`. Fail-closed: the write is blocked with a descriptive error message pointing to the failing field.
- Diagnostic: the error message must include the file path, the failing field name, the reason, and a pointer to the schema.

**Surface 3 — Malformed `hooks/hooks.json`.**

- Host behavior: **fail-closed — plugin does not load at all**. See Research #1.
- Plugin behavior: CI gate on `claude plugin validate` prevents this from reaching users. A developer working locally who introduces a bad hook file sees the plugin disappear from `/plugin` → restart + `--debug` to diagnose.
- Mitigation: hard CI gate; README troubleshooting section.

**Surface 4 — Unknown or extra frontmatter field.**

- Host behavior: silent acceptance currently; subject to change.
- Plugin behavior: `validate-artifact-frontmatter` can choose to be strict (reject unknown) or lenient (warn, continue). **Recommendation: lenient in MVP, strict behind a `--strict` flag for CI.** A strict mode catches typos; lenient preserves forward compatibility with schemas newer than the plugin knows about.

**Surface 5 — BOM-prefixed UTF-8 frontmatter** (OpenAI Codex Issue #13918 bug class).

- Host behavior: may silently reject the file on some tooling (documented bug in adjacent ecosystems).
- Plugin behavior: `validate-artifact-frontmatter` strips BOM early and logs a warning. Alternative: hard reject with a fix-up command suggested in the error message.
- Mitigation: document in README "If your editor saves with BOM, disable that setting; our validator surfaces it loudly."

_Source: [Plugins reference — debugging / loading errors](https://code.claude.com/docs/en/plugins-reference), [OpenAI Codex Issue #13918 — BOM bug class](https://github.com/openai/codex/issues/13918) — accessed 2026-04-17._
