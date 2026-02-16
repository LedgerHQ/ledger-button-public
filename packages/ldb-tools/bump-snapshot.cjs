#!/usr/bin/env zx

require("zx/globals");

const GLOB = [
  // Grab all the package.json files except the ones in node_modules
  "**/package.json",
  "!**/node_modules/**",
  // Ignore the root package.json
  "!package.json",
  // Ignore compiled files
  "!**/lib/**",
  "!**/dist/**",
  // Ignore Apps
  "!**/apps/**",
  // Ignore POCs
  "!**/pocs/**",
  // Ignore Configs
  "!**/packages/ldb-tools/**",
];

/**
 * Get all public packages in the workspace
 */
async function getPublicPackages() {
  const packages = await glob(GLOB);
  const publicPackages = [];

  for (const pkgPath of packages) {
    const packageJson = await fs.readJSON(pkgPath);

    // Only include non-private packages
    if (!packageJson.private && packageJson.name) {
      publicPackages.push({
        name: packageJson.name,
        version: packageJson.version,
        path: pkgPath,
      });
    }
  }

  return publicPackages;
}

/**
 * Bump snapshot versions for all public packages using Nx release
 * @param {string} tag - The snapshot tag (e.g., "develop", "canary")
 * @param {string} bumpType - The version bump type (patch, minor, major)
 */
async function bumpSnapshot(tag = "develop", bumpType = "patch") {
  try {
    console.log(chalk.blue("📦 Finding all public packages..."));
    console.log("");

    // Get all public packages
    const publicPackages = await getPublicPackages();

    if (publicPackages.length === 0) {
      console.log(chalk.yellow("No public packages found"));
      process.exit(0);
    }

    console.log(
      chalk.green(`Found ${publicPackages.length} public package(s):`),
    );
    publicPackages.forEach((pkg) => {
      console.log(chalk.gray(`  - ${pkg.name}`));
    });
    console.log("");

    // Validate bump type
    if (!["patch", "minor", "major"].includes(bumpType)) {
      throw new Error(
        `Invalid bump type: ${bumpType}. Must be one of: patch, minor, major`,
      );
    }

    // Map bump type to Nx prerelease specifier
    // For snapshot releases, we use prepatch, preminor, or premajor
    // which will bump the version and add the snapshot tag
    const prereleaseSpecifier = `pre${bumpType}`;

    console.log(chalk.blue("Bumping snapshot versions using Nx release..."));
    console.log(
      chalk.blue(`   Bump type: ${bumpType} (${prereleaseSpecifier})`),
    );
    console.log(chalk.blue(`   Snapshot tag: ${tag}`));
    console.log("");

    // Run nx release version with prerelease specifier and snapshot tag
    // Use the "libraries" release group configured in nx.json
    // This will bump all public packages in the release group and apply the snapshot tag
    // We disable git commit and tag to match the original behavior
    await $`pnpm nx release version ${prereleaseSpecifier} --preid ${tag} --groups libraries --git-commit=false --git-tag=false`;

    console.log("");
    console.log(chalk.green(`✅ Snapshot versions bumped successfully`));
    console.log(chalk.blue(`   Snapshot tag: ${tag}`));
    console.log(chalk.blue(`   Bump type: ${bumpType}`));
    console.log(chalk.blue(`   Packages: ${publicPackages.length}`));
  } catch (error) {
    console.error(chalk.red("Failed to create snapshot versions"));
    throw error;
  }
}

module.exports = {
  bumpSnapshot,
};
