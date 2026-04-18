---
stepsCompleted: [1, 2, 3, 4, 5, 6]
workflowCompleted: true
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

- **MCP is the converged cross-host standard** since the Linux Foundation donation (Dec 2025). 17,468 servers indexed; 97M monthly SDK downloads.
- **MCP Tool Search (default enabled, early 2026) is a game-changer** — 85% context reduction on tool listings. Makes the pre-2026 "20k MCP budget ceiling" obsolete. **BUT Haiku models do not support it.**
- **Our plugin bundles zero MCP servers in MVP.** Host-native marketplace already ships the most-common integrations (GitHub, Slack, etc.) as first-party plugins — re-bundling duplicates.
- **`research-web-wrapper` uses native `WebSearch`/`WebFetch` in MVP** (Option A); opt-in MCP via `.workflow.yaml` in v1.5+ with graceful fallback.
- **Haiku quarantine rule**: our Haiku-backed `explore-codebase-wrapper` must never have MCP servers attached (full-load explosion).
- **MCP sits under the subagent layer** in our composition model; never above it, never used for skill↔skill composition.

Pointer to the full synthesis: the [Research Synthesis and Conclusion](#research-synthesis-and-conclusion) section consolidates cross-sectional insights, strategic impact, and next-step recommendations in a single place.

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

---

## Integration Patterns Analysis

> **Domain-adapted interpretation**: for MCP, "integration patterns" covers (1) the lifecycle of an MCP server within a Claude Code session, (2) the tool-invocation protocol from Claude (or subagent) to server, (3) Tool Search discovery flow, (4) authentication patterns (API keys, OAuth), (5) cross-plugin interaction when multiple plugins declare servers, and (6) error handling. Generic API categories (REST/GraphQL/gRPC) are subsumed — MCP itself is an RPC protocol, it does not compete with them, it wraps them.

### Lifecycle Protocol (Server Start / Stop)

**Startup flow** (stdio server):

1. Claude Code parses `.mcp.json` / inline `mcpServers` at session start.
2. For each enabled server, spawns the subprocess via `command` + `args`, sets `env`.
3. Subprocess handshakes via JSON-RPC on stdin/stdout, declaring its tools and capabilities.
4. Claude Code caches the tool list. **Under Tool Search (default)**: only tool names enter the session context.
5. When Claude (or a subagent) invokes a tool, Claude Code routes the request to the corresponding subprocess.

**Startup flow** (HTTP server):

1. Claude Code reads `url` + `headers` from config.
2. On first tool call, opens HTTP/Streamable HTTP connection to the server.
3. Server responds with tool declarations.
4. Same Tool Search behavior applies.

**Shutdown**:

- Session end → stdio subprocesses terminated (SIGTERM), HTTP connections closed.
- `/plugin disable` → server stopped mid-session (tools become unavailable).
- Plugin uninstall → server config removed from the scope's settings.

**Health monitoring**:

- `debug: true` logs to `~/.claude/mcp-debug.log` — includes startup handshake, tool calls, errors.
- `claude --debug` surfaces MCP initialization in the main debug output.
- `/plugin` Errors tab shows per-server load errors (missing binary, invalid config).

_Source: [code.claude.com/docs/en/mcp](https://code.claude.com/docs/en/mcp) — accessed 2026-04-18._

### Tool-Invocation Protocol

**From Claude's perspective**:

1. Claude decides a tool is needed based on the task.
2. Under Tool Search (Sonnet/Opus): Claude first searches the tool registry by name/keyword; the matching tool's full description is then loaded.
3. Claude constructs the tool-call payload (arguments) and emits a tool-use block.
4. Claude Code routes the call to the MCP server.
5. Server executes and returns the result via JSON-RPC.
6. Result enters Claude's context as a tool-result block.

**From a subagent's perspective**:

- Same protocol, but the subagent has its own tool allowlist declared in frontmatter (`tools:`).
- MCP tools appear under a namespace like `mcp__<server-name>__<tool-name>`.
- Subagent's `tools:` allowlist can target specific MCP tools: `tools: "mcp__github__create_pull_request mcp__github__list_issues"`.

**From `allowed-tools` in a skill**:

- Same pattern: `allowed-tools: mcp__exa__web_search` pre-approves the specific MCP tool for the skill's duration.

**Permission evaluation** (from Research #1):

- Every tool call — MCP or native — goes through the three-tier deny > ask > allow evaluation.
- MCP servers do NOT bypass permission rules; tool-level allow/deny is the control surface.
- `PreToolUse(mcp__<server>__<tool>)` hooks can intercept and validate arguments.

_Source: [Configure permissions](https://code.claude.com/docs/en/permissions) + MCP integration reference — accessed 2026-04-18._

### Tool Search Discovery Flow

Default behavior under MCP Tool Search (Sonnet/Opus):

1. **Session start**: Claude Code loads only tool **names** (e.g., `mcp__exa__web_search`, `mcp__github__create_pull_request`) — not full descriptions.
2. **First user prompt**: Claude sees only the tool names and the `ToolSearch` meta-tool.
3. **Claude invokes `ToolSearch`** (internally, without surfacing it as a user-visible turn) with a keyword query describing its need.
4. `ToolSearch` returns matching tool full descriptions (input schemas, examples).
5. Claude constructs the real tool call with those descriptions.

**Trade-offs**:

- **Pro**: 85% context reduction. Unlimited MCP servers remain usable.
- **Pro**: Cold-start latency minimal (names load quickly).
- **Con**: One extra turn per tool selection (the `ToolSearch` invocation adds an API round-trip).
- **Con**: If Claude's `ToolSearch` query misses the relevant tool, the tool never fires — this is the main failure mode. Mitigation: write tool descriptions with searchable keywords.
- **Con**: Haiku models can't participate — revert to full-load behavior.

**For our plugin**: MCP Tool Search is the default; we don't configure it per-plugin. We benefit automatically on Sonnet/Opus subagents. We avoid MCP on Haiku subagents (confirmed in step-02).

_Source: [claudefa.st MCP Tool Search guide](https://claudefa.st/blog/tools/mcp-extensions/mcp-tool-search) — accessed 2026-04-18._

### Authentication Patterns

Four auth patterns observed in the ecosystem.

**Pattern 1 — Environment variable via `userConfig`** (recommended for most cases).

```json
{
  "userConfig": {
    "exa_api_key": { "description": "Exa API key", "sensitive": true }
  },
  "mcpServers": {
    "exa": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "exa-mcp-server"],
      "env": { "EXA_API_KEY": "${user_config.exa_api_key}" }
    }
  }
}
```

- User prompted at enable time. Value stored in system keychain (for `sensitive: true`).
- Plugin never sees the raw secret.

**Pattern 2 — System environment variable** (for CI / managed environments).

```json
{
  "mcpServers": {
    "github": {
      "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }
    }
  }
}
```

- Expects `GITHUB_TOKEN` in the shell environment. Useful for CI, pre-seeded environments, or users who already manage GitHub tokens elsewhere.

**Pattern 3 — HTTP bearer token** (for remote servers).

```json
{
  "mcpServers": {
    "remote-api": {
      "type": "http",
      "url": "https://api.example.com/mcp",
      "headers": { "Authorization": "Bearer ${user_config.api_token}" }
    }
  }
}
```

**Pattern 4 — OAuth (emerging)**.

- Some remote MCP servers support OAuth flows. Not yet universal; varies by server implementation.
- Claude Code handles OAuth tokens via its existing credential-helper stack.

**Our plugin's auth stance**: bundle zero MCP servers in MVP → no auth surface. If consumers opt in via `.workflow.yaml` (v1.5+), document Pattern 1 in the spec (`userConfig` with `sensitive: true`).

_Source: Research #1 `userConfig` + MCP docs + Anthropic plugins-official examples — accessed 2026-04-18._

### Cross-Plugin Interaction and Server Collision

When multiple plugins declare MCP servers:

- Servers are namespaced by **server name in the manifest**, not by plugin. Two plugins declaring `mcpServers: { "github": {...} }` collide — last-loaded wins silently (bug-prone).
- Mitigation: every plugin should prefix its MCP servers with its plugin name, e.g., `"mcpServers": { "<plugin-name>-github": {...} }`.
- User scope precedence applies: project `.mcp.json` overrides user-level MCP config with the same server name.

**Tool namespace**:

- Tools are namespaced as `mcp__<server-name>__<tool-name>`. A tool called `list_issues` from the `github` server is `mcp__github__list_issues`.
- Hook matchers and permission rules target the full namespaced name.

**For our plugin**: zero MCP bundled → no collision risk. v1.5+ if we add, use `workflow-<name>-<server>` prefixes.

### Error Handling

Five failure modes, distinct responses.

**Failure 1 — Server subprocess fails to start**.

- Symptom: missing `command` binary, bad `env` var, exec permission denied.
- Claude Code behavior: surfaces error in `/plugin` Errors tab; session continues without the server's tools.
- Mitigation: README documents prerequisites per MCP server. Plugin developer tests `claude --plugin-dir ./` with representative environments.

**Failure 2 — Server handshake timeout**.

- Symptom: subprocess starts but doesn't respond to JSON-RPC handshake in expected window.
- Claude Code behavior: marks server unavailable.
- Mitigation: `debug: true` logs reveal hang. Server-specific issue; report upstream.

**Failure 3 — Tool call fails at runtime**.

- Symptom: tool returns an error response via JSON-RPC.
- Claude Code behavior: error surfaces in conversation as a tool-result with `is_error: true`.
- Claude handles: retries, asks user, or abandons the approach. Same as any failing tool.

**Failure 4 — Tool Search miss**.

- Symptom: relevant MCP tool exists but Claude's search query doesn't match its description.
- Claude Code behavior: tool is never invoked; Claude proceeds without it (or asks the user).
- Mitigation: server authors should write searchable descriptions. Consumers can disable Tool Search via `ENABLE_TOOL_SEARCH=false` if a specific tool is needed.

**Failure 5 — Haiku + MCP tool-listing explosion**.

- Symptom: Haiku subagent with MCP servers attached loads all tool definitions upfront (no Tool Search support).
- Result: context wasted on tool descriptions.
- Mitigation: don't attach MCP servers to Haiku subagents. Enforce this at plugin design time.

_Source: [code.claude.com/docs/en/mcp — debugging section](https://code.claude.com/docs/en/mcp), community issues — accessed 2026-04-18._

---

## Architectural Patterns and Design

> **Domain-adapted interpretation**: for MCP, "architectural patterns" covers the substrate boundary (agent↔tool YES, skill↔skill NO), bundling policy (zero in MVP, opt-in v1.5+), the Haiku exclusion rule, integration with our Advisor + Reactive Porcelain × Delegated Plumbing composition, security architecture, and the key decision: `research-web-wrapper` MCP vs native.

### System-Level Patterns

**Pattern 1 — MCP is for agent↔tool, not skill↔skill** (confirmed from Research #1).

This was stated as a design rule in Research #1 and is reinforced by every source surveyed. MCP wraps external capabilities (GitHub, Exa, filesystem, databases) behind a JSON-RPC interface so Claude can call them. Skill-to-skill composition happens via **typed artifacts** (Research #2), not via MCP. Two reasons:

- MCP has measurable token overhead (pre-Tool Search) and implementation overhead (server subprocess, handshake, JSON-RPC).
- Skill composition should be host-agnostic — a third-party skill must be able to compose with ours without spinning up an MCP server.

**Pattern 2 — Bundle nothing, opt-in everything** (plugin-stance).

Our MVP ships **zero MCP servers**. Users who want MCP servers add them via `.workflow.yaml` or `.mcp.json` at the consumer project level. Two reasons:

- Claude Code's official marketplace already ships MCP-wrapped plugins for the most common integrations (GitHub, Slack, etc.). Re-bundling them duplicates the ecosystem.
- Bundling MCP creates a hard dependency on external APIs (keys, quotas, outages) — our workflow plugin should work offline, on any codebase, with no signup.

**Pattern 3 — Haiku exclusion rule** (derived from Tool Search model-compatibility constraint).

Haiku-backed subagents (`explore-codebase-wrapper` uses native `Explore` on Haiku) **must not have MCP servers attached**. Haiku does not support Tool Search, so every MCP tool's full description loads into its context — defeating the cost efficiency that made Haiku attractive in the first place. Design implication:

- Workflow skills that dispatch to Haiku subagents never declare MCP tools in `allowed-tools`.
- Skills that might want MCP must target Sonnet/Opus subagents.

**Pattern 4 — Server name prefix discipline** (collision prevention).

If we ever bundle MCP servers, prefix with `workflow-<name>-` to avoid cross-plugin silent collisions (observed in step-03). This is cheap insurance.

_Source: synthesized from Research #1 (substrate boundary), step-02/03 (cost constraints), cross-plugin collision analysis._

### Design Principles for MCP Usage in the Plugin

**Principle 1 — No bundled MCP servers in MVP.** Spec says so. Code says so. Tests confirm so.

**Principle 2 — Opt-in via consumer config (v1.5+).**

Consumer projects can opt in by either:

- Adding entries to their own `.mcp.json` at repo root (host-native mechanism). Our plugin reads nothing here; it inherits whatever the host loads.
- Declaring in `.workflow.yaml`:
  ```yaml
  mcp:
    research-web:
      server: exa
      api_key_env: EXA_API_KEY
  ```
  Our `research-web-wrapper` checks this config; if declared, routes to the MCP server; else uses native WebSearch. This is the **graceful fallback pattern**.

**Principle 3 — Document, don't automate.**

The plugin's README includes a "Recommended MCP integrations" section listing the 3-4 servers that work well with each plumbing skill (Exa for research-web, Memory optional for long-lived agents, etc.). Instructions show users how to add them to their own `.mcp.json`. No plugin-auto-install.

**Principle 4 — Assume Tool Search on.**

By 2026 default, Tool Search is enabled. Our plugin does not configure `ENABLE_TOOL_SEARCH`. If a user runs in an environment where Tool Search is disabled (proxy, Haiku model), they see the pre-2026 cost profile — that's on them, documented in the README.

**Principle 5 — Plugin-shipped agents are restricted from declaring `mcpServers`** (from Research #1).

Confirmed again here. Plugin-shipped custom subagents (our `adversarial-review-wrapper`) can use MCP tools **only if** the MCP servers are declared at the plugin root (`.mcp.json` or inline `mcpServers` in `plugin.json`), NOT in the agent's own frontmatter. This is a security feature.

### Scalability and Cost Patterns

**Pattern 1 — Tool Search as Free Cost Reduction**.

Tool Search is on by default and requires no plugin configuration on Sonnet/Opus. Our Sonnet/Opus subagents automatically benefit from 85% context reduction on MCP tool listings. No code required.

**Pattern 2 — Haiku Quarantine**.

Our Haiku-backed plumbing (native `Explore` via `context: fork`) sits in a zone where MCP is too expensive. Keep MCP tool requirements out of those skills. Explicitly document this constraint in the skill body ("This skill uses native Explore — do not add MCP tool requirements").

**Pattern 3 — Tool-Listing Budget Ceiling (as a fallback)**.

For users who run Tool Search disabled (proxies, Haiku-only setups), document a ceiling: **no more than 3-4 MCP servers recommended**. Above that, context pollution dominates.

**Pattern 4 — Per-Server Cost Discipline**.

When we document recommended integrations in the README, include per-server token costs from step-02 (Playwright ~3.5k, Gmail ~2.6k, SQLite ~400). Gives consumers a transparent baseline.

### Composition & Orchestration — MCP's Place in Our Model

Research #1 introduced Advisor + Reactive Porcelain. Research #3 extended with Delegated Plumbing. MCP sits as a **capability substrate** under the subagent layer:

```
                   ┌──────────────┐
                   │  state-manager│  (advisor)
                   └──────┬───────┘
                          ↓ recommends
                   ┌──────────────┐
                   │  /<command>  │  (porcelain)
                   └──────┬───────┘
                          ↓ may dispatch
                   ┌──────────────┐
                   │  plumbing    │  (skill composes)
                   └──────┬───────┘
                          ↓ context: fork
                   ┌──────────────┐
                   │  subagent    │  (isolated context)
                   └──────┬───────┘
                          ↓ (may call MCP if Sonnet/Opus)
          ┌──────────────────────────────┐
          │  MCP server subprocess        │  (filesystem, GitHub, Exa, etc.)
          └──────────────────────────────┘
```

**Boundary rule**: MCP is reached only by subagents (or by the parent directly). Skills never speak MCP; they speak to subagents which may speak MCP. This preserves the host-agnostic nature of skill composition.

**Integration per subagent**:

- `explore-codebase-wrapper` (Haiku via `Explore`) — NO MCP.
- `research-web-wrapper` (Sonnet via `general-purpose`) — MCP opt-in via `.workflow.yaml` (v1.5+).
- `adversarial-review-wrapper` (Sonnet/Opus custom) — could use MCP servers declared at plugin root (e.g., a code-quality server). v1.5+ territory.

_Source: composition synthesis across Research #1–#4._

### Security Architecture (MCP-Specific)

**Supply-chain trust**:

- MCP servers run at user privileges. Same trust level as plugins.
- Anthropic-authored servers (Filesystem, Git, Postgres, SQLite, GitHub, Brave, Memory) are the "trusted" tier — `modelcontextprotocol/servers` repo, first-party.
- Third-party servers (Exa, Tavily, community contributions) — vet before use.
- Our plugin documents: "Recommended servers are known; others are consumer's choice."

**API key / secret handling**:

- Pattern 1 from step-03 (`userConfig` + system keychain) is the recommended secure default.
- Never ship API keys in fixture files.
- CI that runs integration tests with live MCP servers must use GitHub Secrets (or equivalent).

**Network surface**:

- HTTP MCP servers are outbound connections. Respect the consumer's firewall / proxy settings. `ANTHROPIC_BASE_URL` proxy users need `ENABLE_TOOL_SEARCH` explicit (step-02).
- Self-hosted MCP servers (localhost stdio) have zero network surface beyond what the server binary itself does.

**Hook-level control**:

- `PreToolUse` on `mcp__<server>__*` patterns allows enterprise users to intercept/validate MCP tool calls. Document this in the README as a safety pattern.

**Principle**: our plugin ships no security-critical MCP by default, so the security architecture at the plugin layer is minimal. When consumers opt in, the security discipline inherits from Research #1's supply-chain section.

_Source: Research #1 security architecture + MCP-specific analysis in this track._

### Data Architecture

**Where MCP does NOT fit**:

- **Persistent memory**: the official Memory MCP server duplicates our `memory/` two-tier architecture (Research #2) and subagent `memory:` field (Research #3). Recommendation: do NOT use Memory MCP. Our layer is richer and under user control.
- **Filesystem ops**: Claude Code's native Read/Write/Edit cover this. Filesystem MCP is redundant.
- **Git ops**: Claude Code's native Bash + git commands cover this. Git MCP is useful for read-only introspection if the agent should not be able to write — edge case, not our MVP.

**Where MCP DOES fit** (for consumer opt-in):

- External APIs with no native tool equivalent: Exa for web search, Linear/Jira for project management, Sentry for error telemetry, Postgres for live DB queries.
- Wrapping domain-specific services (Kubernetes, Terraform, cloud providers).

_Source: architectural analysis based on step-02 catalog + native Claude Code capabilities._

### The Decision: `research-web-wrapper` Native vs MCP

Four concrete options, one recommended.

**Option A — Native `WebSearch`/`WebFetch` via general-purpose subagent** (current pin from Research #3).

- Skill declares `context: fork` + `agent: general-purpose`.
- Subagent uses native `WebSearch` and `WebFetch` tools.
- Zero MCP surface. Zero API key. Zero consumer setup.
- Quality: Claude's native `WebSearch` is competent. Published benchmarks do not cover it directly.
- Cost: 15-25k tokens per invocation (Shape B write-to-file keeps parent off budget).

**Option B — MCP-based Exa server bundled**.

- Plugin declares `mcpServers: { "workflow-exa": { ... } }` in `plugin.json`.
- Requires consumer to provision an Exa API key via `userConfig`.
- Quality: 81% WebWalker benchmark (vs 71% Tavily, undocumented for native WebSearch). 50-75% token reduction via query-dependent highlights.
- Cost: bundled server = plugin forces the dependency. Users without Exa subscription get a broken plugin.

**Option C — MCP-based Exa, opt-in via `.workflow.yaml`** (v1.5+ recommendation).

- Plugin does NOT bundle the Exa server. README documents how consumers add it.
- `research-web-wrapper` skill body checks `.workflow.yaml` for `mcp.research-web.server`; if present, routes to the MCP tool; else uses native WebSearch (graceful fallback).
- Quality: configurable per consumer. Default = native.
- Cost: MVP = zero dependency. v1.5+ = consumer choice.

**Option D — Multi-server unified wrapper** (e.g., `mcp-omnisearch`, v2+).

- Declare multiple alternatives (Exa, Tavily, Brave, Kagi); route by preference.
- More complex config; more useful for advanced users.

**Decision**: **Option A for MVP, Option C for v1.5+.**

Rationale:

1. **MVP = Option A**: zero dependency, works on any consumer install, matches our "bundle nothing" principle.
2. **v1.5+ = Option C**: consumers who want higher-quality research pay the setup cost themselves; plugin gracefully falls back for consumers who don't opt in.
3. **Option B rejected**: forcing a dependency contradicts Principle 2 (bundle nothing).
4. **Option D deferred**: interesting for v2+ if Option C gains adoption.

**Summary table** (updated):

| Plumbing subagent            | Option  | Backing model           | MCP?                              |
| :--------------------------- | :------ | :---------------------- | :-------------------------------- |
| `explore-codebase-wrapper`   | C (Research #3) | native `Explore` (Haiku) | NO (Haiku quarantine)            |
| `research-web-wrapper`       | C (Research #3 hybrid) → A (this track, MVP) → C (v1.5+ opt-in) | native `general-purpose` (Sonnet) | MVP: NO. v1.5+: opt-in via `.workflow.yaml` |
| `adversarial-review-wrapper` | B (Research #3 custom) | Sonnet or Opus | MVP: NO. v1.5+: optional code-quality MCP if demand emerges |

**Impact on `.workflow.yaml` schema**: add an optional `mcp` section for v1.5+ config. MVP schema does not need it — document as a v1.5+ extension in `spec/workflow-yaml.schema.json`.

_Source: arbitrage synthesized from Research #1–#4 findings + step-02 Exa benchmark data._

---

## Implementation Approaches and Technology Adoption

> **Domain-adapted interpretation**: this section covers the practical side — what to write in MVP (almost nothing), what to document (the opt-in path), what to test (graceful fallback), and what risks to monitor. Generic categories adapted to a "bundle-nothing" stance.

### Adoption Strategy

**MVP (Day 1–7)**:

- Zero MCP servers bundled.
- `research-web-wrapper` uses native `WebSearch`/`WebFetch` (Option A, Research #3 pin reaffirmed).
- No `.workflow.yaml` MCP section in MVP schema.
- README includes a brief "MCP integrations (advanced)" section documenting how consumers add Exa, GitHub, or other servers to their own `.mcp.json`.

**v1.5+**:

- Add optional `mcp` section to `.workflow.yaml` schema (`schema_version` bump `0.1.x → 0.2.x`).
- Update `research-web-wrapper` to check `.workflow.yaml` for opt-in MCP server; graceful fallback to native.
- Document the opt-in pattern in `spec/workflow-yaml.schema.md`.

**v2+**:

- Evaluate `mcp-omnisearch` or multi-server router pattern (Option D).
- Consider a `/init-workflow-mcp` command that scaffolds `.mcp.json` with recommended entries.

### Development Workflows

**For MVP**: no MCP-specific workflow. The plugin does not touch `.mcp.json`, does not ship servers, does not run their subprocesses.

**For v1.5+ opt-in implementation**:

1. Update `schemas/workflow-yaml.schema.json` with the optional `mcp` section. Bump `schema_version`.
2. In `research-web-wrapper` skill body, add a preprocessing check: `` !`cat .workflow.yaml | yq '.mcp.research-web.server // ""'` ``. Result becomes a substitution in the prompt.
3. Subagent prompt branches on the result: "If MCP server `X` is configured, use `mcp__X__search`; else use native `WebSearch`."
4. Example `.mcp.json` snippets included in `examples/mcp/` for Exa, Brave, mcp-omnisearch.

**Testing locally**:

- Consumer workflow: `claude plugin marketplace add ./`, `claude plugin install workflow-<name>@local`, plus the user's own `.mcp.json` with their preferred server, plus their own API key env var. Test end-to-end.

### Testing and Quality Assurance

**Tier 1 — Static validation** (MVP + v1.5+):

- `claude plugin validate` ensures no unexpected `mcpServers` in our `plugin.json`. A non-empty `mcpServers` is a PR-blocker for MVP.

**Tier 2 — Fallback contract** (v1.5+):

- Run `research-web-wrapper` with no `.workflow.yaml` → must use native WebSearch, produce Shape B artifact.
- Run with `.workflow.yaml` declaring `mcp.research-web.server: exa` + valid Exa key → must route to MCP, produce Shape B artifact.
- Run with `.workflow.yaml` declaring Exa but missing API key → must log warning and fall back to native (graceful).
- Each case produces a valid memory artifact; parent budget unchanged.

**Tier 3 — Server catalogue integration** (v1.5+):

- Exa, Brave, Tavily documented in README with per-server notes on auth, cost, quality trade-offs.
- Each recommended server has a copy-paste `.mcp.json` fixture in `examples/mcp/<server>.mcp.json`.

**Tier 4 — Haiku isolation check** (MVP):

- Lint rule / CI check: any skill that dispatches to a Haiku subagent (`agent: Explore` or custom Haiku-backed) must not declare `mcp__*` in `allowed-tools`. Violation = hard fail.

### Deployment and Operations

**Release process**:

- Same as plugin release (Research #1). No MCP-specific steps for MVP.
- v1.5+ adds a schema-version bump + spec update when the `mcp` section lands.

**Monitoring**:

- Community feedback: track whether consumers actually opt in to MCP. Low adoption → feature is overbuilt, consider simplifying. High adoption → justify Option D (multi-server) in v2+.
- `claude --debug` logs + `~/.claude/mcp-debug.log` remain the consumer-side debugging path.

**Documentation delivery**:

- README "MCP integrations" section in MVP (3-4 paragraphs, recommended servers).
- `spec/workflow-yaml.schema.md` section in v1.5+ with full `mcp` config reference.

### Team Organization and Skills

**MVP**: zero MCP knowledge required of the author beyond "don't attach MCP to Haiku."

**v1.5+**:

- Author must understand MCP configuration (`.mcp.json` schema, auth patterns).
- `CODEOWNERS`: add `spec/workflow-yaml.schema.*` to the spec-protected paths. Schema changes need author approval.
- Contributor guidelines: new MCP integration recommendations require a test fixture in `examples/mcp/` + README update.

### Cost Optimization and Resource Management

**MVP**:

| Axis                                    | Cost                                    |
| :-------------------------------------- | :-------------------------------------- |
| MCP bundled servers                     | 0                                       |
| MCP-related code in plugin              | 0 lines                                 |
| MCP-related tokens in session           | Whatever the consumer's own `.mcp.json` costs (not our concern) |

**v1.5+**:

| Axis                                    | Cost                                    |
| :-------------------------------------- | :-------------------------------------- |
| MCP opt-in dispatch check               | ~50 tokens per `research-web-wrapper` invocation (one yq read) |
| MCP servers consumer opts into (e.g., Exa) | Under Tool Search: 100-300 tokens to register tool names; on-demand descriptions |

Tool Search makes per-server cost a rounding error for consumers. Our plugin's contribution is minimal.

### Risk Assessment and Mitigation

Priority-ranked:

**Risk 1 — Haiku + MCP token explosion** (high if consumers misconfigure; medium-impact if they do).

Mitigation: README bold-flag "Do NOT attach MCP servers to skills dispatching to Haiku subagents." CI lint if we detect this in plugin-internal code.

**Risk 2 — Tool Search query miss** (medium; impact: user sees "Claude didn't use the tool I expected").

Mitigation: not a plugin-layer problem. Surface the issue upstream to the specific MCP server author when seen.

**Risk 3 — API key leakage in fixtures** (medium; impact: credential theft).

Mitigation: `examples/mcp/` fixtures use `${API_KEY}` placeholders. CI lint: grep for API key patterns in committed files, hard fail if matched.

**Risk 4 — Server name collision across plugins** (low; impact: last-loaded-wins silent bug).

Mitigation: v1.5+ when we ship example fixtures, prefix server names (`workflow-<name>-exa`). Document the collision risk in the README.

**Risk 5 — Consumer adopts many servers, disables Tool Search** (low; impact: own-goal).

Mitigation: README section "If you disable Tool Search" with per-server cost table. Let consumers make informed choices.

**Risk 6 — MCP spec version drift** (low; impact: our documented patterns break).

Mitigation: annual (or per-release) spec review; update README.

### Recommendations — Roadmap

**Day 1–7 (MVP)**: nothing MCP-related in the plugin code. README "MCP integrations" section with 3-4 recommended servers. Linter rule against MCP on Haiku subagents.

**Week 2–3 (v1.1)**: collect community feedback on whether MCP opt-in is desired. Decide v1.5 scope.

**Month 2+ (v1.5)**: opt-in `mcp` section in `.workflow.yaml`, `research-web-wrapper` fallback logic, documented recommended servers.

**Month 3+ (v2)**: evaluate multi-server router (Option D), `/init-workflow-mcp` scaffolder if adoption warrants.

### Success Metrics and KPIs

**MVP**:

- Zero MCP-related CI failures (binary).
- Zero reported "plugin doesn't work because I don't have an API key" issues (the bundle-nothing stance makes this structural).

**v1.5+ (if shipped)**:

- ≥ 3 recommended server fixtures in `examples/mcp/` with matching docs.
- Tier 2 fallback tests passing on every release.
- At least one consumer report of opt-in success (qualitative signal).

_Source: synthesized across Research #1–#4 findings + Tool Search analysis._

---

## Executive Summary

MCP's trajectory through 2025-2026 is one of the clearer convergence stories in agent tooling. Donated to the Linux Foundation's Agentic AI Foundation in December 2025 with co-backing from Anthropic, Block, OpenAI, Google, Microsoft, AWS, Cloudflare, and Bloomberg; 17,468 servers indexed in Q1 2026; 97 million monthly SDK downloads by March 2026; cross-host adoption across every major AI dev tool. MCP is the substrate, not the competition.

This research found that two developments reshape the plugin-layer calculus. First, **MCP Tool Search** (default-enabled in early 2026) deferred tool definitions until Claude needs them — 85% context reduction on typical 50-tool setups, rendering obsolete the pre-2026 "20k MCP budget ceiling" captured in the prior domain research. Second, **Tool Search does not support Haiku**; Sonnet 4+ or Opus 4+ is required. This asymmetry constrains how our plumbing subagents can use MCP: `research-web-wrapper` (Sonnet) and `adversarial-review-wrapper` (Sonnet/Opus) can attach MCP freely; `explore-codebase-wrapper` (Haiku via native `Explore`) must be MCP-free.

The resolved design stance is **bundle nothing, opt-in everything**. Our MVP ships zero MCP servers — Claude Code's official marketplace already distributes the common ones (GitHub, Slack, Atlassian, etc.) as first-party plugins, and our workflow plugin stays orthogonal to domain-specific integrations. `research-web-wrapper` uses native `WebSearch`/`WebFetch` in MVP; an optional `mcp` section in `.workflow.yaml` lands in v1.5+ to let consumers opt into Exa or Tavily for higher-quality research while the plugin gracefully falls back to native when not configured.

**Key Technical Findings:**

- **MCP Tool Search (default 2026)** ≈ 85% context reduction on Sonnet/Opus; no effect on Haiku.
- **17,468 servers** in the ecosystem, but we bundle zero. Consumers opt in per project.
- **Exa leads web-search quality** (81% WebWalker vs 71% Tavily); relevant v1.5+ recommendation.
- **MCP does not replace** our two-tier memory (Research #2) or our subagent `memory:` field (Research #3). Official Memory MCP is redundant.
- **Plugin-shipped agents cannot declare `mcpServers` in their own frontmatter** — servers must be at plugin root. Security feature, not bug.
- **Cross-plugin server-name collisions** are silent; future bundling uses `workflow-<name>-<server>` prefix.

**Strategic Technical Recommendations (top 5):**

1. **Do not bundle MCP servers in MVP.** Ship a "MCP integrations (advanced)" README section instead.
2. **Enforce Haiku quarantine as a CI lint**: skills dispatching to Haiku subagents must not declare MCP tools in `allowed-tools`.
3. **Rely on Tool Search default behavior**; document the fallback behavior for consumers on proxies or Haiku setups.
4. **For v1.5+**: add `mcp` section to `.workflow.yaml` with graceful fallback. First target server: Exa.
5. **Trust the host for common integrations**. GitHub, Slack, Atlassian, Linear, Sentry are first-party plugins — do not duplicate. Point users to them.

---

## Table of Contents

1. [Research Overview](#research-overview)
2. [Technical Research Scope Confirmation](#technical-research-scope-confirmation)
3. [Technology Stack Analysis](#technology-stack-analysis)
   - MCP Standard Status (April 2026)
   - MCP Configuration in Claude Code (`.mcp.json` Schema)
   - Token Cost Profile and Tool Search (The 2026 Game-Changer)
   - MCP Server Catalog (April 2026, Production-Ready)
   - Technology Adoption Trends
4. [Integration Patterns Analysis](#integration-patterns-analysis)
   - Lifecycle Protocol (Server Start / Stop)
   - Tool-Invocation Protocol
   - Tool Search Discovery Flow
   - Authentication Patterns
   - Cross-Plugin Interaction and Server Collision
   - Error Handling
5. [Architectural Patterns and Design](#architectural-patterns-and-design)
   - System-Level Patterns
   - Design Principles for MCP Usage in the Plugin
   - Scalability and Cost Patterns
   - Composition & Orchestration — MCP's Place in Our Model
   - Security Architecture (MCP-Specific)
   - Data Architecture
   - The Decision: `research-web-wrapper` Native vs MCP
6. [Implementation Approaches and Technology Adoption](#implementation-approaches-and-technology-adoption)
   - Adoption Strategy
   - Development Workflows
   - Testing and Quality Assurance
   - Deployment and Operations
   - Team Organization and Skills
   - Cost Optimization and Resource Management
   - Risk Assessment and Mitigation
   - Recommendations — Roadmap
   - Success Metrics and KPIs
7. [Research Synthesis and Conclusion](#research-synthesis-and-conclusion)
   - Cross-Sectional Insights
   - Strategic Impact Assessment
   - Next Steps
   - Research Limitations
   - Research Completion Metadata

---

## Research Synthesis and Conclusion

### Cross-Sectional Insights

1. **The 2026 MCP reality invalidates the 2025 conventional wisdom.** "20k MCP tokens cripples Claude" — documented in our prior domain research — is pre-Tool-Search. Today, the same 50-tool setup that would have consumed 50k+ tokens now consumes ~8.7k. The cost critique is obsolete for Sonnet/Opus. The critique survives for Haiku, which is why our architecture treats Haiku subagents as a quarantine zone.

2. **The bundle-nothing stance is less conservative than it looks.** It sounds like we are ducking complexity, but in practice it is the most-capable choice: our plugin works on any consumer install, with no external API keys, no rate limits, no quota surprises. Meanwhile, consumers who want heavier-weight research can enable MCP themselves in their own `.mcp.json`. We get both worlds.

3. **The official Claude Code marketplace is the right home for common MCP integrations.** GitHub, Slack, Atlassian, Linear, Sentry — all already available as first-party plugins. Duplicating them in our plugin would be a disservice to users. Point them to the official plugins and focus our workflow plugin on orthogonal concerns.

4. **`research-web-wrapper` is the only real decision this track resolved.** Everything else (Haiku quarantine, bundle-nothing, name prefixing, layer placement) is either defensive or confirmatory. The live choice was Option A vs C vs B vs D; Option A in MVP, C in v1.5+ as graceful opt-in.

5. **Tool Search is a free win we didn't have to design for.** It is a host feature that benefits Sonnet/Opus subagents automatically. Our plugin inherits the benefit without any code. This is the kind of host-capability-absorption the domain research warned about — except it favors us: we do not compete on tool-listing efficiency; we ride on the host's improvements.

### Strategic Impact Assessment

**On the 7-day MVP plan:**

- Day 1 gains a README "MCP integrations (advanced)" section (~3-4 paragraphs, 1 hour of writing). No schema impact.
- Day 3-5 carries a CI lint preventing MCP on Haiku subagents (trivial grep-based rule).
- Day 7 dogfood unaffected — zero MCP in the plugin, zero MCP code paths to test beyond the absence.

**On the 9 architectural principles:**

- Principle #3 (Integration is the primitive, not the Git flow) extends to MCP: the plugin is agnostic about MCP adoption. Consumers decide.
- No new principle introduced; all existing principles hold.

**On the 8 open decisions from the brainstorming:**

- Decision #6 (`.workflow.yaml` keys): v1.5+ adds an `mcp` section. MVP schema already has `domain-map`, `skip-heuristics`, `lean-boot-mode` — these remain unchanged.

**On the positioning refinement (spec-first + reference implementation):**

- MCP is orthogonal. Our spec does not prescribe MCP server choices; it describes an optional integration mechanism (v1.5+). Third-party adopters of our spec do not need to understand MCP to implement it.

**On host-absorption risk:**

- Positive absorption: Tool Search is a host feature we benefit from. Anthropic could further reduce MCP overhead — every such improvement helps our plugin without requiring our work.
- Negative absorption: Anthropic could ship a native alternative to our optional MCP integration (e.g., a built-in high-quality web search). This would simplify our v1.5+ design; not a threat.

### Next Steps

**Immediate (before writing any code):**

1. Draft the README "MCP integrations (advanced)" section (3-4 paragraphs). Include: Exa for research, Brave for privacy-first, GitHub/Slack pointing to official plugins, copy-paste fixtures.
2. Add the CI lint rule: grep for `mcp__*` in `allowed-tools` of skills whose `agent:` is `Explore` or a custom Haiku-backed agent. Hard fail on match.
3. Confirm no MVP plugin file declares `mcpServers`. Document this as an invariant in `spec/memory-convention.md` or a new `spec/plugin-invariants.md`.

**Short term (Days 1–7):**

4. Execute the brainstorming roadmap; the MCP track adds only documentation work.
5. Day 7 dogfood: verify the plugin runs on a consumer install with no MCP at all.

**Medium term (weeks 2–6):**

6. Collect community feedback on whether v1.5+ MCP opt-in is desired. Track the request count.
7. If demand exists: design the `.workflow.yaml` `mcp` section, ship v1.5+, document in `spec/workflow-yaml.schema.md`, add Tier 2 fallback tests.
8. Prefer Exa as the first documented server (benchmark data supports it).

**Ongoing:**

9. Quarterly: review MCP spec revisions (new transports, new registry features).
10. Monitor Claude Code host updates for new MCP-adjacent features (e.g., server auto-discovery, improved search heuristics).
11. Watch whether competing frameworks (Superpowers, Agent OS) bundle MCP. If they ship common servers and gain users, reconsider our bundle-nothing stance.

### Research Limitations

- **Quality benchmarks for Claude native `WebSearch` are not published.** Exa's 81% WebWalker and Tavily's 71% are MCP-server-side figures. We have no direct comparison of native Claude `WebSearch` quality to either. Decision to stay on native for MVP rests on the bundle-nothing principle, not on quality parity.
- **Tool Search performance may vary by model version.** Figures (85% reduction) come from 2026 community benchmarks. Actual reductions depend on the mix of tools and the search query quality. Dogfood will measure.
- **Haiku Tool Search non-support is current behavior.** Anthropic could add support in a future Haiku release. Monitor `ENABLE_TOOL_SEARCH` compatibility docs per release.
- **MCP registry stats (17,468 servers)** are from a Q1 2026 independent census (Nerq). Registry quality is uneven; raw count overstates the production-ready server population (estimated 500+ per ChatForest).
- **No first-hand measurement of per-server token cost.** Cost figures (Exa ~50-75% reduction via highlights, Gmail 2,640 tokens, Playwright 3,500 tokens) are from community sources.
- **`claude.com/blog/subagents-in-claude-code` and `agents.md` and `agentskills.io` returned 403** in this session. Primary-site verification of some claims was not feasible; relied on multiple converging secondary sources.

### Research Completion Metadata

- **Research Topic:** MCP Integration Patterns for a Claude Code Workflow Plugin
- **Research Type:** Technical (track 4 of 5)
- **Author:** Cyril
- **Completion Date:** 2026-04-18
- **Source Verification:** All factual claims cited against Claude Code official docs, MCP spec site, Anthropic news, Linux Foundation/AAIF materials, and multiple community sources. Critical claims (Tool Search mechanics, MCP cost profile, Haiku non-support) multi-source validated.
- **Confidence Level:** High on MCP standard status and Claude Code MCP configuration; medium on token cost numbers (community benchmarks, not our measurements); medium on v1.5+ demand projection.
- **Primary Sources:**
  - [anthropic.com/news/donating-the-model-context-protocol](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation) — Linux Foundation donation
  - [code.claude.com/docs/en/mcp](https://code.claude.com/docs/en/mcp) — Claude Code MCP integration
  - [modelcontextprotocol.io/specification/2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25) — spec
  - [platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool) — Tool Search
  - [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) — official servers
- **Secondary Sources:**
  - [mcpmanager.ai/blog/mcp-adoption-statistics](https://mcpmanager.ai/blog/mcp-adoption-statistics/) — 2026 adoption
  - [github.blog — MCP joins the Linux Foundation](https://github.blog/open-source/maintainers/mcp-joins-the-linux-foundation-what-this-means-for-developers-building-the-next-era-of-ai-tools-and-agents/) — donation context
  - [claudefa.st/blog/tools/mcp-extensions/mcp-tool-search](https://claudefa.st/blog/tools/mcp-extensions/mcp-tool-search) — Tool Search benchmarks
  - [mindstudio.ai/blog/claude-code-mcp-server-token-overhead](https://www.mindstudio.ai/blog/claude-code-mcp-server-token-overhead) — cost breakdown
  - [jdhodges.com/blog/claude-code-mcp-server-token-costs](https://www.jdhodges.com/blog/claude-code-mcp-server-token-costs/) — cost analysis
  - [taskade.com/blog/mcp-servers](https://www.taskade.com/blog/mcp-servers) — 2026 server catalog
  - [chatforest.com/guides/best-search-mcp-servers](https://chatforest.com/guides/best-search-mcp-servers/) — search server comparison
  - [gofastmcp.com/integrations/mcp-json-configuration](https://gofastmcp.com/integrations/mcp-json-configuration) — config reference
  - [spences10/mcp-omnisearch](https://github.com/spences10/mcp-omnisearch) — unified search reference
- **Inputs from prior work:**
  - Research #1 — `technical-plugin-architecture-distribution-research-2026-04-17.md`
  - Research #2 — `technical-frontmatter-schemas-research-2026-04-17.md`
  - Research #3 — `technical-subagents-context-isolation-research-2026-04-18.md`
  - Brainstorming session — `brainstorming-session-2026-04-17-1545.md`
  - Domain research — `domain-agentic-workflows-ecosystem-research-2026-04-17.md`
- **Sibling research tracks** (not yet run):
  - Research #5 — SessionStart Hook & Hook Lifecycle

_This technical research document serves as the Track-4 deliverable of a five-track sequential technical research. Resolves the MCP bundling policy and the `research-web-wrapper` MCP-vs-native decision. Ship-ready as of 2026-04-18._
