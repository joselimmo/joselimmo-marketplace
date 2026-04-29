#!/usr/bin/env node
/**
 * Vendor-neutrality boundary — layer 2 (lockfile-level).
 *
 * Spawns `pnpm ls --prod --depth=Infinity --json` from the caspian/ root,
 * parses the result, walks the resolved-dep tree of every @caspian-dev/*
 * importer, and rejects any package name (top-level or transitive) that
 * matches /(^|@)anthropic|(^|@)claude/i. Layer 1 (dep-cruiser, source-level)
 * cannot see beyond node_modules; this script closes that gap.
 *
 * Story 2.7. Pure-Node ESM — no `jq`, no external bins beyond `pnpm`.
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..");
const VENDOR_REGEX = /(^|@)anthropic|(^|@)claude/i;
const TARGET_IMPORTER_PATTERN = /^@caspian-dev\//;

function runPnpmLs() {
  const result = spawnSync(
    "pnpm",
    ["ls", "--prod", "--depth=Infinity", "--json", "-r"],
    {
      cwd: REPO_ROOT,
      encoding: "utf8",
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  if (result.status !== 0) {
    process.stderr.write(
      `audit-lockfile-vendor-neutrality: pnpm ls failed (exit ${result.status})\n`,
    );
    if (result.stderr) process.stderr.write(`${result.stderr}\n`);
    process.exit(1);
  }
  return result.stdout;
}

function parseImporters(rawJson) {
  let parsed;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err) {
    process.stderr.write(
      `audit-lockfile-vendor-neutrality: failed to parse pnpm ls JSON output: ${err.message}\n`,
    );
    process.exit(1);
  }
  if (!Array.isArray(parsed)) {
    process.stderr.write(
      `audit-lockfile-vendor-neutrality: expected pnpm ls --json to emit an array of importers\n`,
    );
    process.exit(1);
  }
  return parsed;
}

function collectAllPackages(node, sink) {
  if (!node || typeof node !== "object") return;
  for (const groupKey of [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
  ]) {
    const group = node[groupKey];
    if (!group || typeof group !== "object") continue;
    for (const [pkgName, pkgEntry] of Object.entries(group)) {
      sink.add(pkgName);
      collectAllPackages(pkgEntry, sink);
    }
  }
}

function main() {
  const raw = runPnpmLs();
  const importers = parseImporters(raw);

  const targetImporters = importers.filter(
    (imp) =>
      typeof imp.name === "string" && TARGET_IMPORTER_PATTERN.test(imp.name),
  );

  if (targetImporters.length === 0) {
    process.stderr.write(
      "audit-lockfile-vendor-neutrality: no @caspian-dev/* importers found in pnpm ls output — refusing to vacuously pass\n",
    );
    process.exit(1);
  }

  const allPackages = new Set();
  for (const imp of targetImporters) {
    collectAllPackages(imp, allPackages);
  }

  const offenders = [...allPackages].filter((name) => VENDOR_REGEX.test(name));
  if (offenders.length > 0) {
    for (const name of offenders.sort()) {
      process.stderr.write(`vendor-neutrality audit FAIL: ${name}\n`);
    }
    process.stderr.write(
      `audit-lockfile-vendor-neutrality: ${offenders.length} forbidden vendor-coupled dep(s) found under @caspian-dev/* importers\n`,
    );
    process.exit(1);
  }

  process.stdout.write(
    `audit-lockfile-vendor-neutrality: OK (${allPackages.size} resolved packages across ${targetImporters.length} @caspian-dev/* importers; zero @anthropic-ai|@claude matches)\n`,
  );
  process.exit(0);
}

main();
