import { describe, expect, it } from "vitest";
import { parseYaml } from "../../../src/parsers/yaml.js";

describe("yaml parser (stage 3)", () => {
  it("happy-path — clean key-value parses without diagnostics", () => {
    const result = parseYaml("type: core:overview\n", 1);

    expect(result.diagnostics).toEqual([]);
    expect(result.data).toEqual({ type: "core:overview" });
  });

  it("E003 — leading tab on raw line 1 emits CASPIAN-E003 with line = startLine + 1", () => {
    const result = parseYaml("\ttype: core:overview\n", 1);

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe("CASPIAN-E003");
    expect(result.diagnostics[0].line).toBe(2);
  });

  it("E003 — tab on raw line 3 emits line = startLine + 3 (matches fixture E003 expected line 4)", () => {
    const raw = "type: core:plan\nrequires:\n\t- type: core:story\n";
    const result = parseYaml(raw, 1);

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe("CASPIAN-E003");
    expect(result.diagnostics[0].line).toBe(4);
  });

  it("E006 — unclosed flow sequence emits CASPIAN-E006", () => {
    const raw = "type: core:plan\nrequires: [{type: core:story\n";
    const result = parseYaml(raw, 1);

    expect(result.diagnostics.some((d) => d.code === "CASPIAN-E006")).toBe(
      true,
    );
    expect(result.data).toBeNull();
  });

  it("E006 — unsupported custom tag is rejected as parse error (NFR5 safe-load)", () => {
    const raw = 'key: !!js/function "function() {}"\n';
    const result = parseYaml(raw, 1);

    expect(result.diagnostics.some((d) => d.code === "CASPIAN-E006")).toBe(
      true,
    );
  });

  it("E007 — `enabled: yes` (unquoted YAML 1.1 boolean) emits CASPIAN-E007", () => {
    const raw = "enabled: yes\n";
    const result = parseYaml(raw, 1);

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe("CASPIAN-E007");
    expect(result.diagnostics[0].line).toBe(2);
  });

  it("E007 — case-insensitive (`YES`) also emits CASPIAN-E007", () => {
    const raw = "enabled: YES\n";
    const result = parseYaml(raw, 1);

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe("CASPIAN-E007");
  });

  it("E007 — multiple unquoted booleans emit multiple diagnostics in one pass", () => {
    const raw = "enabled: yes\ndisabled: no\n";
    const result = parseYaml(raw, 1);

    const e007s = result.diagnostics.filter((d) => d.code === "CASPIAN-E007");
    expect(e007s).toHaveLength(2);
    expect(e007s[0].line).toBe(2);
    expect(e007s[1].line).toBe(3);
  });

  it('no false positive — quoted `"yes"` does NOT emit E007', () => {
    const raw = 'enabled: "yes"\n';
    const result = parseYaml(raw, 1);

    expect(result.diagnostics).toEqual([]);
  });

  it("no false positive — actual `true` does NOT emit E007", () => {
    const raw = "enabled: true\n";
    const result = parseYaml(raw, 1);

    expect(result.diagnostics).toEqual([]);
    expect(result.data).toEqual({ enabled: true });
  });

  it("E007 — all 6 keywords (on/off/yes/no/y/n) trigger the diagnostic", () => {
    const raw = "a: on\nb: off\nc: yes\nd: no\ne: y\nf: n\n";
    const result = parseYaml(raw, 1);

    const e007s = result.diagnostics.filter((d) => d.code === "CASPIAN-E007");
    expect(e007s).toHaveLength(6);
  });
});
