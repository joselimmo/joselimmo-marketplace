# `core:adr`

## Purpose

A `core:adr` artifact records one architecturally-significant decision
with its context, the alternatives considered, the chosen option, and the
consequences. Each ADR captures a single decision at a single point in
time and explains the *why* — the constraints, trade-offs, and
information available when the decision was made. The audience is anyone
who later needs to understand why the system looks the way it does:
contributors evaluating a refactor, reviewers spotting drift, agents
planning changes that touch the same domain. ADRs document decisions so
that revisiting them later requires understanding the original context,
not guessing it.

## Sources

The ADR pattern was articulated by **Michael Nygard** in *"Documenting
Architecture Decisions"* (2011) — the foundational industry source that
introduced the now-standard `Context / Decision / Status / Consequences`
sections and the convention of numbered, append-only decision files. The
pattern has been adopted across the software industry, refined into
variants such as MADR and Y-statements, and ported into agentic
frameworks. **BMad-Method** uses the term ADR for solution-design-decision
documents that capture trade-offs surfaced during architecture work and
serves as one of the upstream conventions informing Caspian's ADR
semantics. **Agent OS** also adopts ADR-style decision records as part of
its planning surface, demonstrating that the pattern travels naturally
across agentic frameworks regardless of host or methodology. Authors who
want to propose a vendor-namespaced ADR variant — for example, an ADR
shape that bundles a structured impact analysis or links to specific test
suites — follow the RFC process in [`../CONTRIBUTING.md`](../CONTRIBUTING.md)
*(coming soon — Story 5.1)* to propose promotion or refinement.

## Identity

A `core:adr` is identified by a numeric prefix followed by a kebab-case
slug — for example, `001-resolution-semantics-out-of-scope.md`,
`002-warn-on-unknown-fields.md`. The numeric prefix orders ADRs in the
sequence they were accepted; gaps are tolerated when an ADR is
abandoned before acceptance. ADRs are immutable once accepted: a decision
that needs revision is captured in a new ADR that supersedes the
predecessor by referencing its number in prose. The lifecycle metadata
fields `supersedes` and `superseded_by` are deliberately not in the v1.0
contract (see [`../core.md#schema-evolution`](../core.md#schema-evolution)),
so the supersession relationship lives in the ADR text itself for v1.0;
adding the fields as OPTIONAL in a future minor version is
BACKWARD_TRANSITIVE-compliant.

## Use Boundaries

A `core:adr` is **not** a `core:learning`. An ADR captures a *forward-looking
decision* with its rationale; a learning captures a *backward-looking
observation* about work already done. Decisions constrain future work;
learnings inform future decisions but are themselves descriptive, not
prescriptive. A `core:adr` is **not** a `core:rule`. An ADR documents
*one decision once*, immutable in its file; a rule encodes *enforcement*
of a stable policy across many artifacts and is updated as the policy
evolves. A rule MAY cite an ADR as its source — *"this rule exists
because of ADR-007"* — but the rule and the ADR play different roles. A
note that mixes decision context with enforcement language is a refactor
candidate: extract the rule, leave the ADR pure.

## Composition

`core:adr` artifacts are typically *produced* by a hypothetical decision-
capture skill (no v1.0 casper-core command emits ADRs; v1.1+ workflows
MAY) and *consumed* by `core:rule` artifacts that cite their source ADR,
by `core:convention` artifacts that reference the ADR codifying the
convention, by code-review skills checking that proposed changes do not
violate accepted ADRs, and by human readers tracing the *why* of the
system. An active component that loads accepted ADRs as context declares
`requires: [{type: core:adr}]`, optionally with `tags` to filter by
domain.

## Anti-pattern

An ADR that bundles multiple decisions is a refactoring opportunity —
split it into one ADR per decision so each can be superseded
independently. An ADR edited months after acceptance to "update" the
decision is no longer an ADR; the edit either belongs in a successor ADR
that explicitly supersedes the predecessor, or it is a `core:learning`
capturing how the team's understanding evolved. ADRs MUST NOT be deleted
from the repository — the historical record is the value, even when the
decision is later reversed. An ADR with no Consequences section recorded
at acceptance time is an anti-pattern because the discipline of forecasting
trade-offs is precisely what an ADR forces; without it the artifact has
not earned the label.

## Examples

A minimal `core:adr` document carries `type` only — ADRs are documents,
not active components, so `requires` and `produces` are absent by
convention.

```yaml
---
type: core:adr
---
```

A canonical fixture lives at
[`../../fixtures/valid/core-adr/minimal.md`](../../fixtures/valid/core-adr/minimal.md)
*(coming soon — Story 1.6)*. The fixture demonstrates the minimal valid
envelope; the prose body of a real ADR follows the Nygard sections
(Context / Decision / Status / Consequences) inside the markdown body
below the frontmatter.
