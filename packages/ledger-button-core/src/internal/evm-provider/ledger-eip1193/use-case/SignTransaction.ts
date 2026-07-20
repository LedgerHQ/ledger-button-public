import { inject, injectable } from "inversify";
import { from, Observable, switchMap } from "rxjs";

import type { CoreFacade } from "../../../../api/blockchain-provider/model/CoreFacade.js";
import type { ProviderAccount } from "../../../../api/model/blockchain/ProviderAccount.js";
import type { ProviderLogger } from "../../../../api/model/blockchain/ProviderLogger.js";
import { SignFlowStatus } from "../../../../api/model/signing/SignFlowStatus.js";
import {
  SignTransactionParams,
  Transaction,
} from "../../../../api/model/signing/SignTransactionParams.js";
import { waitForDeviceSession } from "../../../blockchain-provider/utils/waitForDeviceSession.js";
import { evmProviderModuleTypes } from "../../evmProviderModuleTypes.js";
import { type GasFeeEstimationService } from "../gas-fee/GasFeeEstimationService.js";
import { getRawTransactionFromEipTransaction } from "../transaction/TransactionHelper.js";
import { SignRawTransaction } from "./SignRawTransaction.js";

@injectable()
export class SignTransaction {
  private readonly logger: ProviderLogger;

  constructor(
    @inject(evmProviderModuleTypes.CoreFacade)
    private readonly core: CoreFacade,
    @inject(evmProviderModuleTypes.GasFeeEstimationService)
    private readonly gasFeeEstimationService: GasFeeEstimationService,
    @inject(evmProviderModuleTypes.SignRawTransactionUseCase)
    private readonly signRawTransaction: SignRawTransaction,
  ) {
    this.logger = this.core.getLogger("SignTransaction");
  }

  execute(
    params: SignTransactionParams,
    selectedAccount: ProviderAccount | undefined,
    chainId: number,
  ): Observable<SignFlowStatus> {
    this.logger.info("Starting transaction signing", { params });
    const { transaction, broadcast, method } = params;

    return waitForDeviceSession(this.core).pipe(
      switchMap(() =>
        from(this.completeTransaction(transaction, selectedAccount, chainId)),
      ),
      switchMap((transactionWithFees) => {
        const rawTransaction =
          getRawTransactionFromEipTransaction(transactionWithFees);

        this.logger.debug("Raw transaction", { rawTransaction });

        return this.signRawTransaction.execute(
          {
            transaction: rawTransaction,
            broadcast: broadcast,
            method: method,
          },
          selectedAccount,
        );
      }),
    );
  }

  private async addFeesToTransaction(
    transaction: Transaction,
    selectedAccount: ProviderAccount | undefined,
  ): Promise<Transaction> {
    try {
      const fees = await this.gasFeeEstimationService.getFeesForTransaction({
        from: transaction.from || selectedAccount?.freshAddress || "", //Should never happen
        to: transaction.to,
        value: transaction.value,
        data: transaction.data,
        chainId: transaction.chainId.toString(),
      });

      const transactionWithFees = {
        ...transaction,
        gas: fees.gasLimit,
        maxFeePerGas: fees.maxFeePerGas,
        maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
      };

      this.logger.debug("Transaction with fees", { transactionWithFees });

      return transactionWithFees;
    } catch (error) {
      this.logger.error("Failed to add fees to transaction", { error });
      throw error;
    }
  }

  private async addNonceToTransaction(
    transaction: Transaction,
    selectedAccount: ProviderAccount | undefined,
  ): Promise<Transaction> {
    try {
      const nonce = await this.gasFeeEstimationService.getNonceForTx({
        from: transaction.from || selectedAccount?.freshAddress || "", //Should never happen
        to: transaction.to,
        value: transaction.value,
        data: transaction.data,
        chainId: transaction.chainId.toString(),
      });

      const transactionWithNonce = {
        ...transaction,
        nonce: nonce,
      };

      this.logger.debug("Transaction with nonce", { transactionWithNonce });

      return transactionWithNonce;
    } catch (error) {
      this.logger.error("Failed to add nonce to transaction", { error });
      throw error;
    }
  }

  private async completeTransaction(
    transaction: Transaction,
    selectedAccount: ProviderAccount | undefined,
    chainId: number,
  ): Promise<Transaction> {
    let completedTransaction: Transaction = transaction;

    if (!completedTransaction.chainId) {
      this.logger.debug("Chain ID is not set");
      completedTransaction = {
        ...completedTransaction,
        chainId,
      };
    }

    if (
      !completedTransaction.gas ||
      !completedTransaction.maxFeePerGas ||
      !completedTransaction.maxPriorityFeePerGas
    ) {
      this.logger.debug(
        "Gas or max fee per gas or max priority fee per gas is not set",
      );
      completedTransaction = await this.addFeesToTransaction(
        completedTransaction,
        selectedAccount,
      );
    }

    if (!completedTransaction.nonce) {
      this.logger.debug("Nonce is not set");
      completedTransaction = await this.addNonceToTransaction(
        completedTransaction,
        selectedAccount,
      );
    }

    this.logger.debug("Transaction completed", { completedTransaction });
    return completedTransaction;
  }
}
