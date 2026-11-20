import { type Factory, inject, injectable } from "inversify";

import { DeviceConnectionError } from "@api/errors/DeviceFlowErrors";
import type {
  DeviceConnectionErrorCategory,
  DeviceConnectionType,
} from "@internal/backend/model/trackEvent";
import { configModuleTypes } from "@internal/config/di/configModuleTypes";
import { type Config } from "@internal/config/model/config";
import { contextModuleTypes } from "@internal/context/di/contextModuleTypes";
import { type ContextService } from "@internal/context/service/ContextService";
import type { ConnectionType } from "@internal/device/service/DeviceManagementKitService";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes";
import { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import { eventTrackingModuleTypes } from "../di/eventTrackingModuleTypes";
import type { EventTrackingService } from "../service/EventTrackingService";
import { categorizeError } from "../utils/ErrorTrackingUtils";
import {
  type DeviceConnectionTracking,
  EventTrackingUtils,
  isTrackedConnectionType,
} from "../utils/EventTrackingUtils";

export type DeviceConnectionResult =
  | { status: "succeeded"; connectionType: ConnectionType }
  | { status: "failed"; connectionType: ConnectionType; error: unknown };

/**
 * Tracks the result of a device connection attempt:
 * `device_connection_succeeded` or `device_connection_failed`. The mock
 * transport is not tracked.
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

  async execute(result: DeviceConnectionResult): Promise<void> {
    const { connectionType } = result;
    if (!isTrackedConnectionType(connectionType)) {
      return;
    }

    const event = EventTrackingUtils.createDeviceConnectionEvent({
      dAppId: this.config.dAppIdentifier,
      sessionId: this.eventTrackingService.getSessionId(),
      trustChainId: this.contextService.getContext().trustChainId,
      ...this.toTracking(result, connectionType),
    });

    this.logger.debug("Tracking device connection result event", { event });

    await this.eventTrackingService.trackEvent(event);
  }

  private toTracking(
    result: DeviceConnectionResult,
    connectionType: DeviceConnectionType,
  ): DeviceConnectionTracking {
    if (result.status !== "failed") {
      return { status: "succeeded", connectionType };
    }

    const error =
      result.error instanceof Error
        ? result.error
        : new Error(String(result.error));

    return {
      status: "failed",
      connectionType,
      errorType: toErrorType(error),
      errorCategory: toErrorCategory(error),
    };
  }
}

/**
 * The error name, or the connection error type (e.g. `no-accessible-device`
 * when the user dismisses the browser device picker) for a
 * `DeviceConnectionError`.
 */
function toErrorType(error: Error): string {
  if (error instanceof DeviceConnectionError && error.context?.type) {
    return error.context.type;
  }

  return error.name || "Error";
}

/** A connection failure is a device failure unless it comes from Ledger Sync. */
function toErrorCategory(error: Error): DeviceConnectionErrorCategory {
  return categorizeError(error) === "ledgersync" ? "ledgersync" : "device";
}
