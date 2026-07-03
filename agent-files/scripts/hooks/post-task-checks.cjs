#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const MAX_LINES = 80;
const PROJECT_ROOTS = ["packages", "apps"];
const TARGETS = ["lint", "typecheck", "test"];

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
  });
}

function run(cmd, opts = {}) {
  return execSync(cmd, { encoding: "utf8", ...opts });
}

function truncateOutput(output) {
  const lines = output.split("\n");
  if (lines.length > MAX_LINES) {
    return [
      `... (truncated, showing last ${MAX_LINES} of ${lines.length} lines) ...`,
      ...lines.slice(-MAX_LINES),
    ].join("\n");
  }
  return output;
}

function getProjectName(projectDir) {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(projectDir, "package.json"), "utf8"),
    );
    return pkg.name || null;
  } catch {
    return null;
  }
}

// Map changed files to the Nx project names they belong to (packages/* and apps/*).
function getChangedProjects() {
  const status = run("git status --porcelain");
  const dirs = new Set();
  for (const line of status.split("\n")) {
    const file = line.trim().split(/\s+/).pop();
    if (!file) continue;
    const parts = file.split("/");
    if (parts.length >= 2 && PROJECT_ROOTS.includes(parts[0])) {
      dirs.add(`${parts[0]}/${parts[1]}`);
    }
  }

  const names = new Set();
  for (const dir of dirs) {
    if (!fs.existsSync(path.join(dir, "package.json"))) continue;
    const name = getProjectName(dir);
    if (name) names.add(name);
  }
  return [...names].sort();
}

async function main() {
  const input = JSON.parse(await readStdin());

  if (input.status !== "completed") {
    console.log("{}");
    return;
  }

  const projects = getChangedProjects();

  if (projects.length === 0) {
    console.log("{}");
    return;
  }

  // run-many skips any project that does not define a given target (e.g.
  // test-extension has no `test`), so listing all targets here is safe.
  const cmd = `pnpm nx run-many -t ${TARGETS.join(",")} -p ${projects.join(",")} --output-style=stream`;

  try {
    run(cmd, { stdio: "pipe" });
    console.log("{}");
  } catch (e) {
    const output = truncateOutput(e.stdout || e.stderr || e.message || "");
    const msg =
      "Post-task checks failed (lint / typecheck / test). " +
      `Projects checked: ${projects.join(", ")}.\n\n` +
      "Please fix the following issues and try again:\n\n" +
      "When test failures are caused by outdated test code (wrong mocks, stale signatures, missing setup), " +
      "fix the tests to match the current implementation. Only touch implementation code if the tests reveal a genuine bug.\n\n" +
      output;
    console.log(JSON.stringify({ followup_message: msg }));
  }
}

main();
