import { type Factory, inject, injectable } from "inversify";

import type {
  BlockchainFamily,
  BlockchainProvider,
  CoreFacade,
} from "./model/BlockchainProvider.js";
import type { Account } from "../account/service/AccountService.js";
import { contextModuleTypes } from "../context/contextModuleTypes.js";
import type { ContextService } from "../context/ContextService.js";
import type { DAppConfigV2 } from "../dAppConfig/v2/model/dAppConfigV2Types.js";
import { EvmBlockchainProvider } from "../evm-provider/EvmBlockchainProvider.js";
import { loggerModuleTypes } from "../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../logger/service/LoggerPublisher.js";
import { SolanaBlockchainProvider } from "../solana-provider/SolanaBlockchainProvider.js";

/**
 * Central registry that creates, wires, and manages blockchain providers.
 *
 * Usage: `manager.init().injectProviders(coreFacade, dappConfig)`
 *
 * - {@link init} instantiates and registers providers, then returns `this`.
 * - {@link injectProviders} wires each provider with the core facade and dApp
 *   config, then subscribes to context so providers stay in sync with the
 *   selected account and chain.
 */
@injectable()
export class BlockchainProviderManager {
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

  /** Instantiates and registers all providers. Returns `this` for chaining. */
  init(): BlockchainProviderManager {
    const providers: BlockchainProvider[] = [
      new EvmBlockchainProvider(),
      new SolanaBlockchainProvider(),
    ];
    for (const provider of providers) {
      this.logger.debug("Registering provider", { family: provider.family });
      this.providers.set(provider.family, provider);
    }
    return this;
  }

  /**
   * Wires every registered provider with the core facade and dApp config,
   * then subscribes to context changes so providers receive account / chain
   * updates automatically.
   *
   * Must be called after {@link init}.
   */
  injectProviders(core: CoreFacade, dappConfig: DAppConfigV2): void {
    for (const provider of this.providers.values()) {
      provider.injectWalletProviders(core, dappConfig);
    }
    this.subscribeToContext();
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

  private subscribeToContext(): void {
    this.contextService.observeContext().subscribe((context) => {
      this.pushContextToProviders(context.selectedAccount, context.chainId);
    });
    const ctx = this.contextService.getContext();
    this.pushContextToProviders(ctx.selectedAccount, ctx.chainId);
  }

  private pushContextToProviders(
    account: Account | undefined,
    chainId: number,
  ): void {
    this.setSelectedAccount(account);
    this.setNetwork(chainId);
  }
}
