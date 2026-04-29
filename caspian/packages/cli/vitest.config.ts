import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: here,
  test: {
    include: ["tests/**/*.test.ts"],
    passWithNoTests: true,
    // Both integration test files run `pnpm -F @caspian-dev/cli build` in
    // their beforeAll hook (Story 2.6 review patch P7). Vitest's default
    // file-parallelism races those two builds on Windows, surfacing as
    // `Error: spawn UNKNOWN` / `ERR_IPC_CHANNEL_CLOSED` in the tinypool
    // worker. Serial file execution costs ~25s vs ~8s but eliminates the
    // race deterministically. Story 2.7.
    fileParallelism: false,
  },
});
