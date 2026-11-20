import { type Factory, inject, injectable } from "inversify";

import { configModuleTypes } from "@internal/config/di/configModuleTypes";
import { type Config } from "@internal/config/model/config";
import { contextModuleTypes } from "@internal/context/di/contextModuleTypes";
import { type ContextService } from "@internal/context/service/ContextService";
import type { ConnectionType } from "@internal/device/service/DeviceManagementKitService";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes";
import { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import { eventTrackingModuleTypes } from "../di/eventTrackingModuleTypes";
import type { EventTrackingService } from "../service/EventTrackingService";
import {
  EventTrackingUtils,
  isTrackedConnectionType,
} from "../utils/EventTrackingUtils";

/**
 * Tracks `device_connection_selected`, before the connection attempt, so that
 * failed and abandoned connections are still counted. The mock transport is
 * not tracked.
 */
@injectable()
export class TrackDeviceConnectionSelectedUseCase {
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
    this.logger = loggerFactory("TrackDeviceConnectionSelected UseCase");
  }

  async execute(connectionType: ConnectionType): Promise<void> {
    if (!isTrackedConnectionType(connectionType)) {
      return;
    }

    const event = EventTrackingUtils.createDeviceConnectionEvent({
      dAppId: this.config.dAppIdentifier,
      sessionId: this.eventTrackingService.getSessionId(),
      trustChainId: this.contextService.getContext().trustChainId,
      status: "selected",
      connectionType,
    });

    this.logger.debug("Tracking device connection selected event", { event });

    await this.eventTrackingService.trackEvent(event);
  }
}
