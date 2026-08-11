import { Left, Maybe, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CalDataSource } from "@internal/balance/datasource/cal/CalDataSource.js";
import type { BlockchainProviderManager } from "@internal/blockchain-provider/service/BlockchainProviderManager.js";
import { ResolveCurrencyDecimalsUseCase } from "./ResolveCurrencyDecimalsUseCase.js";

function createMockLoggerFactory() {
  return vi.fn().mockReturnValue({
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    fatal: vi.fn(),
    subscribers: [],
  });
}

function createMockCalDataSource() {
  return {
    getCurrencyInformation: vi.fn(),
    getTokenInformation: vi.fn(),
  };
}

function createMockBlockchainProviderManager(): BlockchainProviderManager {
  return {
    init: vi.fn(),
    setSelectedAccounts: vi.fn(),
    setNetwork: vi.fn(),
    resolveBlockchainFamily: vi.fn().mockReturnValue(Maybe.empty()),
    resolveNetwork: vi.fn().mockReturnValue(Maybe.empty()),
    resolveCurrencyId: vi.fn().mockReturnValue(Maybe.empty()),
    getNativeDecimals: vi.fn().mockReturnValue(Maybe.empty()),
  };
}

describe("ResolveCurrencyDecimalsUseCase", () => {
  let useCase: ResolveCurrencyDecimalsUseCase;
  let mockCalDataSource: ReturnType<typeof createMockCalDataSource>;
  let mockBlockchainProviderManager: BlockchainProviderManager;

  beforeEach(() => {
    mockCalDataSource = createMockCalDataSource();
    mockBlockchainProviderManager = createMockBlockchainProviderManager();

    useCase = new ResolveCurrencyDecimalsUseCase(
      mockCalDataSource as unknown as CalDataSource,
      mockBlockchainProviderManager,
      createMockLoggerFactory(),
    );
  });

  it("should return the decimals reported by CAL", async () => {
    mockCalDataSource.getCurrencyInformation.mockResolvedValue(
      Right({ id: "solana", name: "Solana", ticker: "SOL", decimals: 9 }),
    );

    const result = await useCase.execute("solana");

    expect(result.extract()).toBe(9);
  });

  it("should not query the providers when CAL answers", async () => {
    mockCalDataSource.getCurrencyInformation.mockResolvedValue(
      Right({ id: "ethereum", name: "Ethereum", ticker: "ETH", decimals: 18 }),
    );

    await useCase.execute("ethereum");

    expect(
      mockBlockchainProviderManager.getNativeDecimals,
    ).not.toHaveBeenCalled();
  });

  it("should fall back to the native decimals of the owning provider", async () => {
    mockCalDataSource.getCurrencyInformation.mockResolvedValue(
      Left(new Error("CAL unavailable")),
    );
    vi.mocked(mockBlockchainProviderManager.getNativeDecimals).mockReturnValue(
      Maybe.of(9),
    );

    const result = await useCase.execute("solana");

    expect(result.extract()).toBe(9);
    expect(mockBlockchainProviderManager.getNativeDecimals).toHaveBeenCalledWith(
      "solana",
    );
  });

  it("should return Nothing when no provider claims the currency", async () => {
    mockCalDataSource.getCurrencyInformation.mockResolvedValue(
      Left(new Error("CAL unavailable")),
    );

    const result = await useCase.execute("unsupported_chain");

    expect(result.isNothing()).toBe(true);
  });
});
