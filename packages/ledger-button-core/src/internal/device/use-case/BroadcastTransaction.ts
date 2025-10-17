import { Signature } from "ethers";
import { type Factory, inject, injectable } from "inversify";

import {
  BroadcastedTransactionResult,
  SignedResults,
  SignedTransactionResult,
} from "../../../api/model/signing/SignedTransaction.js";
import { getChainIdFromCurrencyId } from "../../../internal/blockchain/evm/chainUtils.js";
import { createSignedTransaction } from "../../../internal/transaction/utils/TransactionHelper.js";
import { backendModuleTypes } from "../../backend/backendModuleTypes.js";
import type { BackendService } from "../../backend/BackendService.js";
import {
  BroadcastRequest,
  BroadcastResponse,
  isJsonRpcResponse,
  isJsonRpcResponseSuccess,
} from "../../backend/types.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";

export type BroadcastTransactionParams = {
  signature: Signature;
  rawTransaction: string;
  currencyId: string;
};

@injectable()
export class BroadcastTransaction {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(backendModuleTypes.BackendService)
    private readonly backendService: BackendService,
  ) {
    this.logger = loggerFactory("[SendTransaction]");
  }

  async execute(params: BroadcastTransactionParams): Promise<SignedResults> {
    this.logger.debug("Transaction to be signed with signature", { params });

    const signedTransaction = createSignedTransaction(
      params.rawTransaction,
      params.signature,
    );

    this.logger.debug("Signed Transaction to broadcast", { signedTransaction });

    const broadcastJsonRpcRequest = this.craftRequestFromSignedTransaction(
      signedTransaction,
      params.currencyId,
    );

    const result = await this.backendService.broadcast(broadcastJsonRpcRequest);

    return result.caseOf({
      Right: (response: BroadcastResponse) => {
        //JSONRPCResponse from node
        if (isJsonRpcResponse(response)) {
          if (isJsonRpcResponseSuccess(response)) {
            return {
              hash: response.result as string,
              rawTransaction:
                params.rawTransaction as unknown as Uint8Array<ArrayBufferLike>,
              signedRawTransaction: signedTransaction.signedRawTransaction,
            };
          } else {
            this.logger.error("Failed to broadcast transaction", {
              error: response.error,
            });
            throw new Error("Failed to broadcast transaction"); //TODO CHECK Create specific broadcast error
          }
        }

        //Response from alpaca broadcast
        return {
          hash: response.transactionIdentifier,
          rawTransaction:
            params.rawTransaction as unknown as Uint8Array<ArrayBufferLike>,
          signedRawTransaction: signedTransaction.signedRawTransaction,
        };
      },
      Left: (error) => {
        this.logger.error("Failed to broadcast transaction", {
          error,
        });
        throw error;
      },
    });
  }

  private craftRequestFromSignedTransaction(
    signedTransaction: SignedTransactionResult | BroadcastedTransactionResult,
    currencyId: string,
  ): BroadcastRequest {
    this.logger.debug("Crafting `eth_sendRawTransaction` request", {
      currencyId,
      signedTransaction,
    });

    const chainId = getChainIdFromCurrencyId(currencyId);

    return {
      blockchain: { name: "ethereum", chainId: chainId.toString() },
      rpc: {
        method: "eth_sendRawTransaction",
        params: [signedTransaction.signedRawTransaction],
        id: 1,
        jsonrpc: "2.0",
      },
    };
  }
}
