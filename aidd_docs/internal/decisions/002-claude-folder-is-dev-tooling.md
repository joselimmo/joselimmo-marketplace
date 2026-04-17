# Decision: `.claude/` is dev tooling, not shipped

| Field   | Value                |
| ------- | -------------------- |
| ID      | DEC-002              |
| Date    | 2026-04-17           |
| Feature | marketplace-scaffold |
| Status  | Accepted             |

## Context

This repo contains both an AIDD-powered development setup (`.claude/` with agents, commands, rules, skills) and the distributed plugin content (under `plugins/`). They risk being conflated.

## Decision

`.claude/` is strictly **local dev tooling for this repo**. Plugin content that we ship to users lives only under `plugins/<name>/`. Nothing in `.claude/` is bundled into a plugin without explicit re-packaging.

## Alternatives Considered

| Alternative                                         | Pros                                 | Cons                                            | Rejected because                      |
| --------------------------------------------------- | ------------------------------------ | ----------------------------------------------- | ------------------------------------- |
| Treat `.claude/` as the first plugin                | Zero duplication                     | Mixes AIDD dev workflow with shipped product    | Distribution targets differ           |
| Symlink shared items from `.claude/` into a plugin  | DRY                                  | Fragile on Windows, confusing ownership         | Re-packaging is clearer than symlinks |

## Consequences

- Clear boundary: contributors know what is internal vs. shipped.
- Some content may be duplicated when a dev tool graduates to a shipped plugin.
- `.claude/` remains gitignored (per `.gitignore`); shipped plugins are always tracked.
