---
stepsCompleted: []
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
