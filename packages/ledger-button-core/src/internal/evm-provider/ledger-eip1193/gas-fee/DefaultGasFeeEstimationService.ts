import { inject, injectable } from "inversify";

import { JsonRpcResponseSuccess } from "../../../../api/model/eip/EIPTypes.js";
import type {
  ProviderGasFeeEstimation,
  ProviderTransactionInfo,
} from "../../../../api/model/blockchain/GasFee.js";
import type {
  CoreFacade,
  ProviderBlockchain,
} from "../../../blockchain-provider/model/BlockchainProvider.js";
import { evmProviderModuleTypes } from "../../evmProviderModuleTypes.js";
import { GasFeeEstimationService } from "./GasFeeEstimationService.js";

function isJsonRpcResponseSuccess(
  value: unknown,
): value is JsonRpcResponseSuccess {
  return (
    typeof value === "object" &&
    value !== null &&
    "result" in value &&
    !("error" in value)
  );
}

@injectable()
export class DefaultGasFeeEstimationService implements GasFeeEstimationService {
  constructor(
    @inject(evmProviderModuleTypes.CoreFacade)
    private readonly core: CoreFacade,
  ) {}

  async getNonceForTx(tx: ProviderTransactionInfo): Promise<string> {
    const nonce = await this.getNonce(tx);
    if (!nonce) {
      throw new Error("Failed to get nonce");
    }

    return nonce;
  }

  async getFeesForTransaction(
    tx: ProviderTransactionInfo,
  ): Promise<ProviderGasFeeEstimation> {
    const logger = this.core.getLogger("DefaultGasFeeEstimationService");

    const coinServiceResult = await this.core.estimateGasFromCoinService(tx);
    if (coinServiceResult) {
      logger.debug("Got gas fee estimation from CoinService", {
        coinServiceResult,
      });
      return coinServiceResult;
    }

    logger.debug(
      "CoinService gas fee estimation unavailable, falling back to RPC",
    );
    return this.getFeesFromRpc(tx);
  }

  private blockchainFor(tx: ProviderTransactionInfo): ProviderBlockchain {
    return { name: "ethereum", chainId: Number(tx.chainId).toString() };
  }

  private async getFeesFromRpc(
    tx: ProviderTransactionInfo,
  ): Promise<ProviderGasFeeEstimation> {
    const estimateGas = await this.estimateGas(tx);
    const baseFeePerGas = await this.getBaseFeePerGas(tx);
    const maxPriorityFeePerGas = await this.getMaxPriorityFeePerGas(tx);

    // Add a 20% buffer to the estimated gas limit.
    const gasLimit = Number((estimateGas * 1.2).toFixed(0));

    // maxFeePerGas = baseFeePerGas * 2 + maxPriorityFeePerGas
    // https://www.blocknative.com/blog/eip-1559-fees#3
    const maxFeePerGas = baseFeePerGas * 2 + maxPriorityFeePerGas;

    return {
      gasLimit: `0x${gasLimit.toString(16)}`,
      maxFeePerGas: `0x${maxFeePerGas.toString(16)}`,
      maxPriorityFeePerGas: `0x${maxPriorityFeePerGas.toString(16)}`,
    };
  }

  async getMaxPriorityFeePerGas(tx: ProviderTransactionInfo): Promise<number> {
    try {
      const response = await this.core.broadcastRPC(
        {
          method: "eth_maxPriorityFeePerGas",
          params: [],
          id: 1,
          jsonrpc: "2.0",
        },
        this.blockchainFor(tx),
      );
      if (isJsonRpcResponseSuccess(response)) {
        return Number(response.result as string);
      }
    } catch {
      // fall through to default
    }
    return 20000; // Value from JSON RPC request on 2025-10-03
  }

  async getBaseFeePerGas(tx: ProviderTransactionInfo): Promise<number> {
    try {
      const response = await this.core.broadcastRPC(
        {
          method: "eth_getBlockByNumber",
          params: ["latest", false],
          id: 1,
          jsonrpc: "2.0",
        },
        this.blockchainFor(tx),
      );
      if (isJsonRpcResponseSuccess(response)) {
        const rpcResult = response.result as { baseFeePerGas: string };
        return Number(rpcResult.baseFeePerGas);
      }
    } catch {
      // fall through to default
    }
    return 2000000;
  }

  async estimateGas(tx: ProviderTransactionInfo): Promise<number> {
    try {
      const response = await this.core.broadcastRPC(
        {
          method: "eth_estimateGas",
          params: [
            { from: tx.from, to: tx.to, value: tx.value, input: tx.data },
            "latest",
          ],
          id: 1,
          jsonrpc: "2.0",
        },
        this.blockchainFor(tx),
      );
      if (isJsonRpcResponseSuccess(response)) {
        return Number(response.result as string);
      }
    } catch {
      // fall through to default
    }
    return 90000; // Default gas limit value from JSON RPC website
  }

  async getNonce(tx: ProviderTransactionInfo): Promise<string | undefined> {
    try {
      const response = await this.core.broadcastRPC(
        {
          method: "eth_getTransactionCount",
          params: [tx.from, "latest"],
          id: 1,
          jsonrpc: "2.0",
        },
        this.blockchainFor(tx),
      );
      if (
        isJsonRpcResponseSuccess(response) &&
        typeof response.result === "string"
      ) {
        return response.result;
      }
    } catch {
      // fall through
    }
    return undefined;
  }
}
