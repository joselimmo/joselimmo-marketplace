# Decision: Monorepo marketplace layout

| Field   | Value                  |
| ------- | ---------------------- |
| ID      | DEC-001                |
| Date    | 2026-04-17             |
| Feature | marketplace-scaffold   |
| Status  | Accepted               |

## Context

We need to ship a Claude Code plugin marketplace (`joselimmo-marketplace`) and will likely author multiple plugins over time.

## Decision

Host the marketplace and all plugins in a single repo: `.claude-plugin/marketplace.json` at root, each plugin under `plugins/<name>/.claude-plugin/plugin.json`, referenced via relative `source: "./plugins/<name>"`.

## Alternatives Considered

| Alternative                    | Pros                              | Cons                                          | Rejected because                     |
| ------------------------------ | --------------------------------- | --------------------------------------------- | ------------------------------------ |
| One repo per plugin            | Independent versioning, small diffs | Repo sprawl, duplicated marketplace overhead  | Overkill for a single author         |
| Flat layout (no `plugins/`)    | Slightly shorter paths            | Doesn't scale past 1 plugin, mixes with docs  | Breaks as soon as plugin #2 is added |

## Consequences

- Simpler publishing and discovery (one marketplace entry = one repo).
- Plugins share CI, tooling, and issue tracker.
- Versions may drift unless explicitly kept in sync between `marketplace.json` and each `plugin.json`.
