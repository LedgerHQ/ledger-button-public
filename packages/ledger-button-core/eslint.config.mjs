import baseConfig from "../../eslint.config.mjs";

export default [
  ...baseConfig,
  {
    // `api/` is the public surface and `internal/` the implementation: `api/`
    // only reaches into `internal/` for types. `LedgerButtonCore` is the
    // composition root and the `index.ts` barrels re-export on purpose.
    // Paths are relative to this package because `nx lint` runs from here.
    files: ["src/api/**/*.ts"],
    ignores: [
      "src/api/LedgerButtonCore.ts",
      "src/api/**/index.ts",
      "**/*.test.ts",
    ],
    rules: {
      "no-restricted-imports": "off",
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["src/**"],
              message:
                "Import paths should not start with 'src/'. Use relative imports instead.",
            },
            {
              regex: "^(@internal/|(\\.\\./)+internal/)",
              allowTypeImports: true,
              message:
                "`api/` must not import runtime code from `internal/`. Use `import type`, or move the shared type into `api/`.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.json"],
    rules: {
      "@nx/dependency-checks": [
        "error",
        {
          ignoredFiles: [
            "{projectRoot}/eslint.config.{js,cjs,mjs}",
            "{projectRoot}/vite.config.{js,ts,mjs,mts}",
          ],
          ignoredDependencies: ["vitest"],
          checkObsoleteDependencies: false,
        },
      ],
    },
    languageOptions: {
      parser: await import("jsonc-eslint-parser"),
    },
  },
];
