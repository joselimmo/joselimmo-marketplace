# Canonical `core:*` Vocabulary

The `core:` namespace is the only namespace reserved by the Caspian Core spec.
The eleven canonical names listed here cover the artifact kinds that
agentic workflows produce most often — project briefs, feature breakdowns,
implementation plans, decision records, conventions, learnings, and so on.
Each per-type document is rationale and use guidance, not a per-type schema:
the contract lives in [`../core.md`](../core.md), and v1.0 ships exactly one
envelope schema (Story 1.4) that validates every `core:*` artifact uniformly.
A name not listed here is not part of the canonical vocabulary; authors who
need a different kind define a vendor-namespaced type (`<vendor>:<name>`,
for example `bmad:epic`, `maya:lint-rule`) and follow the RFC process at
[`../CONTRIBUTING.md`](../CONTRIBUTING.md) *(coming soon — Story 5.1)* to
propose promotion to `core:*` when adoption warrants it.

## The 11 Canonical Types

The list below preserves the canonical order published in
[`../core.md`](../core.md#core-vocabulary). The order is semantically
meaningful: chain-driving types first (orientation → feature → requirement
→ implementation), decision and policy types next, supporting and utility
types last. Each entry links to the per-type rationale doc.

- [`core:overview`](./overview.md) — Project-level orientation: what the project is, who it is for, and what its goals are.
- [`core:epic`](./epic.md) — A bundle of related stories that together deliver one feature or capability.
- [`core:story`](./story.md) — One user-facing requirement expressed as As-a / I-want / So-that.
- [`core:plan`](./plan.md) — The implementation plan for a single story: tasks, files, and tests.
- [`core:adr`](./adr.md) — One architecturally-significant decision with its context, alternatives, choice, and consequences.
- [`core:convention`](./convention.md) — A stable, codified team practice ("we do it this way here") communicated to humans and agents.
- [`core:learning`](./learning.md) — A captured retrospective insight from work already done.
- [`core:glossary`](./glossary.md) — Domain or project term definitions; pure reference.
- [`core:review`](./review.md) — A peer review or code-review record judging one specific artifact.
- [`core:rule`](./rule.md) — An enforcement rule for tooling or agents ("DO NOT do X" / "ALWAYS do Y").
- [`core:scratch`](./scratch.md) — Disposable working notes, excluded from formal artifact tracking by convention.

## The 7-Section Template

Every per-type document follows the same seven `##` sections in the same
order. The template makes the docs scannable: a reader skimming for use
boundaries always finds them in the same place, regardless of which type
they are evaluating.

1. **Purpose** — What this type is for. The single problem it solves and the audience it serves (plugin author, orchestration tool, human reader).
2. **Sources** — Prior art, ecosystem precedents, and project-internal sources informing the type's semantics. Citations name sources by name with attribution; URLs are optional.
3. **Identity** — How an artifact of this type is uniquely identified: filename convention, optional ID prefix, mutability (immutable / append-only / mutable), and supersession behavior. Single-instance versus multi-instance is stated explicitly.
4. **Use Boundaries** — What this type is *not*. Each per-type doc names the most-confusable adjacent canonical types and contrasts them in one sentence.
5. **Composition** — How the type composes with other canonical types: which types typically *consume* it (declare it in their `requires`), which typically *produce* it (declare it in their `produces`), and which orchestration patterns instantiate it.
6. **Anti-pattern** — The most-common authoring mistake for this type and its remedy. Framed as *"X is a code-smell — split / move / promote / delete it because Y."*
7. **Examples** — At minimum: one fenced YAML frontmatter snippet showing the canonical envelope. May include a cross-reference to a fixture under [`../../fixtures/valid/`](../../fixtures/valid/) *(coming soon — Story 1.6)*.

The template's section count and order are fixed for v1.0. Adding or
reordering sections is a spec-level change governed by the RFC process.

## License

All files in this directory are licensed under **CC-BY-4.0** by inheritance
from [`../LICENSE.md`](../LICENSE.md).
