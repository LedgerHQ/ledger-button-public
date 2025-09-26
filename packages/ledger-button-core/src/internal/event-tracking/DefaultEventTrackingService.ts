import { inject, injectable } from "inversify";

import { backendModuleTypes } from "../backend/backendModuleTypes.js";
import type { BackendService } from "../backend/BackendService.js";
import type { EventRequest } from "../backend/types.js";
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
    loggerFactory: any,
  ) {
    this.logger = loggerFactory("[Event Tracking]");
  }

  async trackEvent(event: EventRequest): Promise<void> {
    try {
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
}