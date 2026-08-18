import { type Factory, inject, injectable } from "inversify";

import { configModuleTypes } from "@internal/config/di/configModuleTypes";
import { type Config } from "@internal/config/model/config";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes";
import { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import { eventTrackingModuleTypes } from "../di/eventTrackingModuleTypes";
import { EventTrackingUtils } from "../EventTrackingUtils";
import type { EventTrackingService } from "../service/EventTrackingService";

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
