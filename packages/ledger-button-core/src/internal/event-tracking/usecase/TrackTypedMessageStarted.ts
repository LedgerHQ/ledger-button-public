import { TypedData } from "@ledgerhq/device-signer-kit-ethereum";
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
import { EventTrackingUtils, stringToSha256 } from "../EventTrackingUtils.js";
import type { EventTrackingService } from "../service/EventTrackingService.js";

@injectable()
export class TrackTypedMessageStarted {
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
    this.logger = loggerFactory("[TrackTypedMessageStarted UseCase]");
  }

  async execute(typedData: TypedData): Promise<void> {
    const sessionId = this.eventTrackingService.getSessionId();
    const trustChainIdResult = this.storageService.getTrustChainId();

    if (trustChainIdResult.isJust()) {
      const trustChainId = trustChainIdResult.extract();
      const typedMessageHash = stringToSha256(JSON.stringify(typedData));
      const chainId = this.contextService.getContext().chainId.toString();

      const event =
        EventTrackingUtils.createTypedMessageFlowInitializationEvent({
          dAppId: this.config.dAppIdentifier,
          sessionId: sessionId,
          ledgerSyncUserId: trustChainId,
          typedMessageHash: typedMessageHash,
          chainId: chainId,
        });

      this.logger.debug("Tracking typed message flow initialization event", {
        event,
      });

      await this.eventTrackingService.trackEvent(event);
    } else {
      this.logger.error(
        "Data missing, cannot track typed message flow initialization event",
      );
    }
  }
}
