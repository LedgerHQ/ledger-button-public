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

    const networks = new Map(
      provider.dappConfig.networks.map((network) => [
        network.currencyId,
        network,
      ]),
    );
    for (const network of this.storedOverrides(family)) {
      networks.set(network.currencyId, network);
    }

    return [...networks.values()];
  }

  describeCurrency(currencyId: string): Maybe<CurrencyDescriptor> {
    return this.providersFind((p) => p.describeCurrency(currencyId)).altLazy(
      () => this.overridesFind((n) => n.currencyId === currencyId),
    );
  }

  describeNetwork(networkId: string): Maybe<CurrencyDescriptor> {
    return this.providersFind((p) => p.describeNetwork(networkId)).altLazy(() =>
      this.overridesFind((n) => n.id === networkId),
    );
  }

  private providersFind<T>(
    query: (provider: BlockchainProvider) => T | undefined,
  ): Maybe<T> {
    return this.iterate(this.providers.values(), query);
  }

  private overridesFind(
    matches: (network: BlockchainNetwork) => boolean,
  ): Maybe<CurrencyDescriptor> {
    // Native decimals are hardcoded here because overrides are never looked up on a Provider
    const nativeDecimals: Record<BlockchainFamily, number> = {
      ethereum: 18,
      solana: 9,
    };

    return this.iterate(this.providers.values(), (provider) => {
      const network = this.storedOverrides(provider.family).find(matches);
      if (!network) {
        return undefined;
      }

      return {
        currencyId: network.currencyId,
        family: provider.family,
        networkId: network.id,
        nativeDecimals: nativeDecimals[provider.family],
      };
    });
  }

  private storedOverrides(family: BlockchainFamily): BlockchainNetwork[] {
    return (
      this.storageService.getConfigOverrides().networkOverrides[family] ?? []
    );
  }

  private iterate<S, T>(
    source: Iterable<S>,
    query: (item: S) => T | undefined,
  ): Maybe<T> {
    for (const item of source) {
      const answer = query(item);
      if (answer !== undefined) {
        return Maybe.of(answer);
      }
    }
    return Maybe.empty();
  }
}
