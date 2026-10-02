import { type Factory, inject, injectable } from "inversify";

import { configModuleTypes } from "@internal/config/di/configModuleTypes";
import { type Config } from "@internal/config/model/config";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes";
import { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import { eventTrackingModuleTypes } from "../di/eventTrackingModuleTypes";
import { EventTrackingUtils } from "../EventTrackingUtils";
import type { EventTrackingService } from "../service/EventTrackingService";

@injectable()
export class TrackMobileRedirectLedgerWallet {
  private readonly logger: LoggerPublisher;
  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(eventTrackingModuleTypes.EventTrackingService)
    private readonly eventTrackingService: EventTrackingService,
    @inject(configModuleTypes.Config)
    private readonly config: Config,
  ) {
    this.logger = loggerFactory(
      "TrackMobileRedirectLedgerWallet UseCase",
    );
  }

  async execute(): Promise<void> {
    const event =
      EventTrackingUtils.createMobileRedirectLedgerWalletEvent({
        dAppId: this.config.dAppIdentifier,
      });

    this.logger.debug(
      "Tracking mobile redirect to Ledger Wallet event",
      { event },
    );

    await this.eventTrackingService.trackEvent(event);
  }
}
