import type { Token } from "@ledgerhq/ledger-wallet-provider-core";

export type TokenCategoryGroup = {
  category: string;
  tokens: Token[];
};

export type GroupedTokens = {
  uncategorized: Token[];
  categories: TokenCategoryGroup[];
};

/**
 * A token listed under several CAL categories is shown once, under its first
 * category, so the same balance is never counted twice in the list.
 */
export function groupTokensByCategory(tokens: Token[]): GroupedTokens {
  const uncategorized: Token[] = [];
  const tokensByCategory = new Map<string, Token[]>();

  for (const token of tokens) {
    const category = token.categories[0];

    if (!category) {
      uncategorized.push(token);
      continue;
    }

    const categoryTokens = tokensByCategory.get(category) ?? [];
    categoryTokens.push(token);
    tokensByCategory.set(category, categoryTokens);
  }

  const categories = [...tokensByCategory.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, categoryTokens]) => ({
      category,
      tokens: categoryTokens,
    }));

  return { uncategorized, categories };
}

export function formatCategoryLabel(
  category: string,
  labels: Record<string, string> | undefined,
): string {
  const label = labels?.[category];
  if (label) {
    return label;
  }

  return category
    .split(/[_-]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
