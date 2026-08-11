import { Left, Maybe, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Account } from "@api/model/Account.js";
import type { BackendService } from "@internal/backend/BackendService.js";
import type { CalDataSource } from "@internal/balance/datasource/cal/CalDataSource.js";
import type { CurrencyInformation } from "@internal/balance/datasource/cal/calTypes.js";
import type { AccountBalance, TokenBalance } from "@internal/balance/model/types.js";
import type { BalanceService } from "@internal/balance/service/BalanceService.js";
import type { BlockchainProviderManager } from "@internal/blockchain-provider/service/BlockchainProviderManager.js";

import { HydrateAccountWithBalanceUseCase } from "./HydrateAccountWithBalanceUseCase.js";

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

function createMockBalanceService(): {
  getBalanceForAccount: ReturnType<typeof vi.fn>;
} {
  return {
    getBalanceForAccount: vi.fn(),
  };
}

function createMockBackendService(): {
  broadcast: ReturnType<typeof vi.fn>;
  getConfig: ReturnType<typeof vi.fn>;
  event: ReturnType<typeof vi.fn>;
} {
  return {
    broadcast: vi.fn(),
    getConfig: vi.fn(),
    event: vi.fn(),
  };
}

function createMockCalDataSource(): {
  getCurrencyInformation: ReturnType<typeof vi.fn>;
  getTokenInformation: ReturnType<typeof vi.fn>;
} {
  return {
    getCurrencyInformation: vi.fn(),
    getTokenInformation: vi.fn(),
  };
}

function createCurrencyInformation(
  overrides: Partial<CurrencyInformation> = {},
): CurrencyInformation {
  return {
    id: "ethereum",
    name: "Ethereum",
    ticker: "ETH",
    decimals: 18,
    ...overrides,
  };
}

function createMockBlockchainProviderManager(): BlockchainProviderManager {
  return {
    init: vi.fn(),
    setSelectedAccounts: vi.fn(),
    setNetwork: vi.fn(),
    resolveBlockchainFamily: vi.fn().mockReturnValue(Maybe.empty()),
    resolveNetwork: vi.fn().mockImplementation((currencyId: string) => {
      if (currencyId === "solana") {
        return Maybe.of({
          networkId: "mainnet",
          blockchainName: "solana",
        });
      }
      if (currencyId === "polygon") {
        return Maybe.of({ networkId: "137", blockchainName: "ethereum" });
      }
      if (currencyId === "ethereum") {
        return Maybe.of({ networkId: "1", blockchainName: "ethereum" });
      }
      return Maybe.empty();
    }),
    resolveCurrencyId: vi.fn().mockReturnValue(Maybe.empty()),
    getNativeDecimals: vi.fn().mockImplementation((currencyId: string) => {
      if (currencyId === "solana") {
        return Maybe.of(9);
      }
      if (currencyId === "ethereum" || currencyId === "polygon") {
        return Maybe.of(18);
      }
      return Maybe.empty();
    }),
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

describe("HydrateAccountWithBalanceUseCase", () => {
  let useCase: HydrateAccountWithBalanceUseCase;
  let mockBalanceService: ReturnType<typeof createMockBalanceService>;
  let mockBackendService: ReturnType<typeof createMockBackendService>;
  let mockCalDataSource: ReturnType<typeof createMockCalDataSource>;
  let mockBlockchainProviderManager: BlockchainProviderManager;

  beforeEach(() => {
    vi.clearAllMocks();

    mockBalanceService = createMockBalanceService();
    mockBackendService = createMockBackendService();
    mockCalDataSource = createMockCalDataSource();
    mockBlockchainProviderManager = createMockBlockchainProviderManager();
    mockCalDataSource.getCurrencyInformation.mockResolvedValue(
      Right(createCurrencyInformation()),
    );

    useCase = new HydrateAccountWithBalanceUseCase(
      createMockLoggerFactory(),
      mockBalanceService as unknown as BalanceService,
      mockBackendService as unknown as BackendService,
      mockCalDataSource as unknown as CalDataSource,
      mockBlockchainProviderManager,
    );
  });

  describe("execute", () => {
    it("should return account with balance and tokens when balance service succeeds", async () => {
      const mockAccount = createMockAccount();
      const mockBalanceData: AccountBalance = {
        nativeBalance: {
          balance: BigInt("1500000000000000000"), // 1.5 ETH in wei
        },
        tokenBalances: [
          {
            ledgerId: "ethereum/erc20/usdc",
            ticker: "USDC",
            name: "USD Coin",
            decimals: 6,
            balance: BigInt("1000000000"),
            balanceFormatted: "1000.0",
          } as unknown as TokenBalance,
          {
            ledgerId: "ethereum/erc20/dai",
            ticker: "DAI",
            name: "Dai Stablecoin",
            decimals: 18,
            balance: BigInt("500000000000000000000"),
            balanceFormatted: "500.0",
          } as unknown as TokenBalance,
        ],
      };

      mockBalanceService.getBalanceForAccount.mockResolvedValue(
        Right(mockBalanceData),
      );

      const result = await useCase.execute(mockAccount);

      expect(result.balance).toBe("1.5");
      expect(result.tokens).toHaveLength(2);
      expect(result.tokens[0]).toEqual({
        ledgerId: "ethereum/erc20/usdc",
        ticker: "USDC",
        name: "USD Coin",
        balance: "1000.0",
        fiatBalance: undefined,
      });
      expect(result.tokens[1]).toEqual({
        ledgerId: "ethereum/erc20/dai",
        ticker: "DAI",
        name: "Dai Stablecoin",
        balance: "500.0",
        fiatBalance: undefined,
      });
      expect(mockBalanceService.getBalanceForAccount).toHaveBeenCalledWith(
        mockAccount,
        true,
      );
    });

    it("should return account with zero balance when balance service succeeds with zero balance", async () => {
      const mockAccount = createMockAccount();
      const mockBalanceData: AccountBalance = {
        nativeBalance: {
          balance: BigInt(0),
        },
        tokenBalances: [],
      };

      mockBalanceService.getBalanceForAccount.mockResolvedValue(
        Right(mockBalanceData),
      );

      const result = await useCase.execute(mockAccount);

      expect(result.balance).toBe("0");
      expect(result.tokens).toHaveLength(0);
    });

    it("should format balance with smart truncation", async () => {
      const mockAccount = createMockAccount();
      const mockBalanceData: AccountBalance = {
        nativeBalance: {
          balance: BigInt("1234567890123456789"), // ~1.23456... ETH
        },
        tokenBalances: [],
      };

      mockBalanceService.getBalanceForAccount.mockResolvedValue(
        Right(mockBalanceData),
      );

      const result = await useCase.execute(mockAccount);

      // formatCurrencyUnit applies smart truncation (no trailing zeros, rounded to significant digits)
      expect(result.balance).toBe("1.23456");
    });

    it("should pass withTokens parameter to balance service", async () => {
      const mockAccount = createMockAccount();
      const mockBalanceData: AccountBalance = {
        nativeBalance: {
          balance: BigInt("1000000000000000000"),
        },
        tokenBalances: [],
      };

      mockBalanceService.getBalanceForAccount.mockResolvedValue(
        Right(mockBalanceData),
      );

      await useCase.execute(mockAccount, false);

      expect(mockBalanceService.getBalanceForAccount).toHaveBeenCalledWith(
        mockAccount,
        false,
      );
    });

    it("should fall back to RPC when balance service fails", async () => {
      const mockAccount = createMockAccount();
      const mockError = new Error("Balance service unavailable");

      mockBalanceService.getBalanceForAccount.mockResolvedValue(
        Left(mockError),
      );
      mockBackendService.broadcast.mockResolvedValue(
        Right({ result: "0xDE0B6B3A7640000" }), // 1 ETH in hex
      );

      const result = await useCase.execute(mockAccount);

      expect(result.balance).toBe("1");
      expect(result.tokens).toHaveLength(0);
      expect(mockBackendService.broadcast).toHaveBeenCalledWith({
        blockchain: { name: "ethereum", chainId: "1" },
        rpc: {
          method: "eth_getBalance",
          params: [mockAccount.freshAddress, "latest"],
          id: 1,
          jsonrpc: "2.0",
        },
      });
    });

    it("should return zero balance when both balance service and RPC fail", async () => {
      const mockAccount = createMockAccount();

      mockBalanceService.getBalanceForAccount.mockResolvedValue(
        Left(new Error("Balance service unavailable")),
      );
      mockBackendService.broadcast.mockResolvedValue(
        Left(new Error("RPC error")),
      );

      const result = await useCase.execute(mockAccount);

      expect(result.balance).toBe("0");
      expect(result.tokens).toHaveLength(0);
    });

    it("should use correct chain ID for different currencies", async () => {
      const mockAccount = createMockAccount({ currencyId: "polygon" });

      mockBalanceService.getBalanceForAccount.mockResolvedValue(
        Left(new Error("Balance service unavailable")),
      );
      mockBackendService.broadcast.mockResolvedValue(
        Right({ result: "0x0" }),
      );

      await useCase.execute(mockAccount);

      expect(mockBackendService.broadcast).toHaveBeenCalledWith(
        expect.objectContaining({
          blockchain: { name: "ethereum", chainId: "137" },
        }),
      );
    });

    it("should preserve original account properties", async () => {
      const mockAccount = createMockAccount({
        id: "custom-id",
        name: "Custom Name",
        index: 5,
      });
      const mockBalanceData: AccountBalance = {
        nativeBalance: {
          balance: BigInt("1000000000000000000"),
        },
        tokenBalances: [],
      };

      mockBalanceService.getBalanceForAccount.mockResolvedValue(
        Right(mockBalanceData),
      );

      const result = await useCase.execute(mockAccount);

      expect(result.id).toBe("custom-id");
      expect(result.name).toBe("Custom Name");
      expect(result.index).toBe(5);
      expect(result.freshAddress).toBe(mockAccount.freshAddress);
    });
  });

  describe("native decimals resolution", () => {
    it("should format SOL balance with 9 decimals resolved from CAL", async () => {
      const mockAccount = createMockAccount({
        currencyId: "solana",
        ticker: "SOL",
      });
      mockCalDataSource.getCurrencyInformation.mockResolvedValue(
        Right(
          createCurrencyInformation({
            id: "solana",
            name: "Solana",
            ticker: "SOL",
            decimals: 9,
          }),
        ),
      );
      mockBalanceService.getBalanceForAccount.mockResolvedValue(
        Right({
          nativeBalance: { balance: BigInt("1500000000") }, // 1.5 SOL (9 decimals)
          tokenBalances: [],
        } as AccountBalance),
      );

      const result = await useCase.execute(mockAccount);

      expect(result.balance).toBe("1.5");
      expect(mockCalDataSource.getCurrencyInformation).toHaveBeenCalledWith(
        "solana",
      );
    });

    it("should keep ETH balance at 18 decimals resolved from CAL", async () => {
      const mockAccount = createMockAccount();
      mockCalDataSource.getCurrencyInformation.mockResolvedValue(
        Right(createCurrencyInformation({ decimals: 18 })),
      );
      mockBalanceService.getBalanceForAccount.mockResolvedValue(
        Right({
          nativeBalance: { balance: BigInt("1500000000000000000") },
          tokenBalances: [],
        } as AccountBalance),
      );

      const result = await useCase.execute(mockAccount);

      expect(result.balance).toBe("1.5");
    });

    it("should fall back to Solana default decimals via manager when CAL fails", async () => {
      const mockAccount = createMockAccount({
        currencyId: "solana",
        ticker: "SOL",
      });
      mockCalDataSource.getCurrencyInformation.mockResolvedValue(
        Left(new Error("CAL unavailable")),
      );
      mockBalanceService.getBalanceForAccount.mockResolvedValue(
        Right({
          nativeBalance: { balance: BigInt("1500000000") }, // 1.5 SOL (9 decimals)
          tokenBalances: [],
        } as AccountBalance),
      );

      const result = await useCase.execute(mockAccount);

      // resolveNativeDecimals falls back to manager.getNativeDecimals (9)
      expect(result.balance).toBe("1.5");
    });

    it("should fall back to EVM default decimals via manager when CAL fails", async () => {
      const mockAccount = createMockAccount();
      mockCalDataSource.getCurrencyInformation.mockResolvedValue(
        Left(new Error("CAL unavailable")),
      );
      mockBalanceService.getBalanceForAccount.mockResolvedValue(
        Right({
          nativeBalance: { balance: BigInt("1500000000000000000") },
          tokenBalances: [],
        } as AccountBalance),
      );

      const result = await useCase.execute(mockAccount);

      // resolveNativeDecimals falls back to manager.getNativeDecimals (18)
      expect(result.balance).toBe("1.5");
    });

    it("should resolve decimals from CAL on the RPC fallback path", async () => {
      const mockAccount = createMockAccount();
      mockCalDataSource.getCurrencyInformation.mockResolvedValue(
        Right(createCurrencyInformation({ decimals: 18 })),
      );
      mockBalanceService.getBalanceForAccount.mockResolvedValue(
        Left(new Error("Balance service unavailable")),
      );
      mockBackendService.broadcast.mockResolvedValue(
        Right({ result: "0xDE0B6B3A7640000" }), // 1 ETH in hex
      );

      const result = await useCase.execute(mockAccount);

      expect(result.balance).toBe("1");
      expect(mockCalDataSource.getCurrencyInformation).toHaveBeenCalledWith(
        "ethereum",
      );
    });
  });
});
