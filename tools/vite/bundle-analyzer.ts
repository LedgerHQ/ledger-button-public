import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { visualizer } from "rollup-plugin-visualizer";
import type { PluginOption } from "vite";

/**
 * Treemap of what actually ends up in a bundle, enabled with `ANALYZE=1` (see
 * the `analyze` script at the workspace root).
 *
 * Reports are written to `<workspace>/dist/stats`, outside the package's own
 * `dist`, so they never ship with the published tarball (`files: ["dist"]`).
 */
export function bundleAnalyzer(packageDir: string): PluginOption {
  if (!process.env.ANALYZE) {
    return false;
  }

  const { name } = JSON.parse(
    readFileSync(join(packageDir, "package.json"), "utf-8"),
  ) as { name: string };
  const reportName = name.replace(/^@[^/]+\//, "");

  return visualizer({
    filename: resolve(packageDir, "../../dist/stats", `${reportName}.html`),
    title: `${name} bundle`,
    template: "treemap",
    gzipSize: true,
    brotliSize: true,
  }) as PluginOption;
}
