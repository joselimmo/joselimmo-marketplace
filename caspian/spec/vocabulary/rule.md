# `core:rule`

## Purpose

A `core:rule` artifact encodes one enforcement rule for tooling or agents
— *"DO NOT do X"*, *"ALWAYS do Y"*. Rules are the layer where the
project's policies become *checkable*: a rule is the input a linter, a
review skill, or an AI agent reads to know what to flag, block, or
auto-correct. The audience is the tooling that enforces the rule and,
secondarily, the humans who configure that tooling. A rule answers
*"what will get caught here?"* with enough specificity that the
enforcement is automatable.

## Sources

The pattern of project-level enforcement rules is rooted in the linting
tradition (lint, ESLint, Biome, RuboCop), in policy-as-code (OPA,
Conftest), and in agentic-framework rule layers (Cursor rules, Claude
Code's built-in tool-permission rules, Aider's edit-policy rules). The
Caspian `core:rule` formalizes the artifact so a rule is discoverable
and loadable as input to enforcement tooling regardless of the
underlying engine. Authors who want a rule shape with structured
preconditions, auto-fix metadata, or graduated severity follow the RFC
process in [`../CONTRIBUTING.md`](../CONTRIBUTING.md)
*(coming soon — Story 5.1)*.

## Identity

A `core:rule` is identified by a kebab-case slug describing the rule
(`no-secrets-in-fixtures.md`, `kebab-case-filenames.md`,
`always-cite-fixture-source.md`). Rules are mutable: as enforcement
matures, the rule's specifics tighten; deprecation of a rule produces a
new version of the rule file with the deprecation explicitly noted (or
the file is moved to a deprecated subfolder, project-level convention
choice). A project hosts as many rules as it needs; cross-references
between rules and ADRs are common (a rule cites the ADR that motivated
its creation).

## Use Boundaries

A `core:rule` is **not** a `core:convention`. The rule is *enforced* by
tooling — its existence implies a check that runs and either gates or
warns; the convention is *communicated* — its existence implies a shared
understanding that humans (and agents) follow voluntarily. A rule with
no enforcement is inert; a convention with enforcement should be moved
to a rule. A `core:rule` is **not** a `core:adr`. The rule encodes
*policy* (what is enforced); the ADR records *the decision* that
produced the policy (why the policy exists). A rule may cite the ADR
that motivated it; the two play different roles and both should exist
when the policy carries non-trivial trade-offs.

## Composition

`core:rule` artifacts are typically *consumed* by lint and review skills
that load the rule as input and apply it during checks, by AI agents
preparing changes (so they avoid producing rule-violating output), and
by documentation tooling that surfaces active rules to contributors. They
are typically *produced* by hand or by a rule-authoring skill that
distills patterns from `core:review` findings into enforceable checks.
An active component that enforces a rule declares
`requires: [{type: core:rule}]`, optionally with `tags` to scope to a
specific rule family (file naming, security, documentation, etc.).

## Anti-pattern

A rule that bundles many distinct checks into one file is harder to
enable, disable, or supersede individually — split into per-check files.
A rule with no source ADR or learning recorded leaves future readers
guessing why the rule exists; if challenged, no one can explain whether
removing the rule is safe. A rule that a tooling chain cannot actually
enforce is aspirational, not enforced — either upgrade the tooling or
demote the rule to a `core:convention` that is communicated rather than
checked.

## Examples

A minimal `core:rule` document carries `type` only:

```yaml
---
type: core:rule
---
```

A canonical fixture lives at
[`../../fixtures/valid/core-rule/minimal.md`](../../fixtures/valid/core-rule/minimal.md)
*(coming soon — Story 1.6)*.
