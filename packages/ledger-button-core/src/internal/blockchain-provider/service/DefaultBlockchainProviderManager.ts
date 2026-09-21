import { type Factory, inject, injectable } from "inversify";
import { Maybe } from "purify-ts";

import type { BlockchainProvider } from "@api/blockchain-provider/model/BlockchainProvider";
import type { BlockchainProviderFactory } from "@api/blockchain-provider/model/BlockchainProviderFactory";
import type { CoreFacade } from "@api/blockchain-provider/model/CoreFacade";
import type { CurrencyDescriptor } from "@api/blockchain-provider/model/CurrencyDescriptor";
import type { BlockchainFamily } from "@api/blockchain-provider/model/types";
import type { Account } from "@api/model/Account";
import type {
  BlockchainConfig,
  BlockchainNetwork,
} from "@api/model/dappConfig/BlockchainConfig";
import type { ContextService } from "@internal/context/ContextService";
import { contextModuleTypes } from "@internal/context/di/contextModuleTypes";
import type { DAppConfig } from "@internal/dAppConfig/model/dAppConfigTypes";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes";
import type { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";
import { storageModuleTypes } from "@internal/storage/di/storageModuleTypes";
import type { StorageService } from "@internal/storage/StorageService";

import type { BlockchainProviderManager } from "./BlockchainProviderManager";

const EVM_FAMILY: BlockchainFamily = "ethereum";
const EVM_NATIVE_DECIMALS = 18;

/**
 * Central registry that creates, wires, and manages blockchain providers.
 *
 * Call {@link init} with the core facade, dApp config, and host-supplied
 * factories to instantiate providers, inject them, and subscribe to context.
 */
@injectable()
export class DefaultBlockchainProviderManager implements BlockchainProviderManager {
  private readonly logger: LoggerPublisher;
  private readonly providers = new Map<BlockchainFamily, BlockchainProvider>();

  constructor(
    @inject(contextModuleTypes.ContextService)
    private readonly contextService: ContextService,
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(storageModuleTypes.StorageService)
    private readonly storageService: StorageService,
  ) {
    this.logger = loggerFactory("BlockchainProviderManager");
  }

  init(
    coreFacade: CoreFacade,
    dappConfig: DAppConfig,
    factories: BlockchainProviderFactory[],
  ): void {
    const blockchainsConfig: BlockchainConfig[] = dappConfig.blockchains ?? [];

    for (const factory of factories) {
      factory(coreFacade, blockchainsConfig).caseOf({
        Left: (family) =>
          this.logger.debug("Skipping provider: no dApp config for family", {
            family,
          }),
        Right: (provider) => {
          this.logger.debug("Registering provider", {
            family: provider.family,
          });
          this.providers.set(provider.family, provider);
          provider.injectWalletProviders();
        },
      });
    }
    this.contextService.observeContext().subscribe((context) => {
      this.setSelectedAccounts(context.selectedAccounts);
      this.setNetwork(context.chainId);
    });
  }

  setSelectedAccounts(accounts: Map<BlockchainFamily, Account>): void {
    for (const provider of this.providers.values()) {
      provider.setSelectedAccount(accounts.get(provider.family));
    }
  }

  // @todo: this should be filtered by BlockchainFamily
  // chainId should support Solana format as well (string)
  setNetwork(chainId: number): void {
    for (const provider of this.providers.values()) {
      provider.setNetwork(chainId);
    }
  }

  getNetworks(family: BlockchainFamily): BlockchainNetwork[] {
    const provider = this.providers.get(family);
    if (!provider) {
      return [];
    }

    return provider.dappConfig.networks;
  }

  describeCurrency(currencyId: string): Maybe<CurrencyDescriptor> {
    return this.firstProviderAnswer((provider) =>
      provider.describeCurrency(currencyId),
    ).altLazy(() => this.overridesFind((n) => n.currencyId === currencyId));
  }

  describeNetwork(networkId: string): Maybe<CurrencyDescriptor> {
    return this.firstProviderAnswer((provider) =>
      provider.describeNetwork(networkId),
    ).altLazy(() => this.overridesFind((n) => n.id === networkId));
  }

  private firstProviderAnswer<T>(
    ask: (provider: BlockchainProvider) => T | undefined,
  ): Maybe<T> {
    for (const provider of this.providers.values()) {
      const answer = ask(provider);
      if (answer !== undefined) {
        return Maybe.of(answer);
      }
    }
    return Maybe.empty();
  }

  // Developer-mode, EVM-only
  private overridesFind(
    matches: (network: BlockchainNetwork) => boolean,
  ): Maybe<CurrencyDescriptor> {
    const network = this.storageService
      .getConfigOverrides()
      .find(matches);
    if (!network) {
      return Maybe.empty();
    }

    return Maybe.of({
      currencyId: network.currencyId,
      family: EVM_FAMILY,
      networkId: network.id,
      nativeDecimals: EVM_NATIVE_DECIMALS,
    });
  }
}
