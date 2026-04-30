# Story 2.9: Editorial cleanup of public-facing documentation

Status: review

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
- `core/CHANGELOG.md` header references `Story 5.2` (a forward reference — handled by AC2 via "remove the label, keep the structural note")
- `diagnostics/CHANGELOG.md` references `Story 1.5`, `Story 1.8`, `AI-1`
- `examples/ci-integration/README.md` references `Epic 4` as a forward marker on the `caspian.dev` link (handled by AC4 via **replacement** with a user-facing equivalent — see "Forward-reference handling" in Dev Notes)

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

**Then** no line contains `NFR[0-9]`, `FR[0-9]`, `architecture.md:`, `Epic [0-9]`:

- Line 10: `"(NFR17, NFR20)"` → remove the parenthetical entirely; the sentence is self-explanatory.
- Line 48: `"per FR36"` → remove entirely; the sentence `"The validation step is exactly three YAML lines..."` needs no spec reference.
- Line 83: `"— see the project [README](../../README.md) and \`architecture.md:715-721\`"` → `"— see the project [README](../../README.md)"`. Remove the `architecture.md` line-number reference (users don't have that file).
- Line 87: `"(NFR20)"` → remove the parenthetical.
- Line 100: `"- [Caspian spec landing](https://caspian.dev) (Epic 4 — link goes live when the site ships)."` → `"- [Caspian spec landing](https://caspian.dev) — domain reserved; landing site under development."`. **Replace, do NOT delete the trailing context** — preserves the user-facing signal that the `caspian.dev` link may not be live yet, while removing the internal `Epic 4` label. (See "Forward-reference handling" in Dev Notes for the Story 4.1 follow-up sweep.)

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

- [x] **Task 1 — Rewrite `packages/cli/CHANGELOG.md` (AC1)**
  - [x] 1.1: Remove all `Story X.Y` prefixes/parentheticals from every bullet
  - [x] 1.2: Remove `NFR[N]`, `FR[N]`, `AC[N]` inline refs
  - [x] 1.3: Replace `B4 schema` with plain `"stable schema"` where it appears
  - [x] 1.4: Remove `closes Story X.Y deferred DX`, `Story X.Y surface unchanged`, `Story X.Y AC2's`
  - [x] 1.5: Read the result aloud mentally — does each bullet read like a release note a user would read on npmjs.com?

- [x] **Task 2 — Rewrite `packages/core/CHANGELOG.md` (AC2)**
  - [x] 2.1: Fix the file header (remove `Story 5.2` and `Story 2.5` refs from the two decoupling sentences)
  - [x] 2.2: Remove all `Story X.Y` inline references from bullets
  - [x] 2.3: Remove `closes Story X.Y deferred item DX` clauses
  - [x] 2.4: Remove `Stories 2.3–2.4` and similar ranges

- [x] **Task 3 — Fix `packages/core/README.md` (AC3)**
  - [x] 3.1: Remove `(Story 2.5+)` from line 9
  - [x] 3.2: Rewrite the Status section (lines 12-15) as specified in AC3

- [x] **Task 4 — Fix `examples/ci-integration/README.md` (AC4)**
  - [x] 4.1: Remove `(NFR17, NFR20)` from line 10
  - [x] 4.2: Remove `per FR36` from line 48
  - [x] 4.3: Remove `and \`architecture.md:715-721\`` from line 83
  - [x] 4.4: Remove `(NFR20)` from line 87
  - [x] 4.5: **Replace** `(Epic 4 — link goes live when the site ships)` on line 100 with `— domain reserved; landing site under development.` (do NOT delete the trailing context — preserves user-facing "site not yet live" signal; transitional marker is swept by Story 4.1 when `caspian.dev` ships)

- [x] **Task 5 — Fix `diagnostics/CHANGELOG.md` (AC5)**
  - [x] 5.1: Remove the `"originally scoped to Story 1.5..."` trailing clause from the W004 bullet

- [x] **Task 6 — Smoke gate (AC6)**
  - [x] 6.1: `pnpm lint` → exits 0, 66 files
  - [x] 6.2: `pnpm test` → 133 + 1 skipped
  - [x] 6.3: `pnpm build` → exits 0

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

### Forward-reference handling (rétrograde vs prospectif)

The story removes two categories of internal markers:

- **Backward references** (work already shipped: Stories 2.5–2.8, Stories 1.5/1.8, AI-1, NFR/FR/AC labels, `B4 schema`, `architecture.md:715-721`) → **pure removal** is safe. The marker no longer designates pending work; the canonical trace lives in `_bmad-output/{planning,implementation}-artifacts/` (out of npm publish scope).

- **Forward references** (work not yet shipped: `Story 5.2` in `core/CHANGELOG.md`, `Epic 4` in `examples/ci-integration/README.md` line 100) → **NOT pure removal**. These markers carry maintenance signal that pure deletion erases. Treatment:
  - `Story 5.2` (AC2): "remove the label, keep the structural note" — `Decoupled from spec-level semver (caspian/spec/CHANGELOG.md, Story 5.2)` becomes `Decoupled from spec-level semver (see caspian/spec/CHANGELOG.md)`. Structural fact preserved; identifier dropped.
  - `Epic 4` (AC4 / Task 4.5): **replacement, not deletion**. The user-facing signal "this link may not be live yet" is preserved as `domain reserved; landing site under development`. The `Epic 4` internal label is dropped.

#### Story 4.1 follow-up — pre-1.0 doc sweep

When Story 4.1 (`caspian-dev` landing page) ships and `caspian.dev` goes live, the transitional marker added by this story (`domain reserved; landing site under development.` in `examples/ci-integration/README.md` line 100) becomes stale. Story 4.1 should include a **pre-1.0 doc sweep** task:

```bash
grep -rn "under development\|domain reserved\|not yet live\|link goes live" caspian/**/*.md
```

→ reconcile each match with the now-shipped state (typically: drop the transitional clause, leaving the link bare). This sweep is the maintenance signal that survives the story 2.9 editorial cleanup.

### Writing style for rewritten bullets

Each CHANGELOG bullet should answer: "What can I do / what changed for me as a user?"

- Start with a noun phrase or a verb: `Initial release: ...`, `` `--format=json` output: ...``, `Vendor-neutrality enforcement: ...`
- Do not reference spec document sections
- Version numbers (`@caspian-dev/cli@0.1.0`, `yaml ^2.6.0`) are fine and useful
- File paths (`release.yml`, `codes.generated.ts`) are fine when they help users understand the artifact

### Cross-checks

- CC1: `grep -rn "Story [0-9]" packages/cli/CHANGELOG.md packages/core/CHANGELOG.md packages/core/README.md examples/ci-integration/README.md diagnostics/CHANGELOG.md` → zero results
- CC1b: `grep -rn "Epic [0-9]" packages/cli/CHANGELOG.md packages/core/CHANGELOG.md packages/core/README.md examples/ci-integration/README.md diagnostics/CHANGELOG.md` → zero results (catches the Epic-4 forward-reference handled by AC4 / Task 4.5)
- CC2: `grep -rn "NFR[0-9]\|FR[0-9][0-9]\|AC[0-9]" packages/cli/CHANGELOG.md packages/core/CHANGELOG.md examples/ci-integration/README.md` → zero results
- CC3: `grep -n "architecture\.md:" examples/ci-integration/README.md` → zero results
- CC4: `pnpm lint` → 66 files, exit 0
- CC5: `pnpm test` → 133 + 1 skipped, exit 0

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context) — dev-story workflow

### Debug Log References

Cross-checks (CC1, CC1b, CC2, CC3 + identification full pattern) all returned zero matches post-edit. Smoke gate: `pnpm lint` → 66 files exit 0; `pnpm test` → core 91 + cli 42 = 133 passed + 1 skipped exit 0; `pnpm build` → exit 0 (gen:codes 18 typed constants + copy-schemas 2 files + tsc both packages).

### Completion Notes List

- **Task 1** (cli/CHANGELOG.md, 4 bullets rewritten): dropped `(Story 2.5)`, `(Story 2.6)`, `Story 2.7:`, `Story 2.8:` prefixes; replaced `B4 schema` → `stable schema` (twice — line 8 and line 9 originals); removed `(NFR19)`, `(FR11, NFR17)`, `(FR36, vendor-neutral)` → `(vendor-neutral)`; rephrased `Story 2.5 AC2's "do NOT sort"` → contextual "fast-glob's default order proved non-deterministic"; dropped `(Story 2.5 surface unchanged)`, `(closes Story 2.5 deferred D2)`, `was leaking via the Story 2.5 build cache` → `was leaking via an earlier build cache`. The factual `41 → 40 entries` rebaseline is preserved; `41 files baseline` parenthetical was simplified to remove the now-stale absolute number ahead of the rebaseline statement on the same bullet.
- **Task 2** (core/CHANGELOG.md, header + 4 bullets): header rewrite per AC2 (Story 5.2 + Story 2.5 dropped, "see" inserted); `Pipeline stages 1–6 land in Stories 2.3–2.4.` → `Pipeline stages 1–6 implement the full validation path.`; bullet 5 dropped `(Story 2.6)` + `closes Story 2.5 deferred item D2` (kept the technical "replaces export-shape duck-typing" parenthetical); bullet 6 dropped `Story 2.7:` prefix + `by Story 2.8` → `for the v0.1.0 publish`; bullet 7 dropped `Story 2.8:` prefix + `this story is process / infra` → `this release is process / infra`.
- **Task 3** (core/README.md): line 9 `(Story 2.5+)` removed; Status section rewritten per AC3 (Epic 2 + Story 2.8 dropped; the `(stable public API, semver-compatible releases)` clarifying parenthetical was preserved per AC3 — flagged during validation as EN-2 but not changed since the validation pass only applied approved CR-1+CR-2 fixes).
- **Task 4** (ci-integration/README.md, 5 sites): lines 10, 87 NFR17/NFR20 parentheticals removed; line 48 `per FR36` removed; line 83 `architecture.md:715-721` reference removed; **line 100 replaced (not deleted)** — `(Epic 4 — link goes live when the site ships)` → `— domain reserved; landing site under development.` per AC4/Task 4.5 forward-reference handling. The replacement preserves the user-facing "site not yet live" signal and drops only the internal `Epic 4` label. Transitional marker scheduled for sweep when Story 4.1 ships per Dev Notes "Story 4.1 follow-up — pre-1.0 doc sweep".
- **Task 5** (diagnostics/CHANGELOG.md): trailing clause on the W004 bullet (`"originally scoped to Story 1.5; carried out as a post-Epic 1 spike (Story 1.8) per the Epic 1 retrospective action item AI-1."`) removed in one shot — this single removal eliminated all 4 forbidden patterns (`Story 1.5`, `Story 1.8`, `Epic 1` ×2, `AI-1`, `spike`, `retrospective action`). Sentence now ends at `spec/core.md line 82.`.
- **Task 6** (smoke gate): all three baselines preserved exactly. `pnpm lint` 66 files matches Story 2.8 floor (Markdown not biome-checked confirmed). `pnpm test` 133+1 skipped matches Story 2.8 baseline (zero source change to .ts → zero test count change). `pnpm build` clean (exit 0).
- **Cross-checks**: CC1 (`Story [0-9]`) zero matches across all 5 files. CC1b (`Epic [0-9]`) zero matches — confirms line 100 fix landed. CC2 (`NFR/FR/AC`) zero matches across cli/CHANGELOG.md + core/CHANGELOG.md + ci-integration/README.md. CC3 (`architecture.md:`) zero matches in ci-integration/README.md. Full identification pattern (10-alternation regex including `B4 schema`, `deferred D[0-9]`, `spike`, `AI-1`, `retrospective action`) returns zero matches across the 5 files. CC4 lint = 66 files exit 0. CC5 tests = 133+1 skipped exit 0.
- **No source mutation**: zero `.ts`/`.mjs`/`.json`/`.yml`/`.yaml` files modified. All edits restricted to the 5 target Markdown files. Per-package `package.json`, `tsconfig.json`, `biome.json`, CI workflows untouched.
- **`## Unreleased` heading preserved** in all three CHANGELOGs (cli, core, diagnostics) — `changesets version` will rotate it to `## 0.1.0` at release time as designed.
- **Validation findings not applied**: EN-1 (cli/CHANGELOG Story 2.7 example was misleading), EN-2 (AC3 Status rewrite added new content), EN-3 (NFR/FR enumeration), OP-1 (`## Unreleased` cross-check), OP-2 (Markdown-except parenthetical wording) were flagged during validation but not approved by the user; only CR-1 (line 100 replacement) + CR-2 (CC1b) were approved and applied.

### File List

**Modified (5 markdown files + 1 sprint-status):**
- `caspian/packages/cli/CHANGELOG.md` (4 bullets in `## Unreleased` rewritten)
- `caspian/packages/core/CHANGELOG.md` (header + 4 bullets in `## Unreleased` rewritten)
- `caspian/packages/core/README.md` (line 9 + Status section)
- `caspian/examples/ci-integration/README.md` (lines 10, 48, 83, 87, 100 — 5 sites)
- `caspian/diagnostics/CHANGELOG.md` (W004 bullet trailing clause removed)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (2-9 status: ready-for-dev → in-progress → review)

## Change Log

- 2026-04-30: Story 2.9 created (create-story workflow). Status: backlog → ready-for-dev. Editorial cleanup of public-facing docs discovered during Story 2.8 BMad code review — remove internal story/spec tracking labels from CHANGELOGs and examples before first npm publish.
- 2026-04-30: Story 2.9 validation pass (validate-story workflow). Adjusted AC4 + Task 4 to add line 100 of `examples/ci-integration/README.md` (`(Epic 4 — link goes live when the site ships)`) as a **forward-reference replacement** (not deletion), preserving the user-facing "site under development" signal. Added cross-check CC1b (`grep -rn "Epic [0-9]"` → zero results). Added Dev Notes section "Forward-reference handling" distinguishing backward (pure removal) vs forward (replacement) references, and documented a Story 4.1 pre-1.0 doc-sweep follow-up to retire transitional markers when `caspian.dev` ships.
- 2026-04-30: Story 2.9 implementation complete (dev-story workflow). Status: ready-for-dev → in-progress → review. Five `.md` files edited per AC1–AC5; AC6 smoke gate preserved exactly (lint 66 files / tests 133+1 skipped / build exit 0). All cross-checks (CC1, CC1b, CC2, CC3 + identification full pattern) return zero matches. Zero source mutation under `packages/{core,cli}/src/` or any non-Markdown file. Line 100 of `ci-integration/README.md` handled by **replacement, not deletion** per AC4/Task 4.5 — transitional marker `domain reserved; landing site under development` preserves user signal and is scheduled for Story 4.1 sweep.
