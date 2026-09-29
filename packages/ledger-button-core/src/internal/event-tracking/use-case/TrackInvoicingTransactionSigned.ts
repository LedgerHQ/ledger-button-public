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
export class TrackInvoicingTransactionSigned {
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
    this.logger = loggerFactory("TrackInvoicingTransactionSigned UseCase");
  }

  async execute(invoice: InvoicedTransaction): Promise<void> {
    const context = this.contextService.getContext();

    const event = EventTrackingUtils.createInvoicingTransactionSignedEvent({
      dAppId: this.config.dAppIdentifier,
      sessionId: this.eventTrackingService.getSessionId(),
      transactionHash: invoice.transactionHash,
      unsignedTransactionHash: sha256(invoice.unsignedTransaction),
      family: invoice.family,
      chainId: resolveTrackedChainId(
        context,
        invoice.family,
        this.blockchainProviderManager,
      ),
      recipientAddress: invoice.recipientAddress,
    });

    this.logger.debug("Tracking invoicing transaction signed event", {
      event,
    });

    await this.eventTrackingService.trackEvent(event);
  }
}
