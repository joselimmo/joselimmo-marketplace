---
schema_version: "0.1"
type: examples:greeter
produces:
  type: core:scratch
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
---

# Greeter Skill

A minimal example skill that greets a user by name with a salutation
appropriate to the time of day.

## When to Use

Trigger when the user introduces themselves by name or asks for a
greeting.
