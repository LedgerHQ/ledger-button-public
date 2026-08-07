import { type Factory, inject, injectable } from "inversify";

import { configModuleTypes } from "../../config/di/configModuleTypes.js";
import { type Config } from "../../config/model/config.js";
import { type ContextService } from "../../context/ContextService.js";
import { contextModuleTypes } from "../../context/di/contextModuleTypes.js";
import { loggerModuleTypes } from "../../logger/di/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { eventTrackingModuleTypes } from "../di/eventTrackingModuleTypes.js";
import { EventTrackingUtils } from "../EventTrackingUtils.js";
import type { EventTrackingService } from "../service/EventTrackingService.js";

export type TrackViewAllTransactionsParams = {
  currencyId: string;
  accountAddress: string;
};

@injectable()
export class TrackViewAllTransactions {
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
    this.logger = loggerFactory("TrackViewAllTransactions UseCase");
  }

  async trackClicked(params: TrackViewAllTransactionsParams): Promise<void> {
    const event = EventTrackingUtils.createViewAllTransactionsClickedEvent(
      this.buildEventParams(params),
    );

    this.logger.debug("Tracking view all transactions click event", { event });

    await this.eventTrackingService.trackEvent(event);
  }

  async trackRedirectConfirmed(
    params: TrackViewAllTransactionsParams,
  ): Promise<void> {
    const event =
      EventTrackingUtils.createViewAllTransactionsRedirectConfirmedEvent(
        this.buildEventParams(params),
      );

    this.logger.debug("Tracking view all transactions redirect confirmed event", {
      event,
    });

    await this.eventTrackingService.trackEvent(event);
  }

  async trackRedirectCancelled(
    params: TrackViewAllTransactionsParams,
  ): Promise<void> {
    const event =
      EventTrackingUtils.createViewAllTransactionsRedirectCancelledEvent(
        this.buildEventParams(params),
      );

    this.logger.debug("Tracking view all transactions redirect cancelled event", {
      event,
    });

    await this.eventTrackingService.trackEvent(event);
  }

  private buildEventParams(params: TrackViewAllTransactionsParams): {
    dAppId: string;
    sessionId: string;
    trustChainId?: string;
    currencyId: string;
    accountAddress: string;
  } {
    return {
      dAppId: this.config.dAppIdentifier,
      sessionId: this.eventTrackingService.getSessionId(),
      trustChainId: this.contextService.getContext().trustChainId,
      currencyId: params.currencyId,
      accountAddress: params.accountAddress,
    };
  }
}
