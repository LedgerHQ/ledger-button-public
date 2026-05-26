import { type Factory, inject, injectable } from "inversify";

import { configModuleTypes } from "../../config/configModuleTypes.js";
import { type Config } from "../../config/model/config.js";
import { contextModuleTypes } from "../../context/contextModuleTypes.js";
import { type ContextService } from "../../context/ContextService.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { eventTrackingModuleTypes } from "../eventTrackingModuleTypes.js";
import { EventTrackingUtils } from "../EventTrackingUtils.js";
import type { EventTrackingService } from "../service/EventTrackingService.js";

export type TrackViewAllTransactionsClickParams = {
  currencyId: string;
  accountAddress: string;
};

@injectable()
export class TrackViewAllTransactionsClick {
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
    this.logger = loggerFactory("TrackViewAllTransactionsClick UseCase");
  }

  async execute(params: TrackViewAllTransactionsClickParams): Promise<void> {
    const sessionId = this.eventTrackingService.getSessionId();
    const context = this.contextService.getContext();

    const event = EventTrackingUtils.createViewAllTransactionsClickedEvent({
      dAppId: this.config.dAppIdentifier,
      sessionId,
      trustChainId: context.trustChainId,
      currencyId: params.currencyId,
      accountAddress: params.accountAddress,
    });

    this.logger.debug("Tracking view all transactions click event", { event });

    await this.eventTrackingService.trackEvent(event);
  }
}
