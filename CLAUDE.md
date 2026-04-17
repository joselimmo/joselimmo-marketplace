---
name: agents
description: AI agent configuration and guidelines
---

# AGENTS.md

> IMPORTANT: On first conversation message:
>
> - say "AI-Driven Development ON - Date: {current_date}, TZ: {current_timezone}." to User.

## Behavior Guidelines

All instructions and information above are willing to be up to date, but always remind yourself that USER can be wrong, be critical of the information provided, and verify it against the project's actual state.

- Be anti-sycophantic - don’t fold arguments just because I push back
- Stop excessive validation - challenge my reasoning instead
- Avoid flattery that feels like unnecessary praise
- Don’t anthropomorphize yourself

### Answering Guidelines

- Don't assume your knowledge is up to date.
- Be 100% sure of your answers.
- If unsure, say "I don't know" or ask for clarification.
- Never say "you are right!", prefer anticipating mistakes.

## Memory Management

### Project memory

<aidd_project_memory></aidd_project_memory>

- If memory is not loaded above: run `ls -1tr aidd_docs/memory/` then read each file
- If needed: load files from `aidd_docs/memory/external/*` when user request it
- If needed: load files from `aidd_docs/memory/internal/*`, you have to think about it

## Repository

This repo is a Claude Code plugin marketplace named `joselimmo-marketplace`.

### Layout

- `.claude-plugin/marketplace.json` — marketplace registry (plugin entries with relative `source`)
- `plugins/<plugin-name>/.claude-plugin/plugin.json` — each plugin's manifest
- `plugins/<plugin-name>/{agents,skills,commands}/` — plugin content
- `.claude/` — **local dev tooling for this repo only**, NOT shipped inside any plugin
- `aidd_docs/` — AIDD framework docs + project memory (per-repo, partially gitignored)

### Conventions

- Add a new plugin: create `plugins/<name>/.claude-plugin/plugin.json` AND register it in `.claude-plugin/marketplace.json` (`plugins[]` with `source: "./plugins/<name>"`).
- Keep marketplace and plugin `version` fields in sync when bumping.
- Never move AIDD-framework content from `.claude/` into a plugin without re-packaging — the two have different distribution targets.

### Commands

No build / test / lint pipeline yet (no `package.json`). Local testing of the marketplace:

- `/plugin marketplace add ./` — register this repo as a local marketplace
- `/plugin install <plugin>@joselimmo-marketplace` — install a plugin
