import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ENVELOPE_SCHEMA_FILE = "envelope.schema.json";

const here = path.dirname(fileURLToPath(import.meta.url));

let cachedEnvelopeSchema: object | null = null;

export async function loadEnvelopeSchema(): Promise<object> {
  if (cachedEnvelopeSchema !== null) {
    return cachedEnvelopeSchema;
  }

  const productionPath = path.resolve(
    here,
    "..",
    "schemas",
    "v1",
    ENVELOPE_SCHEMA_FILE,
  );
  const devPath = path.resolve(
    here,
    "..",
    "..",
    "..",
    "..",
    "schemas",
    "v1",
    ENVELOPE_SCHEMA_FILE,
  );

  const errors: string[] = [];
  for (const candidate of [productionPath, devPath]) {
    try {
      const raw = await fs.readFile(candidate, "utf8");
      const parsed = JSON.parse(raw) as object;
      cachedEnvelopeSchema = parsed;
      return parsed;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") {
        throw err;
      }
      errors.push(candidate);
    }
  }

  throw new Error(
    `cannot locate ${ENVELOPE_SCHEMA_FILE} — checked ${errors.join(" and ")}`,
  );
}
