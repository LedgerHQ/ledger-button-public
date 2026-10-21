const fs = require("node:fs");
const path = require("node:path");

/**
 * Release projects come from nx.json so a new blockchain only has to join a
 * release group. Publishing, packing, and the CI build lists all read this.
 * @param {string} [root]
 * @returns {Array<{name: string, version: string, path: string, directory: string}>}
 */
function loadReleaseProjects(root = process.cwd()) {
  const nxJson = readJson(path.join(root, "nx.json"));
  const packagesDir = path.join(root, "packages");
  const manifests = fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const manifestPath = path.join(packagesDir, entry.name, "package.json");
      if (!fs.existsSync(manifestPath)) {
        return [];
      }

      const manifest = readJson(manifestPath);
      return [
        {
          name: manifest.name,
          version: manifest.version,
          private: manifest.private === true,
          path: path.relative(root, manifestPath),
          directory: entry.name,
        },
      ];
    });

  return releaseProjectsFromConfig(nxJson, manifests);
}

/**
 * @param {{release?: {groups?: Record<string, {projects?: string[]}>}}} nxJson
 * @param {Array<{name: string, version: string, path: string, directory: string, private?: boolean}>} manifests
 */
function releaseProjectsFromConfig(nxJson, manifests) {
  const names = [];

  for (const group of Object.values(nxJson.release?.groups ?? {})) {
    for (const name of group.projects ?? []) {
      if (!names.includes(name)) {
        names.push(name);
      }
    }
  }

  if (names.length === 0) {
    throw new Error("nx.json release.groups does not list any project");
  }

  return names.map((name) => {
    const manifest = manifests.find((item) => item.name === name);

    if (!manifest) {
      throw new Error(
        `Release project ${name} has no package under packages/`,
      );
    }

    if (manifest.private) {
      throw new Error(
        `Release project ${name} is private and cannot be published`,
      );
    }

    return {
      name: manifest.name,
      version: manifest.version,
      path: manifest.path,
      directory: manifest.directory,
    };
  });
}

/**
 * Accepts a comma-separated string, an argv list, or nothing.
 * Nothing means every release project.
 * @param {string | string[] | boolean | null | undefined} selector
 * @returns {string[]}
 */
function parseProjectSelector(selector) {
  if (selector == null || selector === "") {
    return [];
  }

  if (selector === true) {
    throw new Error(
      "Expected a comma-separated project list for --projects",
    );
  }

  const raw = Array.isArray(selector) ? selector : String(selector).split(",");

  return raw.map((token) => token.trim()).filter(Boolean);
}

/**
 * Matches a package name, its unscoped name, or its directory.
 * @param {Array<{name: string, directory: string}>} projects
 * @param {string[]} selector
 */
function filterReleaseProjects(projects, selector) {
  if (selector.length === 0) {
    return projects;
  }

  const missing = [];
  const selected = [];

  for (const token of selector) {
    const match = projects.find((project) => matches(project, token));

    if (!match) {
      missing.push(token);
      continue;
    }

    if (!selected.some((project) => project.name === match.name)) {
      selected.push(match);
    }
  }

  if (missing.length > 0) {
    const known = projects.map((project) => project.name).join(", ");
    throw new Error(
      `Unknown release project(s): ${missing.join(", ")}. Expected one of: ${known}`,
    );
  }

  return selected;
}

/**
 * @param {{name: string, directory: string}} project
 * @param {string} token
 */
function matches(project, token) {
  const unscoped = project.name.startsWith("@")
    ? project.name.slice(project.name.indexOf("/") + 1)
    : project.name;

  return (
    project.name === token ||
    unscoped === token ||
    project.directory === token
  );
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

module.exports = {
  filterReleaseProjects,
  loadReleaseProjects,
  parseProjectSelector,
  releaseProjectsFromConfig,
};
