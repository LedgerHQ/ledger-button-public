import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: "../../node_modules/.vite/packages/ledger-button-ui",
  plugins: [
    dts({
      entryRoot: "src",
      tsconfigPath: resolve(__dirname, "tsconfig.lib.json"),
      insertTypesEntry: true,
    }),
  ],
  css: {
    postcss: "./postcss.config.js",
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "LedgerButtonUI",
      formats: ["es" as const],
      fileName: "index",
    },
    rollupOptions: {
      external: ["lit"],
      output: {
        globals: {
          lit: "lit",
        },
      },
    },
    outDir: "./dist",
    emptyOutDir: true,
  },
  test: {
    watch: false,
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    reporters: ["default"],
    coverage: {
      reportsDirectory: "./test-output/vitest/coverage",
      provider: "v8" as const,
    },
  },
}));
