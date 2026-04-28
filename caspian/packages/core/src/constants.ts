/**
 * Frontmatter byte cap (NFR4 + architecture D4). Bytes are counted between
 * (but excluding) the opening and closing `---` lines, exclusive of the
 * delimiter newlines themselves.
 */
export const MAX_FRONTMATTER_BYTES = 4096;

/**
 * YAML 1.1 boolean-like keywords that `yaml` v2.x in strict 1.2 mode parses
 * as plain strings, but that Caspian flags via `CASPIAN-E007` because they
 * are author-error footguns (NFR8). Values are lowercase; the post-parse
 * scan in stage 3 case-normalises the YAML scalar before lookup.
 *
 * `true` and `false` are intentionally absent — they are valid YAML 1.2
 * booleans and are out of scope for this rule.
 */
export const YAML_1_1_UNQUOTED_BOOLEANS: ReadonlySet<string> = Object.freeze(
  new Set(["on", "off", "yes", "no", "y", "n"]),
);

/**
 * 22-field allow-list for stage 6 (W001). Combines 4 Caspian core fields,
 * 6 agentskills.io canonical fields, and 12 Claude Code overlay fields.
 */
export const RECOGNIZED_FIELDS: ReadonlySet<string> = Object.freeze(
  new Set([
    "schema_version",
    "type",
    "requires",
    "produces",
    "name",
    "description",
    "license",
    "allowed-tools",
    "metadata",
    "compatibility",
    "when_to_use",
    "argument-hint",
    "arguments",
    "disable-model-invocation",
    "user-invocable",
    "model",
    "effort",
    "context",
    "agent",
    "hooks",
    "paths",
    "shell",
  ]),
);

/**
 * Recognized `schema_version` values for stage 5 W003 check.
 */
export const SUPPORTED_SCHEMA_VERSIONS: ReadonlySet<string> = Object.freeze(
  new Set(["0.1"]),
);

/**
 * Canonical `core:*` names derived from `caspian/spec/vocabulary/` (one file
 * per type, excluding README.md and glossary.md). Used by stage 5 W004 check.
 */
export const CANONICAL_CORE_NAMES: ReadonlySet<string> = Object.freeze(
  new Set([
    "overview",
    "plan",
    "learning",
    "review",
    "rule",
    "scratch",
    "convention",
    "story",
    "epic",
    "adr",
  ]),
);
