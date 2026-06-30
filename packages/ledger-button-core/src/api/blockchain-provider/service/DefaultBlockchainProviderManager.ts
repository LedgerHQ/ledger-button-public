import { type Factory, inject, injectable } from "inversify";
import { Maybe } from "purify-ts";

import type { Account } from "../../../internal/account/service/AccountService.js";
import { contextModuleTypes } from "../../../internal/context/contextModuleTypes.js";
import type { ContextService } from "../../../internal/context/ContextService.js";
import type { DAppConfigV2 } from "../../../internal/dAppConfig/v2/model/dAppConfigV2Types.js";
import { EvmBlockchainProvider } from "../../../internal/evm-provider/EvmBlockchainProvider.js";
import { loggerModuleTypes } from "../../../internal/logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../../internal/logger/service/LoggerPublisher.js";
import { SolanaBlockchainProvider } from "../../../internal/solana-provider/SolanaBlockchainProvider.js";
import type { BlockchainConfig } from "../../model/dappConfig/BlockchainConfig.js";
import type { BlockchainProvider } from "../model/BlockchainProvider.js";
import type { CoreFacade } from "../model/CoreFacade.js";
import type { BlockchainFamily } from "../model/types.js";
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

  init(coreFacade: CoreFacade, dappConfig: DAppConfigV2): void {
    const providers: BlockchainProvider[] = [];

    const evmConfig = this.getBlockchainConfig(dappConfig, "evm");
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
      this.setSelectedAccount(context.selectedAccount);
      this.setNetwork(context.chainId);
    });
  }

  /** Per-family slice of the dApp config handed to a single provider module. */
  private getBlockchainConfig(
    dappConfig: DAppConfigV2,
    family: BlockchainFamily,
  ): BlockchainConfig | undefined {
    return dappConfig.blockchains?.find(
      (blockchain) => blockchain.blockchain === family,
    );
  }

  // @todo: this should be filtered by BlockchainFamily
  // We should forward account change only for the target blockchain
  setSelectedAccount(account: Account | undefined): void {
    for (const provider of this.providers.values()) {
      provider.setSelectedAccount(account);
    }
  }

  // @todo: this should be filtered by BlockchainFamily
  // chainId should support Solana format as well (string)
  setNetwork(chainId: number): void {
    for (const provider of this.providers.values()) {
      provider.setNetwork(chainId);
    }
  }

  resolveBlockchainFamily(currencyId: string): Maybe<BlockchainFamily> {
    for (const provider of this.providers.values()) {
      if (provider.isSupportedCurrency(currencyId)) {
        return Maybe.of(provider.family);
      }
    }
    return Maybe.empty();
  }
}
