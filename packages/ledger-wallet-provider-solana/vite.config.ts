import * as path from "path";
import dts from "vite-plugin-dts";
import { defineConfig } from "vitest/config";

import { bundleAnalyzer } from "../../tools/vite/bundle-analyzer";
import { externalizeDeps } from "../../tools/vite/externalize-deps";
import { lcovReporter } from "../../tools/vite/lcov-reporter";

const packageDir = import.meta.dirname;

export default defineConfig(() => ({
  root: packageDir,
  cacheDir: "../../node_modules/.vite/packages/ledger-wallet-provider-solana",
  plugins: [
    dts({
      entryRoot: "src",
      tsconfigPath: path.join(packageDir, "tsconfig.lib.json"),
    }),
    bundleAnalyzer(packageDir),
  ],
  build: {
    outDir: "./dist",
    emptyOutDir: true,
    reportCompressedSize: true,
    lib: {
      entry: "src/index.ts",
      name: "@ledgerhq/ledger-wallet-provider-solana",
      fileName: "index",
      formats: ["es" as const],
    },
    rolldownOptions: {
      external: externalizeDeps(path.join(packageDir, "package.json")),
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
      reporter: ["text", lcovReporter(path.resolve(packageDir, "../.."))],
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
