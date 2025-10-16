import { ethers, sha256 } from "ethers";
import { type Factory, inject, injectable } from "inversify";

import { BroadcastedTransactionResult } from "../../../api/model/signing/SignedTransaction.js";
import { configModuleTypes } from "../../config/configModuleTypes.js";
import { type Config } from "../../config/model/config.js";
import { contextModuleTypes } from "../../context/contextModuleTypes.js";
import { type ContextService } from "../../context/ContextService.js";
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
export class TrackTransactionCompleted {
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
    this.logger = loggerFactory("[TrackTransactionCompleted UseCase]");
  }

  async execute(
    rawTransaction: string,
    txResult: BroadcastedTransactionResult,
  ): Promise<void> {
    this.logger.debug("Tracking transaction completed event");
    const sessionId = this.eventTrackingService.getSessionId();
    const trustChainIdResult = this.storageService.getTrustChainId();

    if (trustChainIdResult.isJust()) {
      const trustChainId = trustChainIdResult.extract();
      const unsignedTransactionHash = normalizeTransactionHash(
        sha256(rawTransaction),
      );
      const chainId = this.contextService.getContext().chainId.toString();
      const tx = ethers.Transaction.from(rawTransaction);
      const recipientAddress = tx.to || "";
      const normalizedTransactionHash = normalizeTransactionHash(txResult.hash);
      const event = EventTrackingUtils.createTransactionFlowCompletionEvent({
        dAppId: this.config.dAppIdentifier,
        sessionId: sessionId,
        ledgerSyncUserId: trustChainId,
        chainId: chainId,
        unsignedTransactionHash: unsignedTransactionHash,
        transactionHash: normalizedTransactionHash,
      });

      await this.eventTrackingService.trackEvent(event);
      // TODO: Track invoicing transaction

      const invoicingEvent =
        EventTrackingUtils.createInvoicingTransactionSignedEvent({
          dAppId: this.config.dAppIdentifier,
          sessionId: sessionId,
          ledgerSyncUserId: trustChainId,
          transactionHash: normalizedTransactionHash,
          unsignedTransactionHash: unsignedTransactionHash,
          chainId: chainId,
          recipientAddress: recipientAddress,
        });

      await this.eventTrackingService.trackEvent(invoicingEvent);
    } else {
      this.logger.error(
        "Data missing, cannot track transaction completed event",
      );
    }
  }
}
