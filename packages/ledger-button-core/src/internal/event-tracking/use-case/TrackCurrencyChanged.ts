import { type Factory, inject, injectable } from "inversify";

import { configModuleTypes } from "../../config/di/configModuleTypes.js";
import { type Config } from "../../config/model/config.js";
import { loggerModuleTypes } from "../../logger/di/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { eventTrackingModuleTypes } from "../di/eventTrackingModuleTypes.js";
import { EventTrackingUtils } from "../EventTrackingUtils.js";
import type { EventTrackingService } from "../service/EventTrackingService.js";

@injectable()
export class TrackCurrencyChanged {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(eventTrackingModuleTypes.EventTrackingService)
    private readonly eventTrackingService: EventTrackingService,
    @inject(configModuleTypes.Config)
    private readonly config: Config,
  ) {
    this.logger = loggerFactory("TrackCurrencyChanged UseCase");
  }

  async execute(currencyCode: string): Promise<void> {
    const sessionId = this.eventTrackingService.getSessionId();

    const event = EventTrackingUtils.createCurrencyChangedEvent({
      dAppId: this.config.dAppIdentifier,
      sessionId,
      currencyCode,
    });

    this.logger.debug("Tracking currency changed event", { event });

    await this.eventTrackingService.trackEvent(event);
  }
}
