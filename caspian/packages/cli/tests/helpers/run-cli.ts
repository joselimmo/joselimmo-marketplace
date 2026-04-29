import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { CLI_DIST_BIN, REPO_ROOT } from "./paths.js";

const execFileAsync = promisify(execFile);

export interface CliResult {
  stdout: string;
  stderr: string;
  code: number;
}

export async function runCli(
  args: string[],
  env: Record<string, string> = {},
): Promise<CliResult> {
  try {
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [CLI_DIST_BIN, ...args],
      {
        cwd: REPO_ROOT,
        env: { ...process.env, ...env },
        maxBuffer: 5 * 1024 * 1024,
      },
    );
    return { stdout, stderr, code: 0 };
  } catch (err) {
    const e = err as {
      stdout?: string;
      stderr?: string;
      code?: number | null;
    };
    return {
      stdout: e.stdout ?? "",
      stderr: e.stderr ?? "",
      code: typeof e.code === "number" ? e.code : 1,
    };
  }
}
