import type { Diagnostic } from "@caspian-dev/core";
import { describe, expect, it } from "vitest";
import { getDocUrl } from "../../../src/output/doc-url.js";
import { formatHuman } from "../../../src/output/human.js";
import type { FileResult } from "../../../src/output/types.js";

const noColor = { useColor: false };
const withColor = { useColor: true };

const makeError = (
  line: number,
  code: string,
  message: string,
): Diagnostic => ({
  code,
  severity: "error",
  line,
  message,
});

const makeWarning = (
  line: number,
  code: string,
  message: string,
): Diagnostic => ({
  code,
  severity: "warning",
  line,
  message,
});

describe("formatHuman — empty result", () => {
  it("renders '(no diagnostics)' + summary for a clean file", () => {
    const results: FileResult[] = [
      { file: "fixtures/valid/a.md", diagnostics: [] },
    ];
    const out = formatHuman(results, noColor);
    expect(out).toContain("fixtures/valid/a.md");
    expect(out).toContain("  (no diagnostics)");
    expect(out).toContain("1 file: 0 errors, 0 warnings");
    expect(out.endsWith("\n")).toBe(true);
  });
});

describe("formatHuman — single error", () => {
  it("renders the diagnostic block + 'error' summary", () => {
    const results: FileResult[] = [
      {
        file: "fixtures/invalid/E008/no-type.md",
        diagnostics: [
          makeError(1, "CASPIAN-E008", "`type` field missing or empty"),
        ],
      },
    ];
    const out = formatHuman(results, noColor);
    expect(out).toContain(
      "fixtures/invalid/E008/no-type.md:1 — CASPIAN-E008 error: `type` field missing or empty",
    );
    expect(out).toContain("doc: https://caspian.dev/diagnostics#caspian-e008");
    expect(out).toContain("1 file: 1 error, 0 warnings");
  });
});

describe("formatHuman — single warning", () => {
  it("renders the diagnostic block + 'warning' summary", () => {
    const results: FileResult[] = [
      {
        file: "fixtures/invalid/W002/x.md",
        diagnostics: [
          makeWarning(2, "CASPIAN-W002", "`type` namespace outside `core:*`"),
        ],
      },
    ];
    const out = formatHuman(results, noColor);
    expect(out).toContain("CASPIAN-W002 warning:");
    expect(out).toContain("1 file: 0 errors, 1 warning");
  });
});

describe("formatHuman — multi-file ordering and totals", () => {
  it("preserves file order, separates blocks with blank line, totals are correct", () => {
    const results: FileResult[] = [
      {
        file: "a.md",
        diagnostics: [makeError(1, "CASPIAN-E008", "missing type")],
      },
      { file: "b.md", diagnostics: [] },
      {
        file: "c.md",
        diagnostics: [
          makeError(3, "CASPIAN-E009", "type not namespaced"),
          makeWarning(5, "CASPIAN-W001", "Unrecognized field"),
        ],
      },
    ];
    const out = formatHuman(results, noColor);
    expect(out.indexOf("a.md")).toBeLessThan(out.indexOf("b.md"));
    expect(out.indexOf("b.md")).toBeLessThan(out.indexOf("c.md"));
    expect(out).toContain("3 files: 2 errors, 1 warning");
    // Inter-block: blank line between two consecutive blocks.
    expect(out).toContain("\n\nb.md");
    expect(out).toContain("\n\nc.md");
  });
});

describe("formatHuman — W001 hint extraction", () => {
  it("strips ' Did you mean…? See: …' from message and renders hint line", () => {
    const results: FileResult[] = [
      {
        file: "x.md",
        diagnostics: [
          makeWarning(
            3,
            "CASPIAN-W001",
            "Unrecognized frontmatter field: `metadat`. Did you mean `metadata`? See: https://caspian.dev/diagnostics#caspian-w001",
          ),
        ],
      },
    ];
    const out = formatHuman(results, noColor);
    expect(out).toContain(
      "CASPIAN-W001 warning: Unrecognized frontmatter field: `metadat`",
    );
    expect(out).toContain("hint: Did you mean `metadata`?");
    expect(out).not.toContain("Did you mean `metadata`? See:");
    expect(out).toContain("doc: https://caspian.dev/diagnostics#caspian-w001");
  });
});

describe("formatHuman — color toggling", () => {
  it("plain output contains no ANSI escapes when useColor is false", () => {
    const results: FileResult[] = [
      {
        file: "a.md",
        diagnostics: [makeError(1, "CASPIAN-E008", "missing type")],
      },
    ];
    const out = formatHuman(results, noColor);
    // ANSI escapes start with ESC (0x1b)
    expect(out.includes("\x1b[")).toBe(false);
  });

  it("colored output contains ANSI escapes when useColor is true", () => {
    const results: FileResult[] = [
      {
        file: "a.md",
        diagnostics: [makeError(1, "CASPIAN-E008", "missing type")],
      },
    ];
    const out = formatHuman(results, withColor);
    expect(out.includes("\x1b[")).toBe(true);
  });
});

describe("formatHuman — skipped-count annotation (P10)", () => {
  it("appends '(N skipped)' to footer when skippedCount > 0", () => {
    const results: FileResult[] = [{ file: "a.md", diagnostics: [] }];
    const out = formatHuman(results, { useColor: false, skippedCount: 3 });
    expect(out).toContain("1 file (3 skipped): 0 errors, 0 warnings");
  });

  it("omits skipped annotation when skippedCount is 0", () => {
    const results: FileResult[] = [{ file: "a.md", diagnostics: [] }];
    const out = formatHuman(results, { useColor: false, skippedCount: 0 });
    expect(out).toContain("1 file: 0 errors, 0 warnings");
    expect(out).not.toContain("skipped");
  });
});

describe("formatHuman — pluralization edge cases", () => {
  it("0 files / 0 errors / 0 warnings", () => {
    const out = formatHuman([], noColor);
    expect(out).toContain("0 files: 0 errors, 0 warnings");
  });

  it("2 files: 2 errors, 1 warning", () => {
    const results: FileResult[] = [
      {
        file: "a.md",
        diagnostics: [
          makeError(1, "CASPIAN-E008", "x"),
          makeError(2, "CASPIAN-E009", "y"),
        ],
      },
      {
        file: "b.md",
        diagnostics: [makeWarning(3, "CASPIAN-W001", "z")],
      },
    ];
    const out = formatHuman(results, noColor);
    expect(out).toContain("2 files: 2 errors, 1 warning");
  });
});

describe("getDocUrl — typed-constant lookup", () => {
  it("returns the canonical doc URL for known codes", () => {
    expect(getDocUrl("CASPIAN-E001")).toBe(
      "https://caspian.dev/diagnostics#caspian-e001",
    );
    expect(getDocUrl("CASPIAN-W001")).toBe(
      "https://caspian.dev/diagnostics#caspian-w001",
    );
  });

  it("returns undefined for unknown codes", () => {
    expect(getDocUrl("CASPIAN-Z999")).toBeUndefined();
  });
});
