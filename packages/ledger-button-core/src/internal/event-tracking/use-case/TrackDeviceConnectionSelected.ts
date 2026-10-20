import { type Factory, inject, injectable } from "inversify";

import type { DeviceConnectionType } from "@internal/backend/model/trackEvent";
import { configModuleTypes } from "@internal/config/di/configModuleTypes";
import { type Config } from "@internal/config/model/config";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes";
import { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import { eventTrackingModuleTypes } from "../di/eventTrackingModuleTypes";
import { EventTrackingUtils } from "../EventTrackingUtils";
import type { EventTrackingService } from "../service/EventTrackingService";

@injectable()
export class TrackDeviceConnectionSelected {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(eventTrackingModuleTypes.EventTrackingService)
    private readonly eventTrackingService: EventTrackingService,
    @inject(configModuleTypes.Config)
    private readonly config: Config,
  ) {
    this.logger = loggerFactory("TrackDeviceConnectionSelected UseCase");
  }

  async execute(connectionType: DeviceConnectionType): Promise<void> {
    const sessionId = this.eventTrackingService.getSessionId();

    const event = EventTrackingUtils.createDeviceConnectionSelectedEvent({
      dAppId: this.config.dAppIdentifier,
      sessionId,
      connectionType,
    });

    this.logger.debug("Tracking device connection selected event", { event });

    await this.eventTrackingService.trackEvent(event);
  }
}
