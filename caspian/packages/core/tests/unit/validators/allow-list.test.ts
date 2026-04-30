import { describe, expect, it } from "vitest";
import { scanAllowList } from "../../../src/validators/allow-list.js";

describe("scanAllowList — stage 6", () => {
  it("no W001 for a recognized field", () => {
    const raw = "type: core:overview\nname: my-skill\n";
    const { diagnostics } = scanAllowList(raw, 1);
    expect(diagnostics).toHaveLength(0);
  });

  it("no W001 for all 22 recognized fields", () => {
    const raw = `${[
      'schema_version: "0.1"',
      "type: core:overview",
      "name: x",
      "description: x",
      "license: Apache-2.0",
      "allowed-tools:",
      "  - Read",
      "metadata: {}",
      "compatibility: {}",
      "when_to_use: x",
      "argument-hint: x",
      "arguments: []",
      'disable-model-invocation: "false"',
      'user-invocable: "true"',
      "model: x",
      "effort: low",
      "context: []",
      "agent: x",
      "hooks: {}",
      "paths: []",
      'shell: "false"',
    ].join("\n")}\n`;
    const { diagnostics } = scanAllowList(raw, 1);
    expect(diagnostics).toHaveLength(0);
  });

  it("no W001 for x-* prefixed field", () => {
    const raw = "type: core:overview\nx-custom: value\n";
    const { diagnostics } = scanAllowList(raw, 1);
    expect(diagnostics).toHaveLength(0);
  });

  it("W001 for unknown field — reports correct line", () => {
    // Matches fixture W001-unknown-field/typo-metadat.md
    const raw = "type: core:overview\nmetadat: {}\n";
    const { diagnostics } = scanAllowList(raw, 1);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe("CASPIAN-W001");
    expect(diagnostics[0]?.line).toBe(3);
  });

  it("W001 for unknown field — message includes suggestion for close match", () => {
    const raw = "type: core:overview\nmetadat: {}\n";
    const { diagnostics } = scanAllowList(raw, 1);
    expect(diagnostics[0]?.message).toContain("Did you mean `metadata`?");
  });

  it("W001 for vendor-colon-namespaced key (sealed fixture behavior)", () => {
    // Matches fixture W001-unknown-field/vendor-namespaced.md
    const raw =
      "type: core:overview\nexamples:custom-field: vendor-defined-value\n";
    const { diagnostics } = scanAllowList(raw, 1);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe("CASPIAN-W001");
    expect(diagnostics[0]?.line).toBe(3);
  });

  it("W001 message has no suggestion for unrelated field name", () => {
    const raw = "type: core:overview\nzzz: value\n";
    const { diagnostics } = scanAllowList(raw, 1);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe("CASPIAN-W001");
    expect(diagnostics[0]?.message).not.toContain("Did you mean");
  });

  it("no W001 when raw frontmatter is not a MAP", () => {
    const raw = "- item1\n- item2\n";
    const { diagnostics } = scanAllowList(raw, 1);
    expect(diagnostics).toHaveLength(0);
  });
});
