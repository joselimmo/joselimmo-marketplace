import { DIAGNOSTIC_DEFINITIONS } from "@caspian-dev/core/diagnostics";

const DOC_URL_BY_CODE: ReadonlyMap<string, string> = new Map(
  DIAGNOSTIC_DEFINITIONS.map((d) => [d.code, d.doc]),
);

export function getDocUrl(code: string): string | undefined {
  return DOC_URL_BY_CODE.get(code);
}
