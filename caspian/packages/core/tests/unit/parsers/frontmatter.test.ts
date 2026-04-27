import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import { extractFrontmatter } from "../../../src/parsers/frontmatter.js";

describe("frontmatter extractor (stage 2)", () => {
  it("happy-path — minimal frontmatter returns raw content + line numbers", () => {
    const text = "---\ntype: core:overview\n---\n\nbody";
    const result = extractFrontmatter(text);

    // raw excludes both delimiter newlines per architecture D4 — the
    // newline between the last content line and the closing `---` is
    // the closing delimiter's leading EOL, not part of content.
    expect(result.diagnostics).toEqual([]);
    expect(result.raw).toBe("type: core:overview");
    expect(result.startLine).toBe(1);
    expect(result.endLine).toBe(3);
    expect(result.bodyStartLine).toBe(4);
  });

  it("E005 — no opening delimiter emits CASPIAN-E005 line 1", () => {
    const text = "type: core:overview\n";
    const result = extractFrontmatter(text);

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe("CASPIAN-E005");
    expect(result.diagnostics[0].line).toBe(1);
    expect(result.raw).toBe("");
  });

  it("E005 — opening but no closing delimiter emits CASPIAN-E005 line 1", () => {
    const text = "---\ntype: core:overview\n";
    const result = extractFrontmatter(text);

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe("CASPIAN-E005");
    expect(result.diagnostics[0].line).toBe(1);
  });

  it("E004 boundary — exactly 4096 UTF-8 bytes between delimiters does NOT fire E004", () => {
    const filler = "a".repeat(4096);
    const text = `---\n${filler}\n---\n`;
    const result = extractFrontmatter(text);

    // raw includes the trailing newline after the filler? No — closing-delim
    // leading newline is excluded. Content = filler exactly. byteLength = 4096.
    expect(Buffer.byteLength(result.raw, "utf8")).toBe(4096);
    expect(result.diagnostics).toEqual([]);
  });

  it("E004 over-boundary — 4097 UTF-8 bytes emits CASPIAN-E004 line 1", () => {
    const filler = "a".repeat(4097);
    const text = `---\n${filler}\n---\n`;
    const result = extractFrontmatter(text);

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe("CASPIAN-E004");
    expect(result.diagnostics[0].line).toBe(1);
  });

  it("CRLF compatibility — \\r\\n delimiters parse identically to \\n", () => {
    const text = "---\r\ntype: core:overview\r\n---\r\n\r\nbody";
    const result = extractFrontmatter(text);

    expect(result.diagnostics).toEqual([]);
    expect(result.raw).toBe("type: core:overview");
    expect(result.startLine).toBe(1);
    expect(result.endLine).toBe(3);
  });

  it("multi-byte UTF-8 byte cap — 1366 three-byte CJK runes (4098 bytes) emits E004", () => {
    // 中 = 3 UTF-8 bytes. 1366 × 3 = 4098 bytes (over 4096).
    const filler = "中".repeat(1366);
    const text = `---\n${filler}\n---\n`;
    const result = extractFrontmatter(text);

    expect(Buffer.byteLength(filler, "utf8")).toBe(4098);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe("CASPIAN-E004");
  });

  it("empty frontmatter — back-to-back delimiters returns empty raw, no diagnostics", () => {
    const text = "---\n---\n";
    const result = extractFrontmatter(text);

    expect(result.diagnostics).toEqual([]);
    expect(result.raw).toBe("");
    expect(result.startLine).toBe(1);
    expect(result.endLine).toBe(2);
  });
});
