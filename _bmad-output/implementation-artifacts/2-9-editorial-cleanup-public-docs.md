# Story 2.9: Editorial cleanup of public-facing documentation

Status: ready-for-dev

## Story

As a plugin author discovering Caspian on npm or GitHub,
I want to read documentation that speaks to me as a user — not as an internal developer,
so that I can adopt the tool without stumbling on internal tracking labels like "Story 2.5", "NFR17", or "architecture.md:715".

## Working Directory

All paths resolve **inside `caspian/`**. Files under `_bmad-output/` are the only exception.

This story touches **documentation and changelog files only**. Zero edits to `.ts` source, `.json` schemas, `.mjs` scripts, `tsconfig`, `biome.json`, `package.json`, or any CI workflow.

## Background

Stories 2.1–2.8 shipped the Caspian v0.1.0 CLI. During Story 2.8's code review, it was found that the public-facing docs still carry internal development artefacts:

- CHANGELOG bullets prefixed with `Story X.Y:` or `(Story X.Y)` — dev-tracking markers irrelevant to an npm user
- References to internal spec labels: `NFR17`, `NFR20`, `FR36`, `AC[N]`, `B4 schema`
- References to internal docs with line numbers: `architecture.md:715-721`
- Story-progress text in READMEs: `"shipped from Story 2.8"`, `"Story 2.5+"`, `"Epic 2"`
- `core/CHANGELOG.md` header references `Story 5.2` (a future epic)
- `diagnostics/CHANGELOG.md` references `Story 1.5`, `Story 1.8`, `AI-1`

**The CHANGELOG entries are critical** because `changesets version` will rotate `## Unreleased` to `## 0.1.0` at the first publish — making these internal markers permanently visible in the published package on npmjs.com.

## Acceptance Criteria

### AC1 — `packages/cli/CHANGELOG.md` rewritten as user-facing release notes

**Given** `caspian/packages/cli/CHANGELOG.md`

**When** I read the `## Unreleased` section (which will become `## 0.1.0` at publish time)

**Then** no bullet contains: `Story [0-9]`, `NFR[0-9]`, `FR[0-9]`, `AC[0-9]`, `B4 schema`, `deferred D[0-9]`

**And** each bullet describes WHAT the feature does, in terms a CLI user cares about. The internal tracking label is replaced by a plain verb phrase.

**And** the `## Unreleased` heading is preserved (changesets rotates it at release time — do NOT rotate it manually).

**And** the introductory paragraph at the top of the file is preserved verbatim.

**Example rewrites:**
- `Initial CLI surface (Story 2.5): caspian validate <path>...` → `Initial release: \`caspian validate <path>\` accepting file / directory / glob inputs...`
- `--format=json machine-readable output (Story 2.6) with stable B4 schema...` → `\`--format=json\` machine-readable output with stable schema (\`schemaVersion: "1"\`...)`
- `Story 2.7: external caspian/conformance/ suite...` → `Vendor-neutrality: 3-layer enforcement — source-level dependency scan...`
- `Story 2.8: First public npm release...` → `First public npm release as \`@caspian-dev/cli@0.1.0\`...`
- Remove `closes Story 2.5 deferred D2`, `Story 2.5 AC2's`, `Story 2.5 surface unchanged` → rephrase naturally

**And** NFR references are replaced by plain English: `(NFR19)` → omit or rephrase as "deterministic across runs".

### AC2 — `packages/core/CHANGELOG.md` rewritten as user-facing release notes

**Given** `caspian/packages/core/CHANGELOG.md`

**When** I read the file

**Then** no bullet contains: `Story [0-9]`, `closes Story`, `deferred item`, `Stories 2.3–2.4`, `Story 5.2`

**And** the file header is rewritten:
- `"Decoupled from spec-level semver (caspian/spec/CHANGELOG.md, Story 5.2)"` → `"Decoupled from spec-level semver (see caspian/spec/CHANGELOG.md)"` — remove the Story 5.2 ref only, keep the structural note.
- `"and from the CLI semver (caspian/packages/cli/CHANGELOG.md, Story 2.5)"` → `"and from the CLI semver (see caspian/packages/cli/CHANGELOG.md)"`.

**And** the `## Unreleased` heading is preserved.

**Example rewrites:**
- `"Pipeline stages 1–6 land in Stories 2.3–2.4."` → omit the parenthetical entirely or rephrase as `"Pipeline stages 1–6 implement the full validation path."`
- `"closes Story 2.5 deferred item D2 (replaces export-shape duck-typing...)"` → `"Canonical iteration source for downstream consumers."` — drop the "closes" sentence.
- `"wired into release.yml by Story 2.8"` → `"wired into release.yml for the v0.1.0 publish"`

### AC3 — `packages/core/README.md` removes story and epic references

**Given** `caspian/packages/core/README.md`

**When** I read it

**Then** no line contains `Story [0-9]`, `Epic [0-9]`:
- Line 9: `"The \`caspian\` binary lives in [\`@caspian-dev/cli\`](../cli/) (Story 2.5+)."` → `"The \`caspian\` binary lives in [\`@caspian-dev/cli\`](../cli/)."`
- Lines 13-15 (Status section): `"Pre-1.0 — public API is stabilizing across Epic 2. The first published version is \`0.1.0\`, shipped from Story 2.8."` → `"Pre-1.0 — the first published version is \`0.1.0\`. The semver promise (stable public API, semver-compatible releases) applies from \`1.0.0\` onward."`

**And** all other content is preserved verbatim.

### AC4 — `examples/ci-integration/README.md` removes internal spec labels

**Given** `caspian/examples/ci-integration/README.md`

**When** I read it

**Then** no line contains `NFR[0-9]`, `FR[0-9]`, `architecture.md:`:

- Line 10: `"(NFR17, NFR20)"` → remove the parenthetical entirely; the sentence is self-explanatory.
- Line 48: `"per FR36"` → remove entirely; the sentence `"The validation step is exactly three YAML lines..."` needs no spec reference.
- Line 83: `"— see the project [README](../../README.md) and \`architecture.md:715-721\`"` → `"— see the project [README](../../README.md)"`. Remove the `architecture.md` line-number reference (users don't have that file).
- Line 87: `"(NFR20)"` → remove the parenthetical.

**And** no other content is changed.

### AC5 — `diagnostics/CHANGELOG.md` removes story and spike references

**Given** `caspian/diagnostics/CHANGELOG.md`

**When** I read the `## Unreleased` section

**Then** no line contains `Story [0-9]`, `spike`, `AI-1`, `retrospective action item`:
- `"originally scoped to Story 1.5; carried out as a post-Epic 1 spike (Story 1.8) per the Epic 1 retrospective action item AI-1."` → remove this parenthetical entirely. The fact that W004 was reserved is what matters; the internal tracking of how it was decided is irrelevant to registry users.

**And** the Governance section and the initial registry entry are preserved verbatim.

### AC6 — Smoke gate preserved

**When** I run `pnpm lint` from `caspian/`

**Then** it exits 0 with 66 biome-checked files (Markdown files are not biome-checked — the count is unchanged).

**And** `pnpm test` still reports 133 + 1 skipped (no source change).

**And** `pnpm build` exits 0.

## Tasks / Subtasks

- [ ] **Task 1 — Rewrite `packages/cli/CHANGELOG.md` (AC1)**
  - [ ] 1.1: Remove all `Story X.Y` prefixes/parentheticals from every bullet
  - [ ] 1.2: Remove `NFR[N]`, `FR[N]`, `AC[N]` inline refs
  - [ ] 1.3: Replace `B4 schema` with plain `"stable schema"` where it appears
  - [ ] 1.4: Remove `closes Story X.Y deferred DX`, `Story X.Y surface unchanged`, `Story X.Y AC2's`
  - [ ] 1.5: Read the result aloud mentally — does each bullet read like a release note a user would read on npmjs.com?

- [ ] **Task 2 — Rewrite `packages/core/CHANGELOG.md` (AC2)**
  - [ ] 2.1: Fix the file header (remove `Story 5.2` and `Story 2.5` refs from the two decoupling sentences)
  - [ ] 2.2: Remove all `Story X.Y` inline references from bullets
  - [ ] 2.3: Remove `closes Story X.Y deferred item DX` clauses
  - [ ] 2.4: Remove `Stories 2.3–2.4` and similar ranges

- [ ] **Task 3 — Fix `packages/core/README.md` (AC3)**
  - [ ] 3.1: Remove `(Story 2.5+)` from line 9
  - [ ] 3.2: Rewrite the Status section (lines 12-15) as specified in AC3

- [ ] **Task 4 — Fix `examples/ci-integration/README.md` (AC4)**
  - [ ] 4.1: Remove `(NFR17, NFR20)` from line 10
  - [ ] 4.2: Remove `per FR36` from line 48
  - [ ] 4.3: Remove `and \`architecture.md:715-721\`` from line 83
  - [ ] 4.4: Remove `(NFR20)` from line 87

- [ ] **Task 5 — Fix `diagnostics/CHANGELOG.md` (AC5)**
  - [ ] 5.1: Remove the `"originally scoped to Story 1.5..."` trailing clause from the W004 bullet

- [ ] **Task 6 — Smoke gate (AC6)**
  - [ ] 6.1: `pnpm lint` → exits 0, 66 files
  - [ ] 6.2: `pnpm test` → 133 + 1 skipped
  - [ ] 6.3: `pnpm build` → exits 0

## Dev Notes

### Guardrails — what NOT to do

- **DO NOT** change `## Unreleased` to `## 0.1.0` — `changesets version` does this in the release PR.
- **DO NOT** edit any `.ts`, `.mjs`, `.json` (except Markdown) file.
- **DO NOT** change the bullet **structure** (one bullet per feature area) — only remove/rephrase the internal tracking labels within each bullet.
- **DO NOT** remove factual technical content (versions, dependency names, behavior descriptions).
- **DO NOT** run `pnpm changeset version` locally — it deletes the `.changeset/0001-initial-public-release.md` file.
- **DO NOT** modify `packages/cli/README.md` — it has no story references (confirmed: grep returned zero matches).

### Identification pattern

A quick grep to find all occurrences before starting:
```bash
grep -rn "Story [0-9]\|NFR[0-9]\|FR[0-9][0-9]\|AC[0-9]\|architecture\.md:\|B4 schema\|deferred D[0-9]\|Epic [0-9]\|spike\|AI-1\|retrospective action" \
  packages/cli/CHANGELOG.md \
  packages/core/CHANGELOG.md \
  packages/core/README.md \
  examples/ci-integration/README.md \
  diagnostics/CHANGELOG.md
```

Run this from `caspian/` to get a full list before editing.

### Writing style for rewritten bullets

Each CHANGELOG bullet should answer: "What can I do / what changed for me as a user?"

- Start with a noun phrase or a verb: `Initial release: ...`, `` `--format=json` output: ...``, `Vendor-neutrality enforcement: ...`
- Do not reference spec document sections
- Version numbers (`@caspian-dev/cli@0.1.0`, `yaml ^2.6.0`) are fine and useful
- File paths (`release.yml`, `codes.generated.ts`) are fine when they help users understand the artifact

### Cross-checks

- CC1: `grep -rn "Story [0-9]" packages/cli/CHANGELOG.md packages/core/CHANGELOG.md packages/core/README.md examples/ci-integration/README.md diagnostics/CHANGELOG.md` → zero results
- CC2: `grep -rn "NFR[0-9]\|FR[0-9][0-9]\|AC[0-9]" packages/cli/CHANGELOG.md packages/core/CHANGELOG.md examples/ci-integration/README.md` → zero results
- CC3: `grep -n "architecture\.md:" examples/ci-integration/README.md` → zero results
- CC4: `pnpm lint` → 66 files, exit 0
- CC5: `pnpm test` → 133 + 1 skipped, exit 0

## Dev Agent Record

### Agent Model Used

_to be filled_

### Debug Log References

_to be filled_

### Completion Notes List

_to be filled_

### File List

**Modified (5 files):**
- `caspian/packages/cli/CHANGELOG.md`
- `caspian/packages/core/CHANGELOG.md`
- `caspian/packages/core/README.md`
- `caspian/examples/ci-integration/README.md`
- `caspian/diagnostics/CHANGELOG.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (status flip)

## Change Log

- 2026-04-30: Story 2.9 created (create-story workflow). Status: backlog → ready-for-dev. Editorial cleanup of public-facing docs discovered during Story 2.8 BMad code review — remove internal story/spec tracking labels from CHANGELOGs and examples before first npm publish.
