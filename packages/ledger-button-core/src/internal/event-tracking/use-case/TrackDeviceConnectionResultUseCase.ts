import { type Factory, inject, injectable } from "inversify";

import type {
  DeviceConnectionErrorCategory,
  DeviceConnectionType,
} from "@internal/backend/model/trackEvent";
import { configModuleTypes } from "@internal/config/di/configModuleTypes";
import { type Config } from "@internal/config/model/config";
import { contextModuleTypes } from "@internal/context/di/contextModuleTypes";
import { type ContextService } from "@internal/context/service/ContextService";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes";
import { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import { eventTrackingModuleTypes } from "../di/eventTrackingModuleTypes";
import type { EventTrackingService } from "../service/EventTrackingService";
import { categorizeError } from "../utils/ErrorTrackingUtils";
import {
  type DeviceConnectionTracking,
  EventTrackingUtils,
} from "../utils/EventTrackingUtils";

export type DeviceConnectionOutcome =
  | { status: "succeeded"; connectionType: DeviceConnectionType }
  | { status: "failed"; connectionType: DeviceConnectionType; error: unknown };

/**
 * Tracks the outcome of a device connection attempt:
 * `device_connection_succeeded` or `device_connection_failed`.
 */
@injectable()
export class TrackDeviceConnectionResultUseCase {
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
    this.logger = loggerFactory("TrackDeviceConnectionResult UseCase");
  }

  async execute(outcome: DeviceConnectionOutcome): Promise<void> {
    const event = EventTrackingUtils.createDeviceConnectionEvent({
      dAppId: this.config.dAppIdentifier,
      sessionId: this.eventTrackingService.getSessionId(),
      trustChainId: this.contextService.getContext().trustChainId,
      ...this.toTracking(outcome),
    });

    this.logger.debug("Tracking device connection result event", { event });

    await this.eventTrackingService.trackEvent(event);
  }

  private toTracking(
    outcome: DeviceConnectionOutcome,
  ): DeviceConnectionTracking {
    if (outcome.status !== "failed") {
      return outcome;
    }

    const error =
      outcome.error instanceof Error
        ? outcome.error
        : new Error(String(outcome.error));

    return {
      status: "failed",
      connectionType: outcome.connectionType,
      errorType: error.name || "Error",
      errorCategory: toErrorCategory(error),
    };
  }
}

/** A connection failure is a device failure unless it comes from Ledger Sync. */
function toErrorCategory(error: Error): DeviceConnectionErrorCategory {
  return categorizeError(error) === "ledgersync" ? "ledgersync" : "device";
}
