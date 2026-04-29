import { parseDocument, YAMLMap, YAMLSeq } from "yaml";
import {
  CASPIAN_E008,
  CASPIAN_E009,
  CASPIAN_E010,
  CASPIAN_E011,
  CASPIAN_E012,
  CASPIAN_E013,
  CASPIAN_E014,
} from "../diagnostics/codes.generated.js";
import type { Diagnostic } from "../diagnostics/types.js";
import { getEnvelopeValidator } from "../validator.js";

export interface EnvelopeValidateResult {
  diagnostics: Diagnostic[];
}

function byteOffsetToLine(text: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset; i++) {
    if (text[i] === "\n") line++;
  }
  return line;
}

function nodeLineFromPath(
  raw: string,
  startLine: number,
  instancePath: string,
  additionalProperty?: string,
): number {
  if (!instancePath) return startLine;

  const doc = parseDocument(raw, { strict: false, version: "1.2" });
  const parts = instancePath.split("/").filter(Boolean);
  if (additionalProperty) parts.push(additionalProperty);

  // biome-ignore lint/suspicious/noExplicitAny: CST traversal requires any
  let node: any = doc.contents;

  for (let i = 0; i < parts.length; i++) {
    if (node == null) return startLine;
    const part = parts[i] as string;

    if (node instanceof YAMLMap) {
      const pair = node.items.find(
        // biome-ignore lint/suspicious/noExplicitAny: CST traversal
        (p: any) => String(p.key?.value) === part,
      );
      if (!pair) return startLine;
      if (i === parts.length - 1) {
        node = pair.key;
      } else {
        node = pair.value;
      }
    } else if (node instanceof YAMLSeq) {
      const idx = parseInt(part, 10);
      if (Number.isNaN(idx)) return startLine;
      node = node.items[idx];
    } else {
      return startLine;
    }
  }

  if (node?.range) {
    return byteOffsetToLine(raw, node.range[0] as number) + startLine;
  }
  return startLine;
}

export async function validateEnvelope(
  data: Record<string, unknown> | null,
  raw: string,
  startLine: number,
): Promise<EnvelopeValidateResult> {
  if (data === null) {
    return {
      diagnostics: [
        {
          code: CASPIAN_E008.code,
          severity: CASPIAN_E008.severity,
          line: startLine,
          field: "type",
          message: CASPIAN_E008.message,
        },
      ],
    };
  }

  const validate = await getEnvelopeValidator();
  validate(data);
  const errors = validate.errors ?? [];

  const diagnostics: Diagnostic[] = [];
  const mappedPaths = new Set<string>();

  // First pass: precedence detection. If any /type error favors E008
  // (minLength or wrong-type), suppress E009 (pattern) regardless of
  // ajv error iteration order.
  const typeOwnedByE008 = errors.some(
    (e) =>
      e.instancePath === "/type" &&
      (e.keyword === "minLength" || e.keyword === "type"),
  );

  for (const err of errors) {
    const ip = err.instancePath;
    const kw = err.keyword;
    let matched = false;

    // E008: root missing required "type"
    if (
      ip === "" &&
      kw === "required" &&
      err.params?.missingProperty === "type"
    ) {
      matched = true;
      if (!mappedPaths.has("E008")) {
        mappedPaths.add("E008");
        diagnostics.push({
          code: CASPIAN_E008.code,
          severity: CASPIAN_E008.severity,
          line: nodeLineFromPath(raw, startLine, ip),
          field: "type",
          message: CASPIAN_E008.message,
        });
      }
    }

    // E008: type empty (minLength) or wrong type
    else if (ip === "/type" && (kw === "minLength" || kw === "type")) {
      matched = true;
      if (!mappedPaths.has("E008_type")) {
        mappedPaths.add("E008_type");
        diagnostics.push({
          code: CASPIAN_E008.code,
          severity: CASPIAN_E008.severity,
          line: nodeLineFromPath(raw, startLine, ip),
          field: "type",
          message: CASPIAN_E008.message,
        });
      }
    }

    // E009: type pattern mismatch — suppressed if any /type minLength|type error exists
    else if (ip === "/type" && kw === "pattern") {
      matched = true;
      if (!typeOwnedByE008 && !mappedPaths.has("E009")) {
        mappedPaths.add("E009");
        diagnostics.push({
          code: CASPIAN_E009.code,
          severity: CASPIAN_E009.severity,
          line: nodeLineFromPath(raw, startLine, ip),
          field: "type",
          message: CASPIAN_E009.message,
        });
      }
    }

    // E010: requires not array
    else if (ip === "/requires" && kw === "type") {
      matched = true;
      if (!mappedPaths.has("E010")) {
        mappedPaths.add("E010");
        diagnostics.push({
          code: CASPIAN_E010.code,
          severity: CASPIAN_E010.severity,
          line: nodeLineFromPath(raw, startLine, ip),
          field: "requires",
          message: CASPIAN_E010.message,
        });
      }
    }

    // E011: requires entry missing "type"
    else if (
      /^\/requires\/\d+$/.test(ip) &&
      kw === "required" &&
      err.params?.missingProperty === "type"
    ) {
      matched = true;
      const pathKey = `E011_${ip}`;
      if (!mappedPaths.has(pathKey)) {
        mappedPaths.add(pathKey);
        diagnostics.push({
          code: CASPIAN_E011.code,
          severity: CASPIAN_E011.severity,
          line: nodeLineFromPath(raw, startLine, ip),
          field: "requires",
          message: CASPIAN_E011.message,
        });
      }
    }

    // E012: requires entry has extra property
    else if (/^\/requires\/\d+$/.test(ip) && kw === "additionalProperties") {
      matched = true;
      const extraProp = err.params?.additionalProperty as string | undefined;
      const pathKey = `E012_${ip}_${extraProp ?? ""}`;
      if (!mappedPaths.has(pathKey)) {
        mappedPaths.add(pathKey);
        diagnostics.push({
          code: CASPIAN_E012.code,
          severity: CASPIAN_E012.severity,
          line: nodeLineFromPath(raw, startLine, ip, extraProp),
          field: "requires",
          message: CASPIAN_E012.message,
        });
      }
    }

    // E013: produces not object
    else if (ip === "/produces" && kw === "type") {
      matched = true;
      if (!mappedPaths.has("E013")) {
        mappedPaths.add("E013");
        diagnostics.push({
          code: CASPIAN_E013.code,
          severity: CASPIAN_E013.severity,
          line: nodeLineFromPath(raw, startLine, ip),
          field: "produces",
          message: CASPIAN_E013.message,
        });
      }
    }

    // E014: produces missing "type"
    else if (
      ip === "/produces" &&
      kw === "required" &&
      err.params?.missingProperty === "type"
    ) {
      matched = true;
      if (!mappedPaths.has("E014")) {
        mappedPaths.add("E014");
        diagnostics.push({
          code: CASPIAN_E014.code,
          severity: CASPIAN_E014.severity,
          line: nodeLineFromPath(raw, startLine, ip),
          field: "produces",
          message: CASPIAN_E014.message,
        });
      }
    }

    // Fallback: unmapped ajv error → emit E008 with diagnostic info per AC2
    // (deduped by ip+kw to avoid floods on degenerate inputs).
    if (!matched) {
      const fbKey = `E008_FB_${ip}_${kw}`;
      if (!mappedPaths.has(fbKey)) {
        mappedPaths.add(fbKey);
        diagnostics.push({
          code: CASPIAN_E008.code,
          severity: CASPIAN_E008.severity,
          line: nodeLineFromPath(raw, startLine, ip),
          message: `${CASPIAN_E008.message} (unmapped: instancePath=${ip || "/"}, keyword=${kw})`,
        });
      }
    }
  }

  return { diagnostics };
}
