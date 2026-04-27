import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateFile } from "../../src/index.js";
import { FIXTURES_DIR, REPO_ROOT, SCHEMAS_DIR } from "../helpers/paths.js";

describe("@caspian-dev/core smoke", () => {
  it("exports validateFile as a function", () => {
    expect(typeof validateFile).toBe("function");
  });

  it("REPO_ROOT resolves to caspian/", () => {
    expect(fs.existsSync(path.join(REPO_ROOT, "package.json"))).toBe(true);
    expect(fs.existsSync(path.join(REPO_ROOT, "pnpm-workspace.yaml"))).toBe(
      true,
    );
  });

  it("FIXTURES_DIR and SCHEMAS_DIR resolve to existing directories", () => {
    expect(fs.existsSync(FIXTURES_DIR)).toBe(true);
    expect(fs.existsSync(SCHEMAS_DIR)).toBe(true);
  });
});
