import { Left, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AccountWithFiat } from "@api/model/Account";
import type { CalDataSource } from "@internal/balance/datasource/cal/CalDataSource";

import { BuildNetworksUseCase } from "./buildNetworksUseCase";

function createAccount(
  overrides: Partial<AccountWithFiat> = {},
): AccountWithFiat {
  return {
    id: "account-1",
    currencyId: "ethereum",
    freshAddress: "0xaaa",
    seedIdentifier: "seed-1",
    derivationMode: "default",
    index: 0,
    name: "My Ethereum Account",
    ticker: "ETH",
    balance: "1000000000000000000",
    tokens: [],
    fiatBalance: undefined,
    fiatError: false,
    balanceLoadingState: "loaded",
    fiatLoadingState: "loaded",
    ...overrides,
  };
}

describe("BuildNetworksUseCase", () => {
  let calDataSource: { getCurrencyInformation: ReturnType<typeof vi.fn> };
  let useCase: BuildNetworksUseCase;

  beforeEach(() => {
    calDataSource = {
      getCurrencyInformation: vi.fn().mockImplementation((currencyId: string) =>
        Promise.resolve(
          Right({
            id: currencyId,
            name: `${currencyId} network`,
            ticker: currencyId.toUpperCase(),
            decimals: 18,
          }),
        ),
      ),
    };

    useCase = new BuildNetworksUseCase(
      calDataSource as unknown as CalDataSource,
    );
  });

  it("should enrich each account with its CAL name, ticker, balance and totalFiatBalance", async () => {
    const networks = await useCase.execute([
      createAccount({
        currencyId: "ethereum",
        balance: "42",
        fiatBalance: { value: "100.00", currency: "USD" },
        tokens: [],
      }),
    ]);

    expect(networks).toEqual([
      {
        id: "ethereum",
        name: "ethereum network",
        ticker: "ETHEREUM",
        balance: "42",
        fiatBalance: { value: "100.00", currency: "USD" },
        totalFiatBalance: { value: "100.00", currency: "USD" },
      },
    ]);
  });

  it("should aggregate token fiat balances into totalFiatBalance", async () => {
    const networks = await useCase.execute([
      createAccount({
        currencyId: "ethereum",
        fiatBalance: { value: "1000.00", currency: "USD" },
        tokens: [
          {
            ledgerId: "usdc",
            ticker: "USDC",
            name: "USD Coin",
            balance: "2000",
            fiatBalance: { value: "2000.00", currency: "USD" },
          },
          {
            ledgerId: "dai",
            ticker: "DAI",
            name: "Dai",
            balance: "500",
            fiatBalance: { value: "500.00", currency: "USD" },
          },
        ],
      }),
    ]);

    expect(networks[0].totalFiatBalance).toEqual({
      value: "3500.00",
      currency: "USD",
    });
  });

  it("should sort networks by totalFiatBalance (including tokens), descending", async () => {
    const networks = await useCase.execute([
      createAccount({
        currencyId: "ethereum",
        fiatBalance: { value: "10.00", currency: "USD" },
        tokens: [],
      }),
      createAccount({
        currencyId: "polygon",
        fiatBalance: { value: "900.00", currency: "USD" },
        tokens: [],
      }),
    ]);

    expect(networks.map((network) => network.id)).toEqual([
      "polygon",
      "ethereum",
    ]);
  });

  it("should sort by totalFiatBalance when tokens tip the order", async () => {
    // ethereum: native 10 + token 2000 = total 2010  →  first
    // polygon:  native 900 + no tokens = total  900  →  second
    const networks = await useCase.execute([
      createAccount({
        currencyId: "polygon",
        fiatBalance: { value: "900.00", currency: "USD" },
        tokens: [],
      }),
      createAccount({
        currencyId: "ethereum",
        fiatBalance: { value: "10.00", currency: "USD" },
        tokens: [
          {
            ledgerId: "usdc",
            ticker: "USDC",
            name: "USD Coin",
            balance: "2000",
            fiatBalance: { value: "2000.00", currency: "USD" },
          },
        ],
      }),
    ]);

    expect(networks.map((network) => network.id)).toEqual([
      "ethereum",
      "polygon",
    ]);
  });

  it("should treat a network without fiat as zero when sorting", async () => {
    const networks = await useCase.execute([
      createAccount({ currencyId: "ethereum", fiatBalance: undefined }),
      createAccount({
        currencyId: "polygon",
        fiatBalance: { value: "1.00", currency: "USD" },
        tokens: [],
      }),
    ]);

    expect(networks.map((network) => network.id)).toEqual([
      "polygon",
      "ethereum",
    ]);
  });

  it("should treat non-numeric fiat values as zero and not produce NaN", async () => {
    const networks = await useCase.execute([
      createAccount({
        currencyId: "ethereum",
        fiatBalance: { value: "bad", currency: "USD" },
        tokens: [],
      }),
      createAccount({
        currencyId: "polygon",
        fiatBalance: { value: "500.00", currency: "USD" },
        tokens: [],
      }),
    ]);

    const totals = networks.map((n) => n.totalFiatBalance?.value);
    expect(totals).not.toContain("NaN");
    expect(networks.map((n) => n.id)).toEqual(["polygon", "ethereum"]);
  });

  it("should fall back to the account currencyId and ticker when CAL fails", async () => {
    calDataSource.getCurrencyInformation.mockResolvedValue(
      Left(new Error("CAL unavailable")),
    );

    const networks = await useCase.execute([
      createAccount({ currencyId: "ethereum", ticker: "ETH" }),
    ]);

    expect(networks[0]).toMatchObject({
      id: "ethereum",
      name: "ethereum",
      ticker: "ETH",
    });
  });

  it("should query CAL only once per currency across calls", async () => {
    await useCase.execute([createAccount({ currencyId: "ethereum" })]);
    await useCase.execute([createAccount({ currencyId: "ethereum" })]);

    expect(calDataSource.getCurrencyInformation).toHaveBeenCalledTimes(1);
  });

  it("should return an empty array when there is no account", async () => {
    expect(await useCase.execute([])).toEqual([]);
  });
});
