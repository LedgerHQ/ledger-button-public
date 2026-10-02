#!/usr/bin/env node
/**
 * Measures the published bundles and renders a size report for a pull request.
 *
 *   node tools/scripts/report-bundle-sizes.mjs measure [workspace] > sizes.json
 *   node tools/scripts/report-bundle-sizes.mjs compare base.json head.json
 *
 * `measure` reads the built `packages/*\/dist` of the given workspace, which
 * defaults to this checkout. The base branch is measured by pointing it at a
 * worktree, since the script may not exist on that branch yet. `compare` prints
 * the markdown table posted as a PR comment.
 */
import { gzipSync } from "node:zlib";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_WORKSPACE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);

/** Below this, a variation is noise from minifier or hash churn. */
const SIGNIFICANT_DELTA_RATIO = 0.005;

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(2)} MB`;
}

function formatDelta(before, after) {
  const delta = after - before;
  if (before === 0) {
    return "new";
  }
  if (delta === 0) {
    return "=";
  }

  const ratio = delta / before;
  const sign = delta > 0 ? "+" : "−";
  const marker =
    Math.abs(ratio) < SIGNIFICANT_DELTA_RATIO ? "" : delta > 0 ? " ⚠️" : " 🎉";

  return `${sign}${formatBytes(Math.abs(delta))} (${sign}${(Math.abs(ratio) * 100).toFixed(1)}%)${marker}`;
}

function measure(workspace) {
  const packagesDir = join(workspace, "packages");
  const sizes = {};

  for (const entry of readdirSync(packagesDir)) {
    const distDir = join(packagesDir, entry, "dist");
    let files;
    try {
      files = readdirSync(distDir).filter((file) => file.endsWith(".js"));
    } catch {
      continue;
    }

    const { name } = JSON.parse(
      readFileSync(join(packagesDir, entry, "package.json"), "utf-8"),
    );

    let raw = 0;
    let gzip = 0;
    for (const file of files) {
      const path = join(distDir, file);
      if (!statSync(path).isFile()) {
        continue;
      }
      const content = readFileSync(path);
      raw += content.byteLength;
      gzip += gzipSync(content, { level: 9 }).byteLength;
    }

    sizes[name] = { raw, gzip, files: files.length };
  }

  return sizes;
}

function compare(basePath, headPath) {
  const base = JSON.parse(readFileSync(basePath, "utf-8"));
  const head = JSON.parse(readFileSync(headPath, "utf-8"));

  const names = [
    ...new Set([...Object.keys(base), ...Object.keys(head)]),
  ].sort();

  const rows = names.map((name) => {
    const before = base[name] ?? { raw: 0, gzip: 0 };
    const after = head[name] ?? { raw: 0, gzip: 0 };
    return [
      `\`${name}\``,
      formatBytes(after.raw),
      formatDelta(before.raw, after.raw),
      formatBytes(after.gzip),
      formatDelta(before.gzip, after.gzip),
    ];
  });

  const totalBefore = Object.values(base).reduce((sum, s) => sum + s.gzip, 0);
  const totalAfter = Object.values(head).reduce((sum, s) => sum + s.gzip, 0);
  const unchanged = rows.every((row) => row[2] === "=" && row[4] === "=");

  const lines = [
    "<!-- bundle-size-report -->",
    "## 📦 Bundle size",
    "",
    unchanged
      ? "No change to the published bundles."
      : `Total gzipped: **${formatBytes(totalAfter)}** (${formatDelta(totalBefore, totalAfter)})`,
    "",
    "| Package | Size | Δ | Gzipped | Δ gzipped |",
    "| --- | ---: | ---: | ---: | ---: |",
    ...rows.map((row) => `| ${row.join(" | ")} |`),
    "",
    "<sub>Sum of every `.js` file in each package's `dist`, compared against the base branch.</sub>",
  ];

  return lines.join("\n");
}

const [command, ...args] = process.argv.slice(2);

switch (command) {
  case "measure":
    console.log(
      JSON.stringify(measure(resolve(args[0] ?? DEFAULT_WORKSPACE)), null, 2),
    );
    break;
  case "compare":
    if (args.length !== 2) {
      console.error("usage: report-bundle-sizes.mjs compare <base> <head>");
      process.exit(1);
    }
    console.log(compare(args[0], args[1]));
    break;
  default:
    console.error("usage: report-bundle-sizes.mjs <measure|compare>");
    process.exit(1);
}
