import type { Maybe } from "purify-ts";

import type { BlockchainProviderFactoryRegistration } from "@api/blockchain-provider/model/BlockchainProviderFactory";
import type { CoreFacade } from "@api/blockchain-provider/model/CoreFacade";
import type { CurrencyDescriptor } from "@api/blockchain-provider/model/CurrencyDescriptor";
import type { BlockchainFamily } from "@api/blockchain-provider/model/types";
import type { Account } from "@api/model/Account";
import type { DAppConfig } from "@internal/dAppConfig/model/dAppConfigTypes";

export interface BlockchainProviderManager {
  init(
    coreFacade: CoreFacade,
    dappConfig: DAppConfig,
    factories: BlockchainProviderFactoryRegistration[],
  ): void;
  /**
   * Push the selected account of each blockchain family to its provider. A
   * provider whose family is absent from the map receives `undefined` (cleared).
   */
  setSelectedAccounts(accounts: Map<BlockchainFamily, Account>): void;
  setNetwork(chainId: number): void;
  /**
   * Describe a Ledger `currencyId` by asking the registered providers, the
   * first one claiming it answering (each owns its own currency support).
   * Returns `Nothing` when no configured provider handles the currency.
   */
  describeCurrency(currencyId: string): Maybe<CurrencyDescriptor>;
  /**
   * Inverse of {@link describeCurrency}: describe the currency a network id
   * belongs to.
   */
  describeNetwork(networkId: string): Maybe<CurrencyDescriptor>;
}
