import { Either } from "purify-ts";

import { AlpacaServiceError } from "../model/error.js";
import { EvmChainConfig,NativeBalance, TokenBalance } from "../model/types.js";

export interface EvmDataSource {
  getNativeBalance(address: string, chainConfig: EvmChainConfig): Promise<Either<AlpacaServiceError, NativeBalance>>;
  getTokenBalances(address: string, chainConfig: EvmChainConfig): Promise<Either<AlpacaServiceError, TokenBalance[]>>;
  hasTransactionHistory(address: string, chainConfig: EvmChainConfig): Promise<Either<AlpacaServiceError, TokenBalance>>;
}
