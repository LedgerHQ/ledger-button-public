#!/usr/bin/env zx

require("zx/globals");

const GLOB = ["packages/*/package.json", "!packages/ldb-tools/package.json"];

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

module.exports = {
  getPublicPackages,
};
