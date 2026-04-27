import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

const sourceDir = path.resolve(here, "..", "..", "..", "schemas", "v1");
const destDir = path.resolve(here, "..", "dist", "schemas", "v1");

await fs.mkdir(destDir, { recursive: true });

const entries = await fs.readdir(sourceDir, { withFileTypes: true });
const jsonFiles = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
  .map((entry) => entry.name);

for (const file of jsonFiles) {
  const src = path.join(sourceDir, file);
  const dst = path.join(destDir, file);
  await fs.copyFile(src, dst);
}

console.log(`[copy-schemas] copied ${jsonFiles.length} file(s) → ${destDir}`);
