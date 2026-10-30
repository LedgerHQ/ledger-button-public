import {
  configs,
  NO_RESTRICTED_IMPORTS_OPTIONS,
} from "@ledgerhq/lumen-lint-plugin/eslint";

const SRC_PATTERNS = [
  {
    group: ["src/**"],
    message:
      "Import paths should not start with 'src/'. Use relative imports instead.",
  },
];

/**
 * Class-bearing syntax only: `class`/`className` attributes and cva/cn calls.
 * The better-tailwindcss defaults also read any variable named `styles`, which
 * in the Lit components holds raw CSS from a `css` template.
 */
const CLASS_SELECTORS = [
  { kind: "attribute", name: "^class(?:Name)?$" },
  { kind: "callee", name: "^(?:cva|cn)$", match: [{ type: "strings" }] },
  {
    kind: "callee",
    name: "^cva$",
    match: [{ type: "objectValues", path: "^variants.*$" }],
  },
  {
    kind: "callee",
    name: "^cva$",
    match: [
      {
        type: "objectValues",
        path: "^compoundVariants\\[\\d+\\]\\.(?:className|class)$",
      },
    ],
  },
];

/**
 * Lumen Tailwind lint for a package that uses Tailwind. The preset registers
 * better-tailwindcss itself, so call this once per package and never spread it
 * from the shared root config.
 *
 * The preset's `no-restricted-imports` replaces the repo-wide one, so the
 * `src/**` pattern is carried over here.
 *
 * @param {{ entryPoint: string; files: string[]; ignoredClasses?: string[] }} options
 *   `entryPoint` is the Tailwind entry CSS, relative to the directory ESLint
 *   runs from. `ignoredClasses` lists class names generated outside Tailwind
 *   (e.g. JS hooks used as selectors).
 */
export function lumenTailwind({ entryPoint, files, ignoredClasses = [] }) {
  return [
    { ...configs.recommended, files },
    {
      files,
      settings: {
        "better-tailwindcss": { entryPoint, selectors: CLASS_SELECTORS },
      },
      rules: {
        ...(ignoredClasses.length > 0 && {
          "better-tailwindcss/no-unknown-classes": [
            "error",
            { ignore: ignoredClasses },
          ],
        }),
        "no-restricted-imports": [
          "error",
          { ...NO_RESTRICTED_IMPORTS_OPTIONS, patterns: SRC_PATTERNS },
        ],
      },
    },
  ];
}
