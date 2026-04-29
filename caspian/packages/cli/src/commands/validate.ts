import path from "node:path";
import { validateFile } from "@caspian-dev/core";
import { supportsColorStderr } from "chalk";
import { EXIT_ERROR, EXIT_OK, EXIT_USAGE } from "../constants.js";
import { type FileResult, formatHuman } from "../output/human.js";
import {
  GlobNoMatchError,
  InputNotFoundError,
  type WalkResult,
  walk,
} from "../walker.js";

function toDisplayPath(absolutePath: string, cwd: string): string {
  // Normalize both sides to forward slashes so the prefix check works on
  // Windows where process.cwd() may use \ but fast-glob returns /.
  const absFwd = absolutePath.split(path.sep).join("/").replace(/\\/g, "/");
  const cwdFwd = cwd.split(path.sep).join("/").replace(/\\/g, "/");
  if (absFwd === cwdFwd || absFwd.startsWith(`${cwdFwd}/`)) {
    return absFwd.slice(cwdFwd.length + 1);
  }
  return absFwd;
}

export async function runValidate(input: string): Promise<number> {
  const cwd = process.cwd();

  let walkResult: WalkResult;
  try {
    walkResult = await walk(input, cwd);
  } catch (err) {
    if (err instanceof InputNotFoundError) {
      process.stderr.write(`error: input not found: ${err.input}\n`);
      process.stderr.write("Run 'caspian validate --help' for usage.\n");
      return EXIT_USAGE;
    }
    if (err instanceof GlobNoMatchError) {
      process.stderr.write(
        `error: glob pattern matched no files: ${err.pattern}\n`,
      );
      process.stderr.write("Run 'caspian validate --help' for usage.\n");
      return EXIT_USAGE;
    }
    throw err;
  }

  for (const skipped of walkResult.skippedOutsideCwd) {
    process.stderr.write(
      `Skipped: ${toDisplayPath(skipped, cwd)} resolves outside the working directory\n`,
    );
  }

  const fileResults: FileResult[] = await Promise.all(
    walkResult.files.map(async (absPath): Promise<FileResult> => {
      const diagnostics = await validateFile(absPath);
      return { file: toDisplayPath(absPath, cwd), diagnostics };
    }),
  );

  // useColor honors NO_COLOR / FORCE_COLOR / TTY via chalk's supportsColor
  // detection. We use supportsColorStderr as a proxy (stdout-equivalent flag
  // is not separately exported by chalk v5; in practice the two agree on
  // env-driven overrides like FORCE_COLOR=1 / NO_COLOR=1).
  const useColor =
    process.stdout.isTTY === true ||
    (typeof supportsColorStderr === "object" &&
      supportsColorStderr !== null &&
      Boolean((supportsColorStderr as { hasBasic?: boolean }).hasBasic));
  const out = formatHuman(fileResults, { useColor });
  process.stdout.write(out);

  const hasError = fileResults.some((r) =>
    r.diagnostics.some((d) => d.severity === "error"),
  );
  return hasError ? EXIT_ERROR : EXIT_OK;
}
