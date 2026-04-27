export type Severity = "error" | "warning";

export interface Diagnostic {
  code: string;
  severity: Severity;
  line: number;
  field?: string;
  message: string;
}

export interface DiagnosticDefinition {
  code: string;
  severity: Severity;
  rule: string;
  message: string;
  doc: string;
}

export interface ValidationResult {
  file: string;
  valid: boolean;
  diagnostics: Diagnostic[];
}
