import type { Token } from "@ledgerhq/ledger-wallet-provider-core";
import { describe, expect, it } from "vitest";

import {
  formatCategoryLabel,
  groupTokensByCategory,
} from "./group-tokens-by-category";

function createToken(ledgerId: string, categories: string[]): Token {
  return {
    ledgerId,
    ticker: ledgerId.toUpperCase(),
    name: ledgerId,
    balance: "1",
    fiatBalance: undefined,
    categories,
  };
}

describe("groupTokensByCategory", () => {
  it("keeps every token uncategorized when none has a category", () => {
    const link = createToken("link", []);
    const uni = createToken("uni", []);

    expect(groupTokensByCategory([link, uni])).toEqual({
      uncategorized: [link, uni],
      categories: [],
    });
  });

  it("splits tokens into one group per category, sorted by category id", () => {
    const link = createToken("link", []);
    const aapl = createToken("aapl", ["stocks"]);
    const usdc = createToken("usdc", ["stablecoins"]);
    const usdt = createToken("usdt", ["stablecoins"]);

    expect(groupTokensByCategory([link, aapl, usdc, usdt])).toEqual({
      uncategorized: [link],
      categories: [
        { category: "stablecoins", tokens: [usdc, usdt] },
        { category: "stocks", tokens: [aapl] },
      ],
    });
  });

  it("lists a token with several categories once, under its first category", () => {
    const hybrid = createToken("hybrid", ["stocks", "stablecoins"]);

    expect(groupTokensByCategory([hybrid])).toEqual({
      uncategorized: [],
      categories: [{ category: "stocks", tokens: [hybrid] }],
    });
  });

  it("keeps the token order inside a group", () => {
    const usdt = createToken("usdt", ["stablecoins"]);
    const usdc = createToken("usdc", ["stablecoins"]);

    const { categories } = groupTokensByCategory([usdt, usdc]);

    expect(categories[0].tokens).toEqual([usdt, usdc]);
  });
});

describe("formatCategoryLabel", () => {
  it("uses the translated label when one exists", () => {
    expect(
      formatCategoryLabel("stablecoins", { stablecoins: "Stablecoins" }),
    ).toBe("Stablecoins");
  });

  it("title-cases an unknown category id", () => {
    expect(formatCategoryLabel("real_world_assets", {})).toBe(
      "Real World Assets",
    );
  });

  it("title-cases when no labels are available", () => {
    expect(formatCategoryLabel("stocks", undefined)).toBe("Stocks");
  });
});
