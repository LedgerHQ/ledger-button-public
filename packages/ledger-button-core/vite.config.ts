/// <reference types='vitest' />
import * as path from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

import { externalizeDeps } from "../../tools/vite/externalize-deps";

// Mirrors the `paths` of tsconfig.lib.json. vite-plugin-dts reads these
// aliases to rewrite them back to relative paths in the emitted declarations,
// so they must stay in sync with the tsconfig.
const alias = {
  "@api": path.resolve(__dirname, "src/api"),
  "@internal": path.resolve(__dirname, "src/internal"),
  "@schemas": path.resolve(__dirname, "src/schemas"),
};

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: "../../node_modules/.vite/packages/ledger-button-core",
  resolve: { alias },
  plugins: [
    dts({
      entryRoot: "src",
      tsconfigPath: path.join(__dirname, "tsconfig.lib.json"),
    }),
  ],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  // Configuration for building your library.
  // See: https://vitejs.dev/guide/build.html#library-mode
  build: {
    outDir: "./dist",
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      // Could also be a dictionary or array of multiple entry points.
      entry: "src/index.ts",
      name: "@ledgerhq/ledger-button-core",
      fileName: "index",
      // Change this to the formats you want to support.
      // Don't forget to update your package.json as well.
      formats: ["es" as const],
    },
    rollupOptions: {
      // Every runtime dependency stays external so consumers resolve a single
      // copy of it. See tools/vite/externalize-deps.ts.
      external: externalizeDeps(
        path.join(__dirname, "package.json"),
        Object.keys(alias),
      ),
    },
  },
  test: {
    watch: false,
    globals: true,
    environment: "happy-dom",
    include: ["{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    reporters: ["default"],
    coverage: {
      reportsDirectory: "./test-output/vitest/coverage",
      provider: "v8" as const,
      // projectRoot makes lcov SF: paths relative to the workspace root
      // (e.g. "packages/ledger-button-core/src/...") so SonarCloud can resolve them.
      reporter: [
        "text",
        ["lcov", { projectRoot: path.resolve(__dirname, "../..") }],
      ],
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
