#!/usr/bin/env node
/**
 * Guards the library bundles against dependency inlining.
 *
 * A dApp installs several of our packages side by side and passes instances
 * across them (the `CoreFacade` built by the button reaches the provider
 * packages). If a shared dependency gets inlined, each bundle ends up with its
 * own copy, `instanceof` stops holding and RxJS rejects foreign observables
 * with "You provided an invalid object where a stream was expected".
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const WORKSPACE_ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const PACKAGES_DIR = join(WORKSPACE_ROOT, "packages");

/**
 * The four library packages that must always be built before this script runs.
 * A missing dist/index.js in any of these is an error, not a skip.
 */
const REQUIRED_PACKAGES = [
  "ledger-button",
  "ledger-button-core",
  "ledger-wallet-provider-evm",
  "ledger-wallet-provider-solana",
];

/** Strings that only exist in a dependency's own source code. */
const INLINE_MARKERS = [
  { name: "rxjs", marker: "where a stream was expected" },
  {
    name: "@ledgerhq/device-management-kit",
    marker: "[XStateDeviceAction] Input",
  },
];

const IMPORT_SPECIFIER = /(?:^|[\s;}])(?:import|export)[^;]*?from\s*"([^"]+)"/g;
const SIDE_EFFECT_IMPORT = /(?:^|[\s;}])import\s*"([^"]+)"/g;

function packageNameOf(specifier) {
  const segments = specifier.split("/");
  return specifier.startsWith("@")
    ? segments.slice(0, 2).join("/")
    : segments[0];
}

function bareSpecifiersOf(bundle) {
  const specifiers = new Set();
  for (const pattern of [IMPORT_SPECIFIER, SIDE_EFFECT_IMPORT]) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(bundle)) !== null) {
      const specifier = match[1];
      if (!specifier.startsWith(".") && !specifier.startsWith("node:")) {
        specifiers.add(packageNameOf(specifier));
      }
    }
  }
  return [...specifiers];
}

function checkPackage(packageDir, required) {
  const bundlePath = join(packageDir, "dist", "index.js");
  const manifestPath = join(packageDir, "package.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

  let bundle;
  try {
    bundle = readFileSync(bundlePath, "utf-8");
  } catch {
    if (required) {
      return {
        errors: [
          `dist/index.js is missing; build ${manifest.name ?? packageDir} before running this check`,
        ],
        name: manifest.name,
      };
    }
    return { skipped: true, errors: [] };
  }

  const declared = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
  ]);

  const errors = [];

  for (const { name, marker } of INLINE_MARKERS) {
    if (bundle.includes(marker)) {
      errors.push(
        `${name} is inlined in dist/index.js; it must stay external (found marker ${JSON.stringify(marker)})`,
      );
    }
  }

  for (const specifier of bareSpecifiersOf(bundle)) {
    if (!declared.has(specifier)) {
      errors.push(
        `dist/index.js imports "${specifier}" but it is declared neither in dependencies nor in peerDependencies`,
      );
    }
  }

  return { skipped: false, errors, name: manifest.name };
}

const results = readdirSync(PACKAGES_DIR)
  .map((entry) => join(PACKAGES_DIR, entry))
  .filter((packageDir) => statSync(packageDir).isDirectory())
  .map((packageDir) => ({
    packageDir,
    ...checkPackage(packageDir, REQUIRED_PACKAGES.includes(packageDir.split("/").at(-1))),
  }));

const checked = results.filter((result) => !result.skipped);
const failed = checked.filter((result) => result.errors.length > 0);

for (const { name, errors } of failed) {
  for (const error of errors) {
    console.error(`✖ ${name}: ${error}`);
  }
}

if (failed.length > 0) {
  process.exit(1);
}

console.log(
  `✔ ${checked.length} bundle(s) keep their dependencies external: ${checked
    .map((result) => result.name)
    .join(", ")}`,
);
