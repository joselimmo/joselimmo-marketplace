---
stepsCompleted: []
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
