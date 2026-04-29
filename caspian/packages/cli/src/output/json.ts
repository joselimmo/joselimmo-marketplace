import type { Diagnostic } from "@caspian-dev/core";
import { getDocUrl } from "./doc-url.js";
import type { FileResult } from "./types.js";

interface JsonDiagnostic {
  code: string;
  severity: "error" | "warning";
  line: number;
  field?: string;
  message: string;
  doc?: string;
}

interface JsonResult {
  file: string;
  valid: boolean;
  diagnostics: readonly JsonDiagnostic[];
}

interface JsonSummary {
  files: number;
  errors: number;
  warnings: number;
}

export interface JsonOutput {
  schemaVersion: "1";
  results: ReadonlyArray<JsonResult>;
  summary: JsonSummary;
}

function toJsonDiagnostic(d: Diagnostic): JsonDiagnostic {
  // Insertion order: code → severity → line → field? → message → doc?.
  // Build the object with explicit key order; conditional spreads omit absent
  // optional fields entirely (no null, no empty string).
  const doc = getDocUrl(d.code);
  const out: JsonDiagnostic = {
    code: d.code,
    severity: d.severity,
    line: d.line,
    // AC6: field is omitted when absent OR empty-string (Diagnostic.field is
    // string | undefined; an empty string is treated as absent per spec).
    ...(d.field !== undefined && d.field !== "" ? { field: d.field } : {}),
    message: d.message,
    ...(doc !== undefined ? { doc } : {}),
  };
  return out;
}

export function formatJson(results: FileResult[]): string {
  let totalErrors = 0;
  let totalWarnings = 0;

  const jsonResults: JsonResult[] = results.map(({ file, diagnostics }) => {
    let fileHasError = false;
    const jsonDiagnostics: JsonDiagnostic[] = diagnostics.map((d) => {
      if (d.severity === "error") {
        totalErrors++;
        fileHasError = true;
      } else {
        totalWarnings++;
      }
      return toJsonDiagnostic(d);
    });

    // Insertion order: file → valid → diagnostics.
    return {
      file,
      valid: !fileHasError,
      diagnostics: jsonDiagnostics,
    };
  });

  // Insertion order: schemaVersion → results → summary; summary keys: files →
  // errors → warnings.
  const out: JsonOutput = {
    schemaVersion: "1",
    results: jsonResults,
    summary: {
      files: jsonResults.length,
      errors: totalErrors,
      warnings: totalWarnings,
    },
  };

  return `${JSON.stringify(out, null, 2)}\n`;
}
