/**
 * Thin UI contract consumed by the future Solana wallet provider.
 *
 * Defined in `ledger-button-core` so the provider can live alongside the rest
 * of the Solana stack without taking a hard dependency on the UI package.
 */
export type SolanaProviderUI = {
  readonly isModalOpen: boolean;
  navigationIntent(intent: string, params?: unknown): void;
};
