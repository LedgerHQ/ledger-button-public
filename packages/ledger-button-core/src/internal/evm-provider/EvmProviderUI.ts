/**
 * Thin UI contract consumed by `LedgerEIP1193Provider`.
 *
 * Defined in `ledger-button-core` so the provider can live alongside the rest
 * of the EVM stack without taking a hard dependency on the UI package.
 *
 * `LedgerButtonApp` (in `@ledgerhq/ledger-wallet-provider`) implements this
 * structurally; downstream consumers wiring their own UI may also implement it.
 */
export type EvmProviderUI = {
  readonly isModalOpen: boolean;
  navigationIntent(intent: string, params?: unknown): void;
};
