import { Left, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NoSelectedAccountError } from "../../../api/errors/LedgerSyncErrors.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import type { DetailedAccount } from "../service/AccountService.js";
import type { FetchSelectedAccountUseCase } from "./fetchSelectedAccountUseCase.js";
import { GetDetailedSelectedAccountUseCase } from "./getDetailedSelectedAccountUseCase.js";

describe("GetDetailedSelectedAccountUseCase", () => {
  let useCase: GetDetailedSelectedAccountUseCase;
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

  const hydratedAccount: DetailedAccount = {
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
    fiatBalance: { value: "2000.00", currency: "USD" },
    transactionHistory: [],
    networks: [{ id: "1", name: "ethereum" }],
  };

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    mockLoggerFactory = vi.fn().mockReturnValue(mockLogger);

    mockFetchSelectedAccountUseCase = {
      execute: vi.fn(),
    };

    useCase = new GetDetailedSelectedAccountUseCase(
      mockLoggerFactory as unknown as () => LoggerPublisher,
      mockFetchSelectedAccountUseCase as unknown as FetchSelectedAccountUseCase,
    );

    vi.clearAllMocks();
  });

  describe("execute", () => {
    it("should always delegate to FetchSelectedAccountUseCase", async () => {
      mockFetchSelectedAccountUseCase.execute.mockResolvedValue(
        Right(hydratedAccount),
      );

      const result = await useCase.execute();

      expect(result.isRight()).toBe(true);
      result.map((account) => {
        expect(account).toEqual(hydratedAccount);
      });
      expect(mockFetchSelectedAccountUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it("should return Left when fetch fails with NoSelectedAccountError", async () => {
      mockFetchSelectedAccountUseCase.execute.mockResolvedValue(
        Left(new NoSelectedAccountError()),
      );

      const result = await useCase.execute();

      expect(result.isLeft()).toBe(true);
      result.mapLeft((error) => {
        expect(error).toBeInstanceOf(NoSelectedAccountError);
      });
      expect(mockFetchSelectedAccountUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it("should re-fetch on every call (no caching short-circuit)", async () => {
      mockFetchSelectedAccountUseCase.execute.mockResolvedValue(
        Right(hydratedAccount),
      );

      await useCase.execute();
      await useCase.execute();

      expect(mockFetchSelectedAccountUseCase.execute).toHaveBeenCalledTimes(2);
    });
  });
});
