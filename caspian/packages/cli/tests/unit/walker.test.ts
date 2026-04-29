import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  EmptyDirectoryError,
  GlobNoMatchError,
  InputNotFoundError,
  walk,
} from "../../src/walker.js";
import { FIXTURES_DIR, REPO_ROOT } from "../helpers/paths.js";

describe("walker — single file mode", () => {
  it("resolves a single existing fixture file", async () => {
    const target = path.join(
      FIXTURES_DIR,
      "valid",
      "core-overview",
      "minimal.md",
    );
    const result = await walk(target, REPO_ROOT);
    expect(result.files).toHaveLength(1);
    expect(result.files[0]?.replace(/\\/g, "/")).toMatch(
      /fixtures\/valid\/core-overview\/minimal\.md$/,
    );
    expect(result.skippedOutsideCwd).toHaveLength(0);
  });

  it("throws InputNotFoundError on missing file", async () => {
    const ghost = path.join(REPO_ROOT, "does-not-exist.md");
    await expect(walk(ghost, REPO_ROOT)).rejects.toThrow(InputNotFoundError);
  });
});

describe("walker — directory mode", () => {
  it("walks fixtures/valid/ and finds at least 6 markdown files", async () => {
    const dir = path.join(FIXTURES_DIR, "valid");
    const result = await walk(dir, REPO_ROOT);
    expect(result.files.length).toBeGreaterThanOrEqual(6);
    for (const file of result.files) {
      expect(file.endsWith(".md")).toBe(true);
      expect(file.replace(/\\/g, "/").includes("/valid/")).toBe(true);
    }
  });

  // P11: empty directory must exit 2 (same as glob zero-match).
  it("throws EmptyDirectoryError when directory contains no .md files", async () => {
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), "caspian-empty-"));
    try {
      await expect(walk(emptyDir, emptyDir)).rejects.toThrow(
        EmptyDirectoryError,
      );
    } finally {
      fs.rmSync(emptyDir, { recursive: true, force: true });
    }
  });
});

describe("walker — glob mode", () => {
  it("expands a glob pattern via fast-glob (not the shell)", async () => {
    const result = await walk("fixtures/valid/**/*.md", REPO_ROOT);
    expect(result.files.length).toBeGreaterThanOrEqual(6);
  });

  it("throws GlobNoMatchError when pattern matches nothing", async () => {
    await expect(walk("**/*.xyz", REPO_ROOT)).rejects.toThrow(GlobNoMatchError);
  });
});

describe("walker — symlink + realpath safety", () => {
  // P9: use it.skipIf so the test is reported as "skipped" (not "passed") on Windows.
  it.skipIf(process.platform === "win32")(
    "does not follow symlinks pointing outside cwd",
    async () => {
      const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "caspian-walker-"));
      const outside = fs.mkdtempSync(
        path.join(os.tmpdir(), "caspian-outside-"),
      );
      try {
        const insideFile = path.join(sandbox, "real.md");
        fs.writeFileSync(insideFile, "# real\n", "utf-8");

        const outsideFile = path.join(outside, "leak.md");
        fs.writeFileSync(outsideFile, "# leak\n", "utf-8");

        const symlink = path.join(sandbox, "leak.md");
        fs.symlinkSync(outsideFile, symlink);

        const result = await walk(sandbox, sandbox);
        const realFiles = result.files.map((f) => fs.realpathSync(f));
        const sandboxRealpath = fs.realpathSync(sandbox);
        for (const realFile of realFiles) {
          expect(realFile.startsWith(sandboxRealpath)).toBe(true);
        }
      } finally {
        fs.rmSync(sandbox, { recursive: true, force: true });
        fs.rmSync(outside, { recursive: true, force: true });
      }
    },
  );

  it("flags files that resolve outside cwd via skippedOutsideCwd (cross-platform)", async () => {
    const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "caspian-cwdcheck-"));
    const elsewhere = fs.mkdtempSync(path.join(os.tmpdir(), "caspian-other-"));
    try {
      const f = path.join(elsewhere, "stray.md");
      fs.writeFileSync(f, "# stray\n", "utf-8");
      // Pass an absolute path under elsewhere as input; cwd is sandbox.
      const result = await walk(f, sandbox);
      expect(result.files).toHaveLength(0);
      expect(result.skippedOutsideCwd).toHaveLength(1);
    } finally {
      fs.rmSync(sandbox, { recursive: true, force: true });
      fs.rmSync(elsewhere, { recursive: true, force: true });
    }
  });
});
