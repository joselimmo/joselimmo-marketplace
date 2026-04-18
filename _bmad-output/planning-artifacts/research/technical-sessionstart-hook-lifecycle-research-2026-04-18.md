---
stepsCompleted: [1, 2, 3]
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
