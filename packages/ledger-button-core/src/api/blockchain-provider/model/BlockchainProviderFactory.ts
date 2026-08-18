import type { BlockchainConfig } from "../../model/dappConfig/BlockchainConfig";
import type { BlockchainProvider } from "./BlockchainProvider";
import type { CoreFacade } from "./CoreFacade";
import type { BlockchainFamily } from "./types";

/**
 * Creates a {@link BlockchainProvider} for one blockchain family from the
 * core facade and that family's dApp config slice.
 *
 * Owned by the family package (e.g. `@ledgerhq/ledger-wallet-provider-evm`);
 * core never imports family implementations.
 */
export type BlockchainProviderFactory = (
  core: CoreFacade,
  config: BlockchainConfig,
) => BlockchainProvider;

/**
 * Registration of a {@link BlockchainProviderFactory} against the family it
 * serves. Passed into {@link BlockchainProviderManager.init} by the host.
 */
export type BlockchainProviderFactoryRegistration = {
  family: BlockchainFamily;
  create: BlockchainProviderFactory;
};
