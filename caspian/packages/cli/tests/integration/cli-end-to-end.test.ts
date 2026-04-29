import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { promisify } from "node:util";
import { beforeAll, describe, expect, it } from "vitest";
import { CLI_DIST_BIN, CLI_PACKAGE_ROOT } from "../helpers/paths.js";
import { runCli } from "../helpers/run-cli.js";

const execFileAsync = promisify(execFile);

beforeAll(async () => {
  // Ensure dist is fresh for integration assertions on the built artifact.
  if (!existsSync(CLI_DIST_BIN)) {
    await execFileAsync(
      process.platform === "win32" ? "pnpm.cmd" : "pnpm",
      ["-F", "@caspian-dev/cli", "build"],
      { cwd: CLI_PACKAGE_ROOT, maxBuffer: 5 * 1024 * 1024 },
    );
  }
}, 120_000);

describe("cli end-to-end — info flags", () => {
  it("--version prints semver and exits 0", async () => {
    const { stdout, code } = await runCli(["--version"]);
    expect(code).toBe(0);
    expect(stdout).toMatch(/^\d+\.\d+\.\d+\s*$/);
  });

  it("--help prints usage with the validate subcommand and exits 0", async () => {
    const { stdout, code } = await runCli(["--help"]);
    expect(code).toBe(0);
    expect(stdout).toContain("Usage:");
    expect(stdout).toContain("validate");
  });
});

describe("cli end-to-end — validate happy paths", () => {
  it("valid file → exit 0 with '0 errors, 0 warnings' summary", async () => {
    const { stdout, code } = await runCli([
      "validate",
      "./fixtures/valid/core-overview/minimal.md",
    ]);
    expect(code).toBe(0);
    expect(stdout).toContain("1 file: 0 errors, 0 warnings");
  });

  it("directory walk → exit 0", async () => {
    const { stdout, code } = await runCli(["validate", "./fixtures/valid/"]);
    expect(code).toBe(0);
    expect(stdout).toContain(": 0 errors");
  });

  it("warning-only file → exit 0 with hint line", async () => {
    const { stdout, code } = await runCli([
      "validate",
      "./fixtures/invalid/W001-unknown-field/typo-metadat.md",
    ]);
    expect(code).toBe(0);
    expect(stdout).toContain("CASPIAN-W001");
    expect(stdout).toContain("hint: Did you mean `metadata`?");
  });
});

describe("cli end-to-end — validate failure paths", () => {
  it("error file → exit 1", async () => {
    const { stdout, code } = await runCli([
      "validate",
      "./fixtures/invalid/E008-type-missing/no-type.md",
    ]);
    expect(code).toBe(1);
    expect(stdout).toContain("CASPIAN-E008");
  });
});

describe("cli end-to-end — usage errors (exit 2)", () => {
  it("unknown option → exit 2 with stderr 'unknown option'", async () => {
    const { stderr, code } = await runCli(["validate", "--flubber"]);
    expect(code).toBe(2);
    expect(stderr).toContain("unknown option");
  });

  it("missing input → exit 2 with stderr 'input not found'", async () => {
    const { stderr, code } = await runCli(["validate", "./does-not-exist.md"]);
    expect(code).toBe(2);
    expect(stderr).toContain("input not found");
  });
});

describe("cli end-to-end — internal error (exit 3)", () => {
  it("CASPIAN_CLI_FORCE_THROW=1 → exit 3 with stderr 'internal validator error' + 'Please report at'", async () => {
    const { stderr, code } = await runCli(
      ["validate", "./fixtures/valid/core-overview/minimal.md"],
      { CASPIAN_CLI_FORCE_THROW: "1" },
    );
    expect(code).toBe(3);
    expect(stderr).toContain("internal validator error");
    expect(stderr).toContain("Please report at");
  });
});
