import * as path from "path";
import dts from "vite-plugin-dts";
import { defineConfig } from "vitest/config";

import { bundleAnalyzer } from "../../tools/vite/bundle-analyzer";
import { externalizeDeps } from "../../tools/vite/externalize-deps";
import { lcovReporter } from "../../tools/vite/lcov-reporter";

const packageDir = import.meta.dirname;

// Mirrors the `paths` of tsconfig.lib.json. vite-plugin-dts reads these
// aliases to rewrite them back to relative paths in the emitted declarations,
// so they must stay in sync with the tsconfig.
const alias = {
  "@api": path.resolve(packageDir, "src/api"),
  "@internal": path.resolve(packageDir, "src/internal"),
  "@schemas": path.resolve(packageDir, "src/schemas"),
};

export default defineConfig(() => ({
  root: packageDir,
  cacheDir: "../../node_modules/.vite/packages/ledger-button-core",
  resolve: { alias },
  plugins: [
    dts({
      entryRoot: "src",
      tsconfigPath: path.join(packageDir, "tsconfig.lib.json"),
    }),
    bundleAnalyzer(packageDir),
  ],
  // Configuration for building your library.
  // See: https://vitejs.dev/guide/build.html#library-mode
  build: {
    outDir: "./dist",
    emptyOutDir: true,
    reportCompressedSize: true,
    lib: {
      entry: "src/index.ts",
      name: "@ledgerhq/ledger-button-core",
      fileName: "index",
      formats: ["es" as const],
    },
    rolldownOptions: {
      // Every runtime dependency stays external so consumers resolve a single
      // copy of it. See tools/vite/externalize-deps.ts.
      external: externalizeDeps(
        path.join(packageDir, "package.json"),
        Object.keys(alias),
      ),
    },
  },
  test: {
    watch: false,
    globals: true,
    restoreMocks: true,
    environment: "happy-dom",
    include: ["{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    reporters: ["default"],
    coverage: {
      reportsDirectory: "./test-output/vitest/coverage",
      provider: "v8" as const,
      // projectRoot makes lcov SF: paths relative to the workspace root
      // (e.g. "packages/ledger-button-core/src/...") so SonarCloud can resolve them.
      reporter: ["text", lcovReporter(path.resolve(packageDir, "../.."))],
      // Mirror sonar.coverage.exclusions in sonar-project.properties so that
      // lcov.info doesn't reference files SonarCloud excludes (avoids the
      // "Could not resolve N file paths" warning).
      exclude: [
        "**/*.spec.{ts,tsx}",
        "**/*.test.{ts,tsx}",
        "**/*.stories.{ts,tsx}",
        "**/*.config.{js,cjs,mjs,ts,mts}",
        "**/eslint.config.*",
        "**/vite.config.*",
        "**/tailwind.config.*",
        "**/postcss.config.*",
        "**/*.d.ts",
        "**/index.ts",
        "**/dist/**",
      ],
    },
  },
}));
