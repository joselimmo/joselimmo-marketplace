# `core:convention`

## Purpose

A `core:convention` artifact codifies a stable team practice — *"we do it
this way here"* — communicated to humans and agents alike. Conventions
capture how the team writes commits, names files, structures branches,
formats code, ships changes, and a hundred other recurring choices that
shape day-to-day work. The audience is everyone who touches the project:
new contributors learning the ropes, AI agents preparing changes that
should match local style, reviewers checking for consistency. A
convention answers *"how do we usually do X here?"* with enough specificity
that the answer is reproducible.

## Sources

The pattern of project-level conventions traveled into agentic frameworks
through `AGENTS.md` (a top-level file communicating project conventions
to AI assistants), open-source contributor-guide files (the standard for
contributor expectations), Spec-kit's `constitution.md` (project
invariants), and the broader practice of style guides (e.g., the Google
style guides, the Airbnb JS guide). The Caspian `core:convention`
formalizes the pattern as a typed artifact so tooling can discover and
load conventions reliably. Authors who want a vendor-namespaced
convention variant — for example, a convention bundle scoped to a
specific framework or with structured field-by-field enforcement
metadata — follow the RFC process in [`../CONTRIBUTING.md`](../CONTRIBUTING.md)
*(coming soon — Story 5.1)*.

## Identity

A `core:convention` is identified by a kebab-case slug naming the
practice (`commit-message-format.md`, `branch-naming.md`,
`fixture-layout.md`). One convention per file is the normal case; a
convention bundle covering many practices is acceptable when the
practices are tightly related (a single `markdown-conventions.md`
capturing ATX headers, blank-line rules, and code-fence language tags
together). Conventions are mutable: as practices evolve, the file is
updated in place with a change-log section recording when each item
landed and why. A project hosts as many convention files as it needs;
duplication across files is a refactor signal, not an inherent feature.

## Use Boundaries

A `core:convention` is **not** a `core:rule`. The convention is
*communicated* — it tells readers how the team operates, but its
enforcement (if any) lives in tooling configured separately; the rule is
*enforced* — it encodes a check that tooling runs to gate or warn on
violations. A convention without enforcement is still useful (a shared
norm); a rule without enforcement is inert. A `core:convention` is
**not** a `core:adr`. The convention codifies *the practice as it stands
today*; the ADR records *the decision that produced the practice*. A
convention may cite the ADR that originated it.

## Composition

`core:convention` artifacts are typically *consumed* by review skills
checking work-in-progress against conventions, by lint/format tooling
that reads a convention file as configuration input, and by AI agents
loading conventions as context before authoring changes. They are
typically *produced* by a documentation skill (a `/document-convention`
command, hypothetical at v1.0) or by hand. An active component that
needs project conventions declares
`requires: [{type: core:convention}]`, optionally with `tags` to scope
to a specific practice family.

## Anti-pattern

A convention that contradicts a `core:rule` is a sign the rule and
convention have drifted out of sync — bring them together (the rule's
enforcement is the source of truth for what tooling actually checks; the
convention's prose is the source of truth for what humans expect). A
convention that grows past a single page typically benefits from being
split into focused per-practice files. A convention that *describes a
single decision and its alternatives* is mislabeled — that is a
`core:adr`.

## Examples

A minimal `core:convention` document carries `type` only:

```yaml
---
type: core:convention
---
```

A canonical fixture lives at
[`../../fixtures/valid/core-convention/minimal.md`](../../fixtures/valid/core-convention/minimal.md)
*(coming soon — Story 1.6)*.
