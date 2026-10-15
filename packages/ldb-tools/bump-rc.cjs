#!/usr/bin/env zx

require("zx/globals");
const { getPublicPackages } = require("./public-packages.cjs");
const { resolveRcVersions } = require("./rc-versions.cjs");

/**
 * Set public package versions to X.Y.Z-rc.<number>, keeping each package's own
 * X.Y.Z. Does not commit, tag, or write version plans: the caller decides
 * whether the result lands in git or only in a CI runner.
 * @param {string|number} number - The release candidate number (e.g. 0, 1, 2)
 */
async function bumpRc(number) {
  try {
    console.log(chalk.blue("📦 Finding all public packages..."));
    console.log("");

    const publicPackages = await getPublicPackages();

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
