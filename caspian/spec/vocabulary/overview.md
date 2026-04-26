# `core:overview`

## Purpose

A `core:overview` artifact is the project-level orientation document: what
the project is, who it is for, and what its goals are. It is the single
narrative entry point a new contributor or agent reads first to ground every
subsequent question in the right context. The audience is broad — plugin
authors, orchestration tools, human reviewers, and AI agents picking up the
project mid-work all benefit from the same shared frame. An overview answers
the question *"why does this exist and where is it going?"* in prose; it
does not enumerate features (that is the role of `core:epic`) and it does
not define terms (that is the role of `core:glossary`).

## Sources

The convention is informed by the AGENTS.md pattern (a top-level orientation
file consumed by AI assistants), by README-driven development (the practice
of writing the project's README before its code), and by the Spec-kit
*constitution* file (a project-level invariant document that binds every
downstream specification). The reference workflow [`casper-core`](../../plugins/casper-core/)
*(coming soon — Story 3.1)* produces `core:overview` artifacts via its
`/init-project` command. Authors who want to propose a vendor-namespaced
overview variant follow the RFC process in
[`../CONTRIBUTING.md`](../CONTRIBUTING.md) *(coming soon — Story 5.1)*.

## Identity

A `core:overview` is uniquely identified by the project itself: there is
typically one overview per project, located at a conventional path
(commonly the project root or a top-level `docs/` directory) with a stable
filename. The artifact is mutable — the overview is updated as the project
evolves — but its file path is stable so cross-references resolve over
time. A repository MAY host multiple overview artifacts when it contains
multiple distinct projects (a monorepo with independent products), in
which case each project's overview lives at the project's own root.

## Use Boundaries

A `core:overview` is **not** a `core:glossary`. The overview is the *why*
narrative — the goals, the audience, the strategic frame; the glossary is
a per-term reference that defines vocabulary without explaining motivation.
A `core:overview` is **not** a `core:adr`. The overview describes the
project's current understanding; an ADR records a single decision made at
a single point in time and is immutable thereafter. When the overview's
narrative changes because of a decision, the decision belongs in an ADR,
and the overview cites it.

## Composition

`core:overview` artifacts are typically *produced* by an `/init-project`
skill (the casper-core reference workflow's first command) and *consumed*
by every downstream skill that needs project context — `/discover`
generating epics and stories, code-review skills checking alignment to
project goals, agent skills loading the file as context. An active
component that depends on project context declares
`requires: [{type: core:overview, count: 1}]` and matches the single
overview in the workspace.

## Anti-pattern

An overview that lists every feature in detail has drifted into epic
territory — split the feature lists into one or more `core:epic` artifacts
and keep the overview at the strategic-frame level. An overview edited to
record a specific decision (with alternatives weighed) has drifted into
ADR territory — capture the decision as a `core:adr` and update the
overview to reference it. Overviews that grow past two or three pages are
a code-smell: the orientation function works only when the document stays
scannable in a few minutes.

## Examples

A minimal `core:overview` document carries `type` only — overviews are
documents, not active components, so `requires` and `produces` are absent
by convention.

```yaml
---
type: core:overview
---
```

A canonical fixture lives at
[`../../fixtures/valid/core-overview/minimal.md`](../../fixtures/valid/core-overview/minimal.md)
*(coming soon — Story 1.6)*.
