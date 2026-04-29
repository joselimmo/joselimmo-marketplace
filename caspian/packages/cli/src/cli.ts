#!/usr/bin/env node

import { Command, CommanderError } from "commander";
import { runValidate } from "./commands/validate.js";
import {
  EXIT_INTERNAL,
  EXIT_OK,
  EXIT_USAGE,
  REPO_ISSUE_URL,
} from "./constants.js";
import { VERSION } from "./version.generated.js";

async function main(): Promise<number> {
  if (process.env.CASPIAN_CLI_FORCE_THROW === "1") {
    throw new Error("synthetic forced throw for AC7 integration test");
  }

  const program = new Command();
  program
    .name("caspian")
    .description(
      "Caspian CLI validator — vendor-neutral conformance checker for the Composable Agent Skill Protocol.",
    )
    .version(VERSION, "--version", "print the CLI version")
    .exitOverride();

  let exitCode: number = EXIT_OK;

  program
    .command("validate")
    .description(
      "validate a file, directory, or glob pattern (recurses *.md files in directories)",
    )
    .argument("<path>", "file, directory, or glob pattern")
    .option("-f, --format <mode>", "output format (human | json)", "human")
    .exitOverride()
    .action(async (inputPath: string, options: { format: string }) => {
      exitCode = await runValidate(inputPath, {
        format: options.format as "human" | "json",
      });
    });

  await program.parseAsync(process.argv);
  return exitCode;
}

function isCommanderError(err: unknown): err is CommanderError {
  return err instanceof CommanderError;
}

try {
  const code = await main();
  process.exit(code);
} catch (err) {
  if (isCommanderError(err)) {
    if (
      err.code === "commander.helpDisplayed" ||
      err.code === "commander.help"
    ) {
      process.exit(EXIT_OK);
    }
    if (err.code === "commander.version") {
      process.exit(EXIT_OK);
    }
    // Commander already printed its own usage error to stderr; add the help hint.
    process.stderr.write("Run 'caspian validate --help' for usage.\n");
    process.exit(EXIT_USAGE);
  }

  const e = err as Error;
  process.stderr.write(`internal validator error: ${e.message}\n`);
  if (e.stack) {
    process.stderr.write(`${e.stack}\n`);
  }
  process.stderr.write(`Please report at ${REPO_ISSUE_URL}\n`);
  process.exit(EXIT_INTERNAL);
}
