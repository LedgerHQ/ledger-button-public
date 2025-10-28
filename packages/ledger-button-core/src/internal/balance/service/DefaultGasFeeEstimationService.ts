import { type Factory, inject, injectable } from "inversify";

import { JsonRpcResponseSuccess } from "../../../api/model/eip/EIPTypes.js";
import {
  BroadcastResponse,
  isJsonRpcResponseSuccess,
} from "../../../internal/backend/types.js";
import { backendModuleTypes } from "../../backend/backendModuleTypes.js";
import { type BackendService } from "../../backend/BackendService.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { balanceModuleTypes } from "../balanceModuleTypes.js";
import type { AlpacaDataSource } from "../datasource/alpaca/AlpacaDataSource.js";
import { TransactionInfo } from "../model/types.js";
import { GasFeeEstimation } from "../model/types.js";
import { GasFeeEstimationService } from "./GasFeeEstimationService.js";

@injectable()
export class DefaultGasFeeEstimationService implements GasFeeEstimationService {
  private readonly logger: LoggerPublisher;
  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    private readonly loggerFactory: Factory<LoggerPublisher>,
    @inject(backendModuleTypes.BackendService)
    private readonly backendService: BackendService,
    @inject(balanceModuleTypes.AlpacaDataSource)
    private readonly alpacaDataSource: AlpacaDataSource,
  ) {
    this.logger = this.loggerFactory("[DefaultGasFeeEstimationService]");
  }

  /**
   * Based on Alpaca's supported networks
   * See: https://alpaca.api.ledger.com/docs/#tag/network/get/networks
   */
  private getAlpacaNetworkName(chainId: string): string | undefined {
    const chainIdToNetwork: Record<string, string> = {
      "1": "ethereum",
      "61": "ethereum_classic",
      "17000": "ethereum_holesky",
      "11155111": "ethereum_sepolia",
      "42161": "arbitrum",
      "421614": "arbitrum_sepolia",
      "592": "astar",
      "43114": "avalanche_c_chain",
      "8453": "base",
      "84532": "base_sepolia",
      "80094": "berachain",
      "199": "bittorrent",
      "81457": "blast",
      "168587773": "blast_sepolia",
      "288": "boba",
      "56": "bsc",
      "25": "cronos",
      "246": "energy_web",
      "128123": "etherlink",
      "250": "fantom",
      "14": "flare",
      "295": "hedera",
      "296": "hedera-testnet",
      "998": "hyperevm",
      "8217": "klaytn",
      "59144": "linea",
      "59141": "linea_sepolia",
      "42": "lukso",
      "1088": "metis",
      "1284": "moonbeam",
      "1285": "moonriver",
      "245022934": "neon_evm",
      "10": "optimism",
      "11155420": "optimism_sepolia",
      "137": "polygon",
      "1101": "polygon_zk_evm",
      "2442": "polygon_zk_evm_testnet",
      "30": "rsk",
      "534352": "scroll",
      "534351": "scroll_sepolia",
      "1329": "sei_network_evm",
      "19": "songbird",
      "146": "sonic",
      "57054": "syscoin",
      "40": "telos_evm",
      "106": "velas_evm",
      "324": "zksync",
      "300": "zksync_sepolia",
    };

    return chainIdToNetwork[chainId];
  }

  //TODO: Move to a different service
  async getNonceForTx(tx: TransactionInfo): Promise<string> {
    const nonce = await this.getNonce(tx);
    if (!nonce) {
      throw new Error("Failed to get nonce");
    }

    return nonce;
  }

  async getFeesForTransaction(tx: TransactionInfo): Promise<GasFeeEstimation> {
    const alpacaNetwork = this.getAlpacaNetworkName(tx.chainId);

    if (alpacaNetwork) {
      this.logger.debug("Attempting to get gas fee estimation from Alpaca", {
        network: alpacaNetwork,
      });

      const alpacaResult = await this.getFeesFromAlpaca(tx, alpacaNetwork);
      if (alpacaResult) {
        this.logger.debug("Successfully got gas fee estimation from Alpaca", {
          alpacaResult,
        });
        return alpacaResult;
      }

      this.logger.debug(
        "Alpaca gas fee estimation failed, falling back to RPC method",
      );
    } else {
      this.logger.debug(
        "Network not supported by Alpaca, using fallback RPC method",
        { chainId: tx.chainId },
      );
    }

    return this.getFeesFromRpc(tx);
  }

  private async getFeesFromAlpaca(
    tx: TransactionInfo,
    network: string,
  ): Promise<GasFeeEstimation | undefined> {
    try {
      const intent = {
        type: "send",
        sender: tx.from,
        recipient: tx.to,
        amount: tx.value,
        asset: {
          type: "native",
        },
        feesStrategy: "medium" as const,
        data: tx.data,
      };

      const result = await this.alpacaDataSource.estimateTransactionFee(
        network,
        intent,
      );

      if (result.isRight()) {
        const response = result.extract();
        return {
          gasLimit: response.parameters.gasLimit,
          maxFeePerGas: response.parameters.maxFeePerGas,
          maxPriorityFeePerGas: response.parameters.maxPriorityFeePerGas,
        };
      }

      this.logger.debug("Alpaca estimation returned an error", {
        error: result.extract(),
      });
      return undefined;
    } catch (error) {
      this.logger.debug("Exception during Alpaca gas fee estimation", {
        error,
      });
      return undefined;
    }
  }

  private async getFeesFromRpc(tx: TransactionInfo): Promise<GasFeeEstimation> {
    const estimateGas = await this.estimateGas(tx);
    const baseFeePerGasResult = await this.getBaseFeePerGas(tx);
    const maxPriorityFeePerGasResult = await this.getMaxPriorityFeePerGas(tx);

    //TODO: Remove this for final release
    this.logger.debug("Estimated gas", { estimateGas });
    this.logger.debug("Estimated base fee per gas", { baseFeePerGasResult });
    this.logger.debug("Estimated base priority fee per gas", {
      maxPriorityFeePerGasResult,
    });

    // Add a 20% buffer to the estimated gas limit from estimate gas value => Use config for 20% making it dynamic
    const gasLimit = Number((estimateGas * 1.2).toFixed(0));

    //maxFeePerGas == baseFeePerGas * 2 + maxPriorityFeePerGas
    //https://www.blocknative.com/blog/eip-1559-fees#3
    //IE. Doubling the Base Fee when calculating the Max Fee ensures that your transaction will remain marketable for six consecutive 100% full blocks (+12.5% per block)
    const maxFeePerGas = baseFeePerGasResult * 2 + maxPriorityFeePerGasResult;

    return {
      gasLimit: `0x${gasLimit.toString(16)}`,
      maxFeePerGas: `0x${maxFeePerGas.toString(16)}`,
      maxPriorityFeePerGas: `0x${maxPriorityFeePerGasResult.toString(16)}`,
    };
  }

  async getMaxPriorityFeePerGas(tx: TransactionInfo): Promise<number> {
    const chainIdNumber = Number(tx.chainId);
    const basePriorityFeePerGasResult = await this.backendService.broadcast({
      blockchain: { name: "ethereum", chainId: chainIdNumber.toString() },
      rpc: {
        method: "eth_maxPriorityFeePerGas",
        params: [],
        id: 1,
        jsonrpc: "2.0",
      },
    });

    if (basePriorityFeePerGasResult.isLeft()) {
      //what to do here?
      return 20000; // Value from JSON RPC request on 2025-10-03
    }
    if (
      basePriorityFeePerGasResult.isRight() &&
      isJsonRpcResponseSuccess(basePriorityFeePerGasResult.extract())
    ) {
      const jsonRpcResponseSuccess =
        basePriorityFeePerGasResult.extract() as JsonRpcResponseSuccess;
      const estimateGasHex = jsonRpcResponseSuccess.result as string;
      return Number(estimateGasHex);
    }

    //SHOULD NEVER HAPPEN
    throw new Error("Failed to estimate base priority fee per gas");
  }

  async getBaseFeePerGas(tx: TransactionInfo): Promise<number> {
    const chainIdNumber = Number(tx.chainId);

    const baseFeePerGasResult = await this.backendService.broadcast({
      blockchain: { name: "ethereum", chainId: chainIdNumber.toString() },
      rpc: {
        method: "eth_getBlockByNumber",
        params: ["latest", false],
        id: 1,
        jsonrpc: "2.0",
      },
    });

    if (baseFeePerGasResult.isLeft()) {
      //TODO: what to do here?
      return 2000000;
    }
    if (
      baseFeePerGasResult.isRight() &&
      isJsonRpcResponseSuccess(baseFeePerGasResult.extract())
    ) {
      const jsonRpcResponseSuccess =
        baseFeePerGasResult.extract() as JsonRpcResponseSuccess;
      const rpcResult = jsonRpcResponseSuccess.result as {
        baseFeePerGas: string;
      };
      const baseFeePerGas = rpcResult.baseFeePerGas;

      return Number(baseFeePerGas);
    }

    //SHOULD NEVER HAPPEN
    throw new Error("Failed to estimate base fee per gas");
  }

  async estimateGas(tx: TransactionInfo): Promise<number> {
    const estimateRequest = {
      from: tx.from,
      to: tx.to,
      value: tx.value,
      input: tx.data,
    };

    this.logger.debug("Estimating gas: request sent", { estimateRequest });
    const chainIdNumber = Number(tx.chainId);
    const estimateGasResult = await this.backendService.broadcast({
      blockchain: { name: "ethereum", chainId: chainIdNumber.toString() },
      rpc: {
        method: "eth_estimateGas",
        params: [estimateRequest, "latest"],
        id: 1,
        jsonrpc: "2.0",
      },
    });

    if (estimateGasResult.isLeft()) {
      //what to do here?
      return 90000; // Default gas Limit value from JSON RPC website
    }
    if (
      estimateGasResult.isRight() &&
      isJsonRpcResponseSuccess(estimateGasResult.extract())
    ) {
      const jsonRpcResponseSuccess =
        estimateGasResult.extract() as JsonRpcResponseSuccess;
      const estimateGasHex = jsonRpcResponseSuccess.result as string;
      return Number(estimateGasHex);
    }
    throw new Error("Failed to estimate gas");
  }

  async getNonce(tx: TransactionInfo): Promise<string | undefined> {
    const chainIdNumber = Number(tx.chainId);
    const nonceResult = await this.backendService.broadcast({
      blockchain: { name: "ethereum", chainId: chainIdNumber.toString() },
      rpc: {
        method: "eth_getTransactionCount",
        params: [tx.from, "latest"],
        id: 1,
        jsonrpc: "2.0",
      },
    });

    return nonceResult.caseOf({
      Left: () => undefined,
      Right: (jsonRpcResponseSuccess: BroadcastResponse) => {
        if (
          isJsonRpcResponseSuccess(jsonRpcResponseSuccess) &&
          typeof jsonRpcResponseSuccess.result === "string"
        ) {
          return jsonRpcResponseSuccess.result;
        }
        return undefined;
      },
    });
  }
}
