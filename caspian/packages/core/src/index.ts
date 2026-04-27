import type { Diagnostic } from "./diagnostics/types.js";
import { runPipeline } from "./pipeline.js";

export async function validateFile(filePath: string): Promise<Diagnostic[]> {
  return runPipeline(filePath);
}

export type {
  Diagnostic,
  DiagnosticDefinition,
  Severity,
  ValidationResult,
} from "./diagnostics/types.js";
