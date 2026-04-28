import { describe, expect, it } from "vitest";
import { checkNamespace } from "../../../src/validators/namespace.js";

describe("checkNamespace — stage 5", () => {
  it("no warnings for valid core type", () => {
    const raw = "type: core:overview\n";
    const { diagnostics } = checkNamespace({ type: "core:overview" }, raw, 1);
    expect(diagnostics).toHaveLength(0);
  });

  it("no warnings when schema_version is absent", () => {
    const raw = "type: core:plan\n";
    const { diagnostics } = checkNamespace({ type: "core:plan" }, raw, 1);
    expect(diagnostics).toHaveLength(0);
  });

  it("no warnings when schema_version is recognized", () => {
    const raw = 'schema_version: "0.1"\ntype: core:overview\n';
    const { diagnostics } = checkNamespace(
      { schema_version: "0.1", type: "core:overview" },
      raw,
      1,
    );
    expect(diagnostics).toHaveLength(0);
  });

  it("W002 — non-core namespace: reports line 2", () => {
    // Matches fixture W002-non-core-namespace/bmad-epic.md
    const raw = "type: bmad:epic\n";
    const { diagnostics } = checkNamespace({ type: "bmad:epic" }, raw, 1);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe("CASPIAN-W002");
    expect(diagnostics[0]?.line).toBe(2);
  });

  it("W003 — unrecognized schema_version: reports line 2", () => {
    // Matches fixture W003-unrecognized-schema-version/version-9-9.md
    const raw = 'schema_version: "9.9"\ntype: core:overview\n';
    const { diagnostics } = checkNamespace(
      { schema_version: "9.9", type: "core:overview" },
      raw,
      1,
    );
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe("CASPIAN-W003");
    expect(diagnostics[0]?.line).toBe(2);
  });

  it("W004 — unrecognized core name: reports line 2", () => {
    // Matches fixture W004-non-canonical-core-name/non-canonical-name.md
    const raw = "type: core:nonexistent\n";
    const { diagnostics } = checkNamespace(
      { type: "core:nonexistent" },
      raw,
      1,
    );
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe("CASPIAN-W004");
    expect(diagnostics[0]?.line).toBe(2);
  });

  it("no W002 for bare type (no colon) — E009 covers that", () => {
    const raw = "type: epic\n";
    const { diagnostics } = checkNamespace({ type: "epic" }, raw, 1);
    expect(diagnostics).toHaveLength(0);
  });

  it("W004 for multi-colon core type (core:story:v2)", () => {
    const raw = "type: core:story:v2\n";
    const { diagnostics } = checkNamespace({ type: "core:story:v2" }, raw, 1);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe("CASPIAN-W004");
    expect(diagnostics[0]?.line).toBe(2);
  });

  it("no warnings when data is null", () => {
    const { diagnostics } = checkNamespace(null, "type: core:overview\n", 1);
    expect(diagnostics).toHaveLength(0);
  });

  it("all recognized core names produce no W004", () => {
    const coreNames = [
      "overview",
      "plan",
      "learning",
      "review",
      "rule",
      "scratch",
      "convention",
      "story",
      "epic",
      "adr",
    ];
    for (const name of coreNames) {
      const raw = `type: core:${name}\n`;
      const { diagnostics } = checkNamespace({ type: `core:${name}` }, raw, 1);
      expect(diagnostics).toHaveLength(0);
    }
  });
});
