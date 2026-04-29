import type { Diagnostic } from "@caspian-dev/core";

export interface FileResult {
  file: string;
  diagnostics: Diagnostic[];
}
