import { type Factory, inject, injectable } from "inversify";

import type { BlockchainFamily } from "@api/blockchain-provider/model/types";
import { blockchainProviderModuleTypes } from "@internal/blockchain-provider/di/blockchainProviderModuleTypes";
import type { BlockchainProviderManager } from "@internal/blockchain-provider/service/BlockchainProviderManager";
import { configModuleTypes } from "@internal/config/di/configModuleTypes";
import { type Config } from "@internal/config/model/config";
import type { ContextService } from "@internal/context/ContextService";
import { contextModuleTypes } from "@internal/context/di/contextModuleTypes";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes";
import { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import { eventTrackingModuleTypes } from "../di/eventTrackingModuleTypes";
import { EventTrackingUtils, stringToSha256 } from "../EventTrackingUtils";
import { resolveTrackedChainId } from "../resolveTrackedChainId";
import type { EventTrackingService } from "../service/EventTrackingService";

// Typed messages are EIP-712, only signed through the EVM provider.
const EVM_FAMILY: BlockchainFamily = "ethereum";

@injectable()
export class TrackTypedMessageStarted {
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
    this.logger = loggerFactory("TrackTypedMessageStarted UseCase");
  }

  async execute(typedData: unknown): Promise<void> {
    const sessionId = this.eventTrackingService.getSessionId();

    const typedMessageHash = stringToSha256(JSON.stringify(typedData));
    const context = this.contextService.getContext();

    const event = EventTrackingUtils.createTypedMessageFlowInitializationEvent({
      dAppId: this.config.dAppIdentifier,
      sessionId: sessionId,
      trustChainId: context.trustChainId,
      typedMessageHash: typedMessageHash,
      family: EVM_FAMILY,
      chainId: resolveTrackedChainId(
        context,
        EVM_FAMILY,
        this.blockchainProviderManager,
      ),
    });

    this.logger.debug("Tracking typed message flow initialization event", {
      event,
    });

    await this.eventTrackingService.trackEvent(event);
  }
}
