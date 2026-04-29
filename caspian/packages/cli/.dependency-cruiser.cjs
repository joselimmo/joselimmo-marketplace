/**
 * Vendor-neutrality boundary — layer 1 (source-level).
 *
 * Forbids any static, type-only, or statically-resolvable dynamic import edge
 * from `@caspian-dev/{core,cli}` source into a `@anthropic-ai/*` or `@claude/*`
 * node_modules path. Layer 2 (lockfile audit) and layer 3 (docker runtime gate)
 * cover transitive and execution-level vendor neutrality respectively. See
 * architecture.md:715-721 for the full 3-layer rationale.
 *
 * Story 2.7. Dep-cruiser config files are CommonJS by tooling convention.
 */
module.exports = {
  forbidden: [
    {
      name: "no-vendor-coupling",
      severity: "error",
      comment:
        "@caspian-dev/{core,cli} MUST NOT import from any @anthropic-ai/* or @claude/* package — vendor-neutrality boundary (FR11, NFR17). See architecture.md:715-721.",
      from: { path: "^packages/(core|cli)/src" },
      to: { path: "^node_modules/(@anthropic-ai|@claude)" },
    },
  ],
  options: {
    tsConfig: { fileName: "tsconfig.base.json" },
    tsPreCompilationDeps: true,
    doNotFollow: { path: "node_modules" },
    exclude: { path: "(^|/)(dist|node_modules|tests|fixtures|conformance)/" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
    },
  },
};
