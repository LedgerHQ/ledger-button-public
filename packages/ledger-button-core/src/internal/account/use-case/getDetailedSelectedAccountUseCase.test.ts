import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ContextService } from "../../context/ContextService.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import type { Account } from "../service/AccountService.js";
import type { FetchSelectedAccountUseCase } from "./fetchSelectedAccountUseCase.js";
import { GetDetailedSelectedAccountUseCase } from "./getDetailedSelectedAccountUseCase.js";

describe("GetDetailedSelectedAccountUseCase", () => {
  let useCase: GetDetailedSelectedAccountUseCase;
  let mockContextService: {
    getContext: ReturnType<typeof vi.fn>;
  };
  let mockFetchSelectedAccountUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  let mockLogger: {
    debug: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };
  let mockLoggerFactory: ReturnType<typeof vi.fn>;

  const hydratedAccount: Account = {
    id: "account-1",
    currencyId: "ethereum",
    freshAddress: "0x1234567890abcdef1234567890abcdef12345678",
    seedIdentifier: "seed-1",
    derivationMode: "default",
    index: 0,
    name: "My Ethereum Account",
    ticker: "ETH",
    balance: "1000000000000000000",
    tokens: [],
  };

  const nonHydratedAccount: Account = {
    id: "account-2",
    currencyId: "ethereum",
    freshAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    seedIdentifier: "seed-1",
    derivationMode: "default",
    index: 1,
    name: "",
    ticker: "",
    balance: undefined,
    tokens: [],
  };

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    mockLoggerFactory = vi.fn().mockReturnValue(mockLogger);

    mockContextService = {
      getContext: vi.fn(),
    };

    mockFetchSelectedAccountUseCase = {
      execute: vi.fn(),
    };

    useCase = new GetDetailedSelectedAccountUseCase(
      mockLoggerFactory as unknown as () => LoggerPublisher,
      mockContextService as unknown as ContextService,
      mockFetchSelectedAccountUseCase as unknown as FetchSelectedAccountUseCase,
    );

    vi.clearAllMocks();
  });

  describe("execute", () => {
    describe("when selected account is already hydrated", () => {
      it("should return the account directly without fetching", async () => {
        mockContextService.getContext.mockReturnValue({
          selectedAccount: hydratedAccount,
        });

        const result = await useCase.execute();

        expect(result).toEqual(hydratedAccount);
        expect(mockFetchSelectedAccountUseCase.execute).not.toHaveBeenCalled();
        expect(mockLogger.debug).toHaveBeenCalledWith(
          "Selected account already hydrated",
          { selectedAccount: hydratedAccount },
        );
      });
    });

    describe("when selected account is not hydrated", () => {
      it.each([
        {
          scenario: "account has empty name",
          selectedAccount: nonHydratedAccount,
          expectedResult: hydratedAccount,
        },
        {
          scenario: "account is undefined",
          selectedAccount: undefined,
          expectedResult: undefined,
        },
      ])(
        "should fetch account details when $scenario",
        async ({ selectedAccount, expectedResult }) => {
          mockContextService.getContext.mockReturnValue({
            selectedAccount,
          });
          mockFetchSelectedAccountUseCase.execute.mockResolvedValue(
            expectedResult,
          );

          const result = await useCase.execute();

          expect(result).toEqual(expectedResult);
          expect(mockFetchSelectedAccountUseCase.execute).toHaveBeenCalledTimes(
            1,
          );
        },
      );
    });
  });
});
