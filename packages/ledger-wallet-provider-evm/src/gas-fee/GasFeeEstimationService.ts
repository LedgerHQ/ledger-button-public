import type {
  ProviderGasFeeEstimation,
  ProviderTransactionInfo,
} from "@ledgerhq/ledger-wallet-provider-core";

export interface GasFeeEstimationService {
  getFeesForTransaction(
    tx: ProviderTransactionInfo,
  ): Promise<ProviderGasFeeEstimation>;
  getNonceForTx(tx: ProviderTransactionInfo): Promise<string>;
}
