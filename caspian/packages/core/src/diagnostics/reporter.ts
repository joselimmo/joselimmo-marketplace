import type { Diagnostic } from "./types.js";

export interface Reporter {
  report(diagnostics: Diagnostic[], filePath: string): void;
}
