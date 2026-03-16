const SCOPE = ".ledger-wallet-provider";

/**
 * Splits a comma-separated selector string while respecting nested
 * parentheses and brackets (e.g. :where([type='button'], [type='reset']))
 */
function splitSelectors(selectorStr: string): string[] {
  const selectors: string[] = [];
  let current = "";
  let depth = 0;

  for (const char of selectorStr) {
    if (char === "(" || char === "[") {
      depth++;
      current += char;
    } else if (char === ")" || char === "]") {
      depth--;
      current += char;
    } else if (char === "," && depth === 0) {
      selectors.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  const last = current.trim();
  if (last) {
    selectors.push(last);
  }

  return selectors;
}

/**
 * Scopes an individual CSS selector under .ledger-wallet-provider.
 * Handles :root, :host, html, *, pseudo-elements, element selectors,
 * class selectors, attribute selectors, and vendor-prefixed selectors.
 */
function scopeSelector(selector: string): string {
  const trimmed = selector.trim();
  if (!trimmed) return trimmed;

  if (trimmed.includes(SCOPE)) return trimmed;
  if (trimmed.startsWith("&")) return trimmed;
  if (trimmed === ":root") return SCOPE;
  if (trimmed.startsWith(":host")) return trimmed;
  if (trimmed === "html") return SCOPE;
  if (trimmed === "*") return `${SCOPE} *`;
  if (trimmed === "::backdrop") return `${SCOPE}::backdrop`;
  if (trimmed.startsWith("::")) return `${SCOPE} ${trimmed}`;
  if (trimmed.startsWith(":-")) return `${SCOPE} ${trimmed}`;
  if (trimmed.startsWith("[")) return `${SCOPE} ${trimmed}`;
  if (trimmed.startsWith(".")) return `${SCOPE} ${trimmed}`;
  if (trimmed.startsWith("#")) return trimmed;
  if (trimmed.startsWith(":")) return `${SCOPE} ${trimmed}`;
  if (/^[a-zA-Z]/.test(trimmed)) return `${SCOPE} ${trimmed}`;

  return `${SCOPE} ${trimmed}`;
}

/**
 * Scopes CSS selectors to .ledger-wallet-provider
 * This prevents CSS variables and global styles from leaking into host applications.
 *
 * Processes line-by-line:
 * - Selector lines (ending with {) get each selector scoped
 * - @property blocks pass through unchanged (globally scoped by CSS spec)
 * - @layer / @media / @supports at-rules pass through (selectors inside are scoped)
 * - Nested selectors starting with & pass through (relative to parent)
 */
export function scopeCssSelectors(css: string): string {
  const lines = css.split("\n");
  const result: string[] = [];
  let insideProperty = false;
  let propertyBraceDepth = 0;

  for (const line of lines) {
    if (/^\s*@property\s/.test(line)) {
      insideProperty = true;
      propertyBraceDepth = 0;
    }

    if (insideProperty) {
      result.push(line);
      for (const ch of line) {
        if (ch === "{") propertyBraceDepth++;
        if (ch === "}") propertyBraceDepth--;
      }
      if (propertyBraceDepth <= 0 && line.includes("}")) {
        insideProperty = false;
      }
      continue;
    }

    if (/^\s*@/.test(line)) {
      result.push(line);
      continue;
    }

    if (/^\s*\}/.test(line)) {
      result.push(line);
      continue;
    }

    if (line.trimEnd().endsWith("{")) {
      const braceIndex = line.lastIndexOf("{");
      const selectorPart = line.substring(0, braceIndex);
      const indent = line.match(/^(\s*)/)?.[1] ?? "";

      if (selectorPart.trim().startsWith("&")) {
        result.push(line);
        continue;
      }

      const selectors = splitSelectors(selectorPart);
      const scopedSelectors = selectors.map(scopeSelector);

      result.push(`${indent}${scopedSelectors.join(", ")} {`);
      continue;
    }

    result.push(line);
  }

  let output = result.join("\n");

  const escaped = SCOPE.replace(/\./g, "\\.");
  output = output.replace(new RegExp(`${escaped}\\s*${escaped}`, "g"), SCOPE);

  return output;
}
