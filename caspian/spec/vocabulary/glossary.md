# `core:glossary`

## Purpose

A `core:glossary` artifact defines the project's domain or technical terms
in one place. It is pure reference: each entry is a term plus a
definition, with no narrative arc beyond the alphabetical or logical
ordering chosen for readability. The audience is anyone — human or agent
— who encounters a term and needs an authoritative definition without
hunting through prose. A glossary answers *"what does this term mean
inside this project?"* and nothing more; it is not the place for
strategic framing (that is `core:overview`), decision history (that is
`core:adr`), or codified practice (that is `core:convention`).

## Sources

Glossary documents are a long-standing convention in technical writing
and product specifications; the IEEE Standard Glossary of Software
Engineering Terminology and ISO/IEC vocabulary standards exemplify the
pattern at industrial scale. In agentic-framework practice, glossaries
appear as `glossary.md` files at project roots, in `docs/` folders, and
inside Spec-kit's reference docs. The Caspian `core:glossary` formalizes
the pattern so tooling can load the glossary as context and resolve
unfamiliar terms automatically. Authors who want a richly structured
glossary — with cross-references, etymologies, or per-term metadata —
follow the RFC process in [`../CONTRIBUTING.md`](../CONTRIBUTING.md)
*(coming soon — Story 5.1)*.

## Identity

A `core:glossary` is identified by a filename — most commonly
`glossary.md` at a conventional location, or scoped per domain
(`glossary-architecture.md`, `glossary-api.md`) when one project hosts
multiple distinct vocabularies. Glossaries are mutable: terms are added
as the project's vocabulary grows; existing definitions are sharpened
when ambiguity is discovered. A project typically has one primary
glossary; multi-glossary projects are common in monorepos with
domain-isolated subprojects. The glossary file's path is stable so
cross-references resolve over time.

## Use Boundaries

A `core:glossary` is **not** a `core:overview`. The glossary defines
*terms* one at a time without narrative arc; the overview is the
project-level *narrative* that explains why the project exists and what
it is for. A reader who needs both opens both. A `core:glossary` is
**not** a `core:convention`. The glossary defines *what a term means*;
a convention defines *how the team uses* a practice. A term defined in
the glossary may be the subject of a convention (defining the term
*epic* in the glossary; codifying *how we write epic files* as a
convention).

## Composition

`core:glossary` artifacts are typically *consumed* by AI agents loading
project context, by documentation tooling that auto-links terms in prose,
and by reviewers checking that proposed prose uses the project's
canonical terms consistently. They are typically *produced* by hand or
by a documentation skill that distills terms from across a project's
artifacts. An active component that needs to resolve a term declares
`requires: [{type: core:glossary, count: 1}]`.

## Anti-pattern

A glossary entry that explains *why* a term was chosen instead of an
alternative has drifted into ADR territory — keep the glossary entry to
the definition and capture the rationale separately as a `core:adr` if
warranted. A glossary that grows past a few hundred entries without
internal structure becomes unsearchable — split by domain. A glossary
edited to *change* a term's definition (rather than refine it) breaks
existing cross-references silently — record the change in a paired
`core:learning` or `core:adr` so readers can trace the evolution.

## Examples

A minimal `core:glossary` document carries `type` only:

```yaml
---
type: core:glossary
---
```

A canonical fixture lives at
[`../../fixtures/valid/core-glossary/minimal.md`](../../fixtures/valid/core-glossary/minimal.md)
*(coming soon — Story 1.6)*.
