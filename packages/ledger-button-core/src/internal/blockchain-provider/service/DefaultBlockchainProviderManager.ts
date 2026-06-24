import { type Factory, inject, injectable } from "inversify";

import type { Account } from "../../account/service/AccountService.js";
import { contextModuleTypes } from "../../context/contextModuleTypes.js";
import type { ContextService } from "../../context/ContextService.js";
import type { DAppConfigV2 } from "../../dAppConfig/v2/model/dAppConfigV2Types.js";
import { EvmBlockchainProvider } from "../../evm-provider/EvmBlockchainProvider.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { SolanaBlockchainProvider } from "../../solana-provider/SolanaBlockchainProvider.js";
import type { BlockchainProvider } from "../model/BlockchainProvider.js";
import type {
  BlockchainFamily,
  CoreFacade,
} from "../model/BlockchainProvider.js";
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
    const providers: BlockchainProvider[] = [
      new EvmBlockchainProvider(),
      new SolanaBlockchainProvider(),
    ];
    for (const provider of providers) {
      this.logger.debug("Registering provider", { family: provider.family });
      this.providers.set(provider.family, provider);
      provider.injectWalletProviders(coreFacade, dappConfig);
    }
    this.contextService.observeContext().subscribe((context) => {
      this.setSelectedAccount(context.selectedAccount);
      this.setNetwork(context.chainId);
    });
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
}
