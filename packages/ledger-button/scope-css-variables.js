#!/usr/bin/env node

/**
 * Script to scope CSS selectors to .ledger-wallet-provider
 * This prevents CSS variables and global styles from leaking into host applications
 */

import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Import the scoping function
// Use dynamic import to handle both compiled (dist) and source (src) locations
const __dirname = dirname(fileURLToPath(import.meta.url));

async function loadScopeCssFunction() {
  // Import from source TypeScript file (tsx will handle compilation)
  const module = await import("./src/utils/scope-css.ts");
  return module.scopeCssSelectors;
}

// Get the CSS file path from command line args or use default
const cssFile = process.argv[2] || join(__dirname, "dist", "styles.css");

(async () => {
  try {
    // Load the scoping function
    const scopeCssSelectors = await loadScopeCssFunction();

    // Read the CSS file
    const css = readFileSync(cssFile, "utf8");

    // Scope all CSS selectors
    const scopedCss = scopeCssSelectors(css);

    // Write the modified CSS back
    writeFileSync(cssFile, scopedCss, "utf8");

    console.log(`✓ Scoped CSS variables and global styles in ${cssFile}`);
  } catch (error) {
    console.error(`Error processing CSS file: ${error.message}`);
    process.exit(1);
  }
})();
