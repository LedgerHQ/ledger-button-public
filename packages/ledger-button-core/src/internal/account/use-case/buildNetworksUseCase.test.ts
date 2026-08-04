import { Left, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AccountWithFiat } from "@api/model/Account.js";
import type { CalDataSource } from "@internal/balance/datasource/cal/CalDataSource.js";
import { BuildNetworksUseCase } from "./buildNetworksUseCase.js";

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

  it("should enrich each account with its CAL name, ticker and balance", async () => {
    const networks = await useCase.execute([
      createAccount({
        currencyId: "ethereum",
        balance: "42",
        fiatBalance: { value: "100.00", currency: "USD" },
      }),
    ]);

    expect(networks).toEqual([
      {
        id: "ethereum",
        name: "ethereum network",
        ticker: "ETHEREUM",
        balance: "42",
        fiatBalance: { value: "100.00", currency: "USD" },
      },
    ]);
  });

  it("should sort networks by fiat value, descending", async () => {
    const networks = await useCase.execute([
      createAccount({
        currencyId: "ethereum",
        fiatBalance: { value: "10.00", currency: "USD" },
      }),
      createAccount({
        currencyId: "polygon",
        fiatBalance: { value: "900.00", currency: "USD" },
      }),
    ]);

    expect(networks.map((network) => network.id)).toEqual([
      "polygon",
      "ethereum",
    ]);
  });

  it("should treat a network without fiat as zero when sorting", async () => {
    const networks = await useCase.execute([
      createAccount({ currencyId: "ethereum", fiatBalance: undefined }),
      createAccount({
        currencyId: "polygon",
        fiatBalance: { value: "1.00", currency: "USD" },
      }),
    ]);

    expect(networks.map((network) => network.id)).toEqual([
      "polygon",
      "ethereum",
    ]);
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
