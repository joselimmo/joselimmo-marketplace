import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as codes from "../../../src/diagnostics/codes.generated.js";
import { REPO_ROOT } from "../../helpers/paths.js";

interface RegistryEntry {
  code: string;
  severity: "error" | "warning";
  rule: string;
  message: string;
  doc: string;
}

const registryRaw = await fs.readFile(
  path.join(REPO_ROOT, "diagnostics", "registry.json"),
  "utf8",
);
const registry = JSON.parse(registryRaw) as { diagnostics: RegistryEntry[] };
const codesByCode = new Map<string, RegistryEntry>(
  Object.entries(codes)
    .filter(([key]) => key.startsWith("CASPIAN_"))
    .map(([, value]) => [
      (value as RegistryEntry).code,
      value as RegistryEntry,
    ]),
);

describe("@caspian-dev/core/diagnostics codes.generated", () => {
  it("exports one constant per registry entry", () => {
    for (const entry of registry.diagnostics) {
      const constant = codesByCode.get(entry.code);
      expect(constant, `missing constant for ${entry.code}`).toBeDefined();
      expect(constant).toEqual(entry);
    }
  });

  it("registry has one entry per exported constant", () => {
    const registryCodes = new Set(registry.diagnostics.map((d) => d.code));
    for (const code of codesByCode.keys()) {
      expect(registryCodes.has(code), `orphan constant ${code}`).toBe(true);
    }
  });

  it("each constant matches the DiagnosticDefinition shape", () => {
    const expectedKeys = ["code", "doc", "message", "rule", "severity"];
    for (const [, entry] of codesByCode) {
      expect(Object.keys(entry).sort()).toEqual(expectedKeys);
    }
  });

  it("codes.generated.ts has a well-formed sha256 header", async () => {
    const codesPath = path.join(
      REPO_ROOT,
      "packages",
      "core",
      "src",
      "diagnostics",
      "codes.generated.ts",
    );
    const text = await fs.readFile(codesPath, "utf8");
    const firstLine = text.split("\n", 1)[0] ?? "";
    expect(firstLine).toMatch(/^\/\/ Hash: [a-f0-9]{64}$/);
  });

  it("constant count equals registry entry count", () => {
    expect(codesByCode.size).toBe(registry.diagnostics.length);
  });
});
