---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments:
  - _bmad-output/brainstorming/brainstorming-session-2026-04-17-1545.md
  - _bmad-output/planning-artifacts/research/domain-agentic-workflows-ecosystem-research-2026-04-17.md
  - _bmad-output/planning-artifacts/research/technical-plugin-architecture-distribution-research-2026-04-17.md
  - _bmad-output/planning-artifacts/research/technical-frontmatter-schemas-research-2026-04-17.md
  - _bmad-output/planning-artifacts/research/technical-subagents-context-isolation-research-2026-04-18.md
  - _bmad-output/planning-artifacts/research/technical-mcp-tool-integration-research-2026-04-18.md
workflowType: 'research'
lastStep: 1
research_type: 'technical'
research_topic: 'Claude Code Hook Lifecycle and SessionStart Mechanics for Cross-OS Lean Boot'
research_goals: 'Produce the factual basis required to finalize (1) the SessionStart hook implementation respecting a ≤500-token hard output cap, (2) the cross-OS (Linux/macOS/Windows/PowerShell) runtime contract and fallback modes, (3) the precise mechanics of the ~27 lifecycle events inventoried in Research #1 and which ones our plugin should actually use, (4) the four declared lean-boot modes (always / new-session-only / manual / interactive) from the brainstorming, and (5) the hook authoring guidelines (timeouts, stdout buffering, input payload via stdin, exit codes and their semantics).'
user_name: 'Cyril'
date: '2026-04-18'
web_research_enabled: true
source_verification: true
research_track: '5 of 5'
related_research:
  - 'Research #1 — Plugin Architecture & Distribution (completed 2026-04-17)'
  - 'Research #2 — Frontmatter Schemas for Typed Artifacts (completed 2026-04-17)'
  - 'Research #3 — Subagents as Context-Isolation Primitives (completed 2026-04-18)'
  - 'Research #4 — MCP for Tool Integration (completed 2026-04-18)'
scope_exclusions:
  - 'plugin.json / marketplace.json manifest (Research #1, completed)'
  - 'Skill / agent / command frontmatter schemas (Research #2, completed)'
  - 'Subagent output contracts (Research #3, completed)'
  - 'MCP server configuration (Research #4, completed)'
---

# Research Report: SessionStart Hook & Hook Lifecycle

**Date:** 2026-04-18
**Author:** Cyril
**Research Type:** Technical (track 5 of 5 — final)

---

## Research Overview

This is the fifth and final technical research track scoped jointly with the project owner on 2026-04-17. Prior tracks established the plugin substrate (#1), the artifact contract (#2), the subagent contract (#3), and the MCP integration policy (#4). This track sharpens the **hook lifecycle** — the event-driven boundary where our plugin reacts to Claude Code host events, with special emphasis on the SessionStart lean-boot hook that enforces a ≤500-token hard cap.

**This report (Track 5)** covers:

- The full inventory of lifecycle events (~27 documented in Research #1) with their trigger conditions and hook-input schemas.
- SessionStart specifics: when it fires, how its output is processed into the session context, the ≤500-token hard budget.
- Cross-OS runtime contract: Bash on Linux/macOS, PowerShell on Windows, portable fallbacks, known compatibility issues.
- The four lean-boot modes from the brainstorming (`always | new-session-only | manual | interactive`) and their implementation mechanisms.
- Hook authoring guidelines: stdin JSON input, stdout/stderr semantics, exit codes, timeouts, buffering.
- Which events our plugin should actually wire into (signal-to-noise analysis).

Findings inform the Day-6 MVP deliverable (SessionStart lean boot + hook scaffolding) and close the 5-track sequential research.

**Key findings at a glance** (detailed in the Research Synthesis at the end):

- _(populated after step-06 synthesis)_

---

## Technical Research Scope Confirmation

**Research Topic:** Claude Code Hook Lifecycle and SessionStart Mechanics for Cross-OS Lean Boot

**Research Goals:** produce the factual basis required to finalize (1) the SessionStart hook honoring a ≤500-token hard output cap, (2) the cross-OS runtime contract (Linux/macOS/Windows/PowerShell), (3) the mechanics of the ~27 lifecycle events and which to wire into, (4) the four lean-boot modes from the brainstorming, and (5) hook authoring guidelines (stdin payload, stdout/stderr semantics, exit codes, timeouts).

**Technical Research Scope:**

- Architecture Analysis — complete lifecycle event inventory with trigger conditions and JSON input schemas
- Implementation Approaches — SessionStart mechanics, output injection into session context, ≤500-token budget
- Technology Stack — Bash (Linux/macOS), PowerShell (Windows), portable fallbacks (Node, Python), known compatibility issues
- Integration Patterns — four lean-boot modes + implementation, scoping (global vs plugin vs skill-level)
- Hook Authoring Guidelines — stdin JSON, stdout/stderr semantics, exit codes (0 = continue, 2 = block, others), timeouts, buffering

**Explicit Exclusions (delegated to completed sibling research tracks):**

- `plugin.json` / `marketplace.json` manifests → Research #1
- Skill / agent / command frontmatter → Research #2
- Subagent output contracts → Research #3
- MCP server configuration → Research #4

**Research Methodology:**

- Current web data with rigorous source verification (official `code.claude.com/docs/en/hooks`, cross-OS samples, GitHub issues)
- Multi-source validation for critical technical claims (observed vs documented behavior, known bugs)
- Confidence level framework for cross-OS behaviors (most fragile axis)
- Systematic citations

**Scope Confirmed:** 2026-04-18

---

## Technology Stack Analysis

> **Domain-adapted interpretation**: for hooks, the "technology stack" covers the event vocabulary (~27 lifecycle events), the hook types (command/http/prompt/agent), the runtime contract (stdin JSON, exit codes, stdout/stderr semantics), the SessionStart-specific output-injection behavior, and the cross-OS shell ecosystem (Bash / PowerShell / Node.js portable runner).

### Lifecycle Event Inventory (Complete)

Events group into five cadences:

**Once per session**:

- `SessionStart` — new session or resumed (matcher: `startup | resume | clear | compact`). **Command hook only.**
- `SessionEnd` — session terminates.

**Once per turn**:

- `UserPromptSubmit` — user submits prompt, before Claude processes it (can block).
- `Stop` — Claude finishes responding (can block to continue the turn).
- `StopFailure` — turn ends due to API error (non-blocking).

**Per tool call in agentic loop**:

- `PreToolUse` — before a tool executes (can block via decision or exit 2).
- `PermissionRequest` — permission dialog triggered (can allow/deny).
- `PermissionDenied` — auto-classifier denied a tool call (can retry).
- `PostToolUse` — tool succeeded (non-blocking).
- `PostToolUseFailure` — tool failed (non-blocking).

**Subagent and task**:

- `SubagentStart` / `SubagentStop` — subagent lifecycle. `Stop` hook in a subagent frontmatter auto-converts to `SubagentStop`.
- `TaskCreated` / `TaskCompleted` — TaskCreate tool events (both can block).
- `TeammateIdle` — agent-team teammate going idle (can block).

**Context and config**:

- `InstructionsLoaded` — CLAUDE.md or `.claude/rules/*.md` loaded.
- `ConfigChange` — settings file changes during session (can block).
- `CwdChanged` — working directory changes (e.g., `cd` in Bash). **Also has `CLAUDE_ENV_FILE` access.**
- `FileChanged` — watched file changes on disk (`matcher` selects filenames). **Also has `CLAUDE_ENV_FILE`.**

**Compaction**:

- `PreCompact` — before context compaction (can block).
- `PostCompact` — after compaction completes.

**Async / notification**:

- `Notification` — Claude Code notification.
- `WorktreeCreate` / `WorktreeRemove` — git worktree lifecycle.
- `Elicitation` / `ElicitationResult` — MCP server input request lifecycle.

**Total**: ~26 events. Our plugin uses a small subset (detailed in step-04). Most events are not actionable for a workflow-management plugin.

_Source: [code.claude.com/docs/en/hooks](https://code.claude.com/docs/en/hooks) — accessed 2026-04-18._

### Hook Types — Four Execution Models

| Type      | Runtime                                  | Timeout default | Best for                                       |
| :-------- | :--------------------------------------- | :-------------- | :--------------------------------------------- |
| `command` | Shell subprocess (bash or powershell)    | **600 s**       | Deterministic checks, CLI integrations.        |
| `http`    | POST to URL, JSON body, Authorization header supported | configurable  | External validation services, observability.   |
| `prompt`  | LLM evaluation, `$ARGUMENTS` substitution | **30 s**        | Fuzzy "does this violate rule X?" questions.   |
| `agent`   | Subagent with Read/Grep/Glob             | **60 s**        | Evidence-based verification requiring file access. |

**Command hook fields of note**:

- `shell: "bash" | "powershell"` — explicit shell selection.
- `async: true` — runs in background, does not block.
- `asyncRewake: true` — runs async; can wake Claude later on exit code 2.
- `timeout` (seconds, integer) — overrides default.

**Matcher semantics per event type**:

- `PreToolUse` / `PostToolUse`: matches tool name. Exact (`Bash`), `|`-separated (`Edit|Write`), or regex (`mcp__memory__.*`).
- `SessionStart`: matcher value from `startup | resume | clear | compact`.
- `SessionEnd`: `clear | resume | logout | prompt_input_exit`.
- Many events (`UserPromptSubmit`, `Stop`, `TeammateIdle`, etc.) do not support matchers.

_Source: [code.claude.com/docs/en/hooks — reference section](https://code.claude.com/docs/en/hooks) — accessed 2026-04-18._

### Runtime Contract — stdin / stdout / stderr / Exit Codes

**Command hooks**:

- **Input**: JSON on stdin. Common fields: `session_id`, `transcript_path`, `cwd`, `permission_mode`, `hook_event_name`. Tool events add `tool_name`, `tool_input`, `tool_use_id`.
- **Output**: JSON on stdout (only parsed if exit 0). Stdout of `SessionStart` and `UserPromptSubmit` is injected as context (special case); other events' stdout goes to debug log.
- **Stderr**: text fed back to Claude on exit 2. Text fed back to user only on other non-zero exits.

**Exit code semantics** (critical — often mis-documented):

| Exit | Meaning                                                                                                         |
| :--- | :-------------------------------------------------------------------------------------------------------------- |
| `0`  | Success. Stdout parsed as JSON (if event supports structured output).                                           |
| `2`  | **Blocking error**. Stdout/JSON ignored. Stderr fed to Claude as error. Effect depends on event.                 |
| `1` or others | Non-blocking error. Transcript shows `<hook> hook error` notice; first stderr line surfaced; full stderr to debug log. **Exit 1 is NOT blocking** — critical gotcha. |

**Exit-2 behavior matrix (selected events)**:

| Event                  | Exit 2 = block? | What happens                                   |
| :--------------------- | :-------------: | :--------------------------------------------- |
| `PreToolUse`           | ✅              | Tool call blocked                               |
| `UserPromptSubmit`     | ✅              | Prompt blocked + erased                         |
| `Stop`                 | ✅              | Prevents stopping (continues turn)              |
| `PreCompact`           | ✅              | Blocks compaction                               |
| `PostToolUse`          | ❌              | Shows stderr to Claude (tool already ran)       |
| `SessionStart`         | ❌              | Shows stderr to user only                       |
| `SessionEnd`           | ❌              | Shows stderr to user only                       |
| `InstructionsLoaded`   | ❌              | Ignored                                         |

**Policy enforcement rule**: **use exit 2**, not exit 1. Exit 1 is a conventional Unix failure code but hooks treat it as non-blocking.

**Known bug — Issue #24327**: "PreToolUse hook exit code 2 causes Claude to stop instead of acting on error feedback." Status: open as of Apr 2026. Workaround: use JSON output with `permissionDecision: "deny"` + `permissionDecisionReason` instead of exit 2 for `PreToolUse`.

_Sources:_
- [code.claude.com/docs/en/hooks — exit code section](https://code.claude.com/docs/en/hooks) — accessed 2026-04-18
- [anthropics/claude-code Issue #24327](https://github.com/anthropics/claude-code/issues/24327) — open Apr 2026

### SessionStart Mechanics

**Trigger**: session begins or resumes. Matchers: `startup` (new session), `resume` (`--resume` / `--continue` / `/resume`), `clear` (`/clear`), `compact` (after auto/manual compaction).

**Input schema (stdin JSON)**:

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../00893aaf-19fa-41d2-8238-13269b9b3ca0.jsonl",
  "cwd": "/Users/...",
  "hook_event_name": "SessionStart",
  "source": "startup",
  "model": "claude-sonnet-4-6"
}
```

**Output injection — two paths**:

1. **Plain stdout**: any text printed to stdout is added to Claude's context. Simplest.
2. **Structured JSON**:
   ```json
   { "hookSpecificOutput": { "hookEventName": "SessionStart", "additionalContext": "<text>" } }
   ```

**Critical constraints**:

- Only `type: "command"` hooks are supported on SessionStart. HTTP, prompt, agent not available here.
- Hook runs **synchronously at startup** — keep under 1 second.
- Access to `CLAUDE_ENV_FILE` environment variable — write `export VAR=value` lines to persist env vars for subsequent Bash tool calls in the session. Available on `SessionStart`, `CwdChanged`, `FileChanged` only.

**Token budget enforcement** for our ≤500-token hard cap:

- Tokenize the output before printing. A Node / Python wrapper can measure and truncate with an ellipsis or aggressive trimming.
- Alternative: ship a fixed-template output whose maximum length is known at authoring time (the brainstorming's 3-line template: `Epic: <id> / Story: <id>:<status> / Next: <command>` caps at ~120 characters ≈ 30 tokens).

**Known bugs**:

- **Issue #14281**: "Hook additionalContext injected multiple times." `additional_context` field (Cursor compat) and `hookSpecificOutput.additionalContext` both read — full prompt injected twice. Workaround: emit only `hookSpecificOutput.additionalContext`, never plain stdout, to avoid double-injection on some Claude Code versions.
- **Issue #23875**: feature request to view injected context. No command/flag currently exposes it — verify injection via `claude --debug` logs.
- Superpowers Issue #648: "SessionStart hook injects superpowers context twice into Claude Code sessions." Same root cause.

**Recommendation for our plugin**: use structured JSON output (`hookSpecificOutput.additionalContext`), never plain stdout, to avoid the double-injection footgun.

_Sources:_
- [code.claude.com/docs/en/hooks — SessionStart section](https://code.claude.com/docs/en/hooks) — accessed 2026-04-18
- [claudefa.st Session Lifecycle Hooks](https://claudefa.st/blog/tools/hooks/session-lifecycle-hooks) — accessed 2026-04-18
- [anthropics/claude-code Issue #14281](https://github.com/anthropics/claude-code/issues/14281) — additionalContext multiple injections
- [obra/superpowers Issue #648](https://github.com/obra/superpowers/issues/648) — same root cause

### Cross-OS Runtime Contract

**Bash (Linux/macOS default)**:

- `shell: "bash"` (default when unspecified).
- Typical on macOS, every Linux distro. Windows needs WSL, Git Bash, or MSYS2.
- Startup ~10-50 ms.

**PowerShell (Windows)**:

- `shell: "powershell"` in the hook config runs PowerShell directly; does NOT require `CLAUDE_CODE_USE_POWERSHELL_TOOL=1`.
- Startup **300-500 ms** — significant when hooks stack.

**Portable Node.js runner (recommended for cross-OS plugins)**:

- Claude Code requires Node on every platform → always available.
- `command: "node ${CLAUDE_PLUGIN_ROOT}/hooks/session-start.mjs"`.
- Use `os.homedir()`, `os.tmpdir()`, `path.join()` for portability.
- Single script file replaces three (`.sh` / `.ps1` / `.cmd`).
- Startup overhead ~50-200 ms.

**Known cross-OS issues**:

- **Issue #18610**: "Plugin hooks cannot execute scripts on Windows — /bin/bash cannot resolve file paths." Workaround: use `node` runner instead of shell scripts on Windows.
- **Line-endings footgun**: Git on Windows defaults to `core.autocrlf=true`. Converts LF to CRLF on checkout. Bash then fails to find binaries (literal CR in name). Fix: add a `.gitattributes` rule `*.sh text eol=lf` for all shell hook scripts.
- **Path separators**: never hardcode `/` or `\`. Always `path.join()` in Node, `Join-Path` in PowerShell, or `"$(dirname "$0")/..."` in Bash.

**Recommendation for our plugin**: **ship Node.js (`.mjs`) hooks**, not Bash or PowerShell. One codebase, every platform, fewer footguns.

_Sources:_
- [claudefa.st — Cross-Platform Hooks 2026](https://claudefa.st/blog/tools/hooks/cross-platform-hooks) — accessed 2026-04-18
- [anthropics/claude-code Issue #18610](https://github.com/anthropics/claude-code/issues/18610) — Windows plugin hook execution
- [nicoforclaude/claude-windows-shell](https://github.com/nicoforclaude/claude-windows-shell) — Windows shell utilities reference

### Configuration Scope Hierarchy

Settings merge across six levels (priority: managed > user > project > local > plugin > component-frontmatter):

| Location                                    | Scope                              | Shareable                        |
| :------------------------------------------ | :--------------------------------- | :------------------------------- |
| Managed policy settings                     | Organization-wide                  | Admin-controlled                 |
| `~/.claude/settings.json`                   | All user projects                  | No (personal)                    |
| `.claude/settings.json` (project)           | This repo                          | ✅ commit to VCS                 |
| `.claude/settings.local.json`               | This repo, this machine            | No (gitignored)                  |
| Plugin `hooks/hooks.json` or inline in `plugin.json` | When plugin enabled            | ✅ bundled with plugin          |
| Skill / agent frontmatter `hooks:`          | While component active             | ✅ in component file             |

**Precedence rules**:

- Managed settings override everything; `disableAllHooks: true` at user/project/local cannot disable managed hooks.
- `disableAllHooks: true` at managed settings disables all hooks.
- Plugin hooks merge with user and project hooks when the plugin is enabled.

**`/hooks` command**: type `/hooks` to open a read-only browser listing every hook configured in the session, grouped by source label (`[User]`, `[Project]`, `[Local]`, `[Plugin]`, `[Session]`, `[Built-in]`).

_Source: [code.claude.com/docs/en/hooks — configuration section](https://code.claude.com/docs/en/hooks) — accessed 2026-04-18._

### Technology Adoption Trends

- **Event vocabulary has grown significantly through 2025-2026** — from a handful of events at Claude Code launch to ~26 in 2026. Expect further additions; design should tolerate unknown events gracefully (hook subscribes to named events only).
- **Prompt hooks and agent hooks are novel** — emerging alternative to brittle shell scripts. Useful for fuzzy policy checks.
- **Node.js as universal hook runner is the pragmatic converging pattern** for cross-OS plugins. Shell-specific hooks (`.sh` / `.ps1`) are increasingly confined to single-platform consumer projects.
- **Exit 2 vs JSON output** — community knowledge has converged on "use JSON output for PreToolUse" to avoid Issue #24327.
- **`additionalContext` double-injection bug** is a live hazard — plugin authors should test with `claude --debug` to verify injection count.

_Source: cross-reference of sources cited in this section._

---

## Integration Patterns Analysis

> **Domain-adapted interpretation**: for hooks, "integration patterns" covers (1) how events bind to handlers via matchers and `if` conditions, (2) the input/output protocol between host and hook, (3) how hooks integrate into plugin vs skill vs agent vs settings scopes, (4) cross-event composition (SessionStart sets env → subsequent PreToolUse sees it), (5) `CLAUDE_ENV_FILE` as the stateful channel, and (6) the error/diagnostic surface.

### Event → Handler Binding Protocol

Three filter mechanisms combine to decide whether a given event instance fires a hook handler.

**Filter 1 — Event name (primary)**.

```json
{
  "hooks": {
    "PreToolUse": [ ... ]
  }
}
```

Each hook handler lives inside an event-named array. An event's array may contain multiple matcher groups.

**Filter 2 — Matcher (event-type-specific)**.

Matchers scope an event to specific instances. Semantics depend on the event:

| Event                                          | Matcher filters                                            | Example matchers                           |
| :--------------------------------------------- | :--------------------------------------------------------- | :----------------------------------------- |
| `PreToolUse` / `PostToolUse` / …               | Tool name (exact, `\|`-separated, or regex)                | `Bash`, `Edit\|Write`, `mcp__memory__.*`   |
| `SessionStart`                                 | Source: `startup \| resume \| clear \| compact`            | `startup`, `resume`                        |
| `SessionEnd`                                   | Reason: `clear \| resume \| logout \| prompt_input_exit`   | `logout`                                   |
| `SubagentStart` / `SubagentStop`               | Agent type (built-in or custom name)                       | `Explore`, `adversarial-review-wrapper`    |
| `PreCompact` / `PostCompact`                   | Trigger: `manual \| auto`                                  | `auto`                                     |
| `ConfigChange`                                 | Source: `user_settings \| project_settings \| local_settings` | `project_settings`                         |
| `FileChanged`                                  | Literal filenames, `\|`-separated                          | `.envrc\|.env`                             |
| `InstructionsLoaded`                           | Load reason: `session_start \| nested_traversal \| path_glob_match` | `session_start`                          |
| Events without matcher support                 | n/a — always fires                                         | `UserPromptSubmit`, `Stop`, `TaskCreated`, `CwdChanged`, `WorktreeCreate`, `WorktreeRemove` |

Matcher evaluation:

- `"*"`, `""`, or omitted → match all.
- Only letters/digits/`_`/`|` → exact string or pipe-separated list.
- Any other character → JavaScript regex.

**Filter 3 — `if` condition (tool events only)**.

```json
{
  "type": "command",
  "if": "Bash(rm *)",
  "command": "./block-rm.sh"
}
```

Uses permission-rule syntax. Fires only if the tool input matches the pattern. Available on `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest`, `PermissionDenied`.

**Combined effect**: event name selects the array; matcher narrows to matching instances within the array; `if` further narrows to matching tool inputs.

_Source: [code.claude.com/docs/en/hooks — matcher section](https://code.claude.com/docs/en/hooks) — accessed 2026-04-18._

### Input/Output Protocol

**Input — stdin JSON (command hooks)** or **POST body (HTTP hooks)**. Common fields:

- `session_id` — current session identifier.
- `transcript_path` — absolute path to conversation JSONL file.
- `cwd` — working directory when hook invoked.
- `permission_mode` — `default | plan | acceptEdits | auto | dontAsk | bypassPermissions`.
- `hook_event_name` — the firing event.

**Event-specific fields** add on top (e.g., `source` on SessionStart, `tool_name` + `tool_input` + `tool_use_id` on PreToolUse).

**Output — Two mechanisms**:

1. **Exit code** (coarse): 0 success, 2 block, others non-blocking error. Documented in step-02.
2. **JSON on stdout (exit 0 only)** — fine-grained control:

```json
{
  "continue": true,
  "stopReason": "...",
  "suppressOutput": false,
  "systemMessage": "...",
  "decision": "block",
  "reason": "...",
  "hookSpecificOutput": { /* event-specific */ }
}
```

**Universal fields** (`continue`, `stopReason`, `suppressOutput`, `systemMessage`) work on every event.

**Decision control patterns by event**:

- **Top-level `decision: "block"` + `reason`**: `UserPromptSubmit`, `PostToolUse`, `PostToolUseFailure`, `Stop`, `SubagentStop`, `ConfigChange`, `PreCompact`.
- **`hookSpecificOutput` with rich control**: `PreToolUse` (permissionDecision allow/deny/ask/defer + `updatedInput`), `PermissionRequest` (decision.behavior), `PermissionDenied` (retry), `Elicitation`, `ElicitationResult`, `WorktreeCreate` (worktreePath), `SessionStart` (additionalContext).
- **No decision control**: `Notification`, `SessionEnd`, `PostCompact`, `InstructionsLoaded`, `StopFailure`, `CwdChanged`, `FileChanged`, `WorktreeRemove`.

**Rule**: pick exit-code semantics OR JSON output, not both. JSON is processed only on exit 0. Exit 2 ignores any JSON and uses stderr as the message.

_Source: [code.claude.com/docs/en/hooks — JSON output section](https://code.claude.com/docs/en/hooks) — accessed 2026-04-18._

### Plugin Integration Protocol

Our plugin declares hooks at three possible levels. Priority order from most- to least-preferred for our use cases:

**Level 1 — Plugin-wide (`hooks/hooks.json`)** — for hooks that should fire whenever the plugin is enabled.

```json
{
  "description": "Workflow plugin hooks",
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ${CLAUDE_PLUGIN_ROOT}/hooks/session-start.mjs",
            "timeout": 5
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Write",
        "if": "Write(memory/**/*.md)",
        "hooks": [
          {
            "type": "command",
            "command": "node ${CLAUDE_PLUGIN_ROOT}/hooks/validate-memory-artifact.mjs"
          }
        ]
      }
    ]
  }
}
```

**Level 2 — Skill frontmatter** — for hooks scoped to a skill's lifecycle.

```yaml
---
name: reflect
description: Review loop + deferred memory capture
hooks:
  PostToolUse:
    - matcher: "Write|Edit"
      hooks:
        - type: command
          command: "node ${CLAUDE_PLUGIN_ROOT}/hooks/track-write-for-capture.mjs"
---
```

These hooks register in-memory, only while the skill is active, and clean up automatically when the skill ends. `once: true` fields in skill frontmatter run the hook once per session.

**Level 3 — Agent frontmatter** — plugin-shipped agents **cannot** declare hooks (confirmed in Research #1 and Research #3). This level is non-plugin-only.

**Our usage**:

| Hook                                              | Level                | Purpose                                                                     |
| :------------------------------------------------ | :------------------- | :-------------------------------------------------------------------------- |
| `SessionStart` lean boot                          | Plugin-wide          | Inject ≤500-token advisor summary on every session start/resume.            |
| `PreToolUse(Write)` with `if: Write(memory/**)`   | Plugin-wide          | `validate-artifact-frontmatter` enforcement on memory writes.               |
| `PostToolUse(Write|Edit)` (v2+ for ambient capture) | Plugin-wide        | Opportunistic scratch-capture candidate flagging.                           |
| `Stop` / `SessionEnd`                             | Plugin-wide          | Flush `ACTIVE.md`, refresh `INDEX.md` idempotently.                         |
| `PreCompact` / `PostCompact`                      | Plugin-wide          | Ensure key architectural decisions survive compaction.                      |

All our hooks are plugin-wide. No skill-frontmatter hooks in MVP (simpler; all wiring in one JSON file).

_Source: [code.claude.com/docs/en/hooks — plugin integration](https://code.claude.com/docs/en/hooks) — accessed 2026-04-18._

### Cross-Event Composition — `CLAUDE_ENV_FILE` Integration

`CLAUDE_ENV_FILE` is the stateful channel between hooks and subsequent session operations. Available only on `SessionStart`, `CwdChanged`, `FileChanged`.

**Mechanics**:

- Environment variable set by Claude Code before the hook runs. Points to a file path.
- Hook writes `export VAR=value` lines to the file via `>>` (append).
- Every subsequent Bash tool call in the session sources the file before execution.

**Use cases for our plugin**:

- Expose `WORKFLOW_ACTIVE_EPIC=epic-003-auth` for Bash tool calls that want the active-epic context (e.g., a `/remember` skill that appends to `memory/backlog/epic-<id>/...`).
- Expose `WORKFLOW_PLUGIN_DATA=${CLAUDE_PLUGIN_DATA}` so shell-invoked scripts can find persistent plugin data.
- Expose `NODE_OPTIONS=--enable-source-maps` or similar if the plugin ships Node tooling.

**Critical constraints**:

- The file is appended, not replaced. Duplicate writes = duplicate `export` lines (harmless but wasteful).
- Not a secure channel — do not write secrets here; use `userConfig` + keychain (Research #1) for those.
- Only Bash tool calls honor it. PowerShell tool calls (on Windows) do NOT source `CLAUDE_ENV_FILE`. Workaround: a PowerShell-aware hook writes its own env file + a `PreToolUse(Bash)`-like hook sources it.

**Our lean-boot hook pattern** (pseudocode):

```
// SessionStart hook — node .claude-plugin/hooks/session-start.mjs
const input = JSON.parse(await readStdin());
const { cwd, source } = input;

// Read plugin state
const active = readJSON(`${cwd}/memory/backlog/ACTIVE.md`);  // epic + story
const indexLine = `Epic: ${active.epic} / Story: ${active.story}:${active.status} / Next: ${advisor.recommend(active)}`;

// Write env var for downstream tools
if (process.env.CLAUDE_ENV_FILE) {
  appendFile(process.env.CLAUDE_ENV_FILE, `export WORKFLOW_ACTIVE_EPIC=${active.epic}\n`);
}

// Emit structured output (JSON-only, to avoid double-injection bug #14281)
console.log(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext: indexLine  // single line, ~30 tokens, <<500 hard cap
  }
}));
process.exit(0);
```

_Source: [code.claude.com/docs/en/hooks — CLAUDE_ENV_FILE section](https://code.claude.com/docs/en/hooks) — accessed 2026-04-18._

### Error and Diagnostic Protocol

**Debug visibility**:

- `claude --debug` logs every hook invocation with stdin input, exit code, stdout, stderr.
- `/plugin` Errors tab shows per-plugin hook errors.
- `/hooks` command lists every registered hook, source-labeled.
- `/doctor` catches some hook misconfigurations.

**Failure modes and responses**:

| Failure                                       | Symptom                                           | Handling                                                                                        |
| :-------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------------------------------------------- |
| Hook binary missing (path typo)               | `hook error` notice in transcript                 | CI gate: smoke-test hooks with a fixture stdin input on every PR.                               |
| Hook times out (> configured timeout)         | Cancelled; non-blocking error                     | Keep `SessionStart` < 1 second. Use asynchronous flavor (`async: true`) only for non-critical hooks. |
| Hook stdin JSON parse fails in the script     | Script error; may block or continue depending on exit code | Defensive parsing: wrap `JSON.parse` in try/catch, exit 0 with empty output on parse failure.   |
| Plugin hooks not loading on Windows (Issue #18610) | Hook silently not firing                          | Use Node.js runner (`node script.mjs`). Test on Windows explicitly.                             |
| `additionalContext` double-injection (Issue #14281) | Duplicated content in Claude's context            | JSON-only output path; never print plain stdout alongside.                                       |
| `PreToolUse` exit 2 stops Claude (Issue #24327) | Claude halts instead of receiving feedback         | Use JSON `permissionDecision: "deny"` with `permissionDecisionReason`, not exit 2.              |
| Malformed `hooks/hooks.json`                  | **Plugin does not load at all** (Research #1)     | Hard CI gate: `claude plugin validate`.                                                         |
| Hook prints to stdout on non-SessionStart/UserPromptSubmit event | Stdout goes to debug log only (expected, not injected) | No action needed; documented behavior.                                                   |

**Disable switches**:

- `disableAllHooks: true` in user/project/local settings disables hooks except managed ones.
- To disable a single hook: edit settings JSON; no per-hook toggle.
- Hot reload: `/reload-plugins` picks up hook changes without session restart.

**Our CI discipline**:

- Run `claude plugin validate` on every PR (hard gate).
- Smoke-test every hook script: feed a fixture stdin, assert exit code and stdout JSON shape.
- Platform matrix CI: run smoke tests on Linux, macOS, Windows (GitHub Actions supports all three).

_Source: [code.claude.com/docs/en/hooks — debugging section](https://code.claude.com/docs/en/hooks), [Issue #14281](https://github.com/anthropics/claude-code/issues/14281), [Issue #18610](https://github.com/anthropics/claude-code/issues/18610), [Issue #24327](https://github.com/anthropics/claude-code/issues/24327) — accessed 2026-04-18._

---

## Architectural Patterns and Design

> **Domain-adapted interpretation**: for hooks, "architectural patterns" covers the lean-boot invariant, the 4 lean-boot modes promised in the brainstorming, hook design principles (size, idempotence, speed, portability), composition with our Advisor + Reactive Porcelain model, security and data architecture, and the final decision table for hook wiring.

### System-Level Patterns

**Pattern 1 — Lean Boot as Architectural Invariant** (brainstorming, reaffirmed).

Every session starts with a ≤500-token injection from `SessionStart` that tells the user and Claude "where we are." Not a welcome screen, not a tutorial — a single, dense line: `Epic: <id> / Story: <id>:<status> / Next: <command>`. Everything else is lazy-loaded when a skill is invoked. This is Progressive Disclosure (from Research #1/#2) applied at the session boundary.

**Pattern 2 — JSON-Only Output Channel** (mitigation for Issue #14281).

Our hooks never write to plain stdout on `SessionStart` or `UserPromptSubmit`. Always emit structured JSON (`hookSpecificOutput.additionalContext`). Prevents the documented double-injection bug. This is a defensive operational pattern, not an optimization.

**Pattern 3 — Node.js as Portable Hook Runtime** (cross-OS discipline).

All our hook scripts ship as `.mjs` files invoked via `node ${CLAUDE_PLUGIN_ROOT}/hooks/<name>.mjs`. Bash and PowerShell are rejected at the plugin level. Every hook script uses `os.homedir()` / `os.tmpdir()` / `path.join()` — no hardcoded separators, no platform-specific env vars.

**Pattern 4 — Idempotent Writes** (hooks may fire repeatedly).

A hook that refreshes `INDEX.md` must produce the same file content from the same memory state regardless of how many times it runs. No timestamps in content, no counters, no "this is write #N." Idempotence is non-negotiable because `SessionStart` fires on every resume, and a session can resume many times per day.

**Pattern 5 — Fail-Soft Hooks, Fail-Closed Validators** (asymmetric error policy).

- **`SessionStart`, `Stop`, `SessionEnd`, ambient capture**: fail-soft. An error in the hook logs a warning; the session continues with degraded context but remains usable.
- **`PreToolUse(Write memory/**)` schema validation**: fail-closed. A violation blocks the write. User sees a clear error.

The asymmetry matches the blast radius: a broken SessionStart hook should not break the session; a broken artifact write should not land.

_Source: synthesized from step-02/03 + brainstorming principles._

### The Four Lean-Boot Modes

From the brainstorming (`.workflow.yaml` setting):

| Mode                  | Behavior                                                                       | Implementation                                                                                           |
| :-------------------- | :----------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------- |
| `always`              | Inject lean-boot context on every session start AND every resume.              | `SessionStart` hook with no matcher restriction → fires on `startup | resume | clear | compact`.         |
| `new-session-only`    | Inject on `startup` only; `resume` / `clear` / `compact` get nothing.          | `SessionStart` hook with `"matcher": "startup"`.                                                         |
| `manual`              | Never inject automatically; user types `/backlog` (or equivalent) to see state. | No `SessionStart` hook wired to lean boot.                                                               |
| `interactive`         | Inject only if a condition is met (e.g., active story exists) OR prompt user.  | `SessionStart` hook reads state and either emits JSON (state present) or emits nothing (no state).       |

**Configuration in `.workflow.yaml`** (from brainstorming, schema fixed here):

```yaml
lean-boot:
  mode: always | new-session-only | manual | interactive
  include-env-vars: true   # whether to write CLAUDE_ENV_FILE exports
```

**Implementation strategy**:

- The hook script reads `lean-boot.mode` from `.workflow.yaml` at invocation time.
- `manual` mode: script exits 0 with empty output, no injection.
- `always` / `new-session-only`: the matcher in `hooks/hooks.json` enforces the `startup | resume | …` scope; the script emits the lean line unconditionally when invoked.
- `interactive`: script checks `ACTIVE.md`; if an active story exists, inject; else emit nothing.

**Default**: `always` — most users want to see where they are every time. The brainstorming user (Cyril) is the primary user; advanced users adjust `.workflow.yaml`.

_Source: brainstorming Phase 2 Lens 1 (Substitute) decision + step-02 matcher semantics._

### Design Principles for Hook Authoring

**Principle 1 — Small Output**. SessionStart ≤500 tokens hard cap, typically <50. A single template line handles 99% of cases. Tokenize before emitting if approaching the cap.

**Principle 2 — Fast Execution**. SessionStart < 1 second. Hooks block session start. A Node.js hook that reads two JSON files + emits JSON completes in ~100 ms comfortably.

**Principle 3 — No Side Effects Beyond Declared Path**. A lean-boot hook reads `ACTIVE.md` + `INDEX.md`. It does NOT: refresh `INDEX.md`, compact memory, prompt user, send telemetry. That is `state-manager`'s job, invoked explicitly by the user.

**Principle 4 — Defensive Input Parsing**. The hook receives JSON on stdin from Claude Code. Wrap parsing in try/catch; exit 0 with empty output on parse failure; log to stderr for user visibility.

**Principle 5 — Environment Variables Are Cheap**. `CLAUDE_ENV_FILE` exports cost almost nothing. Writing `WORKFLOW_ACTIVE_EPIC=<id>` enables every Bash tool call to know the active epic without re-reading state.

**Principle 6 — Document the Hook Contract**. Every hook script's `.mjs` file has a top-of-file comment: what event triggers it, what it reads, what it writes, expected exit codes, expected output shape. Essential when contributors touch the plugin.

### Scalability and Cost Patterns

**Pattern 1 — Token-Budget Enforcement at Hook Layer**.

| Operation                                 | Token budget                          | Enforcement                                                      |
| :---------------------------------------- | :------------------------------------ | :--------------------------------------------------------------- |
| `SessionStart` lean-boot output           | ≤500 tokens (hard cap from brainstorming) | Template-based (~30 tokens actual); tokenize-and-trim safety net |
| `PostToolUse(Write|Edit)` v2+ scratch-capture flag | Trivial (side-effect only, no context injection) | N/A                                                |
| `Stop` / `SessionEnd` state flush         | No context injection                  | Writes to `memory/backlog/ACTIVE.md` only                        |
| `PreCompact` protection of ADRs           | Small additional-context injection (≤500 tokens if used) | Whitelist architectural ADRs to preserve; cap length             |

**Pattern 2 — Compaction-Aware State**.

`PreCompact` can emit `additionalContext` with the current `ACTIVE.md` + `INDEX.md` summary. This ensures architectural context survives compaction (Research #1 principle). The cost is ~500 tokens added once per compaction event — acceptable given the benefit.

**Pattern 3 — Deferred Writes**.

Hooks that modify plugin state (e.g., `Stop` flushing `ACTIVE.md`) write synchronously but only if the state changed since the last flush. A cheap file-hash comparison avoids unnecessary writes.

### Composition — Hooks in Our Advisor Model

Hooks are the **reactive edge** of our Advisor + Reactive Porcelain × Delegated Plumbing model. They do not dispatch subagents, do not execute workflow commands — they react to host events and update or inject state.

```
                   ┌──────────────┐
                   │  state-manager│  ← reads Claude-invoked
                   └──────────────┘

       host events flow                user invocations flow
              ↓                              ↓
  ┌───────────────────────┐    ┌──────────────┐
  │  Plugin hooks         │    │  /<command>  │  (porcelain)
  │  (reactive edge)      │    └──────────────┘
  └───────────────────────┘

  Hooks trigger on:       Porcelain dispatches:
  - SessionStart            - Plumbing skills
  - PreToolUse(Write memory/) - Subagents (via context: fork)
  - PostToolUse (v2+)
  - Stop / SessionEnd
  - PreCompact / PostCompact
```

**Boundary rule**: hooks never invoke skills or subagents. Hooks read state, validate inputs, inject context. They are side-effect-constrained by design.

**Why this separation**:

- Hooks run synchronously at event boundaries — they must be fast and predictable.
- Skills and subagents are arbitrary workloads — they cannot be wrapped in hook timing.
- Keeping the reactive edge thin means Claude Code can invoke hooks confidently on every event without performance concern.

_Source: composition synthesis across Research #1–#5._

### Security Architecture (Hook-Specific)

**Principle 1 — Hooks Run at User Privileges** (Research #1 confirmed).

Same trust boundary as the plugin itself. No additional isolation. An unsandboxed shell command per hook invocation.

**Principle 2 — No Secrets in Hook Scripts**.

Hook scripts live in the plugin cache (read-only after install). Any secret written into the script is leaked via the repo. Use `userConfig` with `sensitive: true` + `${user_config.KEY}` substitution, exactly as for MCP servers (Research #4).

**Principle 3 — Minimal Tool Surface for `agent` Hooks**.

If we ever use `type: "agent"` hooks (v2+), the agent has Read/Grep/Glob access by default. Don't grant Write unless specifically needed. Follow Research #3's minimum-tool-allowlist principle.

**Principle 4 — `PreToolUse` Validation is Not Security**.

A `PreToolUse(Write memory/**)` hook that validates frontmatter is a **quality gate**, not a security control. A malicious caller can write to `memory/` via a shell command that bypasses the Write tool. The validator catches mistakes; it does not defend against adversaries.

**Principle 5 — Injection Safety**.

The lean-boot hook's output becomes Claude's context. Treat any user-controllable content (e.g., story titles from `ACTIVE.md`) as data when injecting — don't construct Claude instructions from user data. Practically: keep injection to the fixed template; never template-insert free-form user prose.

_Source: Research #1 security + hook-specific analysis this track._

### Data Architecture — Which Files Hooks Touch

| Hook                              | Reads                                                                 | Writes                                                   |
| :-------------------------------- | :-------------------------------------------------------------------- | :------------------------------------------------------- |
| `SessionStart` lean boot          | `memory/backlog/ACTIVE.md`, `.workflow.yaml`                           | `CLAUDE_ENV_FILE` (env exports only)                     |
| `PreToolUse(Write memory/)`       | the frontmatter of the write being validated, `schemas/*.json`        | none                                                     |
| `PostToolUse(Write|Edit)` (v2+)   | the write payload (tool_input)                                        | Append to `memory/backlog/epic-NNN/scratch/candidates.md` (write-only append log)  |
| `Stop` / `SessionEnd`             | `ACTIVE.md`, current session transcript (via `transcript_path`)        | `memory/backlog/ACTIVE.md` (only if state changed)       |
| `PreCompact` / `PostCompact`      | key ADRs (whitelist), current story                                    | none (emits via stdout JSON)                             |

**Invariant**: hooks NEVER modify `memory/project/*` files (that is an ambient-capture ritual via `/reflect` or `/remember`). Hooks only touch `memory/backlog/*` and the `CLAUDE_ENV_FILE`.

_Source: Research #2 data architecture + this track's hook wiring decisions._

### The Decision: Hook Wiring Table for MVP

Final wiring (subject to Day-6 implementation validation):

| Event                            | Matcher / `if`                  | Handler type | Script (Node.js)                                                        | Mode/purpose                                                     |
| :------------------------------- | :------------------------------ | :----------- | :---------------------------------------------------------------------- | :--------------------------------------------------------------- |
| `SessionStart`                   | (depends on `lean-boot.mode`)   | command      | `hooks/session-start.mjs`                                              | Lean boot injection (≤500 tokens) + env var exports              |
| `PreToolUse`                     | `"Write"` + `if: Write(memory/**)`  | command      | `hooks/validate-memory-artifact.mjs`                                    | Schema validation of memory artifact frontmatter; block on fail  |
| `Stop`                           | (no matcher)                    | command      | `hooks/flush-state.mjs`                                                 | Idempotent flush of `ACTIVE.md` if state changed                 |
| `SessionEnd`                     | (no matcher)                    | command      | `hooks/flush-state.mjs` (same script)                                   | Same as `Stop` — idempotent final flush                          |
| `PreCompact` (optional v1)       | `"auto"`                        | command      | `hooks/preserve-adrs.mjs`                                               | Inject critical ADR summaries into pre-compaction context        |
| `PostToolUse` (v2+)              | `"Write\|Edit"` + `if: Edit(src/**)` | command      | `hooks/flag-capture-candidate.mjs`                                      | Ambient capture channel (third of three, per brainstorming)       |

**All scripts**: Node.js `.mjs`, JSON-only output for SessionStart/PreToolUse, idempotent, defensive stdin parsing, top-of-file contract comment, <1 second runtime.

**Platform matrix**: each script tested on Linux, macOS, Windows via GitHub Actions platform matrix. Line-endings enforced via `.gitattributes`.

_Source: synthesized from Research #1–#5 findings + brainstorming 4-mode spec._

---

## Implementation Approaches and Technology Adoption

> **Domain-adapted interpretation**: this section covers the practical side of *implementing* hooks — authoring workflow in Node.js, cross-OS testing discipline, risk catalog with known-bug workarounds, and the adjusted Day-6 roadmap. Generic categories adapted.

### Adoption Strategy

**Day 6 (MVP)**:

- Ship `hooks/hooks.json` with 4 wired events: `SessionStart`, `PreToolUse(Write memory/)`, `Stop`, `SessionEnd`.
- Optional `PreCompact` wired if time permits.
- All scripts are Node.js `.mjs`, tested on Linux + macOS + Windows.
- `.workflow.yaml` schema bumped to include `lean-boot.mode` (default `always`) and `lean-boot.include-env-vars`.

**v1.1 (week 2-3)**:

- Cross-platform CI matrix turns green on every PR.
- Tighten token budgets if dogfood surfaces overruns.

**v2+**:

- `PostToolUse(Write|Edit)` hook for ambient capture candidates (third of three channels per brainstorming).
- Evaluate `type: "prompt"` or `type: "agent"` hooks for adaptive validation (e.g., "is this artifact really meaningful to capture, or noise?").

### Development Workflows

**Authoring loop** (per hook script):

1. Write `plugins/<name>/hooks/<event>.mjs`.
2. Top-of-file contract comment: event, inputs, outputs, exit codes.
3. Register in `plugins/<name>/hooks/hooks.json`.
4. Test locally: `echo '<fixture stdin JSON>' | node plugins/<name>/hooks/<event>.mjs ; echo "exit=$?"`.
5. Install plugin via `claude --plugin-dir ./`, trigger the event, inspect behavior via `claude --debug`.
6. `/reload-plugins` for iteration.

**Minimal Node.js hook template**:

```javascript
#!/usr/bin/env node
// SessionStart hook — injects lean-boot context if lean-boot.mode ≠ manual
// Input: stdin JSON with session_id, cwd, source, model
// Output: stdout JSON { hookSpecificOutput: { hookEventName, additionalContext } }
// Exit: 0 always (fail-soft)

import fs from 'node:fs';
import path from 'node:path';
import { readFileSync } from 'node:fs';

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

try {
  const input = JSON.parse(await readStdin());
  const { cwd } = input;
  // ... read ACTIVE.md, .workflow.yaml, compute advisor line ...
  const line = `Epic: ${epic} / Story: ${story}:${status} / Next: ${next}`;
  console.log(JSON.stringify({
    hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: line }
  }));
  if (process.env.CLAUDE_ENV_FILE) {
    fs.appendFileSync(process.env.CLAUDE_ENV_FILE, `export WORKFLOW_ACTIVE_EPIC=${epic}\n`);
  }
  process.exit(0);
} catch (err) {
  process.stderr.write(`session-start hook warning: ${err.message}\n`);
  process.exit(0);   // fail-soft
}
```

**Tooling conventions**:

- Node 20+ (matches Claude Code's own Node requirement).
- Zero npm dependencies in MVP scripts (pure Node). Keeps `${CLAUDE_PLUGIN_DATA}` / `node_modules` footprint at zero.
- If a hook grows to need `js-yaml` or `ajv` (e.g., `validate-memory-artifact.mjs`), wire the manifest-diff pattern from Research #1 to install `node_modules` on first run into `${CLAUDE_PLUGIN_DATA}`.

### Testing and Quality Assurance

**Tier 1 — Static validation**:

- `claude plugin validate .` on every commit (catches malformed `hooks/hooks.json` which would block plugin load per Research #1).
- ESLint / TypeScript-check on `.mjs` files (optional but recommended).

**Tier 2 — Unit tests per hook**:

- For each `hooks/<event>.mjs`, a fixture-driven test: feed known stdin JSON, assert exit code + stdout JSON shape.
- Use Node's built-in `node:test` runner (zero dependencies).
- Run in CI on every PR.

**Tier 3 — Platform matrix**:

- GitHub Actions matrix: `{ os: [ubuntu-latest, macos-latest, windows-latest] }` × `{ node: [20, 22] }`.
- Each matrix cell runs Tier 1 + Tier 2.
- Catches Windows-specific bugs (Issue #18610 class) before release.

**Tier 4 — Integration test in a real session**:

- `claude --plugin-dir ./ ./fixtures/test-project` starts a session in a fixture project.
- Headless mode `-p "what is my active story?"` asserts lean-boot output contains the expected template.
- Runs on platform matrix.

**Tier 5 — Dogfood (Day 7)**:

- Real session on Cyril's side project. Verify:
  - Lean-boot fires within 1 second.
  - Output ≤500 tokens (measure via `claude --debug` logs).
  - `ACTIVE.md` flushes correctly on `Stop` / `SessionEnd`.
  - No double-injection (Issue #14281 mitigated).

### Deployment and Operations

**Release process**:

- Hooks ship as part of the plugin. No separate release artifact.
- Changelog notes hook changes explicitly when they land.

**Operations**:

- `claude --debug` reveals hook invocations with stdin/stdout/exit code.
- `/hooks` menu lets user see every registered hook with source label (`[Plugin]`).
- `/doctor` surfaces hook configuration issues.

**User-facing documentation**:

- README section "Lean boot and hooks" explains:
  - What the lean-boot line means.
  - The four modes (`always | new-session-only | manual | interactive`) and how to set `lean-boot.mode` in `.workflow.yaml`.
  - How to disable (user-level or project-level `disableAllHooks`, or mode `manual`).
  - What `WORKFLOW_ACTIVE_EPIC` env var contains.

### Team Organization and Skills

**Solo (MVP)**: Cyril owns every hook script.

**Community-open (month 2+)**:

- `CODEOWNERS` on `hooks/*.mjs` + `hooks/hooks.json` — require maintainer approval.
- CONTRIBUTING.md documents the hook authoring standards (Node.js, JSON-only output, idempotence, ≤500 tokens for `SessionStart`).
- PR template asks: "Does this hook change pass the platform matrix CI?"

**Author skill requirements**:

- Node.js 20+ fluency.
- JSON schema fluency (for stdin parsing, stdout emitting).
- Cross-OS awareness (paths, line endings, process env differences).
- Familiarity with the ~26 hook events + exit-code gotchas (Issue #24327 / Issue #14281 / Issue #18610).

### Cost Optimization and Resource Management

Per-hook budgets recap (from step-04):

| Operation                           | Runtime cost   | Token cost       |
| :---------------------------------- | :------------- | :---------------- |
| `SessionStart` lean boot            | ~100-200 ms Node | ≤500 tokens (template ~30) |
| `PreToolUse(Write memory/)` validation | ~50-100 ms     | 0 (no injection)  |
| `Stop` / `SessionEnd` flush         | ~20-50 ms (no-op if no change) | 0                 |
| `PreCompact` ADR injection (optional) | ~50 ms          | ≤500 tokens (summaries) |
| v2+ `PostToolUse` capture flagging  | ~20 ms         | 0                 |

**Cold startup**: Node.js process startup ~50-200 ms on first hook; subsequent hooks on same session can reuse Node via process reuse if host supports (Claude Code does not as of 2026 — each hook spawns a fresh Node).

**Memory allocation**: Node.js idle footprint ~40 MB RSS per hook invocation. Acceptable; not a meaningful cost.

### Risk Assessment and Mitigation

Priority-ranked:

**Risk 1 — Double-injection on `SessionStart`** (high likelihood if script emits both stdout and JSON).

Mitigation: template enforces **JSON-only**. Code-review discipline. Lint rule: no plain `console.log` in hook scripts except `console.log(JSON.stringify(...))`.

**Risk 2 — `PreToolUse` exit 2 causing session halt (Issue #24327)**.

Mitigation: every `PreToolUse` hook uses JSON `permissionDecision: "deny"` path. Never exit 2 from `PreToolUse`. Linter rule.

**Risk 3 — Windows cross-platform breakage (Issue #18610 class)**.

Mitigation: Node.js runner, `.gitattributes` for line endings, platform matrix CI.

**Risk 4 — `SessionStart` > 1 second** (high likelihood in early dev).

Mitigation: performance budget gate in Tier 2 tests; measure wall-clock time; fail on > 500 ms.

**Risk 5 — Hook reads stale `ACTIVE.md`** (medium; affects correctness of lean boot).

Mitigation: `state-manager` (skill) writes `ACTIVE.md` atomically (temp file + rename). Hook reads once per invocation.

**Risk 6 — `CLAUDE_ENV_FILE` append collisions** if multiple hooks of the same event write the same var.

Mitigation: each hook uses a unique var name prefix. Review multi-hook configurations for collisions.

**Risk 7 — Malformed `hooks/hooks.json` blocks plugin** (Research #1 confirmed).

Mitigation: hard CI gate on `claude plugin validate`. Never merge with a failing validate.

**Risk 8 — User disables Tool Search on Haiku**, MCP overhead cascades into hook timing budget.

Mitigation: we ship no MCP in MVP. If v1.5+ adds opt-in MCP, document the interaction with Haiku.

### Recommendations — Day-6 Adjusted Roadmap

**Day 6 morning**:

- Scaffold `plugins/<name>/hooks/` directory.
- Write `hooks/hooks.json` with 4 events wired (SessionStart, PreToolUse, Stop, SessionEnd).
- Write `hooks/session-start.mjs` implementing the lean-boot template.
- Write `hooks/validate-memory-artifact.mjs` invoking the `schemas/memory-artifact.schema.json` via `ajv` (already part of Research #2 plan).
- Write `hooks/flush-state.mjs` implementing idempotent `ACTIVE.md` flush.

**Day 6 afternoon**:

- Write Tier 1 + Tier 2 tests for each script.
- Configure GitHub Actions matrix for Linux + macOS + Windows.
- Smoke test: `claude --plugin-dir ./ ./fixtures/test-project` with `-p "status?"` — verify lean boot appears.

**Day 6 end-of-day**:

- `.workflow.yaml` schema bumped to include `lean-boot.mode` + `lean-boot.include-env-vars`.
- `spec/workflow-yaml.schema.md` updated.
- README `Lean boot and hooks` section drafted.

**Day 7 (dogfood)**:

- Full-cycle run; verify lean boot on actual project.
- Measure: SessionStart duration < 1 s, output ≤500 tokens, no double-injection.

**v1.1**:

- Tier 4 integration tests on platform matrix.
- Tier 5 anti-regression — run dogfood-derived tests per release.

**v2+**:

- `PostToolUse(Write|Edit)` ambient capture.
- `PreCompact` ADR-preservation hook.

### Success Metrics and KPIs

**Functional (MVP acceptance)**:

- `claude plugin validate` passes on every commit (binary).
- Tier 1 + Tier 2 + Tier 3 CI green on every PR (binary).
- `SessionStart` output ≤500 tokens verified via `claude --debug` on dogfood (binary).
- `SessionStart` runtime < 1 second measured on all three platforms (binary).

**Operational (ongoing)**:

- Zero user reports of hook-related errors in the first month post-v1.
- Zero reports of double-injection (Issue #14281 mitigated).
- Zero reports of Windows-specific hook failures (Issue #18610 class).

**Adoption (qualitative)**:

- User feedback on lean-boot line usefulness.
- Mode distribution: what percentage of users keep `always` vs `manual`?

_Source: synthesized across Research #1–#5 + brainstorming 7-day roadmap._
