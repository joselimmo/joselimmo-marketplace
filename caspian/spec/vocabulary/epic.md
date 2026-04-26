# `core:epic`

## Purpose

A `core:epic` artifact bundles a set of related stories that together
deliver one feature or capability. The epic is the unit at which a feature
is *scoped and sequenced*: it states the user outcome, lists the stories
that compose the feature, and records dependencies on other epics. The
audience is the team planning and tracking the feature — product managers
sequencing work, developers picking the next story, agents traversing the
hierarchy. An epic answers *"what feature are we delivering and which
stories make it up?"* without descending into per-story acceptance criteria
(those live in each `core:story`).

## Sources

The epic-as-feature-bundle pattern comes from agile delivery practice
(epics span multiple sprints; stories fit inside one) and is adopted by
BMad-Method, Agent OS, and Spec-kit, each with minor variations in the
expected fields. The reference workflow [`casper-core`](../../plugins/casper-core/)
*(coming soon — Story 3.1)* produces `core:epic` artifacts via its
`/discover` command, alongside the constituent `core:story` artifacts.
Vendor-namespaced epic variants — for example `bmad:epic` — exist in the
ecosystem and remain valid Caspian artifacts under the `<vendor>:<name>`
convention. The RFC process in [`../CONTRIBUTING.md`](../CONTRIBUTING.md)
*(coming soon — Story 5.1)* governs proposals to refine the canonical
`core:epic` semantics.

## Identity

A `core:epic` is identified by an epic title and a stable epic number
(an integer). The filename convention uses a full `epic-N-` prefix:
`epic-1-spec-foundation.md`, `epic-2-cli-validator.md`. When the epic
number appears as a component inside a story key, it is the bare integer
(`1-3-canonical-core-vocabulary-docs`, not `epic-1-3-...`). Epics are
mutable: their story lists grow as scope is refined and shrink as stories
are cut, but the epic number itself is stable. A project hosts multiple
epics; the set of epics over time forms the project's roadmap.

## Use Boundaries

A `core:epic` is **not** a `core:plan`. The epic groups *requirements*
(stories) at the feature level; the plan captures the *implementation
shape* of one specific story. The two operate at different scopes and
different points in the workflow. A `core:epic` is **not** a
`core:overview`. The overview is the project-level frame describing the
*why*; an epic is a feature-level frame describing *what* one feature
delivers. An overview cites epics; epics cite stories.

## Composition

`core:epic` artifacts are typically *produced* by a `/discover` skill (the
casper-core reference workflow's second command) — the same invocation
that emits the constituent `core:story` artifacts. An epic is *consumed*
by sprint-planning skills, by progress-tracking dashboards, and by
documentation-generation skills that flatten epics into release notes. A
consumer that needs the full epic context declares
`requires: [{type: core:epic, count: 1}]` and matches the relevant epic
by tag or by name within the workspace.

## Anti-pattern

An epic that contains exactly one story is a sign the requirement does not
warrant epic-level scoping — promote the story directly. An epic that
spans dozens of stories is a sign the feature has grown beyond a single
unit of delivery — split into two epics with explicit sequencing. An epic
edited mid-sprint to add stories without sprint-replanning quietly
inflates scope; the discipline is to capture the new work as a separate
epic-amendment proposal so the team's commitment remains traceable.

## Examples

A minimal `core:epic` document carries `type` only — epics are documents,
not active components, so `requires` and `produces` are absent by
convention.

```yaml
---
type: core:epic
---
```

A fuller epic document carries the agentskills.io canonical `name` and
`description` fields alongside Caspian's `type`, and remains conformant by
overlay-compatibility (see [`../core.md#overlay-compatibility`](../core.md#overlay-compatibility)):

```yaml
---
type: core:epic
name: spec-foundation
description: Plugin authors can read the spec, browse the vocabulary, and adopt the contract on their own plugin without the CLI.
---
```

A canonical fixture lives at
[`../../fixtures/valid/core-epic/minimal.md`](../../fixtures/valid/core-epic/minimal.md)
*(coming soon — Story 1.6)*.
