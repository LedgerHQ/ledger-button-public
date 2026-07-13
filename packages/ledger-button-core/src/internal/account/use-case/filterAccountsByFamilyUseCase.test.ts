import { Just, type Maybe, Nothing } from "purify-ts";
import { lastValueFrom, of } from "rxjs";
import { describe, expect, it, vi } from "vitest";

import type { BlockchainFamily } from "../../../api/blockchain-provider/model/types.js";
import type { BlockchainProviderManager } from "../../blockchain-provider/service/BlockchainProviderManager.js";
import type { AccountWithFiat } from "../service/AccountService.js";
import { FilterAccountsByFamilyUseCase } from "./filterAccountsByFamilyUseCase.js";

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

const account = (id: string, currencyId: string): AccountWithFiat => ({
  ...base,
  id,
  currencyId,
});

const familyByCurrency: Record<string, BlockchainFamily> = {
  ethereum: "ethereum",
  polygon: "ethereum",
  solana: "solana",
};

const makeManager = (): BlockchainProviderManager =>
  ({
    resolveBlockchainFamily: vi.fn(
      (currencyId: string): Maybe<BlockchainFamily> => {
        const family = familyByCurrency[currencyId];
        return family ? Just(family) : Nothing;
      },
    ),
  }) as unknown as BlockchainProviderManager;

describe("FilterAccountsByFamilyUseCase", () => {
  it("should return the stream untouched when no family is provided", async () => {
    const useCase = new FilterAccountsByFamilyUseCase(makeManager());
    const accounts = [account("a", "ethereum"), account("b", "solana")];

    const result = await lastValueFrom(useCase.execute(of(accounts)));

    expect(result).toBe(accounts);
  });

  it("should keep only accounts belonging to the requested family", async () => {
    const useCase = new FilterAccountsByFamilyUseCase(makeManager());
    const accounts = [
      account("a", "ethereum"),
      account("b", "polygon"),
      account("c", "solana"),
    ];

    const result = await lastValueFrom(
      useCase.execute(of(accounts), "ethereum"),
    );

    expect(result.map((a) => a.id)).toEqual(["a", "b"]);
  });

  it("should exclude accounts whose currency cannot be resolved to a family", async () => {
    const useCase = new FilterAccountsByFamilyUseCase(makeManager());
    const accounts = [account("a", "ethereum"), account("b", "bitcoin")];

    const result = await lastValueFrom(
      useCase.execute(of(accounts), "ethereum"),
    );

    expect(result.map((a) => a.id)).toEqual(["a"]);
  });
});
