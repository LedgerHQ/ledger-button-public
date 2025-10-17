import { sha256 } from "ethers";
import { type Factory, inject, injectable } from "inversify";

import { configModuleTypes } from "../../config/configModuleTypes.js";
import { type Config } from "../../config/model/config.js";
import { contextModuleTypes } from "../../context/contextModuleTypes.js";
import type { ContextService } from "../../context/ContextService.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { storageModuleTypes } from "../../storage/storageModuleTypes.js";
import { type StorageService } from "../../storage/StorageService.js";
import { eventTrackingModuleTypes } from "../eventTrackingModuleTypes.js";
import {
  EventTrackingUtils,
  normalizeTransactionHash,
} from "../EventTrackingUtils.js";
import type { EventTrackingService } from "../service/EventTrackingService.js";

@injectable()
export class TrackTransactionStarted {
  private readonly logger: LoggerPublisher;
  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(eventTrackingModuleTypes.EventTrackingService)
    private readonly eventTrackingService: EventTrackingService,
    @inject(storageModuleTypes.StorageService)
    private readonly storageService: StorageService,
    @inject(configModuleTypes.Config)
    private readonly config: Config,
    @inject(contextModuleTypes.ContextService)
    private readonly contextService: ContextService,
  ) {
    this.logger = loggerFactory("[TrackTransactionStarted UseCase]");
  }

  async execute(rawTransaction: string): Promise<void> {
    const sessionId = this.eventTrackingService.getSessionId();
    const trustChainIdResult = this.storageService.getTrustChainId();

    if (trustChainIdResult.isJust()) {
      const trustChainId = trustChainIdResult.extract();

      const unsignedTransactionHash = normalizeTransactionHash(
        sha256(rawTransaction),
      );
      const chainId = this.contextService.getContext().chainId.toString();

      const event = EventTrackingUtils.createTransactionFlowInitializationEvent(
        {
          dAppId: this.config.dAppIdentifier,
          sessionId: sessionId,
          ledgerSyncUserId: trustChainId,
          unsignedTransactionHash: unsignedTransactionHash,
          chainId: chainId,
        },
      );

      this.logger.debug("Tracking ledger sync activated event", { event });

      await this.eventTrackingService.trackEvent(event);
    } else {
      this.logger.error("Data missing, cannot track transaction started event");
    }
  }
}
