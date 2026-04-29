import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
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

  it("clean fixture returns empty diagnostics array (stages 1–6 pass)", async () => {
    const diagnostics = await runPipeline(
      fixture("valid/core-overview/minimal.md"),
    );

    expect(diagnostics).toEqual([]);
  });

  it("stage 4 — E008 fixture returns ONLY E008 (type missing)", async () => {
    const diagnostics = await runPipeline(
      fixture("invalid/E008-type-missing/no-type.md"),
    );

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].code).toBe("CASPIAN-E008");
  });

  it("stage 5 — W002 fixture returns ONLY W002 (non-core namespace)", async () => {
    const diagnostics = await runPipeline(
      fixture("invalid/W002-non-core-namespace/bmad-epic.md"),
    );

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].code).toBe("CASPIAN-W002");
  });

  it("stage 6 — W001 fixture returns ONLY W001 (unknown field)", async () => {
    const diagnostics = await runPipeline(
      fixture("invalid/W001-unknown-field/typo-metadat.md"),
    );

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].code).toBe("CASPIAN-W001");
  });

  it("stage 6 — vendor-namespaced unknown field still emits W001 (stage 4 clean)", async () => {
    const diagnostics = await runPipeline(
      fixture("invalid/W001-unknown-field/vendor-namespaced.md"),
    );

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].code).toBe("CASPIAN-W001");
  });

  describe("stages 4–6 continue-and-collect (synthetic temp fixtures)", () => {
    let tmpDir: string;

    beforeAll(async () => {
      tmpDir = await mkdtemp(path.join(tmpdir(), "caspian-cc-"));
    });

    afterAll(async () => {
      await rm(tmpDir, { recursive: true, force: true });
    });

    it("W002 (non-core type) + W001 (unknown field) both fire on the same file", async () => {
      const file = path.join(tmpDir, "w002-w001.md");
      await writeFile(
        file,
        "---\ntype: bmad:epic\nschema_version: '0.1'\nweird_field: x\n---\n# body\n",
      );

      const diagnostics = await runPipeline(file);
      const codes = diagnostics.map((d) => d.code).sort();
      expect(codes).toEqual(["CASPIAN-W001", "CASPIAN-W002"]);
    });

    it("E008 (missing type) + W001 (unknown field) both fire on the same file", async () => {
      const file = path.join(tmpDir, "e008-w001.md");
      await writeFile(
        file,
        "---\nschema_version: '0.1'\nweird_field: x\n---\n# body\n",
      );

      const diagnostics = await runPipeline(file);
      const codes = diagnostics.map((d) => d.code).sort();
      expect(codes).toEqual(["CASPIAN-E008", "CASPIAN-W001"]);
    });
  });

  it("REPO_ROOT helper resolves correctly", () => {
    // Sanity check — confirms FIXTURES_DIR sits where we expect under REPO_ROOT.
    expect(FIXTURES_DIR).toBe(path.join(REPO_ROOT, "fixtures"));
  });
});
