---
schema_version: "0.1"
type: core:overview
requires:
  - type: core:overview
produces:
  type: core:overview
name: overlay-compat-fixture
description: Demonstrates that all 22 recognized fields coexist in one envelope without diagnostics.
license: Apache-2.0
allowed-tools:
  - Read
  - Write
metadata:
  author: caspian-fixtures
compatibility:
  agentskills: "1.0"
when_to_use: When the validator must prove the 22 known fields parse cleanly together.
argument-hint: "<noop>"
arguments:
  - name: noop
    description: Placeholder argument for fixture purposes.
disable-model-invocation: "false"
user-invocable: "true"
model: claude-opus-4-7
effort: low
context:
  - "*.md"
agent: caspian-validator
hooks:
  on_load: noop
paths:
  - .
shell: bash
---

Overlay-compatibility fixture: exercises all 22 recognized frontmatter fields in one envelope (4 Caspian core + 6 agentskills.io canonical + 12 Claude Code overlay) to verify no W001 fires.
