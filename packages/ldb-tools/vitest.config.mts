import { defineConfig } from "vitest/config";

const packageDir = import.meta.dirname;

export default defineConfig(() => ({
  root: packageDir,
  cacheDir: "../../node_modules/.vite/packages/ldb-tools",
  test: {
    watch: false,
    globals: true,
    restoreMocks: true,
    environment: "node",
    include: ["*.spec.mjs"],
    reporters: ["default"],
  },
}));
