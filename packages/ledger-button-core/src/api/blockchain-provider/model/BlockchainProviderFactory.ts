import type { BlockchainConfig } from "../../model/dappConfig/BlockchainConfig";
import type { BlockchainProvider } from "./BlockchainProvider";
import type { CoreFacade } from "./CoreFacade";
import type { BlockchainFamily } from "./types";

/**
 * A callable that creates a {@link BlockchainProvider} for one blockchain
 * family from the core facade and the full list of blockchain configs.
 *
 * Owned by the family package (e.g. `@ledgerhq/ledger-wallet-provider-evm`);
 * core never imports family implementations.
 *
 * The factory receives all {@link BlockchainConfig} entries and is responsible
 * for finding the one that matches its own family (via {@link findBlockchainConfig}).
 * It returns `undefined` when its family has no config entry, signalling to
 * {@link BlockchainProviderManager} that it should be skipped.
 *
 * @example
 * ```ts
 * initializeLedgerProvider({
 *   blockchainProviderFactories: [evmBlockchainProviderFactory],
 * });
 * ```
 */
export type BlockchainProviderFactory<
  F extends BlockchainFamily = BlockchainFamily,
> = (
  core: CoreFacade,
  blockchains: BlockchainConfig[],
) => BlockchainProvider<F> | undefined;
