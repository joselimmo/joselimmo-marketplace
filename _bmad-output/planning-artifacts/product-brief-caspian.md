---
title: "Product Brief: Caspian & Casper"
status: "complete"
created: "2026-04-19"
updated: "2026-04-19"
inputs:
  - _bmad-output/brainstorming/brainstorming-session-2026-04-17-1545.md
  - _bmad-output/planning-artifacts/research/technical-frontmatter-schemas-research-2026-04-17.md
  - _bmad-output/planning-artifacts/research/domain-agentic-workflows-ecosystem-research-2026-04-17.md
  - _bmad-output/planning-artifacts/research/technical-plugin-architecture-distribution-research-2026-04-17.md
  - _bmad-output/planning-artifacts/research/technical-subagents-context-isolation-research-2026-04-18.md
  - _bmad-output/planning-artifacts/research/technical-sessionstart-hook-lifecycle-research-2026-04-18.md
  - _bmad-output/planning-artifacts/research/technical-mcp-tool-integration-research-2026-04-18.md
  - web research — Agent Skills standard, MCP 2026 roadmap, spec-driven dev landscape
---

# Product Brief: Caspian & Casper

## Executive Summary

The Claude Code plugin ecosystem exploded from zero to thousands of skills, agents, and slash commands in under a year — but every author defines their own metadata conventions. A developer who wants to combine **BMad for brainstorming, Superpowers for planning, an Anthropic frontend plugin, and a custom design skill** has no way to know which skill fires when, in what order, or what each expects and produces. The workflow becomes something to memorize rather than discover.

**Caspian — Composable Agent Skill Protocol / Interoperable Artifacts Network** — is an open specification that closes this gap with three declarative frontmatter fields (`requires`, `produces`, `memory_scope`) plus a `schema_version`. These four fields turn any agent, skill, command, or memory document into a typed, composable unit — snap-together Lego pieces instead of a pile of incompatible bricks. **Casper — Composable Agent Skill Protocol Example Reference** — is the reference implementation: a Claude Code plugin that proves the contract works end-to-end, with the Claude-Code-specific surface isolated so that the validator and schema tooling remain vendor-neutral.

The timing is deliberate. Anthropic opened the Agent Skills standard in December 2025 and cross-vendor adoption (OpenAI, Microsoft, Cursor, GitHub) landed in under three months — but the standard stops at SKILL.md. Agents, commands, and long-term memory documents have no shared schema. Caspian fills that gap as a compatible overlay, not a competing fork.

## The Problem

Today's Claude Code user faces an invisible orchestration tax. Each plugin activates on its own description string, loads its own context, writes to its own filesystem conventions, and assumes a workflow shape only its author truly understands. The user either:

- **Memorizes every skill** they install, and drives orchestration manually — defeating the point of agentic workflows.
- **Accepts whatever triggers fire**, and ships brittle results — brittle because nothing in the plugin format tells the runtime that a story plan should exist before an implementation skill runs.
- **Picks one framework and stays there** (BMad *or* Superpowers *or* Agent OS) — losing the composition benefit the plugin system promised.

The root cause is not model capability, and not the plugin format. It is **the absence of a declarative contract** between components. No skill says "I need an active epic and a plan" or "I produce an ADR." The runtime and the LLM have to guess.

## The Solution

Caspian is delivered as a **two-layer spec** with a reference implementation split into two releases.

**Caspian Core** — a minimal, universal frontmatter contract: `schema_version`, `type`, `status`, `requires`, `produces`. Any agent, skill, command, or memory artifact that adopts Core becomes composable: an orchestrator can read its preconditions, chain it behind what produces what it needs, and surface it to the user at the right moment. Core is Agent-Skills-compatible — every Anthropic-standard field is still valid.

**Caspian Memory Profile** — an opinionated overlay that adds `memory_scope` and an artifact-type vocabulary plus a two-tier memory layout (`memory/project/` permanent, `memory/backlog/` ephemeral). Profile adopters get progressive-disclosure memory loading out of the box; non-adopters ignore it without penalty.

**Extensible artifact-type registry.** Caspian does not lock the world to one taxonomy. Core ships a canonical set of types with the `core:` namespace — `core:adr`, `core:convention`, `core:learning`, `core:glossary`, `core:overview`, `core:epic`, `core:story`, `core:plan`, `core:review`, `core:rule`, `core:scratch`. Skill authors freely add their own types (`bmad:persona`, `acme:design-spec`); the effective registry for a given project is the union of types declared by installed skills. Validators warn on unregistered types but do not reject them. The goal is structured extensibility — fragmentation channelled through namespaces, not prevented by decree.

**The contract, concretely.** A skill that implements Core looks like this:

```yaml
---
schema_version: "0.1"
name: plan-story
type: core:command
description: "Turn an active story into an implementation plan. Use when a story has been discovered and needs a concrete plan before implementation."
requires:
  - {type: "core:story", status: active, count: 1}
  - {type: "core:overview", scope: technical}
produces:
  type: "core:plan"
  status: draft
memory_scope: [adrs-by-tag, conventions, learnings-by-tag]
---
```

The four fields above are invisible to any host that ignores them and load-bearing to any host that honors them — that is the whole spec.

**Casper, two releases.** The reference plugin ships in stages to protect the spec:

- **casper-core (v1.0)** — a minimal reference plugin: 2–3 porcelain commands (`/init-project`, `/discover`, `/plan-story`) wiring a complete `requires → produces` chain end-to-end. Its only job is to prove Caspian Core is implementable and composable. Claude-Code-specific surface (SessionStart hook, plugin manifest, slash-command registration) is isolated in a `claude-code/` subdirectory; schemas, validator, and vocabulary live at the repo root, reusable by any other harness.
- **casper-full (v1.1)** — the full turn-key workflow: eight porcelain commands, six plumbing skills, Memory Profile wiring, defense-in-depth validator stack (IDE → CI → runtime → install-time), `caspian/validate-action` GitHub Action, conformance badge levels.

Splitting the reference in two lets the spec stand on its own merits in v1.0 without being held hostage to the complexity of the full workflow.

## What Makes This Different

- **Composable by construction, not by convention.** Caspian is to skills what Unix pipes and Lego studs are to their respective worlds — a narrow, typed interface that lets pieces snap together without prior coordination between authors. `requires` and `produces` are the stud and tube; everything else is the brick you bring.
- **Testable skills, finally.** With preconditions and postconditions declared in metadata, any harness can generate fixtures for `requires`, mock upstream artifacts, and assert `produces` on the way out. Skills stop being black boxes validated only by vibes.
- **An audit trail by accident.** Every artifact carries a typed lineage — what it required, what produced it, when. That trail is free provenance: regulated-domain teams, security-conscious orgs, and post-mortem investigators get traceability without any additional instrumentation.
- **An interop contract, not a framework.** BMad, Spec Kit, Kiro, and Agent OS each define their own workflow shapes. Caspian defines none — it just lets components from any of them declare theirs. Adoption carries no methodology tax.
- **Opt-in at two levels.** A skill that adds Caspian fields stays usable in a host that ignores them (graceful degradation). A Caspian-aware orchestrator or harness honors the fields the moment it sees them. No coordinated migration required.
- **Declarative preconditions are novel in this layer.** `requires` and `produces` are absent from every surveyed agent-skill frontmatter schema — Agent Skills, Superpowers, Spec Kit, Agent OS, BMad, AIDD. Prior art exists in workflow-graph tooling (Dagger, Nix derivations, Bazel, Airflow), but none has crossed into the agent-skill authoring layer. The delta is narrow and defensible.

## Who This Serves

**Primary — developers building on Claude Code who want a turn-key workflow they can still modify.** Solo engineers, small teams, polyvalent stacks. They install Casper, run `/init-project`, and start shipping with an opinionated but observable workflow — every artifact the workflow touches is typed, validated, and inspectable. When they outgrow defaults, they override single skills without forking the plugin.

**Secondary — plugin authors who want a shared standard to build on.** They adopt Caspian Core in their frontmatter and their components become composable inside Casper, other Caspian-aware orchestrators, and any future harness that honors the spec. They get discoverability, validation tooling, and cross-ecosystem trust signals at zero marginal cost.

## Success Criteria (12 months post-v1.0)

**Lagging indicators (success gate)**
- **JSON Schema Store PR accepted** — zero-config IDE validation in every editor that consumes the store.
- **At least two external adopters** — third-party skills or plugins that declare `requires`/`produces` in their frontmatter.
- **At least one external contributor** — RFC or code contribution merged from outside the founding author.
- **Unix Interop Test demonstrated** — a non-Casper skill produces an artifact Casper consumes cleanly, and vice versa, scripted and reproducible.

**Leading indicators (checked at 3 and 6 months)**
- Community touch: public launch post, at least one talk or discussion thread on `r/ClaudeAI` / HN / `awesome-claude-code`.
- Conversations logged with at least 2 framework maintainers (BMad, Superpowers, Spec Kit, Agent OS) by month 3 — outreach runs in parallel with development, not as a pre-launch gate.
- At least 10 GitHub issues opened by non-author contributors by month 6.
- If leading indicators stall, a positioning / scope review is triggered before pursuing v1.1.

## Scope

**v1.0 (MVP — spec stands alone)**
- Caspian Core stable: spec prose, JSON Schemas, `spec/CHANGELOG.md`, `core:` namespace canonical vocabulary, extensible-registry conformance rules.
- `caspian` vendor-neutral CLI validator (no Claude Code dependency) so any harness can verify Core compliance.
- casper-core reference plugin: 2–3 porcelain commands (`/init-project`, `/discover`, `/plan-story`), full `requires → produces` chain demonstration, Claude-Code-specific code isolated in a dedicated subdirectory.
- Licenses: **CC-BY-4.0** for spec prose, **Apache-2.0** for JSON Schemas, validator, and Casper code.

**v1.1 (adoption gate)**
- Caspian Memory Profile stable.
- casper-full: full 8-command / 6-skill turn-key workflow, SessionStart lean boot, defense-in-depth validator stack.
- Unix Interop Test scripted; JSON Schema Store PR submitted.
- `caspian/validate-action` reusable GitHub Action — plugin authors adopt validation in three YAML lines.
- Conformance badge levels (e.g. *Core-declared*, *Core-validated*, *Profile-compliant*) with JSON manifest so authors can signal and users can filter.

**Post-v1.1**
- Multiple independent reference implementations (a second harness-bound or CLI-only implementation to validate spec portability).

**Explicitly out of scope (anti-goals)**
- Not an MCP replacement — MCP solves agent↔tool; Caspian solves skill↔skill via typed artifacts.
- Not a methodology framework — no prescribed process, only a contract.
- Not a competitor to Agent Skills — overlay-compatible, not a fork.
- Not a memory runtime — Caspian defines file-level frontmatter; Mem0/Letta/Zep keep their runtime role.

## Ecosystem Strategy

**Positioning** — a neutral interop layer *underneath* existing frameworks. Framework authors like BMad, Superpowers, Spec Kit, and Agent OS could emit Caspian-compliant artifacts with a small diff per artifact; Agent-Skills-native skills remain valid Caspian Core skills by construction. Caspian's vendor-neutral validator CLI ensures the interop story is verifiable outside Claude Code from day one — even though casper-core ships as a Claude Code plugin first.

**Outreach and community** — the founding author commits to contacting framework maintainers and engaging the community in parallel with development: launch post on release, PRs into relevant awesome-lists (`awesome-claude-code`, `awesome-agent-skills`), and direct conversation with at least one framework maintainer before v1.1. Outreach runs continuously, not as a gate.

**Governance** — BDFL-governed at v1.0, with non-trivial spec changes routed through written RFCs in `spec/proposals/`. The project intends to transition to a Steering Committee as external contribution activity grows; no fixed timeline.

**Distribution** — Caspian spec targets the JSON Schema Store. casper-core and casper-full target the official Anthropic plugin marketplace. Both reference each other so the spec pulls in authors and the plugin pulls in users. Canonical package / repo naming uses unhyphenated `caspian` and `casper` on every registry (GitHub, npm, PyPI) even where no package is published — defensive naming.

**Primary risk — and its sunset protocol.** Anthropic may extend the official Agent Skills spec to cover agents, commands, and memory itself, making Caspian redundant. The response is not denial: if `agentskills.io` ships equivalent fields under different names, Caspian commits to aliasing them and deprecating its own within two minor releases. This converts the absorption risk from existential to planned. Proactive upstreaming of `requires`/`produces` proposals to `agentskills.io` begins before v1.0 — the convergent path is the preferred path.

## Vision

In two to three years, Caspian is a quiet interop layer that authors reach for the way they reach for `.editorconfig` or OpenAPI — narrow, boring, useful. Authors no longer ship fifteen dialects of frontmatter. A developer installs four plugins from four authors and the workflow is discoverable, composable, and observable on the first run. Casper remains the canonical reference — not the only implementation, not necessarily the dominant one, but the one that keeps the spec honest. The comparison to LSP and EditorConfig is aspirational, not predictive: both rode dominant-platform backing Caspian does not have. The realistic analog is prettier or prospector — specs that took 3–5 years and deliberate integration work to become defaults.
