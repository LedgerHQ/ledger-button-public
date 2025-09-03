import { inject, injectable } from "inversify";
import { Either, Left, Right } from "purify-ts";

import type { NetworkServiceOpts } from "../../network/DefaultNetworkService.js";
import { networkModuleTypes } from "../../network/networkModuleTypes.js";
import type { NetworkService } from "../../network/NetworkService.js";
import { type AlpacaServiceError,AlpacaServiceErrors } from "../model/error.js";
import type { EvmChainConfig, NativeBalance, TokenBalance } from "../model/types.js";
import type { EvmDataSource } from "./EvmDataSource.js";

interface JsonRpcRequest {
  jsonrpc: string;
  method: string;
  params: unknown[];
  id: number;
}

interface JsonRpcResponse<T = unknown> {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

@injectable()
export class DefaultEvmDataSource implements EvmDataSource {
  private requestId = 1;

  constructor(
    @inject(networkModuleTypes.NetworkService)
    private readonly networkService: NetworkService<NetworkServiceOpts>,
  ) {}

  private createJsonRpcRequest(
    method: string,
    params: unknown[],
  ): JsonRpcRequest {
    return {
      jsonrpc: "2.0",
      method,
      params,
      id: this.requestId++,
    };
  }

  private async makeRpcCall<T>(
    chainConfig: EvmChainConfig,
    method: string,
    params: unknown[],
  ): Promise<Either<AlpacaServiceError, T>> {
    const request = this.createJsonRpcRequest(method, params);

    const result = await this.networkService.post<JsonRpcResponse<T>>(
      chainConfig.rpcUrl,
      JSON.stringify(request),
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return result.mapLeft((error) =>
      AlpacaServiceErrors.networkError(
        `Network request failed: ${error.message}`,
        error,
      ),
    ).chain((jsonResponse) => {
      if (jsonResponse.error) {
        return Left(
          AlpacaServiceErrors.apiError(
            `RPC Error: ${jsonResponse.error.message}`,
            jsonResponse.error,
          ),
        );
      }

      if (jsonResponse.result === undefined) {
        return Left(
          AlpacaServiceErrors.apiError("RPC response missing result field"),
        );
      }

      return Right(jsonResponse.result);
    });
  }

  async getNativeBalance(
    address: string,
    chainConfig: EvmChainConfig,
  ): Promise<Either<AlpacaServiceError, NativeBalance>> {
    const balanceResult = await this.makeRpcCall<string>(
      chainConfig,
      "eth_getBalance",
      [address, "latest"],
    );

    return balanceResult.map((hexBalance) => {
      const balance = BigInt(hexBalance);
      const balanceFormatted = this.formatBalance(
        balance,
        chainConfig.nativeCurrency.decimals,
      );

      return {
        symbol: chainConfig.nativeCurrency.symbol,
        balance: balance.toString(),
        balanceFormatted,
      };
    });
  }

  async getTokenBalances(
    address: string,
    chainConfig: EvmChainConfig,
  ): Promise<Either<AlpacaServiceError, TokenBalance[]>> {
    return (await this.hasTransactionHistory(address, chainConfig))
      .map(_hasHistory => []);
  }

  async hasTransactionHistory(
    address: string,
    chainConfig: EvmChainConfig,
  ): Promise<Either<AlpacaServiceError, boolean>> {
    const nonceResult = await this.makeRpcCall<string>(
      chainConfig,
      "eth_getTransactionCount",
      [address, "latest"],
    );

    return nonceResult.map((hexNonce) => {
      const nonce = parseInt(hexNonce, 16);
      return nonce > 0;
    });
  }

  private formatBalance(balance: bigint, decimals: number): string {
    const divisor = BigInt(10 ** decimals);
    const wholePart = balance / divisor;
    const fractionalPart = balance % divisor;

    if (fractionalPart === BigInt(0)) {
      return wholePart.toString();
    }

    const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
    const trimmedFractional = fractionalStr.replace(/0+$/, "");

    if (trimmedFractional === "") {
      return wholePart.toString();
    }

    return `${wholePart}.${trimmedFractional}`;
  }
}
