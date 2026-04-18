---
stepsCompleted: [1, 2]
inputDocuments:
  - _bmad-output/brainstorming/brainstorming-session-2026-04-17-1545.md
  - _bmad-output/planning-artifacts/research/domain-agentic-workflows-ecosystem-research-2026-04-17.md
  - _bmad-output/planning-artifacts/research/technical-plugin-architecture-distribution-research-2026-04-17.md
  - _bmad-output/planning-artifacts/research/technical-frontmatter-schemas-research-2026-04-17.md
  - _bmad-output/planning-artifacts/research/technical-subagents-context-isolation-research-2026-04-18.md
workflowType: 'research'
lastStep: 1
research_type: 'technical'
research_topic: 'Model Context Protocol (MCP) Integration Patterns for a Claude Code Workflow Plugin'
research_goals: 'Produce the factual basis required to (1) catalogue the mature MCP servers usable in 2026 (filesystem, GitHub, web-search, memory, etc.), (2) compare cost/benefit per server (token overhead, latency, security surface), (3) decide whether research-web-wrapper should use MCP-based web search or native WebSearch/WebFetch, (4) determine when MCP breaks portability rather than enabling it, and (5) define the pattern for declaring MCP servers in our plugin vs leaving them as consumer-project opt-ins.'
user_name: 'Cyril'
date: '2026-04-18'
web_research_enabled: true
source_verification: true
research_track: '4 of 5'
related_research:
  - 'Research #1 — Plugin Architecture & Distribution (completed 2026-04-17)'
  - 'Research #2 — Frontmatter Schemas for Typed Artifacts (completed 2026-04-17)'
  - 'Research #3 — Subagents as Context-Isolation Primitives (completed 2026-04-18)'
  - 'Research #5 — SessionStart Hook & Hook Lifecycle (planned)'
scope_exclusions:
  - 'Skill-to-skill composition protocol (not MCP — covered in Research #2 frontmatter)'
  - 'Plugin-shipped agent forbidden fields (covered in Research #1)'
  - 'Hook mechanics (covered in Research #5)'
  - 'Subagent output contract (covered in Research #3)'
---

# Research Report: MCP for Tool Integration

**Date:** 2026-04-18
**Author:** Cyril
**Research Type:** Technical (track 4 of 5)

---

## Research Overview

This is the fourth of five sequential technical research reports scoped jointly with the project owner on 2026-04-17. Prior tracks established the plugin architecture (Track 1), the frontmatter contract (Track 2), and the subagent contract (Track 3). This track sharpens the **agent-to-tool boundary** — specifically, where the Model Context Protocol (MCP) fits into our plugin design and where it does not.

**This report (Track 4)** covers:

- MCP landscape in April 2026 — standard status (Linux Foundation Agentic AI Foundation since Dec 2025), number of servers, adoption across hosts.
- Catalogue of mature MCP servers relevant to our plugin's needs (filesystem, GitHub, web-search, memory, time, fetch, etc.).
- Cost-benefit analysis per server class — token overhead of tool listings, latency, security surface.
- How MCP servers are declared in a Claude Code plugin (`.mcp.json`, inline in `plugin.json`, user-config-bound secrets).
- When MCP is the right choice (agent↔tool communication) vs when it is explicitly wrong (skill↔skill composition — already ruled out in Research #1).
- The decision this track must resolve: **does `research-web-wrapper` use an MCP-based web search server or the native `WebSearch`/`WebFetch` tools?** And more broadly, does our MVP plugin bundle any MCP servers, or are they opt-in per consumer project?

Findings inform the v1.5+ MCP integration milestone from the Track-1 roadmap and the `research-web-wrapper` implementation decision currently pinned at "native WebSearch via general-purpose subagent."

**Key findings at a glance** (detailed in the Research Synthesis at the end):

- _(populated after step-06 synthesis)_

---

## Technical Research Scope Confirmation

**Research Topic:** Model Context Protocol (MCP) Integration Patterns for a Claude Code Workflow Plugin

**Research Goals:** produce the factual basis required to (1) catalogue the mature MCP servers usable in 2026, (2) compare cost/benefit per server class, (3) decide whether `research-web-wrapper` uses MCP or native `WebSearch`/`WebFetch`, (4) determine when MCP breaks portability, and (5) define the MCP declaration pattern for our plugin vs consumer opt-in.

**Technical Research Scope:**

- Architecture Analysis — MCP standard status (Linux Foundation Agentic AI Foundation since Dec 2025), cross-host adoption, registry status
- Implementation Approaches — mature MCP servers by category (filesystem, GitHub, web-search, memory, time, fetch)
- Technology Stack — transport modes (stdio, HTTP), declaration syntax (`.mcp.json`, inline in `plugin.json`, `userConfig`-bound secrets), tool-listing cost
- Integration Patterns — MCP as agent↔tool substrate (YES) vs skill↔skill composition (NO — ruled out in Research #1)
- Decision — `research-web-wrapper` native vs MCP; plugin MVP zero MCP bundled vs opt-in per consumer

**Explicit Exclusions (delegated to sibling research tracks):**

- Skill-to-skill composition protocol → frontmatter-based (Research #2)
- Plugin-shipped agent restrictions → Research #1 (completed)
- Hook mechanics → Research #5
- Subagent output contract → Research #3 (completed)

**Research Methodology:**

- Current web data with rigorous source verification (MCP spec site, server registry, `code.claude.com/docs/en/mcp`, OSS repos)
- Multi-source validation for critical technical claims (cross-host adoption, MCP token cost benchmarks)
- Confidence level framework for uncertain information (young ecosystem, potential fragmentation)
- Systematic citations

**Scope Confirmed:** 2026-04-18

---

## Technology Stack Analysis

> **Domain-adapted interpretation**: for MCP, the "technology stack" covers the standard (spec, governance, transport), the registry and catalog layer, the server ecosystem by category, the configuration syntax within Claude Code plugins, and the token-cost profile (including the 2026 Tool Search game-changer). Generic stack categories (languages, DBs, cloud) do not apply.

### MCP Standard Status (April 2026)

MCP was donated to the **Agentic AI Foundation (AAIF)** — a directed fund under the Linux Foundation — in **December 2025**. Co-founded by Anthropic, Block, and OpenAI; backed by Google, Microsoft, AWS, Cloudflare, and Bloomberg. This is now the de-facto **cross-host standard** for connecting AI agents to tools and data.

**Adoption metrics (Q1–Q2 2026)**:

- **17,468** MCP servers indexed by an independent census (Nerq, Q1 2026).
- **10,000+** active public servers reported by Anthropic at the time of the Linux Foundation donation.
- **5,500+** servers listed on PulseMCP registry (Oct 2025).
- The official MCP Registry at `api.anthropic.com/mcp-registry/v0/servers` launched September 2025 and has grown to approximately 2,000 entries.
- **97 million** monthly SDK downloads (Python + TypeScript) by March 2026 — **970x growth in 18 months**.
- Cross-host adoption: **ChatGPT, Cursor, Gemini, Microsoft Copilot, VSCode, Claude Desktop** — every major AI developer tool.

**Protocol version**: MCP spec revision dated 2025-11-25. Transport modes: **stdio** (local subprocess) and **Streamable HTTP** (remote). SSE-based transport is deprecated but still seen in the wild.

_Sources:_
- [anthropic.com/news/donating-the-model-context-protocol](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation) — accessed 2026-04-18
- [MCP Adoption Statistics 2026 (MCP Manager)](https://mcpmanager.ai/blog/mcp-adoption-statistics/) — accessed 2026-04-18
- [github.blog — MCP joins the Linux Foundation](https://github.blog/open-source/maintainers/mcp-joins-the-linux-foundation-what-this-means-for-developers-building-the-next-era-of-ai-tools-and-agents/) — accessed 2026-04-18
- [modelcontextprotocol.io/specification/2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25) — accessed 2026-04-18

### MCP Configuration in Claude Code (`.mcp.json` Schema)

**Placement**:

- `.mcp.json` at the plugin root (preferred for multi-server plugins).
- Inline as `mcpServers: {...}` in `plugin.json` (acceptable for single-server cases).
- User-level: `~/.claude/.mcp.json` for personal defaults across projects.
- Project-level: `.mcp.json` at repo root for team-shared servers.

**Schema (top-level `mcpServers` object)**:

```json
{
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "remote-api": {
      "type": "http",
      "url": "${API_BASE_URL:-https://api.example.com}/mcp",
      "headers": {
        "Authorization": "Bearer ${API_TOKEN}"
      }
    }
  }
}
```

**Per-server fields**:

| Field      | Type    | stdio | HTTP  | Semantics                                                                                       |
| :--------- | :------ | :---: | :---: | :---------------------------------------------------------------------------------------------- |
| `type`     | string  | ✅ (default) | ✅ required | `"stdio"` \| `"http"`. `stdio` default.                                                |
| `command`  | string  | ✅ required | n/a | Executable to run (path or PATH-resolvable).                                                    |
| `args`     | array   | ✅ optional | n/a | Command-line arguments.                                                                          |
| `env`      | object  | ✅ optional | n/a | Environment variables. `${VAR}` expansion + `${VAR:-default}` fallback.                          |
| `url`      | string  | n/a   | ✅ required | Remote endpoint URL. Variable expansion supported.                                              |
| `headers`  | object  | n/a   | ✅ optional | HTTP headers (typically `Authorization: Bearer ${TOKEN}`).                                     |
| `cwd`      | string  | ✅ optional | n/a | Working directory for the subprocess.                                                            |
| `debug`    | boolean | ✅ optional | ✅ optional | `true` logs JSON-RPC to `~/.claude/mcp-debug.log`. Useful during plugin development.          |

**Plugin-specific variable substitution** (from Research #1):

- `${CLAUDE_PLUGIN_ROOT}` — absolute path to the installed plugin.
- `${CLAUDE_PLUGIN_DATA}` — persistent per-plugin data directory.
- `${user_config.KEY}` — user-configurable value declared in `plugin.json`'s `userConfig`; for secrets, stored in system keychain.
- `${ENV_VAR}` — any environment variable at runtime.

**Scope precedence**: managed > user > project > local. A project `.mcp.json` overrides user defaults for that project.

**Security surface**:

- Each MCP server subprocess runs at user privilege level.
- `userConfig` with `sensitive: true` stores secrets in system keychain (~2 KB shared with OAuth tokens — see Research #1).
- Tools from an MCP server must still pass session permission rules (`allow`/`ask`/`deny`).
- Third-party MCP servers ≈ supply-chain risk equivalent to plugins — trust the source.

_Sources:_
- [code.claude.com/docs/en/mcp](https://code.claude.com/docs/en/mcp) — accessed 2026-04-18
- [FastMCP — MCP JSON Configuration](https://gofastmcp.com/integrations/mcp-json-configuration) — accessed 2026-04-18
- [anthropics/claude-plugins-official — plugin-dev mcp-integration skill](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/plugin-dev/skills/mcp-integration/SKILL.md) — referenced 2026-04-18

### Token Cost Profile and Tool Search (The 2026 Game-Changer)

**Historical cost model (pre-January 2026)**:

- Each MCP server loaded all its tool definitions into every message's context window.
- 4-server typical setup: ~7,000 tokens overhead per turn.
- 5+-server heavy setup: **50,000+ tokens before the first user prompt**.
- Per-server examples: Playwright ~3,500 tokens, Gmail ~2,640 tokens (7 tools), SQLite ~400 tokens (6 tools).
- Domain research previously flagged "> 20k tokens of MCPs cripples Claude" — this was the pre-2026 reality.

**2026 change — MCP Tool Search (default enabled)**:

- Introduced in early 2026 and **enabled by default** in recent Claude Code versions.
- Only tool **names** load at session start — descriptions deferred.
- Claude uses an internal search tool to discover relevant tools on-demand.
- Only tools Claude actually uses enter context.
- Benchmark: 50+ MCP tools setup: ~77k → ~8.7k tokens. **85% reduction, 95% of context window preserved**.

**Configuration knobs (env var / `settings.json.env`)**:

- `ENABLE_TOOL_SEARCH=true` (default since 2026) — always on.
- `ENABLE_TOOL_SEARCH=auto` — load schemas upfront if they fit within 10% of context; defer overflow.
- `ENABLE_TOOL_SEARCH=auto:5` — custom threshold (5% instead of 10%).
- `ENABLE_TOOL_SEARCH=false` — disabled entirely.

**Critical constraint — model compatibility**:

- Requires **Sonnet 4+ or Opus 4+**.
- **Haiku models DO NOT SUPPORT tool search.**

**Implication for our plugin**: Haiku-backed subagents (specifically the Option-C hybrid `explore-codebase-wrapper` using native `Explore` on Haiku) **cannot benefit from MCP Tool Search**. If `explore-codebase-wrapper` is exposed to any MCP server, the full tool definitions load into its context every time. This is a major design constraint and aligns with our Track-3 decision to keep MCP out of MVP:

- `explore-codebase-wrapper` (Haiku) — no MCP servers attached.
- `research-web-wrapper` (Sonnet) — MCP Tool Search works; could attach MCP search servers.
- `adversarial-review-wrapper` (Sonnet or Opus) — MCP Tool Search works.

**Proxy caveat**: when `ANTHROPIC_BASE_URL` points to a non-Anthropic host, tool search is **disabled by default** because most proxies do not forward `tool_reference` blocks. Users on proxies must set `ENABLE_TOOL_SEARCH` explicitly.

_Sources:_
- [MCP Server Token Costs in Claude Code (jdhodges)](https://www.jdhodges.com/blog/claude-code-mcp-server-token-costs/) — accessed 2026-04-18
- [Claude Code MCP Tool Search: Save 95% Context (claudefa.st)](https://claudefa.st/blog/tools/mcp-extensions/mcp-tool-search) — accessed 2026-04-18
- [Tool search tool (Claude API Docs)](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool) — accessed 2026-04-18
- [Claude Code MCP Servers and Token Overhead (MindStudio)](https://www.mindstudio.ai/blog/claude-code-mcp-server-token-overhead) — accessed 2026-04-18

### MCP Server Catalog (April 2026, Production-Ready)

Servers relevant to our plugin's likely needs, ranked by maturity and fit.

**Web search** (candidates for `research-web-wrapper`):

| Server              | Maintainer        | Strengths                                                                  | Trade-offs                                          |
| :------------------ | :---------------- | :------------------------------------------------------------------------- | :-------------------------------------------------- |
| **Exa MCP**         | Exa Labs          | #1 in 2026 usage; 81% WebWalker benchmark; 50-75% token reduction via highlights; semantic + keyword + similarity search | Commercial API (paid tier); requires API key       |
| **Tavily MCP**      | Tavily            | Long-context retrieval; "research" mode does multi-step query planning     | 71% WebWalker; commercial API; paid tier            |
| **Brave Search MCP** | Community (official-adjacent) | Privacy-first; open API; lower cost                                   | Lower quality than Exa/Tavily for deep research     |
| **mcp-omnisearch**  | Community (spences10) | Unified interface over Tavily + Brave + Kagi + Exa + content extraction   | Extra abstraction layer; multi-key configuration    |

**Code / VCS**:

| Server              | Maintainer        | Notes                                                                       |
| :------------------ | :---------------- | :-------------------------------------------------------------------------- |
| **GitHub MCP**      | Official Anthropic + GitHub | "Second server most developers install after filesystem." PR review, issues, commits, PR creation. Already in Claude Code official marketplace (`github` plugin). |
| **GitLab MCP**      | Official          | GitLab equivalent.                                                           |
| **Git MCP**         | Official (`modelcontextprotocol/servers`) | Read-only introspection of local git history.                    |

**Filesystem / Persistence**:

| Server              | Maintainer        | Notes                                                                       |
| :------------------ | :---------------- | :-------------------------------------------------------------------------- |
| **Filesystem MCP**  | Official          | Wraps Read/Write with MCP interface. **Largely redundant with Claude Code native file tools — do not bundle.** |
| **Memory MCP**      | Official          | Persistent key-value store. Redundant with plugin's `memory/` directory and with subagent `memory:` field. **Do not bundle.** |
| **Postgres MCP / SQLite MCP** | Official | Database query/mutation. Only relevant if the consumer project uses SQL.    |

**External integrations** (Claude Code official marketplace ships these as their own plugins — reuse rather than re-bundle):

- `atlassian` (Jira/Confluence), `asana`, `linear`, `notion` — project management.
- `figma` — design.
- `vercel`, `firebase`, `supabase` — infra.
- `slack` — comms.
- `sentry` — monitoring.

**Rationale for catalog curation**: of the ~17,000 servers in the ecosystem, only a handful are directly relevant to a generic workflow plugin. Our plugin should NOT bundle MCP servers that duplicate host primitives (Filesystem, Memory) or that are already first-party Claude plugins (GitHub, Slack, etc.). The workflow plugin is orthogonal; users install those plugins independently.

_Sources:_
- [15 Best MCP Servers 2026 (Taskade)](https://www.taskade.com/blog/mcp-servers) — accessed 2026-04-18
- [The Best MCP Servers 2026 (Developers Digest)](https://www.developersdigest.tech/blog/mcp-servers-directory-2026) — accessed 2026-04-18
- [Best Search MCP Servers 2026 (ChatForest)](https://chatforest.com/guides/best-search-mcp-servers/) — accessed 2026-04-18
- [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) — official reference servers, accessed 2026-04-18
- [spences10/mcp-omnisearch](https://github.com/spences10/mcp-omnisearch) — referenced 2026-04-18

### Technology Adoption Trends

- **MCP is the converged standard**. No competing tool-integration protocol has material adoption in 2026.
- **MCP Tool Search has made the cost critique obsolete** for Sonnet/Opus models. The "20k token MCP budget ceiling" from the prior domain research is a pre-2026 constraint. Today: unlimited servers, minimal overhead.
- **Haiku models remain cost-sensitive to MCP**. Our Haiku-backed subagents should avoid MCP attachment.
- **Server quality is uneven**. Top 500 servers are production-grade; the long tail is uneven. Treat MCP server installation with the same supply-chain discipline as plugins.
- **Cross-host portability is real**. A server that works in Claude Code works in Cursor, VSCode, Gemini CLI with minimal changes — validates MCP as a host-neutral investment.
- **Privacy-first alternatives are mature**. Brave, self-hosted Postgres/SQLite. Useful for consumer projects with compliance constraints.

_Source: cross-reference of sources cited in this section._
