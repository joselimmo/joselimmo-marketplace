import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Ajv2020 } from "ajv/dist/2020.js";

const here = path.dirname(fileURLToPath(import.meta.url));

const REGISTRY_PATH = path.resolve(
  here,
  "..",
  "..",
  "..",
  "diagnostics",
  "registry.json",
);
const SCHEMA_PATH = path.resolve(
  here,
  "..",
  "..",
  "..",
  "schemas",
  "v1",
  "diagnostic-registry.schema.json",
);

const [registryRaw, schemaRaw] = await Promise.all([
  fs.readFile(REGISTRY_PATH, "utf8"),
  fs.readFile(SCHEMA_PATH, "utf8"),
]);

const registry = JSON.parse(registryRaw) as unknown;
const schema = JSON.parse(schemaRaw) as object;

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validate = ajv.compile(schema);

if (validate(registry)) {
  const count = (registry as { diagnostics: unknown[] }).diagnostics.length;
  console.log(
    `[ajv-validate-registry] OK — diagnostics/registry.json (${count} entries) conforms to schemas/v1/diagnostic-registry.schema.json`,
  );
  process.exit(0);
}

for (const error of validate.errors ?? []) {
  const where = error.instancePath || "(root)";
  console.error(`${where} ${error.message ?? "(no message)"}`);
}
process.exit(1);
