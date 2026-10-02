import { type Factory, inject, injectable } from "inversify";

import type { BlockchainFamily } from "@api/blockchain-provider/model/types";
import { blockchainProviderModuleTypes } from "@internal/blockchain-provider/di/blockchainProviderModuleTypes";
import type { BlockchainProviderManager } from "@internal/blockchain-provider/service/BlockchainProviderManager";
import { configModuleTypes } from "@internal/config/di/configModuleTypes";
import { type Config } from "@internal/config/model/config";
import type { ContextService } from "@internal/context/ContextService";
import { contextModuleTypes } from "@internal/context/di/contextModuleTypes";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes";
import { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import { eventTrackingModuleTypes } from "../di/eventTrackingModuleTypes";
import { EventTrackingUtils } from "../EventTrackingUtils";
import { resolveTrackedChainId } from "../resolveTrackedChainId";
import type { EventTrackingService } from "../service/EventTrackingService";

@injectable()
export class TrackTransactionStarted {
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
    this.logger = loggerFactory("TrackTransactionStarted UseCase");
  }

  async execute(family: BlockchainFamily): Promise<void> {
    const sessionId = this.eventTrackingService.getSessionId();
    const context = this.contextService.getContext();

    const event = EventTrackingUtils.createTransactionFlowInitializationEvent({
      dAppId: this.config.dAppIdentifier,
      sessionId: sessionId,
      trustChainId: context.trustChainId,
      family: family,
      chainId: resolveTrackedChainId(
        context,
        family,
        this.blockchainProviderManager,
      ),
    });

    this.logger.debug("Tracking transaction flow initialization event", {
      event,
    });

    await this.eventTrackingService.trackEvent(event);
  }
}
