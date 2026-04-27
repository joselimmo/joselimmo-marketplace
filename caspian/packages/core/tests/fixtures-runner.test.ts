import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateFile } from "../src/index.js";
import { FIXTURES_DIR } from "./helpers/paths.js";

interface ExpectedDiagnostic {
  code: string;
  line: number;
}

interface ExpectedFile {
  diagnostics: ExpectedDiagnostic[];
}

interface FixtureCase {
  label: string;
  fixturePath: string;
  expectedPath: string;
}

const STAGES_1_TO_3_DIRS = /^E00[1-7]-/;

async function discoverFixtures(): Promise<FixtureCase[]> {
  const invalidDir = path.join(FIXTURES_DIR, "invalid");
  const dirs = await fs.readdir(invalidDir, { withFileTypes: true });
  const cases: FixtureCase[] = [];

  for (const dir of dirs) {
    if (!dir.isDirectory() || !STAGES_1_TO_3_DIRS.test(dir.name)) continue;

    const subDir = path.join(invalidDir, dir.name);
    const entries = await fs.readdir(subDir);
    const md = entries.find(
      (e) => e.endsWith(".md") && !e.endsWith(".expected.md"),
    );
    if (md === undefined) continue;
    const expected = entries.find((e) => e.endsWith(".expected.json"));
    if (expected === undefined) continue;

    cases.push({
      label: `${dir.name}/${md}`,
      fixturePath: path.join(subDir, md),
      expectedPath: path.join(subDir, expected),
    });
  }

  return cases.sort((a, b) => a.label.localeCompare(b.label));
}

describe("fixtures-runner — stages 1–3 (E001–E007)", async () => {
  const cases = await discoverFixtures();

  it("discovered the expected number of E001–E007 fixture pairs", () => {
    expect(cases).toHaveLength(7);
  });

  it.each(
    cases,
  )("$label produces the expected diagnostic codes and lines", async ({
    fixturePath,
    expectedPath,
  }) => {
    const expected = JSON.parse(
      await fs.readFile(expectedPath, "utf8"),
    ) as ExpectedFile;

    const actual = await validateFile(fixturePath);
    const actualPairs = actual.map((d) => ({ code: d.code, line: d.line }));

    expect(actualPairs).toEqual(expected.diagnostics);
  });
});
