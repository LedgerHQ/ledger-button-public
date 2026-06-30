import type { Maybe } from "purify-ts";

import type { CoreFacade } from "../../../api/blockchain-provider/model/CoreFacade.js";
import type { BlockchainFamily } from "../../../api/blockchain-provider/model/types.js";
import type { Account } from "../../../internal/account/service/AccountService.js";
import type { DAppConfigV2 } from "../../../internal/dAppConfig/v2/model/dAppConfigV2Types.js";

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
