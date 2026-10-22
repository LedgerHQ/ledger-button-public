#!/usr/bin/env zx

require("zx/globals");
const { canonicalizePackageJson } = require("./canonicalize.cjs");
const {
  filterReleaseProjects,
  loadReleaseProjects,
  parseProjectSelector,
} = require("./release-projects.cjs");

/**
 * Pack the nx release-group packages. A filter publishes only that subset.
 * @param {string} [_packagesDir] - Kept so older callers can still pass a directory; discovery uses nx.json.
 * @param {string} distDir - Output directory for packed files (default: dist)
 * @param {string | string[] | undefined} projects - Release projects to pack. Empty means every release group.
 */
const pack = async (
  _packagesDir = "packages",
  distDir = "dist",
  projects,
) => {
  try {
    const PROJECT_ROOT = process.cwd();
    const DIST_DIR = path.join(PROJECT_ROOT, distDir);
    const selected = filterReleaseProjects(
      loadReleaseProjects(PROJECT_ROOT),
      parseProjectSelector(projects),
    );

    console.log(
      chalk.blue(
        `📦 Packing ${selected.length} release package(s) to ${distDir}/`,
      ),
    );
    console.log("");

    await fs.mkdir(DIST_DIR, { recursive: true });

    let packedCount = 0;

    for (const project of selected) {
      const pkgFile = path.join(PROJECT_ROOT, project.path);
      const pkgDir = path.dirname(pkgFile);

      const content = await fs.readFile(pkgFile, "utf-8");
      const pkgJson = JSON.parse(content);

      console.log(chalk.cyan(`Packing ${pkgJson.name}...`));

      // Canonicalize the package.json file
      const canonicalized = canonicalizePackageJson(pkgJson);
      await fs.writeFile(pkgFile, canonicalized, "utf-8");

      // Pack the package to dist directory
      await $`cd ${pkgDir} && pnpm pack --pack-destination ${DIST_DIR}`;

      packedCount++;
      console.log(chalk.green(`✓ Packed ${pkgJson.name}`));
      console.log("");
    }

    console.log(chalk.green(`Packing complete`));
    console.log(chalk.blue(`   ${packedCount} package(s) packed`));
    console.log(chalk.blue(`   Output: ${distDir}/`));
  } catch (error) {
    console.error(chalk.red("Packing failed"));
    throw error;
  }
};

module.exports = {
  pack,
};
