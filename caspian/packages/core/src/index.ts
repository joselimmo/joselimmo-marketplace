import fs from "node:fs/promises";
import type { Diagnostic } from "./diagnostics/types.js";
import { getEnvelopeValidator } from "./validator.js";

export async function validateFile(filePath: string): Promise<Diagnostic[]> {
  await fs.access(filePath);
  await getEnvelopeValidator();
  return [];
}

export type {
  Diagnostic,
  Severity,
  ValidationResult,
} from "./diagnostics/types.js";
