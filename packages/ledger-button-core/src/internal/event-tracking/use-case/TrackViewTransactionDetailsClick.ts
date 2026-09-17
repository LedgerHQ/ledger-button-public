import { type Factory, inject, injectable } from "inversify";

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
export class TrackViewTransactionDetailsClick {
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
  ) {
    this.logger = loggerFactory("TrackViewTransactionDetailsClick UseCase");
  }

  async execute(transactionHash: string): Promise<void> {
    const sessionId = this.eventTrackingService.getSessionId();
    const context = this.contextService.getContext();

    const event = EventTrackingUtils.createViewTransactionDetailsClickedEvent({
      dAppId: this.config.dAppIdentifier,
      sessionId,
      trustChainId: context.trustChainId,
      chainId: context.chainId.toString(),
      transactionHash,
    });

    this.logger.debug("Tracking view transaction details click event", {
      event,
    });

    await this.eventTrackingService.trackEvent(event);
  }
}
