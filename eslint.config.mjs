import nx from "@nx/eslint-plugin";
import importPlugin from "eslint-plugin-import";
import simpleImportSort from "eslint-plugin-simple-import-sort";

export default [
  ...nx.configs["flat/base"],
  ...nx.configs["flat/typescript"],
  ...nx.configs["flat/javascript"],
  {
    ignores: [
      "**/dist",
      "**/vite.config.*.timestamp*",
      "**/vitest.config.*.timestamp*",
      "**/test-output",
      "**/out-tsc",
      "**/storybook-static",
      "**/coverage",
      "**/.next",
      "**/next-env.d.ts",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    rules: {
      "@nx/enforce-module-boundaries": [
        "error",
        {
          enforceBuildableLibDependency: true,
          // These aliases map to files inside ledger-button-core itself, so they
          // are internal to that project rather than cross-project dependencies.
          allow: [
            "^.*/eslint(\\.base)?\\.config\\.[cm]?js$",
            // Build-time helpers shared by the packages' vite configs.
            "^(\\.\\./)+tools/.*$",
            "@api/**",
            "@internal/**",
            "@schemas/**",
          ],
          depConstraints: [
            {
              sourceTag: "*",
              onlyDependOnLibsWithTags: ["*"],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "**/*.ts",
      "**/*.tsx",
      "**/*.cts",
      "**/*.mts",
      "**/*.js",
      "**/*.jsx",
      "**/*.cjs",
      "**/*.mjs",
    ],
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    // Override or add rules here
    rules: {
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            // Side effect imports.
            ["^\\u0000"],
            // Node.js builtins prefixed with `node:`.
            ["^node:"],
            // Packages. `react` related packages come first.
            ["^react", "^@?\\w"],
            // Internal packages.
            ["^(@|@api|@internal|@root)(/.*|$)"],
            // Other relative imports. Put same-folder imports and `.` last.
            ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
            // Style imports.
            ["^.+\\.s?css$"],
          ],
        },
      ],
      "simple-import-sort/exports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      // Custom rule to prevent imports starting with 'src/'
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["src/**"],
              message:
                "Import paths should not start with 'src/'. Use relative imports instead.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "packages/ledger-button/src/**/*.{ts,tsx}",
      "packages/ledger-wallet-provider-evm/src/**/*.{ts,tsx}",
      "packages/ledger-wallet-provider-solana/src/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["src/**"],
              message:
                "Import paths should not start with 'src/'. Use relative imports instead.",
            },
            {
              regex: "^\\..*\\.js$",
              message:
                "Omit the .js extension on relative imports; this package uses moduleResolution: bundler.",
            },
          ],
        },
      ],
    },
  },
  {
    // Library builds keep every runtime dependency external, so an import that
    // is not declared in the package's own manifest resolves to nothing on the
    // consumer side.
    files: ["packages/*/src/**/*.{ts,tsx}"],
    ignores: [
      "**/*.test.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
      "**/*.stories.{ts,tsx}",
      "**/__mocks__/**",
      "**/__tests__/**",
    ],
    plugins: {
      import: importPlugin,
    },
    rules: {
      "import/no-extraneous-dependencies": [
        "error",
        {
          devDependencies: false,
          optionalDependencies: false,
          peerDependencies: true,
        },
      ],
    },
  },
  {
    files: ["packages/ledger-button-core/src/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["src/**"],
              message:
                "Import paths should not start with 'src/'. Use relative imports instead.",
            },
            {
              group: [
                "../../**/api/**",
                "../../**/internal/**",
                "../../**/schemas/**",
              ],
              message:
                "Use the '@api/*', '@internal/*' or '@schemas/*' aliases instead of climbing out of the current directory.",
            },
            {
              regex: "^(\\.{1,2}/|@api/|@internal/|@schemas/).+\\.js$",
              message:
                "Omit the .js extension on relative and aliased imports; this package uses moduleResolution: bundler.",
            },
          ],
        },
      ],
    },
  },
];
