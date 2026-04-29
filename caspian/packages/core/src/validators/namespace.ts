import { parseDocument } from "yaml";
import {
  CANONICAL_CORE_NAMES,
  SUPPORTED_SCHEMA_VERSIONS,
} from "../constants.js";
import {
  CASPIAN_W002,
  CASPIAN_W003,
  CASPIAN_W004,
} from "../diagnostics/codes.generated.js";
import type { Diagnostic } from "../diagnostics/types.js";

export interface NamespaceCheckResult {
  diagnostics: Diagnostic[];
}

function byteOffsetToLine(text: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset; i++) {
    if (text[i] === "\n") line++;
  }
  return line;
}

function findKeyLine(raw: string, keyName: string, startLine: number): number {
  const doc = parseDocument(raw, { strict: false, version: "1.2" });
  const contents = doc.contents;
  if (!contents || !("items" in contents)) return startLine;
  const pair = contents.items.find(
    // biome-ignore lint/suspicious/noExplicitAny: CST traversal
    (p: any) => String(p.key?.value) === keyName,
  );
  // biome-ignore lint/suspicious/noExplicitAny: CST traversal
  const keyNode = (pair as any)?.key;
  if (keyNode?.range) {
    return byteOffsetToLine(raw, keyNode.range[0] as number) + startLine;
  }
  return startLine;
}

export function checkNamespace(
  data: Record<string, unknown> | null,
  raw: string,
  startLine: number,
): NamespaceCheckResult {
  const diagnostics: Diagnostic[] = [];
  if (!data) return { diagnostics };

  const typeValue = typeof data.type === "string" ? data.type : "";

  if (typeValue) {
    const colonIdx = typeValue.indexOf(":");
    if (colonIdx >= 0) {
      const namespace = typeValue.slice(0, colonIdx).toLowerCase();
      const name = typeValue.slice(colonIdx + 1).toLowerCase();

      if (namespace !== "core") {
        diagnostics.push({
          code: CASPIAN_W002.code,
          severity: CASPIAN_W002.severity,
          line: findKeyLine(raw, "type", startLine),
          field: "type",
          message: `${CASPIAN_W002.message}: \`${typeValue}\`.`,
        });
      } else if (!CANONICAL_CORE_NAMES.has(name)) {
        diagnostics.push({
          code: CASPIAN_W004.code,
          severity: CASPIAN_W004.severity,
          line: findKeyLine(raw, "type", startLine),
          field: "type",
          message: CASPIAN_W004.message,
        });
      }
    }
    // No colon → type is not in namespace:name form; E009 covers this in stage 4.
    // Stage 5 does NOT emit W002 for bare type values.
  }

  if ("schema_version" in data) {
    const v = data.schema_version;
    if (typeof v !== "string" || !SUPPORTED_SCHEMA_VERSIONS.has(v)) {
      const display = typeof v === "string" ? `\`${v}\`` : JSON.stringify(v);
      diagnostics.push({
        code: CASPIAN_W003.code,
        severity: CASPIAN_W003.severity,
        line: findKeyLine(raw, "schema_version", startLine),
        field: "schema_version",
        message: `${CASPIAN_W003.message}: ${display}.`,
      });
    }
  }

  return { diagnostics };
}
