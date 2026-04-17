---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - _bmad-output/brainstorming/brainstorming-session-2026-04-17-1545.md
workflowType: 'research'
lastStep: 3
research_type: 'domain'
research_topic: 'Agentic Workflows Ecosystem (competitive landscape of AI-assisted development workflow frameworks, with emphasis on open-source frameworks such as BMAD, Superpowers, Spec-kit, AIDD, and adjacent)'
research_goals: 'Competitive intelligence: (1) identify where the market is converging (patterns adopted by multiple frameworks), (2) identify which approaches are being abandoned or in decline, (3) surface adaptable patterns and anti-patterns for a token-efficient, anti-BMAD Claude Code plugin design'
user_name: 'Cyril'
date: '2026-04-17'
web_research_enabled: true
source_verification: true
---

# Research Report: Agentic Workflows Ecosystem

**Date:** 2026-04-17
**Author:** Cyril
**Research Type:** Domain

---

## Research Overview

[Research overview and methodology will be appended here]

---

<!-- Content will be appended sequentially through research workflow steps -->

## Domain Research Scope Confirmation

**Research Topic:** Agentic Workflows Ecosystem — competitive landscape of AI-assisted development workflow frameworks, with emphasis on open-source frameworks (BMAD, Superpowers, Spec-kit, AIDD, and adjacent).

**Research Goals:** Competitive intelligence — (1) identify where the market is converging (patterns adopted by multiple frameworks), (2) identify which approaches are being abandoned or in decline, (3) surface adaptable patterns and anti-patterns for a token-efficient, anti-BMAD Claude Code plugin design.

**Domain Research Scope (re-weighted for an OSS tooling ecosystem):**

- **Competitive Landscape (MAJOR)** — BMAD, Superpowers, Spec-kit, AIDD, SWE-agent, Aider, Cline, Continue, Cursor rules, OpenHands, and others; feature matrix, positioning.
- **Technology Trends (MAJOR)** — convergence patterns (subagents, memory tiers, skills vs agents, slash-commands, hooks, MCP, etc.) and divergence.
- **Decline/Abandonment Signals (MAJOR)** — archived repos, stagnant commit activity, pivoted frameworks, deprecated features.
- **Ecosystem & Value Chain (MEDIUM)** — Anthropic/OpenAI/GitHub plugin surfaces, marketplaces, community contributions.
- **Economic Factors (LIGHT)** — addressable market indicators for AI-assisted development tooling; note: no direct revenue data for OSS.
- **Regulatory Environment (SKIP)** — not relevant beyond open-source licensing considerations.

**Research Methodology:**

- All claims verified against current public sources (GitHub, official docs, changelogs, Anthropic/OpenAI blogs, reputable technical articles).
- Multi-source validation for critical claims ("abandoned", "in growth", "market leader").
- Explicit confidence levels on weak signals.
- Systematic citations (URL + access date).

**Scope Confirmed:** 2026-04-17

---

## Industry Analysis

> Note on domain specificity: the "industry" here is an **OSS tooling layer inside the broader AI-assisted development market**. The frameworks in scope (BMAD, Superpowers, Spec-kit, Anthropic Skills, AIDD, etc.) are free/open distributions that ride on top of commercial AI coding assistants (Claude Code, Cursor, GitHub Copilot, Aider, …). Their "market" is therefore a **mindshare/adoption market**, not a direct revenue market. Economic metrics below describe the host market; adoption metrics describe the frameworks themselves.

### Market Size and Valuation

The host commercial market that these OSS frameworks plug into is large and bifurcated between "AI code generation" (narrow) and "AI agents" (broad).

- **AI code generation** — USD **4.91 B (2024) → 30.1 B (2032)**, CAGR **27.1%**. The AI coding assistant slice reached **USD 7.37 B in 2025**. [getpanto.ai][netcorp]
- **AI code assistants (Gartner)** — **USD 3.0–3.5 B (2025) → 8.5 B (2026) → 47.3 B (2034)**, CAGR **~24%**. [uvik.net]
- **AI agents (broad)** — **USD 7.84 B (2025) → 52.62 B (2030)**, CAGR **46.3%**; autonomous agents subset **USD 5.83 B (2026)**. [marketsandmarkets]
- **Economic impact** — McKinsey survey (4,500 devs / 150 enterprises): AI coding tools reduce time on routine coding tasks by **46%**; average time saved per developer **≈3.6 h/week**. [secondtalent]

_Confidence: high for CAGR ranges (multiple independent firms converge on 24–46%). Medium on dollar absolutes (figures vary by analyst scope)._

_Sources:_
- https://www.getpanto.ai/blog/ai-coding-assistant-statistics
- https://www.netcorpsoftwaredevelopment.com/blog/ai-generated-code-statistics
- https://uvik.net/blog/ai-coding-assistant-statistics/
- https://www.marketsandmarkets.com/Market-Reports/ai-agents-market-15761548.html
- https://www.secondtalent.com/resources/ai-developer-productivity/

### Market Dynamics and Growth

_Growth drivers:_
- Rapid shift from autocomplete → chat assistants → **agentic loops** (plan → edit → verify → iterate). Pragmatic Engineer (Apr 2026) characterizes 2026 as the "agentic year" for dev tooling. [pragmaticengineer]
- **Claude Code rose from zero to #1** most-used AI coding tool in ~8 months (May 2025 release → early 2026 leader), overtaking Copilot and Cursor on usage share. [newsletter.pragmaticengineer.com]
- Enterprise embedding: Gartner projects **40% of enterprise applications embed AI agents by end-2026**, vs <5% in 2025. [joget.com]

_Growth barriers:_
- **Trust collapse**: only **29% of developers trust AI output** in 2026, down from **~70%+ in 2023**; **61%** say AI often produces code that "looks correct but is not reliable." Directly fuels demand for *structured* agentic workflows (guardrails, specs, review loops). [modall.ca][uvik.net]
- **Security**: Snyk audit found **prompt injection in 36%** of published skills; ecosystem has **no package-signing or verification standard**. [rywalker.com]
- **Tool fragmentation**: 70% of devs use 2–4 AI tools concurrently, 15% use 5+. Switching cost and context-sharing loss are real. [secondtalent]

_Market maturity (framework layer):_
- The agentic *framework* space is **young** — the bulk of the named projects launched in **mid-2025** (Anthropic Skills, Spec-kit, BMAD public revamp, Superpowers). The space is pre-consolidation. [rywalker.com]

_Sources:_
- https://newsletter.pragmaticengineer.com/p/ai-tooling-2026
- https://joget.com/ai-agent-adoption-in-2026-what-the-analysts-data-shows/
- https://modall.ca/blog/ai-in-software-development-trends-statistics
- https://uvik.net/blog/ai-coding-assistant-statistics/
- https://rywalker.com/research/agentic-skills-frameworks

### Market Structure and Segmentation

_Primary segments of the agentic workflow framework layer:_

1. **Catalog-style skill libraries** — curated skill/agent packs; low methodology prescription. Ex: **Anthropic Skills (~73K ⭐)**, **OpenAI Skills (~9K ⭐)**, **Google Gemini Skills (~1.8K ⭐)**, **wshobson/agents (~29K ⭐)**.
2. **Spec-driven development (SDD) frameworks** — impose a spec → plan → implement pipeline. Ex: **GitHub Spec-kit (~71K ⭐)**, **OpenSpec**, **PromptX**.
3. **Full-methodology enforcers** — multi-persona SDLC orchestration. Ex: **BMAD-Method (~37K ⭐)**, **Superpowers (~57K ⭐)**, **Agent OS**.
4. **Orchestration runtimes** — multi-agent execution engines beneath the methodology. Ex: **Claude-Flow (~14K ⭐)**, **Microsoft Amplifier (~3K ⭐)**.
5. **Convention/standards** — minimal, descriptive conventions. Ex: **AGENTS.md (~18K ⭐)**.
6. **Lightweight project-memory patterns** — single-repo conventions without full orchestration. Ex: **AIDD**-style approaches, **Babysitter (~317 ⭐)**.

_Star counts as of the Ry Walker survey, early 2026._ [rywalker.com]

_Geographic distribution:_
- Heavy US / GitHub concentration for vendors (Anthropic, OpenAI, Google, GitHub, Microsoft); community contributors globally distributed.

_Vertical integration / value chain:_
- **Upstream**: foundation model providers (Anthropic, OpenAI, Google) — own skill-catalog distribution.
- **Midstream**: IDE/CLI hosts (Claude Code, Cursor, Copilot CLI, Aider, Continue, Cline, OpenHands).
- **OSS framework layer** (this report's focus) — rides on midstream hosts; distributes via GitHub + marketplaces.
- **Downstream**: enterprise platforms adding managed versions of agentic workflows.

_Sources:_
- https://rywalker.com/research/agentic-skills-frameworks
- https://redreamality.com/blog/-sddbmad-vs-spec-kit-vs-openspec-vs-promptx/

### Industry Trends and Evolution

_Emerging trends (2025→2026):_
- **Agentic loops replace chat-only assistants.** Pair programming → autonomous AI teams. [medium.com/@dave-patten]
- **Spec-driven development (SDD) rises** — GitHub's Spec-kit, BMAD, OpenSpec converge on a spec-first idiom, validating the "plan before code" pattern. [augmentcode]
- **Standardization efforts**: **AGENTS.md** (~18K ⭐) emerges as a cross-tool convention for describing a repo to agents. [rywalker.com]
- **Subagents as context-isolation primitive** (not personas) — Claude Code native subagent model becomes the canonical way to parallelize or isolate heavy contexts.
- **Model Context Protocol (MCP)** adoption continues — standard interface between hosts and tools.

_Historical evolution (mid-2025 → early 2026):_
- **Mid-2025**: first wave — Spec-kit, BMAD revamp, Superpowers, Anthropic Skills all land within months. [rywalker.com]
- **Late 2025**: explicit critiques of heavy methodologies emerge ("BMAD is the most comprehensive… the learning curve is real"), seeding demand for **lighter alternatives**. [rywalker.com][medium.com/@tim_wang]
- **Early 2026**: community discussions openly ask *"does the framework still matter?"* — signaling maturation pressure and possible consolidation. [reddit.com/r/BMAD_Method]

_Future outlook:_
- Expect **consolidation around 2–3 dominant frameworks per segment**, with lightweight/opinionated alternatives surviving in the solo/indie niche.
- **Security hardening** (signing, verification, sandbox) is the largest unmet requirement.
- **Trust/verification loops** (tests-as-specs, automated adversarial review) become first-class citizens, not optional steps.

_Sources:_
- https://medium.com/@dave-patten/the-state-of-ai-coding-agents-2026-from-pair-programming-to-autonomous-ai-teams-b11f2b39232a
- https://www.augmentcode.com/tools/best-spec-driven-development-tools
- https://www.reddit.com/r/BMAD_Method/comments/1pcqarr/agent_os_vs_bmad_vs_spec_kit_does_the_framework/
- https://medium.com/@tim_wang/spec-kit-bmad-and-agent-os-e8536f6bf8a4

### Competitive Dynamics

_Market concentration (framework layer):_
- High skew in mindshare (stars). Top 4 projects account for the majority of community attention: Anthropic Skills, Spec-kit, Superpowers, BMAD. [rywalker.com]
- No single framework dominates — they differ enough in philosophy (catalog vs spec vs methodology) to coexist.

_Competitive intensity:_
- **High and rising.** Multiple new frameworks per quarter; most are OSS and free to adopt, so switching cost is "learn a new convention" rather than "buy a license."

_Barriers to entry:_
- **Low technical barrier** — any competent OSS contributor can ship a skills pack.
- **High adoption barrier** — trust, documentation quality, maintainer cadence, and host-platform blessing (Anthropic/OpenAI/Google branding) create strong incumbency effects.

_Innovation pressure:_
- Fast iteration; monthly to quarterly releases the norm in active projects.
- Under-solved problems driving differentiation: **token efficiency**, **memory persistence across sessions**, **security/sandboxing**, **polyvalence across stacks**, **lightweight alternatives to heavy SDLC methodologies**.

_Direct implication for the joselimmo plugin project:_
Your explicit anti-BMAD / token-efficient / AIDD-inspired positioning targets the **gap between "full methodology enforcers" (BMAD, Superpowers) and "raw catalogs" (Skills)**. That gap is real and acknowledged in community discourse (see Reddit thread above). Market timing is favorable for an opinionated-but-lean entry.

_Sources:_
- https://rywalker.com/research/agentic-skills-frameworks
- https://www.reddit.com/r/BMAD_Method/comments/1pcqarr/agent_os_vs_bmad_vs_spec_kit_does_the_framework/
- https://www.reddit.com/r/ClaudeCode/comments/1pba1ud/spec_driven_development_sdd_speckit_openspec_bmad/

---

## Competitive Landscape

> Note on "market share": since these are free OSS frameworks, direct revenue share is unavailable. Proxies used below: GitHub stars, marketplace inclusion (Anthropic official), community discussion volume, and analyst/journalist coverage. Star counts are as of early 2026 unless noted; single-source counts are flagged with confidence level.

### Key Players and Market Leaders

**Tier 1 — Host-blessed catalogs (broadest distribution, lowest prescription):**
- **Anthropic Agent Skills (~73K ⭐)** — Official. Auto-loading `SKILL.md` files. Skills activate automatically when Claude detects relevant context; no explicit slash trigger required. Bundled with Claude Code. Distribution moat: built into the host. [rywalker.com][platform.claude.com]
- **OpenAI Skills (~9K ⭐)** and **Google Gemini Skills (~1.8K ⭐)** — Platform-specific counterparts; much smaller mindshare than Anthropic's. [rywalker.com]

**Tier 2 — Spec-driven frameworks:**
- **GitHub Spec-kit (~71K ⭐)** — CLI (`specify`) that scaffolds Constitution → Specify → Plan → Tasks → Implement. Works across Copilot, Claude Code, Gemini CLI. GitHub brand + cross-tool coverage = strong incumbency signal. [github.com/github/spec-kit]
- **OpenSpec** and **PromptX** — smaller SDD alternatives, more opinionated. [redreamality.com]

**Tier 3 — Full-methodology enforcers (heaviest prescription):**
- **Superpowers (obra)** — 14 agentic skills forcing a 5-phase discipline: clarify → design → plan → code → verify. **Accepted into the Anthropic official marketplace on 2026-01-15**. MIT licensed. Star count disputed: Ry Walker survey reports ~57K ⭐; popularaitools.ai reports ~121K ⭐ as of Apr 2026 (low confidence on the higher figure, likely promotional inflation). Still: **growth velocity is the highest in the category**. [blog.fsck.com][claude.com/plugins/superpowers]
- **BMAD-Method (~37K ⭐)** — 8+ personas covering full agile SDLC (Analyst, PM, Architect, PO, SM, Dev, QA, Orchestrator). Most comprehensive. "Feels like a technical co-founder who is also a PM, architect and scrum master." Learning curve explicitly flagged as real. v6 reportedly improved token efficiency ("90% savings" per one author — unverified). [rywalker.com][hieutrantrung.it]
- **Agent OS (buildermethods)** — Command-driven: `/plan-product → /shape-spec → /write-spec → /create-tasks → /implement-tasks | /orchestrate-tasks`. Uses profiles, personas, subagents, "standards as skills." Positioned between Spec-kit's lightness and BMAD's completeness. [buildermethods.com/agent-os]

**Tier 4 — Orchestration runtimes:**
- **Claude-Flow (~14K ⭐)** — multi-agent execution engine.
- **Microsoft Amplifier (~3K ⭐)** — MS-backed orchestration layer.

**Tier 5 — Conventions / lightweight patterns:**
- **AGENTS.md (~18K ⭐)** — de-facto convention for describing a repo to agents, cross-tool. Low prescription, high portability. [rywalker.com]
- **paralleldrive/aidd** — "the standard framework for AI Driven Development"; specification-first methodology; explicit AIDD branding; metaprograms + agent orchestration + prompt modules. Direct inspiration for your project's `.claude/` + `aidd_docs/` pattern. [github.com/paralleldrive/aidd]
- **Babysitter (~317 ⭐)** — minimal, niche.

**Adjacent — OSS coding agent hosts (not frameworks, but they're the "engines" frameworks ride on):**
- **OpenCode (~95K ⭐)** leads the OSS host race (Mar 2026), **OpenHands (~68K ⭐)** backed by $18.8M Series A, **Cline (~59K ⭐)** IDE-native with safety controls, **Aider** git-native minimalist. Anthropic Claude Code is commercial — "entirely in Anthropic's hands; no community to carry it forward" if deprioritized. [ossinsight.io][thenewstack.io]

_Sources:_
- https://rywalker.com/research/agentic-skills-frameworks
- https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
- https://github.com/github/spec-kit
- https://redreamality.com/blog/-sddbmad-vs-spec-kit-vs-openspec-vs-promptx/
- https://blog.fsck.com/2025/10/09/superpowers/
- https://claude.com/plugins/superpowers
- https://github.com/bmad-code-org/BMAD-METHOD
- https://medium.com/@hieutrantrung.it/from-token-hell-to-90-savings-how-bmad-v6-revolutionized-ai-assisted-development-09c175013085
- https://buildermethods.com/agent-os
- https://github.com/paralleldrive/aidd
- https://ossinsight.io/blog/coding-agent-wars-2026
- https://thenewstack.io/open-source-coding-agents-like-opencode-cline-and-aider-are-solving-a-huge-headache-for-developers/

### Market Share and Competitive Positioning

_Mindshare distribution (by GitHub stars, Ry Walker Apr 2026):_ Anthropic Skills (~73K) ≈ Spec-kit (~71K) > Superpowers (~57K) > BMAD (~37K) > wshobson/agents (~29K) > AGENTS.md (~18K) > Claude-Flow (~14K) > OpenAI Skills (~9K) > Amplifier (~3K) > Gemini Skills (~1.8K) > Babysitter (~317).

_Positioning map (two axes — prescription level × portability):_

```
                HIGH prescription
                      │
            BMAD ─────┤───── Superpowers
                      │
                      │          Agent OS
                      │
      Spec-kit ───────┼─────── Anthropic Skills
                      │
                      │          OpenAI Skills
                      │          Gemini Skills
                      │
        AIDD ─────────┤─────── AGENTS.md
                      │
                LOW prescription
 SINGLE-HOST ─────────┴───────── CROSS-HOST
```

- **High prescription + single-host**: BMAD, Superpowers → opinionated methodology, Claude Code-first.
- **High prescription + cross-host**: Agent OS, Spec-kit → structured process, multi-tool.
- **Low prescription + single-host**: Anthropic/OpenAI/Gemini Skills → vendor catalogs, auto-loaded.
- **Low prescription + cross-host**: AGENTS.md, AIDD → conventions that travel.

_Value-proposition clusters:_
- "Give me a full virtual team" → BMAD, Superpowers
- "Force me to think before coding" → Spec-kit, OpenSpec, Agent OS
- "Hand me a skill catalog" → Anthropic/OpenAI/Gemini Skills, wshobson/agents
- "Just a repo convention" → AGENTS.md, AIDD

_Customer segments served:_
- **Solo devs / indie**: gravitate toward Spec-kit (lightness) or Superpowers (quality).
- **Small teams**: Agent OS, Superpowers.
- **Enterprises / large agile orgs**: BMAD targets this explicitly.
- **Tool builders**: AGENTS.md (as portable contract), Skills catalogs (as distribution surface).

_Sources:_
- https://rywalker.com/research/agentic-skills-frameworks
- https://www.reddit.com/r/BMAD_Method/comments/1pcqarr/agent_os_vs_bmad_vs_spec_kit_does_the_framework/

### Competitive Strategies and Differentiation

- **Anthropic/OpenAI/Google Skills** → **distribution-as-moat**. They own the host; auto-loading is their key differentiator. Devs don't install; skills just appear.
- **GitHub Spec-kit** → **brand + ubiquity**. Cross-tool CLI + GitHub blessing. Lightweight enough to add to any workflow.
- **Superpowers** → **quality-per-token**. Positioned as "same output quality as BMAD at a fraction of the cost" in community reviews. MIT + free + no tiers.
- **BMAD** → **full SDLC coverage**. Differentiates by being the most complete; trades off token cost and learning curve. v6 is a response to token-cost criticism.
- **Agent OS** → **cross-tool orchestration**. Its moat is multi-agent workflow portability.
- **AGENTS.md** → **convention-as-standard**. Wins if it becomes the lingua franca; already adopted cross-tool.
- **AIDD (paralleldrive)** → **specification-first minimalism** + metaprogram bundling.

_Innovation approaches:_
- Anthropic Skills pioneered **auto-activation on context detection** — no slash, no mention, skill loads itself. A strong UX advantage.
- Superpowers introduced **phase-gated discipline** with safeguards (e.g., architectural review forced after 3 failed fix attempts).
- BMAD's v6 reportedly introduces **selective loading** to reduce token bleed (aligns with your own `Selective Memory Loading by Workflow Phase` principle).
- Spec-kit's **constitution.md** (non-negotiable principles) is a durable pattern spreading to other frameworks.

_Sources:_
- https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/
- https://www.anthropic.com/news/skills
- https://www.reddit.com/r/ClaudeCode/comments/1reg7l9/whats_better_than_the_bmad_method/
- https://medium.com/@hieutrantrung.it/from-token-hell-to-90-savings-how-bmad-v6-revolutionized-ai-assisted-development-09c175013085

### Business Models and Value Propositions

_Primary business models:_
- **Platform-owned (free-with-host)**: Anthropic/OpenAI/Gemini Skills. Revenue flows to the host API; the framework itself is a retention/stickiness asset.
- **Commercial-adjacent OSS** (GitHub Spec-kit): Free tool, drives Copilot + GitHub Actions usage.
- **Pure OSS, author-led** (Superpowers, BMAD, AIDD, Agent OS, Claude-Flow): MIT / permissive, no paid tier, no SaaS. Monetization (if any) is indirect — consulting, sponsorship, reputation capital.
- **VC-backed agent hosts** (OpenHands $18.8M Series A): eventually a managed cloud play.

_Revenue streams observed in the framework layer: near-zero._ This is a **mindshare economy**, not a revenue economy. That is precisely why **switching cost is low** and **competitive intensity is high**.

_Sources:_
- https://claude.com/plugins/superpowers
- https://github.com/bmad-code-org/BMAD-METHOD
- https://thenewstack.io/open-source-coding-agents-like-opencode-cline-and-aider-are-solving-a-huge-headache-for-developers/

### Competitive Dynamics and Entry Barriers

_Barriers to entry — low technical, high adoption:_
- Anyone can ship a skills pack; GitHub distribution is free.
- Adoption requires: documentation quality, maintainer cadence, host-platform blessing (marketplace inclusion), community champions.
- **Anthropic marketplace inclusion** is emerging as the de-facto "seal of approval" (Superpowers, Jan 2026) — a new **soft barrier**.

_Competitive intensity — high:_
- Monthly cadence of new frameworks and features through 2025-2026.
- Feature diffusion is fast: auto-loading, subagents, phase-gating, constitution files all spread across 2–3 competing frameworks within 1–2 release cycles.

_Signals of saturation / consolidation pressure (early 2026):_
- Reddit threads titled *"BMAD method sucks"*, *"What's better than BMAD"*, *"Does the framework still matter?"* — community fatigue with heavy methodology.
- Jamie Lord, Apr 2026: *"Claude Code's memory tool ecosystem is mostly redundant with its own defaults."* — suggests the market is starting to compress: hosts absorb features that third-party frameworks used to differentiate on. [lord.technology]

_Switching costs — low:_
- Frameworks are rarely entrenched in CI/CD; they live in `.claude/`, `.github/`, or similar conventions.
- Users frequently run **multiple frameworks in parallel** or swap quickly. 70% of devs already use 2–4 tools concurrently.

_Signals of decline / abandonment:_
- **No framework in scope is officially abandoned.** But clear direction-of-travel signals exist:
  - **Heavy persona dialogue** (BMAD-style, AutoGPT-style) is in **decline**. Users openly complain about token cost and verbosity; v6 BMAD explicitly tries to reduce this.
  - **External vector DBs for memory** were abandoned by AutoGPT (switched back to simple file storage) — a rare clear "this was wrong" reversal.
  - **BabyAGI / AutoGPT / MetaGPT** — not dead, but no longer leading the narrative; referenced mostly historically in 2026 coverage.
  - **Heavy multi-file planning artifacts** (BMAD-style full PRD/architecture/epic chain) are being challenged by **lighter artifact chains** (Spec-kit's single spec + plan + tasks, or AGENTS.md minimalism).

_Sources:_
- https://www.reddit.com/r/BMAD_Method/comments/1r6aruo/bmad_method_sucks/
- https://www.reddit.com/r/ClaudeCode/comments/1reg7l9/whats_better_than_the_bmad_method/
- https://github.com/bmad-code-org/BMAD-METHOD/issues/1235
- https://github.com/bmad-code-org/BMAD-METHOD/issues/511
- https://lord.technology/2026/04/11/claude-codes-memory-tool-ecosystem-is-mostly-redundant-with-its-own-defaults.html
- https://autogpt.net/babyagi-complete-guide-what-it-is-and-how-does-it-work/

### Ecosystem and Partnership Analysis

_Supplier relationships (host → framework):_
- Anthropic hosts the Claude API + Claude Code + official marketplace. Its blessing is the most valuable partnership asset in the ecosystem right now.
- GitHub hosts Spec-kit (1st-party OSS), Copilot (paid), and the repo/distribution infrastructure for the majority of frameworks.
- OpenAI, Google, Microsoft each have their own skill ecosystems but smaller reach in the agentic-workflow niche.

_Distribution channels:_
- **GitHub** — primary distribution for all OSS frameworks.
- **Anthropic official marketplace** — curated, quality-gated.
- **Community marketplaces** — e.g., obra/superpowers-marketplace, claudepluginhub.com, claudemarketplaces.com. Low curation, high volume.

_Technology partnerships:_
- **MCP (Model Context Protocol)** is emerging as the cross-host interface standard — enables "skills once, hosts many."
- Frameworks that bet on MCP early (Spec-kit, Agent OS) gain multi-host portability.
- Frameworks tied to a single host (Anthropic Skills) trade portability for deep integration.

_Ecosystem control:_
- **Model providers** control the substrate (API + model + SDK).
- **GitHub** controls the distribution substrate.
- **No framework author controls a meaningful chokepoint yet** — which is why the space remains fragmented and open.

_Implication for your plugin:_
- Publishing to the `joselimmo-marketplace` + following Claude Code plugin conventions puts you on the **community marketplace** tier. Aspiration-tier would be **Anthropic official marketplace inclusion** (Superpowers-style) — that's the most valuable distribution asset for a framework-layer project.

_Sources:_
- https://github.com/anthropics/claude-plugins-official
- https://claude.com/plugins
- https://code.claude.com/docs/en/discover-plugins
- https://github.com/obra/superpowers-marketplace

---
