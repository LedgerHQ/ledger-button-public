import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AccountService } from "../service/AccountService.js";
import type { Account } from "../service/AccountService.js";
import type { FetchAccountsUseCase } from "./fetchAccountsUseCase.js";
import { FetchAccountsWithBalanceUseCase } from "./fetchAccountsWithBalanceUseCase.js";
import type { HydrateAccountWithBalanceUseCase } from "./HydrateAccountWithBalanceUseCase.js";

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

function createMockFetchAccountsUseCase(): {
  execute: ReturnType<typeof vi.fn>;
} {
  return {
    execute: vi.fn(),
  };
}

function createMockAccountService(): {
  getAccounts: ReturnType<typeof vi.fn>;
  updateAccounts: ReturnType<typeof vi.fn>;
  selectAccount: ReturnType<typeof vi.fn>;
  getSelectedAccount: ReturnType<typeof vi.fn>;
  setAccountsFromCloudSyncData: ReturnType<typeof vi.fn>;
  getBalanceAndTokensForAccount: ReturnType<typeof vi.fn>;
} {
  return {
    getAccounts: vi.fn(),
    updateAccounts: vi.fn(),
    selectAccount: vi.fn(),
    getSelectedAccount: vi.fn(),
    setAccountsFromCloudSyncData: vi.fn(),
    getBalanceAndTokensForAccount: vi.fn(),
  };
}

function createMockHydrateAccountWithBalanceUseCase(): {
  execute: ReturnType<typeof vi.fn>;
} {
  return {
    execute: vi.fn(),
  };
}

function createMockAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: "account-1",
    currencyId: "ethereum",
    freshAddress: "0x1234567890123456789012345678901234567890",
    seedIdentifier: "seed-1",
    derivationMode: "default",
    index: 0,
    name: "My Ethereum Account",
    ticker: "ETH",
    balance: undefined,
    tokens: [],
    ...overrides,
  };
}

function createHydratedAccount(account: Account, balance: string): Account {
  return {
    ...account,
    balance,
    tokens: [{ ticker: "USDC", name: "USD Coin", balance: "100.0" }],
  };
}

describe("FetchAccountsWithBalanceUseCase", () => {
  let useCase: FetchAccountsWithBalanceUseCase;
  let mockFetchAccountsUseCase: ReturnType<
    typeof createMockFetchAccountsUseCase
  >;
  let mockAccountService: ReturnType<typeof createMockAccountService>;
  let mockHydrateUseCase: ReturnType<
    typeof createMockHydrateAccountWithBalanceUseCase
  >;

  beforeEach(() => {
    mockFetchAccountsUseCase = createMockFetchAccountsUseCase();
    mockAccountService = createMockAccountService();
    mockHydrateUseCase = createMockHydrateAccountWithBalanceUseCase();

    useCase = new FetchAccountsWithBalanceUseCase(
      createMockLoggerFactory(),
      mockFetchAccountsUseCase as unknown as FetchAccountsUseCase,
      mockAccountService as unknown as AccountService,
      mockHydrateUseCase as unknown as HydrateAccountWithBalanceUseCase,
    );

    vi.clearAllMocks();
  });

  describe("execute", () => {
    it("should fetch accounts and hydrate each with balance", async () => {
      const account1 = createMockAccount({ id: "acc-1", index: 0 });
      const account2 = createMockAccount({ id: "acc-2", index: 1 });

      mockFetchAccountsUseCase.execute.mockResolvedValue(undefined);
      mockAccountService.getAccounts.mockReturnValue([account1, account2]);

      const hydratedAccount1 = createHydratedAccount(account1, "1.5000");
      const hydratedAccount2 = createHydratedAccount(account2, "2.5000");

      mockHydrateUseCase.execute
        .mockResolvedValueOnce(hydratedAccount1)
        .mockResolvedValueOnce(hydratedAccount2);

      const result = await useCase.execute();

      expect(mockFetchAccountsUseCase.execute).toHaveBeenCalledOnce();
      expect(mockAccountService.getAccounts).toHaveBeenCalledOnce();
      expect(mockHydrateUseCase.execute).toHaveBeenCalledTimes(2);
      expect(mockHydrateUseCase.execute).toHaveBeenNthCalledWith(1, account1);
      expect(mockHydrateUseCase.execute).toHaveBeenNthCalledWith(2, account2);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(hydratedAccount1);
      expect(result[1]).toEqual(hydratedAccount2);
    });

    it("should not have side effects - does not update account service", async () => {
      const account = createMockAccount();
      const hydratedAccount = createHydratedAccount(account, "1.5000");

      mockFetchAccountsUseCase.execute.mockResolvedValue(undefined);
      mockAccountService.getAccounts.mockReturnValue([account]);
      mockHydrateUseCase.execute.mockResolvedValue(hydratedAccount);

      await useCase.execute();

      // Use case should be pure - no side effects
      expect(mockAccountService.updateAccounts).not.toHaveBeenCalled();
    });

    it("should return empty array when no accounts exist", async () => {
      mockFetchAccountsUseCase.execute.mockResolvedValue(undefined);
      mockAccountService.getAccounts.mockReturnValue([]);

      const result = await useCase.execute();

      expect(mockFetchAccountsUseCase.execute).toHaveBeenCalledOnce();
      expect(mockAccountService.getAccounts).toHaveBeenCalledOnce();
      expect(mockHydrateUseCase.execute).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("should call fetchAccountsUseCase before getting accounts", async () => {
      const callOrder: string[] = [];

      mockFetchAccountsUseCase.execute.mockImplementation(async () => {
        callOrder.push("fetchAccounts");
      });
      mockAccountService.getAccounts.mockImplementation(() => {
        callOrder.push("getAccounts");
        return [];
      });

      await useCase.execute();

      expect(callOrder).toEqual(["fetchAccounts", "getAccounts"]);
    });

    it("should propagate error when fetchAccountsUseCase fails", async () => {
      const error = new Error("Failed to fetch accounts");
      mockFetchAccountsUseCase.execute.mockRejectedValue(error);

      await expect(useCase.execute()).rejects.toThrow(
        "Failed to fetch accounts",
      );
      expect(mockAccountService.getAccounts).not.toHaveBeenCalled();
      expect(mockHydrateUseCase.execute).not.toHaveBeenCalled();
    });

    it("should propagate error when hydration fails for any account", async () => {
      const accounts = [
        createMockAccount({ id: "acc-1" }),
        createMockAccount({ id: "acc-2" }),
      ];

      mockFetchAccountsUseCase.execute.mockResolvedValue(undefined);
      mockAccountService.getAccounts.mockReturnValue(accounts);

      mockHydrateUseCase.execute
        .mockResolvedValueOnce(createHydratedAccount(accounts[0], "1.0000"))
        .mockRejectedValueOnce(new Error("Hydration failed"));

      await expect(useCase.execute()).rejects.toThrow("Hydration failed");
    });
  });
});
