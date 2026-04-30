#!/usr/bin/env node
/**
 * Vendor-neutrality boundary — layer 3 (runtime-level).
 *
 * Proves that `@caspian-dev/cli` runs to exit 0 inside a vanilla node:22-alpine
 * container with no host-specific runtime, no Anthropic SDK, and no extension
 * shims. Two operating modes selected via the CASPIAN_DOCKER_GATE_MODE env var:
 *
 *   - `npx-published` (default; architecture.md:715-721 prescribed flow):
 *       container runs `npx @caspian-dev/cli@<version> validate /fixtures/`
 *       fetched from the public npm registry. The version is read from
 *       packages/cli/package.json. This is the steady-state release-gate flow
 *       once the package is published (Story 2.8 onward).
 *
 *   - `local-tarball` (Story 2.7 transitional shim, pre-publish smoke):
 *       container `npm install`s locally-packed tarballs of both
 *       @caspian-dev/core and @caspian-dev/cli (cli's `workspace:^` ref to
 *       core gets rewritten by pnpm pack to a version npm cannot resolve from
 *       any registry, hence both tarballs are needed) then runs
 *       `npx --no @caspian-dev/cli validate /fixtures/`. Same vendor-neutrality
 *       assertion. Used for pre-publish smoke (Task 12 of Story 2.8) and as
 *       the inner gate of release.yml that runs BEFORE pnpm publish.
 *
 * Default mode is `npx-published`. release.yml sets
 * `CASPIAN_DOCKER_GATE_MODE=local-tarball` for the pre-publish gate (so it
 * proves vendor-neutrality of the not-yet-published artifact) and
 * `CASPIAN_DOCKER_GATE_MODE=npx-published` for the post-publish verification
 * step (so it proves vendor-neutrality of the live npm artifact).
 *
 * Critical: the container does NOT bind-mount the repo root as a writable
 * working directory. `npm init` and `npm install` run inside an in-container
 * scratch dir (/work-scratch) so they cannot mutate host files. Only
 * fixtures/valid/ and (in local-tarball mode) the tmp pkg dir are
 * bind-mounted, both effectively read-only.
 *
 * On a contributor laptop without docker the script SKIPs (exit 0) so local
 * dev is never blocked. release.yml on a Docker-equipped runner makes this a
 * blocking gate.
 *
 * Story 2.7 introduced this script. Story 2.8 extended it with the
 * `npx-published` mode (closes Story 2.7 D2). Pure-Node ESM.
 */

import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..");
const FIXTURES_VALID_DIR = path.join(REPO_ROOT, "fixtures", "valid");
const CLI_PACKAGE_JSON_PATH = path.join(
  REPO_ROOT,
  "packages",
  "cli",
  "package.json",
);

const VALID_MODES = new Set(["npx-published", "local-tarball"]);

function resolveMode() {
  const raw = process.env.CASPIAN_DOCKER_GATE_MODE?.trim();
  if (raw === undefined || raw === "") return "npx-published";
  if (!VALID_MODES.has(raw)) {
    process.stderr.write(
      `vendor-neutrality-docker: invalid CASPIAN_DOCKER_GATE_MODE="${raw}" — expected one of: ${[...VALID_MODES].join(", ")}\n`,
    );
    process.exit(2);
  }
  return raw;
}

function readCliVersion() {
  try {
    const pkg = JSON.parse(readFileSync(CLI_PACKAGE_JSON_PATH, "utf8"));
    if (typeof pkg.version !== "string" || pkg.version === "") {
      process.stderr.write(
        `vendor-neutrality-docker: ${CLI_PACKAGE_JSON_PATH} has no usable "version" field\n`,
      );
      process.exit(2);
    }
    return pkg.version;
  } catch (err) {
    process.stderr.write(
      `vendor-neutrality-docker: cannot read ${CLI_PACKAGE_JSON_PATH}: ${err instanceof Error ? err.message : String(err)}\n`,
    );
    process.exit(2);
  }
}

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

function runDockerLocalTarball(tmpDir, coreTarball, cliTarball) {
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

function runDockerNpxPublished(version) {
  const fixturesMount = `${FIXTURES_VALID_DIR}:/fixtures:ro`;
  // Same scratch-dir / read-only-fixtures discipline as the local-tarball
  // branch. The only behavioral difference is the install path: `npx` fetches
  // the published tarball from the public npm registry. Vendor-neutrality
  // contract is identical: the alpine container has no host-specific runtime
  // pre-installed.
  const innerCmd = [
    "set -e",
    "mkdir -p /work-scratch",
    "cp -r /fixtures /work-scratch/fixtures",
    "cd /work-scratch",
    "node --version",
    `npx --yes @caspian-dev/cli@${version} validate ./fixtures/`,
  ].join(" && ");

  const result = spawnSync(
    "docker",
    [
      "run",
      "--rm",
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
  const mode = resolveMode();

  if (!dockerAvailable()) {
    process.stderr.write(
      `vendor-neutrality:docker SKIPPED — docker not found on PATH (release pipeline runs this gate; mode=${mode})\n`,
    );
    process.exit(0);
  }

  if (mode === "npx-published") {
    const version = readCliVersion();
    process.stdout.write(
      `vendor-neutrality-docker: mode=npx-published version=${version}\n`,
    );
    const exitCode = runDockerNpxPublished(version);
    if (exitCode !== 0) {
      process.stderr.write(
        `vendor-neutrality-docker: docker run exited ${exitCode}\n`,
      );
      process.exit(1);
    }
    process.stdout.write(
      "vendor-neutrality-docker: OK (npx @caspian-dev/cli validate /fixtures/ exits 0 inside node:22-alpine)\n",
    );
    process.exit(0);
  }

  // mode === "local-tarball"
  process.stdout.write("vendor-neutrality-docker: mode=local-tarball\n");
  const tmpDir = mkdtempSync(
    path.join(os.tmpdir(), "caspian-vendor-neutrality-"),
  );
  try {
    packWorkspacePackage("@caspian-dev/core", tmpDir);
    packWorkspacePackage("@caspian-dev/cli", tmpDir);
    const coreTarball = findTarball(tmpDir, "caspian-dev-core-");
    const cliTarball = findTarball(tmpDir, "caspian-dev-cli-");
    const exitCode = runDockerLocalTarball(tmpDir, coreTarball, cliTarball);
    if (exitCode !== 0) {
      process.stderr.write(
        `vendor-neutrality-docker: docker run exited ${exitCode}\n`,
      );
      process.exit(1);
    }
    process.stdout.write(
      "vendor-neutrality-docker: OK (local-tarball install + caspian validate /fixtures/ exits 0 inside node:22-alpine)\n",
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
