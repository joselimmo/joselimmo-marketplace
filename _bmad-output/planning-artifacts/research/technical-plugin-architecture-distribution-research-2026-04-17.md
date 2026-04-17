---
stepsCompleted: []
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
