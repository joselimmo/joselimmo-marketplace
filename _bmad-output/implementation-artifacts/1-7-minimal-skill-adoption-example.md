# Story 1.7: Minimal skill adoption example

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a plugin author who already ships Anthropic SKILL.md files,
I want a side-by-side `before/` and `after/` example demonstrating the 4-line frontmatter delta,
so that I see exactly what changes when I adopt Caspian and verify it's overlay-compatible (FR35).

## Working Directory

All paths in this story resolve **inside `caspian/`** — the sub-monorepo that hosts the Caspian project under the surrounding `joselimmo-marketplace-bmad` repository. Any reference like `examples/minimal-skill-adoption/after/SKILL.md` resolves to `caspian/examples/minimal-skill-adoption/after/SKILL.md`. Never create files outside `caspian/examples/` for this story (with the single exception of the sprint-status update under `_bmad-output/implementation-artifacts/`).

`caspian/examples/` does **not yet exist** in the repository — Story 1.7 creates the directory tree for the first time. `caspian/fixtures/README.md` already cross-references `../examples/` (Story 1.6) — that link will resolve once this story merges.

## Acceptance Criteria

**AC1.** `caspian/examples/README.md` exists. The file is a **3-line statement** (one short paragraph, three lines of body prose) clarifying that examples are **author-readable walkthroughs**, distinct from the **machine-consumed regression data** under `caspian/fixtures/`. The `# Heading` and any blank line do not count toward the "3-line" budget; aim for ~210 characters of prose total. The README MUST mirror the convention Story 1.6 established for `caspian/fixtures/README.md` — same length budget, same cross-reference style, same ATX header form. (Epics line 667; Story 1.6 *Reference README Model*.)

**AC2.** `caspian/examples/minimal-skill-adoption/` directory exists and contains **exactly three files** (epics line 668):

  - `caspian/examples/minimal-skill-adoption/README.md` — walkthrough explainer
  - `caspian/examples/minimal-skill-adoption/before/SKILL.md` — vanilla Anthropic SKILL.md
  - `caspian/examples/minimal-skill-adoption/after/SKILL.md` — same skill plus the Caspian frontmatter delta

The `before/` and `after/` subdirectories each contain exactly one file (`SKILL.md`). No `.gitkeep` placeholders. No additional files in this story (the `examples/ci-integration/` directory referenced by the architecture line 614 is FR36's deliverable and is **out of scope for Story 1.7**).

**AC3.** `caspian/examples/minimal-skill-adoption/README.md` explains the **4-line frontmatter delta concretely** (epics lines 670–673), naming each of the four Caspian Core fields with its optionality status:

  - `schema_version: "0.1"` — OPTIONAL (defaults to `"0.1"` when absent in v1.0; producers writing against v0.2+ MUST declare it explicitly per `spec/core.md` *§schema_version*)
  - `type: <vendor>:<name>` — REQUIRED (the only mandatory Caspian field; here `examples:greeter`)
  - `requires: [...]` — OPTIONAL (array of `{type, tags?, count?}` entries; documents typically omit it)
  - `produces: {type: <type>}` — OPTIONAL (object with `{type}`; produced output kind for active components)

The README MUST also (a) cross-reference `spec/core.md` for the full contract via a relative link `../../spec/core.md` (epics line 673); (b) state the line-count caveat that the actual number of lines added depends on which optional fields are included and whether block or flow YAML style is chosen — the **4-field contract surface** is the invariant, not a fixed line count; (c) explain that **no Anthropic SKILL.md field is removed or modified** by adoption — Caspian fields are purely additive (overlay-compat per FR5, NFR13, NFR16).

**AC4.** `caspian/examples/minimal-skill-adoption/before/SKILL.md` is a **valid Anthropic SKILL.md** with the **6 agentskills.io canonical fields populated realistically** (epics line 678): `name`, `description`, `license`, `allowed-tools`, `metadata`, `compatibility`. The file must:

  - Parse as valid YAML 1.2 frontmatter between `---` delimiters
  - Populate each of the 6 canonical fields with a plausible value (no `<placeholder>` or `TODO`-style stubs)
  - Include a markdown body of **at least 3 lines** (skill name heading + one prose sentence describing what the skill does + optional *When to Use* note) — sufficient for the file to look like a real skill, not a fixture stub
  - Be loadable in any Anthropic-compatible host without modification (the AC text says *"would load in any Anthropic-compatible host"*)
  - Use the skill name `greeter` and the namespace `examples` — per epics line 683 the namespace is `examples:` and the skill demonstrates the vendor-namespacing pattern from FR4

**AC5.** `caspian/examples/minimal-skill-adoption/after/SKILL.md` is the SAME file as `before/SKILL.md` plus the Caspian frontmatter additions, with these strict properties (epics lines 675–677):

  - **Diff-based proof of overlay-compat:** `diff before/SKILL.md after/SKILL.md` (or equivalent line-diff tool) shows ONLY additions of Caspian fields. Zero `<` lines (deletions). Zero modifications to existing lines. Every Anthropic field from `before/SKILL.md` appears verbatim and unchanged in `after/SKILL.md`.
  - The Caspian additions appear at the **top of the frontmatter**, in the canonical field-ordering convention from architecture lines 404–409: `schema_version` first, then `type`, then `requires` (if present), then `produces` (if present), then the 6 agentskills.io canonical fields, then any Claude Code overlay fields (none in this example).
  - The added frontmatter conforms to architecture lines 402–451 (*YAML Frontmatter Authoring*): block-style YAML, 2-space indent, no tabs, no comments inside frontmatter, quoted version strings (`schema_version: "0.1"`).

**AC6.** `caspian/examples/minimal-skill-adoption/after/SKILL.md` validates cleanly against `caspian/schemas/v1/envelope.schema.json` (Story 1.4's deliverable) — **zero errors and zero warnings** (epics line 679; "validates cleanly" means no diagnostics of any severity). v1.0 ships no validator runtime in this story (ajv lands in Epic 2 Story 2.1); the cross-check is manual: trace `after/SKILL.md`'s frontmatter through the envelope schema's `required: ["type"]` + `type.pattern: "^[^:]+:.+$"` + the `requires` / `produces` `$defs` + the 22-field allow-list. The fixture must satisfy:

  - `type` present and matches `^[^:]+:.+$` (here `examples:greeter` — namespace `examples`, name `greeter`, single colon)
  - `schema_version` (if present) is a string in the recognized set `["0.1"]`
  - `produces` (if present) is an object with required `type` matching the namespace pattern
  - `requires` (if present) is an array of objects each with required `type` matching the namespace pattern
  - All other fields are recognized members of the 22-field allow-list (4 Caspian core + 6 agentskills.io canonical + 12 Claude Code overlay) OR are `x-*`-prefixed OR are `<vendor>:<name>`-namespaced field NAMES

**AC7.** The `after/SKILL.md` frontmatter is **≤ 30 lines** (epics line 684; "compact"). Counted from the line after the opening `---` to the line before the closing `---`. The body content remains the same as `before/SKILL.md` — illustrative, not load-bearing. The body word count is whatever Story 1.7's *Reference Models* (Dev Notes below) settle on; the strict cap applies only to the frontmatter slice.

**AC8.** The vendor namespace `examples:` is used consistently (epics lines 681–683):

  - The `type` value in `after/SKILL.md` is `examples:greeter`
  - The skill name field (agentskills.io canonical `name`) is `greeter`
  - This namespace aligns with the namespace already used by Story 1.6's `vendor-namespaced.md` invalid fixture (`caspian/fixtures/invalid/W001-unknown-field/vendor-namespaced.md` field name `examples:custom-field` — see Story 1.6 *Reference Overlay-Compat Models* note on `examples:` alignment). Keeping the same namespace across stories prevents pedagogy fragmentation.

**AC9.** `pnpm -C caspian lint` exits `0` after this story (smoke gate; same standard as Stories 1.1–1.6). All four new files (`examples/README.md`, `examples/minimal-skill-adoption/README.md`, `examples/minimal-skill-adoption/before/SKILL.md`, `examples/minimal-skill-adoption/after/SKILL.md`) are markdown. Biome's `files.includes` (`caspian/biome.json` lines 4–17) does NOT list `**/*.md`, so all four files are OUT of biome's scope by construction — no `caspian/biome.json` or `caspian/.biomeignore` modification is required.

**Expected smoke-gate output:** Biome checks **7 files** in ~20ms, exit 0 — the same 7 files Stories 1.5 and 1.6 reported (`biome.json`, `package.json`, `tsconfig.base.json`, `.changeset/config.json`, `schemas/v1/envelope.schema.json`, `schemas/v1/diagnostic-registry.schema.json`, `diagnostics/registry.json`). The new examples files are NOT linted because `.md` is not in biome's `files.includes`. `pnpm -C caspian test` continues to exit `0` with the *No projects matched the filters* output (empty-workspace pattern from Stories 1.1–1.6; no source code or tests added in Story 1.7).

**AC10.** Manual cross-checks recorded in the Dev Agent Record's *Debug Log References* section (parallel to Story 1.6's AC13 walkthrough):

  - **Cross-check #1 — `before/SKILL.md` is a valid Anthropic SKILL.md.** Confirm the file parses as YAML 1.2, contains all 6 agentskills.io canonical fields (`name`, `description`, `license`, `allowed-tools`, `metadata`, `compatibility`), and has a non-empty markdown body of ≥3 lines. Record the YAML field count (expected: 6) and body line count.
  - **Cross-check #2 — `after/SKILL.md` validates against the envelope schema.** For each frontmatter key in `after/SKILL.md`, classify it as: (a) Caspian core (4 fields); (b) agentskills.io canonical (6 fields); (c) Claude Code overlay (12 fields); (d) `x-*` extension; (e) `<vendor>:<name>` namespaced. Confirm every key falls into category (a)–(e). Confirm `type.pattern` matches; confirm `produces`/`requires` shape (if present) matches `$defs`; confirm `schema_version` (if present) is in `["0.1"]`. Record the keys-by-category table.
  - **Cross-check #3 — overlay-compat diff proof.** Run `diff caspian/examples/minimal-skill-adoption/before/SKILL.md caspian/examples/minimal-skill-adoption/after/SKILL.md`. Confirm the output shows ONLY `>` lines (additions) — zero `<` lines (deletions). Record the line-add count (it equals the line count of the Caspian additions to `after/SKILL.md`).
  - **Cross-check #4 — `after/SKILL.md` frontmatter length.** Count lines between the opening `---` (exclusive) and closing `---` (exclusive). Confirm the count is ≤ 30. Record the actual line count.
  - **Cross-check #5 — README explains all 4 Caspian fields.** Open `caspian/examples/minimal-skill-adoption/README.md` and confirm it names each of `schema_version`, `type`, `requires`, `produces` with the correct optionality (R/O) and a one-line explanation. Confirm the cross-reference link to `../../spec/core.md` is present and resolves to a real file.
  - **Cross-check #6 — `examples/README.md` line budget.** Open `caspian/examples/README.md`. Confirm the body prose is exactly 3 lines (between the heading and EOF, ignoring the blank separator line after the heading). Confirm the cross-reference to `../fixtures/` is present.

## Tasks / Subtasks

- [x] **Task 1 — Create `caspian/examples/` directory tree + top-level README** (AC: #1, #2)
  - [x] Create the directory `caspian/examples/` (does not exist yet — `ls caspian/` before this story shows no `examples/` entry).
  - [x] Create the directory `caspian/examples/minimal-skill-adoption/` and the two subdirectories `before/` and `after/`.
  - [x] Author `caspian/examples/README.md` using the *Reference Top-Level README Model* in *Dev Notes* below as the authoritative starting point. The README MUST be a 3-line statement clarifying that examples are author-readable walkthroughs distinct from `fixtures/`. ATX header (`# Heading`), ≤ 3 lines of body prose, LF line endings, UTF-8 no BOM, final newline.
  - [x] Do NOT create any `.gitkeep` files — the directories are populated immediately by Tasks 2 and 3.
  - [x] Do NOT create `caspian/examples/CHANGELOG.md` — examples are versioned with the spec, not independently. (Same rationale as `caspian/fixtures/` from Story 1.6.)
  - [x] **Optional:** Author `caspian/examples/LICENSE.md` with a dual-statement license declaration mirroring the `site/LICENSE.md` pattern from architecture line 180 — prose CC-BY-4.0, code/SKILL.md artifacts Apache-2.0. Architecture line 608 says `examples/` is **mixed Apache-2.0 + CC-BY-4.0**, but architecture line 181 does NOT list `examples/` among the directories that re-declare licenses. The `LICENSE.md` is recommended for clarity but NOT required by any AC. If added, use the *Reference LICENSE.md Model* in *Dev Notes*.

- [x] **Task 2 — Author `before/SKILL.md` (vanilla Anthropic SKILL.md)** (AC: #2, #4, #8)
  - [x] Use the **Reference Before-SKILL Model** in *Dev Notes* below as the authoritative starting point. The model satisfies AC4 + AC8 byte-faithfully.
  - [x] Frontmatter MUST contain only valid YAML key/value pairs — no `#` comment lines (consistency with Story 1.6 AC10).
  - [x] Frontmatter MUST contain all 6 agentskills.io canonical fields populated with realistic values (no placeholders).
  - [x] Body MUST be at least 3 lines (skill name heading + descriptive sentence + optional *When to Use* note).
  - [x] LF line endings, UTF-8 no BOM, final newline (matches `caspian/.editorconfig` from Story 1.1).
  - [x] The `name` field MUST be `greeter` (per AC8).
  - [x] Do NOT include any Caspian fields (`schema_version`, `type`, `requires`, `produces`) in `before/SKILL.md` — the whole point is to show the artifact AS IT WAS before adoption.

- [x] **Task 3 — Author `after/SKILL.md` (Caspian-adopted overlay)** (AC: #2, #5, #6, #7, #8)
  - [x] Use the **Reference After-SKILL Model** in *Dev Notes* below as the authoritative starting point. The model satisfies AC5 + AC6 + AC7 + AC8 byte-faithfully.
  - [x] Start from `before/SKILL.md` as the byte-level basis. Add ONLY the Caspian fields at the top of the frontmatter. Do NOT modify, reorder, or rename any agentskills.io canonical field.
  - [x] Caspian fields appear in the canonical order: `schema_version`, `type`, `requires` (if present), `produces` (if present) — matching architecture line 405.
  - [x] The `type` value MUST be `examples:greeter` (per AC8 + epics line 683).
  - [x] Use block-style YAML for `produces` (parent on its own line, child key indented 2 spaces). Same for `requires` if included.
  - [x] Quote `schema_version: "0.1"` per architecture line 410 (string-typed YAML 1.2 floats are a known footgun — see Story 1.4 deferred-work).
  - [x] Frontmatter ≤ 30 lines (AC7).
  - [x] Frontmatter MUST contain only valid YAML key/value pairs — no `#` comment lines (consistency with Story 1.6 AC10).
  - [x] Body content is identical to `before/SKILL.md` (no body modifications — overlay-compat extends to the body, not just frontmatter).
  - [x] LF line endings, UTF-8 no BOM, final newline.

- [x] **Task 4 — Author the walkthrough README** (AC: #3)
  - [x] Use the **Reference Walkthrough README Model** in *Dev Notes* below as the authoritative starting point. The model satisfies AC3 byte-faithfully.
  - [x] The README MUST name all 4 Caspian fields (`schema_version`, `type`, `requires`, `produces`) with their optionality (R/O) and a one-line explanation each.
  - [x] The README MUST cross-reference `spec/core.md` via the relative link `../../spec/core.md` (epics line 673).
  - [x] The README MUST include the line-count caveat (the 4-field contract is the invariant; actual line count varies by which optional fields are included and YAML style chosen).
  - [x] The README MUST state explicitly that no Anthropic SKILL.md field is removed or modified by Caspian adoption (overlay-compat per FR5/NFR13/NFR16).
  - [x] The README MAY include a fenced `diff` code block showing the conceptual delta (RECOMMENDED for pedagogy; the *Reference Walkthrough README Model* includes one).
  - [x] LF line endings, UTF-8 no BOM, final newline.

- [x] **Task 5 — Cross-checks + smoke gate** (AC: #9, #10)
  - [x] Record in Dev Agent Record / Debug Log: results of Cross-checks #1 through #6 from AC10. Use a per-check audit table parallel to Story 1.6's pattern.
  - [x] Run `pnpm -C caspian lint` from the repository root. **Expected output:** Biome checks **7 files** in ~20ms, exit 0 (Stories 1.5 + 1.6 baseline preserved). If biome reports a higher count, investigate — the only added files are `.md` and should be excluded by `files.includes` not listing `**/*.md`. If a discrepancy appears, record the file count in Completion Notes and the chosen remediation (most likely none required).
  - [x] Run `pnpm -C caspian test`. **Expected output:** *No projects matched the filters in "F:\work\joselimmo-marketplace-bmad\caspian"*, exit code 0 (empty-workspace pattern from Stories 1.1–1.6 — unchanged).
  - [x] Run `diff caspian/examples/minimal-skill-adoption/before/SKILL.md caspian/examples/minimal-skill-adoption/after/SKILL.md` and confirm output contains ONLY `>` lines (additions). If any `<` line appears, the after/SKILL.md has modified or deleted content from before/SKILL.md — fix and re-run. Record the diff output line count in Completion Notes.
  - [x] Manually trace `after/SKILL.md`'s frontmatter through the envelope schema (Cross-check #2). Record the per-key classification table in Completion Notes.

- [x] **Task 6 — Sprint-status update + deferred-work tracking** (workflow only — no AC)
  - [x] Update File List in this story file with all new and modified files, paths relative to the repository root (i.e., `caspian/examples/...` not `examples/...`).
  - [x] Update `_bmad-output/implementation-artifacts/sprint-status.yaml`: transition `1-7-minimal-skill-adoption-example` from `in-progress` to `review` (this happens in dev-story Step 9 — included here for traceability; create-story has already moved it from `backlog` to `ready-for-dev`).
  - [x] Append any new Deferred-Work entries the dev surfaces during implementation (e.g., the optional `LICENSE.md` decision IF the dev skipped it; or the `caspian/spec/core.md` line 82 W004 reference IF noticed during cross-check #5 — already deferred from Story 1.5 review, re-link).

## Dev Notes

### Project Context

This is a **content-only** story — at most 5 new files (1 top-level README + 1 walkthrough README + 2 SKILL.md + 1 OPTIONAL LICENSE.md = **4 mandatory + 1 optional files total**), all flat data — zero source code, zero tests beyond the smoke gate. Story 1.6 sealed `caspian/fixtures/` (the validator's regression dataset); Story 1.7 produces the **author-readable adoption walkthrough** that complements the fixtures with a narrative explanation.

**The pedagogical purpose:** A plugin author who already maintains an Anthropic SKILL.md needs to see, in concrete byte-level form, exactly what changes when they adopt Caspian. The fixtures (Story 1.6) prove the validator works; the example (Story 1.7) proves adoption is trivial. The two artifacts have **distinct audiences and distinct file shapes** — the README pair (`fixtures/README.md` + `examples/README.md`) is intentionally short and explicitly cross-references to make this distinction unmissable.

**Forward dependencies that consume Story 1.7's outputs:**

- **Story 4.1** (`caspian.dev` landing page) — the 4-CTA hub on the landing page mirrors the root `caspian/README.md` 4-CTA hub (architecture line 364). The example walkthrough is one of the natural deep-link targets from the *"Get Started"* CTA. The site can link to `caspian/examples/minimal-skill-adoption/README.md` directly on GitHub.
- **Story 3.1+** (casper-core plugin) — the casper-core plugin's own SKILL.md / command files are themselves a (more elaborate) instance of the same overlay pattern. The `examples/minimal-skill-adoption/` example serves as the "reading reference" the casper-core README points new contributors to.
- **Future Story** (`examples/ci-integration/`) — FR36 deliverable (epics line 690 references it under Epic 2; architecture line 614 places it as a sibling of `minimal-skill-adoption/` under `examples/`). Story 1.7 establishes the `examples/` directory + the top-level README; the future CI story extends the directory with `ci-integration/` siblings without modifying Story 1.7's outputs.

**The architecture's "mixed license" position on `examples/`:** Architecture line 608 says `examples/` is *"mixed Apache-2.0 + CC-BY-4.0 (author-readable how-tos)"*. The READMEs are prose (CC-BY-4.0); the SKILL.md artifacts are functional examples (Apache-2.0). Architecture line 181 lists which directories re-declare their LICENSE explicitly — `examples/` is **NOT** in that list. The optional `examples/LICENSE.md` (Task 1's optional sub-task) clarifies this for isolated consumers; the model is `site/LICENSE.md`'s dual statement (architecture line 180).

### Architecture Compliance — MUST follow

**Source: `_bmad-output/planning-artifacts/architecture.md` step-06 (*Project Structure* — `examples/` subtree lines 608–616), step-04 (*YAML Frontmatter Authoring* lines 402–451), step-04 (*Markdown / Documentation Conventions* lines 416–425), step-04 (*Licensing per-directory* lines 175–181).**

- **Project Structure (architecture lines 608–616, examples subtree):**
  ```text
  examples/                                  # mixed Apache-2.0 + CC-BY-4.0 (author-readable how-tos)
  ├── README.md                              # 3-line clarification: complete walkthroughs, distinct from fixtures
  ├── minimal-skill-adoption/                # FR35 — Story 1.7's deliverable
  │   ├── README.md
  │   ├── before/SKILL.md                    # vanilla Anthropic SKILL.md
  │   └── after/SKILL.md                     # +4 lines Caspian frontmatter
  └── ci-integration/                        # FR36 — out of scope for Story 1.7
      ├── README.md
      └── github-actions-snippet.yml
  ```

- **YAML Frontmatter Authoring conventions (architecture lines 402–451):**
  - **Field-ordering convention** (top-to-bottom): (1) Caspian core: `schema_version`, `type`, `requires`, `produces`; (2) agentskills.io canonical: `name`, `description`, `license`, `allowed-tools`, `metadata`, `compatibility`; (3) Claude Code overlay: 12 fields; (4) `x-*` extension fields; (5) `<vendor>:<name>` namespaced fields. The `after/SKILL.md` MUST follow this order.
  - **Quoted version strings** — `schema_version: "0.1"` (always quoted; YAML 1.2 floats `0.1` are a known gotcha — see Story 1.4 deferred-work entry on `schema_version` float-cast trap).
  - **Spaces, not tabs** — every indent in the frontmatter is **spaces only** (rejected by `CASPIAN-E003` per NFR8 if violated).
  - **No comments in frontmatter.**
  - **`---` delimiters with newlines** — opening `---` on its own line, closing `---` on its own line, no trailing whitespace.
  - **Block-style YAML preferred over flow-style.** The `after/SKILL.md` should use block-style for `produces` (and `requires` if included). Flow style is acceptable but block is the convention.

- **Markdown / Documentation Conventions (architecture lines 416–425):**
  - **ATX headers** (`# Title`), never setext (underscored).
  - **One blank line between sections.**
  - **Fenced code blocks always carry a language tag** (` ```yaml `, ` ```diff `, ` ```text `).
  - **No trailing whitespace.**
  - **Field names and code identifiers in backticks** (`` `type` ``, `` `requires` ``).
  - **Spec prose authored in English** (per BMM `document_output_language: 'English'`). Same applies to all Story 1.7 prose.

- **Licensing position on `examples/` (architecture lines 175–181, 608):** Architecture line 608 says `examples/` is mixed Apache-2.0 + CC-BY-4.0. Architecture line 181 does NOT list `examples/` in the re-declare-LICENSE-explicitly directories. Story 1.6 added a plain-text Apache-2.0 `caspian/fixtures/LICENSE` because `fixtures/` IS in that list; Story 1.7 should NOT add a plain-text Apache-2.0 `caspian/examples/LICENSE` because the directory is mixed-license and would mislabel the README prose. The optional `examples/LICENSE.md` (Task 1's optional sub-task) is the dual-statement variant matching `site/LICENSE.md`'s precedent (architecture line 180); add it for clarity if desired, skip it without violating any AC.

- **Cross-cutting: overlay-compat is the testable property (architecture step-02 + spec/core.md *§Overlay-Compatibility*):** Story 1.7's `before/`/`after/` pair is the **byte-level proof** that overlay-compat holds. The diff-based test in AC5 ("zero deletions, zero modifications") IS the property; if the diff shows ANY `<` line the overlay-compat claim fails. The fixture `caspian/fixtures/valid/overlay-compat/all-22-known-fields.md` (Story 1.6) validates the SAME property at the validator level (zero W001 warnings); Story 1.7 validates it at the **author-experience level** (zero refactoring required to adopt).

### Reference Top-Level README Model

This is the canonical model for `caspian/examples/README.md`. It satisfies AC1.

```markdown
# Caspian Examples

The files in this directory are author-readable walkthroughs of Caspian
adoption patterns. They are not validator regression data — for those,
see [`../fixtures/`](../fixtures/).
```

**Notes for the dev:**

- The body is exactly 3 lines of prose (lines 3, 4, 5 above; line 1 is the heading; line 2 is blank). The 3-line budget is the AC1 hard requirement.
- The link `../fixtures/` resolves on GitHub today (Story 1.6 sealed `caspian/fixtures/`).
- Mirror Story 1.6's `caspian/fixtures/README.md` style byte-faithfully (3-line body, ATX header, blank separator, link to the sibling directory). The two READMEs read as a pair; the symmetry is the pedagogical point.
- ATX header (`# Heading`), one blank line between header and body, LF line endings, UTF-8 no BOM, final newline.

### Reference Walkthrough README Model

This is the canonical model for `caspian/examples/minimal-skill-adoption/README.md`. It satisfies AC3.

````markdown
# Minimal Skill Adoption Example

This walkthrough shows what changes when an existing
[Anthropic SKILL.md](https://github.com/anthropics/skills) adopts Caspian
Core. The artifact stays loadable in any Anthropic-compatible host;
Caspian fields are purely additive (overlay-compatible per FR5).

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
  description: ...
  license: Apache-2.0
  allowed-tools: [...]
  metadata: {...}
  compatibility: {...}
```

No agentskills.io canonical field is removed or modified. A host that
ignores Caspian fields entirely loads the artifact unchanged.
````

**Notes for the dev:**

- The README uses fenced `diff` code blocks (the outer triple-backtick wrapping uses 4 backticks `` ```` `` to nest a 3-backtick block inside — copy the model byte-faithfully).
- The link `../../spec/core.md` resolves to `caspian/spec/core.md` (Story 1.2's deliverable, sealed).
- The link to Anthropic's skills repo (`https://github.com/anthropics/skills`) is informational; if the URL changes upstream the README link may break — acceptable per the project's *forward-reference annotation discipline*. The dev MAY substitute `https://docs.anthropic.com/en/docs/claude-code/skills` or another canonical URL if preferred.
- The README MAY be shorter or longer than the model. The hard requirements are AC3's enumerated content (4 Caspian fields named with optionality + cross-reference + line-count caveat + overlay-compat statement).
- ATX header, blank lines between sections, LF line endings, UTF-8 no BOM, final newline.

### Reference Before-SKILL Model

This is the canonical model for `caspian/examples/minimal-skill-adoption/before/SKILL.md`. It satisfies AC4 + AC8.

```markdown
---
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
```

**Per-field rationale (the 6 agentskills.io canonical fields):**

| Field | Value | Rationale |
|---|---|---|
| `name` | `greeter` | Per AC8 + epics line 683 — the skill name is `greeter`, namespace `examples:`. |
| `description` | one sentence describing the skill | Realistic populating; not a `<placeholder>` stub (AC4). |
| `license` | `Apache-2.0` | SPDX identifier; matches the surrounding examples directory's mixed-license stance for code artifacts. |
| `allowed-tools` | `[Read]` (block style) | Realistic minimal tool set for a greeting skill; block-style 1-element array exercises the YAML conventions. |
| `metadata` | `{author, version}` block | Realistic free-form metadata; agentskills.io canonical permits arbitrary keys under `metadata`. |
| `compatibility` | `{agentskills: "1.0"}` block | Realistic agentskills.io compatibility marker; the value is a quoted string per architecture line 410. |

**Notes:**

- 10 frontmatter lines total (between the `---` delimiters). Comfortably under any reasonable cap; leaves room for the 4 Caspian additions in `after/SKILL.md` while staying under AC7's 30-line limit.
- Body is 5 lines of prose (heading + sentence + blank + heading + sentence). Satisfies AC4's "≥3 lines" body requirement.
- No tabs, no trailing whitespace, no comments inside frontmatter.
- LF line endings, UTF-8 no BOM, final newline.
- `metadata.version: "1.0.0"` is quoted to avoid YAML 1.2 float-cast (a `1.0.0` string parses fine without quoting since it has two dots, but `1.0` would float-cast — quoting `"1.0.0"` is defensive consistency).

### Reference After-SKILL Model

This is the canonical model for `caspian/examples/minimal-skill-adoption/after/SKILL.md`. It satisfies AC5 + AC6 + AC7 + AC8.

```markdown
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
```

**Per-Caspian-field rationale (the 4 added lines):**

| Field | Value | Rationale |
|---|---|---|
| `schema_version` | `"0.1"` (quoted) | OPTIONAL but explicit for pedagogy. Quoted to avoid YAML float-cast (Story 1.4 deferred-work). The README's table notes this is OPTIONAL; the example includes it to make the producer's target schema generation explicit. |
| `type` | `examples:greeter` | REQUIRED. Demonstrates the `<vendor>:<name>` namespacing convention from FR4 (epics line 683). The namespace `examples:` is shared with Story 1.6's `vendor-namespaced.md` invalid fixture — same pedagogical thread. |
| `produces` | `{type: core:scratch}` (block) | OPTIONAL but realistic: a greeter skill emits a transient salutation, semantically a `core:scratch` per `caspian/spec/vocabulary/scratch.md`. Block style per architecture line 411. |
| `requires` | OMITTED | OPTIONAL. The greeter has no preconditions — a realistic minimal skill omits `requires` rather than declaring an empty array. The README's table mentions `requires` as OPTIONAL; the example demonstrates the omission case. |

**Diff vs `before/SKILL.md` (proves overlay-compat):**

```diff
+++ after/SKILL.md
+ schema_version: "0.1"
+ type: examples:greeter
+ produces:
+   type: core:scratch
  name: greeter
  description: Greet a user by name with a polite, time-of-day-aware salutation.
  ...
```

**Exactly 4 lines added** to the frontmatter (`schema_version` + `type` + `produces:` + `  type: core:scratch`). Body is unchanged (line-by-line identical to `before/SKILL.md`).

**Frontmatter line count (AC7 cap is 30):** 14 lines between the `---` delimiters (4 Caspian additions + 10 agentskills.io canonical lines, where `metadata` and `compatibility` are 2 lines each in block style and `allowed-tools` is 2 lines for the block array). Well under the 30-line cap.

**Notes:**

- The Caspian fields appear at the TOP of the frontmatter (architecture line 405 ordering convention).
- All YAML conventions from architecture lines 402–451 are observed: quoted version string, spaces not tabs, block style for multi-line constructs, no comments, ATX heading.
- `core:scratch` is a canonical `core:*` type from Story 1.3's vocabulary (`caspian/spec/vocabulary/scratch.md`). Choosing `core:scratch` keeps the example aligned with the canonical vocabulary rather than introducing a vendor-namespaced output type.
- LF line endings, UTF-8 no BOM, final newline.

### Reference LICENSE.md Model (OPTIONAL)

This is the canonical model for the OPTIONAL `caspian/examples/LICENSE.md`. It mirrors `site/LICENSE.md` from architecture line 180 (the dual-statement license precedent). Add it if you want the `examples/` directory's mixed-license stance to be explicit when the directory is consumed in isolation; skip it without violating any AC.

```markdown
# License

The contents of this directory are dual-licensed:

- **Prose** (`*.md` files containing walkthrough explanations) — licensed
  under [CC-BY-4.0](../LICENSE-CC-BY-4.0). Same license as the spec
  prose under `../spec/`.
- **Skill artifacts** (`*/SKILL.md` files and other functional code-like
  example artifacts) — licensed under [Apache-2.0](../LICENSE). Same
  license as the rest of the project.

Each file's license boundary follows its purpose. When in doubt, prose
under `examples/` is CC-BY-4.0; functional artifacts are Apache-2.0.
```

**Notes:**

- Use `.md` extension (not plain-text `LICENSE`) because the file is a dual-statement explainer, not a license text dump. Same convention `caspian/spec/LICENSE.md` (Story 1.2) uses.
- Architecture line 181 lists which directories re-declare LICENSE explicitly: `packages/cli`, `packages/casper-core`, `schemas`, `diagnostics`, `fixtures`. `examples/` is NOT listed. The optional LICENSE.md is a defensive clarity addition, not a strict requirement.
- LF line endings, UTF-8 no BOM, final newline.

### Project Structure Notes

- **Alignment with unified project structure (paths, modules, naming):**
  - `caspian/examples/` is the new top-level directory introduced by this story.
  - `caspian/examples/minimal-skill-adoption/` is the FR35 deliverable (epics line 657, architecture line 610).
  - Subdirectory naming follows kebab-case (`minimal-skill-adoption`, `before`, `after`) per `caspian/biome.json` `useFilenamingConvention`.
  - File naming: `README.md`, `LICENSE.md`, `SKILL.md` use the canonical SCREAMING-SNAKE convention common to OSS repos (allowed by biome's `useFilenamingConvention` because the rule applies only to JS/TS/JSON files — markdown is out of biome's scope).
  - The vendor namespace `examples:` is consistent with Story 1.6's `vendor-namespaced.md` invalid fixture (`caspian/fixtures/invalid/W001-unknown-field/vendor-namespaced.md` field name `examples:custom-field`).

- **Detected conflicts or variances (with rationale):**
  - **PRD line 556 says `spec/examples/minimal-skill-adoption/`** but **architecture line 610 + epics line 668 say `examples/minimal-skill-adoption/` (top-level)**. The architecture + epics are the canonical sources for Story 1.7's path. PRD line 556 is a stale artifact from an earlier draft; defer correction to a PRD cleanup story (not in scope here). The dev MUST place the directory at top-level `caspian/examples/`, NOT `caspian/spec/examples/`.
  - **Architecture line 391 says `all-22-fields.md`** while **epics line 636 says `all-22-known-fields.md`** for the Story 1.6 fixture. Story 1.6 followed the epics. The same precedent applies if any naming variance arises in Story 1.7 — defer to epics.
  - **Architecture line 608 calls `examples/` "mixed Apache-2.0 + CC-BY-4.0"** but **architecture line 181 omits `examples/` from the per-directory LICENSE re-declare list**. Story 1.7 resolves this by making `examples/LICENSE.md` OPTIONAL (Task 1 sub-task) — neither violating line 181's omission nor ignoring line 608's mixed-license signal.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md`#Story 1.7 (lines 657–684)] — the AC source.
- [Source: `_bmad-output/planning-artifacts/architecture.md`#Project Structure (lines 593–616)] — the directory layout.
- [Source: `_bmad-output/planning-artifacts/architecture.md`#YAML Frontmatter Authoring (lines 402–451)] — frontmatter style conventions (field ordering, quoted versions, block style, no comments).
- [Source: `_bmad-output/planning-artifacts/architecture.md`#Markdown / Documentation Conventions (lines 416–425)] — README/markdown style conventions.
- [Source: `_bmad-output/planning-artifacts/architecture.md`#Licensing (lines 175–181)] — per-directory LICENSE re-declare rule.
- [Source: `_bmad-output/planning-artifacts/architecture.md` line 364] — `caspian.dev` 4-CTA hub (forward consumer).
- [Source: `_bmad-output/planning-artifacts/prd.md`#FR35 (line 556)] — the original FR for the minimal-skill-adoption example. Note path discrepancy with epics/architecture (resolved in *Project Structure Notes* above).
- [Source: `_bmad-output/planning-artifacts/prd.md`#FR4–FR5 (lines 507–508)] — vendor namespacing + agentskills.io canonical fields.
- [Source: `_bmad-output/planning-artifacts/prd.md`#NFR13 + NFR16 (lines 588, ~610)] — overlay-compatibility property.
- [Source: `caspian/spec/core.md`#Overlay-Compatibility (lines 167–186)] — the 22-field allow-list and the overlay-compat contract this example demonstrates.
- [Source: `caspian/spec/core.md`#`schema_version` (lines 39–63)] — `schema_version` defaults and quoted-string discipline.
- [Source: `caspian/spec/core.md`#`type` (lines 65–97)] — `<vendor>:<name>` namespacing convention.
- [Source: `caspian/spec/core.md`#`requires` (lines 99–126)] — `requires` shape and optionality.
- [Source: `caspian/spec/core.md`#`produces` (lines 128–151)] — `produces` shape and optionality.
- [Source: `caspian/spec/vocabulary/scratch.md`] — `core:scratch` rationale (used as the `produces.type` value in `after/SKILL.md`).
- [Source: `caspian/schemas/v1/envelope.schema.json`] — the schema `after/SKILL.md` validates against (Story 1.4 deliverable).
- [Source: `caspian/fixtures/README.md`] — the byte-faithful style precedent for `examples/README.md` (Story 1.6 deliverable).
- [Source: `caspian/fixtures/valid/overlay-compat/all-22-known-fields.md`] — the validator-level twin of this story's author-level proof of overlay-compat (Story 1.6 deliverable).
- [Source: `caspian/fixtures/invalid/W001-unknown-field/vendor-namespaced.md`] — the source of the `examples:` namespace alignment used by AC8 (Story 1.6 deliverable).
- [Source: `_bmad-output/implementation-artifacts/1-6-canonical-fixture-set-valid-invalid.md`#Reference README Model] — the precedent for the 3-line README convention.
- [Source: `_bmad-output/implementation-artifacts/deferred-work.md`#1.4 review — `schema_version: 0.1` YAML float-cast trap] — the rationale for quoting `"0.1"` in `after/SKILL.md`.

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context)

### Debug Log References

**Cross-check #1 — `before/SKILL.md` is a valid Anthropic SKILL.md.**

| Property | Value | Pass |
|---|---|---|
| YAML frontmatter parses (visual inspection between `---` delimiters) | yes | ✅ |
| 6 agentskills.io canonical fields present | `name`, `description`, `license`, `allowed-tools`, `metadata`, `compatibility` (all 6) | ✅ |
| Body line count (≥3 required) | 10 lines (`# Greeter Skill` + descriptive sentence wrapped over 2 lines + blank + `## When to Use` + 2-line sentence + interspersed blanks) | ✅ |
| No `#` comment lines inside frontmatter | confirmed | ✅ |
| `name` field value | `greeter` (per AC8) | ✅ |
| Caspian fields absent (no `schema_version`, `type`, `requires`, `produces`) | confirmed (file is purely vanilla Anthropic) | ✅ |
| Frontmatter line count between `---` delimiters | 10 lines | ✅ |

**Cross-check #2 — `after/SKILL.md` validates against envelope schema (manual trace).**

Per-key classification table (top-level keys only):

| # | Key | Category | Value | Schema constraint satisfied |
|---|---|---|---|---|
| 1 | `schema_version` | Caspian core | `"0.1"` | string in recognized set `["0.1"]` ✅ |
| 2 | `type` | Caspian core | `examples:greeter` | matches `^[^:]+:.+$` (namespace `examples`, name `greeter`) ✅ |
| 3 | `produces` | Caspian core | `{type: core:scratch}` | object with required `type` matching pattern; no extra props ✅ |
| 4 | `name` | agentskills.io canonical | `greeter` | recognized — no W001 ✅ |
| 5 | `description` | agentskills.io canonical | one sentence | recognized — no W001 ✅ |
| 6 | `license` | agentskills.io canonical | `Apache-2.0` | recognized — no W001 ✅ |
| 7 | `allowed-tools` | agentskills.io canonical | `[Read]` | recognized — no W001 ✅ |
| 8 | `metadata` | agentskills.io canonical | `{author, version}` | recognized — no W001 ✅ |
| 9 | `compatibility` | agentskills.io canonical | `{agentskills: "1.0"}` | recognized — no W001 ✅ |

All 9 top-level keys fall in category (a) Caspian core (3 keys) or (b) agentskills.io canonical (6 keys). Zero unrecognized fields → zero W001 warnings expected. `type` matches the namespace pattern; `produces.type` matches the namespace pattern; `schema_version` is in the recognized set. **Verdict: zero errors, zero warnings — validates cleanly per AC6.**

**Cross-check #3 — overlay-compat diff proof.**

```text
$ diff caspian/examples/minimal-skill-adoption/before/SKILL.md \
       caspian/examples/minimal-skill-adoption/after/SKILL.md
1a2,5
> schema_version: "0.1"
> type: examples:greeter
> produces:
>   type: core:scratch
```

- 4 `>` lines (additions): `schema_version`, `type`, `produces:`, `  type: core:scratch`
- 0 `<` lines (deletions)
- 0 modified lines (no `<` ... `---` ... `>` blocks)

**Verdict: byte-level proof of overlay-compat.** Every line of `before/SKILL.md` appears verbatim and unchanged in `after/SKILL.md`. AC5 satisfied.

**Cross-check #4 — `after/SKILL.md` frontmatter length.**

| Metric | Value | Cap | Pass |
|---|---|---|---|
| Lines between opening `---` and closing `---` (exclusive) | 14 | ≤ 30 | ✅ |

Composition: 4 Caspian (`schema_version`, `type`, `produces:`, `  type: core:scratch`) + 10 agentskills.io canonical (1 each for `name`, `description`, `license`, `compatibility:`; 2 each for `allowed-tools` block, `metadata` block + 2 children, `compatibility` child = 1+1+1+2+3+2 = 10).

**Cross-check #5 — walkthrough README explains all 4 Caspian fields + cross-references `spec/core.md`.**

| Item | Verified | Pass |
|---|---|---|
| All 4 Caspian fields named with optionality (R/O) | table at line ~30 of `caspian/examples/minimal-skill-adoption/README.md` lists `schema_version` (OPTIONAL), `type` (REQUIRED), `requires` (OPTIONAL), `produces` (OPTIONAL) | ✅ |
| Cross-reference to `../../spec/core.md` | `See [`../../spec/core.md`](../../spec/core.md) for the full normative contract...` | ✅ |
| Line-count caveat present | *"the actual number of YAML lines added depends on which optional fields you include and whether you write them in block or flow style — the **4-field surface** is the invariant, not a fixed line count."* | ✅ |
| Overlay-compat statement (no Anthropic field removed/modified) | *"No agentskills.io canonical field is removed or modified. A host that ignores Caspian fields entirely loads the artifact unchanged."* | ✅ |
| `diff` code block showing conceptual delta | fenced ```` ```diff ```` block included | ✅ |
| Anthropic SKILL.md cross-link | `https://docs.anthropic.com/en/docs/claude-code/skills` (chosen over the bare `github.com/anthropics/skills` per Reference Model dev-note that allows substitution) | ✅ |

**Cross-check #6 — `examples/README.md` line budget + cross-reference to `fixtures/`.**

| Item | Verified | Pass |
|---|---|---|
| Body prose line count (excluding `# Caspian Examples` heading and blank separator) | 3 lines (`The files in this directory…`, `adoption patterns…`, `see [`../fixtures/`](../fixtures/).`) | ✅ |
| Cross-reference to `../fixtures/` | present, anchor text `[`../fixtures/`](../fixtures/)` | ✅ |
| ATX header form | `# Caspian Examples` | ✅ |
| Mirrors Story 1.6's `caspian/fixtures/README.md` style | yes — same 3-line body budget, same cross-reference shape, same ATX heading discipline | ✅ |

**Smoke gate.**

| Command | Expected | Actual | Pass |
|---|---|---|---|
| `pnpm -C caspian lint` | Biome checks 7 files in ~20ms, exit 0 (Stories 1.5/1.6 baseline) | `Checked 7 files in 40ms. No fixes applied.` exit 0 | ✅ |
| `pnpm -C caspian test` | `No projects matched the filters in "F:\work\joselimmo-marketplace-bmad\caspian"` exit 0 | matches verbatim, exit 0 | ✅ |

**Biome scope confirmation:** the 4 new `.md` files + the optional `LICENSE.md` are NOT linted because `caspian/biome.json` `files.includes` does not list `**/*.md`. The 7-file baseline from Stories 1.5/1.6 is preserved exactly. No `caspian/biome.json` or `caspian/.biomeignore` modification was required (AC9 self-fulfilling).

### Completion Notes List

- **Optional `LICENSE.md` taken.** Authored `caspian/examples/LICENSE.md` with the dual-statement (CC-BY-4.0 prose + Apache-2.0 SKILL.md artifacts) per the *Reference LICENSE.md Model*. Rationale: makes the architecture line 608 *"mixed Apache-2.0 + CC-BY-4.0"* stance explicit when `examples/` is consumed in isolation; mirrors the `site/LICENSE.md` precedent (architecture line 180). Adding it sidesteps the future ambiguity of "which license applies to this README" that an isolated consumer would face.
- **`type` value `examples:greeter` chosen over alternatives.** Per epics line 683 + AC8. The `examples:` namespace is shared with Story 1.6's `vendor-namespaced.md` invalid fixture (`caspian/fixtures/invalid/W001-unknown-field/vendor-namespaced.md` field name `examples:custom-field`). Keeping the same vendor namespace across stories means a reader who sees `examples:` once in the fixtures and once in the example walkthrough mentally connects them as the same pedagogical thread — not two unrelated synthetic vendors.
- **`produces.type: core:scratch` chosen over `produces` omission.** A greeting is a transient salutation, semantically a `core:scratch` per `caspian/spec/vocabulary/scratch.md`. Choosing a canonical `core:*` type for the `produces.type` (rather than another `examples:*` value) keeps the example aligned with the canonical vocabulary — the reader sees "Caspian's `type` namespacing applies to BOTH the artifact's own type AND the type of what it produces; `examples:greeter` produces `core:scratch`."
- **`requires` omitted from `after/SKILL.md`.** The greeter has no typed preconditions; declaring `requires: []` would be semantically vacuous (an empty array is equivalent to omitting the field). The walkthrough README's table explains `requires` as OPTIONAL and the *Why these specific Caspian fields here* section says explicitly *"`requires` is omitted here because the greeter has no typed preconditions."* This makes the omission a deliberate pedagogical choice, not a gap.
- **4-line delta exact in block style.** The diff shows precisely 4 added lines (`schema_version`, `type`, `produces:`, `  type: core:scratch`). The "4-line frontmatter delta" wording in the AC + the walkthrough README's title is satisfied by the literal line count under block-style YAML; the README's table separately explains that the *4-field surface* is the invariant if a reader counts differently in flow style. Both interpretations are honored.
- **Anthropic SKILL.md cross-link substituted.** The walkthrough README links to `https://docs.anthropic.com/en/docs/claude-code/skills` instead of the `github.com/anthropics/skills` URL the Reference Model defaulted to. Rationale: the docs URL is the canonical entry point Anthropic itself promotes for Claude Code skills; the GitHub repo URL is more likely to drift (rename, reorg) than the docs URL. The Reference Model explicitly allowed this substitution.
- **Body content of both `SKILL.md` files is identical.** The byte-level diff (Cross-check #3) confirms zero body modifications — the 10-line body of `before/SKILL.md` appears verbatim in `after/SKILL.md`. Overlay-compat extends to the body, not just the frontmatter.
- **`metadata.version: "1.0.0"` quoted defensively.** The string `1.0.0` would not float-cast in YAML (two dots), but the surrounding discipline of quoting all version-like values (the `schema_version: "0.1"` rule from architecture line 410 and Story 1.4's deferred-work entry) is applied uniformly for consistency. Same for `compatibility.agentskills: "1.0"` (which WOULD float-cast unquoted — defensive quoting required).
- **No deferred-work entries surfaced.** Cross-check #5 noted the `caspian/spec/core.md` line 82 `CASPIAN-W004` reference is already deferred from Story 1.5's review (recorded in `_bmad-output/implementation-artifacts/deferred-work.md`); not re-recording here. No new deferrals from Story 1.7's implementation.

### File List

**New files (5 total):**

- `caspian/examples/README.md` (new) — top-level 3-line statement, mirrors `caspian/fixtures/README.md`
- `caspian/examples/LICENSE.md` (new — OPTIONAL, taken) — dual-statement license clarifying the mixed CC-BY-4.0 + Apache-2.0 stance
- `caspian/examples/minimal-skill-adoption/README.md` (new) — walkthrough explainer with 4-field table + diff block + cross-references
- `caspian/examples/minimal-skill-adoption/before/SKILL.md` (new) — vanilla Anthropic SKILL.md with 6 agentskills.io canonical fields
- `caspian/examples/minimal-skill-adoption/after/SKILL.md` (new) — same file plus 4 lines of Caspian frontmatter (`schema_version`, `type`, `produces:`, `  type: core:scratch`)

**Modified files (2 total):**

- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified) — 1-7 transitions ready-for-dev → in-progress → review
- `_bmad-output/implementation-artifacts/1-7-minimal-skill-adoption-example.md` (modified) — task checkboxes ticked, Dev Agent Record + File List + Status filled in

**No deletions. No modifications outside this list.**

### Change Log

| Date | Action | Rationale |
|---|---|---|
| 2026-04-27 | Story created (create-story workflow) | Sprint-status moved 1-7 backlog → ready-for-dev; comprehensive context + Reference Models for all 4 mandatory + 1 optional file |
| 2026-04-27 | Story implemented (dev-story workflow) | Sprint-status moved 1-7 ready-for-dev → in-progress → review; 5 new files authored byte-faithfully to Reference Models; 6 cross-checks recorded; smoke gate green (7 files / exit 0) |
| 2026-04-27 | Story closed (manual user review) | Sprint-status moved 1-7 review → done after manual review by user (no BMad code-review workflow run; no patches/deferrals/dismissals recorded) |
