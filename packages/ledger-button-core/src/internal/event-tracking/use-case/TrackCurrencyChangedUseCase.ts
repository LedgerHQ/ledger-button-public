import { type Factory, inject, injectable } from "inversify";

import { configModuleTypes } from "@internal/config/di/configModuleTypes";
import { type Config } from "@internal/config/model/config";
import { contextModuleTypes } from "@internal/context/di/contextModuleTypes";
import { type ContextService } from "@internal/context/service/ContextService";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes";
import { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import { eventTrackingModuleTypes } from "../di/eventTrackingModuleTypes";
import type { EventTrackingService } from "../service/EventTrackingService";
import { EventTrackingUtils } from "../utils/EventTrackingUtils";

@injectable()
export class TrackCurrencyChangedUseCase {
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
    this.logger = loggerFactory("TrackCurrencyChanged UseCase");
  }

  async execute(currencyCode: string): Promise<void> {
    const sessionId = this.eventTrackingService.getSessionId();

    const event = EventTrackingUtils.createCurrencyChangedEvent({
      dAppId: this.config.dAppIdentifier,
      sessionId,
      trustChainId: this.contextService.getContext().trustChainId,
      currencyCode,
    });

    this.logger.debug("Tracking currency changed event", { event });

    await this.eventTrackingService.trackEvent(event);
  }
}
