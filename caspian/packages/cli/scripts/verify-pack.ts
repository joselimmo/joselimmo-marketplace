import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(here, "..");
const SNAPSHOT_PATH = path.resolve(
  PACKAGE_ROOT,
  "tests",
  "integration",
  "published-files.snapshot.json",
);

interface PackResult {
  files: Array<{ path: string }>;
}

interface Snapshot {
  files: Array<{ path: string }>;
}

function sortPaths(paths: string[]): string[] {
  return [...paths].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function diff(actual: string[], expected: string[]): string[] {
  const lines: string[] = [];
  const a = new Set(actual);
  const b = new Set(expected);
  for (const p of expected) if (!a.has(p)) lines.push(`- ${p}`);
  for (const p of actual) if (!b.has(p)) lines.push(`+ ${p}`);
  return lines;
}

let raw: string;
try {
  raw = execFileSync("pnpm", ["pack", "--dry-run", "--json"], {
    cwd: PACKAGE_ROOT,
    encoding: "utf-8",
    // shell: true required on Windows for .cmd shim invocation (matches the
    // Story 2.5 P7 pattern at tests/integration/cli-end-to-end.test.ts).
    shell: true,
  }).trim();
} catch (err) {
  const e = err as { message?: string };
  console.error(
    `verify-pack: FAIL — could not invoke pnpm pack: ${e.message ?? String(err)}`,
  );
  process.exit(1);
}

let pack: PackResult;
try {
  pack = JSON.parse(raw) as PackResult;
} catch (err) {
  const e = err as { message?: string };
  console.error(
    `verify-pack: FAIL — pnpm pack output is not valid JSON: ${e.message ?? String(err)}`,
  );
  process.exit(1);
}

let snapshot: Snapshot;
try {
  snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf-8")) as Snapshot;
} catch (err) {
  const e = err as { message?: string };
  console.error(
    `verify-pack: FAIL — cannot read snapshot at ${SNAPSHOT_PATH}: ${e.message ?? String(err)}`,
  );
  process.exit(1);
}

if (!Array.isArray(pack.files)) {
  console.error(
    `verify-pack: FAIL — unexpected pnpm pack output shape: "files" is not an array`,
  );
  process.exit(1);
}

if (!Array.isArray(snapshot.files)) {
  console.error(
    `verify-pack: FAIL — snapshot has unexpected shape: "files" is not an array`,
  );
  process.exit(1);
}

const actualPaths = sortPaths(pack.files.map((f) => f.path));
const expectedPaths = sortPaths(snapshot.files.map((f) => f.path));

const driftLines = diff(actualPaths, expectedPaths);
if (driftLines.length === 0) {
  console.log(`verify-pack: OK (${actualPaths.length} files match snapshot)`);
  process.exit(0);
}

console.error("verify-pack: FAIL — published file list drift detected.");
for (const line of driftLines) console.error(line);
console.error(
  "To update the snapshot intentionally, run: pnpm -F @caspian-dev/cli pack --dry-run --json",
);
console.error(
  "then copy the sorted `files` array into tests/integration/published-files.snapshot.json",
);
process.exit(1);
