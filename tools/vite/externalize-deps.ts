import { readFileSync } from "node:fs";
import { isAbsolute } from "node:path";

type PackageManifest = {
  name?: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

/** Bare specifier such as `rxjs`, `lit/decorators.js` or `@scope/name/sub`. */
const BARE_SPECIFIER = /^(?:@[^/:\s]+\/)?[a-z0-9][^:\s]*$/i;

function packageNameOf(specifier: string): string {
  const segments = specifier.split("/");
  return specifier.startsWith("@")
    ? segments.slice(0, 2).join("/")
    : segments[0];
}

/**
 * Keeps every runtime dependency of a library build external instead of
 * inlining it.
 *
 * A dApp installs several of our packages side by side and passes instances
 * across them (the `CoreFacade` built by the button reaches the provider
 * packages). Inlining would give each bundle its own copy of `rxjs`, the DMK
 * and the core: `instanceof` would stop holding and RxJS would reject foreign
 * observables with "You provided an invalid object where a stream was
 * expected".
 *
 * Importing a package that the manifest does not declare fails the build,
 * because such an import would silently be inlined here and would resolve to
 * nothing on the consumer side.
 */
export function externalizeDeps(
  packageJsonPath: string,
  /** Path aliases of the package, which look bare but resolve internally. */
  internalAliases: readonly string[] = [],
): (id: string) => boolean {
  const manifest = JSON.parse(
    readFileSync(packageJsonPath, "utf-8"),
  ) as PackageManifest;

  const declared = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
  ]);

  return (id: string): boolean => {
    if (id.startsWith("node:")) {
      return true;
    }

    // Relative paths, absolute paths, virtual modules and inlined assets are
    // the build's own inputs.
    if (isAbsolute(id) || !BARE_SPECIFIER.test(id)) {
      return false;
    }

    if (
      internalAliases.some(
        (alias) => id === alias || id.startsWith(`${alias}/`),
      )
    ) {
      return false;
    }

    const packageName = packageNameOf(id);
    if (declared.has(packageName)) {
      return true;
    }

    throw new Error(
      `${manifest.name ?? packageJsonPath} imports "${id}" but "${packageName}" is declared neither in its dependencies nor in its peerDependencies. Add it, otherwise it gets inlined and duplicated in consumer apps.`,
    );
  };
}
