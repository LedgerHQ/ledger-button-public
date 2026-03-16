import { lastValueFrom, toArray } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { enrichWithLoadingStates } from "../accountFiatUtils.js";
import type {
  Account,
  AccountWithFiat,
  FiatBalance,
} from "../service/AccountService.js";
import { FetchAccountsWithFiatUseCase } from "./fetchAccountsWithFiatUseCase.js";
import { HydrateAccountWithFiatUseCase } from "./hydrateAccountWithFiatUseCase.js";

function createMockLogger() {
  return {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    fatal: vi.fn(),
    subscribers: [],
  };
}

function createMockLoggerFactory() {
  return vi.fn().mockReturnValue(createMockLogger());
}

function createMockAccount(overrides: Partial<Account> = {}): Account {
  return {
    freshAddress: "0x1234567890123456789012345678901234567890",
    seedIdentifier: "seed-1",
    derivationMode: "default",
    index: 0,
    name: "john.eth",
    ticker: "ETH",
    balance: "2.5",
    tokens: [],
    ...overrides,
    id: overrides.id ?? "account-1",
    currencyId: overrides.currencyId ?? "ethereum",
  };
}

function createDeferredPromise<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const mockEthAccountValue = {
  id: "account-1",
  name: "john.eth",
  currencyId: "ethereum",
};

const mockUsdtAccountValue = {
  id: "account-2",
  name: "USDT Account",
  currencyId: "tether",
  ticker: "USDT",
};

const ETH_FIAT_BALANCE: FiatBalance = {
  value: "6250.00",
  currency: "USD",
};

const USDT_FIAT_BALANCE: FiatBalance = {
  value: "1000.00",
  currency: "USD",
};

function createMockHydrateImplementation(
  account1Fiat: FiatBalance | undefined,
  account2Fiat: FiatBalance | undefined,
): (account: Account, targetCurrency?: string) => Promise<AccountWithFiat> {
  return async (account: Account) => {
    if (account.id === mockEthAccountValue.id) {
      return enrichWithLoadingStates({
        ...account,
        fiatBalance: account1Fiat,
        fiatError: false,
      });
    }
    return enrichWithLoadingStates({
      ...account,
      fiatBalance: account2Fiat,
      fiatError: false,
    });
  };
}

describe("FetchAccountsWithFiatUseCase", () => {
  let useCase: FetchAccountsWithFiatUseCase;
  let mockHydrateAccountWithFiatUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockHydrateAccountWithFiatUseCase = {
      execute: vi.fn(),
    };

    useCase = new FetchAccountsWithFiatUseCase(
      createMockLoggerFactory(),
      mockHydrateAccountWithFiatUseCase as unknown as HydrateAccountWithFiatUseCase,
    );

    vi.clearAllMocks();
  });

  describe("execute", () => {
    it("should return Observable<AccountWithFiat[]>", () => {
      const account1 = createMockAccount(mockEthAccountValue);
      const account2 = createMockAccount(mockUsdtAccountValue);

      mockHydrateAccountWithFiatUseCase.execute.mockImplementation(
        createMockHydrateImplementation(ETH_FIAT_BALANCE, USDT_FIAT_BALANCE),
      );

      const result$ = useCase.execute([account1, account2]);

      expect(result$).toBeDefined();
      expect(typeof result$.subscribe).toBe("function");
    });

    it("should return empty observable when accounts array is empty", async () => {
      const emissions = await lastValueFrom(useCase.execute([]).pipe(toArray()));

      expect(emissions).toEqual([[]]);
      expect(mockHydrateAccountWithFiatUseCase.execute).not.toHaveBeenCalled();
    });

    it("should emit accounts without fiat values as first emission", async () => {
      const account1 = createMockAccount(mockEthAccountValue);
      const account2 = createMockAccount(mockUsdtAccountValue);
      const accounts = [account1, account2];
      mockHydrateAccountWithFiatUseCase.execute.mockImplementation(
        createMockHydrateImplementation(ETH_FIAT_BALANCE, USDT_FIAT_BALANCE),
      );

      const emissions = await lastValueFrom(
        useCase.execute(accounts).pipe(toArray()),
      );

      expect(emissions.length).toBeGreaterThan(0);

      const firstEmission = emissions[0];
      expect(firstEmission).toHaveLength(accounts.length);
      accounts.forEach((account, index) => {
        expect(firstEmission[index].fiatBalance).toBeUndefined();
        expect(firstEmission[index].name).toBe(account.name);
      });
    });

    it("should emit updated array as each fiat value arrives", async () => {
      const account1 = createMockAccount(mockEthAccountValue);
      const account2 = createMockAccount(mockUsdtAccountValue);

      const account1WithFiat: AccountWithFiat = enrichWithLoadingStates({
        ...account1,
        fiatBalance: ETH_FIAT_BALANCE,
        fiatError: false,
      });
      const account2WithFiat: AccountWithFiat = enrichWithLoadingStates({
        ...account2,
        fiatBalance: USDT_FIAT_BALANCE,
        fiatError: false,
      });

      const ethDeferred = createDeferredPromise<AccountWithFiat>();
      const usdtDeferred = createDeferredPromise<AccountWithFiat>();

      mockHydrateAccountWithFiatUseCase.execute.mockImplementation(
        async (account: Account) => {
          if (account.id === account1.id) {
            return ethDeferred.promise;
          }
          return usdtDeferred.promise;
        },
      );

      const emissionsPromise = lastValueFrom(
        useCase.execute([account1, account2]).pipe(toArray()),
      );

      // Resolve ETH first to simulate faster loading
      ethDeferred.resolve(account1WithFiat);
      await Promise.resolve();

      // Resolve USDT after
      usdtDeferred.resolve(account2WithFiat);

      const emissions = await emissionsPromise;

      // First emission: no fiat values
      const accounts = [account1, account2];
      accounts.forEach((account: Account, index: number) => {
        expect(emissions[0][index].name).toBe(account.name);
        expect(emissions[0][index].fiatBalance).toBeUndefined();
      });

      // Find emission where ETH has fiat but USDT does not
      const ethLoadedEmission = emissions.find(
        (emission) =>
          emission[0].fiatBalance?.value === ETH_FIAT_BALANCE.value &&
          emission[1].fiatBalance === undefined,
      );
      expect(ethLoadedEmission).toBeDefined();

      // Final emission: both fiat values loaded
      const finalEmission = emissions[emissions.length - 1];
      expect(finalEmission[0].fiatBalance?.value).toBe(ETH_FIAT_BALANCE.value);
      expect(finalEmission[1].fiatBalance?.value).toBe(USDT_FIAT_BALANCE.value);
    });

    it("should not block other accounts when first account fiat fetch fails", async () => {
      const account1 = createMockAccount(mockEthAccountValue);
      const account2 = createMockAccount(mockUsdtAccountValue);

      const account2WithFiat: AccountWithFiat = enrichWithLoadingStates({
        ...account2,
        fiatBalance: USDT_FIAT_BALANCE,
        fiatError: false,
      });

      mockHydrateAccountWithFiatUseCase.execute.mockImplementation(
        async (account: Account) => {
          if (account.id === account1.id) {
            throw new Error("Fiat fetch failed");
          }
          return account2WithFiat;
        },
      );

      const emissions = await lastValueFrom(
        useCase.execute([account1, account2]).pipe(toArray()),
      );

      // Should still emit updates for account-2
      const finalEmission = emissions[emissions.length - 1];
      expect(finalEmission).toHaveLength(2);
      // account-1 should remain with undefined fiatBalance (error handled)
      expect(finalEmission[0].fiatBalance).toBeUndefined();
      // account-2 should have fiatBalance loaded
      expect(finalEmission[1].fiatBalance?.value).toBe(USDT_FIAT_BALANCE.value);
    });

    it("should use custom target currency when provided", async () => {
      const account1 = createMockAccount(mockEthAccountValue);
      const eurFiatBalance: FiatBalance = {
        value: "5750.00",
        currency: "EUR",
      };

      mockHydrateAccountWithFiatUseCase.execute.mockResolvedValue(
        enrichWithLoadingStates({
          ...account1,
          fiatBalance: eurFiatBalance,
          fiatError: false,
        }),
      );

      const emissions = await lastValueFrom(
        useCase.execute([account1], "eur").pipe(toArray()),
      );

      expect(mockHydrateAccountWithFiatUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          ...account1,
          fiatBalance: undefined,
          fiatError: false,
        }),
        "eur",
      );

      const finalEmission = emissions[emissions.length - 1];
      expect(finalEmission[0].fiatBalance?.currency).toBe("EUR");
      expect(finalEmission[0].fiatBalance?.value).toBe(eurFiatBalance.value);
    });

    it("should handle accounts without balance gracefully", async () => {
      const accountWithoutBalance = createMockAccount({
        ...mockEthAccountValue,
        balance: undefined,
      });
      const accountWithBalance = createMockAccount(mockUsdtAccountValue);

      mockHydrateAccountWithFiatUseCase.execute.mockImplementation(
        async (account: Account) => {
          if (account.balance === undefined) {
            return enrichWithLoadingStates({
              ...account,
              fiatBalance: undefined,
              fiatError: false,
            });
          }
          return enrichWithLoadingStates({
            ...account,
            fiatBalance: USDT_FIAT_BALANCE,
            fiatError: false,
          });
        },
      );

      const emissions = await lastValueFrom(
        useCase.execute([accountWithoutBalance, accountWithBalance]).pipe(
          toArray(),
        ),
      );

      const finalEmission = emissions[emissions.length - 1];
      expect(finalEmission[0].fiatBalance).toBeUndefined();
      expect(finalEmission[1].fiatBalance?.value).toBe(USDT_FIAT_BALANCE.value);
    });
  });
});
