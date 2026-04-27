import { Buffer } from "node:buffer";
import { MAX_FRONTMATTER_BYTES } from "../constants.js";
import { CASPIAN_E004, CASPIAN_E005 } from "../diagnostics/codes.generated.js";
import type { Diagnostic } from "../diagnostics/types.js";

export interface FrontmatterExtractResult {
  raw: string;
  startLine: number;
  endLine: number;
  bodyStartLine: number;
  diagnostics: Diagnostic[];
}

const EMPTY: FrontmatterExtractResult = {
  raw: "",
  startLine: 0,
  endLine: 0,
  bodyStartLine: 0,
  diagnostics: [],
};

function emitE005(): FrontmatterExtractResult {
  return {
    ...EMPTY,
    diagnostics: [
      {
        code: CASPIAN_E005.code,
        severity: CASPIAN_E005.severity,
        line: 1,
        message: CASPIAN_E005.message,
      },
    ],
  };
}

function emitE004(): FrontmatterExtractResult {
  return {
    ...EMPTY,
    diagnostics: [
      {
        code: CASPIAN_E004.code,
        severity: CASPIAN_E004.severity,
        line: 1,
        message: CASPIAN_E004.message,
      },
    ],
  };
}

function countLinesUpTo(text: string, position: number): number {
  let count = 1;
  for (let i = 0; i < position && i < text.length; i++) {
    if (text[i] === "\n") count++;
  }
  return count;
}

interface ClosingDelim {
  contentEnd: number;
  delimStart: number;
}

function findClosingDelim(
  text: string,
  contentStart: number,
): ClosingDelim | null {
  if (text.startsWith("---", contentStart)) {
    const after = contentStart + 3;
    if (
      after === text.length ||
      text[after] === "\n" ||
      (text[after] === "\r" && text[after + 1] === "\n")
    ) {
      return { contentEnd: contentStart, delimStart: contentStart };
    }
  }

  const re = /\r?\n---(?:\r?\n|$)/g;
  re.lastIndex = contentStart;
  const m = re.exec(text);
  if (m === null) return null;

  const eolLen = m[0].startsWith("\r\n") ? 2 : 1;
  return { contentEnd: m.index, delimStart: m.index + eolLen };
}

export function extractFrontmatter(text: string): FrontmatterExtractResult {
  const openMatch = text.match(/^---(\r?\n)/);
  if (openMatch === null) return emitE005();

  const contentStart = openMatch[0].length;
  const closing = findClosingDelim(text, contentStart);
  if (closing === null) return emitE005();

  const raw = text.slice(contentStart, closing.contentEnd);

  if (Buffer.byteLength(raw, "utf8") > MAX_FRONTMATTER_BYTES) {
    return emitE004();
  }

  const endLine = countLinesUpTo(text, closing.delimStart);
  return {
    raw,
    startLine: 1,
    endLine,
    bodyStartLine: endLine + 1,
    diagnostics: [],
  };
}
