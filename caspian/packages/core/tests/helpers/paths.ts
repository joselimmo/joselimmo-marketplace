import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = path.resolve(here, "..", "..", "..", "..");
export const FIXTURES_DIR = path.join(REPO_ROOT, "fixtures");
export const SCHEMAS_DIR = path.join(REPO_ROOT, "schemas");
