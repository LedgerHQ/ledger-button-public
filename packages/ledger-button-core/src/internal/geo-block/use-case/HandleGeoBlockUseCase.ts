import { type Factory, inject, injectable } from "inversify";

import { contextModuleTypes } from "@internal/context/di/contextModuleTypes";
import type { ContextService } from "@internal/context/service/ContextService";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes";
import type { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import { UNAVAILABLE_FOR_LEGAL_REASONS_STATUS } from "../model/constant";

/**
 * Single entry point for any Ledger API answering HTTP 451: callers hand over
 * the status and never interpret it themselves.
 */
@injectable()
export class HandleGeoBlockUseCase {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(contextModuleTypes.ContextService)
    private readonly contextService: ContextService,
  ) {
    this.logger = loggerFactory("HandleGeoBlock UseCase");
  }

  execute(status: number): boolean {
    if (status !== UNAVAILABLE_FOR_LEGAL_REASONS_STATUS) {
      return false;
    }

    this.logger.info("User is geo-blocked");
    this.contextService.onEvent({ type: "geo_blocked" });
    return true;
  }
}
