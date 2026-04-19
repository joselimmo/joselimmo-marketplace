---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
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

## Success Criteria

### User Success

- **Primary users — plugin authors and framework maintainers.** "Worth it" = their components compose with components from other authors without prior coordination.
  - ≥2 external adopters (third-party skills or plugins declaring `requires` / `produces` in their frontmatter) within 12 months post-v1.0.
  - ≥1 external contributor (RFC or code contribution merged from outside the founding author) within 12 months post-v1.0.
- **Secondary users — developers running Casper on Claude Code.** "Worth it" = workflow is discoverable on the first run.
  - `/init-project` → `/discover` → `/plan-story` chain executes end-to-end on a greenfield project with no manual artifact editing.
  - Developer overrides a single porcelain command locally without forking the plugin.

### Business Success

- **Distribution channel validated** — JSON Schema Store PR accepted (zero-config IDE validation in every editor consuming the store). Deliverable of v1.1; gating indicator for 12-month success.
- **Ecosystem positioning validated** — ≥1 framework maintainer (BMad / Superpowers / Spec Kit / Agent OS) publicly engaged with the spec by v1.1 release; direct conversations with ≥2 maintainers logged by month 3.
- **Marketplace traction** — casper-core accepted in the official Anthropic plugin marketplace. Strategic goal, not a formal gate.
- **Upstream convergence initiated** — ≥1 `requires` / `produces` proposal submitted to `agentskills.io` before v1.0 release.

### Technical Success

- **Contract stability** — schema evolution is BACKWARD_TRANSITIVE between v1.0 and v1.1: additive-only, no breaking changes to `schema_version`, `type`, `status`, `requires`, `produces`.
- **Validator correctness** — the `caspian` CLI implements the full validation coverage matrix for its layer (YAML parse errors, BOM rejection, size cap enforcement, schema conformance, enum strictness, unknown-field handling, path-traversal rejection in pointers). Zero false positives on the canonical fixture set shipped with v1.0.
- **Reference plugin end-to-end** — casper-core's `/init-project` → `/discover` → `/plan-story` chain demonstrably produces artifacts that pass `caspian` CLI validation on a clean run.
- **Vendor neutrality verified** — the `caspian` CLI runs on a machine without Claude Code installed. This is the physical evidence behind the "vendor-neutral" positioning.
- **Unix Interop Test** — a non-Casper skill produces an artifact Casper consumes cleanly, and vice versa; scripted and reproducible. Deliverable of v1.1; the fixtures are drafted during v1.0.

### Measurable Outcomes

**Check-in cadence (leading indicators, 3 / 6 months)**

- **Month 3** — public launch post published; ≥2 framework maintainers contacted and logged; `requires` / `produces` upstream proposal drafted.
- **Month 6** — ≥10 GitHub issues opened by non-author contributors; v1.1 scope frozen; at least one talk or discussion thread on `r/ClaudeAI`, HN, or `awesome-claude-code`.

**Success gate evaluation (lagging indicators, 12 months post-v1.0)**

- JSON Schema Store PR accepted.
- ≥2 external adopters (defined above).
- ≥1 external contributor (defined above).
- Unix Interop Test demonstrated and reproducible.
- **If gate fails** — scope / positioning review is triggered before further investment; sunset protocol considered if `agentskills.io` has shipped equivalent fields.

## Product Scope

### MVP — Minimum Viable Product (Caspian Core v1.0 + casper-core v1.0)

- **Spec artifacts** — Caspian Core spec prose, JSON Schemas for all artifact types, `spec/CHANGELOG.md`, canonical `core:*` vocabulary (`core:adr`, `core:convention`, `core:learning`, `core:glossary`, `core:overview`, `core:epic`, `core:story`, `core:plan`, `core:review`, `core:rule`, `core:scratch`), extensible-registry conformance rules.
- **Vendor-neutral `caspian` CLI validator** — no Claude Code dependency. Validates frontmatter against JSON Schemas. Accepts file, directory, or glob inputs. Strict exit codes for CI gating. Ships with a canonical fixture set for regression testing.
- **casper-core reference plugin** — 2–3 porcelain commands (`/init-project`, `/discover`, `/plan-story`) demonstrating the full `requires → produces` chain. Claude-Code-specific surface (plugin manifest, slash-command registration) isolated in a dedicated subdirectory. Schemas, validator, and vocabulary live at the repo root.
- **Licensing** — CC-BY-4.0 for spec prose; Apache-2.0 for JSON Schemas, validator, and Casper code. Single `LICENSE` file at repo root.
- **Defensive registration** — `caspian` and `casper` names reserved on GitHub, npm, and PyPI even where no package is published.
- **Outreach (continuous)** — launch post on release, PRs into `awesome-claude-code` and `awesome-agent-skills`, direct conversation with ≥1 framework maintainer before v1.1.

### Growth Features (Post-MVP — scoped to a separate v1.1 PRD)

- Caspian Memory Profile overlay (`memory_scope` field, two-tier memory layout).
- casper-full: 8 porcelain commands, 6 plumbing skills, SessionStart lean-boot hook (≤500 tokens, hard cap), full Memory Profile wiring.
- Defense-in-depth validator stack: IDE (VSCode YAML LSP), CI (`ajv` + `caspian/validate-action` GitHub Action), runtime (`validate-artifact-frontmatter` skill + `PreToolUse(Write)` hook), install-time (`claude plugin validate`).
- Unix Interop Test scripted and reproducible.
- JSON Schema Store PR submitted.
- Conformance badge levels (*Core-declared* / *Core-validated* / *Profile-compliant*) + JSON manifest for author signalling and user filtering.

### Vision (Future — post-v1.1)

- **≥2 independent reference implementations** — a second harness-bound or CLI-only implementation validating spec portability.
- **Framework maintainer adoption** — ≥1 of BMad / Superpowers / Spec Kit / Agent OS emits Caspian-compliant frontmatter in its generated artifacts.
- **Upstream convergence achieved** — `requires` / `produces` accepted into `agentskills.io`. Triggers the committed sunset protocol: Caspian aliases the upstream names and deprecates its own within two minor releases.

### Out of Scope / Anti-goals (explicit)

- **Not an MCP replacement.** MCP solves agent↔tool; Caspian solves skill↔skill via typed artifacts.
- **Not a methodology framework.** No prescribed process, only a contract.
- **Not an Agent Skills competitor.** Overlay-compatible, not a fork.
- **Not a memory runtime.** Caspian defines file-level frontmatter; Mem0, Letta, Zep retain the runtime role.
- **No orchestration benchmark** (declarative `requires` / `produces` vs description-based inference) as a committed deliverable. Revisit if evidence emerges.
