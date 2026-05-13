import { Right } from "purify-ts";
import { of } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AccountNotFoundError,
  NoSelectedAccountError,
} from "../../../api/errors/LedgerSyncErrors.js";
import type { CalDataSource } from "../../balance/datasource/cal/CalDataSource.js";
import type { ContextService } from "../../context/ContextService.js";
import type { LedgerSyncService } from "../../ledgersync/service/LedgerSyncService.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import type { Account, DetailedAccount } from "../service/AccountService.js";
import type { FetchAccountsUseCase } from "./fetchAccountsUseCase.js";
import { FetchSelectedAccountUseCase } from "./fetchSelectedAccountUseCase.js";
import type { HydrateAccountWithBalanceUseCase } from "./HydrateAccountWithBalanceUseCase.js";
import type { HydrateAccountWithFiatUseCase } from "./hydrateAccountWithFiatUseCase.js";
import type { HydrateAccountWithTxHistoryUseCase } from "./hydrateAccountWithTxHistoryUseCase.js";

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
  let mockHydrateWithTxHistoryUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  let mockCalDataSource: {
    getCurrencyInformation: ReturnType<typeof vi.fn>;
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

  const hydratedAccount: DetailedAccount = {
    ...baseAccount,
    balance: "2.5000",
    fiatBalance: { value: "5000.00", currency: "USD" },
    transactionHistory: [
      {
        hash: "0xabc123",
        type: "received",
        direction: "received",
        kind: "transfer",
        status: "confirmed",
        value: "1000000000000000000",
        asset: {
          ledgerId: "ethereum",
          name: "Ethereum",
          ticker: "ETH",
          decimals: 18,
        },
        timestamp: "2024-01-15T10:00:00Z",
      },
    ],
    networks: [{ id: "ethereum", name: "Ethereum", ticker: "ETHEREUM", fiatBalance: { value: "5000.00", currency: "USD" } }],
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

    mockHydrateWithTxHistoryUseCase = {
      execute: vi.fn(),
    };

    mockCalDataSource = {
      getCurrencyInformation: vi.fn().mockImplementation((currencyId: string) =>
        Promise.resolve(Right({ id: currencyId, name: currencyId.charAt(0).toUpperCase() + currencyId.slice(1), ticker: currencyId.toUpperCase(), decimals: 18 })),
      ),
    };

    useCase = new FetchSelectedAccountUseCase(
      mockLoggerFactory as unknown as () => LoggerPublisher,
      mockContextService as unknown as ContextService,
      mockLedgerSyncService as unknown as LedgerSyncService,
      mockFetchAccountsUseCase as unknown as FetchAccountsUseCase,
      mockHydrateWithBalanceUseCase as unknown as HydrateAccountWithBalanceUseCase,
      mockHydrateWithFiatUseCase as unknown as HydrateAccountWithFiatUseCase,
      mockHydrateWithTxHistoryUseCase as unknown as HydrateAccountWithTxHistoryUseCase,
      mockCalDataSource as unknown as CalDataSource,
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
        mockHydrateWithTxHistoryUseCase.execute.mockResolvedValue({
          ...baseAccount,
          transactionHistory: hydratedAccount.transactionHistory,
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
          expect(account.totalFiatValue).toEqual({
            value: "5000.00",
            currency: "USD",
          });
          expect(account.transactionHistory).toEqual(
            hydratedAccount.transactionHistory,
          );
          expect(account.networks).toEqual([
            { id: "ethereum", name: "Ethereum", ticker: "ETHEREUM", fiatBalance: { value: "5000.00", currency: "USD" } },
          ]);
        });
      });

      it("should run balance first, then fiat and tx history with balance-hydrated account", async () => {
        await useCase.execute();

        const accountWithBalance = { ...baseAccount, balance: "2.5000" };

        // Balance hydration is called first with the base account
        expect(mockHydrateWithBalanceUseCase.execute).toHaveBeenCalledWith(
          baseAccount,
        );
        // Fiat and tx history are called with the balance-hydrated account
        expect(mockHydrateWithFiatUseCase.execute).toHaveBeenCalledWith(
          accountWithBalance,
        );
        expect(mockHydrateWithTxHistoryUseCase.execute).toHaveBeenCalledWith(
          accountWithBalance,
        );
      });

      it("should hydrate context with detailed account", async () => {
        const result = await useCase.execute();

        expect(mockContextService.onEvent).toHaveBeenCalledWith({
          type: "hydrated_account",
          account: result.unsafeCoerce(),
        });
      });

      it("should log successful fetch with details", async () => {
        await useCase.execute();

        expect(mockLogger.info).toHaveBeenCalledWith(
          "Selected account fetched with details",
          expect.objectContaining({
            address: baseAccount.freshAddress,
            hasBalance: true,
            hasFiat: true,
            txCount: 1,
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
        mockHydrateWithTxHistoryUseCase.execute.mockResolvedValue({
          ...baseAccount,
          transactionHistory: [],
        });

        const result = await useCase.execute();

        expect(result.isRight()).toBe(true);
        result.map((account) => {
          expect(account.balance).toBe("2.5000");
          expect(account.fiatBalance).toBeUndefined();
          expect(account.transactionHistory).toEqual([]);
        });
      });

      it("should handle undefined transactionHistory gracefully", async () => {
        mockHydrateWithBalanceUseCase.execute.mockResolvedValue({
          ...baseAccount,
          balance: "2.5000",
        });
        mockHydrateWithFiatUseCase.execute.mockResolvedValue({
          ...baseAccount,
          fiatBalance: { value: "5000.00", currency: "USD" },
        });
        mockHydrateWithTxHistoryUseCase.execute.mockResolvedValue({
          ...baseAccount,
          transactionHistory: undefined,
        });

        const result = await useCase.execute();

        expect(result.isRight()).toBe(true);
        result.map((account) => {
          expect(account.transactionHistory).toBeUndefined();
        });
      });
    });

    describe("network computation from accounts with same address", () => {
      it("should only include networks from accounts sharing the selected address", async () => {
        const polygonAccount: Account = {
          ...baseAccount,
          id: "account-2",
          currencyId: "polygon",
        };
        const otherAccount: Account = {
          ...baseAccount,
          id: "account-3",
          currencyId: "bsc",
          freshAddress: "0xdifferentaddress",
        };

        mockContextService.getContext.mockReturnValue({
          selectedAccount: baseAccount,
        });
        mockFetchAccountsUseCase.execute.mockResolvedValue([
          baseAccount,
          polygonAccount,
          otherAccount,
        ]);
        mockHydrateWithBalanceUseCase.execute.mockResolvedValue({
          ...baseAccount,
          balance: "2.5000",
        });
        mockHydrateWithFiatUseCase.execute.mockImplementation(
          (account: Account) =>
            Promise.resolve({
              ...account,
              fiatBalance: { value: "5000.00", currency: "USD" },
              fiatError: false,
              balanceLoadingState: "loaded",
              fiatLoadingState: "loaded",
            }),
        );
        mockHydrateWithTxHistoryUseCase.execute.mockResolvedValue({
          ...baseAccount,
          transactionHistory: [],
        });

        const result = await useCase.execute();

        expect(result.isRight()).toBe(true);
        result.map((account) => {
          expect(account.networks).toEqual([
            { id: "ethereum", name: "Ethereum", ticker: "ETHEREUM", fiatBalance: { value: "5000.00", currency: "USD" } },
            { id: "polygon", name: "Polygon", ticker: "POLYGON", fiatBalance: { value: "5000.00", currency: "USD" } },
          ]);
          expect(account.networks).not.toContainEqual(
            expect.objectContaining({ id: "bsc" }),
          );
        });
      });
    });

    describe("execution flow verification", () => {
      it("should call all hydration use cases for the same account address", async () => {
        mockContextService.getContext.mockReturnValue({
          selectedAccount: baseAccount,
        });
        mockFetchAccountsUseCase.execute.mockResolvedValue([baseAccount]);
        mockHydrateWithBalanceUseCase.execute.mockResolvedValue(baseAccount);
        mockHydrateWithFiatUseCase.execute.mockResolvedValue({
          ...baseAccount,
          fiatBalance: undefined,
        });
        mockHydrateWithTxHistoryUseCase.execute.mockResolvedValue({
          ...baseAccount,
          transactionHistory: undefined,
        });

        await useCase.execute();

        const balanceCall = mockHydrateWithBalanceUseCase.execute.mock.calls[0];
        const fiatCall = mockHydrateWithFiatUseCase.execute.mock.calls[0];
        const txHistoryCall =
          mockHydrateWithTxHistoryUseCase.execute.mock.calls[0];

        // All hydrations should be for the same account address
        expect(balanceCall[0].freshAddress).toBe(baseAccount.freshAddress);
        expect(fiatCall[0].freshAddress).toBe(baseAccount.freshAddress);
        expect(txHistoryCall[0].freshAddress).toBe(baseAccount.freshAddress);
      });
    });
  });
});
