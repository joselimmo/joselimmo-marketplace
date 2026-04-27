import type { Diagnostic } from "./diagnostics/types.js";
import { readFile } from "./parsers/byte-reader.js";
import { extractFrontmatter } from "./parsers/frontmatter.js";
import { parseYaml } from "./parsers/yaml.js";

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

  // TODO Story 2.4: stages 4–6 (envelope, namespace, allow-list).
  // Stage 3's `stage3.data` will be the input for stage 4.
  void stage3.data;

  return [];
}
