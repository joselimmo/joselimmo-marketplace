# Minimal Skill Adoption Example

This walkthrough shows what changes when an existing
[Anthropic SKILL.md](https://docs.anthropic.com/en/docs/claude-code/skills)
adopts Caspian Core. The artifact stays loadable in any
Anthropic-compatible host; Caspian fields are purely additive
(overlay-compatible per FR5).

## What changes

Two files in this directory are byte-identical except for the Caspian
frontmatter additions at the top of `after/SKILL.md`:

- [`before/SKILL.md`](./before/SKILL.md) — vanilla Anthropic SKILL.md
  with the 6 canonical fields (`name`, `description`, `license`,
  `allowed-tools`, `metadata`, `compatibility`).
- [`after/SKILL.md`](./after/SKILL.md) — same file plus the Caspian
  frontmatter delta.

Run `diff before/SKILL.md after/SKILL.md` to see the additions in
isolation.

## The 4-line frontmatter delta

The Caspian Core contract is **four fields**. Three are optional; only
`type` is required. The actual number of YAML lines added depends on
which optional fields you include and whether you write them in block
or flow style — the **4-field surface** is the invariant, not a fixed
line count.

| Field | Optionality | Purpose |
|---|---|---|
| `schema_version` | OPTIONAL (defaults to `"0.1"` in v1.0) | The minor schema generation the producer writes against. Producers writing against v0.2+ MUST declare it explicitly so consumers can detect the producer's target minor. |
| `type` | **REQUIRED** | The artifact's typed identity in `<vendor>:<name>` form. Here `examples:greeter`. |
| `requires` | OPTIONAL | An array of `{type, tags?, count?}` entries declaring this active component's typed preconditions. Documents typically omit it. |
| `produces` | OPTIONAL | An object `{type}` declaring the typed postcondition this active component emits on successful completion. |

See [`../../spec/core.md`](../../spec/core.md) for the full normative
contract and the 22-field overlay-compatibility model.

## Reading the diff

```diff
+ schema_version: "0.1"
+ type: examples:greeter
+ produces:
+   type: core:scratch
  name: greeter
  description: Greet a user by name with a polite, time-of-day-aware salutation.
  license: Apache-2.0
  allowed-tools:
    - Read
  metadata:
    author: examples
    version: "1.0.0"
  compatibility:
    agentskills: "1.0"
```

No agentskills.io canonical field is removed or modified. A host that
ignores Caspian fields entirely loads the artifact unchanged.

## Why these specific Caspian fields here

- `schema_version: "0.1"` is optional in v1.0 (consumers default to
  `"0.1"` when absent) but stating it explicitly makes the producer's
  target generation unambiguous. Always quote it as a string —
  unquoted `0.1` parses as a YAML float and trips the schema's
  string-type check.
- `type: examples:greeter` declares the artifact's identity in the
  `<vendor>:<name>` namespacing convention (FR4). The `examples:`
  vendor namespace is what an author would invent for their own
  ecosystem-specific kinds; canonical types live under `core:*`.
- `produces: {type: core:scratch}` declares that this skill emits a
  transient salutation — semantically a `core:scratch` per the
  canonical vocabulary. Active components (skills, commands, agents)
  carry `produces`; documents omit it.
- `requires` is omitted here because the greeter has no typed
  preconditions. Active components that consume artifacts of a
  specific type would declare it (for example, a planner skill might
  declare `requires: [{type: core:story}]`).
