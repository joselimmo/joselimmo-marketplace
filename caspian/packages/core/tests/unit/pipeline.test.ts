import path from "node:path";
import { describe, expect, it } from "vitest";
import { runPipeline } from "../../src/pipeline.js";
import { FIXTURES_DIR, REPO_ROOT } from "../helpers/paths.js";

const fixture = (relPath: string): string => path.join(FIXTURES_DIR, relPath);

describe("pipeline orchestrator", () => {
  it("stage 1 short-circuits — BOM fixture returns ONLY E001 (no E005)", async () => {
    const diagnostics = await runPipeline(
      fixture("invalid/E001-bom/with-bom.md"),
    );

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].code).toBe("CASPIAN-E001");
  });

  it("stage 2 short-circuits — missing-delimiter fixture returns ONLY E005 (no E006)", async () => {
    const diagnostics = await runPipeline(
      fixture("invalid/E005-missing-delimiters/no-closing-delim.md"),
    );

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].code).toBe("CASPIAN-E005");
  });

  it("stage 3 short-circuits — tab-indent fixture returns ONLY E003 (stages 4–6 do not run)", async () => {
    const diagnostics = await runPipeline(
      fixture("invalid/E003-tab-indent/tab-in-yaml.md"),
    );

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].code).toBe("CASPIAN-E003");
  });

  it("clean fixture returns empty diagnostics array (stages 1–3 pass)", async () => {
    const diagnostics = await runPipeline(
      fixture("valid/core-overview/minimal.md"),
    );

    expect(diagnostics).toEqual([]);
  });

  it("REPO_ROOT helper resolves correctly", () => {
    // Sanity check — confirms FIXTURES_DIR sits where we expect under REPO_ROOT.
    expect(FIXTURES_DIR).toBe(path.join(REPO_ROOT, "fixtures"));
  });
});
