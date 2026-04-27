import type { Pair, Scalar } from "yaml";
import { isScalar, parseDocument, YAMLParseError } from "yaml";
import { YAML_1_1_UNQUOTED_BOOLEANS } from "../constants.js";
import {
  CASPIAN_E003,
  CASPIAN_E006,
  CASPIAN_E007,
} from "../diagnostics/codes.generated.js";
import type { Diagnostic } from "../diagnostics/types.js";

export interface YamlParseResult {
  data: Record<string, unknown> | null;
  diagnostics: Diagnostic[];
}

function offsetToRawLine(raw: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset && i < raw.length; i++) {
    if (raw[i] === "\n") line++;
  }
  return line;
}

function scanTabIndent(
  raw: string,
  frontmatterStartLine: number,
): Diagnostic | null {
  const lines = raw.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const ch of line) {
      if (ch === "\t") {
        return {
          code: CASPIAN_E003.code,
          severity: CASPIAN_E003.severity,
          line: frontmatterStartLine + (i + 1),
          message: CASPIAN_E003.message,
        };
      }
      if (ch !== " ") break;
    }
  }
  return null;
}

function emitE006(line: number): Diagnostic {
  return {
    code: CASPIAN_E006.code,
    severity: CASPIAN_E006.severity,
    line,
    message: CASPIAN_E006.message,
  };
}

export function parseYaml(
  raw: string,
  frontmatterStartLine: number,
): YamlParseResult {
  const tabDiag = scanTabIndent(raw, frontmatterStartLine);
  if (tabDiag !== null) {
    return { data: null, diagnostics: [tabDiag] };
  }

  let doc: ReturnType<typeof parseDocument>;
  try {
    doc = parseDocument(raw, { strict: true, version: "1.2" });
  } catch (err) {
    const yamlLine =
      err instanceof YAMLParseError && err.linePos !== undefined
        ? err.linePos[0].line
        : 1;
    return {
      data: null,
      diagnostics: [emitE006(frontmatterStartLine + yamlLine)],
    };
  }

  if (doc.errors.length > 0) {
    const firstErr = doc.errors[0];
    const yamlLine = firstErr.linePos?.[0]?.line ?? 1;
    return {
      data: null,
      diagnostics: [emitE006(frontmatterStartLine + yamlLine)],
    };
  }

  // NFR5 — unresolved/custom tags (e.g., `!!js/function`, `!!python/object:`)
  // are flagged by yaml v2.x as TAG_RESOLVE_FAILED warnings rather than parse
  // errors, but Caspian rejects them at the validator level to prevent any
  // future custom-tag attack vector. Emit E006 with the warning's line.
  const tagWarning = doc.warnings.find((w) => w.code === "TAG_RESOLVE_FAILED");
  if (tagWarning !== undefined) {
    const yamlLine = tagWarning.linePos?.[0]?.line ?? 1;
    return {
      data: null,
      diagnostics: [emitE006(frontmatterStartLine + yamlLine)],
    };
  }

  const diagnostics: Diagnostic[] = [];
  const contents = doc.contents;
  if (
    contents !== null &&
    typeof contents === "object" &&
    "items" in contents
  ) {
    const items = (contents as { items: Pair[] }).items;
    for (const pair of items) {
      const valueNode = pair.value;
      if (
        valueNode !== null &&
        valueNode !== undefined &&
        isScalar(valueNode) &&
        (valueNode as Scalar).type === "PLAIN" &&
        typeof (valueNode as Scalar).value === "string"
      ) {
        const scalarValue = (valueNode as Scalar).value as string;
        const lower = scalarValue.toLowerCase();
        if (YAML_1_1_UNQUOTED_BOOLEANS.has(lower)) {
          const range = (valueNode as Scalar).range;
          const startOffset =
            range !== null && range !== undefined ? range[0] : 0;
          const yamlLine = offsetToRawLine(raw, startOffset);
          diagnostics.push({
            code: CASPIAN_E007.code,
            severity: CASPIAN_E007.severity,
            line: frontmatterStartLine + yamlLine,
            message: CASPIAN_E007.message,
          });
        }
      }
    }
  }

  const data = doc.toJS() as Record<string, unknown> | null;
  return { data, diagnostics };
}
