import { describe, expect, it } from "vitest";
import { validateEnvelope } from "../../../src/validators/envelope.js";

// Helper: build a raw frontmatter string from lines (adds surrounding ---)
// The raw passed to validateEnvelope is the content BETWEEN the --- delimiters (no --- lines).
// startLine is 1 (opening --- on line 1).

describe("validateEnvelope — stage 4", () => {
  it("valid envelope: returns empty diagnostics", async () => {
    const raw = "type: core:overview\n";
    const data = { type: "core:overview" };
    const { diagnostics } = await validateEnvelope(data, raw, 1);
    expect(diagnostics).toHaveLength(0);
  });

  it("valid envelope with requires + produces: returns empty diagnostics", async () => {
    const raw =
      'schema_version: "0.1"\ntype: core:plan\nrequires:\n  - type: core:story\nproduces:\n  type: core:plan\n';
    const data = {
      schema_version: "0.1",
      type: "core:plan",
      requires: [{ type: "core:story" }],
      produces: { type: "core:plan" },
    };
    const { diagnostics } = await validateEnvelope(data, raw, 1);
    expect(diagnostics).toHaveLength(0);
  });

  it("E008 — type missing: reports line 1", async () => {
    // Matches fixture E008-type-missing/no-type.md
    const raw = "name: artifact-without-type\n";
    const data = { name: "artifact-without-type" };
    const { diagnostics } = await validateEnvelope(data, raw, 1);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe("CASPIAN-E008");
    expect(diagnostics[0]?.line).toBe(1);
  });

  it("E008 — data is null: returns E008 at startLine", async () => {
    const { diagnostics } = await validateEnvelope(
      null,
      "type: core:overview\n",
      1,
    );
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe("CASPIAN-E008");
    expect(diagnostics[0]?.line).toBe(1);
  });

  it("E009 — type not in namespace:name form: reports line 2", async () => {
    // Matches fixture E009-type-not-namespaced/bare-name.md
    const raw = "type: epic\n";
    const data = { type: "epic" };
    const { diagnostics } = await validateEnvelope(data, raw, 1);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe("CASPIAN-E009");
    expect(diagnostics[0]?.line).toBe(2);
  });

  it("E010 — requires not array: reports line 3", async () => {
    // Matches fixture E010-requires-not-array/string-instead.md
    const raw = 'type: core:plan\nrequires: "core:story"\n';
    const data = { type: "core:plan", requires: "core:story" };
    const { diagnostics } = await validateEnvelope(data, raw, 1);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe("CASPIAN-E010");
    expect(diagnostics[0]?.line).toBe(3);
  });

  it("E011 — requires entry missing type: reports line 4", async () => {
    // Matches fixture E011-requires-entry-missing-type/missing-type-key.md
    const raw = 'type: core:plan\nrequires:\n  - tags: ["ready-for-dev"]\n';
    const data = {
      type: "core:plan",
      requires: [{ tags: ["ready-for-dev"] }],
    };
    const { diagnostics } = await validateEnvelope(data, raw, 1);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe("CASPIAN-E011");
    expect(diagnostics[0]?.line).toBe(4);
  });

  it("E012 — requires entry invalid shape (extra property): reports line 5", async () => {
    // Matches fixture E012-requires-invalid-shape/extra-property.md
    const raw =
      "type: core:plan\nrequires:\n  - type: core:story\n    weight: 5\n";
    const data = {
      type: "core:plan",
      requires: [{ type: "core:story", weight: 5 }],
    };
    const { diagnostics } = await validateEnvelope(data, raw, 1);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe("CASPIAN-E012");
    expect(diagnostics[0]?.line).toBe(5);
  });

  it("E013 — produces not object: reports line 3", async () => {
    // Matches fixture E013-produces-not-object/array-instead.md
    const raw = "type: core:plan\nproduces: [core:plan]\n";
    const data = { type: "core:plan", produces: ["core:plan"] };
    const { diagnostics } = await validateEnvelope(data, raw, 1);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe("CASPIAN-E013");
    expect(diagnostics[0]?.line).toBe(3);
  });

  it("E014 — produces missing type: reports line 3", async () => {
    // Matches fixture E014-produces-missing-type/empty-object.md
    const raw = "type: core:plan\nproduces: {}\n";
    const data = { type: "core:plan", produces: {} };
    const { diagnostics } = await validateEnvelope(data, raw, 1);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe("CASPIAN-E014");
    expect(diagnostics[0]?.line).toBe(3);
  });

  it("E008 not duplicated by E009 when type is empty", async () => {
    // type: "" triggers both minLength (E008) and pattern (E009) in ajv
    // Only E008 should be emitted (takes precedence)
    const raw = 'type: ""\n';
    const data = { type: "" };
    const { diagnostics } = await validateEnvelope(data, raw, 1);
    const codes = diagnostics.map((d) => d.code);
    expect(codes).toContain("CASPIAN-E008");
    expect(codes).not.toContain("CASPIAN-E009");
  });
});
