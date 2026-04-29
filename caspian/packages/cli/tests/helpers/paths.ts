import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

// tests/helpers/ → packages/cli/ → packages/ → caspian/
export const REPO_ROOT = path.resolve(here, "..", "..", "..", "..");
export const FIXTURES_DIR = path.join(REPO_ROOT, "fixtures");
export const CLI_PACKAGE_ROOT = path.resolve(here, "..", "..");
export const CLI_DIST_BIN = path.join(CLI_PACKAGE_ROOT, "dist", "cli.js");
