import { type Factory, inject, injectable } from "inversify";
import { Maybe } from "purify-ts";

import type { BlockchainProvider } from "@api/blockchain-provider/model/BlockchainProvider";
import type { BlockchainProviderFactoryRegistration } from "@api/blockchain-provider/model/BlockchainProviderFactory";
import type { CoreFacade } from "@api/blockchain-provider/model/CoreFacade";
import type { CurrencyDescriptor } from "@api/blockchain-provider/model/CurrencyDescriptor";
import type { BlockchainFamily } from "@api/blockchain-provider/model/types";
import type { Account } from "@api/model/Account";
import type { BlockchainConfig } from "@api/model/dappConfig/BlockchainConfig";
import type { ContextService } from "@internal/context/ContextService";
import { contextModuleTypes } from "@internal/context/di/contextModuleTypes";
import type { DAppConfig } from "@internal/dAppConfig/model/dAppConfigTypes";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes";
import type { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import type { BlockchainProviderManager } from "./BlockchainProviderManager";

/**
 * Central registry that creates, wires, and manages blockchain providers.
 *
 * Call {@link init} with the core facade, dApp config, and host-supplied
 * factories to instantiate providers, inject them, and subscribe to context.
 */
@injectable()
export class DefaultBlockchainProviderManager
  implements BlockchainProviderManager
{
  private readonly logger: LoggerPublisher;
  private readonly providers = new Map<BlockchainFamily, BlockchainProvider>();

  constructor(
    @inject(contextModuleTypes.ContextService)
    private readonly contextService: ContextService,
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
  ) {
    this.logger = loggerFactory("BlockchainProviderManager");
  }

  init(
    coreFacade: CoreFacade,
    dappConfig: DAppConfig,
    factories: BlockchainProviderFactoryRegistration[],
  ): void {
    const providers: BlockchainProvider[] = [];

    for (const { family, create } of factories) {
      const config = this.getBlockchainConfig(dappConfig, family);
      if (!config) {
        this.logger.debug("Skipping provider: no dApp config for family", {
          family,
        });
        continue;
      }
      providers.push(create(coreFacade, config));
    }

    for (const provider of providers) {
      this.logger.debug("Registering provider", { family: provider.family });
      this.providers.set(provider.family, provider);
      provider.injectWalletProviders();
    }
    this.contextService.observeContext().subscribe((context) => {
      this.setSelectedAccounts(context.selectedAccounts);
      this.setNetwork(context.chainId);
    });
  }

  /** Per-family slice of the dApp config handed to a single provider module. */
  private getBlockchainConfig(
    dappConfig: DAppConfig,
    family: BlockchainFamily,
  ): BlockchainConfig | undefined {
    return dappConfig.blockchains?.find(
      (blockchain) => blockchain.blockchain === family,
    );
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

  describeCurrency(currencyId: string): Maybe<CurrencyDescriptor> {
    return this.firstProviderAnswer((provider) =>
      provider.describeCurrency(currencyId),
    );
  }

  describeNetwork(networkId: string): Maybe<CurrencyDescriptor> {
    return this.firstProviderAnswer((provider) =>
      provider.describeNetwork(networkId),
    );
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
}
