import { type Factory, inject, injectable } from "inversify";

import { configModuleTypes } from "../../config/di/configModuleTypes.js";
import { type Config } from "../../config/model/config.js";
import { loggerModuleTypes } from "../../logger/di/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { eventTrackingModuleTypes } from "../di/eventTrackingModuleTypes.js";
import { EventTrackingUtils } from "../EventTrackingUtils.js";
import type { EventTrackingService } from "../service/EventTrackingService.js";

@injectable()
export class TrackLanguageChanged {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(eventTrackingModuleTypes.EventTrackingService)
    private readonly eventTrackingService: EventTrackingService,
    @inject(configModuleTypes.Config)
    private readonly config: Config,
  ) {
    this.logger = loggerFactory("TrackLanguageChanged UseCase");
  }

  async execute(languageKey: string): Promise<void> {
    const sessionId = this.eventTrackingService.getSessionId();

    const event = EventTrackingUtils.createLanguageChangedEvent({
      dAppId: this.config.dAppIdentifier,
      sessionId,
      languageKey,
    });

    this.logger.debug("Tracking language changed event", { event });

    await this.eventTrackingService.trackEvent(event);
  }
}
