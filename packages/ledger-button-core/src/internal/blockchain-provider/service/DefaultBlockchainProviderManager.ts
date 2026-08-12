import { type Factory, inject, injectable } from "inversify";
import { Maybe } from "purify-ts";

import type { BlockchainProvider } from "@api/blockchain-provider/model/BlockchainProvider.js";
import type { CoreFacade } from "@api/blockchain-provider/model/CoreFacade.js";
import type { CurrencyDescriptor } from "@api/blockchain-provider/model/CurrencyDescriptor.js";
import type { BlockchainFamily } from "@api/blockchain-provider/model/types.js";
import type { Account } from "@api/model/Account.js";
import type { BlockchainConfig } from "@api/model/dappConfig/BlockchainConfig.js";
import type { ContextService } from "@internal/context/ContextService.js";
import { contextModuleTypes } from "@internal/context/di/contextModuleTypes.js";
import type { DAppConfig } from "@internal/dAppConfig/model/dAppConfigTypes.js";
import { EvmBlockchainProvider } from "@internal/evm-provider/EvmBlockchainProvider.js";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes.js";
import type { LoggerPublisher } from "@internal/logger/service/LoggerPublisher.js";
import { SolanaBlockchainProvider } from "@internal/solana-provider/SolanaBlockchainProvider.js";

import type { BlockchainProviderManager } from "./BlockchainProviderManager.js";

/**
 * Central registry that creates, wires, and manages blockchain providers.
 *
 * Call {@link init} with the core facade and dApp config to instantiate all
 * providers, inject them, and subscribe to context changes.
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

  init(coreFacade: CoreFacade, dappConfig: DAppConfig): void {
    const providers: BlockchainProvider[] = [];
    const evmConfig = this.getBlockchainConfig(dappConfig, "ethereum");
    if (evmConfig) {
      providers.push(new EvmBlockchainProvider(coreFacade, evmConfig));
    }

    const solanaConfig = this.getBlockchainConfig(dappConfig, "solana");
    if (solanaConfig) {
      providers.push(new SolanaBlockchainProvider(coreFacade, solanaConfig));
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
