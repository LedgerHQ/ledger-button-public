import {
  ALL_WALLET_FEATURES,
  DEFAULT_CONFIG,
  DEFAULT_TRIAL_API_KEY,
  type LedgerContextValue,
  type LedgerProviderConfig,
  setTrialModeAndReload,
  type TransactionConfirmationNotification,
  useLedgerContext,
  type WalletTransactionFeature,
} from "../components/LedgerProvider";

export {
  ALL_WALLET_FEATURES,
  DEFAULT_CONFIG,
  DEFAULT_TRIAL_API_KEY,
  type LedgerContextValue,
  type LedgerProviderConfig,
  setTrialModeAndReload,
  type TransactionConfirmationNotification,
  type WalletTransactionFeature,
};

/**
 * Reads the Ledger provider state from the app-level {@link LedgerProvider}
 * context. The Ledger Button is instantiated once at the root layout, so this
 * hook only exposes the shared state and does not initialize anything itself.
 */
export const useProviders = (): LedgerContextValue => useLedgerContext();
