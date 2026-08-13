import { describe, expect, it } from "vitest";

import { LedgerButtonError } from "@api/errors/LedgerButtonError.js";

import {
  CoinServiceApiError,
  CoinServiceBalanceFetchError,
  CoinServiceInvalidAddressError,
  CoinServiceNetworkError,
  CoinServiceServiceErrors,
  CoinServiceTokenFetchError,
  CoinServiceUnknownError,
  CoinServiceUnsupportedChainError,
} from "./error.js";

describe("CoinService Service Errors", () => {
  const testAddress = "0x1234567890abcdef1234567890abcdef12345678";
  const testAddressAlt = "0xabc";
  const testAddressInvalid = "0xinvalid";
  const testCurrencyIdEth = "ethereum";
  const testCurrencyIdPolygon = "polygon";

  describe("CoinServiceNetworkError", () => {
    it("should create error with message", () => {
      const error = new CoinServiceNetworkError("Connection failed");

      expect(error).toBeInstanceOf(LedgerButtonError);
      expect(error.name).toBe("CoinServiceNetworkError");
      expect(error.message).toBe("Connection failed");
      expect(error.context).toBeUndefined();
    });

    it("should create error with message and context", () => {
      const context = { statusCode: 500, url: "https://api.example.com" };
      const error = new CoinServiceNetworkError("Connection failed", context);

      expect(error.context).toEqual(context);
    });
  });

  describe("CoinServiceInvalidAddressError", () => {
    it("should create error with address in message", () => {
      const error = new CoinServiceInvalidAddressError(testAddressInvalid);

      expect(error).toBeInstanceOf(LedgerButtonError);
      expect(error.name).toBe("CoinServiceInvalidAddressError");
      expect(error.message).toBe(
        `Invalid address format: ${testAddressInvalid}`,
      );
      expect(error.context).toEqual({ address: testAddressInvalid });
    });

    it("should create error with additional context", () => {
      const additionalContext = { reason: "checksum failed" };
      const error = new CoinServiceInvalidAddressError(
        testAddressInvalid,
        additionalContext,
      );

      expect(error.context).toEqual({
        address: testAddressInvalid,
        ...additionalContext,
      });
    });
  });

  describe("CoinServiceUnsupportedChainError", () => {
    it("should create error with currencyId in message", () => {
      const currencyId = "unsupported-chain";
      const error = new CoinServiceUnsupportedChainError(currencyId);

      expect(error).toBeInstanceOf(LedgerButtonError);
      expect(error.name).toBe("CoinServiceUnsupportedChainError");
      expect(error.message).toBe(`Unsupported chain: ${currencyId}`);
      expect(error.context).toEqual({ currencyId });
    });

    it("should create error with additional context", () => {
      const currencyId = "unknown-network";
      const additionalContext = { supportedChains: ["ethereum", "polygon"] };
      const error = new CoinServiceUnsupportedChainError(
        currencyId,
        additionalContext,
      );

      expect(error.context).toEqual({ currencyId, ...additionalContext });
    });
  });

  describe("CoinServiceApiError", () => {
    it("should create error with message", () => {
      const error = new CoinServiceApiError("API request failed");

      expect(error).toBeInstanceOf(LedgerButtonError);
      expect(error.name).toBe("CoinServiceApiError");
      expect(error.message).toBe("API request failed");
      expect(error.context).toBeUndefined();
    });

    it("should create error with message and context", () => {
      const context = { endpoint: "/balance", method: "GET" };
      const error = new CoinServiceApiError("API request failed", context);

      expect(error.context).toEqual(context);
    });
  });

  describe("CoinServiceBalanceFetchError", () => {
    it("should create error with address and currencyId in message", () => {
      const error = new CoinServiceBalanceFetchError(
        testAddress,
        testCurrencyIdEth,
      );

      expect(error).toBeInstanceOf(LedgerButtonError);
      expect(error.name).toBe("CoinServiceBalanceFetchError");
      expect(error.message).toBe(
        `Failed to fetch balance for address ${testAddress} on ${testCurrencyIdEth}`,
      );
      expect(error.context).toEqual({
        address: testAddress,
        currencyId: testCurrencyIdEth,
      });
    });

    it("should create error with additional context", () => {
      const additionalContext = { retryCount: 3, lastError: "timeout" };
      const error = new CoinServiceBalanceFetchError(
        testAddressAlt,
        testCurrencyIdPolygon,
        additionalContext,
      );

      expect(error.context).toEqual({
        address: testAddressAlt,
        currencyId: testCurrencyIdPolygon,
        ...additionalContext,
      });
    });
  });

  describe("CoinServiceTokenFetchError", () => {
    it("should create error with address and currencyId in message", () => {
      const error = new CoinServiceTokenFetchError(
        testAddress,
        testCurrencyIdEth,
      );

      expect(error).toBeInstanceOf(LedgerButtonError);
      expect(error.name).toBe("CoinServiceTokenFetchError");
      expect(error.message).toBe(
        `Failed to fetch token balances for address ${testAddress} on ${testCurrencyIdEth}`,
      );
      expect(error.context).toEqual({
        address: testAddress,
        currencyId: testCurrencyIdEth,
      });
    });

    it("should create error with additional context", () => {
      const currencyId = "arbitrum";
      const additionalContext = { tokenCount: 5, failedTokens: ["USDT"] };
      const error = new CoinServiceTokenFetchError(
        testAddressAlt,
        currencyId,
        additionalContext,
      );

      expect(error.context).toEqual({
        address: testAddressAlt,
        currencyId,
        ...additionalContext,
      });
    });
  });

  describe("CoinServiceUnknownError", () => {
    it("should create error with message", () => {
      const error = new CoinServiceUnknownError("Something went wrong");

      expect(error).toBeInstanceOf(LedgerButtonError);
      expect(error.name).toBe("CoinServiceUnknownError");
      expect(error.message).toBe("Something went wrong");
      expect(error.context).toBeUndefined();
    });

    it("should create error with message and context", () => {
      const context = { details: "Unexpected state", code: "UNKNOWN" };
      const error = new CoinServiceUnknownError(
        "Something went wrong",
        context,
      );

      expect(error.context).toEqual(context);
    });
  });

  describe("CoinServiceServiceErrors", () => {
    test.each([
      [
        "networkError",
        CoinServiceServiceErrors.networkError,
        CoinServiceNetworkError,
        "Network timeout",
      ],
      [
        "invalidAddress",
        CoinServiceServiceErrors.invalidAddress,
        CoinServiceInvalidAddressError,
        "0x123",
      ],
      [
        "unsupportedChain",
        CoinServiceServiceErrors.unsupportedChain,
        CoinServiceUnsupportedChainError,
        "solana",
      ],
      [
        "apiError",
        CoinServiceServiceErrors.apiError,
        CoinServiceApiError,
        "API request failed",
      ],
      [
        "balanceFetchError",
        CoinServiceServiceErrors.balanceFetchError,
        CoinServiceBalanceFetchError,
        "0x123",
        "eth",
      ],
      [
        "tokenFetchError",
        CoinServiceServiceErrors.tokenFetchError,
        CoinServiceTokenFetchError,
        "0x123",
        "eth",
      ],
      [
        "unknownError",
        CoinServiceServiceErrors.unknownError,
        CoinServiceUnknownError,
        "Something went wrong",
      ],
    ])("%s", (_, factory, InstanceType, ...params: unknown[]) => {
      // @ts-expect-error: test each expects alignment with error constructor signatures
      expect(factory(...params)).toBeInstanceOf(InstanceType);
    });
  });
});
