import path from "node:path";
import { validateFile } from "@caspian-dev/core";
import { supportsColor } from "chalk";
import { EXIT_ERROR, EXIT_OK, EXIT_USAGE } from "../constants.js";
import { type FileResult, formatHuman } from "../output/human.js";
import {
  EmptyDirectoryError,
  GlobNoMatchError,
  InputNotFoundError,
  type WalkResult,
  walk,
} from "../walker.js";

function toDisplayPath(absolutePath: string, cwd: string): string {
  // Normalize to forward slashes for cross-platform stable display paths.
  const absFwd = absolutePath.split(path.sep).join("/");
  const cwdFwd = cwd.split(path.sep).join("/");
  // P3: guard the edge case where the path is the cwd itself.
  if (absFwd === cwdFwd) return ".";
  if (absFwd.startsWith(`${cwdFwd}/`)) {
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
    // P11: empty directory treated the same as a glob that matches nothing.
    if (err instanceof EmptyDirectoryError) {
      process.stderr.write(
        `error: directory contains no .md files: ${err.directory}\n`,
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
  // P6: distinct message for paths realpathSync could not resolve.
  for (const skipped of walkResult.skippedUnresolvable) {
    process.stderr.write(
      `Skipped: ${toDisplayPath(skipped, cwd)} (unresolvable path — broken symlink or I/O error)\n`,
    );
  }

  const fileResults: FileResult[] = await Promise.all(
    walkResult.files.map(async (absPath): Promise<FileResult> => {
      const diagnostics = await validateFile(absPath);
      return { file: toDisplayPath(absPath, cwd), diagnostics };
    }),
  );

  // P2: use chalk's stdout-facing supportsColor (honors NO_COLOR, FORCE_COLOR,
  // and isTTY without the stderr-proxy mismatch).
  const useColor =
    typeof supportsColor === "object" &&
    supportsColor !== null &&
    Boolean((supportsColor as { hasBasic?: boolean }).hasBasic);

  // P10: include skipped-file count in the summary footer.
  const skippedCount =
    walkResult.skippedOutsideCwd.length + walkResult.skippedUnresolvable.length;

  const out = formatHuman(fileResults, { useColor, skippedCount });
  process.stdout.write(out);

  const hasError = fileResults.some((r) =>
    r.diagnostics.some((d) => d.severity === "error"),
  );
  return hasError ? EXIT_ERROR : EXIT_OK;
}
