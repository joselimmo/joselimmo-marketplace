# `core:plan`

## Purpose

A `core:plan` artifact captures the implementation shape for one specific
story: the ordered tasks, the files to create or modify, the tests to
write, and the verification steps. The plan is the unit at which a story
is *executed*: a developer or AI agent reads the plan, walks the tasks in
order, and emits the code. The audience is the implementer — human or
agent. A plan answers *"how exactly do we build this story?"* without
restating *what* the user needs (that lives in the parent `core:story`).

## Sources

The pattern of a separate plan-the-document distinct from the
requirement-the-document is shared by Spec-kit (the `/plan` command
producing `plan.md`), Agent OS (the `create-tasks` step), BMad-Method
(the dev-story format with embedded tasks), and Superpowers (the
plan-then-code phase gate). The reference workflow
[`casper-core`](../../plugins/casper-core/) *(coming soon — Story 3.1)*
produces `core:plan` artifacts via its `/plan-story` command, which
declares `requires: [{type: core:story, count: 1}]` and emits the plan as
its typed postcondition. Vendor variants — for example a plan format that
embeds Mermaid sequence diagrams or a plan that bundles its own test
fixtures — follow the namespace-extension path in
[`../core.md#extension-mechanisms`](../core.md#extension-mechanisms). The
RFC process in [`../CONTRIBUTING.md`](../CONTRIBUTING.md)
*(coming soon — Story 5.1)* governs proposals to refine the canonical
`core:plan` shape.

## Identity

A `core:plan` is identified by its parent story key plus an optional plan
revision number. The conventional filename is `<story-key>.plan.md` for
single-revision plans, or `<story-key>.plan-<n>.md` when the plan has been
rewritten (an earlier plan was abandoned in favor of a new approach;
multiple revisions remain in the repository for history). Plans are
mutable in early authoring; once execution begins, they become
append-only with explicit task-status updates rather than rewrites. A
single story typically has one plan; multi-revision plans are the
exception and indicate either a major scope shift or a learning-driven
re-approach.

## Use Boundaries

A `core:plan` is **not** a `core:story`. The story states the requirement
and acceptance criteria; the plan describes the executable shape. Mixing
the two — embedding implementation details in the story or restating user
value in the plan — collapses the deliberate separation that makes the
story stable across implementation changes. A `core:plan` is **not** a
`core:epic`. The epic groups stories at feature scope; a plan belongs to
exactly one story.

## Composition

`core:plan` artifacts are *produced* by a `/plan-story` skill that
declares `requires: [{type: core:story, count: 1}]` and `produces: {type:
core:plan}`. They are *consumed* by execution skills (a `/dev-story`
command that walks the plan's tasks and emits code), by review skills
that audit the plan against the parent story's acceptance criteria, and
by retrospective skills that compare the executed-vs-planned task list.
A plan-the-document MAY by convention carry forward its production
lineage by including `requires: [{type: core:story}]` in its own
frontmatter, even though documents typically omit `requires` and
`produces`; the convention makes the plan's parent story machine-readable
without requiring tooling to scan the prose.

## Anti-pattern

A plan that lists tasks without naming concrete files or tests has not
yet earned the *plan* label — it is still a sketch. A plan rewritten
silently mid-execution loses traceability of what changed and why; the
discipline is to mark the original plan complete (or abandoned with a
recorded reason) and start a new revision. A plan that contains
acceptance-criteria language has absorbed story content — move the
criteria back to the parent `core:story` so the requirement remains the
single source of truth for *what done means*.

## Examples

A minimal `core:plan` document carries `type` only:

```yaml
---
type: core:plan
---
```

A plan that records its production lineage by convention carries
`requires` even though it is a document:

```yaml
---
type: core:plan
requires:
  - type: core:story
---
```

A canonical fixture lives at
[`../../fixtures/valid/core-plan/minimal.md`](../../fixtures/valid/core-plan/minimal.md)
*(coming soon — Story 1.6)*.
