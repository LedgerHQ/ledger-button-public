import { type Factory, inject, injectable } from "inversify";

import { backendModuleTypes } from "../backend/backendModuleTypes.js";
import type { BackendService } from "../backend/BackendService.js";
import { type EventRequest,EventType } from "../backend/types.js";
import { configModuleTypes } from "../config/configModuleTypes.js";
import type { Config } from "../config/model/config.js";
import { loggerModuleTypes } from "../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../logger/service/LoggerPublisher.js";
import type { EventTrackingService } from "./EventTrackingService.js";

@injectable()
export class DefaultEventTrackingService implements EventTrackingService {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(backendModuleTypes.BackendService)
    private readonly backendService: BackendService,
    @inject(configModuleTypes.Config)
    private readonly config: Config,
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
  ) {
    this.logger = loggerFactory("[Event Tracking]");
  }

  async trackEvent(event: EventRequest, sessionId?: string, trustChainId?: string): Promise<void> {
    try {
      // Validate required IDs based on event type
      if (this.requiresSessionId(event.type) && !sessionId) {
        this.logger.warn("Skipping event tracking: sessionId is required", { eventType: event.type });
        return;
      }

      if (this.requiresTrustChainId(event.type) && !trustChainId) {
        this.logger.warn("Skipping event tracking: trustChainId is required", { eventType: event.type });
        return;
      }

      this.logger.info("Tracking event", { event });
      
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

  private requiresSessionId(eventType: EventType): boolean {
    return [
      EventType.OpenSession,
      EventType.OpenLedgerSync,
      EventType.LedgerSyncActivated,
      EventType.Onboarding,
      EventType.TransactionFlowInitialization,
      EventType.TransactionFlowCompletion,
      EventType.SessionAuthentication,
    ].includes(eventType);
  }

  private requiresTrustChainId(eventType: EventType): boolean {
    return [
      EventType.LedgerSyncActivated,
      EventType.ConsentGiven,
      EventType.ConsentRemoved,
      EventType.Onboarding,
      EventType.TransactionFlowInitialization,
      EventType.TransactionFlowCompletion,
      EventType.SessionAuthentication,
      EventType.InvoicingTransactionSigned,
    ].includes(eventType);
  }
}