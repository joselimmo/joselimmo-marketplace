import { Buffer } from "node:buffer";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFile } from "../../../src/parsers/byte-reader.js";

let tmpDir = "";

async function writeTmp(name: string, bytes: Buffer): Promise<string> {
  const p = path.join(tmpDir, name);
  await fs.writeFile(p, bytes);
  return p;
}

describe("byte-reader (stage 1)", () => {
  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "caspian-byte-reader-"));
  });

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("happy-path — clean UTF-8 file returns text and empty diagnostics", async () => {
    const content = "---\ntype: core:overview\n---\n";
    const filePath = await writeTmp("clean.md", Buffer.from(content, "utf8"));

    const result = await readFile(filePath);

    expect(result.diagnostics).toEqual([]);
    expect(result.text).toBe(content);
    expect(result.bytes.length).toBe(content.length);
  });

  it("E001 — file prefixed with UTF-8 BOM emits CASPIAN-E001 line 1", async () => {
    const bom = Buffer.from([0xef, 0xbb, 0xbf]);
    const body = Buffer.from("---\ntype: core:overview\n---\n", "utf8");
    const filePath = await writeTmp("with-bom.md", Buffer.concat([bom, body]));

    const result = await readFile(filePath);

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe("CASPIAN-E001");
    expect(result.diagnostics[0].line).toBe(1);
    expect(result.diagnostics[0].severity).toBe("error");
  });

  it("E002 — invalid UTF-8 byte sequence emits CASPIAN-E002 line 1", async () => {
    const filePath = await writeTmp(
      "non-utf8.md",
      Buffer.from([0x41, 0x91, 0x42]),
    );

    const result = await readFile(filePath);

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe("CASPIAN-E002");
    expect(result.diagnostics[0].line).toBe(1);
  });

  it("E001 short-circuits E002 — BOM + invalid UTF-8 emits only E001", async () => {
    const bom = Buffer.from([0xef, 0xbb, 0xbf]);
    const invalid = Buffer.from([0x41, 0x91, 0x42]);
    const filePath = await writeTmp(
      "bom-and-invalid.md",
      Buffer.concat([bom, invalid]),
    );

    const result = await readFile(filePath);

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe("CASPIAN-E001");
  });
});
