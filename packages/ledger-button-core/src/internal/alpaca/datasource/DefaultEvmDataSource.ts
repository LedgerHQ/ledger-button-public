import { injectable } from "inversify";
import { Either, Left, Right } from "purify-ts";

import { AlpacaServiceError } from "../model/error.js";
import { EvmChainConfig, NativeBalance, TokenBalance } from "../model/types.js";
import { EvmDataSource } from "./EvmDataSource.js";

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
    try {
      const request = this.createJsonRpcRequest(method, params);

      const response = await fetch(chainConfig.rpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        return Left(
          AlpacaServiceError.networkError(
            `HTTP ${response.status}: ${response.statusText}`,
          ),
        );
      }

      const jsonResponse: JsonRpcResponse = await response.json();

      if (jsonResponse.error) {
        return Left(
          AlpacaServiceError.apiError(
            `RPC Error: ${jsonResponse.error.message}`,
            jsonResponse.error,
          ),
        );
      }

      if (!jsonResponse.result) {
        return Left(
          AlpacaServiceError.apiError("RPC response missing result field"),
        );
      }

      return Right(jsonResponse.result as T);
    } catch (error) {
      return Left(
        AlpacaServiceError.networkError(
          `Failed to make RPC call: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          error,
        ),
      );
    }
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
    try {
      const hasHistory = await this.hasTransactionHistory(address, chainConfig);

      if (hasHistory.isLeft()) {
        return Left(hasHistory.extract());
      }

      if (!hasHistory.extract()) {
        return Right([]);
      }

      return Right([]);
    } catch (error) {
      return Left(
        AlpacaServiceError.tokenFetchError(address, chainConfig.name, error),
      );
    }
  }

  async hasTransactionHistory(
    address: string,
    chainConfig: EvmChainConfig,
  ): Promise<Either<AlpacaServiceError, boolean>> {
    try {
      const nonceResult = await this.makeRpcCall<string>(
        chainConfig,
        "eth_getTransactionCount",
        [address, "latest"],
      );

      return nonceResult.map((hexNonce) => {
        const nonce = parseInt(hexNonce, 16);
        return nonce > 0;
      });
    } catch (error) {
      return Left(
        AlpacaServiceError.networkError(
          `Failed to check transaction history: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          error,
        ),
      );
    }
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
