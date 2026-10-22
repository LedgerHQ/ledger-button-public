#!/usr/bin/env node

const { spawnSync } = require("node:child_process");

const SHARED_OPTIONS = new Set([
  "dry-run",
  "d",
  "projects",
  "p",
  "groups",
  "group",
  "g",
  "verbose",
]);

const OPTIONS_WITH_VALUE = new Set(["projects", "p", "groups", "group", "g"]);

/**
 * Flags that both `nx release version` and `nx release changelog` accept.
 * A specifier such as `patch` stays on the version command: changelog reads
 * the version that command just wrote.
 * @param {string[]} argv
 * @returns {{versionArgs: string[], changelogArgs: string[]}}
 */
function partitionReleaseArgs(argv) {
  const versionArgs = [];
  const changelogArgs = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--") {
      continue;
    }

    const name = optionName(token);
    if (name == null) {
      versionArgs.push(token);
      continue;
    }

    const pieces = [token];
    if (OPTIONS_WITH_VALUE.has(name) && !token.includes("=")) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("-")) {
        throw new Error(`Missing value for ${token}`);
      }
      pieces.push(value);
      index += 1;
    }

    versionArgs.push(...pieces);
    if (SHARED_OPTIONS.has(name)) {
      changelogArgs.push(...pieces);
    }
  }

  return { versionArgs, changelogArgs };
}

/**
 * @param {string} token
 * @returns {string | null}
 */
function optionName(token) {
  if (!token.startsWith("-")) {
    return null;
  }

  const body = token.replace(/^-+/, "").split("=")[0];
  return body.startsWith("no-") ? body.slice("no-".length) : body;
}

/**
 * @param {string[]} args
 */
function runNx(args) {
  const result = spawnSync("pnpm", ["nx", ...args], { stdio: "inherit" });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function main() {
  const { versionArgs, changelogArgs } = partitionReleaseArgs(
    process.argv.slice(2),
  );

  runNx(["release", "version", ...versionArgs]);
  runNx(["release", "changelog", ...changelogArgs]);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

module.exports = {
  partitionReleaseArgs,
};
