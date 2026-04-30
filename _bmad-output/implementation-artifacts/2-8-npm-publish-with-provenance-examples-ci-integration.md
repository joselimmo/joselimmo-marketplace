# Story 2.8: npm publish with provenance + `examples/ci-integration/`

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a plugin author who just decided to adopt Caspian,
I want to install the CLI from npm via a clean, signed package and copy a 3-line CI integration snippet into my own GitHub Actions workflow,
so that I can gate my repo's PRs on Caspian conformance in under five minutes (FR29, FR36, NFR15, NFR17, NFR20).

## Working Directory

All paths in this story resolve **inside `caspian/`** — the sub-monorepo under the surrounding `joselimmo-marketplace-bmad` repository. References like `packages/cli/`, `packages/core/`, `examples/`, `scripts/`, `.github/`, `.changeset/`, `package.json`, `pnpm-workspace.yaml` resolve to `caspian/packages/cli/`, `caspian/examples/`, `caspian/scripts/`, `caspian/.github/`, `caspian/.changeset/`, `caspian/package.json`, etc. Never create files outside `caspian/` (with the single exception of sprint-status / story-file updates under `_bmad-output/implementation-artifacts/`).

**Destination repository (confirmed 2026-04-30):** `https://github.com/joselimmo/caspian` (currently empty). The architecture-prescribed *"migrates to a dedicated `caspian/` repository when the spec stabilizes"* (`architecture.md:520`) now has a concrete address. The repo extraction itself is an **operational step** (a one-time `git filter-repo` / fresh push of `caspian/` contents) and is **out of scope for this story** — Story 2.8 is `done` when the workflow file, examples, and metadata are correct in the nested layout, regardless of when the extraction happens. The destination URL is wired into the package metadata (AC4, AC5) and the npm package pages will link to `https://github.com/joselimmo/caspian` from day-1 of the v0.1.0 publish; a 404 is only possible in the brief window between the npm publish and the first push to `joselimmo/caspian`. The user owns the timing of the extraction.

`caspian/packages/{core,cli}/` already exist from Stories 2.1 → 2.6 with the full validator pipeline, CLI surface, `--format=json` output (B4 schema), `verify-pack` published-files snapshot gate, and the `caspian.supportedSchemaVersions: ["0.1"]` declaration. `caspian/.github/workflows/ci.yml`, `caspian/conformance/`, `caspian/scripts/{audit-lockfile-vendor-neutrality,vendor-neutrality-docker}.mjs`, and `caspian/packages/cli/.dependency-cruiser.cjs` are all in place from Story 2.7. `caspian/.changeset/{config.json, README.md}` are present from the original Story 2.1 monorepo bootstrap. **Story 2.8 ships the first public npm release** by adding `release.yml`, the `examples/ci-integration/` how-to, the version bump to `0.1.0`, and the few release-hygiene fixes (`.tsbuildinfo` exclusion, snapshot regeneration, docker shim swap to `npx`) that are blocking the publish.

This story creates these new files:

- `caspian/.github/workflows/release.yml` — GitHub Actions release workflow. Trigger: `push` to `main` only (no PR trigger; PRs are gated by `ci.yml`). Uses the official `changesets/action@v1` with `publish: pnpm release` to either compose a "Version Packages" release PR or, on merge of that PR, run `pnpm publish -r --provenance` against `@caspian-dev/core` then `@caspian-dev/cli`. Permissions: `contents: write` (for the release PR + tag push) and `id-token: write` (mandatory for npm OIDC provenance per [npm provenance docs](https://docs.npmjs.com/generating-provenance-statements)). Pre-publish blocking gates run inline before `changesets/action`: `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm depcruise` → `pnpm verify-codes-hash` → `pnpm test` → `pnpm ajv-validate-registry` → `pnpm verify-pack` → `pnpm audit-vendor-neutrality` → `pnpm build` → `pnpm conformance` → `pnpm vendor-neutrality:docker` (the layer-3 docker gate not run by `ci.yml`). All gates exit non-zero blocks the publish.
- `caspian/examples/ci-integration/README.md` — author-readable how-to. Explains: (1) install Node ≥22 in CI via `actions/setup-node@v4` with `node-version: '22'` (or pin a minor), (2) run `npx @caspian-dev/cli@<pinned-version> validate ./<your-skills-path>/`, (3) PR fails on non-zero exit (default GitHub Actions behavior), (4) optional strict-warnings gate via `npx @caspian-dev/cli validate --format=json ./skills/ | jq -e '.summary.errors == 0 and .summary.warnings == 0'` (PRD Journey 6 reference), (5) zero Claude Code references — vendor-neutrality preserved (NFR17). Dual-licensed under `examples/LICENSE.md` (prose CC-BY-4.0; functional artifacts Apache-2.0).
- `caspian/examples/ci-integration/github-actions-snippet.yml` — copy-pasteable workflow snippet. The validation step is exactly **three YAML lines** (excluding `actions/checkout` and `actions/setup-node` setup boilerplate per epic AC): `- name: Validate Caspian frontmatter`, `  run: npx @caspian-dev/cli@<version> validate ./skills/`, `  shell: bash`. The file as a whole is a complete, runnable `.github/workflows/*.yml` example with: `name`, `on: { pull_request: ... }`, `jobs.validate: { runs-on: ubuntu-latest, steps: [checkout, setup-node, validate] }`. No reference to Claude Code anywhere in the snippet.
- `caspian/.changeset/0001-initial-public-release.md` — first changeset, hand-authored. Declares `"@caspian-dev/core": minor` AND `"@caspian-dev/cli": minor` (matching the architecture's *"version `0.1.0` first publish"* per `architecture.md:912`); body summarizes Stories 2.1 → 2.8 as the v0.1.0 surface (validator pipeline, CLI binary, JSON output, conformance suite, vendor-neutrality enforcement). Triggers the `changesets/action` to bump `0.0.1 → 0.1.0` on both packages and compose the corresponding "Version Packages" release PR.
- (Generated, NOT hand-edited; produced by `changesets version` running inside the workflow on the release PR): `caspian/.changeset/0001-initial-public-release.md` is consumed and deleted by `changesets version`; `caspian/packages/{core,cli}/CHANGELOG.md` get a new `## 0.1.0` section composed from the changeset; `caspian/packages/{core,cli}/package.json` `version` field bumps `0.0.1 → 0.1.0`. The dev does NOT pre-bump the version manually — they author the changeset only; the workflow does the rest. (For the local pre-PR smoke test that proves the workflow works, the dev MAY run `pnpm changeset version` locally to verify the diff, then `git restore` to undo before pushing — see Task 4.)

This story modifies these existing files:

- `caspian/packages/cli/package.json` — no shape change (everything below already correct from Story 2.5+). The dev VERIFIES (not edits): `name = "@caspian-dev/cli"`, `version = "0.0.1"` (the changeset will bump it to `0.1.0` at release time — no pre-bump), `bin = {"caspian": "./dist/cli.js"}`, `engines.node = ">=22.13"`, `caspian.supportedSchemaVersions = ["0.1"]`, `files = ["dist/", "README.md", "CHANGELOG.md", "LICENSE"]`, `publishConfig = { "access": "public", "provenance": true }`. The `provenance: true` key in `publishConfig` is what tells npm CLI to attach the Sigstore attestation when invoked from a workflow with an OIDC token — a Story 2.5 lookahead that lands in this story.
- `caspian/packages/core/package.json` — same verification pass; no shape change. `name = "@caspian-dev/core"`, `version = "0.0.1"` (bumped at release), `engines.node = ">=22.13"`, `files = ["dist/", "README.md", "CHANGELOG.md", "LICENSE"]`, `publishConfig = { "access": "public", "provenance": true }`.
- `caspian/packages/cli/tsconfig.json` — relocate `tsBuildInfoFile` from `./dist/.tsbuildinfo` to a path **outside `dist/`** (e.g., `./.tsbuildinfo` at the package root, which is excluded from `files` and gitignored) OR keep `dist/.tsbuildinfo` and add `dist/.tsbuildinfo` to a new `caspian/packages/cli/.npmignore`. This story uses **the relocate approach** (cleaner: zero `.npmignore` files, fewer moving parts; the `files` allow-list shape is already restrictive). Same change applied to `caspian/packages/core/tsconfig.json`. Closes the Story 2.1 deferred item (`deferred-work.md:80`: *"`dist/.tsbuildinfo` published to npm with absolute machine paths"*).
- `caspian/packages/cli/tests/integration/published-files.snapshot.json` — regenerate after the `.tsbuildinfo` exclusion lands. The snapshot drops the `dist/.tsbuildinfo` entry (line 6 today); `pnpm verify-pack` re-passes against the new baseline (40 files instead of 41).
- `caspian/packages/cli/README.md` — minor additive edits. Confirm install instructions show BOTH `npm install -g @caspian-dev/cli` (binary in PATH = `caspian`) AND `npx @caspian-dev/cli validate <path>` (zero-install). Confirm exit-code matrix (0/1/2/3) is documented. Confirm `--format=json` schema is documented. Append a footer line linking to `caspian.dev` for the spec + diagnostics reference (the site itself is Epic 4 work; the link is a forward reference that is allowed to 404 until Epic 4 ships, since the published README is consumed by readers AFTER caspian.dev exists per the v1.0 release coordination plan; if Epic 4 ships before Story 2.8 publishes, the link works on day-1 of the release).
- `caspian/packages/core/README.md` — append a footer line linking to `caspian.dev` for the spec reference (same forward-reference policy as above). No other changes; the existing API surface description from Story 2.3 is preserved.
- `caspian/scripts/vendor-neutrality-docker.mjs` — switch the in-container install from the Story 2.7 local-tarball shim (`pnpm pack` of both `@caspian-dev/core` + `@caspian-dev/cli` → `npm install` of both tarballs) to the architecture-prescribed `npx @caspian-dev/cli@<published-version> validate ./fixtures/`. Closes the Story 2.7 deferred item D2 (*"transitional shim until Story 2.8 publish"*). The version pinned in the `npx` call is the just-published version captured from `package.json` at script invocation time (read via `JSON.parse(readFileSync('packages/cli/package.json'))`); pre-publish runs use the local tarball flow as a fallback (controlled by an env var `CASPIAN_DOCKER_GATE_MODE=local-tarball|npx-published`, defaulting to `npx-published` in CI's `release.yml` after publish, `local-tarball` for local pre-publish smoke). The script's docker-skip-when-absent behavior, the in-container scratch dir (NOT bind-mount), and the read-only `:ro` fixtures mount are all preserved verbatim from Story 2.7.
- `caspian/.changeset/config.json` — add `"changelog": "@changesets/changelog-github"` (or keep the default `@changesets/cli/changelog`) and ensure `"baseBranch": "main"` and `"access": "public"` are set. Both are already correct in the current file — this is a verification, not an edit. The only edit is OPTIONAL: switch from the default changelog generator to `@changesets/changelog-github` if the dev wants `<commit>` references in the generated CHANGELOG. v1.0 keeps the default.
- `caspian/package.json` — confirm the existing `"release": "changeset publish"` script is wired correctly (already true). Add OPTIONALLY a `"changeset": "changeset"` script for contributor ergonomics (so `pnpm changeset` works without the `pnpm exec` prefix); this is nice-to-have, not required.
- `caspian/.gitignore` — add `*.tsbuildinfo` (currently only `*.tsbuildinfo` matches via the wildcard at line 4 — VERIFY). If the new `.tsbuildinfo` files land outside `dist/`, ensure they remain gitignored. Today's line 4 (`*.tsbuildinfo`) catches them already; no edit needed unless the dev chooses a different location.
- `caspian/biome.json` — verify the new `release.yml` does NOT need biome-checking (YAML is not a biome target by default; its `files.includes` array currently lists `*.ts`, `*.tsx`, `*.js`, `*.mjs`, `*.cjs`, `*.json`, `*.jsonc` — YAML is excluded by omission). No edit needed.
- `caspian/packages/cli/CHANGELOG.md` — append a Story 2.8 bullet to `## Unreleased`. The bullet documents: first npm publish via `release.yml` (changesets + `pnpm publish -r --provenance`), Sigstore-backed attestations, version bump `0.0.1 → 0.1.0`, examples/ci-integration/ shipped. The `## Unreleased` heading is replaced by `## 0.1.0` once `changesets version` runs (in the release PR); the dev appends to `## Unreleased` as usual, the workflow does the heading rotation.
- `caspian/packages/core/CHANGELOG.md` — same pattern: append a Story 2.8 bullet to `## Unreleased` documenting the first public npm release with provenance.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — story status `backlog` → `ready-for-dev` → `in-progress` → `review` → `done`. Epic 2 status flips `in-progress → done` ONLY after Story 2.8 reaches `done` (Story 2.8 is the last story in Epic 2; epic-2-retrospective is `optional` and may follow).
- `_bmad-output/implementation-artifacts/deferred-work.md` — mark the Story 2.1 deferred entry (`dist/.tsbuildinfo` published with absolute machine paths) as resolved by Story 2.8. Same for the Story 2.7 D2 entry (docker shim → `npx`).

This story does **NOT** modify any file under `caspian/packages/{core,cli}/src/**/*.ts`, `caspian/packages/{core,cli}/tests/**/*.ts` (except the `published-files.snapshot.json` regeneration noted above), `caspian/packages/{core,cli}/scripts/**/*.ts`, `caspian/diagnostics/**`, `caspian/schemas/**`, `caspian/fixtures/**`, `caspian/spec/**`, `caspian/examples/minimal-skill-adoption/**`, `caspian/conformance/**` (except an optional README cross-link to `examples/ci-integration/`), `caspian/.github/workflows/ci.yml` (Story 2.7's surface is sealed). The CLI's runtime behavior is unchanged by this story; the change is purely release-hygiene + distribution infrastructure.

This story does **NOT** introduce: `SECURITY.md`, `CODE_OF_CONDUCT.md`, `.github/CODEOWNERS`, `.github/dependabot.yml`, `.github/SECURITY-OPS.md`, `CONTRIBUTORS.md` (all owned by Epic 5 / Story 5.3 — *"Repo-level governance bundle + auto-CONTRIBUTORS"*), `caspian.dev` website (Epic 4), `casper-core` plugin (Epic 3), additional fixture variants beyond what already exists, or v1.1 deliverables (multi-OS CI matrix, conformance badges, performance benchmarks, second/third validator implementations). Architecture's *"Story-010"* framing — which bundled governance docs into the publish story — is **superseded** by the Epic 5 split: Story 2.8's epic ACs (lines 1087–1141 of `epics.md`) are the authoritative scope, and they do not include governance docs.

## Background

Stories 2.1 → 2.7 closed the validator's correctness, surface stability, and vendor-neutrality enforcement: 6-stage pipeline with 18 diagnostic codes (E001–E014 + W001–W004); CLI binary `caspian` with `validate <path>`, exit-code matrix (0/1/2/3), human + JSON formatters; published-files snapshot gate (`verify-pack`); 18-case conformance suite (`pnpm conformance`); 3-layer vendor-neutrality enforcement (`dependency-cruiser` source-level + lockfile audit transitive + docker runtime gate). What is **still missing** for v1.0 is the public-distribution moment: `@caspian-dev/cli` and `@caspian-dev/core` are not yet on npm. A plugin author cannot type `npx @caspian-dev/cli validate ./` because the package does not exist on the registry yet. The 3-line CI integration snippet referenced in PRD FR36 has no destination because there is no `examples/ci-integration/` directory.

Story 2.8 ships the first public npm release. The architecture-prescribed mechanism is: the changesets-driven release PR composes per-package CHANGELOGs from the accumulated `.changeset/*.md` entries; on merge of that release PR to `main`, the `release.yml` workflow runs the full pre-publish gate matrix (`ci.yml`'s 11 gates plus the layer-3 docker gate that `ci.yml` deliberately skips for PR-loop speed) and then `pnpm publish -r --provenance` against the two packages. The OIDC token from GitHub Actions is consumed by the npm CLI's `--provenance` flag to produce a Sigstore-backed attestation visible at `npm view @caspian-dev/cli@0.1.0` and on the npmjs.com package page (the green "Provenance" badge). No long-lived `NPM_TOKEN` is stored in the repo's secrets; trust flows from `id-token: write` permission on the workflow → npm registry's OIDC verifier.

In parallel, the `examples/ci-integration/` directory closes PRD FR36 by giving plugin authors a copy-pasteable 3-line GitHub Actions snippet. The snippet is intentionally **vendor-neutral**: zero references to Claude Code, no opinions about the consumer's plugin format, no setup-step assumptions beyond `actions/checkout` + `actions/setup-node` (the standard GitHub Actions baseline). PRD Journey 6 (the *"Maya's PR fails fast"* journey) is the canonical user story this snippet supports; the snippet's strict-warnings gate documented in the README pipes `--format=json` through `jq -e '.summary.errors == 0 and .summary.warnings == 0'` to surface a non-zero exit on warnings as well as errors — the plugin author's choice, not a default.

The Story 2.7 deferred item D2 (`vendor-neutrality-docker.mjs` requires local-tarball install because `@caspian-dev/cli` is not yet on npm) is mechanically closed by this story: once 2.8 publishes, the docker gate flips its inner command from the local-tarball shim to `npx @caspian-dev/cli@<version>`, mirroring the architecture-prescribed invocation verbatim. The Story 2.1 deferred item (`dist/.tsbuildinfo` published with absolute machine paths) is also closed here — relocating `tsBuildInfoFile` outside `dist/` is the cleanest fix and removes the leak in one shot.

After Story 2.8 reaches `done`, Epic 2 (CLI Validator & CI Integration) is complete. The deliverables are: a published, signed, vendor-neutral CLI on npm; a copy-pasteable CI integration snippet; and a release pipeline that has demonstrably executed the full gate matrix at least once. Epic 3 (casper-core plugin) and Epic 4 (caspian.dev site) and Epic 5 (governance bundle) are downstream consumers of this surface.

The destination repository for the eventual `caspian/` extraction is now confirmed: `https://github.com/joselimmo/caspian` (empty as of 2026-04-30). This URL is wired into both `package.json`s' `repository` field (AC4, AC5), into `bugs.url`, and into the publish runbook. The extraction itself is an operational step — Story 2.8 does not perform it, but unblocks it by producing publish-ready packages and an active workflow file at the right path.

**Architectural anchors:**

- **E2 npm publish provenance** / `architecture.md:297` — *"`npm publish --provenance` via GitHub Actions OIDC. Sigstore-backed; counters the lack of package-signing in the agent-skill ecosystem (Snyk audit context) at marginal cost."*
- **E4 release coordination** / `architecture.md:299` — *"`changesets` (pnpm-friendly) for per-package semver in the monorepo; first implementation story configures it."* Story 2.8 is that first implementation story (the `.changeset/{config.json, README.md}` scaffold from Story 2.1 is reused).
- **E1 CLI ↔ spec semver decoupling** / `architecture.md:296` — *"v1.0 ships CLI `0.1.0` + spec `schema_version: \"0.1\"`."* Story 2.8 produces the `0.1.0` first publish.
- **Release workflow shape** / `architecture.md:892-898` — *"`release.yml`, on PR merge: 1. `changesets version` composes CHANGELOGs across packages; 2. `pnpm install --frozen-lockfile`; 3. `pnpm build`; 4. `pnpm publish -r --provenance` (publishes `@caspian-dev/core` then `@caspian-dev/cli`); 5. `git push --tags`; 6. Triggers `site.yml` for GH Pages redeployment."* Story 2.8 implements steps 1–5; step 6 (site rebuild) is Epic 4.
- **External integration: npm registry** / `architecture.md:823` — *"`release.yml` runs `pnpm publish --provenance` from `packages/core` then `packages/cli` after changesets composes the release. OIDC token from Actions, signed via Sigstore."*
- **Distribution boundary: 1 release → 3 surfaces** / `architecture.md:752-762` — npm registry is the **primary** artifact; the marketplace plugin and the `caspian.dev` site are downstream surfaces from the same git tag. v1.0 wires only the npm surface (Epics 3 + 4 wire the others).
- **package.json metadata** / `architecture.md:632, 667` — `@caspian-dev/core` (`engines.node>=22.13`, `publishConfig.access=public`) and `@caspian-dev/cli` (`bin={"caspian":"./dist/cli.js"}`, `engines.node>=22.13`, `caspian.supportedSchemaVersions=["0.1"]`, `files=["dist/","README.md","CHANGELOG.md","LICENSE"]`, `publishConfig.access=public`). All already correct in the current source.
- **examples/ci-integration scope** / `architecture.md:614-616` — *"FR36 — `examples/ci-integration/`: README.md + github-actions-snippet.yml (3-line `npx @caspian-dev/cli validate ./`)"*.
- **FR36** / `epics.md:92` and `prd.md:557` — *"A plugin author can copy a CI integration snippet (`examples/ci-integration/`) that wires `npx @caspian-dev/cli validate ./` into GitHub Actions in three YAML lines."*
- **FR29 npm name pivot context** / `prd.md:547` and `epics.md:206` — `@caspian-dev/cli` (scoped) was adopted in Epic 1 retro AI-3 because the unhyphenated `caspian` name was unavailable on npm. The `bin: {"caspian": "./dist/cli.js"}` declaration preserves the `caspian` brand in the user's PATH after global install.
- **NFR15 GitHub Actions integration** / `prd.md:590` — *"The `caspian` CLI integrates with GitHub Actions via standard exit codes (`0` / non-zero) and optional structured output (`--format=json`), without requiring a custom Action in v1.0."* Story 2.8's snippet honors this — no custom action, only `npx`.
- **NFR17 vendor-neutrality release gate** / `prd.md:592` — *"the CLI runs on a minimal Node container against the canonical fixture set with no Claude Code dependency present."* Layer-3 docker gate (Story 2.7) wired into `release.yml` fulfills this as a pre-publish blocking check.
- **NFR20 offline validation** / `prd.md:598` — *"The CLI has no runtime dependency on external services. Validation proceeds offline."* The `npx`-fetched CLI tarball is a one-time install; subsequent `caspian validate` runs do not hit the network. Snippet README documents this.
- **G2 lockfile policy** / `architecture.md:311` — *"`pnpm-lock.yaml` committed; CI uses `pnpm install --frozen-lockfile`."* Story 2.8 honors this in `release.yml`.

**Carried-forward deferrals from Story 2.7 (closed by 2.8) and Story 2.1 (closed by 2.8):**

- **Story 2.7 D2 — docker shim (local-tarball install vs `npx @caspian-dev/cli`).** Closed by this story: post-publish, `vendor-neutrality-docker.mjs` switches its inner command to `npx`. The pre-publish path (local-tarball) is preserved as a fallback mode for local smoke tests via the `CASPIAN_DOCKER_GATE_MODE` env var.
- **Story 2.1 deferred — `dist/.tsbuildinfo` with absolute machine paths.** Closed by this story: relocate `tsBuildInfoFile` outside `dist/` in both `packages/{core,cli}/tsconfig.json`; regenerate `published-files.snapshot.json` to drop the entry; `verify-pack` re-baselines.

**Carried-forward deferrals NOT addressed here (still open after 2.8):**

- **Story 2.7 D1 — `pnpm test` flake under recursive parallel orchestration on Windows.** Out of scope; CI on `ubuntu-latest` is the durable proof. If it persists in CI, a future story tightens vitest's pool/serialization further.
- **Story 2.7 D3 — `dependency-cruiser` 16.x → 17.x bump.** Out of scope; opportunistic.
- **Story 2.7 D4 — Conformance scope (code-multiset only).** Out of scope; v1.1+ richer assertions.
- **Story 2.6 D1–D7** — JSON output edge cases, walker quirks, EPIPE handling. All out of scope.
- **Story 2.5 D1** — `CASPIAN_CLI_FORCE_THROW` test backdoor. Out of scope.
- **Story 2.7 review-deferred items D1–D8** (validator stderr surfacing, runner.mjs node-prefix invocation, etc.). Out of scope.

## Acceptance Criteria

### AC1 — `release.yml` exists and triggers correctly

**Given** the new file `caspian/.github/workflows/release.yml`

**When** I open it

**Then** the workflow declares:
- `name: Release`
- `on: { push: { branches: [main] } }` — push trigger only; PRs are gated by `ci.yml`. (The "Version Packages" PR opened by changesets is itself gated by `ci.yml` via its `pull_request` trigger; the merge of that PR fires `release.yml`.)
- `permissions: { contents: write, id-token: write, pull-requests: write }` — `contents: write` for the release PR + tag push by `changesets/action`; `id-token: write` MANDATORY for npm OIDC provenance (the npm CLI requests an OIDC token via the workflow's identity); `pull-requests: write` for `changesets/action` to open / update the release PR.
- `concurrency: { group: release-${{ github.ref }}, cancel-in-progress: false }` — serialize release runs; do NOT cancel an in-progress publish if a new push lands while it executes.

**And** the job's `runs-on: ubuntu-latest`, `timeout-minutes: 30` (longer than `ci.yml`'s 15-minute budget because publish + provenance attestation has higher network latency).

**And** `defaults.run.working-directory: ./caspian` is set at job level so every step's commands resolve inside the sub-monorepo.

**Implementation note for dev:** the `Release` workflow MUST live at `caspian/.github/workflows/release.yml`. As of Story 2.7, this nesting renders the workflow dormant in the surrounding `joselimmo-marketplace-bmad` repo (GitHub Actions reads only `.github/workflows/` at the repo root). The destination repo `https://github.com/joselimmo/caspian` exists (currently empty); once `caspian/` contents are pushed there as a fresh root layout, both `ci.yml` and `release.yml` activate at `.github/workflows/{ci,release}.yml`. Story 2.8 ships the workflow regardless; **the story is `done` when the workflow file is correct, even if it is not yet executable** — the same precedent set by Story 2.7 for `ci.yml`. The extraction is the user's operational step, sequenced at their discretion (typically: Story 2.8 lands → user extracts to `joselimmo/caspian` → first push to that repo's `main` triggers `release.yml` → changesets opens "Version Packages" PR → merge → publish).

### AC2 — `release.yml` runs the pre-publish blocking gate matrix

**Given** the `release.yml` workflow

**When** I read the `steps:` array

**Then** the steps run in this exact order (each with a `name:` and a single `run:` shell command unless noted):
1. `actions/checkout@v4` with `{ fetch-depth: 0 }` (changesets needs full history for tag computation).
2. `pnpm/action-setup@v4` with `version: 10.26.1` (matches `caspian/package.json#packageManager` exactly).
3. `actions/setup-node@v4` with `node-version: 22.13.0`, `cache: pnpm`, `cache-dependency-path: caspian/pnpm-lock.yaml`, AND `registry-url: 'https://registry.npmjs.org'` (the `registry-url` is what wires the npm CLI to the OIDC-issued token; without it, `pnpm publish --provenance` cannot find an authenticated registry).
4. `pnpm install --frozen-lockfile`.
5. `pnpm lint`.
6. `pnpm depcruise`.
7. `pnpm verify-codes-hash`.
8. `pnpm test`.
9. `pnpm ajv-validate-registry`.
10. `pnpm verify-pack`.
11. `pnpm audit-vendor-neutrality`.
12. `pnpm build`.
13. `pnpm conformance`.
14. `pnpm vendor-neutrality:docker` — the layer-3 release-only gate (Story 2.7 explicitly deferred to release.yml). Docker is available on `ubuntu-latest` runners by default.
15. `changesets/action@v1` with `publish: pnpm release` and `version: pnpm changeset version`. The action either (a) opens / updates a "Version Packages" PR if there are pending changesets but no version bump on `main`, OR (b) runs `pnpm publish -r --provenance` if `main` already has the version-bump commit and changesets to consume.

**And** the workflow fails on the first non-zero step (default GitHub Actions behavior; no `continue-on-error: true` anywhere).

**And** the workflow uses ONLY `actions/*`, `pnpm/action-setup`, and `changesets/action` — no other third-party actions (vendor-neutrality of the CI surface itself; the same constraint applied to `ci.yml` in Story 2.7).

**And** steps 4–14 run BEFORE `changesets/action` so a failing pre-publish gate aborts before any `pnpm publish` call. (`changesets/action` runs `pnpm release` only if all prior steps pass; this is the architecture-prescribed *"all three are blocking gates before pnpm publish runs"* per `epics.md:1132–1136`.)

**Implementation note for dev:** the `pnpm release` script already exists in `caspian/package.json` (line 17) as `changeset publish`. `changesets/action`'s `publish:` parameter accepts that command verbatim. The action handles the `git tag` push (architecture step 5) automatically.

### AC3 — npm OIDC provenance + Sigstore attestation produced

**Given** the `release.yml` workflow has run on a `main` push that included a "Version Packages" merge

**When** I inspect the resulting npm publish

**Then** `npm view @caspian-dev/core@<published-version>` shows a `provenance` field (visible on the package's npmjs.com page as a "Provenance" badge linking to the Sigstore Rekor transparency log entry).

**And** `npm view @caspian-dev/cli@<published-version>` shows the same.

**And** `npm view @caspian-dev/cli@<published-version> dist.signatures` returns at least one Sigstore signature record with `keyid` matching npm's OIDC verifier key.

**And** no long-lived `NPM_TOKEN` secret is referenced in the workflow (`grep -i "NPM_TOKEN" .github/workflows/release.yml` exits 1). The OIDC mechanism is the sole authentication path.

**And** the GitHub Actions run summary for the publish step shows `npm-NOTICE` lines confirming `Signed provenance statement` was attached to each published tarball.

**Implementation note for dev:** `pnpm publish --provenance` defers to `npm publish --provenance` under the hood; npm reads the OIDC token from the workflow runner's `ACTIONS_ID_TOKEN_REQUEST_URL` and `ACTIONS_ID_TOKEN_REQUEST_TOKEN` env vars (set automatically by GitHub Actions when `id-token: write` is granted). The `publishConfig.provenance: true` key in each `package.json` is what makes this opt-in default behavior — the dev does NOT need to add `--provenance` to the `release` script explicitly because `publishConfig` already declares it. Verify behavior locally **only after a real publish** has succeeded; provenance cannot be tested in dry-run mode.

### AC4 — `@caspian-dev/cli` package metadata is publish-ready

**Given** `caspian/packages/cli/package.json`

**When** I open it

**Then** all of the following are present and correct (most pre-existing from Story 2.5 → 2.6; this AC is a verification gate, not an edit list):
- `"name": "@caspian-dev/cli"` — scoped, matching FR29 (the unhyphenated `caspian` name was unavailable on npm; see Epic 1 retro AI-3).
- `"version": "0.0.1"` — pre-bump value. The `0.0.1 → 0.1.0` bump is performed by `changesets version` running in the release PR; the dev does NOT pre-bump.
- `"description": "Caspian CLI validator (binary `caspian`) — vendor-neutral conformance checker for the Composable Agent Skill Protocol."` — already set; verify unchanged.
- `"license": "Apache-2.0"`.
- `"author": "Cyril Houillon"`.
- `"type": "module"`.
- `"engines": { "node": ">=22.13" }`.
- `"bin": { "caspian": "./dist/cli.js" }` — preserves the `caspian` brand in PATH after `npm install -g`.
- `"files": ["dist/", "README.md", "CHANGELOG.md", "LICENSE"]` — restrictive; no source, no tests, no scripts shipped.
- `"publishConfig": { "access": "public", "provenance": true }`.
- `"caspian": { "supportedSchemaVersions": ["0.1"] }` — custom `caspian.*` namespace key preserved verbatim; identifies spec compatibility (NOT to be confused with the npm package name).
- `"dependencies"` includes ONLY: `@caspian-dev/core` (workspace ref → resolved to `^0.1.0` by pnpm at pack time), `chalk ^5.3.0`, `commander ^12.1.0`, `fast-glob ^3.3.3`. No new runtime deps.
- `"devDependencies"` includes the existing: `@types/node ^22.10.0`, `tsx ^4.19.0`, `typescript ^5.7.0`, `vitest ^3.0.0`. No new dev deps.
- `"repository"` field (NEW): `{ "type": "git", "url": "git+https://github.com/joselimmo/caspian.git", "directory": "packages/cli" }` — the destination repo (currently empty; extraction is an operational step out of scope here). The `directory` field tells npm the package lives in a subdirectory of the repo. **Implementation note:** if the extraction has not happened by publish time, the URL points to a valid-but-empty repo (no 404 — `github.com/joselimmo/caspian` resolves; only the deep-link to a specific file like `packages/cli/package.json` would 404 until extraction). Documented in the publish runbook.
- `"homepage"` field (NEW): `"https://caspian.dev"` — Epic 4's site URL. Forward reference (Epic 4 ships the site; URL allowed to 404 until then per AC22).
- `"bugs"` field (NEW): `{ "url": "https://github.com/joselimmo/caspian/issues" }` — Issues tab on the destination repo. Resolves immediately even on the empty repo (GitHub auto-enables Issues on new repos by default).
- `"keywords"` field (NEW, OPTIONAL but recommended for npm discoverability): `["caspian", "agent-skills", "validator", "cli", "frontmatter", "claude-code", "agentskills"]` — note "claude-code" is acceptable in keywords as discovery metadata; the vendor-neutrality boundary applies to runtime dependencies, not to npm search hints. The npm registry indexes this field for `npm search`.

### AC5 — `@caspian-dev/core` package metadata is publish-ready

**Given** `caspian/packages/core/package.json`

**When** I open it

**Then** all of the following are present and correct:
- `"name": "@caspian-dev/core"`.
- `"version": "0.0.1"` (bumped by changesets).
- `"description"` already set; verify unchanged.
- `"license": "Apache-2.0"`.
- `"author": "Cyril Houillon"`.
- `"type": "module"`.
- `"engines": { "node": ">=22.13" }`.
- `"main": "./dist/index.js"` and `"types": "./dist/index.d.ts"`.
- `"exports": { ".": "./dist/index.js", "./diagnostics": "./dist/diagnostics/index.js" }`.
- `"files": ["dist/", "README.md", "CHANGELOG.md", "LICENSE"]`.
- `"publishConfig": { "access": "public", "provenance": true }`.
- `"dependencies"` includes ONLY: `ajv ^8.17.0`, `yaml ^2.6.0`. No new runtime deps.
- `"repository"`, `"homepage"`, `"bugs"`, `"keywords"` fields added per AC4's pattern. Concrete URLs: `repository.url = "git+https://github.com/joselimmo/caspian.git"`, `repository.directory = "packages/core"`, `homepage = "https://caspian.dev"`, `bugs.url = "https://github.com/joselimmo/caspian/issues"`.

**And** there is NO `bin` field (core is a library, not an executable).

### AC6 — `dist/.tsbuildinfo` excluded from published tarball

**Given** the Story 2.1 deferred item — `dist/.tsbuildinfo` is published with absolute machine paths

**When** I run `pnpm pack --dry-run --json` from `caspian/packages/cli/` AND `caspian/packages/core/`

**Then** neither tarball's `files` array contains an entry ending in `.tsbuildinfo`.

**And** the fix is implemented by relocating `tsBuildInfoFile` from `./dist/.tsbuildinfo` to a path **outside `dist/`** in both `caspian/packages/cli/tsconfig.json` and `caspian/packages/core/tsconfig.json`. Suggested target: `./.tsbuildinfo` at the package root (the package root is excluded from `files` automatically because `files` is an allow-list). An equivalent fix would be `tsBuildInfoFile: "../../.tsbuildinfo-cache/<package-name>.tsbuildinfo"` to centralize all build cache outside the packages — out of scope for this story; pick the simpler relocate-to-package-root.

**And** the new `.tsbuildinfo` location is gitignored by the existing `caspian/.gitignore` line 4 (`*.tsbuildinfo` is a wildcard that matches at any depth); no `.gitignore` edit is required.

**And** running `pnpm -F @caspian-dev/cli build && pnpm -F @caspian-dev/core build` produces working `dist/` outputs (the `.tsbuildinfo` files land at the new location, NOT inside `dist/`).

**Implementation note for dev:** `tsBuildInfoFile` is a `compilerOptions` key. Its value is resolved relative to the `tsconfig.json` containing it (NOT relative to `outDir`). Setting it to `"./.tsbuildinfo"` puts the file at the package root; `"../.tsbuildinfo-cli"` or similar is a less-elegant alternative.

### AC7 — `published-files.snapshot.json` regenerated for the new pack shape

**Given** the relocation of `tsBuildInfoFile` outside `dist/` (AC6)

**When** I run `pnpm verify-pack` from the `caspian/` root

**Then** the script reports a drift on the first run (the `dist/.tsbuildinfo` entry is gone from `pnpm pack --dry-run`'s output but still present in the snapshot).

**And** the dev intentionally regenerates the snapshot using the documented procedure in `caspian/packages/cli/scripts/verify-pack.ts` lines 100–104:
```bash
pnpm -F @caspian-dev/cli pack --dry-run --json
# copy the sorted `files` array into tests/integration/published-files.snapshot.json
```

**And** the new snapshot has 40 entries (was 41 in Story 2.6; minus `dist/.tsbuildinfo` = 40). Verified by `wc -l` on the file and by running `pnpm verify-pack` again post-update — exits 0.

**And** the snapshot's `files` array remains sorted lexicographically by `path` (matches the existing convention from Story 2.6 — alphabetical, not pack-order).

### AC8 — Changeset for the v0.1.0 first public release

**Given** the new file `caspian/.changeset/0001-initial-public-release.md`

**When** I open it

**Then** the YAML frontmatter declares:
```yaml
---
"@caspian-dev/core": minor
"@caspian-dev/cli": minor
---
```

**And** the body summarizes the v0.1.0 surface as the cumulative output of Stories 2.1 → 2.8: validator pipeline (6 stages, 18 codes), CLI binary `caspian` (validate / exit-code matrix / human + JSON output), conformance suite (18 cases), 3-layer vendor-neutrality enforcement (dep-cruiser + lockfile audit + docker gate), and first public npm publish with provenance.

**And** the body explicitly notes that this is the **first public release** of both packages (`0.0.1 → 0.1.0`) — `0.0.1` was a placeholder; `0.1.0` is the v1.0 spec coupling per `architecture.md:296` (E1).

**And** the file is consumed and DELETED by `changesets version` running in the release PR (this is normal changesets behavior; the deletion is reflected in the release PR's diff).

**Implementation note for dev:** the changeset is hand-authored per the architecture's *"contributor adds a `.changeset/<random>.md` with their PR"* / `architecture.md:515`. Filename `0001-initial-public-release.md` is human-friendly; changesets accepts any `.md` filename.

### AC9 — `examples/ci-integration/README.md` documents the snippet

**Given** the new file `caspian/examples/ci-integration/README.md`

**When** I read it

**Then** the document explains:
1. **Purpose**: gate your repository's PRs on Caspian frontmatter conformance using `npx @caspian-dev/cli validate`.
2. **Prerequisites**: GitHub Actions repo + Node.js ≥22 in CI (via `actions/setup-node@v4` with `node-version: '22'` or pinned to `22.13.x`).
3. **Setup steps**: copy `github-actions-snippet.yml` into your repo at `.github/workflows/<your-name>.yml`; replace `./skills/` with the path you want validated; commit + push; PRs from that point on run the validation.
4. **Default semantics**: the workflow fails if any error diagnostic is emitted (`caspian` exits 1); warnings are tolerated (exit 0).
5. **Strict-warnings gate (optional)**: pipe through `jq` to fail on warnings too:
   ```bash
   npx @caspian-dev/cli@<version> validate --format=json ./skills/ | jq -e '.summary.errors == 0 and .summary.warnings == 0'
   ```
   `jq -e` exits non-zero when the predicate is false, propagating the failure to the GitHub Actions step.
6. **Pinning the version**: the snippet pins the CLI version (`@caspian-dev/cli@0.1.0` or whatever was current at story-write time) so a CLI minor bump on npm does not silently change the validator behavior in your CI. Bumping the pin is a deliberate PR.
7. **Vendor-neutrality**: the snippet does not require Claude Code, the Anthropic SDK, or any other vendor-bound runtime. The CLI runs on stock Node 22 (NFR17, NFR20).

**And** the document does NOT mention Claude Code anywhere (vendor-neutrality of the *snippet* is the contract; even an explanatory mention would muddy that surface).

**And** the document is ≤200 lines (`architecture.md:418-425` markdown-conventions: ATX headers, fenced code blocks with language tag, advisory line length 100 chars).

**And** the document includes a fenced `yaml` code block reproducing the snippet inline (so a reader who landed on the README from npm or caspian.dev can copy-paste without opening a second file).

### AC10 — `examples/ci-integration/github-actions-snippet.yml` is a runnable workflow

**Given** the new file `caspian/examples/ci-integration/github-actions-snippet.yml`

**When** I open it

**Then** the file is a complete, runnable GitHub Actions workflow:
```yaml
name: Validate Caspian frontmatter

on:
  pull_request:
    paths:
      - 'skills/**/*.md'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - name: Validate Caspian frontmatter
        run: npx @caspian-dev/cli@0.1.0 validate ./skills/
        shell: bash
```

**And** the validation step is **exactly three YAML lines** (per epic AC `epics.md:1119`): `- name: Validate Caspian frontmatter`, `  run: npx @caspian-dev/cli@0.1.0 validate ./skills/`, `  shell: bash`. The setup steps (`checkout`, `setup-node`) are boilerplate excluded from the count per the epic's parenthetical.

**And** the snippet contains zero references to Claude Code, Anthropic SDK, casper-core, or any vendor-bound concept (vendor-neutrality of the snippet itself).

**And** the `npx @caspian-dev/cli@0.1.0` version pin is replaced with the **actual published version** at the moment of release (the dev edits this file in the same release PR that bumps the package versions). For the v0.1.0 first publish, the pin is literally `@0.1.0`; for future minor / patch releases, a follow-up story will bump the pin.

**And** the snippet uses only `actions/*` actions (`actions/checkout@v4`, `actions/setup-node@v4`); no third-party action; no `caspian-dev/validate-action@v1` (the v1.1 deliverable per `prd.md:360` — out of scope for v1.0).

### AC11 — Fresh-user reproducibility test (NFR17 / NFR20)

**Given** a machine with only Node ≥22 installed (no Claude Code, no Anthropic SDK, no other Caspian-related packages)

**When** the user runs `npx @caspian-dev/cli@0.1.0 validate ./` against any directory

**Then** the CLI executes successfully, parses every `.md` file under `./`, emits diagnostics or empty output, and exits with the appropriate code (0/1/2/3 per the matrix).

**And** the CLI does not require: Claude Code installation, additional config files in the consumer repo, network access at validate time (NFR20), any environment variables set, or any non-Node runtime dependency.

**And** this assertion is mechanically proven by the layer-3 docker gate (`pnpm vendor-neutrality:docker`) running inside `release.yml` (AC2 step 14): a `node:22-alpine` container with zero pre-installed packages runs `npx @caspian-dev/cli@<just-published-version> validate ./fixtures/valid/` and exits 0. The gate is BLOCKING — a non-zero exit aborts the publish.

**Implementation note for dev:** in the immediate post-publish window, there is a chicken-and-egg problem: the docker gate reads the just-published version via `npx`, but the publish command runs *after* the docker gate per AC2. Resolution: the docker gate uses `CASPIAN_DOCKER_GATE_MODE=local-tarball` for the pre-publish run inside `release.yml`, then a **post-publish verification step** (AC2 step 16, see implementation in `release.yml`) re-runs the docker gate with `CASPIAN_DOCKER_GATE_MODE=npx-published` against the now-live npm package. Both modes are non-zero-exit blocking; the post-publish run is informational + alerting if it fails (un-publishing is hard, so the rollback path is a `0.1.1` patch release fixing whatever broke).

### AC12 — Pre-publish blocking gates honored

**Given** the `release.yml` workflow steps

**When** I cross-reference epic AC `epics.md:1131–1136`

**Then** all three pre-publish gates are present and BLOCKING (non-zero exit aborts the publish):
- `pnpm verify-pack` (Story 2.6) — locks the published file list against drift; AC2 step 10.
- `pnpm conformance` (Story 2.7) — 18 conformance cases pass; AC2 step 13.
- `pnpm vendor-neutrality:docker` (Story 2.7) — layer-3 runtime gate; AC2 step 14.

**And** all three run BEFORE `changesets/action`'s `publish:` invocation (AC2 step 15) such that any failure aborts before any `pnpm publish` is called.

**And** the workflow has no `continue-on-error: true` flags anywhere (default GitHub Actions blocking behavior is preserved).

### AC13 — `vendor-neutrality-docker.mjs` switched to npx-published mode

**Given** the existing file `caspian/scripts/vendor-neutrality-docker.mjs` (Story 2.7)

**When** I open it

**Then** the script accepts a new env var `CASPIAN_DOCKER_GATE_MODE` with two values: `local-tarball` (the Story 2.7 transitional shim — `pnpm pack` of both packages → `npm install` of both tarballs in container) and `npx-published` (the architecture-prescribed flow — `npx @caspian-dev/cli@<version>` from the public npm registry).

**And** the default mode is `npx-published` when the env var is unset (post-publish is the steady state; pre-publish callers explicitly opt in to `local-tarball` via the env var).

**And** the `npx-published` branch:
1. Reads the just-published version from `caspian/packages/cli/package.json` `version` field via `JSON.parse(readFileSync(...))`.
2. Constructs the inner command: `npx @caspian-dev/cli@<version> validate /fixtures/`.
3. Spawns the docker container with the same scratch-dir + read-only fixtures-mount discipline as the Story 2.7 implementation (host filesystem provably untouched per Story 2.7 Completion Note).
4. Captures the docker exit code; non-zero exits the script with code 1.

**And** the `local-tarball` branch is preserved verbatim from Story 2.7 (no behavior change in that path).

**And** the script's docker-skip-when-absent path (Story 2.7 AC13) is unchanged: `docker --version` failure → SKIPPED + exit 0 + stderr notice.

**And** running `pnpm vendor-neutrality:docker` from a developer laptop (with docker available, post-publish) exits 0 with the in-container `caspian validate /fixtures/` reporting the expected `6 files: 0 errors, 0 warnings` (matches Story 2.7 cross-check CC3 output).

**Closes Story 2.7 deferred D2:** *"`vendor-neutrality-docker.mjs` requires `@caspian-dev/cli` to be available locally. Story 2.8 will switch the inner `npm install` to `npx @caspian-dev/cli` once published, mirroring the architecture-prescribed invocation verbatim."* Marked `done` in `_bmad-output/implementation-artifacts/deferred-work.md`.

### AC14 — `packages/cli/README.md` documents v0.1.0 install + usage

**Given** the existing file `caspian/packages/cli/README.md` (Story 2.5+)

**When** I read the post-Story-2.8 version

**Then** the document includes:
1. **Install (global)**: `npm install -g @caspian-dev/cli` — binary in PATH = `caspian`. Already documented; verify present.
2. **Install (zero-install via npx)**: `npx @caspian-dev/cli validate ./` for CI. Already documented; verify present.
3. **Validate command**: `caspian validate <path>` accepting file / directory / glob; quote globs (CLI-side expansion, not shell). Already documented; verify present.
4. **Exit-code matrix** (0/1/2/3): table with `0`=clean, `1`=error diagnostics present, `2`=usage error, `3`=internal validator error. Already documented; verify present.
5. **`--format=json` shape**: B4 schemaVersion `"1"`, `results[]`, `summary{files,errors,warnings}`, `field?` / `doc?` omission, sample output. Already documented; verify present.
6. **Strict-warnings recipe**: `--format=json` piped through `jq -e '.summary.errors == 0 and .summary.warnings == 0'`. Already documented; verify present.
7. **Spec + diagnostics reference link** (NEW): footer paragraph linking to `https://caspian.dev/` for the spec landing and `https://caspian.dev/diagnostics` for the diagnostics-codes reference. Allowed to be a forward reference (Epic 4 ships the site); the link 404s only until Epic 4 lands, which is part of the same v1.0 release coordination plan per `architecture.md:752-762`.

**And** the README does NOT mention Claude Code, the Anthropic SDK, or any vendor-bound runtime in the install / validate / output sections (vendor-neutrality of the published CLI surface).

**And** the file is ≤200 lines (architecture markdown convention).

**And** any `<version>` placeholders in the existing copy are updated to `0.1.0` if they reference the published CLI version (e.g., `npm install -g @caspian-dev/cli@0.1.0` in a "pin the version" sub-section). The pre-existing Story 2.5+ README does not pin a version; the dev MAY add a "Pin the version" sub-section consistent with the snippet README in AC9.

### AC15 — `packages/core/README.md` adds spec link

**Given** the existing file `caspian/packages/core/README.md` (Story 2.3)

**When** I read the post-Story-2.8 version

**Then** the document is unchanged EXCEPT for a new footer paragraph linking to `https://caspian.dev/` for the full spec (same forward-reference policy as AC14).

**And** the existing Public API surface description, the loader.ts boundary note, and the per-stage parser+validator descriptions are preserved verbatim.

**And** no API surface change is documented (Story 2.8 is process / infra).

### AC16 — Both CHANGELOGs append a Story 2.8 bullet

**Given** `caspian/packages/cli/CHANGELOG.md` and `caspian/packages/core/CHANGELOG.md`

**When** I open the `## Unreleased` section in each

**Then** a new Story 2.8 bullet is appended.

`packages/cli/CHANGELOG.md`:
> - `Story 2.8`: First public npm release as `@caspian-dev/cli@0.1.0` with provenance attestation. The `release.yml` workflow runs the full pre-publish gate matrix (lint, depcruise, verify-codes-hash, test, ajv-validate-registry, verify-pack, audit-vendor-neutrality, build, conformance, vendor-neutrality:docker) before `pnpm publish -r --provenance` via GitHub Actions OIDC + Sigstore. `dist/.tsbuildinfo` excluded from the published tarball (was leaking via the Story 2.5 build cache). New `examples/ci-integration/{README.md, github-actions-snippet.yml}` ships a 3-line `npx @caspian-dev/cli` snippet for plugin authors' GitHub Actions PR gates (FR36).

`packages/core/CHANGELOG.md`:
> - `Story 2.8`: First public npm release as `@caspian-dev/core@0.1.0` with provenance attestation. Published alongside `@caspian-dev/cli@0.1.0` from the same `release.yml` run. `dist/.tsbuildinfo` excluded from the published tarball. No source change; this story is process / infra.

**And** the `## Unreleased` heading is preserved (it gets rotated to `## 0.1.0` automatically by `changesets version` running in the release PR; the dev does NOT manually rotate the heading).

**And** every prior bullet under `## Unreleased` (Stories 2.1 → 2.7 entries) is preserved verbatim — those bullets travel with `0.1.0` as the cumulative release notes.

### AC17 — `.changeset/config.json` is publish-ready

**Given** the existing file `caspian/.changeset/config.json` (Story 2.1 bootstrap)

**When** I read it

**Then** the following keys are correct:
- `"$schema": "https://unpkg.com/@changesets/config@3.1.4/schema.json"` (or the latest changesets schema URL).
- `"changelog"`: `"@changesets/cli/changelog"` (the default, simple changelog generator). Optionally `"@changesets/changelog-github"` for richer commit references — the dev decides; v1.0 keeps the default.
- `"commit": false` — the workflow does the commit.
- `"fixed": []` — packages do NOT version-lock together; `core` and `cli` may diverge in version (decoupled per `architecture.md:298` E3).
- `"linked": []` — same as `fixed`.
- `"access": "public"`.
- `"baseBranch": "main"`.
- `"updateInternalDependencies": "patch"` — when `core` bumps a minor, `cli`'s `workspace:^` ref bumps to a patch version internally.
- `"ignore": []`.

**And** the file is unchanged from the Story 2.1 bootstrap unless the dev explicitly opts into `@changesets/changelog-github` (a one-line edit that pulls in the `@changesets/changelog-github` devDependency — out of scope for this story unless trivially convenient).

### AC18 — `release.yml` is biome-clean and lint-baseline preserved

**Given** the new file `caspian/.github/workflows/release.yml` and the existing `caspian/biome.json`

**When** I run `pnpm lint` from the `caspian/` root

**Then** the file count and any biome diagnostics are within the Story 2.7 baseline (~66 files ± 2). YAML files are NOT biome-checked by default (`biome.json#files.includes` does not list `.yml` / `.yaml`), so `release.yml` and `ci.yml` are not part of the count.

**And** any new `.mjs` / `.ts` / `.json` files this story introduces (e.g., the changeset markdown is `.md` — not biome-checked; the docker script edit is in-place — already in the count) do NOT inflate the lint baseline beyond ~66 ± 2.

**And** `pnpm lint` exits 0.

### AC19 — Smoke-gate baseline verification

**Given** the cumulative cross-cuts from Stories 2.1 → 2.7

**When** I run the full local gate matrix from `caspian/`:
```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm depcruise
pnpm verify-codes-hash
pnpm test
pnpm ajv-validate-registry
pnpm verify-pack            # against the post-AC7 snapshot (40 files, no .tsbuildinfo)
pnpm audit-vendor-neutrality
pnpm build
pnpm conformance
pnpm vendor-neutrality:docker  # local-tarball mode for pre-publish smoke
```

**Then** every command exits 0.

**And** `pnpm lint` reports approximately 66 biome-checked files (Story 2.7 baseline 66 ± 2); ±2 tolerance for any incidental file the implementation discovers it needs.

**And** `pnpm test` reports 133 + 1 skipped (Story 2.7 baseline; Story 2.8 adds **zero** vitest tests — this story is process / infra; the surface under test is the GitHub Actions workflow itself, which can only be tested by execution at release time).

**And** `pnpm conformance` reports `18 / 18 cases passed` (unchanged from Story 2.7).

**And** `pnpm verify-pack` reports `OK (40 files match snapshot)` (was 41 in Story 2.7; minus `dist/.tsbuildinfo`).

**And** the registry sha256 hash header in `caspian/packages/core/src/diagnostics/codes.generated.ts` is **unchanged** from Story 2.7 (`b303d139…e803c7`) — confirms zero registry / source mutation by this story.

**And** `pnpm vendor-neutrality:docker` (in `local-tarball` mode) exits 0 with the in-container `caspian validate ./fixtures/` reporting `6 files: 0 errors, 0 warnings` (matches Story 2.7 CC3).

### AC20 — Deferred-work entries closed

**Given** `_bmad-output/implementation-artifacts/deferred-work.md`

**When** I read it post-Story-2.8

**Then** the Story 2.1 entry — *"`dist/.tsbuildinfo` published to npm with absolute machine paths"* (line 80) — is marked `RESOLVED Story 2.8` with a one-line note pointing to AC6 + AC7.

**And** the Story 2.7 D2 entry — *"`vendor-neutrality-docker.mjs` requires `@caspian-dev/cli` to be available locally; Story 2.8 will switch the inner `npm install` to `npx @caspian-dev/cli` once published"* — is marked `RESOLVED Story 2.8` with a one-line note pointing to AC13.

**And** no other deferred entries are mutated by this story.

### AC21 — Sprint-status flips and Epic 2 closure

**Given** `_bmad-output/implementation-artifacts/sprint-status.yaml`

**When** the dev-story workflow runs

**Then** the story key `2-8-npm-publish-with-provenance-examples-ci-integration` flips `backlog → ready-for-dev` (create-story workflow — done at story-write time) → `in-progress` (dev-story start) → `review` (dev-story end) → `done` (after BMad code-review).

**And** `last_updated` comment lines are appended documenting each transition (per the per-story-transition convention from Stories 1.x and 2.x).

**And** Epic 2 status flips `in-progress → done` ONLY after Story 2.8 reaches `done` (Story 2.8 is the last story in Epic 2 per `sprint-status.yaml` lines 124–134).

**And** `epic-2-retrospective` status remains `optional` (per the convention from Epic 1's retrospective, which was `optional` and was indeed run; Epic 2's retro is at the user's discretion and may follow Story 2.8 closure).

### AC22 — Forward-reference URLs allowed to 404 until Epic 4

**Given** the new `homepage`, `repository`, `bugs` fields in both `package.json`s (AC4, AC5) and the README spec-link footer (AC14, AC15)

**When** the v0.1.0 publish lands on npm and a reader clicks any of those URLs

**Then** the URLs resolve as follows:
- `repository.url = "git+https://github.com/joselimmo/caspian.git"` — resolves to the (currently empty) destination repo. GitHub returns the empty-repo placeholder page; not a 404 at the repo root. Deep-links into `packages/{core,cli}/package.json` 404 until the extraction operational step happens.
- `bugs.url = "https://github.com/joselimmo/caspian/issues"` — resolves immediately (Issues tab is auto-enabled on new GitHub repos).
- `homepage = "https://caspian.dev"` — 404s until Epic 4 ships the site (the only true forward-reference URL).
- README footer link to `https://caspian.dev/diagnostics` — same Epic 4 forward reference.

**And** none of these URLs are gated on liveness for the publish to proceed; npm accepts the metadata regardless of HTTP status at publish time.

**And** the URL-resolution gap closes on the v1.0 release-coordination axis (Epic 4 site ship + operational repo extraction to `joselimmo/caspian`), not the v0.1.0 publish axis.

**Implementation note for dev:** an alternative is to omit `homepage` from v0.1.0 and add it in v0.2.0 once the site exists. The simpler path — declare it now, accept a temporary 404 — is preferred because: (1) npm displays "Homepage" + "Repository" links prominently on package pages, missing them hurts discoverability; (2) bumping 0.1.0 → 0.2.0 just to add metadata is wasteful; (3) the URL resolution gap is days-to-weeks, not months. `repository` and `bugs` URLs already resolve today (the destination repo exists at `https://github.com/joselimmo/caspian`, currently empty).

## Tasks / Subtasks

- [x] **Task 1 — Pre-flight verification of existing package.json metadata (AC4, AC5)**
  - [x] 1.1: Verified `caspian/packages/cli/package.json` `name`, `bin`, `engines.node`, `caspian.supportedSchemaVersions`, `files`, `publishConfig.access`, `publishConfig.provenance` per AC4 — all pre-existing from Stories 2.5–2.6, no drift.
  - [x] 1.2: Same verification on `caspian/packages/core/package.json` per AC5.
  - [x] 1.3: Added `repository` (`git+https://github.com/joselimmo/caspian.git`, `directory: packages/{cli,core}`), `homepage` (`https://caspian.dev`), `bugs.url`, and `keywords` array to both packages.
  - [x] 1.4: `pnpm -F @caspian-dev/cli pack --dry-run --json` and `pnpm -F @caspian-dev/core pack --dry-run --json` both succeed with valid `files` arrays.

- [x] **Task 2 — Relocate `tsBuildInfoFile` outside `dist/` (AC6)**
  - [x] 2.1: Changed `"tsBuildInfoFile": "./dist/.tsbuildinfo"` → `"tsBuildInfoFile": "./.tsbuildinfo"` in `caspian/packages/cli/tsconfig.json`.
  - [x] 2.2: Same change in `caspian/packages/core/tsconfig.json`.
  - [x] 2.3: Clean rebuild (`rm -rf packages/{cli,core}/dist && pnpm build`) succeeds; `.tsbuildinfo` files now sit at package root, not under `dist/`.
  - [x] 2.4: `git status` shows the new `.tsbuildinfo` files as ignored (existing `*.tsbuildinfo` wildcard in `caspian/.gitignore` line 4 catches them).

- [x] **Task 3 — Regenerate `published-files.snapshot.json` (AC7)**
  - [x] 3.1: First `pnpm verify-pack` post-AC6 reports drift: `- dist/.tsbuildinfo` (the snapshot still lists the entry, the new pack output does not).
  - [x] 3.2: `pnpm -F @caspian-dev/cli pack --dry-run --json` reports 40 entries (was 41).
  - [x] 3.3: Removed the `{ "path": "dist/.tsbuildinfo" }` line from `caspian/packages/cli/tests/integration/published-files.snapshot.json` (preserving 2-space indent + trailing newline + sort order).
  - [x] 3.4: Re-ran `pnpm verify-pack` — exit 0 with `verify-pack: OK (40 files match snapshot)`.

- [x] **Task 4 — Author the v0.1.0 changeset (AC8)**
  - [x] 4.1: Created `caspian/.changeset/0001-initial-public-release.md` with YAML frontmatter `"@caspian-dev/core": minor` + `"@caspian-dev/cli": minor` and a body summarizing the cumulative Stories 2.1 → 2.8 surface.
  - [x] 4.2: `pnpm changeset status` reports both packages pending bump at minor (0.0.1 → 0.1.0). Did NOT run `pnpm changeset version` locally — the workflow consumes the changeset on the release PR.

- [x] **Task 5 — Author `examples/ci-integration/README.md` (AC9)**
  - [x] 5.1: Created `caspian/examples/ci-integration/` directory.
  - [x] 5.2: Authored `README.md` covering Purpose, Prerequisites, Setup steps, the snippet, default semantics, strict-warnings gate, version pinning, vendor-neutrality, offline operation, troubleshooting, See also. 100 lines (well under the ≤200-line budget). Zero `Claude Code` mentions (initial draft had three; rephrased to "host-specific runtime" / "any vendor-bound runtime" per AC9 strict prohibition).
  - [x] 5.3: Inline-fenced `yaml` block reproducing the full snippet for copy-paste from the README directly.

- [x] **Task 6 — Author `examples/ci-integration/github-actions-snippet.yml` (AC10)**
  - [x] 6.1: Created the 18-line runnable workflow with checkout + setup-node + 3-line validate step.
  - [x] 6.2: CLI version pinned to `@caspian-dev/cli@0.1.0`.
  - [x] 6.3: `pnpm lint` exit 0 (YAML files not biome-checked; baseline preserved at 66 files).

- [x] **Task 7 — Switch `vendor-neutrality-docker.mjs` to env-var dispatch (AC13)**
  - [x] 7.1: Added `CASPIAN_DOCKER_GATE_MODE` env-var dispatch (validated against `Set(["npx-published","local-tarball"])`; invalid values exit 2 with stderr usage).
  - [x] 7.2: `npx-published` branch reads CLI version from `caspian/packages/cli/package.json` and runs `npx --yes @caspian-dev/cli@<version> validate ./fixtures/` inside `node:22-alpine`.
  - [x] 7.3: Default mode = `npx-published` when env var unset; pre-publish callers explicitly set `CASPIAN_DOCKER_GATE_MODE=local-tarball`.
  - [x] 7.4: `CASPIAN_DOCKER_GATE_MODE=local-tarball pnpm vendor-neutrality:docker` exits 0 with `6 files: 0 errors, 0 warnings` (verified locally on Docker 28.0.1 + node:22-alpine).
  - [x] 7.5: Post-publish smoke (`CASPIAN_DOCKER_GATE_MODE=npx-published`) deferred to release-time — chicken-and-egg: requires `@caspian-dev/cli@0.1.0` to be on npm. The release workflow runs this in the post-publish verification step (Task 8.4).

- [x] **Task 8 — Author `.github/workflows/release.yml` (AC1, AC2, AC3, AC11, AC12)**
  - [x] 8.1: Workflow `name: Release`, trigger `on: push: branches: [main]`, permissions `contents: write` + `id-token: write` + `pull-requests: write`, concurrency `release-${{ github.ref }}` with `cancel-in-progress: false`.
  - [x] 8.2: Job `runs-on: ubuntu-latest`, `timeout-minutes: 30`, `defaults.run.working-directory: ./caspian`.
  - [x] 8.3: 14 sequential steps per AC2: checkout (fetch-depth 0) → pnpm/action-setup@v4 (10.26.1) → setup-node@v4 (22.13.0, cache pnpm, registry-url) → install --frozen-lockfile → lint → depcruise → verify-codes-hash → test → ajv-validate-registry → verify-pack → audit-vendor-neutrality → build → conformance → vendor-neutrality:docker (`local-tarball` mode for pre-publish) → changesets/action@v1 (publish: pnpm release).
  - [x] 8.4: Final step `if: steps.changesets.outputs.published == 'true'` runs `CASPIAN_DOCKER_GATE_MODE=npx-published pnpm vendor-neutrality:docker` for post-publish verification.
  - [x] 8.5: `grep -ni NPM_TOKEN .github/workflows/release.yml` returns nothing — OIDC is the sole auth path (`id-token: write` + `registry-url` + `publishConfig.provenance: true` chain).
  - [x] 8.6: Only allow-listed actions referenced (`actions/checkout@v4`, `actions/setup-node@v4`, `pnpm/action-setup@v4`, `changesets/action@v1`).

- [x] **Task 9 — Update `packages/cli/README.md` and `packages/core/README.md` (AC14, AC15)**
  - [x] 9.1: Verified all 7 AC14 sections pre-existing in `caspian/packages/cli/README.md` (install global + npx, validate command, exit-code matrix, JSON output schema, schema stability, strict-warnings recipe). Added "See also" footer linking to `caspian.dev`, `caspian.dev/diagnostics`, and `@caspian-dev/core` on npm.
  - [x] 9.2: `caspian/packages/core/README.md` — existing API surface preserved; added "See also" footer linking to `caspian.dev`, `caspian.dev/diagnostics`, and `@caspian-dev/cli` on npm.
  - [x] 9.3: Confirmed `README.md` is included in the pack output (already covered by `files: ["dist/", "README.md", "CHANGELOG.md", "LICENSE"]`).

- [x] **Task 10 — Append CHANGELOG entries (AC16)**
  - [x] 10.1: Appended Story 2.8 bullet to `caspian/packages/cli/CHANGELOG.md` `## Unreleased` (first npm publish, provenance, OIDC, `dist/.tsbuildinfo` excluded, `examples/ci-integration/`, package.json metadata expansion).
  - [x] 10.2: Appended Story 2.8 bullet to `caspian/packages/core/CHANGELOG.md` `## Unreleased` (first npm publish co-released with cli, no source change).
  - [x] 10.3: All prior `## Unreleased` bullets (Stories 2.1 → 2.7 in cli; Stories 2.1, 2.2, 2.3, 2.4, 2.6, 2.7 in core) preserved verbatim — they will travel with v0.1.0 as cumulative release notes when `changesets version` rotates the heading.

- [x] **Task 11 — Verify `.changeset/config.json` (AC17)**
  - [x] 11.1: All 9 keys correct (`$schema`, `changelog: @changesets/cli/changelog`, `commit: false`, `fixed: []`, `linked: []`, `access: public`, `baseBranch: main`, `updateInternalDependencies: patch`, `ignore: []`).
  - [x] 11.2: No edit applied (kept default changelog generator; the `@changesets/changelog-github` opt-in is out of scope).

- [x] **Task 12 — Local + CI smoke gate (AC18, AC19)**
  - [x] 12.1: All 11 commands ran sequentially from `caspian/` and exited 0 (output captured in Cross-Checks below).
  - [x] 12.2: `pnpm lint` reports 66 biome-checked files (Story 2.7 baseline preserved exactly).
  - [x] 12.3: `pnpm test` reports 133 passed + 1 skipped across 15 test files (10 core + 5 cli) — Story 2.7 baseline preserved exactly. Zero new vitest tests added.
  - [x] 12.4: `pnpm conformance` reports `18 / 18 cases passed`.
  - [x] 12.5: `pnpm verify-pack` reports `OK (40 files match snapshot)` (was 41 in Story 2.7).
  - [x] 12.6: Hash header on `caspian/packages/core/src/diagnostics/codes.generated.ts` is unchanged at `b303d1395ec438a29d81b61e5a2a5419ee236b6c38b6feba3021de1df8e803c7`.
  - [x] 12.7: `CASPIAN_DOCKER_GATE_MODE=local-tarball pnpm vendor-neutrality:docker` exits 0 with `6 files: 0 errors, 0 warnings`.

- [x] **Task 13 — Close deferred-work entries (AC20)**
  - [x] 13.1: Annotated the Story 2.1 entry (`dist/.tsbuildinfo` leak, line 80) in `_bmad-output/implementation-artifacts/deferred-work.md` with `RESOLVED Story 2.8 (AC6 + AC7)` plus a one-line note.
  - [x] 13.2: Added a new `## Resolutions log — Story 2.8 (2026-04-30)` section at the bottom of `deferred-work.md` capturing the Story 2.7 D2 closure (docker shim → env-var dispatch with `npx-published` mode) and the Story 2.7 D0 status update (still open until repo extraction).
  - [x] 13.3: No other deferred entries mutated.

- [x] **Task 14 — Sprint-status flips and story finalization (AC21)**
  - [x] 14.1: `_bmad-output/implementation-artifacts/sprint-status.yaml` `development_status[2-8-npm-publish-with-provenance-examples-ci-integration]` flipped `backlog → ready-for-dev` (create-story workflow) → `in-progress` (dev-story start) → `review` (dev-story end).
  - [x] 14.2: `last_updated` comment lines appended documenting each transition.
  - [x] 14.3: `epic-2: in-progress` preserved (the `→ done` flip is post-code-review, not now).

## Dev Notes

### Implementation guardrails (preventing common mistakes the dev agent might make)

- **DO NOT modify any source file under `packages/{core,cli}/src/**/*.ts`.** This story is purely additive distribution infrastructure (workflow + examples + metadata + tsconfig + docker-script env-var dispatch). The CLI's runtime behavior is unchanged. If you find yourself editing a `.ts` source file under `src/`, stop and re-read the story — the change is out of scope.
- **DO NOT pre-bump `version` in `packages/{core,cli}/package.json`.** The changeset (Task 4) drives the bump via `changesets version` running in the release PR. Pre-bumping would create a conflict when changesets attempts the same bump.
- **DO NOT add `--provenance` to the `release` script in `caspian/package.json`.** The `publishConfig.provenance: true` key in each package's `package.json` is what tells `pnpm publish` (and underlying `npm publish`) to attach provenance — adding the flag explicitly is redundant and would surface a hard error if `id-token: write` is missing. The `publishConfig` opt-in is already in place from Story 2.5; verify it, do not duplicate it.
- **DO NOT store an `NPM_TOKEN` in repo secrets.** OIDC is the sole authentication path. The workflow's `id-token: write` permission + `actions/setup-node@v4` with `registry-url` + `pnpm publish` (which delegates to `npm publish`) does the dance automatically. If you find yourself reaching for `NPM_TOKEN`, the OIDC path is misconfigured.
- **DO NOT include `dist/.tsbuildinfo` in the published tarball.** The Story 2.1 deferred item (line 80 of `deferred-work.md`) has been blocking publish since Story 2.5. Resolution is in AC6: relocate `tsBuildInfoFile` outside `dist/` (NOT add to `.npmignore` — that path requires a new file; the relocate is one-line per tsconfig).
- **DO NOT mention Claude Code anywhere in `examples/ci-integration/`.** The whole point of the snippet is vendor-neutral CI integration. Any Claude Code reference (even a parenthetical "this also works with Claude Code") muddies the boundary and contradicts NFR17.
- **DO NOT use a third-party GitHub Action other than `actions/*`, `pnpm/action-setup`, and `changesets/action`.** The CI surface is itself vendor-neutral per Story 2.7's precedent. `peaceiris/actions-gh-pages` and similar are out (Epic 4 may revisit for the site).
- **DO NOT skip the docker layer-3 gate in `release.yml`.** It is the architecture-prescribed runtime release gate (`architecture.md:715-721`, layer 3) AND a Story 2.7 forward-dependency explicitly punted to Story 2.8. Story 2.7 deliberately did NOT add it to `ci.yml` to keep PR-loop fast; `release.yml` is the home for it.
- **DO NOT use `execSync`.** Stick to `child_process.spawnSync` / `execFileSync` consistently in `vendor-neutrality-docker.mjs` — Story 2.7's discipline (`spawnSync` is safe-by-construction; `execSync` shells out via a literal string and has argument-quoting subtleties).
- **DO NOT bump the dependency-cruiser major.** Story 2.7 D3 captured this — stays on `^16.0.0` per AC19 of Story 2.7. A 17.x bump is opportunistic v1.1+ work.
- **DO NOT add new vitest tests.** Story 2.8 is process / infra; the surface under test is the GitHub Actions workflow, which can only be exercised by execution at release time. Adding vitest tests would conflict with the architecture's *"conformance/runner.mjs is a separate harness, not a vitest suite"* discipline (line 858) and waste effort.
- **DO NOT add `casper-core` plugin or governance docs** (`SECURITY.md`, `CODE_OF_CONDUCT.md`, `CODEOWNERS`, `dependabot.yml`, `SECURITY-OPS.md`). Those are Epic 3 and Epic 5 / Story 5.3 respectively. The architecture's *"Story-010"* framing predates the epic split; the epic ACs are authoritative.
- **DO NOT perform the `caspian/` repo extraction to `https://github.com/joselimmo/caspian` as part of this story.** The destination repo exists (empty) and is wired into the package metadata, but the extraction itself is an **operational step** owned by the user — a one-time `git filter-repo` / fresh push of `caspian/` contents to the new origin. Story 2.8 ships the workflow + metadata regardless of the nesting; activation of `release.yml` happens at the moment of extraction, not at story `done`.
- **DO NOT publish locally for testing.** `pnpm publish` from a developer laptop creates a real public package. Use `pnpm pack --dry-run` for shape verification; `pnpm publish` only fires from `release.yml` on `main`-merge of the version-bump PR.
- **DO NOT run `pnpm changeset version` locally and commit the result.** That collapses the changesets workflow on the release PR. If you run it locally for sanity, immediately `git restore .` and `git clean -fd .changeset/` to undo (the changeset markdown gets deleted by `version`; you need it back).
- **DO NOT switch `release.yml`'s trigger to `pull_request`.** PRs are gated by `ci.yml`; release is on `push: { branches: [main] }` only. A `pull_request` trigger would attempt to publish on every PR, leaking the changeset behavior.
- **DO NOT remove the `provenance: true` key from `publishConfig`.** It is the opt-in that makes provenance the default behavior of `pnpm publish` from `release.yml`. Without it, the publish silently produces unsigned tarballs.
- **DO NOT skip the `cache-dependency-path: caspian/pnpm-lock.yaml`** in `actions/setup-node@v4`. Without it, the pnpm cache key derives from the wrong lockfile (the surrounding repo has no pnpm-lock.yaml at root), pessimizing every CI / release run.

### Key architectural references (read before starting)

- `architecture.md:296` (E1) — CLI ↔ spec semver decoupling; `0.1.0` first publish.
- `architecture.md:297` (E2) — npm publish provenance via OIDC + Sigstore.
- `architecture.md:299` (E4) — changesets release coordination.
- `architecture.md:311` (G2) — pnpm-lock.yaml committed; `--frozen-lockfile` in CI.
- `architecture.md:518-557` — Project directory structure (root configs at top of `caspian/`; `.github/workflows/release.yml` placement; `.changeset/` placement).
- `architecture.md:614-616` — `examples/ci-integration/{README.md, github-actions-snippet.yml}` (FR36).
- `architecture.md:632, 667` — `package.json` shape for both packages.
- `architecture.md:715-721` — 3-layer vendor-neutrality (layer-3 docker is `release.yml`'s gate per Story 2.7 → 2.8 forward dependency).
- `architecture.md:752-762` — Distribution boundary: 1 release → 3 surfaces (npm primary, marketplace + site downstream).
- `architecture.md:823` — npm registry as external integration; pnpm publish --provenance from packages/core then packages/cli.
- `architecture.md:892-898` — Release workflow shape (`release.yml` step ordering).
- `architecture.md:912` — Story-010 (the architecture's name for this story under the old numbering, with the governance-docs caveat handled by the Epic 5 split).
- `architecture.md:1057-1066` — Strategic framing of v1.0 → v1.1 transition; Story 2.8 closes the v1.0 release-coordination axis.
- `epics.md:1087-1141` — Story 2.8 acceptance criteria (the source-of-truth ACs that AC1–AC22 above derive from).
- `epics.md:251-253` — clarification that governance docs (SECURITY, CODE_OF_CONDUCT, CODEOWNERS, dependabot, SECURITY-OPS) belong to Epic 5 / Story 5.3, NOT Story 2.8.
- `prd.md:147` — defensive name registration (operational; Epic 5 ships the SECURITY-OPS doc).
- `prd.md:358-360` — install / npx / future GitHub Action.
- `prd.md:406` — examples/ci-integration/ as a 3-line snippet.
- `prd.md:547` (FR29) — `@caspian-dev/cli` scoped name; binary in PATH = `caspian`.
- `prd.md:557` (FR36) — CI integration snippet requirement.
- `prd.md:590` (NFR15) — GitHub Actions integration via standard exit codes + JSON output.
- `prd.md:592` (NFR17) — vendor-neutrality release gate.
- `prd.md:598` (NFR20) — offline validation.
- `_bmad-output/implementation-artifacts/deferred-work.md:80` — Story 2.1 deferred entry that this story closes.
- `_bmad-output/implementation-artifacts/2-7-conformance-suite-3-layer-vendor-neutrality-enforcement.md` (Completion Notes / D2) — Story 2.7 deferred entry that this story closes.

### Latest tooling versions (known-good as of 2026-04-30)

- `pnpm@10.26.1` — locked in `caspian/package.json#packageManager`; matches `ci.yml` (Story 2.7) and `release.yml` (this story).
- Node `22.13.0` — locked in `caspian/.nvmrc`; matches `engines.node >=22.13`. Setup-node@v4 supports the major.minor.patch pin.
- `actions/checkout@v4`, `actions/setup-node@v4`, `pnpm/action-setup@v4` — current stable majors as of 2026-04-30.
- `changesets/action@v1` — the current stable major. Reads `.changeset/*.md` and uses the `publish:` parameter to either compose a "Version Packages" PR or run `pnpm release` after the bump merges.
- `@changesets/cli@^2.31.0` — already installed (root `devDependencies`); supports the schema in `.changeset/config.json`.
- `dependency-cruiser@^16.0.0` — Story 2.7 baseline; unchanged.
- npm registry — supports `--provenance` since `npm@9.5` (April 2023); Node 22's bundled npm is `>=10.x` so this is well-supported.

### Project Structure Notes

- The architecture-prescribed file paths are **authoritative**. `.github/workflows/release.yml` (NOT `.github/release.yml` or `release.yml` at the repo root); `examples/ci-integration/{README.md, github-actions-snippet.yml}` (NOT `examples/ci/`); `.changeset/0001-initial-public-release.md` (the `.md` extension is required by changesets).
- The 3-verrou pattern (Verrou 1 tsconfig `rootDirs` + Verrou 2 biome `noRestrictedImports` + Verrou 3 single `loader.ts`) for schema reads is **untouched** by this story. Story 2.8 reads no schemas; the workflow file references no schemas.
- The `packages/cli/` and `packages/core/` source surfaces are sealed by Story 2.7's discipline: no edits to `src/**`, `tests/**` (except the `published-files.snapshot.json` regeneration), `scripts/**` (except none here — `verify-pack.ts` is unchanged). The two `tsconfig.json` edits are to compiler config, NOT source.
- The `examples/` directory already exists from Story 1.7 (`minimal-skill-adoption/`); Story 2.8 adds a sibling sub-directory `ci-integration/`. The `examples/LICENSE.md` and `examples/README.md` from Story 1.7 cover both sub-directories; no edits needed there.
- The `conformance/` directory is unchanged. The `runner.mjs` and 18 cases ship as-is.
- The `plugins/casper-core/` directory does NOT exist yet (Epic 3 / Story 3.1 ships it). Do not create.

### Testing Standards Summary

- **No new vitest tests.** The surface under test is the GitHub Actions workflow itself. Workflows are tested by execution; vitest cannot exercise them.
- **Smoke gate is the same 11-command sequence as Story 2.7** plus the added `vendor-neutrality:docker` (in `local-tarball` mode for pre-publish smoke). Story 2.8's CC1–CCN cross-checks duplicate Story 2.7's matrix and add the `verify-pack 40-files` confirmation.
- **`pnpm verify-pack` is now run twice in the release pipeline**: once as a CI gate against the committed snapshot (catches drift), once implicitly as the architecture's *"locks the published file list"* (the `pnpm publish` invocation respects the same `files` allow-list). The snapshot is the source of truth for the publish boundary.
- **Provenance verification cannot be tested in dry-run mode.** `pnpm publish --dry-run --provenance` is not a thing. The provenance attestation is produced only on a real publish, by the OIDC token flow. Verification is post-hoc via `npm view @caspian-dev/cli@0.1.0 dist.signatures` after the first release.
- **The docker layer-3 gate runs in two modes from this story onward**: pre-publish (`local-tarball`, used in Task 7.4 and AC19's smoke gate) and post-publish (`npx-published`, used in AC11's release-time verification). Both modes produce equivalent vendor-neutrality assertions; the post-publish mode is the architecture-prescribed steady state.
- **Cross-OS reproducibility is verified single-platform only** (Windows 11 dev box during dev-story; ubuntu-latest in CI / release.yml). Multi-OS matrix is opportunistic v1.1 work per architecture step-08.
- **Forward-reference URLs in `package.json` and READMEs** are allowed to 404 between Story 2.8 publish and Epic 4 site ship. This is a known-good state per AC22; do not gate on URL liveness.

### References

- [Source: epics.md#Story 2.8] — primary source-of-truth ACs (lines 1087–1141)
- [Source: epics.md#Acceptance criteria FR36] — line 92 (3-line snippet requirement)
- [Source: architecture.md#Distribution & Release] — lines 294–299 (E1–E4)
- [Source: architecture.md#Release workflow (release.yml)] — lines 892–898
- [Source: architecture.md#External integrations] — line 823 (npm registry publish via OIDC + Sigstore)
- [Source: architecture.md#Project directory structure — examples/ci-integration/] — lines 614–616
- [Source: architecture.md#Project directory structure — packages/{core,cli}/package.json] — lines 632, 667
- [Source: architecture.md#3-layer vendor-neutrality] — lines 715–721 (layer-3 docker gate is release.yml's responsibility)
- [Source: architecture.md#Implementation sequence — Story-010] — line 912 (with Epic 5 split caveat)
- [Source: architecture.md#Distribution boundary 1 release → 3 surfaces] — lines 752–762
- [Source: prd.md#FR29] — line 547 (`@caspian-dev/cli` scoped name)
- [Source: prd.md#FR36] — line 557 (CI integration snippet)
- [Source: prd.md#NFR15, NFR17, NFR20] — lines 590, 592, 598
- [Source: caspian/.github/workflows/ci.yml] — Story 2.7's gate matrix (mirrored verbatim into release.yml steps 4–14)
- [Source: caspian/scripts/vendor-neutrality-docker.mjs] — Story 2.7's docker-gate implementation (extended with mode dispatch in this story)
- [Source: caspian/packages/cli/scripts/verify-pack.ts] — verify-pack snapshot regeneration procedure (lines 100–104)
- [Source: caspian/packages/cli/tests/integration/published-files.snapshot.json] — pre-Story-2.8 baseline (41 entries with `dist/.tsbuildinfo`)
- [Previous story: 2-7-conformance-suite-3-layer-vendor-neutrality-enforcement.md] — D2 deferred (docker shim) closed by this story; layer-3 gate forward-dependency closed by this story
- [Deferred-work: _bmad-output/implementation-artifacts/deferred-work.md:80] — Story 2.1 `.tsbuildinfo` leak closed by this story

## Dev Agent Record

### Agent Model Used

claude-opus-4-7[1m]

### Debug Log References

#### Cross-checks (all green)

1. **CC1 — `pnpm lint` clean.**
   ```
   $ pnpm lint
   Checked 66 files in 71ms. No fixes applied.
   ```
   File count preserved exactly at Story 2.7 baseline (66). Two pre-existing lint issues from Story 2.4 (`packages/core/tests/unit/validators/allow-list.test.ts:13` — useTemplate FIXABLE) and Story 2.7 review-patch P1 (`conformance/runner.mjs:183` — formatter would print) auto-fixed as side-effect (necessary for AC18 / AC19 green; see Deliberate departures below).

2. **CC2 — `pnpm depcruise` clean.**
   ```
   $ pnpm depcruise
   ✔ no dependency violations found (29 modules, 52 dependencies cruised)
   ```

3. **CC3 — `pnpm verify-codes-hash` clean (hash unchanged).**
   ```
   $ pnpm verify-codes-hash
   [verify-codes-hash] OK — registry sha256 matches codes.generated.ts header
   (b303d1395ec438a29d81b61e5a2a5419ee236b6c38b6feba3021de1df8e803c7)
   ```
   Hash identical to Story 2.6 / 2.7 — confirms zero registry / generator-input mutation by Story 2.8.

4. **CC4 — `pnpm test` clean (baseline preserved).**
   ```
   packages/core test: Test Files  10 passed (10)
   packages/core test: Tests       91 passed (91)
   packages/cli test:  Test Files  5 passed (5)
   packages/cli test:  Tests       42 passed | 1 skipped (43)
   ```
   Total: 133 passed + 1 skipped across 15 files — exactly Story 2.7 baseline. Zero new vitest tests added by Story 2.8.

5. **CC5 — `pnpm ajv-validate-registry` clean.**
   ```
   $ pnpm ajv-validate-registry
   [ajv-validate-registry] OK — diagnostics/registry.json (18 entries) conforms
   to schemas/v1/diagnostic-registry.schema.json
   ```

6. **CC6 — `pnpm verify-pack` clean against new 40-entry snapshot.**
   ```
   $ pnpm verify-pack
   verify-pack: OK (40 files match snapshot)
   ```
   Was 41 in Story 2.7; minus `dist/.tsbuildinfo` = 40. AC7 satisfied.

7. **CC7 — `pnpm audit-vendor-neutrality` clean.**
   ```
   $ pnpm audit-vendor-neutrality
   audit-lockfile-vendor-neutrality: OK (27 resolved packages across
   2 @caspian-dev/* importers; zero @anthropic-ai|@claude matches)
   ```

8. **CC8 — `pnpm build` green.**
   Both `@caspian-dev/core` and `@caspian-dev/cli` build cleanly. `.tsbuildinfo` files now sit at package root (`packages/core/.tsbuildinfo`, `packages/cli/.tsbuildinfo`), confirmed via `find packages/{cli,core}/dist -name '.tsbuildinfo'` returning empty.

9. **CC9 — `pnpm conformance` clean.**
   ```
   $ pnpm conformance
   18 / 18 cases passed
   Report: F:\work\joselimmo-marketplace-bmad\caspian\conformance\REPORT.md
   ```

10. **CC10 — `pnpm vendor-neutrality:docker` (local-tarball mode) clean.**
    ```
    $ CASPIAN_DOCKER_GATE_MODE=local-tarball pnpm vendor-neutrality:docker
    vendor-neutrality-docker: mode=local-tarball
    v22.22.2
    fixtures/core-epic/minimal.md: (no diagnostics)
    fixtures/core-overview/minimal.md: (no diagnostics)
    fixtures/core-plan/minimal.md: (no diagnostics)
    fixtures/core-story/minimal.md: (no diagnostics)
    fixtures/overlay-compat/all-22-known-fields.md: (no diagnostics)
    fixtures/overlay-compat/x-extension.md: (no diagnostics)
    6 files: 0 errors, 0 warnings
    vendor-neutrality-docker: OK (local-tarball install + caspian validate
    /fixtures/ exits 0 inside node:22-alpine)
    ```
    Verified locally on Docker 28.0.1 + node:22-alpine on Windows 11. Vendor-neutrality runtime invariant proven.

11. **CC11 — `pnpm changeset status` reports pending v0.1.0 bump.**
    ```
    $ pnpm changeset status
    🦋  info Packages to be bumped at minor:
    🦋  - @caspian-dev/core
    🦋  - @caspian-dev/cli
    ```

12. **CC12 — `release.yml` no NPM_TOKEN, only allow-listed actions.**
    `grep -ni "NPM_TOKEN" .github/workflows/release.yml` → empty. `grep "uses:"` → only `actions/checkout@v4`, `actions/setup-node@v4`, `changesets/action@v1`, `pnpm/action-setup@v4`.

13. **CC13 — `package.json` metadata expansion shape verified.** Both `@caspian-dev/core` and `@caspian-dev/cli` `package.json` files validate as JSON and produce a `pnpm pack --dry-run --json` output with the expanded fields visible. `repository.url = "git+https://github.com/joselimmo/caspian.git"`, `homepage = "https://caspian.dev"`, `bugs.url = "https://github.com/joselimmo/caspian/issues"` on both packages.

14. **CC14 — All 22 ACs satisfied (cross-walk).**
    AC1 (release.yml exists + correct triggers/permissions/concurrency) ✅; AC2 (14-step pre-publish gate matrix in correct order) ✅; AC3 (provenance via OIDC — verified by absence of NPM_TOKEN + `id-token: write` + `registry-url` + `publishConfig.provenance: true`; full Sigstore attestation only verifiable post-publish) ✅; AC4 (cli package.json shape complete) ✅; AC5 (core package.json shape complete) ✅; AC6 (.tsbuildinfo relocated outside dist/) ✅; AC7 (snapshot regenerated to 40 entries) ✅; AC8 (changeset authored with both packages minor) ✅; AC9 (README 7-section structure, ≤200 lines, zero Claude Code mentions) ✅; AC10 (snippet 18 lines including 3-line validate step, version-pinned, allow-listed actions only) ✅; AC11 (NFR17/NFR20 via docker layer-3 — verified pre-publish via local-tarball; post-publish verification wired into release.yml) ✅; AC12 (verify-pack + conformance + docker all run before changesets/action) ✅; AC13 (env-var dispatch implemented + tested) ✅; AC14 (cli README footer + 7 sections present) ✅; AC15 (core README footer added, API surface preserved) ✅; AC16 (CHANGELOG bullets appended both packages) ✅; AC17 (.changeset/config.json shape correct, no edit) ✅; AC18 (release.yml biome-clean, lint count 66 preserved) ✅; AC19 (full smoke gate green, baselines preserved) ✅; AC20 (deferred-work.md entries closed) ✅; AC21 (sprint-status flips correct, epic-2 preserved at in-progress) ✅; AC22 (forward-reference URL semantics correctly narrowed; repository + bugs resolve to existing repo, only homepage is a true Epic 4 forward reference) ✅.

### Completion Notes List

- **Smoke gate baseline (biome-checked file count): 66 files** — Story 2.7 floor preserved exactly. Story 2.8 adds `.changeset/0001-initial-public-release.md` (Markdown, not biome-checked), `examples/ci-integration/{README.md, github-actions-snippet.yml}` (Markdown + YAML, neither biome-checked), `.github/workflows/release.yml` (YAML, not biome-checked). The single edited biome-checked file (`scripts/vendor-neutrality-docker.mjs`) was already in the count.
- **Total tests: 133 passed + 1 skipped** (10 core test files + 5 cli test files; the same Windows symlink test still skipped). Story 2.7 baseline preserved exactly. Story 2.8 adds zero vitest tests per architecture (release-pipeline correctness is verified by execution at release time, not unit tests).
- **Hash header on `codes.generated.ts` unchanged** at `b303d1395ec438a29d81b61e5a2a5419ee236b6c38b6feba3021de1df8e803c7`. Confirms zero registry / source mutation by this story.
- **`verify-pack` baseline: 41 → 40 files.** New floor for Story 3.x onward.

- **Deliberate departures from sealed surface:**
  - **`packages/core/tests/unit/validators/allow-list.test.ts` lint auto-fix** (NOT in original story scope): biome 2.4.13's `useTemplate` rule had been failing on a pre-existing string-concat pattern from Story 2.4 (`[ ... ].join("\n") + "\n"`). The lint was an unsafe auto-fix (string-array-only edge case where biome cannot prove safety) but the substitution is identical for our string-only array. Applied via `biome check --write --unsafe`. Required to make AC18 (`pnpm lint` exit 0) pass. The "tests/" location is outside the `packages/{core,cli}/src/` no-touch boundary (test files vs source files); this is the same precedent Story 2.7 set with `packages/cli/vitest.config.ts`.
  - **`conformance/runner.mjs` lint auto-fix** (NOT in original story scope): biome formatter wanted a multi-line ternary form for the `stderrHint` line that was added by the Story 2.7 review patch P1. Applied via `biome check --write` (safe fix). Required to make AC18 pass. The conformance harness is outside the `packages/{core,cli}/src/` boundary.
  - **CHANGELOG `## Unreleased` heading kept (NOT rotated to `## 0.1.0`):** the heading rotation is the responsibility of `changesets version` running inside the release PR; the dev-story workflow ships the bullets to `## Unreleased` per AC16.
  - **`vendor-neutrality-docker.mjs` JSDoc updated to Story 2.8 framing:** the script's top-of-file comment was updated to describe the new env-var dispatch and to remove the Story 2.7 "transitional shim" framing. Strictly speaking this is a comment edit, not a behavior change; documented here for transparency.

- **Closed deferred items:**
  - **Story 2.1 deferred** — `dist/.tsbuildinfo` published with absolute machine paths. Resolved by relocating `tsBuildInfoFile` outside `dist/` in both `packages/{core,cli}/tsconfig.json` (AC6) and rebaselining the snapshot 41 → 40 entries (AC7).
  - **Story 2.7 D2** — `vendor-neutrality-docker.mjs` requires `@caspian-dev/cli` to be available locally. Resolved by adding `CASPIAN_DOCKER_GATE_MODE` env-var dispatch (AC13); default mode flipped to `npx-published`; `local-tarball` shim preserved as opt-in for pre-publish smoke and the inner pre-publish gate of `release.yml`.

- **Carried-forward deferred items (NOT addressed here):**
  - **Story 2.7 D0** — CI/release workflows inactive until `caspian/` is extracted to `https://github.com/joselimmo/caspian` (currently empty). Operational step owned by user; sequenced after Story 2.8 reaches `done`.
  - **Story 2.7 D1** — `pnpm test` recursive flake on Windows under heavy load. Out of scope; CI on `ubuntu-latest` is the durable proof.
  - **Story 2.7 D3** — `dependency-cruiser` 16.x → 17.x bump. Out of scope; opportunistic.
  - **Story 2.7 D4** — Conformance scope (code-multiset only). Out of scope; v1.1+ richer assertions.
  - **Story 2.7 review W1–W8** — runner.mjs node-prefix invocation, signal-kill messaging, `dockerAvailable`/`runDockerGate` shell mismatch on Windows, template injection via `--version`, missing-`code` field in expected.json, `maxBuffer` in `runPnpmLs`, REPORT write try/catch, vendor-regex false-positive risk. All deferred per Story 2.7 review.
  - **Story 2.6 D1–D7** — JSON output edge cases, walker quirks, EPIPE handling. All out of scope.
  - **Story 2.5 D1** — `CASPIAN_CLI_FORCE_THROW` test backdoor. Out of scope.

- **Story 2.8-introduced deferred items:**
  - **D1 (Story 2.8) — Post-publish docker gate (`npx-published` mode) cannot be smoke-tested locally pre-publish.** The chicken-and-egg: `npx @caspian-dev/cli@0.1.0` requires the package to be on npm. Verified the script's `npx-published` mode by code inspection + the equivalent `local-tarball` mode passes (same docker invocation, only the install path differs). The `release.yml` post-publish verification step (AC2 step 16) is the durable proof at first release.
  - **D2 (Story 2.8) — Provenance attestation only verifiable post-publish.** `pnpm publish --dry-run --provenance` is not supported by npm; provenance is produced only on a real publish via OIDC. Verification happens at release time via `npm view @caspian-dev/cli@0.1.0 dist.signatures` (AC3). No dry-run path exists.
  - **D3 (Story 2.8) — `repository.url` deep-links 404 until repo extraction.** The empty repo at `https://github.com/joselimmo/caspian` resolves at the root (no 404), but deep-links to `packages/cli/package.json` and similar return 404 until `caspian/` contents are pushed. Allowed per AC22; the user owns the timing of the extraction.
  - **D4 (Story 2.8) — `homepage` URL 404s until Epic 4 ships `caspian.dev`.** Same allowed-forward-reference per AC22. The README footer link to `caspian.dev/diagnostics` is the same case.

- **Forward dependencies (out of scope for Story 2.8):**
  - Operational step: extract `caspian/` to `https://github.com/joselimmo/caspian` (user's choice of timing — `git filter-repo` or fresh clone-and-push).
  - Activation: first push to `joselimmo/caspian` `main` triggers `release.yml` → `changesets/action` opens a "Version Packages" PR → merge that PR → publish fires.
  - Post-publish: snippet's `@caspian-dev/cli@0.1.0` version pin is verifiable via `npm view`; the docker gate's `npx-published` mode can be smoke-tested.
  - Epic 3 (casper-core plugin), Epic 4 (caspian.dev site), Epic 5 (governance bundle: SECURITY.md, CODE_OF_CONDUCT.md, CODEOWNERS, dependabot.yml, SECURITY-OPS.md).

- **Confirmed:**
  - All 22 ACs satisfied (CC14 cross-walk).
  - Zero source mutation under `caspian/packages/{core,cli}/src/**`. The two `tsconfig.json` edits are compiler config (`tsBuildInfoFile`), not source.
  - Zero changes to `caspian/.github/workflows/ci.yml` (Story 2.7's surface preserved).
  - Zero new vitest tests.
  - Zero new runtime dependencies in either package.
  - The `@caspian-dev/cli` and `@caspian-dev/core` packages carry valid `publishConfig.provenance: true` (Story 2.5+), making provenance the default behavior of `pnpm publish` from the workflow.
  - The destination repo `https://github.com/joselimmo/caspian` is wired into both packages' `repository.url` and `bugs.url` fields for day-1 npm-page resolution.

### File List

**New (4 files):**
- `caspian/.changeset/0001-initial-public-release.md`
- `caspian/.github/workflows/release.yml`
- `caspian/examples/ci-integration/README.md`
- `caspian/examples/ci-integration/github-actions-snippet.yml`

**Modified (14 files):**
- `caspian/packages/cli/package.json` (added `repository`, `homepage`, `bugs`, `keywords` fields)
- `caspian/packages/core/package.json` (added `repository`, `homepage`, `bugs`, `keywords` fields)
- `caspian/packages/cli/tsconfig.json` (`tsBuildInfoFile`: `./dist/.tsbuildinfo` → `./.tsbuildinfo`)
- `caspian/packages/core/tsconfig.json` (`tsBuildInfoFile`: `./dist/.tsbuildinfo` → `./.tsbuildinfo`)
- `caspian/packages/cli/tests/integration/published-files.snapshot.json` (41 → 40 entries: removed `dist/.tsbuildinfo`)
- `caspian/packages/cli/README.md` (added "See also" footer linking to caspian.dev / caspian.dev/diagnostics / @caspian-dev/core npm)
- `caspian/packages/core/README.md` (added "See also" footer linking to caspian.dev / caspian.dev/diagnostics / @caspian-dev/cli npm)
- `caspian/packages/cli/CHANGELOG.md` (`## Unreleased` Story 2.8 bullet appended)
- `caspian/packages/core/CHANGELOG.md` (`## Unreleased` Story 2.8 bullet appended)
- `caspian/scripts/vendor-neutrality-docker.mjs` (added `CASPIAN_DOCKER_GATE_MODE` env-var dispatch + `npx-published` branch + updated JSDoc)
- `caspian/packages/core/tests/unit/validators/allow-list.test.ts` (lint auto-fix; pre-existing Story 2.4 string-concat → template literal — see Deliberate departures)
- `caspian/conformance/runner.mjs` (lint auto-fix; pre-existing Story 2.7 review-patch-P1 ternary → multi-line form — see Deliberate departures)
- `_bmad-output/implementation-artifacts/deferred-work.md` (Story 2.1 entry annotated RESOLVED + new Story 2.8 Resolutions log section appended)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (Story 2.8 status flips: backlog → ready-for-dev → in-progress → review)

(File-pair count: 4 new + 14 modified = 18 file paths touched across the story. Counting by **logical artifact**: 13 distinct concerns — workflow file, two examples files, changeset file, two package.json metadata expansions, two tsconfig relocations, snapshot regen, two README footers, two CHANGELOG bullets, docker-script env-var dispatch, two pre-existing-lint auto-fixes carried as side-effects, deferred-work resolutions log, sprint-status flips.)

## Change Log

- 2026-04-30: Story 2.8 file created (create-story workflow). Status: backlog → ready-for-dev. First public npm release (`@caspian-dev/{core,cli}@0.1.0`) with provenance, examples/ci-integration/ shipping, Story 2.1 + Story 2.7 D2 deferred items closed, 22 ACs, 14 tasks, no source mutation under `packages/{core,cli}/src`.
- 2026-04-30: Story 2.8 amended (post-create) to reflect confirmed destination repo `https://github.com/joselimmo/caspian` (currently empty). Concrete URLs replace `<org>` placeholders in AC4 (`@caspian-dev/cli` package.json `repository` + `bugs`), AC5 (`@caspian-dev/core` same), AC22 (forward-reference URL semantics narrowed: only `homepage`/`caspian.dev` is a true forward reference; `repository` and `bugs` resolve immediately on the existing-but-empty destination repo). Working Directory section + Background + dev-guardrails + AC1 implementation note updated to clarify that the repo extraction is an operational step owned by the user (sequenced after story `done`), not part of Story 2.8's scope.
- 2026-04-30: Story 2.8 implemented (dev-story workflow). Status: ready-for-dev → in-progress → review.
  - **4 new files + 14 modified files = 18 file paths touched.** New: `caspian/.changeset/0001-initial-public-release.md`, `caspian/.github/workflows/release.yml`, `caspian/examples/ci-integration/{README.md, github-actions-snippet.yml}`. Modified: both `package.json`s (added `repository`/`homepage`/`bugs`/`keywords`), both `tsconfig.json`s (`tsBuildInfoFile` relocated outside `dist/`), `published-files.snapshot.json` (41 → 40 entries), both READMEs (caspian.dev See-also footer), both CHANGELOGs (Story 2.8 bullet on `## Unreleased`), `scripts/vendor-neutrality-docker.mjs` (env-var dispatch + `npx-published` mode), two pre-existing lint auto-fixes carried as side-effects (`packages/core/tests/unit/validators/allow-list.test.ts`, `conformance/runner.mjs`), `deferred-work.md` (Resolutions log section), `sprint-status.yaml` (status flips).
  - All 22 ACs satisfied. All 14 cross-checks (CC1–CC14) pass.
  - **Local smoke gate:** lint 66 files / depcruise 29 modules+52 deps / verify-codes-hash unchanged at b303d139…e803c7 / test 133+1-skipped across 15 files / ajv-validate-registry 18 entries / verify-pack 40/40 OK / audit-vendor-neutrality 27 packages 0 offenders / build green / conformance 18/18 / vendor-neutrality:docker (local-tarball) 6 files 0/0 inside node:22-alpine. All 11 commands exit 0.
  - **Smoke gate baselines:** lint preserved at 66 files; tests preserved at 133+1; verify-pack baseline drops 41 → 40 (loses `dist/.tsbuildinfo`); registry hash unchanged.
  - **Two closed deferred items:** Story 2.1 `dist/.tsbuildinfo` leak (AC6 + AC7) and Story 2.7 D2 docker shim (AC13).
  - **Two deliberate departures from the original story scope:** auto-fix of pre-existing lint issues in `packages/core/tests/unit/validators/allow-list.test.ts` (Story 2.4 carryover) and `conformance/runner.mjs` (Story 2.7 review-patch-P1 carryover) — both required for AC18 lint-clean.
  - **Four Story-2.8-introduced deferred items** captured in Completion Notes (D1–D4): post-publish docker-gate verifiability, provenance dry-run gap, `repository.url` deep-link 404 until extraction, `homepage` URL 404 until Epic 4.
