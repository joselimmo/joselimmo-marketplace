---
stepsCompleted: [1, 2]
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
