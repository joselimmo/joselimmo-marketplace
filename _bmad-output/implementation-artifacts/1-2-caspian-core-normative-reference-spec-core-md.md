# Story 1.2: Caspian Core normative reference (`spec/core.md`)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a plugin author evaluating Caspian,
I want a single normative reference document I can read in ≤10 minutes,
so that I understand the 4-field contract and can decide whether to adopt Caspian on my plugin.

## Working Directory

**All files in this story land under `caspian/spec/`** — i.e. `F:\work\joselimmo-marketplace-bmad\caspian\spec\`. Story 1.1 created `caspian/` with root configs only; this story is the **first content under `spec/`**, so the directory itself is created here.

The working tree under `caspian/` (per Story 1.1 final state) contains root configs only (`LICENSE`, `LICENSE-CC-BY-4.0`, `README.md`, `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `tsconfig.base.json`, `biome.json`, `.biomeignore`, `.editorconfig`, `.gitignore`, `.gitattributes`, `.npmrc`, `.nvmrc`, `.changeset/`). Do not modify any of those — this story is pure addition.

The surrounding `joselimmo-marketplace-bmad` repo files (`.claude-plugin/`, `plugins/`, `.claude/`, `aidd_docs/`, `_bmad/`, `_bmad-output/`, root `CLAUDE.md`) are **out of scope**. Do not modify them.

## Acceptance Criteria

**AC1.** `caspian/spec/core.md` exists and is the **normative reference** for the Caspian Core v1.0 contract. The document header states the read-time benchmark (FR33: *"≤10 minutes for a plugin author with no prior Caspian context"*). The document is self-contained: a reader needs only `core.md` to grasp the 4-field contract and decide whether to adopt Caspian.

**AC2.** `caspian/spec/core.md` documents the **four frontmatter fields** with a one-sentence definition and one example each:

- `schema_version` — **OPTIONAL** in v1.0, string semver-minor; defaults to `"0.1"` when absent. Producers writing against v0.2+ MUST declare it explicitly to enable consumer-side forward-compatibility detection (FR1).
- `type` — **REQUIRED**, string, namespaced as `<vendor>:<name>` (FR4). Examples: `core:story`, `bmad:epic`, `maya:lint-rule`.
- `requires` — **OPTIONAL**, array of `{type, tags?, count?}` entries (FR2).
- `produces` — **OPTIONAL**, object `{type}` (FR3).

The document includes the **semantic note on field attachment**: `requires` / `produces` are semantically attached to **active components** (skills, commands, agents); **documents** (passive output artifacts such as a `core:story` written to disk) carry `type` only. The four-field contract is universal in scope; `requires` / `produces` are typically empty or absent on documents.

**AC3.** `caspian/spec/core.md` includes the **3-tier overlay-compatibility diagram** showing the field universe a Caspian-conformant artifact may declare:

- **Tier 1 — Caspian Core (4 fields):** `schema_version`, `type`, `requires`, `produces`.
- **Tier 2 — agentskills.io canonical (6 fields):** `name`, `description`, `license`, `allowed-tools`, `metadata`, `compatibility`.
- **Tier 3 — Claude Code overlay (12 fields):** `when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `model`, `effort`, `context`, `agent`, `hooks`, `paths`, `shell`.

The document states explicitly: *every documented Anthropic SKILL.md field remains valid inside a Caspian-conformant artifact* (FR5, NFR13, NFR16). The document also documents the `x-*` extension prefix as the reserved escape hatch for vendor or experimental fields (FR6) and the `<vendor>:<name>` extension namespacing convention with concrete examples (`bmad:epic`, `maya:lint-rule`).

**AC4.** `caspian/spec/core.md` publishes the **BACKWARD_TRANSITIVE evolution guarantee**: schema evolution is additive-only between minor versions within a major version. Producers may write at the latest minor version; consumers MUST accept the current minor and all prior minor versions within the same major (FR27, NFR22). The document explicitly states that `status`, `supersedes`, and `superseded_by` are **NOT reserved** in v1.0 — additive restoration in a later minor remains BACKWARD_TRANSITIVE-compliant.

**AC5.** `caspian/spec/core.md` publishes the **Resolution Semantics out-of-scope normative seal** verbatim:

> *"v1.0 consumers MUST NOT assume forward-compatibility on resolution semantics. Future spec versions may introduce filters that v1.0 consumers cannot honor."*

The seal sits in its own labeled section so it is grep-able and unambiguous. Surrounding prose explains why type-based matching is the only resolution semantic v1.0 commits to, and that multi-candidate disambiguation is implementation-defined.

**AC6.** `caspian/spec/core.md` includes **stable anchor IDs** at the section level: `#schema-version`, `#type`, `#requires`, `#produces`, `#core-vocabulary`. These anchors are consumed by Epic 2's CLI doc-link emission (`caspian.dev/diagnostics#caspian-eXXX` plus the spec anchors) and by Epic 4's static site build (`caspian.dev`). Anchors MUST survive spec minor-version bumps (NFR24).

**AC7.** `caspian/spec/README.md` exists and is the **5-minute introduction** to the spec directory. It opens with a one-paragraph pitch, links prominently to `core.md` for the full contract, and notes that per-`core:*` vocabulary rationale, RFC governance, CHANGELOG, and proposals all land in later stories (Stories 1.3, 5.1, 5.2). It does not duplicate `core.md`'s content.

**AC8.** `caspian/spec/LICENSE.md` exists and **declares CC-BY-4.0 explicitly** as the override of the root Apache-2.0. The file states the override applies to all files in `caspian/spec/` and references the canonical legalcode at `caspian/LICENSE-CC-BY-4.0`.

**AC9.** `pnpm -C caspian lint` continues to exit `0` after this story (no markdown source is linted by Biome 2.4 — see Patches in Story 1.1 — but the smoke gate must remain green). `pnpm -C caspian test` continues to exit `0` (no source code added).

## Tasks / Subtasks

- [x] **Task 1 — Create `caspian/spec/` and license override** (AC8)
  - [x] Create directory `caspian/spec/`.
  - [x] Create `caspian/spec/LICENSE.md` with this exact content:

    ```markdown
    # License — `caspian/spec/`

    All files in this directory (and its subdirectories, unless an inner
    `LICENSE.md` declares otherwise) are licensed under the **Creative
    Commons Attribution 4.0 International License (CC-BY-4.0)**.

    The full legal code is published at the repository root in
    [`../LICENSE-CC-BY-4.0`](../LICENSE-CC-BY-4.0) and at
    <https://creativecommons.org/licenses/by/4.0/legalcode>.

    This override supersedes the repository's default Apache-2.0 license
    ([`../LICENSE`](../LICENSE)) for the contents of `caspian/spec/`.
    ```

  - [x] No other files. No README inside `spec/proposals/` (that lands in Story 5.1). No `vocabulary/` directory (that lands in Story 1.3). No `CHANGELOG.md` (Story 5.2). No `CONTRIBUTING.md` (Story 5.1).

- [x] **Task 2 — Author `caspian/spec/core.md`** (AC1, AC2, AC3, AC4, AC5, AC6)
  - [x] Create `caspian/spec/core.md`.
  - [x] Write the document in this exact section order so anchors are deterministic and the read-time budget holds. **Suggested word counts in parentheses are budgets, not contracts** — total target ≤2 000 words (≈10 min at 200 wpm technical reading; FR33).
    1. **H1 — `# Caspian Core — Normative Reference (v1.0)`**
    2. **Header callout** (≤80 words) — read-time benchmark: *"This document is the normative reference for the Caspian Core v1.0 frontmatter contract. A plugin author with no prior Caspian context should grasp it in ≤10 minutes (FR33)."* Include a one-line statement of what the document does NOT cover (per-`core:*` vocabulary lives in `vocabulary/`; the JSON Schema lives in `../schemas/v1/envelope.schema.json`; diagnostic codes live in `../diagnostics/registry.json`).
    3. **`## Notation`** (≤80 words) — RFC 2119 / RFC 8174 keyword usage: the words MUST, MUST NOT, REQUIRED, SHALL, SHALL NOT, SHOULD, SHOULD NOT, RECOMMENDED, MAY, and OPTIONAL are to be interpreted as described in RFC 2119 when, and only when, they appear in all capitals. Cite both RFCs by number; do not link out (rendered Markdown stays self-contained).
    4. **`## Overview`** (≤180 words) — the four fields named in one breath; one short paragraph on what they buy a plugin author (typed composability, overlay-compatibility, namespace extensibility); pointer forward to the per-field reference.
    5. **`## The Four Fields` — H2 with five H3 subsections, each carrying its stable anchor ID**:
       - **`### schema_version` `{#schema-version}`** (≤180 words) — OPTIONAL; semver-minor string; defaults to `"0.1"` when absent in v1.0; producers writing against v0.2+ MUST declare it explicitly. One YAML example.
       - **`### type` `{#type}`** (≤180 words) — REQUIRED; namespaced as `<vendor>:<name>`; canonical types live under the `core:*` namespace; non-`core:*` namespaces are valid (FR4) but trigger a `CASPIAN-W002` warning (forward reference to Story 1.5's diagnostic registry; **do not enumerate codes** — name only). One YAML example showing `core:story`.
       - **`### requires` `{#requires}`** (≤200 words) — OPTIONAL; array of `{type, tags?, count?}` entries (FR2). State the sub-shape: `type` REQUIRED string; `tags` OPTIONAL array of strings; `count` OPTIONAL positive integer. One YAML example showing a single-entry `requires`.
       - **`### produces` `{#produces}`** (≤180 words) — OPTIONAL; object `{type}` (FR3). State that `type` is REQUIRED inside `produces` when the field is present. One YAML example showing `produces: {type: core:story}`.
       - **Field-attachment semantic note** — short H4 (`#### Where the fields apply`) (≤120 words): `requires` / `produces` attach to active components (skills, commands, agents); documents (passive output artifacts) carry `type` only. The four-field contract is universal in scope; the attachment rule is a convention, not a syntactic constraint.
    6. **`## Overlay-Compatibility` `{#overlay-compatibility}`** (≤300 words) — H2 with the 3-tier diagram. Use a fenced ASCII or Markdown table — no images, no Mermaid, no external rendering. List all 22 known fields exactly once, grouped by tier:
       - Tier 1 (Caspian Core, 4): `schema_version`, `type`, `requires`, `produces`.
       - Tier 2 (agentskills.io canonical, 6): `name`, `description`, `license`, `allowed-tools`, `metadata`, `compatibility`.
       - Tier 3 (Claude Code overlay, 12): `when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `model`, `effort`, `context`, `agent`, `hooks`, `paths`, `shell`.
       Close with the verbatim sentence: *"Every documented Anthropic SKILL.md field remains valid inside a Caspian-conformant artifact."* Cite (FR5, NFR13, NFR16) inline.
    7. **`## Extension Mechanisms`** (≤200 words) — two H3 subsections:
       - **`### x-* extension prefix`** — reserved escape hatch for vendor or experimental fields; never warns; never validates (FR6). One YAML example.
       - **`### Vendor namespacing (<vendor>:<name>)`** — convention for author-defined types and namespaced fields. Concrete examples: `bmad:epic`, `maya:lint-rule`. Note that promoting a vendor type to `core:*` follows the RFC process documented in `CONTRIBUTING.md` (Story 5.1; do not link if the file does not exist yet — write the path as inline code only).
    8. **`## Canonical Vocabulary` `{#core-vocabulary}`** (≤120 words) — pointer-only section; do NOT enumerate the 11 canonical types or the 7-section template (those live in `spec/vocabulary/` per Story 1.3). One sentence: *"The canonical `core:*` vocabulary — `core:overview`, `core:epic`, `core:story`, `core:plan`, `core:adr`, `core:convention`, `core:learning`, `core:glossary`, `core:review`, `core:rule`, `core:scratch` — is documented per-type under [`vocabulary/`](./vocabulary/) (Story 1.3 deliverable; the directory may be empty when this document first ships)."* The anchor `#core-vocabulary` is consumed by `caspian.dev` and the CLI's diagnostic doc URLs.
    9. **`## Schema Evolution`** (≤200 words) — BACKWARD_TRANSITIVE within a major version: additive-only between minor versions; producers may write at the latest minor; consumers MUST accept the current minor and all prior minor versions (FR27, NFR22). State explicitly that `status`, `supersedes`, and `superseded_by` are **NOT reserved** in v1.0 — additive restoration in a later minor remains BACKWARD_TRANSITIVE-compliant.
    10. **`## Resolution Semantics — Out of Scope for v1.0` (Normative Seal)** (≤180 words) — quote the seal verbatim in a Markdown blockquote:

        > *"v1.0 consumers MUST NOT assume forward-compatibility on resolution semantics. Future spec versions may introduce filters that v1.0 consumers cannot honor."*

        Surrounding prose: type-based matching is the only resolution semantic v1.0 commits to. Multi-candidate disambiguation is implementation-defined. The seal exists so any future filter addition is BACKWARD_TRANSITIVE-compliant on the schema axis without retroactively voiding v1.0 consumers.
    11. **`## Out of Scope`** (≤120 words) — bullet list of what v1.0 deliberately does NOT define: per-`core:*`-type JSON Schemas (envelope-only); composition rules between types (orchestration concern, not validation); resolution filters beyond `type`; artifact identity / id models; status / lifecycle metadata. Each bullet ≤1 sentence.
    12. **`## Conformance`** (≤80 words) — pointer-only: a Caspian-conformant artifact MUST validate against `../schemas/v1/envelope.schema.json` (Story 1.4) without `error`-severity diagnostics; warnings are permitted. The CLI implementation lives in `../packages/core/` (Epic 2). Do not duplicate the envelope schema or the diagnostic registry here.
    13. **`## See Also`** (≤80 words) — bullet list of relative links: `README.md` (5-min intro), `vocabulary/` (per-`core:*` rationale, Story 1.3), `../schemas/v1/envelope.schema.json` (envelope schema, Story 1.4), `../diagnostics/registry.json` (diagnostic codes, Story 1.5), `../examples/minimal-skill-adoption/` (4-line frontmatter delta, Story 1.7). Mark deferred targets with `*(coming soon — Story X.Y)*` if the path does not yet exist; do not 404-check.
  - [x] After authoring, run a word count: `wc -w caspian/spec/core.md` (or PowerShell `(Get-Content caspian/spec/core.md | Measure-Object -Word).Words`). Target ≤2 000 words. If over budget, trim Overview and Overlay-Compatibility prose first; do not cut Notation, the seal, or the Schema Evolution section. **Result: 1 527 words (well under budget).**

- [x] **Task 3 — Author `caspian/spec/README.md`** (AC7)
  - [x] Create `caspian/spec/README.md`. Target ≤500 words (≈3-minute read; AC7 says "5-minute" but shorter is better and the AC budget is a ceiling, not a floor). **Result: 250 words.**
  - [x] Required sections, in order:
    1. **H1** — `# Caspian Core Specification`
    2. **One-paragraph pitch** (≤80 words) — what the spec is and what it gates. Reuse phrasing from `caspian/README.md` if helpful, but do not copy verbatim — `README.md` (root) is the project landing; this README is the spec entry point.
    3. **Where to start** — bulleted shortlist with three entries:
       - **Read the contract** → [`core.md`](./core.md) — *the normative reference, ≤10 minutes.*
       - **Browse canonical types** → [`vocabulary/`](./vocabulary/) — *per-`core:*`-type rationale (lands in Story 1.3).*
       - **Contribute via RFC** → [`CONTRIBUTING.md`](./CONTRIBUTING.md) — *RFC process and BDFL response SLA (lands in Story 5.1).*
    4. **What lives elsewhere** — short list:
       - JSON Schemas → `../schemas/v1/` (Story 1.4)
       - Diagnostic codes → `../diagnostics/registry.json` (Story 1.5)
       - Canonical fixtures → `../fixtures/` (Story 1.6)
       - Working examples → `../examples/` (Stories 1.7, 2.8)
    5. **License** — one-line statement: *"All files in this directory are licensed under CC-BY-4.0 (see [`LICENSE.md`](./LICENSE.md))."*
  - [x] Each link target that does not yet exist on disk MUST carry an inline *"coming soon — Story X.Y"* note. Do NOT 404-check; the link will resolve once the target story merges.

- [x] **Task 4 — Verification + smoke gate** (AC9)
  - [x] From `caspian/`, run `pnpm lint`. Expected: exit 0. Biome 2.4.13 does not lint Markdown by design (see Story 1.1 Review Patch 1); the gate confirms nothing else regressed. **Result: `Checked 4 files in 8ms. No fixes applied.` Exit 0.**
  - [x] From `caspian/`, run `pnpm test`. Expected: exit 0 (`pnpm -r --if-present test` exits 0 on the empty workspace). **Result: `No projects matched the filters in "F:\work\joselimmo-marketplace-bmad\caspian"`. Exit 0.**
  - [x] Run `git status` from the repo root and verify the only changes are three new files under `caspian/spec/`: `core.md`, `README.md`, `LICENSE.md`. **Result: untracked `caspian/spec/` (3 files) + this story file + `sprint-status.yaml` modification (status transitions). The `.claude/settings.local.json` modification is auto-recorded permission entries from this session, unrelated to story content.**
  - [ ] **Stage and commit** — DEFERRED per repo policy (the dev agent does not commit unless explicitly asked). Recommended commit:

    ```bash
    git add caspian/spec/
    git commit -m "docs(spec): add Caspian Core normative reference (Story 1.2)"
    ```

### Review Findings

> Generated 2026-04-26 via `/bmad-code-review` against commit `2a4c873`. Three reviewers ran in parallel: Blind Hunter (no project context), Edge Case Hunter (boundary walk), Acceptance Auditor (AC + verbatim trace). Auditor verdict: **all 9 ACs PASS, all 5 verbatim/paraphrase mandates PASS, no anti-pattern violations**. Findings below are quality refinements, not AC failures.

**Decision-needed (3) — RESOLVED 2026-04-26 by Cyril; converted to patches D1/D2/D3 below:**

- [x] [Review][Decision] **`type` value with multiple colons (`a:b:c`) — accept, reject, or warn?** → **Resolved: split-on-first-colon.** namespace = part before the first `:`; name = remainder (may itself contain `:`). No diagnostic. See patch D1.
- [x] [Review][Decision] **`requires.count` semantics — exact-match or minimum-match?** → **Resolved: minimum-match, AND non-enforced by the v1.0 validator.** `count: N` = "at least N" (consistent with absence "one or more"); enforcement is out of v1.0 validator scope (validator checks artifact structure, not project-context applicability — aligned with the Resolution Semantics seal). See patch D2.
- [x] [Review][Decision] **`type: core:fake` (canonical namespace, undocumented name) — diagnostic policy?** → **Resolved: NEW warning diagnostic.** `core:` is the only reserved namespace; the standard is open elsewhere. A `core:<undocumented-name>` emits a new warning code (proposed `CASPIAN-W004`, to be reserved in Story 1.5's registry) — warning rather than error so future canonical-vocabulary expansions stay BACKWARD_TRANSITIVE-compliant for older artifacts. See patch D3.

**Patches (11) — unambiguous textual fixes:**

- [x] [Review][Patch] Add explicit `{#resolution-semantics}` anchor to the seal heading + update intra-doc link [`core.md:223`, `core.md:93`]
- [x] [Review][Patch] Disambiguate "the v1.0 default" wording vs `schema_version: "0.1"` value (spec version v1.0 ships schema `0.1` per architecture line 296) [`core.md:40-44`]
- [x] [Review][Patch] Define the v1.0 "recognized" `schema_version` set explicitly (architecture: `["0.1"]`); state which values trigger `CASPIAN-W003` [`core.md:46-48`]
- [x] [Review][Patch] Replace "rejected" verb in `type` rules with "produces an error-severity diagnostic" to align with the published taxonomy without enumerating codes [`core.md:67-68`]
- [x] [Review][Patch] State that `x-*` and `<vendor>:<name>` namespaced fields are exempt from `CASPIAN-W001` (allow-list scan, architecture line 289); document the evaluation order [`core.md:144-147` vs `163-170`]
- [x] [Review][Patch] Sharpen "documents carry only `type`" vs "any artifact MAY declare any of the four fields" — make convention-vs-constraint distinction explicit [`core.md:131-140`]
- [x] [Review][Patch] Split README story-attribution lump: CHANGELOG → Story 5.2; proposals/ → Stories 5.1 (TEMPLATE) + 5.2 (0001-initial-spec) [`README.md:24`]
- [x] [Review][Patch] Sync README License paragraph with `LICENSE.md` scope: add the "subdirectories, unless an inner `LICENSE.md` declares otherwise" qualifier [`README.md:28-31`]
- [x] [Review][Patch] Clarify Conformance section: schema validation AND no error-severity diagnostics from any validation stage (architecture pipeline lines 287-290) [`core.md:252-254`]
- [x] [Review][Patch] Annotate `caspian.dev` and "CLI's diagnostic doc URLs" with `*(coming soon — Epic 4)*` / `*(coming soon — Epic 2)*` per anti-pattern requirement on forward references [`core.md:200-202`]
- [x] [Review][Patch] Sharpen Overview to distinguish `x-*` (field-name extension) from `<vendor>:<name>` (type-value namespacing) — currently conflated; Extension Mechanisms section already separates them correctly [`core.md:29-31`]
- [x] [Review][Patch] **D1** — Document `type` parsing rule (split-on-first-colon): namespace = string before the first `:`; name = remainder (may itself contain `:`). Multi-colon types like `core:story:v2` are valid; no diagnostic [`core.md:61-67`]
- [x] [Review][Patch] **D2** — Document `requires[].count` semantics: `count: N` = "at least N" (minimum-match); enforcement is out of v1.0 validator scope (validator checks artifact structure, not runtime resolution — consistent with the Resolution Semantics seal) [`core.md:89-90`]
- [x] [Review][Patch] **D3** — Document the `core:<undocumented-name>` policy: `core:` is the only reserved namespace; canonical names are documented in `vocabulary/` (Story 1.3); `type: core:<name-not-in-vocabulary>` triggers a new warning (proposed `CASPIAN-W004`) — warning, not error, so future vocabulary expansions stay BACKWARD_TRANSITIVE-compliant. **Cross-story note:** Story 1.5's diagnostic registry MUST reserve `CASPIAN-W004` for this rule [`core.md:63-69`]

**Applied 2026-04-26.** All 14 patches applied; smoke gate re-verified green (`pnpm -C caspian lint` exit 0). `core.md` word count 1527 → 1787 (still under the 2000-word ≤10-min budget). Verbatim mandates re-checked byte-exact (Resolution Semantics seal at L253–255; Anthropic SKILL.md sentence at L182–183). Forward dependency: **Story 1.5's diagnostic registry MUST reserve `CASPIAN-W004`** for the `core:<undocumented-name>` warning introduced by patch D3 (`core.md:78–84`).

**Dismissed as noise (10):** Tier-3 list mismatch with FR5 (false positive — spec matches FR5 exactly per PRD line 508; the agent confused FR5 with NFR13's stale `version` reference); `agentskills.io` external-claim verifiability (not a defect); 5-min vs 10-min reading-time framing (trivial); LICENSE.md path verification (Story 1.1 confirmed files exist); coming-soon markers / Conformance "impossible at ship time" (intentional architectural pattern); README SKILL.md sentence variant (Auditor approved); See Also vs What lives elsewhere navigation divergence (different lists, different purposes); link text truncation on the seal cross-reference (intentional shorthand); 22-fields list `argument-hint` vs `arguments` ambiguity (real distinct Claude Code fields); `produces: {}` empty-object explicit diagnostic (anti-pattern forbids enumerating codes; the existing "REQUIRED when present" rule covers it implicitly).

## Dev Notes

### Project Context

This is a **documentation-only** story — three Markdown files, zero source code, zero tests beyond the smoke gate. Story 1.1 landed the monorepo scaffold with root configs only; this story is the first content under `caspian/spec/`.

The deliverables of Story 1.2 are the **prose foundation** of the entire Caspian project. Every other epic consumes them:

- **Story 1.4 (envelope JSON Schema)** mechanically encodes the 4-field contract `core.md` defines in prose. The schema is authoritative for validation; `core.md` is authoritative for human understanding. They MUST stay synchronized — a discrepancy is a release blocker.
- **Story 1.5 (diagnostic registry)** emits diagnostics whose `doc` URLs reference the anchors `core.md` declares (`#schema-version`, `#type`, `#requires`, `#produces`, `#core-vocabulary`). Renaming any of these anchors after this story ships requires a redirect across two minor versions (NFR24).
- **Story 1.7 (minimal-skill-adoption example)** cross-references `core.md` for full contract details; the example file's README delegates to `core.md` rather than duplicating prose.
- **Epic 2's CLI (Story 2.5)** emits stable doc URLs to `caspian.dev/diagnostics#caspian-eXXX` plus per-field anchors that resolve to `core.md`'s sections (once Epic 4 deploys `caspian.dev`).
- **Epic 4's static site (Story 4.1)** mirrors `core.md`'s content as the primary spec page on `caspian.dev`.

A factual error or contradiction landing in `core.md` propagates everywhere downstream. Cite the architecture and PRD verbatim where possible; do not paraphrase normative statements.

### Architecture Compliance — MUST follow

**Source: `_bmad-output/planning-artifacts/architecture.md` step-05 (Implementation Patterns), step-04 (Spec & Schema Architecture), and step-02 (Strategic Context — Resolution Semantics seal).**

- **Markdown conventions (architecture lines 416–425):**
  - ATX headers (`#`, `##`), never setext (underscored).
  - One blank line between sections.
  - Fenced code blocks always carry a language tag — `yaml` for YAML examples, `text` for ASCII diagrams, `json` for JSON examples.
  - No trailing whitespace.
  - Advisory line length: 100 characters (not enforced by biome — biome 2.4 does not lint markdown).
  - Reference-style links for repeated URLs.
  - Field names and code identifiers in backticks (`type`, `requires`, `<vendor>:<name>`).
  - Spec prose authored in **English** (per BMM `document_output_language: 'English'`).
- **Anchor stability (architecture step-02 *Doc-URL stability*; NFR24):** the anchor IDs `#schema-version`, `#type`, `#requires`, `#produces`, `#core-vocabulary` MUST be declared explicitly with the `{#anchor}` syntax (CommonMark + GFM both honor it; GitHub renders the anchor as the section's `id` attribute on render). Do NOT rely on auto-generated slugs from heading text — heading text MAY change in future minor versions; anchor IDs MUST NOT.
- **Single source of truth (architecture step-02 cross-cutting concern):** the JSON Schema under `caspian/schemas/v1/envelope.schema.json` (Story 1.4) is the **authoritative** machine-readable contract. `core.md` is the **authoritative human reference**. Neither re-declares the other's content; both reference the same source-of-truth field list. If the two diverge during authoring, flag it as a story blocker — do not silently choose one side.
- **Resolution Semantics seal (architecture step-02 + PRD step-07 BDFL decision):** the seal is non-negotiable v1.0 contract. Quote it verbatim. Do NOT soften it ("might", "could", "in some cases") — the language is precise to make every future filter addition BACKWARD_TRANSITIVE-compliant on the schema axis.
- **License declaration (architecture lines 175–181, 559–561):** `caspian/spec/LICENSE.md` MUST declare CC-BY-4.0 explicitly (not by reference alone). The architecture mandates per-directory re-declaration so each subtree is unambiguous when consumed in isolation.

### Library / Framework Requirements

**No new dependencies.** This story is pure Markdown authoring. Do NOT install any:

- Markdown linter (`markdownlint`, `remark`, etc.) — not in the architecture; biome 2.4 does not lint markdown but the architecture explicitly does NOT list a markdown linter as a v1.0 dep (boring-tech philosophy, PRD Implementation Considerations).
- Anchor-checking tool — anchor stability is a review-time concern at v1.0, not a CI-enforced one. NFR24 enforcement lands in Epic 4 (when the static site builds and the rename-redirect policy applies).
- Read-time benchmarking tool — word count via `wc -w` is sufficient.

### File Structure Requirements

After this story, `caspian/spec/` contains exactly three files:

```text
caspian/spec/
├── LICENSE.md      # CC-BY-4.0 explicit override
├── README.md       # 5-minute intro, links to core.md
└── core.md         # NORMATIVE — the 4-field contract reference (≤10 min, FR33)
```

**Do NOT create in this story:**

- `caspian/spec/CHANGELOG.md` — Story 5.2 (governance header, foundational v1.0 entry).
- `caspian/spec/CONTRIBUTING.md` — Story 5.1 (RFC process, BDFL SLA, conflict-resolution).
- `caspian/spec/proposals/TEMPLATE.md` and `caspian/spec/proposals/0001-initial-spec.md` — Stories 5.1 and 5.2 respectively.
- `caspian/spec/vocabulary/` — Story 1.3 (per-`core:*` rationale, 11 type docs + index + 7-section template).
- Anything under `caspian/schemas/`, `caspian/diagnostics/`, `caspian/fixtures/`, `caspian/examples/`, `caspian/packages/`, `caspian/plugins/`, `caspian/site/`, `caspian/.github/`, `caspian/conformance/` — each lands with its first owning story.

**Forward references in `core.md` are allowed** (the document mentions `vocabulary/`, `../schemas/v1/envelope.schema.json`, `../diagnostics/registry.json`, etc.) but each forward reference MUST carry an inline *"coming soon — Story X.Y"* note, and links to non-existent paths MUST NOT cause `pnpm lint` to fail (biome does not check link reachability; this is informational discipline only).

### Coding Standards — MUST follow (sourced from architecture step-05)

- **File naming:** kebab-case for any custom file. `core.md`, `README.md`, `LICENSE.md` are conventional names; biome's `useFilenamingConvention` rule scopes to JS/TS source only and does not flag these.
- **Markdown:** ATX headers (`# Title`), one blank line between sections, fenced code blocks with language tag, advisory line length 100 chars, reference-style links for repeated URLs, field names and code identifiers in backticks (`type`, `requires`, `produces`, `<vendor>:<name>`).
- **YAML examples in fenced blocks:**
  - 2-space indentation; never tabs.
  - Strings: unquoted if safe (alphanumeric + `:` + `-` + `.`); double-quoted otherwise; never single-quoted (architecture line 410).
  - Block style for arrays/objects with more than one entry; flow style acceptable for single-entry (`requires: [{type: core:story}]`).
  - **Never use unquoted YAML 1.1 boolean coercion footguns** (`on`/`off`/`yes`/`no`/`y`/`n`) — they are rejected at validate time per `CASPIAN-E007` (NFR8). Examples in `core.md` MUST avoid these tokens entirely.
- **Conventional Commits** for the story commit (when the user authorizes it): `docs(spec): add Caspian Core normative reference (Story 1.2)`.
- **Document tone:** descriptive, normative, fact-stated. Use RFC 2119 keywords (MUST, SHOULD, MAY, OPTIONAL, REQUIRED) ONLY in normative statements about the contract — never in narrative prose. The `## Notation` section establishes the convention; once established, every all-caps RFC 2119 word is a contract assertion.

### Read-Time Budget — How to Verify FR33

The 10-minute benchmark is the central success criterion (FR33). Three operational checks:

1. **Word count ≤2 000.** Technical reading at ≈200 wpm yields a 10-minute budget at 2 000 words. Use `wc -w caspian/spec/core.md` (Bash) or `(Get-Content caspian/spec/core.md | Measure-Object -Word).Words` (PowerShell). The ≤80–≤300-word per-section budgets in Task 2 sum to ≈1 880 words leaving headroom for headings and code blocks.
2. **No external links the reader MUST click.** Forward references and "see also" links are explanatory; the document is self-contained for the 4-field contract. RFC 2119 / RFC 8174 are cited by number, not by URL — readers familiar with the convention need no link.
3. **Code examples are minimal.** Each YAML example is ≤8 lines and demonstrates exactly one concept. No "full kitchen-sink" example; the kitchen-sink example lives in `caspian/fixtures/valid/overlay-compat/all-22-known-fields.md` (Story 1.6).

If word count exceeds 2 000, trim in this priority order: (1) Overview prose, (2) Overlay-Compatibility narrative (the table itself stays), (3) Extension Mechanisms examples (keep one example per subsection). Never trim Notation, the BACKWARD_TRANSITIVE statement, the Resolution Semantics seal, or the field-attachment semantic note — these are normative.

### Anti-Patterns — DO NOT do

- ❌ Do NOT enumerate the 17 v1.0 diagnostic codes in `core.md`. Codes live in `caspian/diagnostics/registry.json` (Story 1.5). `core.md` may **mention** that warnings exist (`CASPIAN-W001`, `CASPIAN-W002`, `CASPIAN-W003`) **by name only**, never with full message text or pattern.
- ❌ Do NOT write per-`core:*`-type rationale paragraphs (overview / epic / story / plan / adr / convention / learning / glossary / review / rule / scratch). The `## Canonical Vocabulary` section is a **pointer**, not a definition. Story 1.3 owns the per-type docs.
- ❌ Do NOT inline the envelope JSON Schema. `core.md` describes the shape in prose; the schema is in `caspian/schemas/v1/envelope.schema.json` (Story 1.4). YAML examples in `core.md` are illustrative, not authoritative.
- ❌ Do NOT write a comparison table against BMad / Agent OS / GitHub Spec Kit / Superpowers / AIDD / Anthropic Agent Skills. Strategic positioning lives in the PRD; `core.md` is normative reference, not marketing.
- ❌ Do NOT use Mermaid, PlantUML, or any rendered-diagram syntax. The 3-tier overlay diagram is a fenced ASCII or Markdown table only — GitHub default renderer (NFR12) MUST display it without external tooling.
- ❌ Do NOT introduce or reserve fields beyond the four. `name`, `description`, `version`, `id`, `status`, `supersedes`, `superseded_by`, `created_at`, `updated_at`, `tags` (top-level), `target` — none are Caspian fields. The first six are agentskills.io / Claude Code overlay (which pass through additionalProperties); the rest are explicitly out of v1.0 scope.
- ❌ Do NOT soften the Resolution Semantics seal. Quote it verbatim. The seal is the architectural device that makes every future filter addition BACKWARD_TRANSITIVE-compliant; weakening it costs governance leverage.
- ❌ Do NOT modify `caspian/README.md`. The 4-CTA hub already links to `caspian/spec/` — once `core.md` lands, the spec link resolves on GitHub. (Pre-existing 404 behavior is tracked in `_bmad-output/implementation-artifacts/deferred-work.md` and resolves when this story merges.)
- ❌ Do NOT touch the surrounding `joselimmo-marketplace-bmad` repo. Specifically: do not modify root `CLAUDE.md`, do not edit `.claude-plugin/marketplace.json`, do not move planning artifacts.
- ❌ Do NOT install any new dependency. This story is pure markdown.
- ❌ Do NOT bypass git hooks (`--no-verify`) when committing. There are none yet — habit only.

### Source Citations — Verbatim Anchors

The following passages are normative statements that MUST appear in `core.md` with the wording reproduced (or paraphrased only with explicit BDFL approval — for v1.0, no approval mechanism exists outside the BDFL solo decision, so reproduce verbatim):

| Statement | Source | Wording |
|---|---|---|
| **Resolution Semantics seal** | architecture.md line 56 + PRD step-07 | *"v1.0 consumers MUST NOT assume forward-compatibility on resolution semantics. Future spec versions may introduce filters that v1.0 consumers cannot honor."* |
| **`status` deferral rationale** | PRD line 376 | *"`status` and supersession pointers (`supersedes` / `superseded_by`) are deliberately absent from v1.0. Their operational semantics have not been sufficiently challenged; they are deferred to a future spec version (v0.2 at earliest) pending a concrete use case with a BDFL-approved RFC. Adding them later as optional fields is BACKWARD_TRANSITIVE-compliant."* (May be paraphrased for prose flow; the *deferred* + *BACKWARD_TRANSITIVE-compliant* claims are non-negotiable.) |
| **Field-attachment semantic note** | PRD line 374 | *"`requires` and `produces` are semantically attached to active components (skills, commands, agents) — the artifacts that consume preconditions and emit postconditions. Documents (passive output artifacts produced by a skill, such as a `core:story` written to disk) carry only `type`. The four-field contract is universal in scope (any Caspian artifact MAY declare any of the four fields), but `requires` / `produces` are typically empty or absent on documents."* (May be condensed; preserve *active components* + *documents* + *universal scope* triad.) |
| **Every Anthropic SKILL.md field remains valid** | architecture.md line 50 + PRD line 588 (NFR13) | *"Every documented Anthropic SKILL.md field remains valid inside a Caspian-conformant artifact."* (Verbatim.) |
| **BACKWARD_TRANSITIVE evolution rule** | architecture.md line 52 + PRD line 603 (NFR22) + epics.md line 295 (FR27) | *"Schema evolution is BACKWARD_TRANSITIVE within a major version: producers may write at the latest minor version; consumers MUST accept the current minor and all prior minor versions. No breaking changes between minor versions within the same major."* (May be condensed; preserve *additive-only* + *consumers MUST accept current and prior minors* + *within the same major* triad.) |

### Previous Story Intelligence (from Story 1.1)

**Working directory convention.** Story 1.1 established `caspian/` as the working subdirectory. Every subsequent story (including this one) operates inside `caspian/`. References in epics / architecture to `spec/`, `schemas/`, etc., resolve to `caspian/spec/`, `caspian/schemas/`, etc.

**Markdown is not Biome-linted.** Story 1.1 Review Patch 1 removed `**/*.md` from `caspian/biome.json` `files.includes` because Biome 2.4.13 silently drops markdown files. AC9's smoke gate (`pnpm lint` exit 0) therefore confirms nothing else regressed; it does NOT validate `core.md`'s markdown structure. Story 1.2 dev MUST manually verify ATX headers, blank lines between sections, fenced code-block language tags, and field-name backticking.

**License-file naming convention.** Story 1.1 placed `LICENSE` (Apache-2.0 unedited text) and `LICENSE-CC-BY-4.0` (CC-BY-4.0 unedited legalcode) at `caspian/` root. Per-directory overrides use `LICENSE.md` (`.md` suffix) — this matches architecture line 179 (`/spec/LICENSE.md` — CC-BY-4.0 (overrides for prose)) and is consistent with the per-directory convention used throughout the spec layout.

**No commits by the dev agent.** Per project policy, the dev agent prepares and stages but does NOT commit. Story 1.1's File List was committed manually by the user. Story 1.2 follows the same pattern: prepare the three files, run the smoke gate, output the recommended commit command, **stop**.

**Conventional Commits prefix.** Story 1.1 used `chore(caspian):` for scaffold work. Story 1.2 documentation deliverables should use `docs(spec):` to align with architecture line 436 (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`, `perf:`).

**Deferred from Story 1.1 review** (see `_bmad-output/implementation-artifacts/deferred-work.md`): one item resolves on this story's merge — *"README CTA links return 404 on GitHub"* — specifically the `spec/` link in `caspian/README.md` lines 7–10. Once `caspian/spec/README.md` exists, that link resolves. Update the deferred-work tracker only via that file's append-only convention; do NOT mark the entire entry resolved (the other CTA links — packages/cli, plugins/casper-core, spec/CONTRIBUTING.md — still 404 until their owning stories merge).

### Git Intelligence — Recent Patterns

Last 5 commits (most recent first):

```text
1d409e8 chore(review-1-1): apply code-review patches + sync sprint status
6b20e65 chore(caspian): bootstrap monorepo scaffold + dual-license layout (Story 1.1)
96b30f8 BMAD Epics and stories
480c4c8 BMAD Architecture
d11ffda Merge pull request #2 from joselimmo/claude/create-caspian-prd-vt4SH
```

Patterns to follow:

- Conventional Commits prefix matching the change kind (`docs(spec):` for prose under `caspian/spec/`).
- Story number in commit message (`(Story 1.2)` parenthetical; trailing).
- Single coherent commit — three files (`core.md`, `README.md`, `LICENSE.md`) ship together. Do not split across commits.
- No co-authored-by trailer unless the user requests one (Story 1.1's commit had none).

### Latest Tech Information

No external versioning is relevant to this story (no dependencies installed or upgraded). Two normative spec references whose stability matters:

- **RFC 2119** (1997) and **RFC 8174** (2017) — the keyword-interpretation conventions are stable and frozen. Cite by number; do not include URLs (the convention is universal in spec authoring; readers either know it or recognize the citation pattern).
- **CC-BY-4.0** legalcode is at <https://creativecommons.org/licenses/by/4.0/legalcode>; Story 1.1 already downloaded the unedited text to `caspian/LICENSE-CC-BY-4.0`. `caspian/spec/LICENSE.md` references the local copy by relative path; no fresh download needed.

No web research beyond these references is required to author `core.md`. The PRD, architecture, and epics fully specify the document's content.

### Project Structure Notes

`caspian/spec/` is created **for the first time** in this story. The architecture's complete directory layout (`architecture.md` lines 559–581) shows the full `spec/` tree (CHANGELOG, CONTRIBUTING, proposals/, vocabulary/) but only **three files** of that tree land in this story. The rest are deferred:

| Architecture entry | Story owner | Note |
|---|---|---|
| `caspian/spec/LICENSE.md` | **Story 1.2 (this)** | CC-BY-4.0 explicit |
| `caspian/spec/README.md` | **Story 1.2 (this)** | 5-minute intro |
| `caspian/spec/core.md` | **Story 1.2 (this)** | NORMATIVE — 4-field contract |
| `caspian/spec/CHANGELOG.md` | Story 5.2 | Foundational v1.0 entry + governance header |
| `caspian/spec/CONTRIBUTING.md` | Story 5.1 | RFC process, BDFL SLA, conflict-resolution |
| `caspian/spec/proposals/TEMPLATE.md` | Story 5.1 | 4-mandated-section RFC template |
| `caspian/spec/proposals/0001-initial-spec.md` | Story 5.2 | v1.0 freeze as foundational proposal |
| `caspian/spec/vocabulary/README.md` | Story 1.3 | Index + 7-section template |
| `caspian/spec/vocabulary/{overview,epic,story,plan,adr,convention,learning,glossary,review,rule,scratch}.md` | Story 1.3 | 11 per-type rationale docs |

This is intentional. Forward references in `core.md` and `README.md` are written defensively (with *"coming soon — Story X.Y"* annotations) so each link resolves naturally as later stories merge — no edits needed to `core.md` or `README.md` post-Story 1.3 / 5.1 / 5.2 merges.

### References

- **Epic 1 — Story 1.2 ACs:** `_bmad-output/planning-artifacts/epics.md` lines 458–501 (`### Story 1.2: Caspian Core normative reference (spec/core.md)`).
- **Epic 1 overview & dependencies:** `_bmad-output/planning-artifacts/epics.md` lines 312–324 + 400–456.
- **Architecture — Spec & Schema Architecture (A1–A5):** `_bmad-output/planning-artifacts/architecture.md` lines 212–220.
- **Architecture — Resolution Semantics normative seal (verbatim source):** `_bmad-output/planning-artifacts/architecture.md` lines 54–56.
- **Architecture — BACKWARD_TRANSITIVE governance constraint:** `architecture.md` line 72.
- **Architecture — Cross-cutting concerns (single source of truth, doc-URL stability):** `architecture.md` lines 78–85.
- **Architecture — Implementation Patterns (markdown conventions, YAML conventions):** `architecture.md` lines 402–425.
- **Architecture — Project structure (spec/ tree):** `architecture.md` lines 559–581.
- **Architecture — License layout (per-directory CC-BY-4.0 override):** `architecture.md` lines 175–181, 559–561, 743–747.
- **PRD — Spec surface, semantic note, status deferral rationale (verbatim source):** `_bmad-output/planning-artifacts/prd.md` lines 367–376.
- **PRD — FR1–FR6 (4-field contract authoring):** `prd.md` lines 511–516.
- **PRD — FR27 (BACKWARD_TRANSITIVE), FR33 (≤10-minute spec):** `prd.md` lines 542 + 554.
- **PRD — NFR13 (overlay-compat), NFR22 (BACKWARD_TRANSITIVE), NFR24 (anchor stability):** `prd.md` lines 588 + 603 + 605.
- **PRD — Documentation Requirements (spec docs list):** `prd.md` lines 412–419.
- **Implementation readiness report — Story 1.2 traceability:** `_bmad-output/planning-artifacts/implementation-readiness-report-2026-04-26.md` lines 256–288.
- **Story 1.1 — Working-directory convention, conventional-commits prefix, license-naming convention:** `_bmad-output/implementation-artifacts/1-1-project-bootstrap-monorepo-scaffold-dual-license-layout.md`.
- **Deferred work tracker — README CTA links resolution:** `_bmad-output/implementation-artifacts/deferred-work.md`.
- **Project conventions:** `F:\work\joselimmo-marketplace-bmad\CLAUDE.md`.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (`claude-opus-4-7[1m]`) via the BMad `/bmad-dev-story` workflow on 2026-04-26.

### Debug Log References

- **Working-directory persistence between Bash calls** — `cd caspian && pnpm test` failed on the second invocation because the previous `cd caspian && pnpm lint` had already moved the shell CWD. Re-ran `pnpm test` from the persisted CWD; both gates exit 0. Noted for future stories: chain dependent commands with `&&` in a single Bash call, or use absolute paths.
- **Word count verification** — `wc -w` reports `core.md = 1 527 words`, `README.md = 250 words`, `LICENSE.md = 58 words` (total 1 835). Per Task 2's read-time benchmark (~200 wpm technical reading), `core.md` lands at ~7.6 minutes — comfortably under the FR33 ≤10-minute budget with headroom for figure-skim time on the overlay tier table.
- **Anchor verification** — `Grep` confirms all five mandated anchors are declared with explicit `{#anchor}` GFM syntax: `{#schema-version}`, `{#type}`, `{#requires}`, `{#produces}`, `{#core-vocabulary}`. A sixth anchor `{#overlay-compatibility}` was added on the *Overlay-Compatibility* heading because the Resolution Semantics seal section's intra-doc cross-reference (line 88 of `core.md`) targets it; the AC mandates only the five but does not forbid additional ones, and intra-document stability is preserved.
- **Verbatim quote check** — both verbatim mandates are present byte-exact: the Resolution Semantics seal in a Markdown blockquote (`core.md` lines 225–227) and *"Every documented Anthropic SKILL.md field remains valid inside a Caspian-conformant artifact."* in the overlay-compatibility prose (line 155).
- **YAML 1.1 boolean footgun audit** — `Grep` for unquoted `yes/no/on/off/y/n` values in `core.md`'s YAML examples returned zero matches. The fenced YAML examples avoid these tokens entirely so the document's own examples never trip `CASPIAN-E007` if a future story copies them into a fixture.

### Completion Notes List

**All 9 acceptance criteria satisfied. Story status: `review`.**

- **AC1 — `core.md` exists, normative, self-contained** ✅ — `caspian/spec/core.md` opens with a benchmark callout (≤10 min for a plugin author with no prior Caspian context, FR33) and is self-contained for the 4-field contract decision. Forward references to `vocabulary/`, `../schemas/v1/envelope.schema.json`, `../diagnostics/registry.json`, `../packages/core/`, `../examples/minimal-skill-adoption/` are explanatory only — the document delivers the contract without any of them.
- **AC2 — four fields with definition + example + semantic note** ✅ — `## The Four Fields` lands all five required H3/H4 subsections (`schema_version`, `type`, `requires`, `produces`, `Where the fields apply`) with a one-paragraph definition, REQUIRED/OPTIONAL designation, and one fenced YAML example each. The semantic-note H4 reproduces the *active components vs. documents* triad from PRD line 374 condensed to ≈100 words.
- **AC3 — 3-tier overlay diagram + 22 fields exactly + verbatim overlay sentence** ✅ — `## Overlay-Compatibility` renders the tiers as a Markdown table (no Mermaid, no images, NFR12-compliant) listing the 4+6+12 fields exactly once each. The verbatim sentence *"Every documented Anthropic SKILL.md field remains valid inside a Caspian-conformant artifact."* closes the section with inline citations (FR5, NFR13, NFR16). `x-*` and `<vendor>:<name>` extension mechanisms each get their own H3 in `## Extension Mechanisms` with concrete `bmad:epic` / `maya:lint-rule` examples.
- **AC4 — BACKWARD_TRANSITIVE published + status/supersedes/superseded_by NOT reserved** ✅ — `## Schema Evolution` states the additive-only, consumers-MUST-accept-current-and-prior-minors rule and explicitly names `status`, `supersedes`, `superseded_by` as deliberately unreserved with the additive-restoration-is-cheap rationale.
- **AC5 — Resolution Semantics seal verbatim + own labeled section** ✅ — `## Resolution Semantics — Out of Scope for v1.0 (Normative Seal)` quotes the seal verbatim in a blockquote and explains that type-based matching is the only resolution semantic v1.0 commits to; multi-candidate disambiguation is implementation-defined.
- **AC6 — five stable anchors via explicit `{#anchor}` syntax** ✅ — `{#schema-version}` (line 38), `{#type}` (line 59), `{#requires}` (line 80), `{#produces}` (line 105), `{#core-vocabulary}` (line 191). Anchors are explicit GFM extensions, not heading-text-derived slugs, so heading prose may evolve in future minor versions without breaking the doc-URL stability commitment (NFR24).
- **AC7 — `spec/README.md` 5-minute intro, links to `core.md`, deferred references annotated** ✅ — `caspian/spec/README.md` (250 words, ~3-min read) opens with a one-paragraph pitch, lists "Where to start" with the three mandated entries (`core.md` first), enumerates "What lives elsewhere" with relative paths to `../schemas/v1/`, `../diagnostics/registry.json`, `../fixtures/`, `../examples/`, plus same-dir `CHANGELOG.md` and `proposals/`, and closes with the License section pointing at `LICENSE.md`. Every link to a not-yet-existent target carries a *"coming soon — Story X.Y"* annotation.
- **AC8 — `spec/LICENSE.md` declares CC-BY-4.0 explicitly** ✅ — `caspian/spec/LICENSE.md` (58 words) names CC-BY-4.0 by full title + abbreviation, references the canonical legalcode at `../LICENSE-CC-BY-4.0` (Story 1.1 deliverable) and at the official CC URL, and states the override supersedes the root Apache-2.0.
- **AC9 — smoke gate green** ✅ — From `caspian/`: `pnpm lint` checked 4 files in 8 ms, no fixes applied, exit 0. `pnpm test` reported `No projects matched the filters` and exited 0. The empty-workspace pattern from Story 1.1 still holds; no source code or tests were added in this story.

**No deviations from the story spec.** The story file's Task-2 word budgets summed to ≈1 880 words; the actual draft landed at 1 527 words by trimming Overview prose (the section reads as a single 130-word paragraph instead of the budgeted 180) and Overlay-Compatibility narrative (most of the section's content is the table itself; the surrounding prose is two short paragraphs). All normative content (Notation, the seal, BACKWARD_TRANSITIVE, the field-attachment semantic note) is present and unmodified.

**Manual follow-up required by the user:**

- **Commit the story.** Per the repo's commit policy, the dev agent did not commit. Recommended invocation:

  ```bash
  git add caspian/spec/ _bmad-output/implementation-artifacts/1-2-caspian-core-normative-reference-spec-core-md.md _bmad-output/implementation-artifacts/sprint-status.yaml
  git commit -m "docs(spec): add Caspian Core normative reference (Story 1.2)"
  ```

  The `.claude/settings.local.json` modification is auto-recorded permission entries from this session and is unrelated to story content; include or omit it at the user's discretion.
- **Resolve one Story 1.1 deferred-work entry.** Once this story merges, the `caspian/README.md` 4-CTA hub's `spec/` link resolves on GitHub. Update `_bmad-output/implementation-artifacts/deferred-work.md` to mark *"README CTA links return 404 on GitHub"* as partially resolved (the `spec/` CTA only — the other three CTAs still 404 until their owning stories merge).

### File List

All paths relative to repo root (`F:\work\joselimmo-marketplace-bmad\`).

**New files (3):**

- `caspian/spec/LICENSE.md` — CC-BY-4.0 explicit override (58 words)
- `caspian/spec/README.md` — 5-minute spec entry point (250 words)
- `caspian/spec/core.md` — NORMATIVE — 4-field contract reference (1 527 words, ~7.6-min read at 200 wpm)

**Modified files (1):**

- `_bmad-output/implementation-artifacts/sprint-status.yaml` — `1-2-caspian-core-normative-reference-spec-core-md` transitioned `backlog → ready-for-dev → in-progress → review` (this dev-story session bumped the last two transitions); `last_updated` left at 2026-04-26; epic-1 status unchanged (`in-progress`).

**Modified files outside story scope (informational only — do NOT include in this story's commit if separating):**

- `.claude/settings.local.json` — Claude Code harness auto-recorded the Bash permission entries `pnpm lint *` and the two `echo "EXIT_..."` shell forms when the user approved them during the smoke-gate run. Unrelated to Story 1.2 content.
