import type { Maybe } from "purify-ts";

import type { CoreFacade } from "@api/blockchain-provider/model/CoreFacade.js";
import type { CurrencyNetworkRef } from "@api/blockchain-provider/model/CurrencyNetworkRef.js";
import type { BlockchainFamily } from "@api/blockchain-provider/model/types.js";
import type { Account } from "@api/model/Account.js";
import type { DAppConfig } from "@internal/dAppConfig/model/dAppConfigTypes.js";

export interface BlockchainProviderManager {
  init(coreFacade: CoreFacade, dappConfig: DAppConfig): void;
  /**
   * Push the selected account of each blockchain family to its provider. A
   * provider whose family is absent from the map receives `undefined` (cleared).
   */
  setSelectedAccounts(accounts: Map<BlockchainFamily, Account>): void;
  setNetwork(chainId: number): void;
  /**
   * Resolve the {@link BlockchainFamily} a `currencyId` belongs to by asking the
   * registered providers (each owns its own currency support). Returns
   * `Nothing` when no configured provider handles the currency.
   */
  resolveBlockchainFamily(currencyId: string): Maybe<BlockchainFamily>;
  /**
   * Resolve network identity for a Ledger `currencyId` via registered providers.
   */
  resolveNetwork(currencyId: string): Maybe<CurrencyNetworkRef>;
  /**
   * Inverse of {@link resolveNetwork}: map a network id back to a currencyId.
   */
  resolveCurrencyId(networkId: string): Maybe<string>;
  /**
   * Native decimals fallback owned by the provider that claims `currencyId`.
   */
  getNativeDecimals(currencyId: string): Maybe<number>;
}
