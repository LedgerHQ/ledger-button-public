import type { LedgerButtonCore } from "../../api/LedgerButtonCore.js";
import type { EvmProviderUI } from "../evm-provider/EvmProviderUI.js";
import type { SolanaProviderUI } from "../solana-provider/SolanaProviderUI.js";

/**
 * Shared context handed to every {@link ChainProviderRegistration} so it can
 * build its chain-specific provider from the same core + UI instances.
 */
export type ProviderRegistrationContext = {
  core: LedgerButtonCore;
  app: EvmProviderUI & SolanaProviderUI;
};

/**
 * Tears down a previously registered chain provider. Calling it must fully
 * remove the provider from discovery (listeners, registries, …) so no trace of
 * the wallet survives `initializeLedgerProvider`'s cleanup.
 */
export type UnregisterProvider = () => void;

/**
 * Chain-agnostic seam for announcing the Ledger wallet to dApps.
 *
 * Each blockchain family advertises itself through a different discovery
 * protocol (EVM via EIP-6963, Solana via the Wallet Standard, …). A
 * registration encapsulates one such protocol so `initializeLedgerProvider`
 * can register and unregister every chain through a single, uniform flow.
 *
 * Adding a new chain only requires implementing this interface and appending it
 * to the list in `./chainProviderRegistrations.ts` — the init flow never
 * changes.
 */
export type ChainProviderRegistration = {
  /** Identifier of the chain family this registration handles (for diagnostics). */
  readonly chain: string;
  /**
   * Announces the Ledger wallet for this chain so compatible dApps discover it.
   *
   * @returns a function that fully unregisters the provider.
   */
  register(context: ProviderRegistrationContext): UnregisterProvider;
};
