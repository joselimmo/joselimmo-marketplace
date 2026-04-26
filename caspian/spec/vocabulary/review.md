# `core:review`

## Purpose

A `core:review` artifact records a peer review or code-review judgment of
one specific artifact. The review captures findings (issues raised,
patches proposed, items dismissed, items deferred), the reviewer's
identity, and the date the review was conducted. The audience is the
implementer (who needs to act on the findings), the team (who tracks the
review's outcome), and future readers (who want to understand what was
checked and what was missed). A review answers *"what does this artifact
look like through fresh eyes?"* without generalizing the findings into
project-wide patterns (that role belongs to `core:learning` if a
generalizable insight emerges).

## Sources

Code-review and design-review records are universal in software practice;
the modern GitHub pull-request review interface, Phabricator's
Differential, Gerrit's review history, and academic-paper peer review all
share the *judgment-of-one-artifact-at-one-point-in-time* shape. In
agentic frameworks, reviews appear as outputs of review-oriented skills
(BMad's `code-review`, the Superpowers verification phase, Spec-kit's
review steps). The Caspian `core:review` formalizes the artifact so a
review record is discoverable and machine-readable as the output of a
review skill. Authors who want a review shape with structured severity
breakdowns or auto-generated summary metrics follow the RFC process in
[`../CONTRIBUTING.md`](../CONTRIBUTING.md) *(coming soon — Story 5.1)*.

## Identity

A `core:review` is identified by the artifact reviewed plus the reviewer
plus the date, conventionally encoded as
`review-<artifact-key>-<reviewer>-<date>.md` or by appending a Review
section to the reviewed artifact's own file. Both styles are accepted at
v1.0 — the choice is project-level. Reviews are append-only: once a
review is recorded, its findings remain in the file; follow-up reviews
on the same artifact produce new review records. A given artifact may
accumulate multiple reviews over its lifetime.

## Use Boundaries

A `core:review` is **not** a `core:learning`. The review judges *one
specific artifact* at one point in time; the learning generalizes
observations across many situations. A review may surface a learning
("the team keeps shipping the same kind of bug"), but the learning lives
as its own artifact citing the reviews that originated it. A
`core:review` is **not** a `core:rule`. The review evaluates against
existing rules and conventions; if the review surfaces that a *new* rule
is needed, the rule lives as its own `core:rule` artifact, not inside
the review.

## Composition

`core:review` artifacts are typically *produced* by code-review and
peer-review skills that declare
`requires: [{type: <reviewed-type>, count: 1}]` and emit
`produces: {type: core:review}`. They are *consumed* by the implementer
acting on findings, by progress-tracking dashboards, and by retrospective
skills that distill review outcomes into `core:learning` artifacts. An
active component that needs prior reviews of a given artifact (for
example, to check whether previously raised issues were addressed) loads
them with `requires: [{type: core:review}]` and matches by tag.

## Anti-pattern

A review that judges a *category* of artifacts rather than one specific
artifact has drifted into rule or learning territory — extract the
generalizable finding and keep the review focused. A review edited
silently after the implementer responded loses the audit trail; the
discipline is to append responses and follow-ups rather than rewrite the
original findings. A review with no severity or actionability marked
against each finding leaves the implementer guessing about priority — a
finding worth recording is worth marking as *must-fix*, *should-fix*,
*nice-to-have*, *deferred*, or *dismissed*.

## Examples

A minimal `core:review` document carries `type` only:

```yaml
---
type: core:review
---
```

A canonical fixture lives at
[`../../fixtures/valid/core-review/minimal.md`](../../fixtures/valid/core-review/minimal.md)
*(coming soon — Story 1.6)*.
