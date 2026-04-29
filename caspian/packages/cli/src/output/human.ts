import type { Diagnostic, DiagnosticDefinition } from "@caspian-dev/core";
import * as diagnosticsModule from "@caspian-dev/core/diagnostics";
import { Chalk } from "chalk";

// Deterministic ANSI when caller passes useColor: true.
// Plain strings when useColor: false. We never rely on chalk's TTY auto-detect
// inside the formatter — the caller (commands/validate.ts) decides.
const colored = new Chalk({ level: 1 });

export interface FileResult {
  file: string;
  diagnostics: Diagnostic[];
}

export interface FormatOptions {
  useColor: boolean;
  skippedCount?: number;
}

const DOC_URL_BY_CODE: ReadonlyMap<string, string> = (() => {
  const map = new Map<string, string>();
  for (const value of Object.values(diagnosticsModule)) {
    if (
      value !== null &&
      typeof value === "object" &&
      "code" in value &&
      "doc" in value &&
      typeof (value as DiagnosticDefinition).code === "string" &&
      typeof (value as DiagnosticDefinition).doc === "string"
    ) {
      const def = value as DiagnosticDefinition;
      map.set(def.code, def.doc);
    }
  }
  return map;
})();

export function getDocUrl(code: string): string | undefined {
  return DOC_URL_BY_CODE.get(code);
}

const HINT_RE = /^(.*?)\. Did you mean `(.+?)`\?(?: See: .+)?$/;

interface ParsedMessage {
  message: string;
  suggestion: string | undefined;
}

function parseMessage(raw: string): ParsedMessage {
  const m = raw.match(HINT_RE);
  if (m && m[1] !== undefined && m[2] !== undefined) {
    return { message: m[1], suggestion: m[2] };
  }
  return { message: raw, suggestion: undefined };
}

function pluralize(n: number, singular: string): string {
  return n === 1 ? `${n} ${singular}` : `${n} ${singular}s`;
}

function colorSeverity(
  severity: Diagnostic["severity"],
  useColor: boolean,
): string {
  if (!useColor) return severity;
  return severity === "error"
    ? colored.red(severity)
    : colored.yellow(severity);
}

function colorFileHeading(file: string, useColor: boolean): string {
  return useColor ? colored.cyan(file) : file;
}

function colorFooter(
  text: string,
  errors: number,
  warnings: number,
  useColor: boolean,
): string {
  if (!useColor) return text;
  if (errors > 0) return colored.red(text);
  if (warnings > 0) return colored.yellow(text);
  return colored.green(text);
}

export function formatHuman(
  results: FileResult[],
  opts: FormatOptions,
): string {
  const { useColor } = opts;
  const blocks: string[] = [];

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const { file, diagnostics } of results) {
    const lines: string[] = [];
    lines.push(colorFileHeading(file, useColor));

    if (diagnostics.length === 0) {
      lines.push("  (no diagnostics)");
    } else {
      for (const d of diagnostics) {
        if (d.severity === "error") totalErrors++;
        else totalWarnings++;

        const parsed = parseMessage(d.message);
        const sevText = colorSeverity(d.severity, useColor);
        lines.push(
          `  ${file}:${d.line} — ${d.code} ${sevText}: ${parsed.message}`,
        );
        if (parsed.suggestion !== undefined) {
          lines.push(`    hint: Did you mean \`${parsed.suggestion}\`?`);
        }
        const docUrl = getDocUrl(d.code);
        if (docUrl !== undefined) {
          lines.push(`    doc: ${docUrl}`);
        }
      }
    }

    blocks.push(lines.join("\n"));
  }

  const filesPart = pluralize(results.length, "file");
  const errorsPart = pluralize(totalErrors, "error");
  const warningsPart = pluralize(totalWarnings, "warning");
  const skippedPart =
    (opts.skippedCount ?? 0) > 0 ? ` (${opts.skippedCount} skipped)` : "";
  const footerText = `${filesPart}${skippedPart}: ${errorsPart}, ${warningsPart}`;
  const footer = colorFooter(footerText, totalErrors, totalWarnings, useColor);

  // Inter-block: one blank line between blocks; one blank line before footer.
  return `${blocks.join("\n\n")}${blocks.length > 0 ? "\n\n" : ""}${footer}\n`;
}
