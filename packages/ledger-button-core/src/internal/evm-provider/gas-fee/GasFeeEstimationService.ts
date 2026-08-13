import type {
  ProviderGasFeeEstimation,
  ProviderTransactionInfo,
} from "@api/model/blockchain/GasFee.js";

export interface GasFeeEstimationService {
  getFeesForTransaction(
    tx: ProviderTransactionInfo,
  ): Promise<ProviderGasFeeEstimation>;
  getNonceForTx(tx: ProviderTransactionInfo): Promise<string>;
}
