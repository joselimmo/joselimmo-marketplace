#!/usr/bin/env node
/**
 * Vendor-neutrality boundary — layer 3 (runtime-level).
 *
 * Proves that `@caspian-dev/cli` runs to exit 0 inside a vanilla node:22-alpine
 * container with no Claude Code, no Anthropic SDK, and no extension shims.
 * Architecture.md:715-721 prescribes `npx @caspian-dev/cli`, but the package is
 * not yet on npm (Story 2.8 owns publish), so this script packs both workspace
 * tarballs locally (core + cli, since `@caspian-dev/cli` declares
 * `@caspian-dev/core` as a runtime dep that npm cannot resolve from any
 * registry) and `npm install`s them inside the container instead. Same
 * assertion: the CLI binary runs against fixtures/valid/ in a vendor-clean
 * runtime.
 *
 * Critical: the container does NOT bind-mount the repo root as a writable
 * working directory. `npm init` and `npm install` run inside an in-container
 * scratch dir (/work-scratch) so they cannot mutate host files. Only
 * fixtures/valid/ and the tmp pkg dir are bind-mounted, both effectively
 * read-only (the in-container `cd` and `npm` writes target the scratch dir
 * exclusively).
 *
 * On a contributor laptop without docker the script SKIPs (exit 0) so local
 * dev is never blocked. Release.yml (Story 2.8) wires this as a blocking gate
 * on a Docker-equipped runner before pnpm publish.
 *
 * Story 2.7. Pure-Node ESM.
 */

import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..");
const FIXTURES_VALID_DIR = path.join(REPO_ROOT, "fixtures", "valid");

function dockerAvailable() {
  const probe = spawnSync("docker", ["--version"], {
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
  });
  return probe.status === 0;
}

function packWorkspacePackage(filter, tmpDir) {
  const result = spawnSync(
    "pnpm",
    ["-F", filter, "pack", "--pack-destination", tmpDir],
    {
      cwd: REPO_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
      shell: process.platform === "win32",
    },
  );
  if (result.status !== 0) {
    process.stderr.write(
      `vendor-neutrality-docker: pnpm pack ${filter} failed (exit ${result.status})\n`,
    );
    if (result.stderr) process.stderr.write(`${result.stderr}\n`);
    process.exit(1);
  }
}

function findTarball(tmpDir, prefix) {
  const matches = readdirSync(tmpDir).filter(
    (f) => f.startsWith(prefix) && f.endsWith(".tgz"),
  );
  if (matches.length !== 1) {
    process.stderr.write(
      `vendor-neutrality-docker: expected exactly one ${prefix}*.tgz in ${tmpDir}, found ${matches.length}\n`,
    );
    process.exit(1);
  }
  return matches[0];
}

function runDockerGate(tmpDir, coreTarball, cliTarball) {
  const pkgMount = `${tmpDir}:/pkg:ro`;
  const fixturesMount = `${FIXTURES_VALID_DIR}:/fixtures:ro`;
  // Copy fixtures into the scratch dir so the CLI's walker (which rejects
  // realpaths that escape cwd) accepts them. Bind-mounting fixtures read-only
  // and validating against an in-scratch copy keeps the host fixtures
  // untouched while satisfying the walker's containment check.
  const innerCmd = [
    "set -e",
    "mkdir -p /work-scratch",
    "cp -r /fixtures /work-scratch/fixtures",
    "cd /work-scratch",
    "node --version",
    'echo \'{"name":"vendor-neutrality-probe","version":"0.0.0","private":true}\' > package.json',
    `npm install --silent --no-audit --no-fund --no-package-lock /pkg/${coreTarball} /pkg/${cliTarball}`,
    "npx --no @caspian-dev/cli validate ./fixtures/",
  ].join(" && ");

  const result = spawnSync(
    "docker",
    [
      "run",
      "--rm",
      "-v",
      pkgMount,
      "-v",
      fixturesMount,
      "node:22-alpine",
      "sh",
      "-c",
      innerCmd,
    ],
    { stdio: "inherit", shell: false },
  );
  return result.status ?? 1;
}

function main() {
  if (!dockerAvailable()) {
    process.stderr.write(
      "vendor-neutrality:docker SKIPPED — docker not found on PATH (release pipeline runs this gate)\n",
    );
    process.exit(0);
  }

  const tmpDir = mkdtempSync(
    path.join(os.tmpdir(), "caspian-vendor-neutrality-"),
  );
  try {
    packWorkspacePackage("@caspian-dev/core", tmpDir);
    packWorkspacePackage("@caspian-dev/cli", tmpDir);
    const coreTarball = findTarball(tmpDir, "caspian-dev-core-");
    const cliTarball = findTarball(tmpDir, "caspian-dev-cli-");
    const exitCode = runDockerGate(tmpDir, coreTarball, cliTarball);
    if (exitCode !== 0) {
      process.stderr.write(
        `vendor-neutrality-docker: docker run exited ${exitCode}\n`,
      );
      process.exit(1);
    }
    process.stdout.write(
      "vendor-neutrality-docker: OK (caspian validate /fixtures/ exits 0 inside node:22-alpine)\n",
    );
    process.exit(0);
  } finally {
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore — temp cleanup is best-effort
    }
  }
}

main();
