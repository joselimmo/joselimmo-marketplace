# `core:story`

## Purpose

A `core:story` artifact captures one user-facing requirement expressed in
the As-a / I-want / So-that pattern. The story is the unit at which work
is *committed and tracked*: it is the smallest deliverable that produces
end-user value, with explicit acceptance criteria and a clear definition
of done. The audience is the team executing the work — developers
implementing, reviewers verifying, agents driving the lifecycle. A story
answers *"what does the user need and how do we know we delivered it?"*
without prescribing the implementation approach (that belongs in
`core:plan`).

## Sources

The user-story format with the As-a / I-want / So-that template traces back
to Mike Cohn (*User Stories Applied*, 2004) and the broader XP / Scrum
tradition. BMad-Method, Agent OS, and Spec-kit all adopt the pattern with
project-specific extensions for AI-assisted execution (linking dev-notes,
test plans, and acceptance criteria). The reference workflow
[`casper-core`](../../plugins/casper-core/) *(coming soon — Story 3.1)*
produces `core:story` artifacts via its `/discover` command, paired with
the parent `core:epic`. Authors who want a richer story shape — embedded
test plans, BDD-formatted acceptance criteria, or links to design specs —
typically extend through agentskills.io overlay fields rather than
proposing a new `core:` variant. Vendor-specific shapes (for example,
`bmad:story` with framework-specific dev-notes structure) follow the
namespace-extension path in [`../core.md#extension-mechanisms`](../core.md#extension-mechanisms).
The RFC process in [`../CONTRIBUTING.md`](../CONTRIBUTING.md)
*(coming soon — Story 5.1)* governs proposals to refine the canonical
`core:story` semantics.

## Identity

A `core:story` is identified by its story key, conventionally
`<epic>-<story>-<slug>` (for example, `1-3-canonical-core-vocabulary-docs`).
The numeric prefix orders stories within their epic; the slug carries the
human-readable name. The filename mirrors the key with a `.md` extension.
Stories are mutable while their status is `backlog` or `ready-for-dev`,
become append-only-with-explicit-permission once `in-progress`, and are
sealed once marked `done` (further changes happen via new stories or
`core:learning` follow-ups). The story key is stable across the entire
lifecycle.

## Use Boundaries

A `core:story` is **not** a `core:plan`. The story states *what* a user
needs and *how the team knows it is done*; the plan states *how the team
will build it* (tasks, files, tests). The two are deliberately split so
the story remains stable while the implementation shape evolves. A
`core:story` is **not** a `core:epic`. The epic is the feature-level
bundle; the story is one of the epic's constituent units. An epic without
stories is a stub; a story outside an epic is a free-standing
improvement (some teams allow this, some require every story to live
under an epic for traceability).

## Composition

`core:story` artifacts are typically *produced* by a `/discover` skill
(the casper-core reference workflow's second command) and *consumed* by
`/plan-story` (which declares `requires: [{type: core:story, count: 1}]`
and emits a `core:plan`), by review skills, and by progress dashboards. A
story belongs to one epic by convention; the parent-epic linkage is
recorded in the story's prose or in an overlay field, not as a normative
Caspian field at v1.0.

## Anti-pattern

A story that grows past a one-page acceptance-criteria list has drifted
into epic territory — split it. A story that prescribes implementation
details (which library, which file layout, which function signatures) has
absorbed plan content — move the implementation shape into a `core:plan`
and keep the story focused on user value and acceptance. A story marked
`done` whose acceptance criteria were never verified is the most common
project-rot pattern; the discipline is to gate `done` on verifiable
evidence captured in the story's completion notes or in a paired
`core:review`.

## Examples

A minimal `core:story` document carries `type` only — stories are
documents, not active components, so `requires` and `produces` are absent
by convention.

```yaml
---
type: core:story
---
```

A canonical fixture lives at
[`../../fixtures/valid/core-story/minimal.md`](../../fixtures/valid/core-story/minimal.md)
*(coming soon — Story 1.6)*.
