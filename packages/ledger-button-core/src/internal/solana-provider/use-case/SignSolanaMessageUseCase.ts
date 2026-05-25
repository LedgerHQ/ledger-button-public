import { type Factory, inject, injectable } from "inversify";

import { SignedSolanaMessageResult } from "../../../api/model/solana/SignedSolanaResult.js";
import { SignSolanaMessageParams } from "../../../api/model/solana/SignSolanaMessageParams.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";

const NOT_IMPLEMENTED_MESSAGE = "Solana signing not implemented yet";

@injectable()
export class SignSolanaMessageUseCase {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
  ) {
    this.logger = loggerFactory("[SignSolanaMessageUseCase]");
  }

  execute(_params: SignSolanaMessageParams): Promise<SignedSolanaMessageResult> {
    this.logger.info("SignSolanaMessageUseCase is not implemented yet");
    return Promise.reject(new Error(NOT_IMPLEMENTED_MESSAGE));
  }
}
