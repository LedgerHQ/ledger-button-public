import { sha256 } from "ethers";
import { type Factory, inject, injectable } from "inversify";

import type { InvoicedTransaction } from "@api/blockchain-provider/model/types";
import { blockchainProviderModuleTypes } from "@internal/blockchain-provider/di/blockchainProviderModuleTypes";
import type { BlockchainProviderManager } from "@internal/blockchain-provider/service/BlockchainProviderManager";
import { configModuleTypes } from "@internal/config/di/configModuleTypes";
import { type Config } from "@internal/config/model/config";
import { type ContextService } from "@internal/context/ContextService";
import { contextModuleTypes } from "@internal/context/di/contextModuleTypes";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes";
import { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import { eventTrackingModuleTypes } from "../di/eventTrackingModuleTypes";
import { EventTrackingUtils } from "../EventTrackingUtils";
import { resolveTrackedChainId } from "../resolveTrackedChainId";
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
    @inject(blockchainProviderModuleTypes.BlockchainProviderManager)
    private readonly blockchainProviderManager: BlockchainProviderManager,
  ) {
    this.logger = loggerFactory("TrackTransactionCompleted UseCase");
  }

  async execute(transaction: InvoicedTransaction): Promise<void> {
    const sessionId = this.eventTrackingService.getSessionId();
    const context = this.contextService.getContext();
    const chainId = resolveTrackedChainId(
      context,
      transaction.family,
      this.blockchainProviderManager,
    );

    const completionEvent =
      EventTrackingUtils.createTransactionFlowCompletionEvent({
        dAppId: this.config.dAppIdentifier,
        sessionId: sessionId,
        trustChainId: context.trustChainId,
        family: transaction.family,
        chainId: chainId,
      });

    const invoicingEvent =
      EventTrackingUtils.createInvoicingTransactionSignedEvent({
        dAppId: this.config.dAppIdentifier,
        sessionId: sessionId,
        transactionHash: transaction.transactionHash,
        unsignedTransactionHash: sha256(transaction.unsignedTransaction),
        family: transaction.family,
        chainId: chainId,
        recipientAddress: transaction.recipientAddress,
      });

    this.logger.debug("Tracking transaction flow completion event", {
      completionEvent,
      invoicingEvent,
    });

    await this.eventTrackingService.trackEvent(completionEvent);
    await this.eventTrackingService.trackEvent(invoicingEvent);
  }
}
