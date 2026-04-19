---
title: "Product Brief: CASP-IAN & CASPER"
status: "draft"
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

# Product Brief: CASP-IAN & CASPER

## Executive Summary

The Claude Code plugin ecosystem exploded from zero to thousands of skills, agents, and slash commands in under a year — but every author defines their own metadata conventions. A developer who wants to combine **BMad for brainstorming, Superpowers for planning, an Anthropic frontend plugin, and a custom design skill** has no way to know which skill fires when, in what order, or what each expects and produces. The workflow becomes something to memorize rather than discover.

**CASP-IAN — Composable Agent Skill Protocol / Interoperable Artifacts Network** — is an open specification that closes this gap with three declarative frontmatter fields (`requires`, `produces`, `memory_scope`) plus a `schema_version`. These four fields turn any agent, skill, command, or memory document into a typed, composable unit. **CASPER — CASP-IAN Example Reference** — is the reference Claude Code plugin that implements the spec end-to-end: eight porcelain commands, six plumbing skills, and a validator pipeline proving the contract holds in practice.

The timing is deliberate. Anthropic opened the Agent Skills standard in December 2025 and cross-vendor adoption (OpenAI, Microsoft, Cursor, GitHub) landed in under three months — but the standard stops at SKILL.md. Agents, commands, and long-term memory documents have no shared schema. CASP-IAN fills that gap as a compatible overlay, not a competing fork.

## The Problem

Today's Claude Code user faces an invisible orchestration tax. Each plugin activates on its own description string, loads its own context, writes to its own filesystem conventions, and assumes a workflow shape only its author truly understands. The user either:

- **Memorizes every skill** they install, and drives orchestration manually — defeating the point of agentic workflows.
- **Accepts whatever triggers fire**, and ships brittle results — brittle because nothing in the plugin format tells the runtime that a story plan should exist before an implementation skill runs.
- **Picks one framework and stays there** (BMad *or* Superpowers *or* Agent OS) — losing the composition benefit the plugin system promised.

The root cause is not model capability, and not the plugin format. It is **the absence of a declarative contract** between components. No skill says "I need an active epic and a plan" or "I produce an ADR." The runtime and the LLM have to guess.

## The Solution

CASP-IAN is delivered as a **two-layer spec** with a reference implementation.

**CASP-IAN Core** — a minimal, universal frontmatter contract: `schema_version`, `type`, `status`, `requires`, `produces`. Any agent, skill, command, or memory artifact that adopts Core becomes composable: an orchestrator can read its preconditions, chain it behind what produces what it needs, and surface it to the user at the right moment. Core is Agent-Skills-compatible — every Anthropic-standard field is still valid.

**CASP-IAN Memory Profile** — an opinionated overlay that adds `memory_scope` and a closed 11-type artifact enum (`adr | convention | learning | glossary | overview | epic | story | plan | review | rule | scratch`) plus a two-tier layout (`memory/project/` permanent, `memory/backlog/` ephemeral). Profile adopters get progressive-disclosure memory loading out of the box; non-adopters ignore it without penalty.

**CASPER** — the reference plugin shipped in `plugins/casper/` of the `joselimmo-marketplace`. Eight porcelain commands (`/init-project`, `/backlog`, `/discover`, `/plan-story`, `/implement`, `/reflect`, `/switch-epic`, `/abandon-epic`), six plumbing skills (state management, memory-scope loading, frontmatter validation, diff pattern extraction, codebase exploration, domain detection), a SessionStart lean-boot hook under 500 tokens, and a defense-in-depth validator stack (IDE → CI → runtime → install-time). CASPER is a working turn-key workflow **and** the executable specification of CASP-IAN.

**The contract, concretely.** A skill that implements Core looks like this:

```yaml
---
schema_version: "0.1"
name: plan-story
type: command
description: "Turn an active story into an implementation plan. Use when a story has been discovered and needs a concrete plan before implementation."
requires:
  - {type: story, status: active, count: 1}
  - {type: overview, scope: technical}
produces:
  type: plan
  status: draft
memory_scope: [adrs-by-tag, conventions, learnings-by-tag]
---
```

The four fields above are invisible to any host that ignores them and load-bearing to any host that honors them — that is the whole spec.

## What Makes This Different

- **An interop contract, not a framework.** BMad, Spec Kit, Kiro, and Agent OS each define their own workflow shapes. CASP-IAN defines none — it just lets components from any of them declare their shape. Adoption carries no methodology tax.
- **Opt-in at two levels.** A skill that adds CASP-IAN fields stays usable in a host that ignores them (graceful degradation). A CASP-IAN-aware orchestrator or harness honors the fields the moment it sees them. No coordinated migration required.
- **Declarative preconditions are the novelty in this layer.** `requires` and `produces` are absent from every surveyed agent-skill frontmatter schema — Agent Skills, Superpowers, Spec Kit, Agent OS, BMad, AIDD. Prior art exists in workflow-graph tooling (Dagger, Nix derivations, Bazel, Airflow), but none of it has crossed into the agent-skill authoring layer. The delta is narrow and defensible.
- **Ships with a working implementation.** Specs without reference implementations rarely get adopted. CASPER is the LSP/EditorConfig-style canonical reference: implementable, inspectable, forkable.

## Who This Serves

**Primary — developers building on Claude Code who want a turn-key workflow they can still modify.** Solo engineers, small teams, polyvalent stacks. They install CASPER, run `/init-project`, and start shipping with an opinionated but observable workflow — every artifact the workflow touches is typed, validated, and inspectable. When they outgrow defaults, they override single skills without forking the plugin.

**Secondary — plugin authors who want a shared standard to build on.** They adopt CASP-IAN Core in their frontmatter and their components become composable inside CASPER, other CASP-IAN-aware orchestrators, and any future harness that honors the spec. They get discoverability, validation tooling, and cross-ecosystem trust signals at zero marginal cost.

## Success Criteria (12 months post-v1.0)

**Lagging indicators (success gate)**
- **JSON Schema Store PR accepted** — zero-config IDE validation in every editor that consumes the store.
- **At least two external adopters** — third-party skills or plugins that declare `requires`/`produces` in their frontmatter.
- **At least one external contributor** — RFC or code contribution merged from outside the founding author.
- **Unix Interop Test demonstrated** — a non-CASPER skill produces an artifact CASPER consumes cleanly, and vice versa, scripted and reproducible.

**Leading indicators (checked at 3 and 6 months)**
- Conversations logged with at least 2 framework maintainers (BMad, Superpowers, Spec Kit, Agent OS) by month 3.
- At least 10 GitHub issues opened by non-author contributors by month 6.
- If leading indicators stall, a positioning / scope review is triggered before pursuing v1.1.

## Scope

**v1.0 (MVP)** — CASP-IAN Core stable (spec prose + JSON Schemas + `spec/CHANGELOG.md`), CASPER with the 8 porcelain commands and CI validation via `ajv`, one documented end-to-end example exercising `/init-project → /discover → /plan-story → /implement → /reflect` with full `requires`/`produces` chain. License: **CC-BY-4.0** for spec prose, **Apache-2.0** for JSON Schemas and CASPER code.

**v1.1 (adoption gate)** — CASP-IAN Memory Profile stable, Unix Interop Test scripted, JSON Schema Store PR submitted, reusable GitHub Action (`casp-ian/validate-action`) published so plugin authors can adopt validation in three YAML lines.

**Explicitly out of scope (anti-goals)**
- Not an MCP replacement — MCP solves agent↔tool; CASP-IAN solves skill↔skill via typed artifacts.
- Not a methodology framework — no prescribed process, only a contract.
- Not a competitor to Agent Skills — overlay-compatible, not a fork.
- Not a memory runtime — CASP-IAN defines file-level frontmatter; Mem0/Letta/Zep keep their runtime role.

## Ecosystem Strategy

**Positioning** — a neutral interop layer *underneath* existing frameworks. Framework authors like BMad, Superpowers, Spec Kit, and Agent OS could emit CASP-IAN-compliant artifacts with a small diff per artifact; Agent-Skills-native skills remain valid CASP-IAN Core skills by construction. Outreach to at least one framework maintainer is a pre-v1.0 prerequisite, not a post-launch hope.

**Governance** — BDFL-governed at v1.0, with non-trivial spec changes routed through written RFCs in `spec/proposals/`. The project intends to transition to a Steering Committee as external contribution activity grows; no fixed timeline.

**Distribution** — CASP-IAN spec targets the JSON Schema Store. CASPER targets the official Anthropic plugin marketplace. Both reference each other so the spec pulls in authors and the plugin pulls in users.

**Primary risk — and its sunset protocol.** Anthropic may extend the official Agent Skills spec to cover agents, commands, and memory itself, making CASP-IAN redundant. The response is not denial: if `agentskills.io` ships equivalent fields under different names, CASP-IAN commits to aliasing them and deprecating its own within two minor releases. This converts the absorption risk from existential to planned. Proactive upstreaming of `requires`/`produces` proposals to `agentskills.io` begins before v1.0 — the convergent path is the preferred path.

## Vision

In two to three years, CASP-IAN is a quiet interop layer that authors reach for the way they reach for `.editorconfig` or OpenAPI — narrow, boring, useful. Authors no longer ship fifteen dialects of frontmatter. A developer installs four plugins from four authors and the workflow is discoverable, composable, and observable on the first run. CASPER remains the canonical reference — not the only implementation, not necessarily the dominant one, but the one that keeps the spec honest. The comparison to LSP and EditorConfig is aspirational, not predictive: both rode dominant-platform backing CASP-IAN does not have. The realistic analog is prettier or prospector — specs that took 3–5 years and deliberate integration work to become defaults.
