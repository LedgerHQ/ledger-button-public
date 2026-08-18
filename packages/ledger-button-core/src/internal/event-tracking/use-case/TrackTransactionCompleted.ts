import { ethers, sha256 } from "ethers";
import { type Factory, inject, injectable } from "inversify";

import { BroadcastedTransactionResult } from "@api/model/signing/SignedTransaction";
import { configModuleTypes } from "@internal/config/di/configModuleTypes";
import { type Config } from "@internal/config/model/config";
import { type ContextService } from "@internal/context/ContextService";
import { contextModuleTypes } from "@internal/context/di/contextModuleTypes";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes";
import { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import { eventTrackingModuleTypes } from "../di/eventTrackingModuleTypes";
import {
  EventTrackingUtils,
  normalizeTransactionHash,
} from "../EventTrackingUtils";
import type { EventTrackingService } from "../service/EventTrackingService";

@injectable()
export class TrackTransactionCompleted {
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
    this.logger = loggerFactory("TrackTransactionCompleted UseCase");
  }

  async execute(
    rawTransaction: string,
    txResult: BroadcastedTransactionResult,
  ): Promise<void> {
    this.logger.debug("Tracking transaction completed event");
    const sessionId = this.eventTrackingService.getSessionId();

    const unsignedTransactionHash = normalizeTransactionHash(
      sha256(rawTransaction),
    );
    const context = this.contextService.getContext();
    const chainId = context.chainId.toString();
    const trustChainId = context.trustChainId;
    const tx = ethers.Transaction.from(rawTransaction);
    const recipientAddress = tx.to || "";
    const normalizedTransactionHash = normalizeTransactionHash(txResult.hash);
    const event = EventTrackingUtils.createTransactionFlowCompletionEvent({
      dAppId: this.config.dAppIdentifier,
      sessionId: sessionId,
      trustChainId: trustChainId,
      chainId: chainId,
    });

    await this.eventTrackingService.trackEvent(event);
    // TODO: Track invoicing transaction

    const invoicingEvent =
      EventTrackingUtils.createInvoicingTransactionSignedEvent({
        dAppId: this.config.dAppIdentifier,
        sessionId: sessionId,
        transactionHash: normalizedTransactionHash,
        unsignedTransactionHash: unsignedTransactionHash,
        chainId: chainId,
        recipientAddress: recipientAddress,
      });

    await this.eventTrackingService.trackEvent(invoicingEvent);
  }
}
