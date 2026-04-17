# Architecture Decision Record (ADR)

This file contains the key architectural decisions made during the project, along with their context and consequences.

## Decision Log

| Date       | ID      | Title                                                                                | Consequences                                                 |
| ---------- | ------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| 2026-04-17 | DEC-001 | [Monorepo marketplace layout](./decisions/001-monorepo-marketplace-layout.md)        | One repo hosts many plugins; simpler publishing, coupled versioning |
| 2026-04-17 | DEC-002 | [`.claude/` is dev tooling, not shipped](./decisions/002-claude-folder-is-dev-tooling.md) | Clear boundary between repo tooling and distributed plugin content |
