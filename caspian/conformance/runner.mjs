#!/usr/bin/env node
/**
 * conformance/runner.mjs — vendor-neutral conformance harness for Caspian validators.
 *
 * Usage:
 *   node conformance/runner.mjs <validator-binary-path>
 *
 * The validator binary MUST accept `validate <input.md> --format=json` and emit
 * a JSON object with the B4 schema (`schemaVersion: "1"`, `results[]`,
 * `summary{}`). See packages/cli/README.md "JSON output" section for the
 * canonical contract.
 *
 * For every directory `cases/NNN-<slug>/`, the runner spawns
 * `<validator-binary> validate <case>/input.md --format=json`, parses stdout,
 * extracts `results[0].diagnostics[].code`, and compares the multiset against
 * `expected.json`'s `diagnostics[].code` array. Only the `code` is the
 * conformance contract in v1.0; line / severity / field / message / doc are
 * informational and ignored. See conformance/README.md for the full contract.
 *
 * Exit codes:
 *   0 — every case passes
 *   1 — one or more cases fail
 *   2 — usage error / harness misconfiguration
 *
 * Story 2.7. Pure-Node ESM, sequential, no external deps beyond Node ≥22.
 */

import { spawnSync } from "node:child_process";
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CASES_DIR = path.join(HERE, "cases");
const TEMPLATE_PATH = path.join(HERE, "REPORT.template.md");
const REPORT_PATH = path.join(HERE, "REPORT.md");

const EXIT_OK = 0;
const EXIT_FAIL = 1;
const EXIT_USAGE = 2;

function usage(message) {
  process.stderr.write(`conformance/runner.mjs: ${message}\n`);
  process.stderr.write(
    "Usage: node conformance/runner.mjs <validator-binary-path>\n",
  );
  process.exit(EXIT_USAGE);
}

function loadValidatorPath(argv) {
  const args = argv.slice(2);
  if (args.length !== 1) {
    usage(
      `expected exactly one positional argument (validator binary path), got ${args.length}`,
    );
  }
  const resolved = path.resolve(process.cwd(), args[0]);
  if (!existsSync(resolved)) {
    usage(`validator binary not found at ${resolved}`);
  }
  return resolved;
}

function captureValidatorVersion(validatorPath) {
  const result = spawnSync("node", [validatorPath, "--version"], {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  });
  if (result.status !== 0) return "unknown";
  return (result.stdout || "").trim() || "unknown";
}

function loadCaseDirs() {
  if (!existsSync(CASES_DIR)) {
    usage(`cases directory not found at ${CASES_DIR}`);
  }
  return readdirSync(CASES_DIR)
    .filter((name) => statSync(path.join(CASES_DIR, name)).isDirectory())
    .sort();
}

function loadExpectedCodes(caseDir) {
  const expectedPath = path.join(CASES_DIR, caseDir, "expected.json");
  if (!existsSync(expectedPath)) return null;
  const raw = readFileSync(expectedPath, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return { parseError: err.message };
  }
  if (!parsed || !Array.isArray(parsed.diagnostics)) {
    return { parseError: "expected.json must have a `diagnostics` array" };
  }
  return parsed.diagnostics.map((d) => d.code);
}

function runValidator(validatorPath, inputMd) {
  const result = spawnSync(
    "node",
    [validatorPath, "validate", inputMd, "--format=json"],
    {
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
    },
  );
  return {
    status: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
}

function extractActualCodes(stdout) {
  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    return null;
  }
  if (!parsed || !Array.isArray(parsed.results)) return null;
  if (parsed.results.length === 0) return [];
  const diags = parsed.results[0].diagnostics;
  if (!Array.isArray(diags)) return null;
  return diags.map((d) => d.code);
}

function multisetEqual(a, b) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  for (let i = 0; i < sortedA.length; i++) {
    if (sortedA[i] !== sortedB[i]) return false;
  }
  return true;
}

function formatCodes(codes) {
  if (codes.length === 0) return "[]";
  return `[${[...codes].sort().join(", ")}]`;
}

function evaluateCase(validatorPath, caseDir) {
  const inputMd = path.join(CASES_DIR, caseDir, "input.md");
  if (!existsSync(inputMd)) {
    return {
      caseDir,
      pass: false,
      reason: "missing input.md",
      expected: [],
      actual: [],
    };
  }

  const expected = loadExpectedCodes(caseDir);
  if (expected === null) {
    return {
      caseDir,
      pass: false,
      reason: "missing expected.json",
      expected: [],
      actual: [],
    };
  }
  if (!Array.isArray(expected)) {
    return {
      caseDir,
      pass: false,
      reason: `malformed expected.json: ${expected.parseError}`,
      expected: [],
      actual: [],
    };
  }

  const ran = runValidator(validatorPath, inputMd);
  const actual = extractActualCodes(ran.stdout);
  if (actual === null) {
    const stderrHint = ran.stderr.trim()
      ? ` (stderr: ${ran.stderr.trim()})`
      : "";
    return {
      caseDir,
      pass: false,
      reason: `validator emitted non-JSON stdout${stderrHint}`,
      expected,
      actual: [],
    };
  }

  if (!multisetEqual(expected, actual)) {
    return {
      caseDir,
      pass: false,
      reason: `expected ${formatCodes(expected)}, got ${formatCodes(actual)}`,
      expected,
      actual,
    };
  }

  return {
    caseDir,
    pass: true,
    reason: "",
    expected,
    actual,
  };
}

function buildCasesTable(results) {
  const header =
    "| # | Case | Expected codes | Actual codes | Result |\n| --- | --- | --- | --- | --- |";
  const rows = results.map((r, idx) => {
    const num = String(idx + 1).padStart(3, "0");
    const expectedCell = formatCodes(r.expected);
    const actualCell = formatCodes(r.actual);
    const resultCell = r.pass ? "✅ PASS" : `❌ FAIL: ${r.reason}`;
    return `| ${num} | \`${r.caseDir}\` | \`${expectedCell}\` | \`${actualCell}\` | ${resultCell} |`;
  });
  return [header, ...rows].join("\n");
}

function renderReport(template, vars) {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.split(`{{${key}}}`).join(value);
  }
  return out;
}

function main() {
  const validatorPath = loadValidatorPath(process.argv);
  const validatorVersion = captureValidatorVersion(validatorPath);
  const caseDirs = loadCaseDirs();

  if (caseDirs.length === 0) {
    usage(`no case directories found under ${CASES_DIR}`);
  }

  const results = caseDirs.map((dir) => evaluateCase(validatorPath, dir));
  const passCount = results.filter((r) => r.pass).length;
  const totalCount = results.length;
  const summary = `${passCount} / ${totalCount} cases passed`;

  if (!existsSync(TEMPLATE_PATH)) {
    process.stderr.write(
      `conformance/runner.mjs: REPORT.template.md missing at ${TEMPLATE_PATH}\n`,
    );
    process.exit(EXIT_USAGE);
  }
  const template = readFileSync(TEMPLATE_PATH, "utf8");
  const report = renderReport(template, {
    generated_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    validator_path: validatorPath,
    validator_version: validatorVersion,
    cases_table: buildCasesTable(results),
    summary,
  });
  writeFileSync(REPORT_PATH, report, "utf8");

  process.stdout.write(`${summary}\n`);
  process.stdout.write(`Report: ${REPORT_PATH}\n`);

  if (passCount === totalCount) {
    process.exit(EXIT_OK);
  }
  process.exit(EXIT_FAIL);
}

main();
