import type { Diagnostic } from "./diagnostics/types.js";
import { readFile } from "./parsers/byte-reader.js";
import { extractFrontmatter } from "./parsers/frontmatter.js";
import { parseYaml } from "./parsers/yaml.js";
import { scanAllowList } from "./validators/allow-list.js";
import { validateEnvelope } from "./validators/envelope.js";
import { checkNamespace } from "./validators/namespace.js";

export async function runPipeline(filePath: string): Promise<Diagnostic[]> {
  const stage1 = await readFile(filePath);
  if (stage1.diagnostics.length > 0) {
    return stage1.diagnostics;
  }

  const stage2 = extractFrontmatter(stage1.text);
  if (stage2.diagnostics.length > 0) {
    return stage2.diagnostics;
  }

  const stage3 = parseYaml(stage2.raw, stage2.startLine);
  if (stage3.diagnostics.length > 0) {
    return stage3.diagnostics;
  }

  const stage4 = await validateEnvelope(
    stage3.data,
    stage2.raw,
    stage2.startLine,
  );
  const stage5 = checkNamespace(stage3.data, stage2.raw, stage2.startLine);
  const stage6 = scanAllowList(stage2.raw, stage2.startLine);

  return [...stage4.diagnostics, ...stage5.diagnostics, ...stage6.diagnostics];
}
