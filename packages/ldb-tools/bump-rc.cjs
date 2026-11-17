#!/usr/bin/env zx

require("zx/globals");
const {
  filterReleaseProjects,
  loadReleaseProjects,
  parseProjectSelector,
} = require("./release-projects.cjs");
const { resolveRcVersions } = require("./rc-versions.cjs");

/**
 * Set public package versions to X.Y.Z-rc.<number>, keeping each package's own
 * X.Y.Z. Does not commit, tag, or write version plans: the caller decides
 * whether the result lands in git or only in a CI runner.
 * @param {string|number} number - The release candidate number (e.g. 0, 1, 2)
 * @param {string | string[] | undefined} projects - Release projects to suffix. Empty means every release group.
 */
async function bumpRc(number, projects) {
  try {
    console.log(chalk.blue("📦 Finding release packages..."));
    console.log("");

    const publicPackages = filterReleaseProjects(
      loadReleaseProjects(),
      parseProjectSelector(projects),
    );

    if (publicPackages.length === 0) {
      throw new Error("No public packages found");
    }

    console.log(
      chalk.green(`Found ${publicPackages.length} public package(s):`),
    );
    publicPackages.forEach((pkg) => {
      console.log(chalk.gray(`  - ${pkg.name} (${pkg.version})`));
    });
    console.log("");

    const resolved = resolveRcVersions(publicPackages, number);

    console.log(chalk.blue("Setting release candidate versions:"));
    console.log("");

    for (const pkg of resolved) {
      const packageJson = await fs.readJSON(pkg.path);
      packageJson.version = pkg.to;
      await fs.writeJSON(pkg.path, packageJson, { spaces: 2 });
      console.log(chalk.cyan(`  ${pkg.name} ${pkg.from} → ${pkg.to}`));
    }

    console.log("");
    console.log(chalk.green(`✅ Release candidate versions set successfully`));
    console.log(chalk.blue(`   Packages: ${resolved.length}`));
  } catch (error) {
    console.error(chalk.red("Failed to set release candidate versions"));
    throw error;
  }
}

module.exports = {
  bumpRc,
};
