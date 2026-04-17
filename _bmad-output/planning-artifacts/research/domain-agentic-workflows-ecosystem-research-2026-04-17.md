---
stepsCompleted: [1, 2]
inputDocuments:
  - _bmad-output/brainstorming/brainstorming-session-2026-04-17-1545.md
workflowType: 'research'
lastStep: 2
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
