#!/usr/bin/env zx

require("zx/globals");

const GLOB = [
  "packages/*/package.json",
  "!packages/ldb-tools/package.json",
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

const utcTimestamp = () => {
  const iso = new Date().toISOString();
  return iso.replace(/[-:TZ.]/g, "").slice(0, 14);
};

/**
 * Set public package versions to 0.0.0-${tag}-${timestamp} (DMK snapshot scheme).
 * Does not commit, tag, or write version plans.
 * @param {string} tag - The snapshot tag (e.g., "develop", "canary")
 */
async function bumpSnapshot(tag = "develop") {
  try {
    const snapshotVersion = `0.0.0-${tag}-${utcTimestamp()}`;

    console.log(chalk.blue("📦 Finding all public packages..."));
    console.log("");

    const publicPackages = await getPublicPackages();

    if (publicPackages.length === 0) {
      console.log(chalk.yellow("No public packages found"));
      process.exit(0);
    }

    console.log(
      chalk.green(`Found ${publicPackages.length} public package(s):`),
    );
    publicPackages.forEach((pkg) => {
      console.log(chalk.gray(`  - ${pkg.name} (${pkg.version})`));
    });
    console.log("");

    console.log(chalk.blue(`Setting snapshot version: ${snapshotVersion}`));
    console.log("");

    for (const pkg of publicPackages) {
      const packageJson = await fs.readJSON(pkg.path);
      packageJson.version = snapshotVersion;
      await fs.writeJSON(pkg.path, packageJson, { spaces: 2 });
      console.log(chalk.cyan(`  ${pkg.name} → ${snapshotVersion}`));
    }

    console.log("");
    console.log(chalk.green(`✅ Snapshot versions bumped successfully`));
    console.log(chalk.blue(`   Snapshot tag: ${tag}`));
    console.log(chalk.blue(`   Version: ${snapshotVersion}`));
    console.log(chalk.blue(`   Packages: ${publicPackages.length}`));
  } catch (error) {
    console.error(chalk.red("Failed to create snapshot versions"));
    throw error;
  }
}

module.exports = {
  bumpSnapshot,
};
