---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
classification:
  projectType: developer_tool
  projectTypeSecondary: cli_tool
  domain: general
  complexity: medium
  projectContext: greenfield
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-caspian.md
  - _bmad-output/planning-artifacts/product-brief-caspian-distillate.md
  - _bmad-output/brainstorming/brainstorming-session-2026-04-17-1545.md
documentCounts:
  briefs: 2
  research: 0
  brainstorming: 1
  projectDocs: 0
workflowType: prd
projectName: joselimmo-marketplace-bmad
author: Cyril
date: 2026-04-19
---

# Product Requirements Document - joselimmo-marketplace-bmad

**Author:** Cyril
**Date:** 2026-04-19

## Executive Summary

The Claude Code plugin ecosystem grew from zero to thousands of skills, agents, and slash commands in under a year. Every author defines their own frontmatter conventions. A developer who installs BMad for brainstorming, Superpowers for planning, an Anthropic frontend plugin, and a custom design skill has no way to know which skill fires when, in what order, or what each expects and produces. The workflow becomes something to memorize rather than discover. The root cause is not model capability, and not the plugin format — it is **the absence of a declarative contract** between components. No skill declares "I need an active epic and a plan"; none declares "I produce an ADR." The runtime and the LLM have to guess.

**Caspian** — *Composable Agent Skill Protocol / Interoperable Artifacts Network* — is an open specification that closes this gap with a minimal frontmatter contract: `schema_version`, `type`, `status`, `requires`, `produces`. These fields turn any agent, skill, command, or memory document into a typed, composable unit. The contract is Agent-Skills-compatible by construction: every Anthropic-standard field remains valid.

**Casper** — *Composable Agent Skill Protocol Example Reference* — is the Claude Code reference plugin that proves the contract end-to-end. Claude-Code-specific surface is isolated in a subdirectory; schemas, validator, and vocabulary live at the repo root and remain vendor-neutral so any other harness can honor the spec.

**Scope of this PRD: Caspian Core + casper-core (v1.0).** The Memory Profile overlay and the full turn-key workflow (casper-full v1.1) are the subject of a second PRD.

**Primary audience** — plugin authors and framework maintainers who want components to compose across ecosystems with zero methodology tax. **Secondary audience** — developers on Claude Code who want a turn-key, modifiable workflow (Casper).

**Why now.** Fragmentation is already visible: six distinct frontmatter schemas exist today (Agent Skills, Superpowers, Spec Kit, Agent OS, BMad, AIDD), none composable with any other. Anthropic opened the Agent Skills standard in December 2025 and cross-vendor adoption (OpenAI, Microsoft, Cursor, GitHub) landed in under three months — the ecosystem is still malleable but not for long. Caspian fills the gap above SKILL.md as a compatible overlay, not a competing fork, while the cement is still wet.

### What Makes This Special

- **Composable by construction, not by convention.** `requires` and `produces` are the stud and tube: a narrow typed interface that lets pieces snap together without prior coordination between authors. Caspian imposes no workflow shape — it just lets components declare theirs.
- **A precise, defensible gap.** `requires` / `produces` are absent from every surveyed agent-skill frontmatter schema (Agent Skills, Superpowers, Spec Kit, Agent OS, BMad, AIDD). Prior art exists in workflow-graph tooling (Dagger, Nix derivations, Bazel, Airflow) but has never crossed into the agent-skill authoring layer. The delta is narrow and defensible.
- **Opt-in at two levels, graceful degradation.** A skill that adds Caspian fields stays usable in any host that ignores them. A Caspian-aware orchestrator honors the fields the moment it sees them. No coordinated migration required — adoption proceeds one skill at a time, one host at a time.
- **Overlay, not fork.** Every Anthropic SKILL.md field remains valid. A published sunset protocol commits Caspian to aliasing and deprecating its own fields within two minor releases if `agentskills.io` ships equivalent fields. Proactive upstreaming of `requires` / `produces` proposals begins before v1.0 — the convergent path is the preferred path.

**Core insight.** The problem is not model capability or plugin format — it is the absence of a declarative contract between components. Caspian replaces guessing with a minimal typed declaration.

**User north star.** A developer installs four plugins from four authors, runs the workflow, and it is discoverable, composable, and observable on the first run.

**Realistic analog.** `prettier` or `prospector` — specs that took three to five years of deliberate integration work to become defaults. Not LSP or EditorConfig, which rode dominant-platform backing Caspian does not have.

## Project Classification

- **Project Type** — `developer_tool` (open specification + vendor-neutral CLI validator + Claude Code reference plugin).
- **Secondary Project Type** — `cli_tool` (the `caspian` validator is an explicit v1.0 deliverable, no Claude Code dependency).
- **Domain** — `general` (agentic-AI tooling and plugin ecosystem; no regulatory or real-time constraints).
- **Complexity** — `medium` (low-complexity domain, but non-trivial protocol design, governance, validator-stack engineering, and cross-vendor interop discipline).
- **Project Context** — `greenfield` (product net-new; hosted inside the existing `joselimmo-marketplace` plugin repo but no Caspian/Casper code pre-exists).
