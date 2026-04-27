import { readFile as readFileBytes } from "node:fs/promises";
import { CASPIAN_E001, CASPIAN_E002 } from "../diagnostics/codes.generated.js";
import type { Diagnostic } from "../diagnostics/types.js";

export interface ByteReadResult {
  bytes: Buffer;
  text: string;
  diagnostics: Diagnostic[];
}

const BOM = Buffer.from([0xef, 0xbb, 0xbf]);

export async function readFile(filePath: string): Promise<ByteReadResult> {
  const bytes = await readFileBytes(filePath);

  if (
    bytes.length >= 3 &&
    bytes[0] === BOM[0] &&
    bytes[1] === BOM[1] &&
    bytes[2] === BOM[2]
  ) {
    return {
      bytes,
      text: "",
      diagnostics: [
        {
          code: CASPIAN_E001.code,
          severity: CASPIAN_E001.severity,
          line: 1,
          message: CASPIAN_E001.message,
        },
      ],
    };
  }

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { bytes, text, diagnostics: [] };
  } catch {
    return {
      bytes,
      text: "",
      diagnostics: [
        {
          code: CASPIAN_E002.code,
          severity: CASPIAN_E002.severity,
          line: 1,
          message: CASPIAN_E002.message,
        },
      ],
    };
  }
}
