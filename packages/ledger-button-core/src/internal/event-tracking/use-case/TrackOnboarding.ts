import { type Factory, inject, injectable } from "inversify";

import type { Account } from "@api/model/Account";
import { blockchainProviderModuleTypes } from "@internal/blockchain-provider/di/blockchainProviderModuleTypes";
import type { BlockchainProviderManager } from "@internal/blockchain-provider/service/BlockchainProviderManager";
import { configModuleTypes } from "@internal/config/di/configModuleTypes";
import { type Config } from "@internal/config/model/config";
import { type ContextService } from "@internal/context/ContextService";
import { contextModuleTypes } from "@internal/context/di/contextModuleTypes";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes";
import { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import { eventTrackingModuleTypes } from "../di/eventTrackingModuleTypes";
import { EventTrackingUtils } from "../EventTrackingUtils";
import type { EventTrackingService } from "../service/EventTrackingService";

@injectable()
export class TrackOnboarding {
  private readonly logger: LoggerPublisher;
  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(eventTrackingModuleTypes.EventTrackingService)
    private readonly eventTrackingService: EventTrackingService,
    @inject(configModuleTypes.Config)
    private readonly config: Config,
    @inject(contextModuleTypes.ContextService)
    private readonly contextService: ContextService,
    @inject(blockchainProviderModuleTypes.BlockchainProviderManager)
    private readonly blockchainProviderManager: BlockchainProviderManager,
  ) {
    this.logger = loggerFactory("TrackOnboarding UseCase");
  }

  async execute(selectedAccount: Account): Promise<void> {
    const sessionId = this.eventTrackingService.getSessionId();
    const trustChainId = this.contextService.getContext().trustChainId;

    const { currencyId } = selectedAccount;
    const chainId = this.blockchainProviderManager
      .describeCurrency(currencyId)
      .map((currency) => currency.networkId)
      .extractNullable();

    if (chainId === null) {
      this.logger.warn("No currency descriptor for onboarding chain_id", {
        currencyId,
      });
    }

    const event = EventTrackingUtils.createOnboardingEvent({
      dAppId: this.config.dAppIdentifier,
      sessionId: sessionId,
      trustChainId: trustChainId,
      chainId: chainId,
    });

    this.logger.debug("Tracking ledger sync activated event", { event });

    await this.eventTrackingService.trackEvent(event);
  }
}
