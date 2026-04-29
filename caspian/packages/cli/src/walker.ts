import fs from "node:fs";
import path from "node:path";
import fastGlob from "fast-glob";

export interface WalkResult {
  files: string[];
  skippedOutsideCwd: string[];
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
    if (!fs.existsSync(input)) {
      throw new InputNotFoundError(input);
    }

    const stat = fs.statSync(input);
    if (stat.isDirectory()) {
      absoluteCandidates = await fastGlob.glob("**/*.md", {
        cwd: input,
        followSymbolicLinks: false,
        dot: false,
        onlyFiles: true,
        absolute: true,
      });
    } else {
      absoluteCandidates = [path.resolve(input)];
    }
  }

  const files: string[] = [];
  const skippedOutsideCwd: string[] = [];

  for (const absPath of absoluteCandidates) {
    let realpath: string;
    try {
      realpath = fs.realpathSync(absPath);
    } catch {
      skippedOutsideCwd.push(absPath);
      continue;
    }
    if (isUnderRoot(realpath, cwdRealpath)) {
      files.push(absPath);
    } else {
      skippedOutsideCwd.push(absPath);
    }
  }

  return { files, skippedOutsideCwd };
}
