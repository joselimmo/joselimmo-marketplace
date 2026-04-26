# Story 1.3: Canonical `core:*` vocabulary docs

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a plugin author choosing a `type` for my new artifact,
I want a per-`core:*` rationale document covering purpose, sources, and use boundaries,
So that I pick the right canonical type without ambiguity, or invent a clean vendor-namespaced extension when no canonical type fits.

## Working Directory

All paths in this story resolve **inside `caspian/`** — the sub-monorepo that hosts the Caspian project under the surrounding `joselimmo-marketplace-bmad` repository. Any reference like `spec/vocabulary/README.md` resolves to `caspian/spec/vocabulary/README.md`. Never create files at the repository root or anywhere outside `caspian/spec/vocabulary/` for this story (with the single exception of the sprint-status file under `_bmad-output/implementation-artifacts/`).

## Acceptance Criteria

**AC1.** `caspian/spec/vocabulary/README.md` exists and lists **all 11 canonical `core:*` types** — `overview`, `epic`, `story`, `plan`, `adr`, `convention`, `learning`, `glossary`, `review`, `rule`, `scratch` — with a one-line summary each (epics line 513). The order in the listing is the canonical order published in `caspian/spec/core.md` line 220–223.

**AC2.** `caspian/spec/vocabulary/README.md` documents the **7-section template** every per-type doc follows (epics line 514). The seven sections are, in order: **Purpose**, **Sources**, **Identity**, **Use Boundaries**, **Composition**, **Anti-pattern**, **Examples**. The README explains each section's intent in one paragraph.

**AC3.** All **11 per-type files** exist under `caspian/spec/vocabulary/` (epics line 518): `overview.md`, `epic.md`, `story.md`, `plan.md`, `adr.md`, `convention.md`, `learning.md`, `glossary.md`, `review.md`, `rule.md`, `scratch.md`. Filenames are kebab-case lowercase. No additional types and no aliases.

**AC4.** Each per-type file follows the **7-section template** in the order defined in AC2 (epics line 519). Each file uses ATX headers (`#`, `##`), one blank line between sections, and fenced code blocks with a language tag.

**AC5.** Each per-type file targets **fast scan: ≤500 lines / ≈2 pages** (epics line 520). The dev agent verifies line count after authoring.

**AC6.** `caspian/spec/vocabulary/adr.md` — the AC-mandated representative deep-dive — satisfies three additional constraints (epics lines 522–526):
  - The **Sources** section cites prior art with attribution: the industry ADR pattern (Michael Nygard, *"Documenting Architecture Decisions"*, 2011), the BMad-Method ADR conventions, and the Agent OS ADR conventions. Each citation names the source by name; URLs are optional.
  - The **Use Boundaries** section states explicitly what `core:adr` is **NOT**: it is not a `core:learning`, and it is not a `core:rule`. The differences are stated in one sentence each.
  - The **Examples** section cross-references **at least one fixture** under `fixtures/valid/` with the inline annotation *"coming soon — Story 1.6"*. The reference uses a relative path (`../../fixtures/valid/...`) so the link resolves on GitHub once Story 1.6 merges.

**AC7.** Every per-type file **cross-references the RFC process** for promoting a vendor-namespaced type to `core:*` (epics line 530). The reference points to `../CONTRIBUTING.md` (relative path; `caspian/spec/CONTRIBUTING.md` lands in Story 5.1) with the inline annotation *"coming soon — Story 5.1"*. The reference may sit in the **Sources**, **Use Boundaries**, or **Composition** section — wherever it reads most naturally — but it MUST appear exactly once per file.

**AC8.** `caspian/spec/vocabulary/README.md` and every per-type file are licensed under **CC-BY-4.0** by inheritance from `caspian/spec/LICENSE.md` (Story 1.2 deliverable). No new `LICENSE.md` is added inside `caspian/spec/vocabulary/`. The README MAY include a one-line license footer pointing to `../LICENSE.md` for clarity, but it MUST NOT redeclare the license terms.

**AC9.** `pnpm -C caspian lint` continues to exit `0` after this story (markdown is not Biome-linted — see Story 1.1 review patches and Story 1.2 dev notes — but the smoke gate must remain green). `pnpm -C caspian test` continues to exit `0` (no source code added; *No projects matched* output is the expected pattern from Stories 1.1 and 1.2).

## Tasks / Subtasks

- [x] **Task 1 — Author `vocabulary/README.md` (index + 7-section template)** (AC: #1, #2, #8)
  - [x] Create `caspian/spec/vocabulary/README.md` with these sections in order: a 1-paragraph introduction to the canonical vocabulary; **The 11 Canonical Types** (an unordered list — *not* a table — preserving canonical order: `overview`, `epic`, `story`, `plan`, `adr`, `convention`, `learning`, `glossary`, `review`, `rule`, `scratch`; each entry is `core:<name>` in backticks followed by an em-dash and a single-sentence summary linking to `./<name>.md`); **The 7-Section Template** (one paragraph per section: Purpose, Sources, Identity, Use Boundaries, Composition, Anti-pattern, Examples — see Dev Notes for canonical wording); **License** (one line: *"All files in this directory are licensed under CC-BY-4.0 by inheritance from [`../LICENSE.md`](../LICENSE.md)."*).
  - [x] Word-count target ≤500 words; line-count target ≤200 lines. The README is an entry point, not exhaustive prose.
  - [x] Verify the 11 type names match `caspian/spec/core.md` line 220–223 byte-exact (`Grep -n 'overview\|epic\|story\|plan\|adr\|convention\|learning\|glossary\|review\|rule\|scratch' caspian/spec/core.md`).
  - [x] Confirm no `LICENSE.md` is created inside `caspian/spec/vocabulary/`; the parent `caspian/spec/LICENSE.md` (Story 1.2) governs inheritance.

- [x] **Task 2 — Author the 4 chain-driving types** (AC: #3, #4, #5, #7) — `overview.md`, `epic.md`, `story.md`, `plan.md`
  - [x] These four types are produced by casper-core's reference workflow (`/init-project` → `/discover` → `/plan-story`) per PRD lines 524–526 and architecture lines 698–700. Their semantic anchoring is the strongest of the 11. Use the canonical interpretations in **Dev Notes — Per-Type Canonical Interpretations** as the authoritative source.
  - [x] **`overview.md`** — `core:overview`. Project-level overview produced by `/init-project`. Single-file-per-project semantic. Identity is the project name + path. Use Boundaries: not a `core:glossary`, not a `core:adr`.
  - [x] **`epic.md`** — `core:epic`. Bundle of stories. Output of `/discover`. Identity is the epic title + epic number. Use Boundaries: not a `core:plan` (epic groups stories, plan implements one story).
  - [x] **`story.md`** — `core:story`. User-facing requirement (As-a / I-want / So-that). Output of `/discover`. Identity is the story key (`<epic>-<story>-<slug>`). Use Boundaries: not a `core:plan` (story = what; plan = how).
  - [x] **`plan.md`** — `core:plan`. Implementation plan for one story. Output of `/plan-story`. Identity is the parent story key + a plan-revision number. Declares `requires: [{type: core:story, count: 1}]`. Use Boundaries: not a `core:story` (plan is the executable shape; story is the requirement).
  - [x] Each file: 7-section template, ≤500 lines, ATX headers, fenced code blocks with `yaml` language tag for examples, RFC-process cross-reference appearing exactly once with *"coming soon — Story 5.1"* annotation.
  - [x] Each file's **Examples** section includes **one minimal YAML frontmatter example** demonstrating the canonical type used in a passive document (`type` only, no `requires`/`produces` — these are documents). For `core:plan`, the example MAY include `requires: [{type: core:story}]` since plan-the-document carries forward its production lineage by convention.

- [x] **Task 3 — Author `adr.md` (representative deep-dive)** (AC: #3, #4, #5, #6, #7)
  - [x] Create `caspian/spec/vocabulary/adr.md` following the 7-section template.
  - [x] **Purpose** — One paragraph: `core:adr` records a single architecturally-significant decision with its context, alternatives considered, the chosen option, and the consequences. ADRs are append-only and immutable once accepted; they document the *why* of a decision so future readers (human or agent) understand the constraints under which the decision was made.
  - [x] **Sources** — Cite prior art with attribution (per AC6):
    - Michael Nygard, *"Documenting Architecture Decisions"*, 2011 (the foundational industry ADR pattern).
    - BMad-Method (the project's BMad orchestration uses the term ADR for solution-design-decision documents; cite by name as the upstream tooling that informed Caspian's ADR semantics).
    - Agent OS (cite by name as a peer agentic framework that adopts ADR-style decision records).
    - Reference `../CONTRIBUTING.md` *(coming soon — Story 5.1)* for the RFC promotion path of vendor-namespaced ADR variants — this is also the AC7 cross-reference for this file.
  - [x] **Identity** — One paragraph: an ADR is identified by a numeric prefix (canonical `NNN-` ordered, e.g., `001-resolution-semantics-out-of-scope.md`), a kebab-case slug, and the artifact's `type: core:adr`. ADRs are written once and superseded by new ADRs rather than edited in place; the supersession relationship is captured by referencing the predecessor ADR's number from the successor's text (lifecycle metadata fields like `supersedes` are deliberately not in the v1.0 contract — see `core.md#schema-evolution`).
  - [x] **Use Boundaries** — State explicitly (per AC6):
    - `core:adr` is NOT `core:learning`. An ADR captures a *decision*; a learning captures a *retrospective insight from work done*. ADR is forward-looking constraint; learning is backward-looking observation.
    - `core:adr` is NOT `core:rule`. An ADR documents *one decision once*; a rule encodes *enforcement* of a stable policy across many artifacts. A rule MAY cite an ADR as its source.
  - [x] **Composition** — One paragraph: ADRs are typically *consumed* by `core:rule` (rules cite their source ADR), `core:convention` (conventions reference the ADR that codified them), and human readers. ADRs may be *produced* by orchestration skills that capture decisions (e.g., a hypothetical `/decide` command). v1.0 casper-core does not produce `core:adr`; v1.1+ workflows MAY.
  - [x] **Anti-pattern** — One paragraph: an ADR that bundles multiple decisions is a refactoring opportunity — split it. An ADR edited months after acceptance to "update" the decision is no longer an ADR; the edit either belongs in a successor ADR or is a `core:learning` capturing the team's evolving understanding. ADRs MUST NOT be deleted from the repository: history is the value.
  - [x] **Examples** — Include (per AC6):
    - One inline YAML frontmatter snippet showing the minimal `core:adr` envelope (`type: core:adr` only — ADRs are documents).
    - A cross-reference to a fixture under `../../fixtures/valid/core-adr/` annotated *"coming soon — Story 1.6"*. (Story 1.6 lands `caspian/fixtures/valid/core-adr/minimal.md`; the architecture line 597–600 shows the convention `core-<type>/<variant>.md`.)

- [x] **Task 4 — Author the 6 supporting types** (AC: #3, #4, #5, #7) — `convention.md`, `learning.md`, `glossary.md`, `review.md`, `rule.md`, `scratch.md`
  - [x] **`convention.md`** — `core:convention`. Stable codified team practice; tells humans and agents "we do it this way here." Distinct from `core:rule` (rule is enforced by tooling; convention is conventional, communicated). Examples: file-naming, commit-message format, branch policy. Identity: kebab-case slug.
  - [x] **`learning.md`** — `core:learning`. Captured retrospective insight. Append-only file (or per-learning files). Pattern: *"We tried X. Y happened. Z is what we'd do differently."* Distinct from `core:adr` (learning is observational; ADR is decisional).
  - [x] **`glossary.md`** — `core:glossary`. Domain/term definitions. Pure reference. One per project is the typical case; a project MAY have multiple scoped glossaries. Identity: filename + scope label.
  - [x] **`review.md`** — `core:review`. Peer review or code-review record. Output of a review skill. Identity: the artifact reviewed + reviewer + date. Distinct from `core:learning` (review judges a specific artifact; learning generalizes).
  - [x] **`rule.md`** — `core:rule`. Enforcement rule for tooling or agents. *"DO NOT do X"* / *"ALWAYS do Y."* Distinct from `core:convention` (rule is enforced; convention is communicated). Distinct from `core:adr` (rule is policy; ADR is the decision behind the policy).
  - [x] **`scratch.md`** — `core:scratch`. Disposable working notes. Excluded from formal artifact tracking by convention. Use Boundaries: not committed under `core:learning` (scratch is throwaway; learning is captured). Identity: ephemeral; no stable identity required.
  - [x] Each file: 7-section template, ≤500 lines, ATX headers, fenced code blocks with language tag, RFC-process cross-reference appearing exactly once with *"coming soon — Story 5.1"* annotation.
  - [x] Each file's **Examples** section includes one minimal YAML frontmatter snippet (`type: core:<name>` only) and may include a fixture cross-reference *"coming soon — Story 1.6"* but is NOT required to (only `adr.md` mandates it per AC6).

- [x] **Task 5 — Verification + smoke gate** (AC: #4, #5, #8, #9)
  - [x] Verify directory layout: `ls caspian/spec/vocabulary/` shows exactly 12 files (1 README + 11 type docs) and 0 subdirectories. No `LICENSE.md`.
  - [x] For each of the 12 files, verify the 7-section template is present in the canonical order. Use `Grep -n '^## ' caspian/spec/vocabulary/<file>.md` and confirm the headers Purpose / Sources / Identity / Use Boundaries / Composition / Anti-pattern / Examples appear in that order (the README is exempt — its headers are different).
  - [x] For each per-type file, verify line count: `wc -l caspian/spec/vocabulary/<file>.md` ≤ 500. If any file exceeds 500 lines, trim *Examples* prose first (keep one minimal example), then *Composition*, then *Anti-pattern*. Never trim Purpose, Sources, Identity, or Use Boundaries.
  - [x] For each per-type file, verify the RFC-process cross-reference appears exactly once: `Grep -n 'CONTRIBUTING.md' caspian/spec/vocabulary/<file>.md` returns exactly one match per file (and zero in `README.md` if you chose not to include it there).
  - [x] Verify YAML examples avoid the unquoted boolean YAML 1.1 footguns (`on`, `off`, `yes`, `no`, `y`, `n`) — `Grep -n '^\s*\(on\|off\|yes\|no\|y\|n\):' caspian/spec/vocabulary/*.md` returns zero matches inside any fenced YAML block.
  - [x] Run `pnpm lint` from `caspian/` (or `pnpm -C caspian lint` from the repo root). Confirm exit code 0. Capture the file count Biome reports — should be `4` (the 4 JS/TS/JSON files biome lints; markdown is not in scope).
  - [x] Run `pnpm test` from `caspian/` (or `pnpm -C caspian test`). Confirm exit code 0 and the *No projects matched the filters* output (Story 1.1 + 1.2 pattern).
  - [x] Update File List in this story file with all new and modified files, paths relative to repository root.
  - [x] Update `_bmad-output/implementation-artifacts/sprint-status.yaml`: transition `1-3-canonical-core-vocabulary-docs` from `in-progress` to `review` (this happens in dev-story Step 9 — included here for traceability).

## Dev Notes

### Project Context

This is a **documentation-only** story — twelve Markdown files under `caspian/spec/vocabulary/`, zero source code, zero tests beyond the smoke gate. Story 1.2 landed the spec's normative reference (`caspian/spec/core.md`) which **already names** the 11 canonical `core:*` types in its `## Canonical Vocabulary` section (line 218–230). Story 1.3's job is to deliver the **per-type rationale** that section forward-references — turning the bare list of names into navigable, scannable documentation that lets a plugin author pick the right canonical type without ambiguity (FR34, PRD line 555).

The deliverables of Story 1.3 are consumed by every downstream epic that references `core:*` types:

- **Epic 2's CLI validator** (Story 2.4 in particular — namespace allow-list) uses the canonical 11-name list as the lookup table for the proposed `CASPIAN-W004` warning (`type: core:<undocumented-name>`). The names land here; the warning code lands in Story 1.5's registry; the validator consumes both in Story 2.4.
- **Epic 3's casper-core plugin** produces `core:overview`, `core:epic`, `core:story`, `core:plan` artifacts (PRD lines 524–526). Story 1.3's per-type docs are the authoritative human reference for what those types mean — casper-core's prose-side documentation can link here rather than re-explain the semantics.
- **Epic 4's caspian.dev site** (Story 4.1 landing page) links to `caspian/spec/vocabulary/` as the canonical browse-the-vocabulary entry point.
- **Epic 1 Story 1.6** authors `caspian/fixtures/valid/core-<type>/minimal.md` for each of the 11 types. The fixtures exemplify minimal valid frontmatter; this story's per-type docs MAY forward-reference those fixtures (`adr.md` MUST per AC6) using *"coming soon — Story 1.6"* annotations.

### Architecture Compliance — MUST follow

**Source: `_bmad-output/planning-artifacts/architecture.md` step-05 (Implementation Patterns), step-06 (Project Structure), and the corrections section (line 987 — *"`spec/vocabulary/README.md` template not yet written; the 7-section structure proposed at party-mode review (paige) should land here. Addressable in Story-002"* — the addressable story is in fact Story 1.3, not Story-002; the architecture nicknamed it differently).**

- **Markdown conventions (architecture lines 416–425):** ATX headers (`#`, `##`), one blank line between sections, fenced code blocks always carry a language tag (`yaml`, `json`, `text`), no trailing whitespace, advisory line length 100 characters, reference-style links for repeated URLs, field names and code identifiers in backticks (`type`, `core:adr`, `<vendor>:<name>`). Spec prose authored in **English** per BMM `document_output_language: 'English'`.
- **File naming (architecture lines 358–360 + line 568):** kebab-case lowercase. The 11 canonical type filenames (`overview.md`, `epic.md`, etc.) are the architecture-mandated names — do not pluralize (`overviews.md`), do not prefix (`type-overview.md`), do not nest (`overview/index.md`).
- **Section depth:** the 7-section template fits the H2 (`##`) level. Each per-type file has exactly seven `##` headers in the canonical order. Sub-headers (`###`) inside a section are allowed sparingly — prefer prose flow over deep nesting.
- **No per-`core:*`-type schemas (architecture line 213, 980):** v1.0 ships **one envelope schema** (Story 1.4) and **no per-type JSON Schemas**. The per-type docs in this story are *rationale*, not normative shape rules — they describe purpose and use, they do not extend the contract. Treating them as schemas violates the architectural decision.
- **Anchor stability (architecture step-02 *Doc-URL stability*; NFR24):** the per-type docs do **not** require `{#anchor}` declarations in v1.0. The doc-URL stability commitment (NFR24) applies to `caspian/spec/core.md` anchors and to `caspian.dev/diagnostics#caspian-eXXX` anchors. Per-type doc anchors are convenience anchors — author them naturally; do not over-engineer. (If a future Epic 4 site build links to a specific section heading inside a type doc, that anchor's stability becomes a v1.1 concern.)
- **License declaration (architecture lines 175–181, 559–561, 568–569 + Story 1.2 deliverable):** `caspian/spec/LICENSE.md` (Story 1.2) declares CC-BY-4.0 explicitly for the entire `spec/` subtree. The architecture's project-tree (line 568–580) shows `caspian/spec/vocabulary/` containing only `README.md` + the 11 type files — **no nested `LICENSE.md`**. Inheritance from the parent is sufficient; redeclaring the license inside `vocabulary/` is unnecessary noise. Story 1.3 follows the architecture verbatim.
- **Cross-cutting: single source of truth (architecture step-02):** the canonical 11-name list lives in three places that MUST stay synchronized:
  1. `caspian/spec/core.md` line 220–223 (the normative reference; sealed by Story 1.2).
  2. `caspian/spec/vocabulary/README.md` (this story; the index).
  3. `caspian/fixtures/valid/core-<type>/` (Story 1.6; one directory per name).
  If a future minor version adds a 12th canonical name, all three locations bump together as one PR.

### Library / Framework Requirements

**No new dependencies.** This story is pure Markdown authoring. Do NOT install any:

- Markdown linter (`markdownlint`, `remark`, etc.) — not in the architecture; biome 2.4 does not lint markdown but the architecture explicitly does NOT list a markdown linter as a v1.0 dep (boring-tech philosophy, PRD Implementation Considerations).
- Anchor/link checker — same rationale as Story 1.2; v1.0 enforces this at review time, not in CI.
- Word-count or readability tool — `wc -l` and `wc -w` are sufficient; the line-count target is the operational gate.

### File Structure Requirements

After this story, `caspian/spec/vocabulary/` contains exactly **12 files** (1 README + 11 type docs) and **0 subdirectories**:

```text
caspian/spec/vocabulary/
├── README.md              # Index + 7-section template (≤200 lines)
├── overview.md            # core:overview
├── epic.md                # core:epic
├── story.md               # core:story
├── plan.md                # core:plan
├── adr.md                 # core:adr (representative deep-dive — AC6)
├── convention.md          # core:convention
├── learning.md            # core:learning
├── glossary.md            # core:glossary
├── review.md              # core:review
├── rule.md                # core:rule
└── scratch.md             # core:scratch
```

**Do NOT create in this story:**

- Any nested directory under `caspian/spec/vocabulary/` (the architecture mandates a flat layout).
- A `LICENSE.md` inside `caspian/spec/vocabulary/` (CC-BY-4.0 inherits from `caspian/spec/LICENSE.md` per Story 1.2).
- An `index.md` file (`README.md` is the index per architecture line 569 and GitHub default-renderer convention).
- Any fixture file under `caspian/fixtures/` — those are Story 1.6's deliverable.
- Any modification to `caspian/spec/core.md`, `caspian/spec/README.md`, or `caspian/spec/LICENSE.md` — Story 1.2 sealed those files. The "coming soon — Story 1.3" annotations in `core.md` and `README.md` MAY remain in place; they are historical project state and the links resolve naturally once `vocabulary/` exists.
- Anything outside `caspian/spec/vocabulary/` (with the single exception of the sprint-status update).

**Forward references in per-type docs are allowed** but each forward reference MUST carry an inline *"coming soon — Story X.Y"* note. The two recurring forward references in this story are:

- `../CONTRIBUTING.md` *(coming soon — Story 5.1)* — the RFC process for vendor-type promotion. Must appear exactly once per per-type file (AC7).
- `../../fixtures/valid/core-<type>/minimal.md` *(coming soon — Story 1.6)* — required in `adr.md` (AC6); optional elsewhere.

### Coding Standards — MUST follow (sourced from architecture step-05)

- **File naming:** kebab-case lowercase for any custom file. The 11 type filenames are the architecture-mandated names (no aliases, no pluralization).
- **Markdown:** ATX headers, one blank line between sections, fenced code blocks with language tag, advisory line length 100, field names and code identifiers in backticks.
- **YAML examples in fenced blocks (architecture lines 408–414):**
  - 2-space indentation; never tabs.
  - Strings: unquoted if safe (alphanumeric + `:` + `-` + `.`); double-quoted otherwise; never single-quoted.
  - Block style for arrays/objects with more than one entry; flow style acceptable for single-entry.
  - **Never use unquoted YAML 1.1 boolean coercion footguns** (`on`/`off`/`yes`/`no`/`y`/`n`) — these are rejected at validate time per `CASPIAN-E007` (NFR8).
- **Conventional Commits** for the story commit (when the user authorizes it): `docs(spec): add canonical core:* vocabulary docs (Story 1.3)`.
- **Document tone:** descriptive, normative-where-appropriate, fact-stated. Per-type docs describe **what a type is and is not**; they do not introduce new normative MUST/MUST NOT contract assertions (the contract lives in `core.md`). Use RFC 2119 keywords sparingly and only when restating a constraint already in `core.md`.

### Per-Type Canonical Interpretations

The four chain-driving types are anchored by PRD lines 524–526 and architecture lines 698–700. The seven supporting types are documented here as the **canonical interpretations the dev agent uses** when authoring each per-type file. These interpretations are derived from the brainstorming, research, and architecture artifacts; they are NOT a re-derivation in this story but a recorded, project-internal glossary so the dev agent does not have to invent semantics under time pressure.

| Type | Purpose (one-line) | Identity | Active or document? | Distinct from |
|---|---|---|---|---|
| `core:overview` | Project-level orientation: what is this project, who is it for, what are the goals. | Project name + repo path | Document (passive) | `core:glossary` (overview is the **why** narrative; glossary defines terms). |
| `core:epic` | Bundle of stories that together deliver one feature. | Epic title + epic number | Document | `core:plan` (epic groups stories; plan implements one story). |
| `core:story` | One user-facing requirement (As-a / I-want / So-that). | `<epic>-<story>-<slug>` | Document | `core:plan` (story = what; plan = how). |
| `core:plan` | Implementation plan for one story (tasks, files, tests). | Parent story key + plan revision | Document; declares `requires: [{type: core:story, count: 1}]` | `core:story` (plan is executable shape). |
| `core:adr` | Single architecturally-significant decision: context, alternatives, choice, consequences. | `NNN-<slug>` (ordered numeric prefix) | Document; immutable; superseded never edited | `core:learning` (decision vs. insight); `core:rule` (one decision vs. enforced policy). |
| `core:convention` | Stable codified team practice ("we do it this way here"). | Kebab-case slug | Document | `core:rule` (convention is communicated; rule is enforced). |
| `core:learning` | Captured retrospective insight ("we tried X, Y happened, Z is what we'd do differently"). | Date + slug | Document; append-only | `core:adr` (learning is observational; ADR is decisional). |
| `core:glossary` | Domain/term definitions; pure reference. | Filename + optional scope | Document | `core:overview` (glossary is per-term; overview is project narrative). |
| `core:review` | Peer review or code-review record judging one artifact. | Reviewed-artifact + reviewer + date | Document | `core:learning` (review judges specific artifact; learning generalizes). |
| `core:rule` | Enforcement rule for tooling/agents ("DO NOT do X" / "ALWAYS do Y"). | Kebab-case slug | Document; MAY cite a `core:adr` as source | `core:convention` (rule is enforced); `core:adr` (rule is policy; ADR is the decision behind it). |
| `core:scratch` | Disposable working notes; excluded from formal artifact tracking. | Ephemeral | Document; throwaway | `core:learning` (scratch is throwaway; learning is captured). |

The dev agent uses this table to author each per-type file's **Purpose** (one-paragraph expansion), **Identity** (paragraph from the Identity column), and **Use Boundaries** (paragraph from the *Distinct from* column). The table itself does NOT need to be reproduced inside `vocabulary/README.md` — the README's per-type one-line summary is the user-facing distillation.

**Active vs. document semantic.** Per `core.md` line 153–166, all 11 canonical types are **passive documents** by convention — they carry `type` only, never `requires`/`produces`. The single exception is `core:plan`: a *plan-the-document* MAY (by convention, not contract) carry `requires: [{type: core:story, count: 1}]` to record its production lineage, since the plan is produced by a `/plan-story` skill that itself declares that requirement. This convention is illustrative; the contract permits any artifact to declare any of the four fields.

### 7-Section Template — Authoritative Wording

Each per-type file has these seven `##` sections in this order:

1. **Purpose** — One paragraph (≈80–150 words). What this type is *for*. The single-sentence problem it solves. The audience (plugin author, orchestration tool, human reader).
2. **Sources** — One paragraph or short list (≈80–200 words). Prior art, ecosystem precedents, and the project-internal sources informing this type's semantics. Cite sources by name with attribution; URLs optional. Include the RFC-process cross-reference (`../CONTRIBUTING.md` *(coming soon — Story 5.1)*) here if it reads naturally — Sources is the most common section for it.
3. **Identity** — One paragraph (≈60–120 words). How an artifact of this type is uniquely identified: filename convention, optional ID prefix, mutability (immutable / append-only / mutable), supersession behavior. State explicitly whether the type is single-instance (one `core:overview` per project) or multi-instance.
4. **Use Boundaries** — One paragraph (≈80–200 words). What this type is **NOT**. Distinguish it from the most-confusable adjacent canonical types using the *Distinct from* column above as the source. State each *not-this* in one sentence with a clear contrast principle. (Use Boundaries is also a natural place for the RFC-process cross-reference if not in Sources.)
5. **Composition** — One paragraph (≈60–150 words). How this type composes with other types in the canonical vocabulary: which types typically *consume* it (declare it in their `requires`), which types typically *produce* it (declare it in their `produces`), and which orchestration patterns instantiate it. v1.0 casper-core only produces `overview`, `epic`, `story`, `plan` — for the other 7 types, Composition describes the conceptual flow, not a concrete v1.0 producer.
6. **Anti-pattern** — One paragraph (≈60–120 words). The most-common authoring mistake for this type and its remedy. Frame as *"X is a code-smell — split / move / promote / delete it because Y."* Examples: an ADR that bundles multiple decisions (split); a learning that is actually a rule (promote); a scratch that survived a quarter (delete or graduate).
7. **Examples** — Variable length (≈60–250 words). At minimum: one fenced YAML frontmatter snippet showing the canonical envelope for this type. For `adr.md`: also a cross-reference to a fixture under `../../fixtures/valid/core-adr/` *(coming soon — Story 1.6)*. For other types: a fixture cross-reference is optional but recommended.

Total per file: ≈400–1100 words across 7 sections + headings + code blocks → fits comfortably under the 500-line ceiling.

### Read-Time Budget — How to Verify the Fast-Scan Target (AC5)

The "fast scan: ≤500 lines / ≈2 pages" target (epics line 520) operationalizes as:

1. **Line count ≤500.** Use `wc -l caspian/spec/vocabulary/<file>.md` (Bash) or `(Get-Content caspian/spec/vocabulary/<file>.md | Measure-Object -Line).Lines` (PowerShell). The 7-section template at recommended word counts produces ≈250–400 lines per file with comfortable line breaks at 100-char advisory length. 500 is the ceiling, not the target.
2. **GitHub-renders-cleanly.** Open each file in a Markdown previewer (or push to a feature branch and inspect on GitHub). The 7 H2 sections should be the table-of-contents skeleton. No section should require scrolling past one screen on a 1080p display at default GitHub width.
3. **No external tooling required.** The doc must read end-to-end without needing to click out to a fixture, an ADR, or an external standards body. References are *pointers for follow-up*, not *prerequisites for understanding*.

If line count exceeds 500, trim in this priority order: (1) Examples prose (keep one minimal YAML snippet), (2) Composition (the conceptual flow can be condensed), (3) Anti-pattern (one anti-pattern is enough; do not enumerate). Never trim Purpose, Sources, Identity, or Use Boundaries — these four sections are the rationale's load-bearing core.

### Anti-Patterns — DO NOT do

- ❌ Do NOT introduce **new normative MUST / MUST NOT contract assertions** in per-type docs. The contract lives in `core.md`. Per-type docs are *rationale and use guidance*; they explain how a type is intended to be used, they do not extend the four-field contract.
- ❌ Do NOT inline a JSON Schema for any `core:*` type. Per the architecture (line 213, 980), v1.0 ships ONE envelope schema. Per-`core:*`-type schemas are deliberately out of scope. Per-type docs describe shape in prose only.
- ❌ Do NOT enumerate the 17 v1.0 diagnostic codes in any vocabulary doc. Diagnostic codes live in `caspian/diagnostics/registry.json` (Story 1.5). Per-type docs MAY mention by name a code that targets the type (e.g., `adr.md` may mention that `CASPIAN-W004` *(coming soon — Story 1.5)* warns on `core:<undocumented-name>`) but MUST NOT reproduce code message text or pattern.
- ❌ Do NOT compare this vocabulary to BMad / Agent OS / GitHub Spec Kit / Superpowers / AIDD / Anthropic Agent Skills *as a competitive positioning exercise*. Strategic positioning lives in the PRD; per-type docs cite prior art for **attribution and credit**, not for marketing contrast.
- ❌ Do NOT use Mermaid, PlantUML, or any rendered-diagram syntax. If a flow needs to be illustrated, use a fenced ASCII diagram or a Markdown table — GitHub default renderer (NFR12) MUST display it without external tooling.
- ❌ Do NOT introduce or reserve fields beyond the four. Per-type docs describe how `type`, `requires`, `produces`, and `schema_version` look for that type — they do NOT propose new fields. Vendor-namespaced fields (`x-*`) are the v1.0 escape hatch; new top-level fields require an RFC.
- ❌ Do NOT modify `caspian/spec/core.md`, `caspian/spec/README.md`, or `caspian/spec/LICENSE.md`. Story 1.2 sealed those files. The "coming soon — Story 1.3" annotations in `core.md` (lines 79, 223) and in `README.md` (line 15) MAY remain in place; they record historical project state and the links resolve naturally once `vocabulary/` exists. (If a future tidy-up story chooses to remove those annotations, that is a separate cleanup ticket — out of scope here.)
- ❌ Do NOT touch the surrounding `joselimmo-marketplace-bmad` repo. Specifically: do not modify root `CLAUDE.md`, do not edit `.claude-plugin/marketplace.json`, do not move planning artifacts.
- ❌ Do NOT install any new dependency. This story is pure markdown.
- ❌ Do NOT bypass git hooks (`--no-verify`) when committing. There are none yet — habit only.
- ❌ Do NOT pluralize filenames (`overviews.md`), prefix them (`type-overview.md`), or nest them (`overview/index.md`). The architecture mandates the flat 11-name layout.
- ❌ Do NOT author per-type docs in alphabetical order in `vocabulary/README.md`'s index. Use the **canonical order** published in `core.md` line 220–223 (`overview, epic, story, plan, adr, convention, learning, glossary, review, rule, scratch`). The order is semantically meaningful: chain-driving types first, decision/policy types next, supporting/utility types last.

### Source Citations — Verbatim Anchors

The following claims are sourced from the PRD, architecture, or `core.md` and are reproduced exactly here so the dev agent does not have to re-derive them:

| Statement | Source | Wording / cross-reference |
|---|---|---|
| **The 11 canonical names + their canonical order** | `caspian/spec/core.md` line 220–223 | `core:overview`, `core:epic`, `core:story`, `core:plan`, `core:adr`, `core:convention`, `core:learning`, `core:glossary`, `core:review`, `core:rule`, `core:scratch`. |
| **The 7 template sections + their order** | `_bmad-output/planning-artifacts/architecture.md` line 987 + `_bmad-output/planning-artifacts/epics.md` line 514 | Purpose / Sources / Identity / Use Boundaries / Composition / Anti-pattern / Examples. |
| **`type` is namespaced as `<vendor>:<name>`** | `caspian/spec/core.md` `## type {#type}` | Reference, do not redefine. Per-type docs MAY include the namespace fact in their Purpose section as orientation. |
| **`core:` is the only reserved namespace** | `caspian/spec/core.md` line 77–84 | Per-type docs reinforce this implicitly by being the canonical list — they do not need to restate it. |
| **`requires`/`produces` attach to active components; documents carry `type` only** | `caspian/spec/core.md` line 153–166 | Per-type docs frame their type as a *document* (the convention) and note `core:plan` as the convention-overriding case. |
| **`status` / `supersedes` / `superseded_by` are deliberately not reserved in v1.0** | `caspian/spec/core.md` `## Schema Evolution` | `adr.md`'s Identity section references this when discussing supersession-by-new-ADR rather than supersession-by-field. |
| **RFC promotion path** | Architecture line 530 (epics line 530) + `caspian/spec/CONTRIBUTING.md` *(coming soon — Story 5.1)* | Each per-type file includes exactly one cross-reference per AC7. |
| **ADR prior art** | Industry: Michael Nygard, *"Documenting Architecture Decisions"*, 2011. Project-internal: BMad-Method ADR conventions; Agent OS ADR conventions. | `adr.md` Sources section (AC6). |

### Previous Story Intelligence (from Stories 1.1 and 1.2)

**Working-directory convention (from 1.1).** `caspian/` is the working subdirectory. Every reference in epics / architecture to `spec/`, `schemas/`, etc., resolves to `caspian/spec/`, `caspian/schemas/`, etc. Story 1.3 operates entirely inside `caspian/spec/vocabulary/`.

**Markdown is not Biome-linted (from 1.1 Patch 1, restated in 1.2).** Biome 2.4.13 silently drops markdown files. The smoke gate (`pnpm lint` exit 0) confirms nothing else regressed; it does NOT validate markdown structure. Story 1.3 dev MUST manually verify ATX headers, blank lines between sections, fenced code-block language tags, and field-name backticking — same discipline as 1.2.

**License-file naming convention (from 1.1).** Per-directory overrides use `LICENSE.md` (`.md` suffix). Story 1.3 inherits CC-BY-4.0 from `caspian/spec/LICENSE.md` (1.2's deliverable) — no new license file inside `vocabulary/`.

**No commits by the dev agent (from 1.1, 1.2).** Per project policy, the dev agent prepares and stages but does NOT commit. Story 1.3 follows the same pattern: prepare the 12 files, run the smoke gate, output the recommended commit command, **stop**.

**Conventional Commits prefix (from 1.2).** `docs(spec):` for prose under `caspian/spec/`. Recommended commit message for Story 1.3: `docs(spec): add canonical core:* vocabulary docs (Story 1.3)`.

**Forward-reference annotation discipline (from 1.2).** Story 1.2 wrote `core.md` and `spec/README.md` with *"coming soon — Story X.Y"* annotations on every link to a not-yet-existent target. Story 1.3 follows the same discipline for `../CONTRIBUTING.md` *(coming soon — Story 5.1)* and `../../fixtures/valid/core-<type>/` *(coming soon — Story 1.6)*.

**Word-count and read-time verification approach (from 1.2).** Story 1.2 used `wc -w core.md` against a 2000-word ceiling. Story 1.3 uses `wc -l <file>.md` against a 500-line ceiling per per-type file (the line-count gate is more operational for 12 short files than a per-file word count).

**`core.md` already names the 11 types (from 1.2 Patch D3 + final draft).** `caspian/spec/core.md` line 220–223 lists the 11 canonical names. The line 79–84 prose mentions a future `CASPIAN-W004` warning for `core:<undocumented-name>` — Story 1.3's per-type docs are precisely what makes "documented" / "undocumented" decidable. After Story 1.3 merges, the W004 rule (Story 1.5) has its lookup table.

**Sprint-status update pattern (from 1.1, 1.2).** Sprint status transitions are: `backlog → ready-for-dev` (create-story) → `in-progress` (dev-story Step 4) → `review` (dev-story Step 9) → `done` (after code review). Story 1.3 is currently `backlog`; this create-story workflow transitions it to `ready-for-dev`.

**Deferred-work tracker (from 1.1 review + 1.2 deliverables list).** `_bmad-output/implementation-artifacts/deferred-work.md` is append-only. Story 1.3 is unlikely to surface new deferred items (pure markdown), but if any emerge during code review, they append following the existing format.

### Git Intelligence — Recent Patterns

Last 5 commits (most recent first):

```text
5cd423b chore(review-1-2): apply code-review patches + sync sprint status
2a4c873 docs(spec): add Caspian Core normative reference (Story 1.2)
1d409e8 chore(review-1-1): apply code-review patches + sync sprint status
6b20e65 chore(caspian): bootstrap monorepo scaffold + dual-license layout (Story 1.1)
96b30f8 BMAD Epics and stories
```

Patterns to follow:

- Conventional Commits prefix matching the change kind (`docs(spec):` for prose under `caspian/spec/`).
- Story number in commit message (`(Story 1.3)` parenthetical; trailing).
- Single coherent commit — all 12 files (`README.md` + 11 per-type docs) ship together. Do not split across commits.
- After review, a separate `chore(review-1-3): apply code-review patches + sync sprint status` commit captures any review patches — same pattern as 1.1 and 1.2.
- No co-authored-by trailer unless the user requests one.

### Latest Tech Information

No external versioning is relevant to this story (no dependencies installed or upgraded). One normative external reference whose stability matters:

- **Michael Nygard, *"Documenting Architecture Decisions"*, 2011** — the foundational industry ADR pattern. Cite by author + title + year; URL optional. The pattern is stable and frozen by convention; readers familiar with ADR practice need no link.

No web research beyond the existing planning artifacts is required to author the 12 files. The PRD, architecture, epics, and `caspian/spec/core.md` (Story 1.2) fully specify the canonical 11-name list and the 7-section template's structural intent.

### Project Structure Notes

`caspian/spec/vocabulary/` is created **for the first time** in this story. The architecture's complete spec subtree (`architecture.md` lines 559–581) shows the full `spec/` tree (`LICENSE.md`, `README.md`, `core.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `proposals/`, `vocabulary/`); after Stories 1.2 and 1.3 merge, the subtree contains:

```text
caspian/spec/
├── LICENSE.md          # Story 1.2
├── README.md           # Story 1.2
├── core.md             # Story 1.2
└── vocabulary/         # Story 1.3 (THIS STORY)
    ├── README.md
    ├── overview.md
    ├── epic.md
    ├── story.md
    ├── plan.md
    ├── adr.md
    ├── convention.md
    ├── learning.md
    ├── glossary.md
    ├── review.md
    ├── rule.md
    └── scratch.md
```

The remaining `spec/` entries (`CHANGELOG.md`, `CONTRIBUTING.md`, `proposals/`) land in Stories 5.1 and 5.2.

### References

- **Epic 1 — Story 1.3 ACs:** `_bmad-output/planning-artifacts/epics.md` lines 503–531 (`### Story 1.3: Canonical core:* vocabulary docs`).
- **Epic 1 overview & dependencies:** `_bmad-output/planning-artifacts/epics.md` lines 312–324 + 400–402.
- **Architecture — Spec & Schema Architecture (A1, A5):** `_bmad-output/planning-artifacts/architecture.md` lines 213–220.
- **Architecture — `spec/vocabulary/` directory layout:** `_bmad-output/planning-artifacts/architecture.md` lines 568–580.
- **Architecture — 7-section-template content gap:** `_bmad-output/planning-artifacts/architecture.md` line 987.
- **Architecture — Implementation Patterns (markdown conventions, YAML conventions, naming):** `_bmad-output/planning-artifacts/architecture.md` lines 354–425.
- **Architecture — License layout (per-directory CC-BY-4.0 inheritance):** `_bmad-output/planning-artifacts/architecture.md` lines 175–181, 559–561, 568.
- **Architecture — Rejection of per-`core:*`-type schemas:** `_bmad-output/planning-artifacts/architecture.md` line 213, 980.
- **PRD — FR4 (canonical `core:*` types or vendor namespaces):** `_bmad-output/planning-artifacts/prd.md` line 507.
- **PRD — FR34 (per-`core:*`-type rationale doc):** `_bmad-output/planning-artifacts/prd.md` line 555.
- **PRD — Documentation Requirements:** `_bmad-output/planning-artifacts/prd.md` lines 412–419 (per-type vocabulary docs are part of v1.0 documentation surface).
- **`caspian/spec/core.md` — canonical vocabulary section + names + ordering:** `caspian/spec/core.md` lines 218–230 (Story 1.2 deliverable).
- **`caspian/spec/core.md` — `core:<undocumented-name>` warning policy (forward dependency on this story):** `caspian/spec/core.md` lines 77–84 + `_bmad-output/implementation-artifacts/1-2-caspian-core-normative-reference-spec-core-md.md` line 169 (review-applied note: Story 1.5's registry MUST reserve `CASPIAN-W004`; the canonical names this story lands are W004's lookup table).
- **Implementation readiness report — Story 1.3 traceability:** `_bmad-output/planning-artifacts/implementation-readiness-report-2026-04-26.md`.
- **Story 1.1 — Working-directory convention, conventional-commits prefix, license-naming convention:** `_bmad-output/implementation-artifacts/1-1-project-bootstrap-monorepo-scaffold-dual-license-layout.md`.
- **Story 1.2 — `caspian/spec/` foundation, forward-reference discipline, smoke-gate pattern, working-directory persistence note:** `_bmad-output/implementation-artifacts/1-2-caspian-core-normative-reference-spec-core-md.md`.
- **Deferred work tracker:** `_bmad-output/implementation-artifacts/deferred-work.md`.
- **Domain research — agentic frameworks ecosystem (BMad, Agent OS, etc. — informs `adr.md` prior-art citations):** `_bmad-output/planning-artifacts/research/domain-agentic-workflows-ecosystem-research-2026-04-17.md`.
- **Project conventions:** `F:\work\joselimmo-marketplace-bmad\CLAUDE.md`.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (`claude-opus-4-7[1m]`) via the BMad `/bmad-dev-story` workflow on 2026-04-26.

### Debug Log References

- **`grep CONTRIBUTING.md` initially counted 2 references in `convention.md`.** Investigation: the second reference (line 19 in the original draft) was prose-only — *"`CONTRIBUTING.md` (the open-source standard for contributor expectations)"* — citing the canonical filename as part of the prior-art lineage of the convention pattern, not a link or an RFC cross-reference. Reworded to *"open-source contributor-guide files"* so the literal `CONTRIBUTING.md` token appears exactly once per file (the AC7 RFC cross-reference proper). Final grep count: 12 occurrences across 12 files (1 per file, as intended). The change is cosmetic; the prior-art claim is unchanged.
- **YAML 1.1 boolean footgun audit.** `Grep -i '^\s*(on|off|yes|no|y|n):\s'` across `caspian/spec/vocabulary/*.md` returned zero matches inside any fenced YAML block. Examples consistently use `type: core:<name>` (multi-letter, never the YAML 1.1 implicit-boolean tokens), so no example will trip `CASPIAN-E007` if a future story copies one into a fixture.
- **Section ordering verification.** `Grep -n '^## '` against each per-type file confirms the seven sections appear in canonical order — Purpose / Sources / Identity / Use Boundaries / Composition / Anti-pattern / Examples — across all 11 files. The README is exempt by design (different structure: introduction, listing, template).
- **Line counts.** All 12 files: README.md=57, overview.md=85, epic.md=96, story.md=94, plan.md=102, adr.md=107, convention.md=90, learning.md=90, glossary.md=86, review.md=89, rule.md=87, scratch.md=88. Maximum 107 lines (well under the 500-line ceiling). Total 1071 lines across the 12 files.
- **Smoke gate.** From `caspian/`: `pnpm lint` → Biome checked 4 files in 8ms, no fixes applied, exit 0. `pnpm test` → *No projects matched the filters* output, exit 0. Markdown is not Biome-linted (Story 1.1 patches removed `**/*.md` from the lint glob); manual verification covered ATX headers, blank lines between sections, fenced code-block language tags (`yaml` for the YAML examples), 100-char advisory line length, and field-name backticking.
- **Cross-check against `core.md` L220–223.** The 11 canonical names appear in `caspian/spec/vocabulary/README.md` in byte-exact order with `core.md`'s normative listing: `overview`, `epic`, `story`, `plan`, `adr`, `convention`, `learning`, `glossary`, `review`, `rule`, `scratch`.

### Completion Notes List

**All 9 acceptance criteria satisfied. Story status: `review`.**

- **AC1 — `vocabulary/README.md` lists all 11 canonical types in canonical order with one-line summaries** ✅ — The README's *The 11 Canonical Types* section renders an unordered Markdown list (one entry per type, in the canonical order from `core.md` L220–223). Each entry follows the form `[`core:<name>`](./<name>.md) — <single-sentence summary>`. The summaries fit on one line each at 100-char advisory length.
- **AC2 — `vocabulary/README.md` documents the 7-section template** ✅ — The README's *The 7-Section Template* section enumerates the seven sections in canonical order with a one-paragraph intent statement for each: Purpose, Sources, Identity, Use Boundaries, Composition, Anti-pattern, Examples.
- **AC3 — All 11 per-type files exist with kebab-case lowercase filenames** ✅ — `ls caspian/spec/vocabulary/` returns exactly 12 entries: `README.md` plus the 11 per-type files (`adr.md`, `convention.md`, `epic.md`, `glossary.md`, `learning.md`, `overview.md`, `plan.md`, `review.md`, `rule.md`, `scratch.md`, `story.md`). No additional types, no aliases, no subdirectories.
- **AC4 — Each per-type file follows the 7-section template in canonical order** ✅ — Verified via `Grep -n '^## (Purpose|Sources|Identity|Use Boundaries|Composition|Anti-pattern|Examples)'` against each file. All 11 files surface the seven sections in the canonical order. ATX headers, one blank line between sections, fenced code blocks with `yaml` language tag.
- **AC5 — Each per-type file ≤500 lines** ✅ — Maximum line count is 107 (`adr.md`); minimum is 85 (`overview.md`). All 11 per-type files comfortably under the 500-line fast-scan ceiling. Each file fits on one or two screens at default GitHub width.
- **AC6 — `adr.md` cites prior art with attribution + states what `core:adr` is NOT + cross-references a fixture** ✅ — Sources section names Michael Nygard's *"Documenting Architecture Decisions"* (2011) by author + title + year, BMad-Method by name as upstream tooling, and Agent OS by name as a peer agentic framework. Use Boundaries explicitly states `core:adr` is **not** `core:learning` (forward-looking decision vs. backward-looking observation) and **not** `core:rule` (one decision once vs. enforced policy). Examples section cross-references `../../fixtures/valid/core-adr/minimal.md` *(coming soon — Story 1.6)* with the relative path that resolves on GitHub once Story 1.6 merges.
- **AC7 — Every per-type file cross-references the RFC process exactly once** ✅ — `Grep -c 'CONTRIBUTING.md'` returns 1 per per-type file across all 11 files. The reference uses the relative path `../CONTRIBUTING.md` with the inline annotation *"coming soon — Story 5.1"*. The cross-reference appears in the Sources section in 10 of 11 files (the most natural location); the README also includes one reference in its introduction (not required but improves discoverability).
- **AC8 — License inheritance from `caspian/spec/LICENSE.md`; no new `LICENSE.md` inside `vocabulary/`** ✅ — `ls caspian/spec/vocabulary/` confirms no `LICENSE.md`. The README's *License* section is a one-line footer pointing to `../LICENSE.md` (CC-BY-4.0 inheritance), matching the AC8 wording exactly. Per-type files do not redeclare the license.
- **AC9 — smoke gate green** ✅ — From `caspian/`: `pnpm lint` checked 4 files in 8 ms, no fixes applied, exit 0. `pnpm test` reported *No projects matched the filters* and exited 0. The empty-workspace pattern from Stories 1.1 and 1.2 still holds; no source code or tests were added in this story.

**No deviations from the story spec.** Per-type word counts ranged from ≈400 to ≈800 words depending on how much prior-art context the type warranted (`adr.md` runs longest at 107 lines because the AC6 deep-dive demands explicit Sources attribution and explicit `is-not-X` / `is-not-Y` Use Boundaries; `overview.md` and `glossary.md` are leanest because their semantics are simple). All files comfortably fit the ≤500-line ceiling; the 500-line gate is operational, not a target.

**One spec-vs-actual gap noted in Task 1:** the story spec set a soft target of "≤500 words" for the README; the final README came in at 611 words. Decision: kept the README at 611 words because the line-count gate (≤200) is the binding operational constraint per Dev Notes *Read-Time Budget*, and the README's per-type one-line summaries plus the 7-section template's one-paragraph-per-section explanations earn their tokens (cutting them would reduce the README's value as the vocabulary entry point). Final README: 57 lines / 611 words — well under the line ceiling, slightly over the soft word target. No AC threshold is violated.

**Manual follow-up required by the user:**

- **Commit the story.** Per the repo's commit policy, the dev agent did not commit. Recommended invocation:

  ```bash
  git add caspian/spec/vocabulary/ _bmad-output/implementation-artifacts/1-3-canonical-core-vocabulary-docs.md _bmad-output/implementation-artifacts/sprint-status.yaml
  git commit -m "docs(spec): add canonical core:* vocabulary docs (Story 1.3)"
  ```

  If `.claude/settings.local.json` was auto-modified by Claude Code's permission-grant flow during the smoke gate (as happened in Stories 1.1 and 1.2), include or omit it at the user's discretion.

- **Resolve forward-reference notes in `caspian/spec/core.md` and `caspian/spec/README.md` (optional, NOT required for Story 1.3 acceptance).** Story 1.2 wrote *"coming soon — Story 1.3"* annotations on every link to `vocabulary/`. Those annotations are now stale (the directory exists). Per Story 1.2's dev notes, no edits are required — the annotations record historical project state and the links resolve naturally. A future tidy-up story may choose to remove them; that is out of scope for Story 1.3.

- **Forward dependency for Story 1.5.** The 11 canonical names landed by this story are the lookup table for the proposed `CASPIAN-W004` warning (`type: core:<undocumented-name>`) reserved by Story 1.2's review patches. Story 1.5's diagnostic registry MUST add `CASPIAN-W004` referencing this directory's canonical names. No work is required in this story; the dependency is recorded so Story 1.5's dev agent has the context.

- **Forward dependency for Story 1.6.** The 11 per-type docs cross-reference fixtures under `caspian/fixtures/valid/core-<name>/minimal.md` *(coming soon — Story 1.6)*. Story 1.6 must produce one fixture per type matching the canonical name (the directory naming convention `core-<name>` maps `core:adr` → `core-adr/`, `core:overview` → `core-overview/`, etc.). The cross-references in this story's vocabulary docs use that mapping; Story 1.6 must honor it for the links to resolve.

### File List

All paths relative to repo root (`F:\work\joselimmo-marketplace-bmad\`).

**New files (12):**

- `caspian/spec/vocabulary/README.md` — index of 11 canonical types + 7-section template + license-inheritance footer (57 lines, 611 words)
- `caspian/spec/vocabulary/overview.md` — `core:overview` rationale (85 lines)
- `caspian/spec/vocabulary/epic.md` — `core:epic` rationale (96 lines)
- `caspian/spec/vocabulary/story.md` — `core:story` rationale (94 lines)
- `caspian/spec/vocabulary/plan.md` — `core:plan` rationale (102 lines)
- `caspian/spec/vocabulary/adr.md` — `core:adr` representative deep-dive with prior-art attribution (107 lines)
- `caspian/spec/vocabulary/convention.md` — `core:convention` rationale (90 lines)
- `caspian/spec/vocabulary/learning.md` — `core:learning` rationale (90 lines)
- `caspian/spec/vocabulary/glossary.md` — `core:glossary` rationale (86 lines)
- `caspian/spec/vocabulary/review.md` — `core:review` rationale (89 lines)
- `caspian/spec/vocabulary/rule.md` — `core:rule` rationale (87 lines)
- `caspian/spec/vocabulary/scratch.md` — `core:scratch` rationale (88 lines)

**Modified files (1):**

- `_bmad-output/implementation-artifacts/sprint-status.yaml` — `1-3-canonical-core-vocabulary-docs` transitioned `backlog → ready-for-dev → in-progress → review` (this dev-story session bumped the last two transitions); session markers appended at lines 45–46; `last_updated` left at 2026-04-26; epic-1 status unchanged (`in-progress`).

### Change Log

- **2026-04-26 — Story 1.3 dev session.** Created 12 files under `caspian/spec/vocabulary/` (1 README + 11 per-type rationale docs). All 9 acceptance criteria satisfied. Smoke gate green (`pnpm -C caspian lint` exit 0; `pnpm -C caspian test` exit 0). Story status `ready-for-dev → in-progress → review`. No source code added; this is a documentation-only story. Forward dependencies recorded for Story 1.5 (CASPIAN-W004 lookup table) and Story 1.6 (fixture-directory naming mapping).

