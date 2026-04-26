# Caspian Core — Normative Reference (v1.0)

> This document is the normative reference for the Caspian Core v1.0
> frontmatter contract. A plugin author with no prior Caspian context
> should grasp it in ≤10 minutes (FR33). Companion artifacts are out of
> scope here: per-`core:*`-type rationale lives in [`vocabulary/`](./vocabulary/),
> the machine-readable contract lives in
> [`../schemas/v1/envelope.schema.json`](../schemas/v1/envelope.schema.json),
> and diagnostic codes live in [`../diagnostics/registry.json`](../diagnostics/registry.json).

## Notation

The keywords MUST, MUST NOT, REQUIRED, SHALL, SHALL NOT, SHOULD, SHOULD
NOT, RECOMMENDED, MAY, and OPTIONAL in this document are to be
interpreted as described in RFC 2119 and RFC 8174 when, and only when,
they appear in all capitals. Lowercase use of these words carries no
normative weight. Field names and code identifiers are written in
backticks (for example, `type`, `requires`, `<vendor>:<name>`).

## Overview

Caspian Core defines four YAML frontmatter fields — `schema_version`,
`type`, `requires`, `produces` — that turn any Markdown artifact (skill,
command, agent, or document) into a typed, composable unit. The
contract is intentionally minimal: producers declare what they need and
what they emit; consumers match by type. Caspian fields coexist with
the agentskills.io canonical fields and the Claude Code overlay fields;
authors MAY mix all three vocabularies in the same frontmatter without
conflict. Vendor-defined extensions are reserved through the `x-*`
prefix and the `<vendor>:<name>` namespace, leaving room for
ecosystem-specific evolution without contention. The remainder of this
document specifies each field's shape and semantics, the
overlay-compatibility model, the extension mechanisms, and the
backward-compatibility guarantee that governs future minor versions.

## The Four Fields

### `schema_version` {#schema-version}

`schema_version` is **OPTIONAL** in v1.0. When absent, consumers MUST
treat the artifact as declaring `schema_version: "0.1"` — the v1.0
default. Producers writing against any minor version greater than
`"0.1"` (for example, a hypothetical `"0.2"`) MUST declare
`schema_version` explicitly so consumers can detect the producer's
target minor and choose whether to apply forward-compatible handling.
The value is a string in `MAJOR.MINOR` form; patch components are not
recognized. Unrecognized values trigger the `CASPIAN-W003` warning and
do not invalidate the artifact.

Example:

```yaml
---
schema_version: "0.1"
type: core:story
---
```

### `type` {#type}

`type` is **REQUIRED**. Its value is a non-empty string of the form
`<namespace>:<name>`, where `<namespace>` is a vendor or framework
identifier and `<name>` is the artifact kind. Canonical Caspian types
live under the reserved `core:*` namespace (for example, `core:story`,
`core:plan`); authors MAY define their own namespaces for vendor- or
framework-specific kinds (for example, `bmad:epic`, `maya:lint-rule`).
A value missing the colon, or with an empty namespace or name, is
rejected. Non-`core:*` namespaces are accepted and emit the
`CASPIAN-W002` warning so authors who intend a canonical type can spot
typos.

Example:

```yaml
---
type: core:story
---
```

### `requires` {#requires}

`requires` is **OPTIONAL**. When present, it is an array of objects
declaring this artifact's typed preconditions. Each entry has the
following shape:

- `type` — REQUIRED string. The required artifact's `type`.
- `tags` — OPTIONAL array of strings. Refines matching when multiple
  artifacts of the same `type` are eligible.
- `count` — OPTIONAL positive integer. Number of matching artifacts the
  consumer expects. Absent means "one or more".

Resolution by anything beyond `type` is out of scope for v1.0 (see
[Resolution Semantics — Out of Scope](#resolution-semantics--out-of-scope-for-v10-normative-seal)).

Example:

```yaml
---
type: core:plan
requires:
  - type: core:story
---
```

### `produces` {#produces}

`produces` is **OPTIONAL**. When present, it is an object declaring
the typed postcondition this artifact emits on successful completion:

- `type` — REQUIRED string when `produces` is present. The `type` of
  the artifact this skill, command, or agent emits.

`produces` describes a single output kind: a successful run produces
exactly one artifact of the declared type. Tooling MAY treat a
successful run that does not emit the declared `type` as a contract
violation.

Example:

```yaml
---
type: core:plan
requires:
  - type: core:story
produces:
  type: core:plan
---
```

#### Where the fields apply

`requires` and `produces` are semantically attached to **active
components** — skills, commands, and agents — that consume
preconditions and emit postconditions. **Documents** (passive output
artifacts produced by an active component, such as a `core:story`
written to disk) carry only `type`. The four-field contract is
universal in scope: any Caspian artifact MAY declare any of the four
fields. Documents that omit `requires` and `produces` are conformant;
active components that omit them are conformant too, though tooling
will not be able to plan around them.

## Overlay-Compatibility {#overlay-compatibility}

A Caspian-conformant artifact's frontmatter MAY declare any combination
of fields drawn from three tiers. The 22 known fields are listed below
exactly once, grouped by tier; unknown fields outside these tiers
trigger the `CASPIAN-W001` warning but never invalidate the artifact.

| Tier | Vocabulary | Count | Fields |
|---|---|---|---|
| 1 | Caspian Core | 4 | `schema_version`, `type`, `requires`, `produces` |
| 2 | agentskills.io canonical | 6 | `name`, `description`, `license`, `allowed-tools`, `metadata`, `compatibility` |
| 3 | Claude Code overlay | 12 | `when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `model`, `effort`, `context`, `agent`, `hooks`, `paths`, `shell` |

Every documented Anthropic SKILL.md field remains valid inside a
Caspian-conformant artifact (FR5, NFR13, NFR16). A host that ignores
Caspian fields entirely loads the artifact unchanged; a Caspian
validator presented with Claude Code overlay fields warns on nothing
because all 22 fields are recognized.

## Extension Mechanisms

### `x-*` extension prefix

Any field whose name begins with `x-` is reserved for vendor or
experimental use (FR6). Caspian validators MUST accept `x-*` fields
without warning and MUST NOT validate their contents. The prefix
guarantees forward-compatibility: a future minor version cannot
introduce a Caspian-defined field starting with `x-`, so authors can
adopt new `x-*` fields without conflict.

Example:

```yaml
---
type: core:story
x-bmad-confidence: high
---
```

### Vendor namespacing (`<vendor>:<name>`)

Authors MAY define their own `type` values under a vendor or framework
namespace (for example, `bmad:epic`, `maya:lint-rule`). Vendor
namespaces are accepted by the validator (with the `CASPIAN-W002`
warning attached) so the spec does not gatekeep ecosystem evolution.
Promoting a vendor type to the canonical `core:*` namespace follows
the RFC process documented in [`CONTRIBUTING.md`](./CONTRIBUTING.md)
*(coming soon — Story 5.1)*.

## Canonical Vocabulary {#core-vocabulary}

The canonical `core:*` vocabulary — `core:overview`, `core:epic`,
`core:story`, `core:plan`, `core:adr`, `core:convention`,
`core:learning`, `core:glossary`, `core:review`, `core:rule`,
`core:scratch` — is documented per-type under [`vocabulary/`](./vocabulary/)
*(coming soon — Story 1.3; the directory may be empty when this
document first ships)*. Each per-type document covers Purpose,
Sources, Identity, Use Boundaries, Composition, Anti-pattern, and
Examples. The anchor `#core-vocabulary` is consumed by `caspian.dev`
and by the CLI's diagnostic doc URLs; it MUST remain stable across
spec minor versions.

## Schema Evolution

Schema evolution is **BACKWARD_TRANSITIVE** within a major version
(FR27, NFR22): changes between minor versions are additive-only.
Producers MAY write at the latest minor version; consumers MUST
accept the current minor and all prior minor versions within the same
major. No breaking changes occur between minor versions within the
same major; breaking changes require a major-version bump and a
parallel `schemas/vN/` path that lives alongside the existing one.

The fields `status`, `supersedes`, and `superseded_by` are
**deliberately not reserved** in v1.0. Their operational semantics have
not been sufficiently challenged, and any v1.0 reservation forecloses
later design choices that the BACKWARD_TRANSITIVE rule would otherwise
permit. Adding any of them as OPTIONAL fields in a later minor version
is BACKWARD_TRANSITIVE-compliant — additive restoration is cheap;
removal is expensive. The same logic applies to any artifact-identity
or supersession model: v1.0 stays small so v1.x can stay flexible.

## Resolution Semantics — Out of Scope for v1.0 (Normative Seal)

> *"v1.0 consumers MUST NOT assume forward-compatibility on resolution
> semantics. Future spec versions may introduce filters that v1.0
> consumers cannot honor."*

Type-based matching is the only resolution semantic v1.0 commits to.
When multiple candidate artifacts share a required `type`,
multi-candidate disambiguation is implementation-defined: a consumer
MAY pick the first match, prompt the user, or apply any other policy
it sees fit. v1.0 places no constraint on that choice and grants no
forward-compatibility guarantee that future filter additions
(`status`, tag selectors, capability negotiation, and so on) will be
ignorable. Implementations that depend on "every artifact present in
the workspace is eligible for matching" hold that invariant by
implementation choice, not by spec contract.

## Out of Scope

The following are deliberately out of scope for Caspian Core v1.0:

- Per-`core:*`-type JSON Schemas. v1.0 ships a single envelope schema; type-specific shape rules are an orchestration concern.
- Composition rules between types. Which `core:*` types may consume which is the responsibility of the orchestrating tool, not the spec.
- Resolution filters beyond `type`. See the seal above.
- Artifact identity and `id` models. Artifact equivalence is name-and-`type`-based at v1.0.
- Lifecycle metadata (`status`, `supersedes`, `superseded_by`, timestamps). Deferred per the BACKWARD_TRANSITIVE additive-restoration rule.

## Conformance

A Caspian-conformant artifact MUST validate against
[`../schemas/v1/envelope.schema.json`](../schemas/v1/envelope.schema.json)
*(coming soon — Story 1.4)* without any `error`-severity diagnostics.
Warnings are permitted. The reference Node implementation lives in
[`../packages/core/`](../packages/core/) *(coming soon — Epic 2)* and
emits stable `CASPIAN-EXXX` / `CASPIAN-WXXX` codes from the diagnostic
registry.

## See Also

- [`README.md`](./README.md) — 5-minute introduction to this directory.
- [`vocabulary/`](./vocabulary/) — per-`core:*` rationale *(coming soon — Story 1.3)*.
- [`../schemas/v1/envelope.schema.json`](../schemas/v1/envelope.schema.json) — envelope JSON Schema *(coming soon — Story 1.4)*.
- [`../diagnostics/registry.json`](../diagnostics/registry.json) — diagnostic codes *(coming soon — Story 1.5)*.
- [`../examples/minimal-skill-adoption/`](../examples/minimal-skill-adoption/) — 4-line frontmatter delta *(coming soon — Story 1.7)*.
