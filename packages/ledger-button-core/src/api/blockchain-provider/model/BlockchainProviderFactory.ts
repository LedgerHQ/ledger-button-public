import type { BlockchainConfig } from "../../model/dappConfig/BlockchainConfig";
import type { BlockchainProvider } from "./BlockchainProvider";
import type { CoreFacade } from "./CoreFacade";
import type { BlockchainFamily } from "./types";

/**
 * A function that creates a {@link BlockchainProvider} for one blockchain
 * family. It receives the full list of dApp blockchain configs and is
 * responsible for extracting its own slice (e.g. via {@link findBlockchainConfig}).
 * Return `undefined` if the family has no matching config — the manager will
 * skip it silently.
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
