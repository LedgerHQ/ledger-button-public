import { injectable } from "inversify";

import type { EventRequest } from "@internal/backend/model/trackEvent";
import type { ErrorTrackingConfig } from "@internal/event-tracking/config/ErrorTrackingConfig";
import {
  DEFAULT_ERROR_TRACKING_CONFIG,
  shouldTrackError,
} from "@internal/event-tracking/config/ErrorTrackingConfig";
import { createErrorEvent } from "@internal/event-tracking/ErrorTrackingUtils";

import { LOG_LEVELS } from "../model/constant";
import { LogData } from "./LoggerPublisher";
import { LoggerSubscriber } from "./LoggerSubscriber";

@injectable()
export class ErrorTrackingLoggerSubscriber implements LoggerSubscriber {
  private readonly config: ErrorTrackingConfig;
  private readonly sessionId: string | (() => string);
  private readonly dAppId: string | (() => string);
  private readonly trackEvent: (event: EventRequest) => void;

  constructor(params: {
    sessionId: string | (() => string);
    dAppId: string | (() => string);
    trackEvent: (event: EventRequest) => void;
    config?: ErrorTrackingConfig;
  }) {
    this.sessionId = params.sessionId;
    this.dAppId = params.dAppId;
    this.trackEvent = params.trackEvent;
    this.config = params.config ?? DEFAULT_ERROR_TRACKING_CONFIG;
  }

  private getSessionId(): string {
    return typeof this.sessionId === "function"
      ? this.sessionId()
      : this.sessionId;
  }

  private getDAppId(): string {
    return typeof this.dAppId === "function" ? this.dAppId() : this.dAppId;
  }

  log(level: number, _message: string, data: LogData): void {
    if (level !== LOG_LEVELS.error && level !== LOG_LEVELS.fatal) {
      return;
    }

    if (!this.config.enabled) {
      return;
    }

    const error = this.extractError(data.data);
    if (!error) {
      return;
    }

    if (this.config.useWhitelist && !shouldTrackError(error.name)) {
      return;
    }

    const errorEvent = createErrorEvent({
      error,
      sessionId: this.getSessionId(),
      dAppId: this.getDAppId(),
      severity: level === LOG_LEVELS.fatal ? "fatal" : "error",
    });

    this.trackEvent(errorEvent);
  }

  private extractError(logData?: Record<string, unknown>): Error | null {
    if (!logData) return null;

    if (logData.error instanceof Error) {
      return logData.error;
    }
    return null;
  }
}
