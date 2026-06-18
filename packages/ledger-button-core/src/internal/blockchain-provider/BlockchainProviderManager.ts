import { type Factory, inject, injectable } from "inversify";
import { Maybe } from "purify-ts";

import {
  BlockchainFamily,
  BlockchainProvider,
  BlockchainProviderFactory,
  ProviderDAppConfigFactory,
  WalletProviderCore,
} from "./model/BlockchainProvider.js";
import { resolveBlockchainFamily } from "./utils/resolveBlockchainFamily.js";
import type { Account } from "../account/service/AccountService.js";
import { loggerModuleTypes } from "../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../logger/service/LoggerPublisher.js";

/**
 * Central registry that routes to the right wallet provider based on the
 * blockchain family (`evm` / `solana`).
 *
 * Providers are resolved from the DI container and registered here; core uses
 * the manager to push context (selected account / network) to every provider
 * so they can emit their native events.
 */
@injectable()
export class BlockchainProviderManager {
  private readonly logger: LoggerPublisher;
  private readonly providers = new Map<BlockchainFamily, BlockchainProvider>();

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
  ) {
    this.logger = loggerFactory("BlockchainProviderManager");
  }

  addBlockchainProvider(
    factory: BlockchainProviderFactory,
    config: ProviderDAppConfigFactory,
    host: WalletProviderCore,
  ): () => void {
    const provider = factory(host, config);
    const walletProvider = provider.getWalletProvider();
    const teardown = walletProvider.init();
    this.registerProvider(provider);
    return teardown;
  }

  registerProvider(provider: BlockchainProvider): void {
    this.logger.debug("Registering provider", { family: provider.family });
    this.providers.set(provider.family, provider);
  }

  getProvider(family: BlockchainFamily): Maybe<BlockchainProvider> {
    return Maybe.fromNullable(this.providers.get(family));
  }

  getProviderForCurrency(currencyId: string): Maybe<BlockchainProvider> {
    return resolveBlockchainFamily(currencyId).chain((family) =>
      this.getProvider(family),
    );
  }

  getProviders(): BlockchainProvider[] {
    return Array.from(this.providers.values());
  }

  setSelectedAccount(account: Account | undefined): void {
    for (const provider of this.providers.values()) {
      provider.setSelectedAccount(account);
    }
  }

  setNetwork(chainId: number): void {
    for (const provider of this.providers.values()) {
      provider.setNetwork(chainId);
    }
  }
}
