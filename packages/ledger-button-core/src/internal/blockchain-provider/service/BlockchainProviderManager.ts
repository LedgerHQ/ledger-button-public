import type { Maybe } from "purify-ts";

import type { Account } from "../../account/service/AccountService.js";
import type { DAppConfigV2 } from "../../dAppConfig/v2/model/dAppConfigV2Types.js";
import type { CoreFacade } from "../model/CoreFacade.js";
import type { BlockchainFamily } from "../model/types.js";

export interface BlockchainProviderManager {
  init(coreFacade: CoreFacade, dappConfig: DAppConfigV2): void;
  setSelectedAccount(account: Account | undefined): void;
  setNetwork(chainId: number): void;
  /**
   * Resolve the {@link BlockchainFamily} a `currencyId` belongs to by asking the
   * registered providers (each owns its own currency support). Returns
   * `Nothing` when no configured provider handles the currency.
   */
  resolveBlockchainFamily(currencyId: string): Maybe<BlockchainFamily>;
}
