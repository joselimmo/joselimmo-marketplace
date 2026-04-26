---
project: joselimmo-marketplace-bmad
product: Caspian + casper-core (v1.0)
purpose: 'Tracks non-engineering go-to-market activities for the v1.0 launch. Engineering deliverables live in epics.md; this file captures outreach, defensive registration, and ecosystem-positioning work that is sourced from the PRD (MVP + Resource Risk Mitigation + Innovation/Risk Mitigation sections) but is not represented as numbered FRs.'
author: Cyril
date: 2026-04-26
status: open
sourceReferences:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/planning-artifacts/implementation-readiness-report-2026-04-26.md
---

# Caspian + casper-core (v1.0) — Launch Checklist

Non-engineering activities that ship around v1.0. Engineering tasks live in `epics.md`. Each item below names the trigger (when to do it), the deliverable, and the success signal.

## A. Defensive Name Registration (pre-launch)

**Trigger:** before public announcement.
**Source:** PRD §"MVP" + PRD §"Implementation Considerations" + Story 5.3 `.github/SECURITY-OPS.md`.

- [ ] **GitHub** — `caspian` org or repo reserved (already in `joselimmo-marketplace/caspian/` provisional; promote to dedicated repo when spec stabilizes).
- [ ] **GitHub** — `casper` org or repo reserved.
- [ ] **npm** — `caspian` package name reserved (publishing the CLI itself satisfies this — Story 2.8).
- [ ] **npm** — `@caspian` scope reserved.
- [ ] **npm** — `casper` and `casper-core` reserved (placeholder publish if necessary).
- [ ] **PyPI** — `caspian` and `casper` reserved (placeholder package, no functionality).
- [ ] **crates.io** — `caspian` and `casper` reserved (placeholder crate).
- [ ] **Domain** — `caspian.dev` registered + DNS to GitHub Pages (Epic 4 dependency).
- [ ] **Domain (optional, defensive)** — `caspian.io` and `caspian.ai` if budget allows (PRD: under €100 first-year budget).

**Success signal:** `.github/SECURITY-OPS.md` (Story 5.3) reflects the actual registration state with renewal dates.

## B. Upstream Convergence Initiation (before v1.0 ship)

**Trigger:** before v1.0 release announcement.
**Source:** PRD §"Business Success" — *"≥1 `requires` / `produces` proposal submitted to `agentskills.io` before v1.0 release"*.

- [ ] Draft a `requires` / `produces` proposal aligned with `agentskills.io` contribution conventions.
- [ ] Submit as a PR or RFC on the `agentskills.io` repository.
- [ ] Cross-link the upstream proposal from `spec/CONTRIBUTING.md` and the v1.0 announcement post.

**Success signal:** PR or RFC URL recorded in this checklist; status tracked through merge or rejection.

## C. Ecosystem Positioning — Awesome Lists (release week)

**Trigger:** within 7 days of v1.0 npm publish.
**Source:** PRD §"MVP" + PRD §"Plugin collections (surface for adoption compounding)".

- [ ] PR into `awesome-claude-code` adding Caspian as an *interop spec* entry.
- [ ] PR into `awesome-agent-skills` adding Caspian.
- [ ] PR into `ComposioHQ/awesome-claude-plugins` adding casper-core.
- [ ] PR into `claude-code-templates` (davila7) adding casper-core if scope-appropriate.
- [ ] PR into `rohitg00/awesome-claude-code-toolkit` adding casper-core if scope-appropriate.

**Success signal:** ≥2 awesome-list PRs merged within 30 days post-launch.

## D. Framework Maintainer Outreach (months 1–3 post-launch)

**Trigger:** PRD §"Measurable Outcomes — Month 3" — *"≥2 framework maintainers contacted and logged"*.
**Goal:** Journey 4 (BMad maintainer evaluates Caspian) materializes.

- [ ] Direct outreach to **BMad** core maintainer.
- [ ] Direct outreach to **Superpowers** maintainer.
- [ ] Direct outreach to **GitHub Spec Kit** maintainer.
- [ ] Direct outreach to **Agent OS** maintainer.
- [ ] Direct outreach to **AIDD** maintainer.
- [ ] Log every contact attempt + response in `notes/maintainer-outreach.md` (date, channel, status).

**Success signal:** ≥1 framework maintainer publicly engaged with the spec by v1.1 release (PRD Business Success criterion).

## E. Public Launch Communication (release day)

**Trigger:** v1.0 npm publish + GH Pages deployment confirmed.
**Source:** PRD §"MVP" + PRD §"Measurable Outcomes — Month 3 — public launch post published".

- [ ] Launch blog post / Substack / project README announcement (30-second pitch + 4-line frontmatter quickstart + adoption story).
- [ ] Hacker News submission (Show HN format, link to `caspian.dev`).
- [ ] `r/ClaudeAI` post.
- [ ] LinkedIn / Twitter announcement.
- [ ] Cross-post on `awesome-claude-code` discussions thread.

**Success signal:** ≥1 talk or discussion thread on `r/ClaudeAI`, HN, or `awesome-claude-code` by Month 6 (PRD lagging indicator).

## F. Adopter Experiment (months 0–3 post-launch)

**Trigger:** within 90 days of v1.0 publish.
**Source:** PRD §"MVP Strategy & Philosophy — fastest path to validated learning" — *"Run one external-adopter experiment within three months (concrete prompt: a Maya-style author adds Caspian frontmatter to a real published plugin)"*.

- [ ] Identify candidate plugin author (target: someone outside the founding author's circle).
- [ ] Approach with the 4-line frontmatter delta example (`examples/minimal-skill-adoption/`).
- [ ] Walk through Caspian adoption on one of their published skills.
- [ ] Document the friction points (what was unclear, where the spec failed, what the CLI got wrong).
- [ ] Feed friction back into v1.1 backlog or v1.0 patch as appropriate.

**Success signal:** ≥1 external author with Caspian frontmatter declared in a published plugin by Month 3 (validation experiment) or Month 12 (PRD success-gate threshold of ≥2 external adopters).

## G. Marketplace Submission (release week + ongoing)

**Trigger:** v1.0 npm publish complete + casper-core README finalized (Epic 3 done).
**Source:** PRD §"Distribution & Discoverability" + FR30 + Story 3.1 + Story 2.8.

- [ ] Submit `casper-core` to the official Anthropic plugin marketplace (manual submission process per architecture step-04 D2).
- [ ] Track marketplace review status; respond to feedback within 48 hours.
- [ ] On acceptance: update `caspian.dev` landing page CTAs to point at the official marketplace listing.

**Success signal:** PRD §"Business Success — Marketplace traction — casper-core accepted" — strategic goal, not a formal release gate. Acceptance counts even if delayed past v1.0 release.

## H. Success-Gate Evaluation (12 months post-v1.0)

**Trigger:** anniversary of v1.0 publish.
**Source:** PRD §"Success gate evaluation (lagging indicators)".

- [ ] Tally external adopters (target: ≥2).
- [ ] Tally external contributors (target: ≥1 RFC merged).
- [ ] Confirm Unix Interop Test reproducible (v1.1 deliverable).
- [ ] Confirm JSON Schema Store PR accepted (v1.1 deliverable).
- [ ] **If gate fails:** trigger scope/positioning review per PRD before further investment; consider sunset protocol if `agentskills.io` has shipped equivalent fields.

**Success signal:** clear go/no-go decision recorded by month 13.

---

## Maintenance

- This file is maintained alongside the engineering roadmap.
- Each section's success signal cross-references the PRD for traceability.
- When an item ships, mark it `[x]` and append the date + link/PR/URL.
- When a v1.1 PRD is opened, prune items absorbed by it and add new launch items.
