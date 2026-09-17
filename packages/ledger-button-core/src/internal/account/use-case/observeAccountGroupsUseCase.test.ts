import { type Factory } from "inversify";
import { BehaviorSubject, firstValueFrom, lastValueFrom, of, toArray } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AccountGroup, AccountWithFiat } from "@api/model/Account";
import type { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import { ObserveAccountGroupsUseCase } from "./observeAccountGroupsUseCase";
import type { ObserveAccountsWithFiatUseCase } from "./observeAccountsWithFiatUseCase";

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

const usdt = {
  ledgerId: "ethereum/erc20/usdt",
  ticker: "USDT",
  name: "Tether",
  balance: "50000000",
  fiatBalance: { value: "50.00", currency: "USD" },
};

describe("ObserveAccountGroupsUseCase", () => {
  let observeAccountsWithFiatUseCase: { execute: ReturnType<typeof vi.fn> };
  let useCase: ObserveAccountGroupsUseCase;

  function makeUseCase(accounts: AccountWithFiat[]) {
    observeAccountsWithFiatUseCase = {
      execute: vi.fn().mockReturnValue(of(accounts)),
    };

    const loggerFactory = (() => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })) as unknown as Factory<LoggerPublisher>;

    useCase = new ObserveAccountGroupsUseCase(
      loggerFactory,
      observeAccountsWithFiatUseCase as unknown as ObserveAccountsWithFiatUseCase,
    );

    return useCase;
  }

  function firstGroups(
    options?: Parameters<ObserveAccountGroupsUseCase["execute"]>[0],
  ): Promise<AccountGroup[]> {
    return firstValueFrom(useCase.execute(options));
  }

  describe("options forwarding", () => {
    beforeEach(() => makeUseCase([createAccount()]));

    it("should forward the family and forceRefresh to the account stream", async () => {
      await firstGroups({ family: "solana", forceRefresh: true });

      expect(observeAccountsWithFiatUseCase.execute).toHaveBeenCalledWith({
        family: "solana",
        forceRefresh: true,
      });
    });
  });

  describe("per-account enrichment", () => {
    it("should sum native and token fiat into totalFiatValue", async () => {
      makeUseCase([
        createAccount({
          fiatBalance: { value: "1000.00", currency: "USD" },
          tokens: [usdt],
        }),
      ]);

      const [group] = await firstGroups();

      expect(group?.accounts[0]?.totalFiatValue).toEqual({
        value: "1050.00",
        currency: "USD",
      });
    });

    it("should sum the token fiat when the native fiat value is zero", async () => {
      makeUseCase([
        createAccount({
          fiatBalance: { value: "0.00", currency: "USD" },
          tokens: [usdt],
        }),
      ]);

      const [group] = await firstGroups();

      expect(group?.accounts[0]?.totalFiatValue).toEqual({
        value: "50.00",
        currency: "USD",
      });
    });

    it("should leave totalFiatValue undefined while nothing is hydrated", async () => {
      makeUseCase([createAccount({ fiatBalance: undefined, tokens: [] })]);

      const [group] = await firstGroups();

      expect(group?.accounts[0]?.totalFiatValue).toBeUndefined();
    });

    it("should expose the display tokens alongside the raw tokens", async () => {
      makeUseCase([
        createAccount({
          fiatBalance: { value: "1200.00", currency: "USD" },
          tokens: [usdt],
        }),
      ]);

      const [group] = await firstGroups();

      expect(group?.accounts[0]?.tokens).toEqual([usdt]);
      expect(group?.accounts[0]?.displayTokens.map((t) => t.ticker)).toEqual([
        "ETH",
        "USDT",
      ]);
    });
  });

  describe("grouping", () => {
    it("should group accounts sharing the same address", async () => {
      makeUseCase([
        createAccount({ id: "a", freshAddress: "0xaaa" }),
        createAccount({ id: "b", freshAddress: "0xaaa", currencyId: "polygon" }),
        createAccount({ id: "c", freshAddress: "0xbbb" }),
      ]);

      const groups = await firstGroups();

      expect(groups.map((group) => group.freshAddress)).toEqual([
        "0xaaa",
        "0xbbb",
      ]);
      expect(groups[0]?.accounts.map((account) => account.id)).toEqual([
        "a",
        "b",
      ]);
    });

    it("should sort groups by their total fiat value, descending", async () => {
      makeUseCase([
        createAccount({
          freshAddress: "0xsmall",
          fiatBalance: { value: "10.00", currency: "USD" },
        }),
        createAccount({
          freshAddress: "0xbig",
          fiatBalance: { value: "900.00", currency: "USD" },
        }),
      ]);

      const groups = await firstGroups();

      expect(groups.map((group) => group.freshAddress)).toEqual([
        "0xbig",
        "0xsmall",
      ]);
    });

    it("should expose the summed fiat value of the group", async () => {
      makeUseCase([
        createAccount({
          freshAddress: "0xaaa",
          fiatBalance: { value: "100.50", currency: "USD" },
        }),
        createAccount({
          freshAddress: "0xaaa",
          currencyId: "polygon",
          fiatBalance: { value: "20.25", currency: "USD" },
        }),
      ]);

      const groups = await firstGroups();

      expect(groups[0]?.totalFiatValue).toEqual({
        value: "120.75",
        currency: "USD",
      });
    });

    it("should emit an empty array when there is no account", async () => {
      makeUseCase([]);

      expect(await firstGroups()).toEqual([]);
    });
  });

  describe("search", () => {
    beforeEach(() =>
      makeUseCase([
        createAccount({
          id: "eth",
          freshAddress: "0xaaa",
          name: "My Ethereum Account",
          ticker: "ETH",
          tokens: [usdt],
        }),
        createAccount({
          id: "sol",
          freshAddress: "0xbbb",
          currencyId: "solana",
          name: "Solana 1",
          ticker: "SOL",
        }),
      ]),
    );

    function accountIds(groups: AccountGroup[]): string[] {
      return groups.flatMap((group) =>
        group.accounts.map((account) => account.id),
      );
    }

    it("should keep every account when the query is empty", async () => {
      const groups = await firstGroups({ searchQuery$: of("") });

      expect(accountIds(groups)).toEqual(["eth", "sol"]);
    });

    it("should filter on the account name", async () => {
      const groups = await firstGroups({ searchQuery$: of("solana") });

      expect(accountIds(groups)).toEqual(["sol"]);
    });

    it("should filter on the address", async () => {
      const groups = await firstGroups({ searchQuery$: of("0xbbb") });

      expect(accountIds(groups)).toEqual(["sol"]);
    });

    it("should filter on a token name", async () => {
      const groups = await firstGroups({ searchQuery$: of("tether") });

      expect(accountIds(groups)).toEqual(["eth"]);
    });

    it("should emit no group when nothing matches", async () => {
      expect(await firstGroups({ searchQuery$: of("bitcoin") })).toEqual([]);
    });

    it("should re-emit when the query changes", async () => {
      const searchQuery$ = new BehaviorSubject("");
      const groups$ = useCase.execute({ searchQuery$ }).pipe(toArray());

      const emissions = lastValueFrom(groups$);
      searchQuery$.next("solana");
      searchQuery$.complete();

      expect((await emissions).map(accountIds)).toEqual([
        ["eth", "sol"],
        ["sol"],
      ]);
    });
  });
});
