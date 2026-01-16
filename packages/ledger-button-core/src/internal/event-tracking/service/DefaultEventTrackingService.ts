import { type Factory, inject, injectable } from "inversify";

import { backendModuleTypes } from "../../backend/backendModuleTypes.js";
import type { BackendService } from "../../backend/BackendService.js";
import {
  type EventRequest,
  EventType,
} from "../../backend/model/trackEvent.js";
import { configModuleTypes } from "../../config/configModuleTypes.js";
import type { Config } from "../../config/model/config.js";
import { contextModuleTypes } from "../../context/contextModuleTypes.js";
import type { ContextService } from "../../context/ContextService.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { generateUUID } from "../utils.js";
import type { EventTrackingService } from "./EventTrackingService.js";

@injectable()
export class DefaultEventTrackingService implements EventTrackingService {
  private readonly logger: LoggerPublisher;

  private _sessionId: string;

  constructor(
    @inject(backendModuleTypes.BackendService)
    private readonly backendService: BackendService,
    @inject(configModuleTypes.Config)
    private readonly config: Config,
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(contextModuleTypes.ContextService)
    private readonly contextService: ContextService,
  ) {
    this.logger = loggerFactory("[Event Tracking]");
    this._sessionId = generateUUID();
  }

  getSessionId(): string {
    return this._sessionId;
  }

  async trackEvent(event: EventRequest): Promise<void> {
    try {
      if (!this.shouldTrackEvent(event)) {
        return;
      }

      /*
TODO: Uncomment this when we have a validation for the events in the backend.
Check current state with formats in JSON schemas and update the validation.

      const validationResult = EventTrackingUtils.validateEvent(event);

      if (!validationResult.success) {
        this.logger.error("Event validation failed", {
          eventType: event.type,
          errors: validationResult.errors,
          event,
        });
        return;
      }
*/

      this.logger.info("Tracking event", { event });

      //TODO: Uncomment this when we have a validation for the events in the backend.
      const result = await this.backendService.event(
        event,
        this.config.dAppIdentifier,
      );

      result.caseOf({
        Left: (error) => {
          this.logger.error("Failed to track event", { error, event });
        },
        Right: (response) => {
          this.logger.debug("Event tracked successfully", { response });
        },
      });
    } catch (error) {
      this.logger.error("Error tracking event", { error, event });
    }
  }

  private shouldTrackEvent(event: EventRequest): boolean {
    // These events are always tracked regardless of consent
    const alwaysTrackedEvents = [
      EventType.InvoicingTransactionSigned,
      EventType.ErrorOccurred,
      EventType.ConsentGiven,
    ];

    if (alwaysTrackedEvents.includes(event.type)) {
      return true;
    }

    // All other events require user consent
    if (this.contextService.getContext().hasTrackingConsent) {
      return true;
    }

    this.logger.debug("User has not given consent, skipping tracking", {
      event,
    });

    return false;
  }
}
