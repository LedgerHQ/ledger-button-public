const semver = require("semver");

const RC_IDENTIFIER = "rc";

/**
 * The number reaches us as a workflow_dispatch string, so validate the digits
 * themselves rather than what Number() is willing to coerce ("0x1", "1e3", …).
 */
function parseRcNumber(value) {
  const digits = String(value ?? "").trim();

  if (!/^\d+$/.test(digits)) {
    throw new Error(
      `Invalid release candidate number: "${value}". Expected a non-negative integer.`,
    );
  }

  return Number(digits);
}

/**
 * Split a package version into its stable part and whether it already is a
 * release candidate. Only X.Y.Z and X.Y.Z-rc.N are accepted: any other
 * prerelease identifier is out of scope for this channel.
 */
function readVersion({ name, version }) {
  const parsed = semver.parse(version);

  if (!parsed) {
    throw new Error(`${name}@${version} is not a valid semver version`);
  }

  const stable = `${parsed.major}.${parsed.minor}.${parsed.patch}`;
  const [identifier, rcNumber] = parsed.prerelease;

  if (parsed.prerelease.length === 0) {
    return { stable, isReleaseCandidate: false };
  }

  const isRcPrerelease =
    parsed.prerelease.length === 2 &&
    identifier === RC_IDENTIFIER &&
    typeof rcNumber === "number";

  if (!isRcPrerelease) {
    throw new Error(
      `${name}@${version} must be X.Y.Z or X.Y.Z-${RC_IDENTIFIER}.N`,
    );
  }

  return { stable, isReleaseCandidate: true };
}

/**
 * ADR 041 guardrail: a half-bumped branch means someone lost track of the
 * release, so refuse it instead of silently normalizing the whole set.
 */
function assertConsistentSet(resolved) {
  const releaseCandidates = resolved.filter(
    ({ isReleaseCandidate }) => isReleaseCandidate,
  );

  if (
    releaseCandidates.length !== 0 &&
    releaseCandidates.length !== resolved.length
  ) {
    const mixed = resolved
      .map(({ name, from }) => `${name}@${from}`)
      .join(", ");

    throw new Error(
      `Mixed release candidate and stable versions: every public package must be either X.Y.Z or X.Y.Z-${RC_IDENTIFIER}.N (got: ${mixed})`,
    );
  }
}

/**
 * Resolve the X.Y.Z-rc.<rcNumber> version of every given package, keeping each
 * package's own X.Y.Z. Pure: it validates and computes, it never touches disk.
 * @param {Array<{name: string, version: string, path?: string}>} packages
 * @param {string|number} number - The release candidate number (e.g. 0, 1, 2)
 */
function resolveRcVersions(packages, number) {
  const rcNumber = parseRcNumber(number);

  const resolved = packages.map((pkg) => {
    const { stable, isReleaseCandidate } = readVersion(pkg);

    return {
      name: pkg.name,
      path: pkg.path,
      from: pkg.version,
      to: `${stable}-${RC_IDENTIFIER}.${rcNumber}`,
      isReleaseCandidate,
    };
  });

  assertConsistentSet(resolved);

  return resolved;
}

module.exports = {
  RC_IDENTIFIER,
  resolveRcVersions,
};
