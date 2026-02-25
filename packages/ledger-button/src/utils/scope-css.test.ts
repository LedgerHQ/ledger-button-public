import { describe, expect, test } from "vitest";

import { scopeCssSelectors } from "./scope-css.js";

describe("scopeCssSelectors", () => {
  describe(":root scoping", () => {
    test("should replace :root with .ledger-wallet-provider", () => {
      const input = `:root {
  --color-primary: #000;
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain(".ledger-wallet-provider {");
      expect(output).not.toContain(":root");
      expect(output).toContain("--color-primary: #000;");
    });

    test("should handle multiple :root selectors", () => {
      const input = `:root {
  --var1: value1;
}

:root {
  --var2: value2;
}`;

      const output = scopeCssSelectors(input);

      expect(output.match(/\.ledger-wallet-provider\s*{/g)).toHaveLength(2);
      expect(output).not.toContain(":root");
    });
  });

  describe("universal selector scoping", () => {
    test("should scope universal selector *", () => {
      const input = `* {
  box-sizing: border-box;
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain(".ledger-wallet-provider * {");
      expect(output).not.toMatch(/^\s*\*\s*{/m);
    });

    test("should scope *, ::before, ::after selector list", () => {
      const input = `*, ::before, ::after {
  margin: 0;
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain(
        ".ledger-wallet-provider *, .ledger-wallet-provider ::before, .ledger-wallet-provider ::after {",
      );
    });
  });

  describe("pseudo-element scoping", () => {
    test("should scope ::backdrop", () => {
      const input = `::backdrop {
  background: rgba(0, 0, 0, 0.5);
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain(".ledger-wallet-provider::backdrop {");
    });

    test("should scope ::before and ::after", () => {
      const input = `::before, ::after {
  content: "";
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain(
        ".ledger-wallet-provider ::before, .ledger-wallet-provider ::after {",
      );
    });
  });

  describe("html and body scoping", () => {
    test("should scope html selector", () => {
      const input = `html {
  font-size: 16px;
}`;

      const output = scopeCssSelectors(input);

      expect(output).toMatch(/\.ledger-wallet-provider\s*{/);
      expect(output).not.toContain("html {");
    });

    test("should preserve :host when scoping :host,html", () => {
      const input = `:host, html {
  font-size: 16px;
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain(":host, .ledger-wallet-provider {");
      expect(output).toContain(":host");
    });

    test("should scope body selector", () => {
      const input = `body {
  margin: 0;
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain(".ledger-wallet-provider body {");
    });
  });

  describe("element selector scoping", () => {
    test("should scope button selector", () => {
      const input = `button {
  cursor: pointer;
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain(".ledger-wallet-provider button {");
    });

    test("should scope input selector", () => {
      const input = `input {
  border: 1px solid;
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain(".ledger-wallet-provider input {");
    });

    test("should scope all element selectors in comma-separated rules", () => {
      const input = `h1, h2, h3 {
  font-weight: bold;
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain(".ledger-wallet-provider h1");
      expect(output).toContain(".ledger-wallet-provider h2");
      expect(output).toContain(".ledger-wallet-provider h3");
    });
  });

  describe("pseudo-class scoping", () => {
    test("should scope :disabled", () => {
      const input = `:disabled {
  opacity: 0.5;
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain(".ledger-wallet-provider :disabled {");
    });
  });

  describe("attribute selector scoping", () => {
    test("should scope [hidden] selector", () => {
      const input = `[hidden] {
  display: none;
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain(".ledger-wallet-provider [hidden]");
    });

    test("should scope [type=search] selector", () => {
      const input = `[type=search] {
  appearance: textfield;
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain(".ledger-wallet-provider [type=search] {");
    });
  });

  describe("vendor-prefixed selector scoping", () => {
    test("should scope :-moz-focusring", () => {
      const input = `:-moz-focusring {
  outline: auto;
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain(".ledger-wallet-provider :-moz-focusring {");
    });

    test("should scope webkit pseudo-elements", () => {
      const input = `::-webkit-inner-spin-button, ::-webkit-outer-spin-button {
  height: auto;
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain(
        ".ledger-wallet-provider ::-webkit-inner-spin-button",
      );
      expect(output).toContain(
        ".ledger-wallet-provider ::-webkit-outer-spin-button",
      );
    });
  });

  describe("placeholder selector scoping", () => {
    test("should scope all placeholder selectors in comma-separated list", () => {
      const input = `input::placeholder, textarea::placeholder {
  opacity: 1;
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain(".ledger-wallet-provider input::placeholder");
      expect(output).toContain(
        ".ledger-wallet-provider textarea::placeholder",
      );
    });
  });

  describe("double scoping prevention", () => {
    test("should prevent double scoping", () => {
      const input = `.ledger-wallet-provider.ledger-wallet-provider {
  color: red;
}`;

      const output = scopeCssSelectors(input);

      expect(output).not.toContain(
        ".ledger-wallet-provider.ledger-wallet-provider",
      );
      expect(output).toContain(".ledger-wallet-provider {");
    });
  });

  describe("real-world CSS scenarios", () => {
    test("should handle Tailwind base layer CSS", () => {
      const input = `*, ::before, ::after {
  --tw-border-spacing-x: 0;
  --tw-border-spacing-y: 0;
}

::backdrop {
  --tw-border-spacing-x: 0;
}

html {
  line-height: 1.5;
}

body {
  margin: 0;
}

button, input {
  font-family: inherit;
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain(
        ".ledger-wallet-provider *, .ledger-wallet-provider ::before",
      );
      expect(output).toContain(".ledger-wallet-provider::backdrop {");
      expect(output).toMatch(/\.ledger-wallet-provider\s*{/);
      expect(output).toContain(".ledger-wallet-provider body {");
      expect(output).toContain(".ledger-wallet-provider button");
      expect(output).toContain(".ledger-wallet-provider input");
      expect(output).not.toContain(":root");
      expect(output).not.toContain("html {");
    });

    test("should not affect already scoped selectors", () => {
      const input = `.ledger-wallet-provider .some-class {
  color: blue;
}

.some-other-class {
  color: red;
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain(".ledger-wallet-provider .some-class {");
      expect(output).not.toContain(
        ".ledger-wallet-provider .ledger-wallet-provider .some-class",
      );
      expect(output).toContain(
        ".ledger-wallet-provider .some-other-class {",
      );
    });
  });

  describe("utility class scoping", () => {
    test("should scope simple utility classes", () => {
      const input = `  .flex {
    display: flex;
  }
  .hidden {
    display: none;
  }`;

      const output = scopeCssSelectors(input);

      expect(output).toContain(".ledger-wallet-provider .flex {");
      expect(output).toContain(".ledger-wallet-provider .hidden {");
    });

    test("should scope escaped utility classes", () => {
      const input = `  .hover\\:bg-accent-hover {
    &:hover {
      background-color: var(--background-accent-hover);
    }
  }`;

      const output = scopeCssSelectors(input);

      expect(output).toContain(
        ".ledger-wallet-provider .hover\\:bg-accent-hover {",
      );
      expect(output).not.toMatch(/\.ledger-wallet-provider\s+&:hover/);
    });

    test("should scope utility classes inside @layer", () => {
      const input = `@layer utilities {
  .flex {
    display: flex;
  }
  .bg-active {
    background-color: var(--background-active);
  }
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain(".ledger-wallet-provider .flex {");
      expect(output).toContain(".ledger-wallet-provider .bg-active {");
    });

    test("should not scope & nesting selectors", () => {
      const input = `  .group-hover\\:translate-x-1 {
    &:is(:where(.group):hover *) {
      translate: 0.25rem;
    }
  }`;

      const output = scopeCssSelectors(input);

      expect(output).toContain(
        ".ledger-wallet-provider .group-hover\\:translate-x-1 {",
      );
      expect(output).toContain("&:is(:where(.group):hover *) {");
    });

    test("should not double-scope .ledger-wallet-provider selectors", () => {
      const input = `.ledger-wallet-provider .some-class {
  color: blue;
}`;

      const output = scopeCssSelectors(input);

      expect(output).not.toContain(
        ".ledger-wallet-provider .ledger-wallet-provider",
      );
    });
  });

  describe("edge cases", () => {
    test("should handle empty CSS", () => {
      const output = scopeCssSelectors("");
      expect(output).toBe("");
    });

    test("should scope class selectors but not ID selectors", () => {
      const input = `.my-class {
  color: red;
}

#my-id {
  color: blue;
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain(".ledger-wallet-provider .my-class {");
      expect(output).toContain("#my-id {");
      expect(output).not.toContain(".ledger-wallet-provider #my-id");
    });

    test("should handle CSS with comments", () => {
      const input = `/* Comment */
:root {
  --var: value;
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain("/* Comment */");
      expect(output).toContain(".ledger-wallet-provider {");
      expect(output).not.toContain(":root");
    });
  });

  describe("Tailwind v4 specific patterns", () => {
    test("should scope :root, :host selector", () => {
      const input = `:root, :host {
  --default-font-family: "Inter", sans-serif;
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain(".ledger-wallet-provider, :host {");
      expect(output).not.toContain(":root");
    });

    test("should scope *, ::after, ::before, ::backdrop, ::file-selector-button", () => {
      const input = `*, ::after, ::before, ::backdrop, ::file-selector-button {
  box-sizing: border-box;
  margin: 0;
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain(".ledger-wallet-provider *");
      expect(output).toContain(".ledger-wallet-provider ::after");
      expect(output).toContain(".ledger-wallet-provider ::before");
      expect(output).toContain(".ledger-wallet-provider::backdrop");
      expect(output).toContain(
        ".ledger-wallet-provider ::file-selector-button",
      );
      expect(output).not.toMatch(/^\*,/m);
    });

    test("should scope html, :host selector", () => {
      const input = `html, :host {
  line-height: 1.5;
  font-family: var(--default-font-family);
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain(".ledger-wallet-provider, :host {");
      expect(output).not.toContain("html,");
      expect(output).not.toContain("html {");
    });

    test("should scope complex comma-separated selectors with :where()", () => {
      const input = `button, input:where([type='button'], [type='reset'], [type='submit']), ::file-selector-button {
  appearance: button;
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain(".ledger-wallet-provider button");
      expect(output).toContain(
        ".ledger-wallet-provider input:where([type='button'], [type='reset'], [type='submit'])",
      );
      expect(output).toContain(
        ".ledger-wallet-provider ::file-selector-button",
      );
    });

    test("should pass through @property blocks unchanged", () => {
      const input = `@property --tw-translate-x {
  syntax: "*";
  inherits: false;
  initial-value: 0;
}
@property --tw-shadow {
  syntax: "*";
  inherits: false;
  initial-value: 0 0 #0000;
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain("@property --tw-translate-x {");
      expect(output).toContain('syntax: "*";');
      expect(output).toContain("inherits: false;");
      expect(output).toContain("initial-value: 0;");
      expect(output).toContain("@property --tw-shadow {");
      expect(output).not.toContain(".ledger-wallet-provider");
    });

    test("should scope selectors inside @layer base", () => {
      const input = `@layer base {
  :root {
    --color-grey-100: #fafafa;
    --color-grey-200: #f1f1f1;
  }
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain("@layer base {");
      expect(output).toContain(".ledger-wallet-provider {");
      expect(output).not.toContain(":root");
      expect(output).toContain("--color-grey-100: #fafafa;");
    });

    test("should scope selectors inside @supports blocks", () => {
      const input = `@supports (not (-webkit-appearance: -apple-pay-button)) {
  ::placeholder {
    color: currentcolor;
  }
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain("@supports");
      expect(output).toContain(
        ".ledger-wallet-provider ::placeholder {",
      );
    });

    test("should scope selectors inside @layer properties @supports fallback", () => {
      const input = `@layer properties {
  @supports ((-webkit-hyphens: none) and (not (margin-trim: inline))) {
    *, ::before, ::after, ::backdrop {
      --tw-translate-x: 0;
    }
  }
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain("@layer properties {");
      expect(output).toContain("@supports");
      expect(output).toContain(".ledger-wallet-provider *");
      expect(output).toContain(".ledger-wallet-provider ::before");
      expect(output).toContain(".ledger-wallet-provider ::after");
      expect(output).toContain(".ledger-wallet-provider::backdrop");
    });

    test("should handle CSS nesting with & for hover variants", () => {
      const input = `.hover\\:bg-accent-hover {
  &:hover {
    @media (hover: hover) {
      background-color: var(--background-accent-hover);
    }
  }
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain(
        ".ledger-wallet-provider .hover\\:bg-accent-hover {",
      );
      expect(output).toContain("&:hover {");
      expect(output).toContain("@media (hover: hover) {");
    });

    test("should pass through @layer declarations", () => {
      const input = `@layer properties;
:root, :host {
  --font: "Inter";
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain("@layer properties;");
      expect(output).toContain(".ledger-wallet-provider, :host {");
    });

    test("should scope [hidden]:where(:not([hidden='until-found'])) selector", () => {
      const input = `[hidden]:where(:not([hidden='until-found'])) {
  display: none !important;
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain(
        ".ledger-wallet-provider [hidden]:where(:not([hidden='until-found'])) {",
      );
    });

    test("should scope :where() selectors with nested structure", () => {
      const input = `:where(select:is([multiple], [size])) optgroup {
  font-weight: bolder;
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain(
        ".ledger-wallet-provider :where(select:is([multiple], [size])) optgroup {",
      );
    });

    test("should scope container class with nested @media", () => {
      const input = `.container {
  width: 100%;
  @media (width >= 360px) {
    max-width: 360px;
  }
  @media (width >= 640px) {
    max-width: 640px;
  }
}`;

      const output = scopeCssSelectors(input);

      expect(output).toContain(".ledger-wallet-provider .container {");
      expect(output).toContain("@media (width >= 360px) {");
      expect(output).toContain("max-width: 360px;");
    });
  });
});
