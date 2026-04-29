import fs from "node:fs";
import path from "node:path";
import fastGlob from "fast-glob";

export interface WalkResult {
  files: string[];
  skippedOutsideCwd: string[];
  skippedUnresolvable: string[];
}

export class InputNotFoundError extends Error {
  constructor(public readonly input: string) {
    super(`input not found: ${input}`);
    this.name = "InputNotFoundError";
  }
}

export class GlobNoMatchError extends Error {
  constructor(public readonly pattern: string) {
    super(`glob pattern matched no files: ${pattern}`);
    this.name = "GlobNoMatchError";
  }
}

export class EmptyDirectoryError extends Error {
  constructor(public readonly directory: string) {
    super(`directory contains no .md files: ${directory}`);
    this.name = "EmptyDirectoryError";
  }
}

const GLOB_META_RE = /[*?[\]{}()!]/;

function looksLikeGlob(input: string): boolean {
  return GLOB_META_RE.test(input);
}

function isUnderRoot(realpath: string, rootRealpath: string): boolean {
  if (realpath === rootRealpath) return true;
  return realpath.startsWith(rootRealpath + path.sep);
}

export async function walk(input: string, cwd: string): Promise<WalkResult> {
  const cwdRealpath = fs.realpathSync(cwd);

  let absoluteCandidates: string[];

  if (looksLikeGlob(input)) {
    const matched = await fastGlob.glob(input, {
      cwd,
      followSymbolicLinks: false,
      dot: false,
      onlyFiles: true,
      absolute: true,
    });
    if (matched.length === 0) {
      throw new GlobNoMatchError(input);
    }
    absoluteCandidates = matched;
  } else {
    // P4: single try/catch eliminates the existsSync+statSync TOCTOU race.
    let stat: fs.Stats;
    try {
      stat = fs.statSync(input);
    } catch {
      throw new InputNotFoundError(input);
    }

    if (stat.isDirectory()) {
      absoluteCandidates = await fastGlob.glob("**/*.md", {
        cwd: input,
        followSymbolicLinks: false,
        dot: false,
        onlyFiles: true,
        absolute: true,
      });
      // P11: align with glob zero-match behaviour — exit 2 for empty directories.
      if (absoluteCandidates.length === 0) {
        throw new EmptyDirectoryError(input);
      }
    } else {
      absoluteCandidates = [path.resolve(input)];
    }
  }

  const files: string[] = [];
  const skippedOutsideCwd: string[] = [];
  // P6: separate bucket for paths that realpathSync cannot resolve (broken
  // symlinks, EACCES, ELOOP) so callers can emit a distinct, accurate message.
  const skippedUnresolvable: string[] = [];

  for (const absPath of absoluteCandidates) {
    let realpath: string;
    try {
      realpath = fs.realpathSync(absPath);
    } catch {
      skippedUnresolvable.push(absPath);
      continue;
    }
    if (isUnderRoot(realpath, cwdRealpath)) {
      files.push(absPath);
    } else {
      skippedOutsideCwd.push(absPath);
    }
  }

  return { files, skippedOutsideCwd, skippedUnresolvable };
}
