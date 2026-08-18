import { type Factory, inject, injectable } from "inversify";

import { configModuleTypes } from "@internal/config/di/configModuleTypes";
import { type Config } from "@internal/config/model/config";
import { type ContextService } from "@internal/context/ContextService";
import { contextModuleTypes } from "@internal/context/di/contextModuleTypes";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes";
import { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import { eventTrackingModuleTypes } from "../di/eventTrackingModuleTypes";
import { EventTrackingUtils } from "../EventTrackingUtils";
import type { EventTrackingService } from "../service/EventTrackingService";

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
