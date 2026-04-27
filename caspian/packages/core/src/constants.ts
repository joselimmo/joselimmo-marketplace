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
