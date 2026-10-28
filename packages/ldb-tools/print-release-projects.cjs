#!/usr/bin/env node

const {
  filterReleaseProjects,
  loadReleaseProjects,
  parseProjectSelector,
} = require("./release-projects.cjs");

/**
 * Prints the Nx project names for a release, comma-separated, with no extra
 * logs, so a workflow can pass the result to `nx run-many --projects`.
 *
 *   node packages/ldb-tools/print-release-projects.cjs
 *   node packages/ldb-tools/print-release-projects.cjs --projects @ledgerhq/ledger-wallet-provider-solana
 */
function selectorFromArgv(argv) {
  const values = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--projects") {
      values.push(argv[index + 1] ?? "");
      index += 1;
      continue;
    }

    if (arg.startsWith("--projects=")) {
      values.push(arg.slice("--projects=".length));
      continue;
    }

    if (!arg.startsWith("-")) {
      values.push(arg);
    }
  }

  return values.join(",");
}

function main() {
  const projects = filterReleaseProjects(
    loadReleaseProjects(),
    parseProjectSelector(selectorFromArgv(process.argv.slice(2))),
  );

  process.stdout.write(projects.map((project) => project.name).join(","));
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
