---
stepsCompleted: []
inputDocuments:
  - _bmad-output/brainstorming/brainstorming-session-2026-04-17-1545.md
  - _bmad-output/planning-artifacts/research/domain-agentic-workflows-ecosystem-research-2026-04-17.md
  - _bmad-output/planning-artifacts/research/technical-plugin-architecture-distribution-research-2026-04-17.md
  - _bmad-output/planning-artifacts/research/technical-frontmatter-schemas-research-2026-04-17.md
  - _bmad-output/planning-artifacts/research/technical-subagents-context-isolation-research-2026-04-18.md
workflowType: 'research'
lastStep: 1
research_type: 'technical'
research_topic: 'Model Context Protocol (MCP) Integration Patterns for a Claude Code Workflow Plugin'
research_goals: 'Produce the factual basis required to (1) catalogue the mature MCP servers usable in 2026 (filesystem, GitHub, web-search, memory, etc.), (2) compare cost/benefit per server (token overhead, latency, security surface), (3) decide whether research-web-wrapper should use MCP-based web search or native WebSearch/WebFetch, (4) determine when MCP breaks portability rather than enabling it, and (5) define the pattern for declaring MCP servers in our plugin vs leaving them as consumer-project opt-ins.'
user_name: 'Cyril'
date: '2026-04-18'
web_research_enabled: true
source_verification: true
research_track: '4 of 5'
related_research:
  - 'Research #1 — Plugin Architecture & Distribution (completed 2026-04-17)'
  - 'Research #2 — Frontmatter Schemas for Typed Artifacts (completed 2026-04-17)'
  - 'Research #3 — Subagents as Context-Isolation Primitives (completed 2026-04-18)'
  - 'Research #5 — SessionStart Hook & Hook Lifecycle (planned)'
scope_exclusions:
  - 'Skill-to-skill composition protocol (not MCP — covered in Research #2 frontmatter)'
  - 'Plugin-shipped agent forbidden fields (covered in Research #1)'
  - 'Hook mechanics (covered in Research #5)'
  - 'Subagent output contract (covered in Research #3)'
---

# Research Report: MCP for Tool Integration

**Date:** 2026-04-18
**Author:** Cyril
**Research Type:** Technical (track 4 of 5)

---

## Research Overview

This is the fourth of five sequential technical research reports scoped jointly with the project owner on 2026-04-17. Prior tracks established the plugin architecture (Track 1), the frontmatter contract (Track 2), and the subagent contract (Track 3). This track sharpens the **agent-to-tool boundary** — specifically, where the Model Context Protocol (MCP) fits into our plugin design and where it does not.

**This report (Track 4)** covers:

- MCP landscape in April 2026 — standard status (Linux Foundation Agentic AI Foundation since Dec 2025), number of servers, adoption across hosts.
- Catalogue of mature MCP servers relevant to our plugin's needs (filesystem, GitHub, web-search, memory, time, fetch, etc.).
- Cost-benefit analysis per server class — token overhead of tool listings, latency, security surface.
- How MCP servers are declared in a Claude Code plugin (`.mcp.json`, inline in `plugin.json`, user-config-bound secrets).
- When MCP is the right choice (agent↔tool communication) vs when it is explicitly wrong (skill↔skill composition — already ruled out in Research #1).
- The decision this track must resolve: **does `research-web-wrapper` use an MCP-based web search server or the native `WebSearch`/`WebFetch` tools?** And more broadly, does our MVP plugin bundle any MCP servers, or are they opt-in per consumer project?

Findings inform the v1.5+ MCP integration milestone from the Track-1 roadmap and the `research-web-wrapper` implementation decision currently pinned at "native WebSearch via general-purpose subagent."

**Key findings at a glance** (detailed in the Research Synthesis at the end):

- _(populated after step-06 synthesis)_
