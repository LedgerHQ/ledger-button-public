import { Left, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ButtonCoreContext } from "../../../api/model/ButtonCoreContext.js";
import type { CounterValueDataSource } from "../../balance/datasource/countervalue/CounterValueDataSource.js";
import type { CounterValueResult } from "../../balance/datasource/countervalue/counterValueTypes.js";
import type { ContextService } from "../../context/ContextService.js";
import type { Account } from "../service/AccountService.js";
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

function createMockContext(
  overrides: Partial<ButtonCoreContext> = {},
): ButtonCoreContext {
  return {
    connectedDevice: undefined,
    selectedAccount: undefined,
    trustChainId: undefined,
    applicationPath: undefined,
    chainId: 1,
    welcomeScreenCompleted: false,
    hasTrackingConsent: undefined,
    isMobilePlatform: false,
    preferredFiatCurrency: "usd",
    ...overrides,
  };
}

describe("HydrateAccountWithFiatUseCase", () => {
  let useCase: HydrateAccountWithFiatUseCase;
  let mockCounterValueDataSource: {
    getCounterValues: ReturnType<typeof vi.fn>;
  };
  let mockContextService: {
    observeContext: ReturnType<typeof vi.fn>;
    getContext: ReturnType<typeof vi.fn>;
    onEvent: ReturnType<typeof vi.fn>;
  };

  function setPreferredFiatCurrency(preferredFiatCurrency: string): void {
    mockContextService.getContext.mockReturnValue(
      createMockContext({ preferredFiatCurrency }),
    );
  }

  const baseAccount: Account = {
    id: "account-1",
    currencyId: "ethereum",
    freshAddress: "0x1234567890abcdef1234567890abcdef12345678",
    seedIdentifier: "seed-1",
    derivationMode: "default",
    index: 0,
    name: "My Ethereum Account",
    ticker: "ETH",
    balance: "2.5",
    tokens: [],
  };

  const accountWithToken: Account = {
    ...baseAccount,
    tokens: [
      {
        ledgerId: "ethereum/erc20/usdc",
        ticker: "USDC",
        name: "USD Coin",
        balance: "43,000.0",
        fiatBalance: undefined,
      },
    ],
  };

  const accountWithoutBalance: Account = {
    ...baseAccount,
    balance: undefined,
  };

  beforeEach(() => {
    mockCounterValueDataSource = {
      getCounterValues: vi.fn(),
    };

    mockContextService = {
      observeContext: vi.fn(),
      getContext: vi.fn(),
      onEvent: vi.fn(),
    };
    setPreferredFiatCurrency("usd");

    useCase = new HydrateAccountWithFiatUseCase(
      createMockLoggerFactory(),
      mockCounterValueDataSource as unknown as CounterValueDataSource,
      mockContextService as unknown as ContextService,
    );

    vi.clearAllMocks();
    setPreferredFiatCurrency("usd");
  });

  describe("execute", () => {
    describe("when account has no balance", () => {
      it("should return account with $0.00 fiatBalance and no error", async () => {
        const result = await useCase.execute(accountWithoutBalance);

        expect(result).toEqual({
          ...accountWithoutBalance,
          fiatBalance: { value: "0.00", currency: "USD" },
          fiatError: false,
          balanceLoadingState: "loading",
          fiatLoadingState: "loaded",
        });
        expect(
          mockCounterValueDataSource.getCounterValues,
        ).not.toHaveBeenCalled();
      });
    });

    describe("when account has zero balance", () => {
      it("should return account with $0.00 fiatBalance and no error", async () => {
        const accountWithZeroBalance: Account = {
          ...baseAccount,
          balance: "0",
        };
        const result = await useCase.execute(accountWithZeroBalance);

        expect(result).toEqual({
          ...accountWithZeroBalance,
          fiatBalance: { value: "0.00", currency: "USD" },
          fiatError: false,
          balanceLoadingState: "loaded",
          fiatLoadingState: "loaded",
        });
        expect(
          mockCounterValueDataSource.getCounterValues,
        ).not.toHaveBeenCalled();
      });
    });

    describe("when counter value fetch fails", () => {
      it("should return account with undefined fiatBalance and fiatError true", async () => {
        mockCounterValueDataSource.getCounterValues.mockResolvedValue(
          Left(new Error("Network error")),
        );

        const result = await useCase.execute(baseAccount);

        expect(result).toEqual({
          ...baseAccount,
          fiatBalance: undefined,
          fiatError: true,
          balanceLoadingState: "loaded",
          fiatLoadingState: "error",
        });
        expect(
          mockCounterValueDataSource.getCounterValues,
        ).toHaveBeenCalledWith(["ethereum"], "usd");
      });
    });

    describe("when counter value fetch returns empty array", () => {
      it("should return account with undefined fiat value when no rate available", async () => {
        mockCounterValueDataSource.getCounterValues.mockResolvedValue(
          Right([] as CounterValueResult[]),
        );

        const result = await useCase.execute(baseAccount);

        expect(result).toEqual({
          ...baseAccount,
          fiatBalance: undefined,
          fiatError: false,
          balanceLoadingState: "loaded",
          fiatLoadingState: "loading",
        });
      });
    });

    describe("when counter value fetch succeeds", () => {
      it("should calculate fiat balance correctly with default currency", async () => {
        const counterValueResult: CounterValueResult[] = [
          { ledgerId: "ethereum", rate: 2500.5 },
        ];
        mockCounterValueDataSource.getCounterValues.mockResolvedValue(
          Right(counterValueResult),
        );

        const result = await useCase.execute(baseAccount);

        expect(result).toEqual({
          ...baseAccount,
          fiatBalance: {
            value: "6251.25",
            currency: "USD",
          },
          fiatError: false,
          balanceLoadingState: "loaded",
          fiatLoadingState: "loaded",
        });
        expect(
          mockCounterValueDataSource.getCounterValues,
        ).toHaveBeenCalledWith(["ethereum"], "usd");
      });

      it("should use the preferred fiat currency from context", async () => {
        const counterValueResult: CounterValueResult[] = [
          { ledgerId: "ethereum", rate: 2300 },
        ];
        mockCounterValueDataSource.getCounterValues.mockResolvedValue(
          Right(counterValueResult),
        );
        setPreferredFiatCurrency("eur");

        const result = await useCase.execute(baseAccount);

        expect(result.fiatBalance).toEqual({
          value: "5750.00",
          currency: "EUR",
        });
        expect(
          mockCounterValueDataSource.getCounterValues,
        ).toHaveBeenCalledWith(["ethereum"], "eur");
      });

      it("should handle decimal balance values", async () => {
        const accountWithDecimalBalance: Account = {
          ...baseAccount,
          balance: "1.5",
        };
        const counterValueResult: CounterValueResult[] = [
          { ledgerId: "ethereum", rate: 2000 },
        ];
        mockCounterValueDataSource.getCounterValues.mockResolvedValue(
          Right(counterValueResult),
        );

        const result = await useCase.execute(accountWithDecimalBalance);

        expect(result.fiatBalance).toEqual({
          value: "3000.00",
          currency: "USD",
        });
      });
      it("should hydrate tokens with fiat values", async () => {
        const counterValueResult: CounterValueResult[] = [
          { ledgerId: "ethereum", rate: 2500 },
          { ledgerId: "ethereum/erc20/usdc", rate: 0.99 },
        ];
        mockCounterValueDataSource.getCounterValues.mockResolvedValue(
          Right(counterValueResult),
        );

        const result = await useCase.execute(accountWithToken);

        expect(result.fiatBalance).toEqual({
          value: "6250.00",
          currency: "USD",
        });
        expect(result.tokens[0].fiatBalance).toEqual({
          value: "42570.00",
          currency: "USD",
        });
        expect(
          mockCounterValueDataSource.getCounterValues,
        ).toHaveBeenCalledWith(["ethereum", "ethereum/erc20/usdc"], "usd");
      });
    });
  });
});
