import type { Account } from "../../account/service/AccountService.js";
import type { DAppConfigV2 } from "../../dAppConfig/v2/model/dAppConfigV2Types.js";
import type { CoreFacade } from "../model/BlockchainProvider.js";

export interface BlockchainProviderManager {
  init(coreFacade: CoreFacade, dappConfig: DAppConfigV2): void;
  setSelectedAccount(account: Account | undefined): void;
  setNetwork(chainId: number): void;
}
