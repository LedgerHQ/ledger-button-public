import { evmProviderRegistration } from "../evm-provider/evmProviderRegistration.js";
import { solanaProviderRegistration } from "../solana-provider/solanaProviderRegistration.js";
import type { ChainProviderRegistration } from "./ChainProviderRegistration.js";

/**
 * Every chain provider the Ledger wallet announces to dApps.
 *
 * `initializeLedgerProvider` registers and tears down each entry uniformly, so
 * supporting a new chain is just a matter of adding its
 * {@link ChainProviderRegistration} here.
 */
export const chainProviderRegistrations: readonly ChainProviderRegistration[] =
  [evmProviderRegistration, solanaProviderRegistration];
