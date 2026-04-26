# `core:scratch`

## Purpose

A `core:scratch` artifact is a disposable working note: a sketch
clarifying an idea before it earns the permanence of an ADR, a
mid-implementation snippet capturing a thought that does not yet belong
in any other artifact, a draft message worked over before sending. The
type exists explicitly so that throwaway content has a home that does
not pollute the project's tracked-artifact corpus. The audience is the
author at the moment of writing; readability for others is not the
goal. A scratch answers *"where do I park this rough thought?"* without
committing to its survival.

## Sources

The pattern of intentionally throwaway notes is universal — REPL
sessions, paper notebooks, `tmp/` folders, and IDE scratchpads all serve
the same function. In agentic frameworks, scratch artifacts surface as
`scratch/`, `tmp/`, and `notes/` directories that sit outside the formal
artifact hierarchy. The Caspian `core:scratch` formalizes the type so
tooling can identify scratch content and exclude it from formal tracking
without requiring directory-name conventions. Authors who want a
structured scratch shape — with TTL metadata, auto-archival rules, or
tags for promotion candidates — follow the RFC process in
[`../CONTRIBUTING.md`](../CONTRIBUTING.md) *(coming soon — Story 5.1)*.

## Identity

A `core:scratch` artifact has no required stable identity: filenames are
ephemeral (`scratch-2026-04-26.md`, `note.md`, `tmp.md`), often
date-prefixed for chronological browsing but never required to be. The
artifact is mutable in the most permissive sense — overwrite, delete,
rename — because nothing depends on its persistence. A project hosts
scratch files freely; periodic cleanup is the only maintenance
discipline. When a scratch reaches a state worth keeping, the discipline
is to *promote* it: convert it to a `core:learning` (capture the
insight), a `core:adr` (capture the decision), or any other appropriate
type, and delete the scratch original.

## Use Boundaries

A `core:scratch` is **not** a `core:learning`. Scratch is intentionally
throwaway; a learning is a deliberate capture intended to survive and
inform future work. A scratch that survives weeks because it contains
something valuable should be *promoted* to a learning, not silently
preserved as scratch. A `core:scratch` is **not** any of the other
canonical types — using `core:scratch` instead of the appropriate type
for content that has earned permanence is a categorization error that
silently excludes the content from project tracking.

## Composition

`core:scratch` artifacts are rarely *consumed* by orchestration tooling
on purpose — most workflows that load project artifacts explicitly
filter out `core:scratch` to avoid acting on throwaway content. They are
typically *produced* by hand during exploratory work or by AI agents
generating intermediate output that is not yet ready for promotion to a
formal type. An active component that intentionally loads scratch
content (a *promote-scratch-to-learning* skill, for example) declares
`requires: [{type: core:scratch}]` explicitly so the inclusion is
deliberate.

## Anti-pattern

A scratch file that survives a sprint without being promoted, archived,
or deleted is a sign the content has earned a real type — promote it.
A scratch file that is referenced by stable artifacts (an ADR linking
to a scratch for context, for example) is no longer scratch — promote
the referenced content into the appropriate canonical type and update
the citation. Filling a project with `core:scratch` instead of using the
appropriate canonical type for content that warrants tracking
undermines every downstream tool that filters by type — the workflow
that ignores scratch by design will silently miss real content.

## Examples

A minimal `core:scratch` document carries `type` only:

```yaml
---
type: core:scratch
---
```

A canonical fixture lives at
[`../../fixtures/valid/core-scratch/minimal.md`](../../fixtures/valid/core-scratch/minimal.md)
*(coming soon — Story 1.6)*.
