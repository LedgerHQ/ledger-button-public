import { type Factory, inject, injectable } from "inversify";

import { configModuleTypes } from "../../config/di/configModuleTypes.js";
import { type Config } from "../../config/model/config.js";
import { type ContextService } from "../../context/ContextService.js";
import { contextModuleTypes } from "../../context/di/contextModuleTypes.js";
import { loggerModuleTypes } from "../../logger/di/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { eventTrackingModuleTypes } from "../di/eventTrackingModuleTypes.js";
import { EventTrackingUtils } from "../EventTrackingUtils.js";
import type { EventTrackingService } from "../service/EventTrackingService.js";

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
