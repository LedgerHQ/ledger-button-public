import { type Factory, inject, injectable } from "inversify";

import { SignedSolanaTransactionResult } from "../../../api/model/solana/SignedSolanaResult.js";
import { SignSolanaTransactionParams } from "../../../api/model/solana/SignSolanaTransactionParams.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";

const NOT_IMPLEMENTED_MESSAGE = "Solana signing not implemented yet";

@injectable()
export class SendSolanaTransactionUseCase {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
  ) {
    this.logger = loggerFactory("[SendSolanaTransactionUseCase]");
  }

  execute(
    _params: SignSolanaTransactionParams,
  ): Promise<SignedSolanaTransactionResult> {
    this.logger.info("SendSolanaTransactionUseCase is not implemented yet");
    return Promise.reject(new Error(NOT_IMPLEMENTED_MESSAGE));
  }
}
