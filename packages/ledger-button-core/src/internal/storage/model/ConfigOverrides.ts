import type { BlockchainNetwork } from "@api/model/dappConfig/BlockchainConfig";

/**
 * Developer-mode dApp config overrides persisted in local storage.
 *
 * Network overrides are EVM-only: Solana testnet/devnet accounts are not supported
 * by the Ledger stack, so there is no per-family map.
 */
export type ConfigOverrides = BlockchainNetwork[];

export const DEFAULT_CONFIG_OVERRIDES: ConfigOverrides = [];
