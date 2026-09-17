import { lastValueFrom, of } from "rxjs";
import { describe, expect, it } from "vitest";

import type { AccountWithFiat } from "@api/model/Account";

import { SortAccountsByFiatUseCase } from "./sortAccountsByFiatUseCase";

const base: AccountWithFiat = {
  id: "",
  currencyId: "ethereum",
  freshAddress: "0x00",
  seedIdentifier: "seed",
  derivationMode: "default",
  index: 0,
  name: "Account",
  ticker: "ETH",
  balance: "1.0",
  tokens: [],
  fiatBalance: undefined,
  fiatError: false,
  balanceLoadingState: "loaded",
  fiatLoadingState: "loaded",
};

const fiat = (id: string, value: string): AccountWithFiat => ({
  ...base,
  id,
  fiatBalance: { value, currency: "usd" },
});
const noFiat = (id: string): AccountWithFiat => ({ ...base, id });

describe("SortAccountsByFiatUseCase", () => {
  const useCase = new SortAccountsByFiatUseCase();

  it("should place hydrated accounts before non-hydrated, then sort by fiat descending", async () => {
    const accounts = [noFiat("d"), fiat("a", "10"), noFiat("e"), fiat("b", "100"), fiat("c", "50")];

    const result = await lastValueFrom(useCase.execute(of(accounts)));

    expect(result.map((a) => a.id)).toEqual(["b", "c", "a", "d", "e"]);
  });
});
