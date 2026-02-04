import { Right } from "purify-ts";
import { of } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AccountNotFoundError,
  NoSelectedAccountError,
} from "../../../api/errors/LedgerSyncErrors.js";
import type { ContextService } from "../../context/ContextService.js";
import type { LedgerSyncService } from "../../ledgersync/service/LedgerSyncService.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import type { Account } from "../service/AccountService.js";
import type { FetchAccountsUseCase } from "./fetchAccountsUseCase.js";
import { FetchSelectedAccountUseCase } from "./fetchSelectedAccountUseCase.js";
import type { HydrateAccountWithBalanceUseCase } from "./HydrateAccountWithBalanceUseCase.js";
import type { HydrateAccountWithFiatUseCase } from "./hydrateAccountWithFiatUseCase.js";

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

describe("FetchSelectedAccountUseCase", () => {
  let useCase: FetchSelectedAccountUseCase;
  let mockContextService: {
    getContext: ReturnType<typeof vi.fn>;
    onEvent: ReturnType<typeof vi.fn>;
  };
  let mockLedgerSyncService: {
    authenticate: ReturnType<typeof vi.fn>;
  };
  let mockFetchAccountsUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  let mockHydrateWithBalanceUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  let mockHydrateWithFiatUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockLoggerFactory: ReturnType<typeof vi.fn>;

  const baseAccount: Account = {
    id: "account-1",
    currencyId: "ethereum",
    freshAddress: "0x1234567890abcdef1234567890abcdef12345678",
    seedIdentifier: "seed-1",
    derivationMode: "default",
    index: 0,
    name: "My Ethereum Account",
    ticker: "ETH",
    balance: undefined,
    tokens: [],
  };

  beforeEach(() => {
    mockLogger = createMockLogger();
    mockLoggerFactory = vi.fn().mockReturnValue(mockLogger);

    mockContextService = {
      getContext: vi.fn(),
      onEvent: vi.fn(),
    };

    mockLedgerSyncService = {
      authenticate: vi.fn().mockReturnValue(of(Right({}))),
    };

    mockFetchAccountsUseCase = {
      execute: vi.fn(),
    };

    mockHydrateWithBalanceUseCase = {
      execute: vi.fn(),
    };

    mockHydrateWithFiatUseCase = {
      execute: vi.fn(),
    };

    useCase = new FetchSelectedAccountUseCase(
      mockLoggerFactory as unknown as () => LoggerPublisher,
      mockContextService as unknown as ContextService,
      mockLedgerSyncService as unknown as LedgerSyncService,
      mockFetchAccountsUseCase as unknown as FetchAccountsUseCase,
      mockHydrateWithBalanceUseCase as unknown as HydrateAccountWithBalanceUseCase,
      mockHydrateWithFiatUseCase as unknown as HydrateAccountWithFiatUseCase,
    );

    vi.clearAllMocks();
  });

  describe("execute", () => {
    describe("when no account is selected in context", () => {
      it("should return Left with NoSelectedAccountError", async () => {
        mockContextService.getContext.mockReturnValue({
          selectedAccount: undefined,
        });

        const result = await useCase.execute();

        expect(result.isLeft()).toBe(true);
        result.mapLeft((error) => {
          expect(error).toBeInstanceOf(NoSelectedAccountError);
        });
        expect(mockLedgerSyncService.authenticate).not.toHaveBeenCalled();
        expect(mockFetchAccountsUseCase.execute).not.toHaveBeenCalled();
      });
    });

    describe("when selected account is not found in Ledger Sync accounts", () => {
      it("should return Left with AccountNotFoundError", async () => {
        mockContextService.getContext.mockReturnValue({
          selectedAccount: baseAccount,
        });
        mockFetchAccountsUseCase.execute.mockResolvedValue([]);

        const result = await useCase.execute();

        expect(result.isLeft()).toBe(true);
        result.mapLeft((error) => {
          expect(error).toBeInstanceOf(AccountNotFoundError);
        });
        expect(mockLedgerSyncService.authenticate).toHaveBeenCalled();
        expect(mockFetchAccountsUseCase.execute).toHaveBeenCalled();
        expect(mockLogger.error).toHaveBeenCalledWith(
          "Selected account not found in Ledger Sync accounts",
          { address: baseAccount.freshAddress },
        );
      });
    });

    describe("when account is found and hydration succeeds", () => {
      beforeEach(() => {
        mockContextService.getContext.mockReturnValue({
          selectedAccount: baseAccount,
        });
        mockFetchAccountsUseCase.execute.mockResolvedValue([baseAccount]);
        mockHydrateWithBalanceUseCase.execute.mockResolvedValue({
          ...baseAccount,
          balance: "2.5000",
        });
        mockHydrateWithFiatUseCase.execute.mockResolvedValue({
          ...baseAccount,
          fiatBalance: { value: "5000.00", currency: "USD" },
        });
      });

      it("should return Right with DetailedAccount", async () => {
        const result = await useCase.execute();

        expect(result.isRight()).toBe(true);
        result.map((account) => {
          expect(account.balance).toBe("2.5000");
          expect(account.fiatBalance).toEqual({
            value: "5000.00",
            currency: "USD",
          });
          // Transaction history is disabled for 1.1 release
          expect(account.transactionHistory).toBeUndefined();
        });
      });

      it("should run balance first, then fiat with balance-hydrated account", async () => {
        await useCase.execute();

        const accountWithBalance = { ...baseAccount, balance: "2.5000" };

        // Balance hydration is called first with the base account
        expect(mockHydrateWithBalanceUseCase.execute).toHaveBeenCalledWith(
          baseAccount,
        );
        // Fiat is called with the balance-hydrated account
        expect(mockHydrateWithFiatUseCase.execute).toHaveBeenCalledWith(
          accountWithBalance,
        );
      });

      it("should emit account_changed event with the detailed account", async () => {
        await useCase.execute();

        expect(mockContextService.onEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "account_changed",
          }),
        );
      });

      it("should log successful fetch with details", async () => {
        await useCase.execute();

        expect(mockLogger.info).toHaveBeenCalledWith(
          "Selected account fetched with details",
          expect.objectContaining({
            address: baseAccount.freshAddress,
            hasBalance: true,
            hasFiat: true,
            txCount: 0, // Transaction history disabled for 1.1 release
          }),
        );
      });
    });

    describe("when hydration partially fails", () => {
      beforeEach(() => {
        mockContextService.getContext.mockReturnValue({
          selectedAccount: baseAccount,
        });
        mockFetchAccountsUseCase.execute.mockResolvedValue([baseAccount]);
      });

      it("should handle undefined fiatBalance gracefully", async () => {
        mockHydrateWithBalanceUseCase.execute.mockResolvedValue({
          ...baseAccount,
          balance: "2.5000",
        });
        mockHydrateWithFiatUseCase.execute.mockResolvedValue({
          ...baseAccount,
          fiatBalance: undefined,
        });

        const result = await useCase.execute();

        expect(result.isRight()).toBe(true);
        result.map((account) => {
          expect(account.balance).toBe("2.5000");
          expect(account.fiatBalance).toBeUndefined();
          // Transaction history is disabled for 1.1 release
          expect(account.transactionHistory).toBeUndefined();
        });
      });
    });

    describe("execution flow verification", () => {
      it("should call balance and fiat hydration use cases for the same account address", async () => {
        mockContextService.getContext.mockReturnValue({
          selectedAccount: baseAccount,
        });
        mockFetchAccountsUseCase.execute.mockResolvedValue([baseAccount]);
        mockHydrateWithBalanceUseCase.execute.mockResolvedValue(baseAccount);
        mockHydrateWithFiatUseCase.execute.mockResolvedValue({
          ...baseAccount,
          fiatBalance: undefined,
        });

        await useCase.execute();

        const balanceCall = mockHydrateWithBalanceUseCase.execute.mock.calls[0];
        const fiatCall = mockHydrateWithFiatUseCase.execute.mock.calls[0];

        // All hydrations should be for the same account address
        expect(balanceCall[0].freshAddress).toBe(baseAccount.freshAddress);
        expect(fiatCall[0].freshAddress).toBe(baseAccount.freshAddress);
      });
    });
  });
});
