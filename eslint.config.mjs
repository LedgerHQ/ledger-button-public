import nx from "@nx/eslint-plugin";
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
          ],
        },
      ],
    },
  },
];
