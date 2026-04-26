# `core:learning`

## Purpose

A `core:learning` artifact captures one retrospective insight from work
already completed: *"We tried X. Y happened. Z is what we would do
differently."* Learnings convert post-hoc observation into reusable
context — they let the next person to face a similar situation skip the
same dead end or repeat the same successful approach. The audience is
future contributors and agents who pattern-match their current task
against the project's accumulated experience. A learning answers
*"what did we figure out from doing this?"* without prescribing future
work directly (that role belongs to `core:rule`, `core:convention`, or
`core:adr` if the learning warrants codification).

## Sources

The retrospective-learning pattern is rooted in agile practice
(sprint retrospectives, blameless postmortems) and the Toyota tradition
of *kaizen*. In agentic frameworks, learnings appear as `notes/` files,
`retrospectives/` folders, and project-memory layers — Letta and Mem0
explicitly carve out *episodic memory* for this kind of recall. The
Caspian `core:learning` formalizes the pattern as a typed artifact so
tooling can search, filter, and load learnings as context. Authors who
want a structured learning shape — with explicit *what-we-tried /
what-happened / what-we-would-do-differently* fields, or with linked
metrics — follow the RFC process in [`../CONTRIBUTING.md`](../CONTRIBUTING.md)
*(coming soon — Story 5.1)*.

## Identity

A `core:learning` is identified by a date prefix and a kebab-case slug
naming the insight (`2026-04-15-changesets-publish-flow.md`,
`2026-04-26-monorepo-package-naming.md`). The date prefix orders
learnings chronologically — useful when scanning for *what we figured out
recently*. Learnings are append-only: once written, the file is not
edited; new insight on the same topic produces a new learning that may
cite the predecessor. A project accumulates learnings indefinitely;
periodic distillation (turning a cluster of learnings into a
`core:convention` or `core:rule`) keeps the corpus from becoming
unsearchable.

## Use Boundaries

A `core:learning` is **not** a `core:adr`. The learning is *observational*
— it describes what was tried and what happened; the ADR is *decisional*
— it commits the team to a forward-looking choice with weighed
alternatives. A learning may motivate an ADR ("we observed X enough
times that we are now deciding to always do Y"); the ADR captures the
commitment, the learning records the data. A `core:learning` is **not**
a `core:review`. The review judges *one specific artifact*; the learning
generalizes across many. A `core:learning` is **not** a `core:scratch`.
Scratch is throwaway working notes; a learning is a deliberate capture
intended to survive and inform future work.

## Composition

`core:learning` artifacts are typically *produced* by retrospective
skills (sprint-end reviews, post-deployment audits) or by hand at the end
of a piece of work. They are *consumed* by AI agents loading project
memory before similar tasks, by review skills checking whether known
pitfalls were addressed, and by humans browsing the corpus before
revisiting a problem. An active component that needs prior insight
declares `requires: [{type: core:learning}]`, optionally with `tags` to
filter by topic.

## Anti-pattern

A learning that prescribes a forward-looking rule has overstepped —
extract the rule into a `core:rule` (enforced) or `core:convention`
(communicated) and let the learning record only what was observed. A
learning that judges a specific artifact has drifted into review
territory — capture the judgment as a `core:review` and link to it from
the learning if a generalizable insight emerges. A learning that
restates a recently captured decision instead of adding new observation
is noise — cite the existing ADR or learning instead of duplicating.

## Examples

A minimal `core:learning` document carries `type` only:

```yaml
---
type: core:learning
---
```

A canonical fixture lives at
[`../../fixtures/valid/core-learning/minimal.md`](../../fixtures/valid/core-learning/minimal.md)
*(coming soon — Story 1.6)*.
