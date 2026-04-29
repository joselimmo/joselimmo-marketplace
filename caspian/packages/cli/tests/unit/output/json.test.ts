import { describe, expect, it } from "vitest";
import { formatJson } from "../../../src/output/json.js";

describe("formatJson — edge cases", () => {
  it("empty results array → valid JSON with summary zeros and trailing newline", () => {
    const out = formatJson([]);
    const parsed = JSON.parse(out) as {
      schemaVersion: string;
      results: unknown[];
      summary: { files: number; errors: number; warnings: number };
    };
    expect(parsed.schemaVersion).toBe("1");
    expect(parsed.results).toEqual([]);
    expect(parsed.summary).toEqual({ files: 0, errors: 0, warnings: 0 });
    expect(out.endsWith("\n")).toBe(true);
    expect(Object.keys(parsed)).toEqual([
      "schemaVersion",
      "results",
      "summary",
    ]);
  });

  it("single file with both error and warning → valid:false + counters split correctly", () => {
    const out = formatJson([
      {
        file: "test.md",
        diagnostics: [
          {
            code: "CASPIAN-E008",
            severity: "error" as const,
            line: 1,
            message: "Field `type` is missing or empty",
          },
          {
            code: "CASPIAN-W001",
            severity: "warning" as const,
            line: 3,
            field: "metadat",
            message: "Unrecognized field: `metadat`",
          },
        ],
      },
    ]);
    const parsed = JSON.parse(out) as {
      results: Array<{ valid: boolean; diagnostics: unknown[] }>;
      summary: { files: number; errors: number; warnings: number };
    };
    expect(parsed.results[0]?.valid).toBe(false);
    expect(parsed.results[0]?.diagnostics).toHaveLength(2);
    expect(parsed.summary).toEqual({ files: 1, errors: 1, warnings: 1 });
  });
});
