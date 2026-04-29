import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { beforeAll, describe, expect, it } from "vitest";
import { CLI_PACKAGE_ROOT } from "../helpers/paths.js";
import { runCli } from "../helpers/run-cli.js";

const execFileAsync = promisify(execFile);

// P7 (Story 2.5): always rebuild dist before integration tests so we never
// validate a stale binary.
beforeAll(async () => {
  await execFileAsync("pnpm", ["-F", "@caspian-dev/cli", "build"], {
    cwd: CLI_PACKAGE_ROOT,
    maxBuffer: 5 * 1024 * 1024,
    shell: true,
  });
}, 120_000);

interface JsonDiagnostic {
  code: string;
  severity: "error" | "warning";
  line: number;
  field?: string;
  message: string;
  doc?: string;
}

interface JsonResult {
  file: string;
  valid: boolean;
  diagnostics: JsonDiagnostic[];
}

interface JsonOutput {
  schemaVersion: "1";
  results: JsonResult[];
  summary: {
    files: number;
    errors: number;
    warnings: number;
  };
}

describe("format-json — schema shape (B4)", () => {
  it("valid file → schemaVersion '1' + 1 result valid:true + summary 1/0/0", async () => {
    const { stdout, code } = await runCli([
      "validate",
      "--format=json",
      "./fixtures/valid/core-overview/minimal.md",
    ]);
    expect(code).toBe(0);

    const parsed = JSON.parse(stdout) as JsonOutput;
    expect(parsed.schemaVersion).toBe("1");
    expect(parsed.results).toHaveLength(1);
    expect(parsed.results[0]?.valid).toBe(true);
    expect(parsed.results[0]?.diagnostics).toEqual([]);
    expect(parsed.summary).toEqual({ files: 1, errors: 0, warnings: 0 });

    // Insertion-order check on top-level keys.
    expect(Object.keys(parsed)).toEqual([
      "schemaVersion",
      "results",
      "summary",
    ]);
    expect(stdout).toMatchSnapshot();
  });

  it("E008 file → exit 1 + valid:false + summary.errors=1 + field='type'", async () => {
    const { stdout, code } = await runCli([
      "validate",
      "--format=json",
      "./fixtures/invalid/E008-type-missing/no-type.md",
    ]);
    expect(code).toBe(1);

    const parsed = JSON.parse(stdout) as JsonOutput;
    expect(parsed.results).toHaveLength(1);
    expect(parsed.results[0]?.valid).toBe(false);
    expect(parsed.summary).toEqual({ files: 1, errors: 1, warnings: 0 });

    const diag = parsed.results[0]?.diagnostics[0];
    expect(diag).toBeDefined();
    expect(diag?.code).toBe("CASPIAN-E008");
    expect(diag?.severity).toBe("error");
    expect(diag?.field).toBe("type");
    expect(diag?.doc).toBe("https://caspian.dev/diagnostics#caspian-e008");

    // Per-diagnostic key insertion order (with `field` present).
    expect(Object.keys(diag ?? {})).toEqual([
      "code",
      "severity",
      "line",
      "field",
      "message",
      "doc",
    ]);
    expect(stdout).toMatchSnapshot();
  });

  it("E001 (BOM) file → no `field` key (file-level diagnostic)", async () => {
    const { stdout, code } = await runCli([
      "validate",
      "--format=json",
      "./fixtures/invalid/E001-bom/with-bom.md",
    ]);
    expect(code).toBe(1);

    const parsed = JSON.parse(stdout) as JsonOutput;
    const diag = parsed.results[0]?.diagnostics[0];
    expect(diag?.code).toBe("CASPIAN-E001");
    expect(diag?.severity).toBe("error");

    // E001 is a file-level diagnostic; core does NOT set Diagnostic.field.
    // The `field` key MUST be absent from the JSON output.
    expect("field" in (diag ?? {})).toBe(false);
    expect(Object.keys(diag ?? {})).toEqual([
      "code",
      "severity",
      "line",
      "message",
      "doc",
    ]);
  });

  it("W001 file → exit 0 + valid:true + summary.warnings=1 + verbatim message", async () => {
    const { stdout, code } = await runCli([
      "validate",
      "--format=json",
      "./fixtures/invalid/W001-unknown-field/typo-metadat.md",
    ]);
    expect(code).toBe(0);

    const parsed = JSON.parse(stdout) as JsonOutput;
    expect(parsed.results[0]?.valid).toBe(true);
    expect(parsed.summary).toEqual({ files: 1, errors: 0, warnings: 1 });

    const diag = parsed.results[0]?.diagnostics[0];
    expect(diag?.code).toBe("CASPIAN-W001");
    expect(diag?.severity).toBe("warning");
    expect(diag?.field).toBe("metadat");

    // Raw message preserved verbatim — the JSON formatter does NOT strip the
    // hint suffix that core's W001 emits.
    expect(diag?.message).toContain("Did you mean `metadata`?");

    // Per-diagnostic key insertion order WITH optional `field` present.
    expect(Object.keys(diag ?? {})).toEqual([
      "code",
      "severity",
      "line",
      "field",
      "message",
      "doc",
    ]);
    expect(stdout).toMatchSnapshot();
  });
});

describe("format-json — multi-file aggregation", () => {
  it("directory walk → multiple results in walker order + summary aggregated", async () => {
    const { stdout, code } = await runCli([
      "validate",
      "--format=json",
      "./fixtures/valid/",
    ]);
    expect(code).toBe(0);

    const parsed = JSON.parse(stdout) as JsonOutput;
    expect(parsed.results.length).toBeGreaterThanOrEqual(6);
    expect(parsed.results.every((r) => r.valid)).toBe(true);
    expect(parsed.summary.errors).toBe(0);
    expect(parsed.summary.files).toBe(parsed.results.length);
    expect(stdout).toMatchSnapshot();
  });

  it("invalid directory → mixed results, summary aggregates errors + warnings", async () => {
    const { stdout, code } = await runCli([
      "validate",
      "--format=json",
      "./fixtures/invalid/",
    ]);
    // Mixed dir contains errors → exit 1.
    expect(code).toBe(1);

    const parsed = JSON.parse(stdout) as JsonOutput;
    expect(parsed.summary.files).toBeGreaterThan(0);
    expect(parsed.summary.errors).toBeGreaterThan(0);
    expect(parsed.summary.warnings).toBeGreaterThan(0);

    // At least one valid:false (errors present) and at least one valid:true
    // (W001-only files).
    expect(parsed.results.some((r) => r.valid === false)).toBe(true);
    expect(parsed.results.some((r) => r.valid === true)).toBe(true);

    expect(stdout).toMatchSnapshot();
  });
});

describe("format-json — determinism (NFR19, NFR20)", () => {
  it("two consecutive runs produce byte-identical stdout", async () => {
    const r1 = await runCli(["validate", "--format=json", "./fixtures/valid/"]);
    const r2 = await runCli(["validate", "--format=json", "./fixtures/valid/"]);
    expect(r1.code).toBe(0);
    expect(r2.code).toBe(0);
    // String equality, not just JSON.parse equality — guards against any
    // ordering drift, whitespace drift, or trailing-newline drift.
    expect(r1.stdout).toBe(r2.stdout);
  });

  it("two consecutive runs on invalid fixtures produce byte-identical stdout", async () => {
    const r1 = await runCli([
      "validate",
      "--format=json",
      "./fixtures/invalid/",
    ]);
    const r2 = await runCli([
      "validate",
      "--format=json",
      "./fixtures/invalid/",
    ]);
    expect(r1.code).toBe(1);
    expect(r2.code).toBe(1);
    expect(r1.stdout).toBe(r2.stdout);
  });
});

describe("format-json — strict-warnings predicate (PRD Journey 6)", () => {
  it("W001 file → predicate `errors==0 && warnings==0` evaluates to false", async () => {
    const { stdout, code } = await runCli([
      "validate",
      "--format=json",
      "./fixtures/invalid/W001-unknown-field/typo-metadat.md",
    ]);
    expect(code).toBe(0);

    const parsed = JSON.parse(stdout) as JsonOutput;
    expect(parsed.summary.errors).toBe(0);
    expect(parsed.summary.warnings).toBe(1);

    // jq -e '.summary.errors == 0 and .summary.warnings == 0' equivalent.
    const predicate =
      parsed.summary.errors === 0 && parsed.summary.warnings === 0;
    expect(predicate).toBe(false);
  });
});

describe("format-json — invalid --format value (exit 2)", () => {
  it("--format=xml → exit 2 + stderr usage error + empty stdout", async () => {
    const { stdout, stderr, code } = await runCli([
      "validate",
      "--format=xml",
      "./fixtures/valid/",
    ]);
    expect(code).toBe(2);
    expect(stderr).toContain(
      "error: invalid --format value: 'xml' (expected 'human' or 'json')",
    );
    expect(stderr).toContain("Run 'caspian validate --help' for usage.");
    expect(stdout).toBe("");
  });
});
