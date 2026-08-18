import type { CoreFacade } from "@ledgerhq/ledger-wallet-provider-core";
import type {
  ProviderGasFeeEstimation,
  ProviderTransactionInfo,
} from "@ledgerhq/ledger-wallet-provider-core";
import { JsonRpcResponseSuccess } from "@ledgerhq/ledger-wallet-provider-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockCoreFacade } from "../__mocks__/coreFacadeMock";
import { DefaultGasFeeEstimationService } from "./DefaultGasFeeEstimationService";

describe("DefaultGasFeeEstimationService", () => {
  let gasFeeEstimationService: DefaultGasFeeEstimationService;
  let core: CoreFacade;

  const mockTx: ProviderTransactionInfo = {
    chainId: "1",
    from: "0x1234567890abcdef1234567890abcdef12345678",
    to: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    value: "0x0",
    data: "0x",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    core = createMockCoreFacade();
    gasFeeEstimationService = new DefaultGasFeeEstimationService(core);
  });

  describe("getNonceForTx", () => {
    it("should successfully get nonce for transaction", async () => {
      const mockNonceResponse: JsonRpcResponseSuccess = {
        jsonrpc: "2.0",
        id: 1,
        result: "0x5",
      };

      vi.mocked(core.broadcastRPC).mockResolvedValue(mockNonceResponse);

      const result = await gasFeeEstimationService.getNonceForTx(mockTx);

      expect(result).toEqual(mockNonceResponse.result);
      expect(result).toMatch(/^0x[0-9a-f]+$/i);
      expect(core.broadcastRPC).toHaveBeenCalledWith(
        {
          method: "eth_getTransactionCount",
          params: [mockTx.from, "latest"],
          id: 1,
          jsonrpc: "2.0",
        },
        { name: "ethereum", chainId: "1" },
      );
    });

    it("should throw error when nonce is undefined", async () => {
      vi.spyOn(gasFeeEstimationService, "getNonce").mockResolvedValue(
        undefined,
      );

      await expect(
        gasFeeEstimationService.getNonceForTx(mockTx),
      ).rejects.toThrow("Failed to get nonce");
    });
  });

  describe("getFeesForTransaction", () => {
    it("should use CoinService for gas fee estimation when available", async () => {
      const coinServiceEstimation: ProviderGasFeeEstimation = {
        gasLimit: "0xc350",
        maxFeePerGas: "0x6fc23ac00",
        maxPriorityFeePerGas: "0x77359400",
      };

      vi.mocked(core.estimateGasFromCoinService).mockResolvedValue(
        coinServiceEstimation,
      );

      const result =
        await gasFeeEstimationService.getFeesForTransaction(mockTx);

      expect(core.estimateGasFromCoinService).toHaveBeenCalledWith(mockTx);
      expect(result).toEqual(coinServiceEstimation);
    });

    it("should fallback to RPC method when CoinService is unavailable", async () => {
      vi.mocked(core.estimateGasFromCoinService).mockResolvedValue(undefined);

      const mockEstimateGas = 50000;
      const mockBaseFeePerGas = 30000000000;
      const mockMaxPriorityFeePerGas = 2000000000;

      vi.spyOn(gasFeeEstimationService, "estimateGas").mockResolvedValue(
        mockEstimateGas,
      );
      vi.spyOn(gasFeeEstimationService, "getBaseFeePerGas").mockResolvedValue(
        mockBaseFeePerGas,
      );
      vi.spyOn(
        gasFeeEstimationService,
        "getMaxPriorityFeePerGas",
      ).mockResolvedValue(mockMaxPriorityFeePerGas);

      const result =
        await gasFeeEstimationService.getFeesForTransaction(mockTx);

      expect(core.estimateGasFromCoinService).toHaveBeenCalled();
      expect(gasFeeEstimationService.estimateGas).toHaveBeenCalledWith(mockTx);
      expect(result.gasLimit).toMatch(/^0x[0-9a-f]+$/i);
    });

    it("should calculate maxFeePerGas correctly (baseFee * 2 + maxPriorityFee) when using RPC fallback", async () => {
      vi.mocked(core.estimateGasFromCoinService).mockResolvedValue(undefined);

      const mockEstimateGas = 50000;
      const mockBaseFeePerGas = 30000000000; // 30 gwei
      const mockMaxPriorityFeePerGas = 2000000000; // 2 gwei
      const mockGasLimitMultiplier = 1.2;

      vi.spyOn(gasFeeEstimationService, "estimateGas").mockResolvedValue(
        mockEstimateGas,
      );
      vi.spyOn(gasFeeEstimationService, "getBaseFeePerGas").mockResolvedValue(
        mockBaseFeePerGas,
      );
      vi.spyOn(
        gasFeeEstimationService,
        "getMaxPriorityFeePerGas",
      ).mockResolvedValue(mockMaxPriorityFeePerGas);

      const result =
        await gasFeeEstimationService.getFeesForTransaction(mockTx);

      expect(gasFeeEstimationService.estimateGas).toHaveBeenCalledWith(mockTx);
      expect(gasFeeEstimationService.getBaseFeePerGas).toHaveBeenCalledWith(
        mockTx,
      );
      expect(
        gasFeeEstimationService.getMaxPriorityFeePerGas,
      ).toHaveBeenCalledWith(mockTx);

      expect(result.gasLimit).toMatch(/^0x[0-9a-f]+$/i);
      expect(Number(result.gasLimit)).toEqual(
        mockEstimateGas * mockGasLimitMultiplier,
      );

      expect(result.maxFeePerGas).toMatch(/^0x[0-9a-f]+$/i);
      expect(Number(result.maxFeePerGas)).toEqual(
        mockBaseFeePerGas * 2 + mockMaxPriorityFeePerGas,
      );

      expect(result.maxPriorityFeePerGas).toMatch(/^0x[0-9a-f]+$/i);
      expect(Number(result.maxPriorityFeePerGas)).toEqual(
        mockMaxPriorityFeePerGas,
      );
    });
  });

  describe("getMaxPriorityFeePerGas", () => {
    it("should successfully fetch max priority fee per gas", async () => {
      const mockResponse: JsonRpcResponseSuccess = {
        jsonrpc: "2.0",
        id: 1,
        result: "0x12a05f200", // 5000000000 in hex
      };

      vi.mocked(core.broadcastRPC).mockResolvedValue(mockResponse);

      const result =
        await gasFeeEstimationService.getMaxPriorityFeePerGas(mockTx);

      expect(result).toEqual(5000000000);
      expect(core.broadcastRPC).toHaveBeenCalledWith(
        {
          method: "eth_maxPriorityFeePerGas",
          params: [],
          id: 1,
          jsonrpc: "2.0",
        },
        { name: "ethereum", chainId: "1" },
      );
    });

    it("should return default value (20000) when broadcast throws", async () => {
      vi.mocked(core.broadcastRPC).mockRejectedValue(
        new Error("Backend error"),
      );

      const result =
        await gasFeeEstimationService.getMaxPriorityFeePerGas(mockTx);

      expect(result).toEqual(20000);
    });

    it("should return default value (20000) when response is an error response", async () => {
      vi.mocked(core.broadcastRPC).mockResolvedValue({
        jsonrpc: "2.0",
        id: 1,
        error: { code: -32000, message: "Error message" },
      });

      const result =
        await gasFeeEstimationService.getMaxPriorityFeePerGas(mockTx);

      expect(result).toEqual(20000);
    });
  });

  describe("getBaseFeePerGas", () => {
    it("should successfully fetch base fee per gas from latest block", async () => {
      const mockResponse: JsonRpcResponseSuccess = {
        jsonrpc: "2.0",
        id: 1,
        result: {
          baseFeePerGas: "0x6fc23ac00", // 30000000000 in hex
          number: "0x123",
        },
      };

      vi.mocked(core.broadcastRPC).mockResolvedValue(mockResponse);

      const result = await gasFeeEstimationService.getBaseFeePerGas(mockTx);

      expect(result).toEqual(30000000000);
      expect(core.broadcastRPC).toHaveBeenCalledWith(
        {
          method: "eth_getBlockByNumber",
          params: ["latest", false],
          id: 1,
          jsonrpc: "2.0",
        },
        { name: "ethereum", chainId: "1" },
      );
    });

    it("should return default value (2000000) when broadcast throws", async () => {
      vi.mocked(core.broadcastRPC).mockRejectedValue(
        new Error("Backend error"),
      );

      const result = await gasFeeEstimationService.getBaseFeePerGas(mockTx);

      expect(result).toEqual(2000000);
    });
  });

  describe("estimateGas", () => {
    it("should successfully estimate gas for transaction", async () => {
      const mockResponse: JsonRpcResponseSuccess = {
        jsonrpc: "2.0",
        id: 1,
        result: "0xc350", // 50000 in hex
      };

      vi.mocked(core.broadcastRPC).mockResolvedValue(mockResponse);

      const result = await gasFeeEstimationService.estimateGas(mockTx);

      expect(result).toEqual(Number(mockResponse.result));
    });

    it("should return default value (90000) when broadcast throws", async () => {
      vi.mocked(core.broadcastRPC).mockRejectedValue(
        new Error("Backend error"),
      );

      const result = await gasFeeEstimationService.estimateGas(mockTx);

      expect(result).toEqual(90000);
    });

    it("should format transaction request correctly", async () => {
      const customTx: ProviderTransactionInfo = {
        chainId: "5",
        from: "0xSender",
        to: "0xReceiver",
        value: "0x1000",
        data: "0xabcd",
      };

      const mockResponse: JsonRpcResponseSuccess = {
        jsonrpc: "2.0",
        id: 1,
        result: "0x5208",
      };

      vi.mocked(core.broadcastRPC).mockResolvedValue(mockResponse);

      await gasFeeEstimationService.estimateGas(customTx);

      expect(core.broadcastRPC).toHaveBeenCalledWith(
        {
          method: "eth_estimateGas",
          params: [
            {
              from: customTx.from,
              to: customTx.to,
              value: customTx.value,
              input: customTx.data,
            },
            "latest",
          ],
          id: 1,
          jsonrpc: "2.0",
        },
        { name: "ethereum", chainId: "5" },
      );
    });

    it("should return default value (90000) when response is an error response", async () => {
      vi.mocked(core.broadcastRPC).mockResolvedValue({
        jsonrpc: "2.0",
        id: 1,
        error: { code: -32000, message: "Execution reverted" },
      });

      const result = await gasFeeEstimationService.estimateGas(mockTx);

      expect(result).toEqual(90000);
    });
  });

  describe("getNonce", () => {
    it("should successfully fetch nonce for address", async () => {
      const mockResponse: JsonRpcResponseSuccess = {
        jsonrpc: "2.0",
        id: 1,
        result: "0xa",
      };

      vi.mocked(core.broadcastRPC).mockResolvedValue(mockResponse);

      const result = await gasFeeEstimationService.getNonce(mockTx);

      expect(result).toEqual(mockResponse.result);
      expect(result).toMatch(/^0x[0-9a-f]+$/i);
      expect(core.broadcastRPC).toHaveBeenCalledWith(
        {
          method: "eth_getTransactionCount",
          params: [mockTx.from, "latest"],
          id: 1,
          jsonrpc: "2.0",
        },
        { name: "ethereum", chainId: "1" },
      );
    });

    it("should return undefined when broadcast throws", async () => {
      vi.mocked(core.broadcastRPC).mockRejectedValue(
        new Error("Backend error"),
      );

      const result = await gasFeeEstimationService.getNonce(mockTx);

      expect(result).toBeUndefined();
    });

    it("should return undefined when response is an error response", async () => {
      vi.mocked(core.broadcastRPC).mockResolvedValue({
        jsonrpc: "2.0",
        id: 1,
        error: { code: -32000, message: "Error message" },
      });

      const result = await gasFeeEstimationService.getNonce(mockTx);

      expect(result).toBeUndefined();
    });

    it("should return undefined when result is not a string", async () => {
      vi.mocked(core.broadcastRPC).mockResolvedValue({
        jsonrpc: "2.0",
        id: 1,
        result: 123, // number instead of string
      } as unknown as JsonRpcResponseSuccess);

      const result = await gasFeeEstimationService.getNonce(mockTx);

      expect(result).toBeUndefined();
    });
  });
});
