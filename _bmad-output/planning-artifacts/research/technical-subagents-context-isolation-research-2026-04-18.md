---
stepsCompleted: []
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
