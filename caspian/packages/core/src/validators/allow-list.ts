import { parseDocument } from "yaml";
import { RECOGNIZED_FIELDS } from "../constants.js";
import { CASPIAN_W001 } from "../diagnostics/codes.generated.js";
import type { Diagnostic } from "../diagnostics/types.js";

export interface AllowListScanResult {
  diagnostics: Diagnostic[];
}

function byteOffsetToLine(text: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset; i++) {
    if (text[i] === "\n") line++;
  }
  return line;
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let j = 1; j <= a.length; j++) {
    let prev = dp[0] as number;
    dp[0] = j;
    for (let i = 1; i <= b.length; i++) {
      const temp = dp[i] as number;
      dp[i] =
        a[j - 1] === b[i - 1]
          ? prev
          : 1 + Math.min(prev, dp[i] as number, dp[i - 1] as number);
      prev = temp;
    }
  }
  return dp[b.length] as number;
}

function findClosestMatch(field: string): string | undefined {
  // Ties broken alphabetically (stable across future RECOGNIZED_FIELDS additions).
  let best: string | undefined;
  let bestDist = 3;
  for (const known of RECOGNIZED_FIELDS) {
    const d = levenshtein(field, known);
    if (
      d < bestDist ||
      (d === bestDist && best !== undefined && known < best)
    ) {
      bestDist = d;
      best = known;
    }
  }
  return bestDist <= 2 ? best : undefined;
}

export function scanAllowList(
  raw: string,
  startLine: number,
): AllowListScanResult {
  const diagnostics: Diagnostic[] = [];
  const doc = parseDocument(raw, { strict: false, version: "1.2" });
  const contents = doc.contents;

  if (!contents || !("items" in contents)) {
    return { diagnostics };
  }

  for (const pair of contents.items) {
    // biome-ignore lint/suspicious/noExplicitAny: CST traversal
    const anyPair = pair as any;
    const fieldName = String(anyPair.key?.value ?? "");
    if (!fieldName) continue;
    if (RECOGNIZED_FIELDS.has(fieldName)) continue;
    // `x-foo` is a valid extension namespace; bare `x-` (empty extension name) is malformed → W001.
    if (fieldName.length > 2 && fieldName.startsWith("x-")) continue;

    const keyNode = anyPair.key;
    const line = keyNode?.range
      ? byteOffsetToLine(raw, keyNode.range[0] as number) + startLine
      : startLine;

    const suggestion = findClosestMatch(fieldName);
    const message = suggestion
      ? `${CASPIAN_W001.message}: \`${fieldName}\`. Did you mean \`${suggestion}\`? See: ${CASPIAN_W001.doc}`
      : `${CASPIAN_W001.message}: \`${fieldName}\`. See: ${CASPIAN_W001.doc}`;

    diagnostics.push({
      code: CASPIAN_W001.code,
      severity: CASPIAN_W001.severity,
      line,
      field: fieldName,
      message,
    });
  }

  return { diagnostics };
}
