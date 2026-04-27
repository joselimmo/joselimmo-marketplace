import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

const REGISTRY_PATH = path.resolve(
  here,
  "..",
  "..",
  "..",
  "diagnostics",
  "registry.json",
);
const CODES_PATH = path.resolve(
  here,
  "..",
  "src",
  "diagnostics",
  "codes.generated.ts",
);

const HEADER_PATTERN = /^\/\/ Hash: ([a-f0-9]{64})$/;

const rawBytes = await fs.readFile(REGISTRY_PATH);
const recomputed = crypto.createHash("sha256").update(rawBytes).digest("hex");

const codesText = await fs.readFile(CODES_PATH, "utf8");
const firstLine = (codesText.split("\n", 1)[0] ?? "").replace(/\r$/, "");
const match = firstLine.match(HEADER_PATTERN);

if (match === null) {
  console.error(
    `Error: codes.generated.ts header is missing or malformed (expected "// Hash: <sha256-hex>" on line 1, got: ${JSON.stringify(firstLine)}). Run \`pnpm gen:codes\` to regenerate.`,
  );
  process.exit(1);
}

const captured = match[1];

if (captured !== recomputed) {
  console.error(
    `Error: codes.generated.ts is out of sync with diagnostics/registry.json. Header contains ${captured} but registry now hashes to ${recomputed}. Run \`pnpm gen:codes\` to regenerate, then commit the result.`,
  );
  process.exit(1);
}

console.log(
  `[verify-codes-hash] OK — registry sha256 matches codes.generated.ts header (${recomputed})`,
);
