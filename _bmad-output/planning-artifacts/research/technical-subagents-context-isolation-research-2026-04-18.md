---
stepsCompleted: [1, 2]
inputDocuments:
  - _bmad-output/brainstorming/brainstorming-session-2026-04-17-1545.md
  - _bmad-output/planning-artifacts/research/domain-agentic-workflows-ecosystem-research-2026-04-17.md
  - _bmad-output/planning-artifacts/research/technical-plugin-architecture-distribution-research-2026-04-17.md
  - _bmad-output/planning-artifacts/research/technical-frontmatter-schemas-research-2026-04-17.md
workflowType: 'research'
lastStep: 1
research_type: 'technical'
research_topic: 'Claude Code Subagents as Context-Isolation Primitives: Native Types, Custom Definition, Output Contracts, and Cost Profile'
research_goals: 'Produce the factual basis required to finalize (1) the arbitrage between reusing native subagents (Explore, Plan, general-purpose) vs shipping custom subagents (explore-codebase, research-web, adversarial-review), (2) the output contract for plumbing subagents (file-based typed artifact vs conversational return), (3) the token-cost profile of subagents vs inline tasks by task type, (4) the persistent memory field semantics and its fit for our plumbing needs, and (5) the patterns observed in Superpowers / Agent OS / wshobson-agents for context isolation — confirming or challenging our Advisor + Reactive Porcelain composition model.'
user_name: 'Cyril'
date: '2026-04-18'
web_research_enabled: true
source_verification: true
research_track: '3 of 5'
related_research:
  - 'Research #1 — Plugin Architecture & Distribution (completed 2026-04-17)'
  - 'Research #2 — Frontmatter Schemas for Typed Artifacts (completed 2026-04-17)'
  - 'Research #4 — MCP for Tool Integration (planned)'
  - 'Research #5 — SessionStart Hook & Hook Lifecycle (planned)'
scope_exclusions:
  - 'plugin.json / marketplace.json manifest schemas (covered in Research #1)'
  - 'Skill / agent / command frontmatter schemas (covered in Research #2)'
  - 'MCP servers as transport for subagent↔tool communication (covered in Research #4)'
  - 'Hooks lifecycle events (covered in Research #5)'
---

# Research Report: Subagents as Context-Isolation Primitives

**Date:** 2026-04-18
**Author:** Cyril
**Research Type:** Technical (track 3 of 5)

---

## Research Overview

This is the third of five sequential technical research reports scoped jointly with the project owner on 2026-04-17. Tracks 1 (plugin architecture) and 2 (frontmatter schemas) established the host substrate and the artifact-layer contract; this track sharpens the **subagent contract** — the isolation primitives our plumbing skills will rely on when they need to explore a codebase, run adversarial review, or research the web without contaminating the parent story-cycle token budget.

**This report (Track 3)** covers:

- Native Claude Code subagents (`Explore`, `Plan`, `general-purpose`) — their capabilities, tools, models, cost profile, and output characteristics.
- Custom subagent definition in a plugin — frontmatter fields, restricted fields for plugin-shipped agents, the `memory` field and its persistence semantics, `isolation: "worktree"`.
- Output contracts for plumbing subagents — how to force file-based (typed artifact) output vs free-form conversational return.
- Token cost profile — subagent vs inline task for different task types (codebase scan, web research, review, planning).
- Patterns in competing frameworks — how Superpowers, Agent OS, and wshobson/agents use subagents; what to borrow, what to reject (persona dialogue).
- The core decision this track must resolve: **reuse native `Explore` vs ship `explore-codebase`**, and by extension the arbitrage for `research-web` and `adversarial-review`.

Findings inform the Day-3 brownfield bootstrap step of the 7-day MVP (where `/init-project` composes `explore-codebase` or its native equivalent) and the skill contracts for any plumbing skill that needs context isolation.

**Key findings at a glance** (detailed in the Research Synthesis at the end):

- _(populated after step-06 synthesis)_

---

## Technical Research Scope Confirmation

**Research Topic:** Claude Code Subagents as Context-Isolation Primitives: Native Types, Custom Definition, Output Contracts, and Cost Profile

**Research Goals:** produce the factual basis required to finalize (1) the arbitrage between reusing native subagents (Explore, Plan, general-purpose) vs shipping custom subagents, (2) the output contract for plumbing subagents (file-based typed artifact vs conversational return), (3) the token-cost profile by task type, (4) the persistent `memory` field semantics, and (5) patterns observed in competing frameworks.

**Technical Research Scope:**

- Architecture Analysis — native Claude Code subagents (`Explore`, `Plan`, `general-purpose`), custom subagent definition, `isolation: "worktree"` and `memory` field semantics
- Implementation Approaches — output contracts (file-based typed artifact vs prose), restrictions on plugin-shipped agents
- Technology Stack — authorized models per subagent type (Haiku-backed `Explore`), `maxTurns`, `tools` allowlist, `effort` levels
- Integration Patterns — invocation via `Task` tool vs `context: fork` from a skill, parent-context isolation, output return path
- Cost Analysis — token cost profile: subagent vs inline by task type (codebase scan, web research, adversarial review)

**Explicit Exclusions (delegated to sibling research tracks):**

- Agent frontmatter fields → mapped in Research #2 (reuse acquired)
- MCP as agent↔tool transport → Research #4
- Hooks lifecycle → Research #5
- `plugin.json` / `marketplace.json` → Research #1 (completed)

**Research Methodology:**

- Current web data with rigorous source verification (official Claude Code docs, Superpowers / Agent OS / wshobson-agents repos)
- Multi-source validation for critical technical claims
- Confidence level framework for token-cost profiles (rarely measured publicly)
- Systematic citations

**Scope Confirmed:** 2026-04-18

---

## Technology Stack Analysis

> **Domain-adapted interpretation**: for subagents, the "technology stack" covers the built-in subagent types and their backing models, the custom subagent definition layer, the persistence layer (`memory` field), the isolation mechanisms (git worktree), and the invocation layer (Task tool, `context: fork`). Generic categories (programming languages, databases, cloud) do not apply.

### Built-in Subagents (Native, First-Class)

Claude Code ships three built-in subagents auto-available in every session. Each is optimized for a distinct task class and backed by a specific model.

| Subagent          | Backing model (default)      | Intended use                                                               | Tool access                                                      | Typical cost per invocation    |
| :---------------- | :---------------------------- | :------------------------------------------------------------------------- | :--------------------------------------------------------------- | :----------------------------- |
| `Explore`         | Haiku                         | Codebase scans, file discovery, keyword search, answering "how does X work" | Read, Glob, Grep, WebSearch, WebFetch, file analysis             | **~5K tokens** (low)            |
| `Plan`            | Research-specialized (Sonnet/Haiku depending on effort) | Planning, architectural research, step-by-step implementation plans | Read-focused + WebSearch/WebFetch                     | Medium (not publicly benchmarked) |
| `general-purpose` | Sonnet                        | Complex research, multi-step tasks, open-ended investigation               | Full tool access (Read, Glob, Grep, Bash, Edit, Write when granted) | **~30-50K tokens** (high)      |

**Context isolation invariant**: a subagent's context window starts empty except for (1) its system prompt (built-in for native subagents, from frontmatter for custom), (2) the prompt the parent passes via the Task tool, (3) preloaded skills if configured, (4) its `memory/MEMORY.md` first 200 lines if present. **It does not inherit the parent conversation.**

**Return contract**: only the subagent's final message returns to the parent. Intermediate tool calls, search results, read file contents stay inside the subagent. Parent receives a concise summary (verbatim as Agent-tool result) — not raw content. This is the defining cost benefit: heavy exploration in a subagent costs the parent only the final-message tokens.

**Cost breakdown** (confirmed across multiple 2026 sources):

- `Explore` on Haiku: ~5,000 tokens per invocation (input + output).
- `general-purpose` on Sonnet: 30-50K tokens per invocation.
- MCP tool descriptions add 10-20K tokens per session if MCP servers are active (applies to both parent and subagent if the subagent is granted MCP).
- Haiku is approximately **5x cheaper** per input token than Opus at 2026 pricing.

_Sources:_
- [code.claude.com/docs/en/sub-agents](https://code.claude.com/docs/en/sub-agents) — accessed 2026-04-18
- [morphllm.com/claude-subagents](https://www.morphllm.com/claude-subagents) — accessed 2026-04-18
- [code.claude.com/docs/en/costs](https://code.claude.com/docs/en/costs) — accessed 2026-04-18

### Custom Subagent Definition (Plugin / Project / User Scoped)

A custom subagent is a single Markdown file with YAML frontmatter and a system prompt body. Three storage locations:

- `~/.claude/agents/<name>.md` — **user scope**, available across all projects.
- `.claude/agents/<name>.md` — **project scope**, committed to the repo.
- `plugins/<plugin-name>/agents/<name>.md` — **plugin-shipped**, namespaced as `<plugin-name>:<agent-name>` in the UI.

**Frontmatter fields (plugin-shipped, from Research #2 cross-validated with new search data):**

| Field                 | Required    | Semantics                                                                                    | Notes for our plugin                                               |
| :-------------------- | :---------- | :------------------------------------------------------------------------------------------- | :----------------------------------------------------------------- |
| `name`                | Required    | Kebab-case identifier                                                                         | Namespaced as `<plugin>:<name>`                                    |
| `description`         | Required    | When Claude should invoke the agent                                                           | "Use when…" convention applies                                     |
| `model`               | Optional    | `haiku | sonnet | opus` — cost-routing by complexity                                          | Default: session model. Recommend `haiku` for mechanical tasks.    |
| `effort`              | Optional    | `low | medium | high | xhigh | max` (model-dependent)                                         |                                                                    |
| `maxTurns`            | Optional    | Turn budget                                                                                    | Guard against runaway loops.                                       |
| `tools`               | Optional    | Tool allowlist                                                                                 | Narrow to minimum required.                                        |
| `disallowedTools`     | Optional    | Tool denylist                                                                                  | Complementary to `tools`.                                          |
| `skills`              | Optional    | Skills to preload into the agent's context at startup                                         | Pre-injected, not lazy-loaded.                                     |
| `memory`              | Optional    | `user | project` — persistent directory (since v2.1.33, Feb 2026)                             | See next subsection.                                               |
| `background`          | Optional    | Background-agent semantics                                                                     | Rarely used for plumbing.                                          |
| `isolation`           | Optional    | Only valid value: `"worktree"` — creates git worktree for parallel isolation                  | See dedicated subsection.                                          |
| `hooks`               | **Forbidden** (plugin agents) | Non-plugin only (security restriction)                                                   | Confirmed in Research #1.                                          |
| `mcpServers`          | **Forbidden** (plugin agents) | Non-plugin only                                                                            | Confirmed in Research #1.                                          |
| `permissionMode`      | **Forbidden** (plugin agents) | Non-plugin only (prevents plugin agents from escalating privileges)                         | Confirmed in Research #1.                                          |

**Body**: the system prompt. Markdown, no size hard cap documented but best-practice is under ~500 lines. Can reference supporting files in the agent's directory (same pattern as `SKILL.md` + supporting files).

**Invocation paths**:

1. **Task tool** — the parent invokes `Task(subagent_type: "<name>", prompt: "...")`. Claude decides when to do this based on `description`.
2. **`context: fork` from a skill** — a skill's frontmatter declares `context: fork` + `agent: <subagent-name>`. The skill body becomes the subagent's prompt. Useful for deterministic composition.
3. **`/agents` interface** — user manually selects an agent.

_Sources:_
- [Subagent Frontmatter gist (danielrosehill)](https://gist.github.com/danielrosehill/96dd15d1313a9bd426f7f12f5375a092) — referenced 2026-04-18
- [wshobson/agents](https://github.com/wshobson/agents) — reference catalog of 83 production agents
- [Best practices for Claude Code subagents (PubNub)](https://www.pubnub.com/blog/best-practices-for-claude-code-sub-agents/) — accessed 2026-04-18

### Persistence Layer — the `memory` Field

Introduced in **Claude Code v2.1.33 (February 2026)**. Before that, every agent invocation started from scratch.

**Semantics**:

- `memory: user` — persistent directory at `~/.claude/agent-memory/<agent-name>/` (user-scoped, across projects).
- `memory: project` — persistent directory at `.claude/agent-memory/<agent-name>/` (project-scoped, committable or gitignored depending on team preference).
- Omitted → no persistent memory; agent starts blank each invocation.

**Mechanics**:

- The agent has `Read`, `Write`, `Edit` auto-granted on its memory directory.
- A `MEMORY.md` file at the root of the directory is special: its **first 200 lines are auto-loaded** into the agent's context at startup (same 200-line constraint as CLAUDE.md auto-memory).
- The agent can create additional files in the directory for longer content; it must reference them from `MEMORY.md` to trigger loading.
- Memory survives plugin updates (lives outside the plugin cache).

**Best use cases** (Anthropic guidance + community consensus):

- Codebase patterns accumulated over multiple invocations (repeated architecture questions, recurring bug patterns).
- Debugging insights that compound across sessions.
- Architectural decisions the agent should remember.
- NOT session-specific task context (that belongs in the prompt).

**Anti-patterns**:

- Using `memory` as a cache for the current task's state (defeats the isolation benefit).
- Writing large volumes without curation (200-line auto-load budget gets wasted on stale content).
- Sharing memory across conflicting agents (each agent's memory is isolated by `name`).

**Fit for our plumbing subagents**:

- `explore-codebase` (if we ship it) — GOOD fit. Repeated invocations accumulate codebase-specific patterns; `memory: project` keeps this shared across team.
- `research-web` (if we ship it) — NEUTRAL. Web research is mostly session-specific.
- `adversarial-review` — GOOD fit. Recurring failure patterns per codebase compound value.

_Sources:_
- [claudedirectory.org/blog/claude-code-auto-memory-guide](https://www.claudedirectory.org/blog/claude-code-auto-memory-guide) — accessed 2026-04-18
- [Claude Code Subagents Complete Guide (Medium / Raju)](https://medium.com/@sathishkraju/claude-code-subagents-the-complete-guide-to-ai-agent-delegation-d0a9aba419d0) — accessed 2026-04-18
- Claude Code v2.1.33 release notes (February 2026) — referenced via community sources

### Isolation Mechanism — `isolation: "worktree"`

When `isolation: "worktree"` is set in a subagent's frontmatter, Claude Code spawns the agent in its own git worktree — a separate working directory on a separate branch, sharing the repository history.

**Semantics**:

- A new worktree is created per invocation at a managed location.
- The subagent's file operations happen in the worktree, not the main working tree.
- On completion: worktrees with **no changes** are auto-deleted; worktrees with **changes** persist for the user to review.
- Complemented by `WorktreeCreate` / `WorktreeRemove` hooks for customization.

**Use cases**:

- **Parallel development without conflicts**: two agents working on the same file on different branches; user reviews both, picks or merges.
- **Large-scale refactoring**: spawn N agents each handling a subset of files in their own worktree.
- **Code migrations**: the canonical published use case.

**Known issue**: [anthropics/claude-code Issue #39886](https://github.com/anthropics/claude-code/issues/39886) — "isolation: worktree silently fails, agent runs in main repo instead of isolated worktree." Status as of Apr 2026: open in the issue tracker. **Must verify this on our Claude Code version at Day 3 before relying on the feature**. If broken, fallback: manual `git worktree add` in a hook.

**Fit for our plumbing subagents**:

- `explore-codebase` — NO. Read-only task; worktree isolation is overkill.
- `research-web` — NO. No file writes.
- `adversarial-review` — NO in v1. If we ship an agentic reviewer that modifies files (attempts fixes), worktree isolation prevents collision with the parent's working state. Consider in v2+.
- General rule: worktree isolation is for **write-heavy parallel work**, not for read-only side tasks.

_Sources:_
- [claudefa.st/blog/guide/development/worktree-guide](https://claudefa.st/blog/guide/development/worktree-guide) — accessed 2026-04-18
- [Boris Cherny announcement threads](https://www.threads.com/@boris_cherny/post/DVAAnexgRUj/) — referenced 2026-04-18
- [anthropics/claude-code Issue #39886](https://github.com/anthropics/claude-code/issues/39886) — open as of Apr 2026

### Invocation & Routing Patterns

**Pattern 1 — Task tool invocation (Claude-driven)**.

The parent model decides to delegate based on the subagent's `description`. Invocation: `Task(subagent_type: "<name>", prompt: "...")`. The prompt must contain everything the subagent needs (file paths, context, constraints) — the subagent does not see the parent conversation.

**Pattern 2 — `context: fork` from a skill (deterministic)**.

A skill declares `context: fork` + `agent: <subagent-name>` in its frontmatter. The skill body becomes the subagent's prompt. Arguments (`$ARGUMENTS`) are substituted. This is the most predictable pattern — the skill author controls exactly what the subagent receives.

**Pattern 3 — `/agents` UI (user-driven)**.

User picks an agent manually. Rarely useful for plumbing; this path is for exploratory agent use.

**Router logic in competing frameworks**:

- **Superpowers**: dispatches a fresh subagent per task from the plan. Two-stage review (spec compliance then code quality) via dedicated reviewer subagent. Red-team subagent for adversarial testing. Strong convention: "separate subagent prevents bias from knowing the implementer's reasoning."
- **wshobson/agents**: 83 specialized agents, user or model picks by matching `description`. Model routing by complexity: Haiku for simple, Sonnet for dev, Opus for critical (security audit, architecture review).
- **Agent OS**: profiles and personas at the session level; subagents dispatched for specialized tasks.

**Validated pattern**: **fresh context per task, prompt contains everything needed, output returns as summary or durable artifact**. Superpowers's reviewer-as-separate-subagent pattern is the clearest application: it prevents the reviewer from seeing the implementer's reasoning, which is anti-bias by design.

_Sources:_
- [Superpowers blog (fsck.com, obra)](https://blog.fsck.com/2025/10/09/superpowers/) — accessed 2026-04-18
- [morphllm.com/claude-subagents](https://www.morphllm.com/claude-subagents) — accessed 2026-04-18
- [wshobson/agents](https://github.com/wshobson/agents) — referenced 2026-04-18

### Technology Adoption Trends

- **Model-based cost routing is converging.** `haiku | sonnet | opus` selection based on task complexity is now standard (wshobson, Superpowers, published best practices).
- **Subagent-as-reviewer separation is a Superpowers-validated pattern** spreading to other frameworks. Preserves adversarial independence.
- **The `memory` field (Feb 2026) is under-adopted so far.** Most published subagents predate it. Early mover advantage if the plugin uses it well.
- **`isolation: "worktree"` is bleeding-edge.** Strong use case but one known bug. Safer to defer to v1.5+ unless the Day-3 test confirms it works.
- **Context-isolation-via-subagent is universally accepted.** The "persona debate" anti-pattern (BMAD) is in decline.
- **File-based artifact output is the more disciplined convention**, particularly for plan/research/review tasks where persistence matters.

_Source: cross-reference of the sources cited in this section._
