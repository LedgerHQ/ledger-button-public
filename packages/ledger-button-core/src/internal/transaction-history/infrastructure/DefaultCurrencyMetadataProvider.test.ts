import { Left, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CalDataSource } from "../../balance/datasource/cal/CalDataSource.js";
import type {
  CurrencyInformation,
  TokenInformation,
} from "../../balance/datasource/cal/calTypes.js";
import { DefaultCurrencyMetadataProvider } from "./DefaultCurrencyMetadataProvider.js";

function createMockCalDataSource(): {
  getTokenInformation: ReturnType<typeof vi.fn>;
  getCurrencyInformation: ReturnType<typeof vi.fn>;
} {
  return {
    getTokenInformation: vi.fn(),
    getCurrencyInformation: vi.fn(),
  };
}

const TOKEN_INFO: TokenInformation = {
  id: "ethereum/erc20/usdc",
  name: "USD Coin",
  ticker: "USDC",
  decimals: 6,
};

const CURRENCY_INFO: CurrencyInformation = {
  id: "ethereum",
  name: "Ethereum",
  ticker: "ETH",
  decimals: 18,
  transactionExplorerUrlTemplate: "https://etherscan.io/tx/${hash}",
};

describe("DefaultCurrencyMetadataProvider", () => {
  let provider: DefaultCurrencyMetadataProvider;
  let mockCal: ReturnType<typeof createMockCalDataSource>;

  beforeEach(() => {
    mockCal = createMockCalDataSource();
    provider = new DefaultCurrencyMetadataProvider(
      mockCal as unknown as CalDataSource,
    );
  });

  describe("getCurrencyInformation", () => {
    it("delegates to CAL and propagates Right", async () => {
      mockCal.getCurrencyInformation.mockResolvedValue(Right(CURRENCY_INFO));

      const result = await provider.getCurrencyInformation("ethereum");

      expect(mockCal.getCurrencyInformation).toHaveBeenCalledWith("ethereum");
      expect(result.unsafeCoerce()).toEqual(CURRENCY_INFO);
    });

    it("propagates Left from CAL", async () => {
      const error = new Error("CAL down");
      mockCal.getCurrencyInformation.mockResolvedValue(Left(error));

      const result = await provider.getCurrencyInformation("ethereum");

      expect(result.isLeft()).toBe(true);
      expect(result.extract()).toBe(error);
    });

    it("does not cache currency information", async () => {
      mockCal.getCurrencyInformation.mockResolvedValue(Right(CURRENCY_INFO));

      await provider.getCurrencyInformation("ethereum");
      await provider.getCurrencyInformation("ethereum");

      expect(mockCal.getCurrencyInformation).toHaveBeenCalledTimes(2);
    });
  });

  describe("getTokenInformation", () => {
    it("hits CAL on first lookup and propagates Right", async () => {
      mockCal.getTokenInformation.mockResolvedValue(Right(TOKEN_INFO));

      const result = await provider.getTokenInformation("0xcontract", "ethereum");

      expect(mockCal.getTokenInformation).toHaveBeenCalledWith(
        "0xcontract",
        "ethereum",
      );
      expect(result.unsafeCoerce()).toEqual(TOKEN_INFO);
    });

    it("serves cached info on subsequent lookups for the same contract", async () => {
      mockCal.getTokenInformation.mockResolvedValue(Right(TOKEN_INFO));

      const first = await provider.getTokenInformation(
        "0xcontract",
        "ethereum",
      );
      const second = await provider.getTokenInformation(
        "0xcontract",
        "ethereum",
      );

      expect(mockCal.getTokenInformation).toHaveBeenCalledTimes(1);
      expect(first.unsafeCoerce()).toEqual(TOKEN_INFO);
      expect(second.unsafeCoerce()).toEqual(TOKEN_INFO);
    });

    it("caches case-insensitively by contract address", async () => {
      mockCal.getTokenInformation.mockResolvedValue(Right(TOKEN_INFO));

      await provider.getTokenInformation("0xABCDEF", "ethereum");
      await provider.getTokenInformation("0xabcdef", "ethereum");

      expect(mockCal.getTokenInformation).toHaveBeenCalledTimes(1);
    });

    it("does not collide between distinct currencyIds for the same contract", async () => {
      const polygonInfo: TokenInformation = {
        ...TOKEN_INFO,
        id: "polygon/erc20/usdc",
      };
      mockCal.getTokenInformation
        .mockResolvedValueOnce(Right(TOKEN_INFO))
        .mockResolvedValueOnce(Right(polygonInfo));

      const ethRes = await provider.getTokenInformation(
        "0xcontract",
        "ethereum",
      );
      const polRes = await provider.getTokenInformation(
        "0xcontract",
        "polygon",
      );

      expect(mockCal.getTokenInformation).toHaveBeenCalledTimes(2);
      expect(ethRes.unsafeCoerce().id).toBe("ethereum/erc20/usdc");
      expect(polRes.unsafeCoerce().id).toBe("polygon/erc20/usdc");
    });

    it("does not cache CAL errors", async () => {
      const error = new Error("CAL down");
      mockCal.getTokenInformation
        .mockResolvedValueOnce(Left(error))
        .mockResolvedValueOnce(Right(TOKEN_INFO));

      const first = await provider.getTokenInformation(
        "0xcontract",
        "ethereum",
      );
      const second = await provider.getTokenInformation(
        "0xcontract",
        "ethereum",
      );

      expect(first.isLeft()).toBe(true);
      expect(second.isRight()).toBe(true);
      expect(mockCal.getTokenInformation).toHaveBeenCalledTimes(2);
    });
  });
});
