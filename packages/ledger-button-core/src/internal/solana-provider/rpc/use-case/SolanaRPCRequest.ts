import { type Factory, inject, injectable } from "inversify";

import {
  SolanaJSONRPCRequest,
  SolanaJsonRpcResponse,
} from "../../../../api/model/solana/SolanaTypes.js";
import { loggerModuleTypes } from "../../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../../logger/service/LoggerPublisher.js";
import { solanaProviderModuleTypes } from "../../solanaProviderModuleTypes.js";
import { SolanaRemoteDatasource } from "../datasource/SolanaRemoteDatasource.js";

@injectable()
export class SolanaRPCCallUseCase {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(solanaProviderModuleTypes.SolanaRemoteDatasource)
    private readonly datasource: SolanaRemoteDatasource,
  ) {
    this.logger = loggerFactory("SolanaRPCCallUseCase");
  }

  async execute(args: SolanaJSONRPCRequest): Promise<SolanaJsonRpcResponse | void> {
    this.logger.debug("Solana JSONRPCRequest", { args });
    const response = await this.datasource.JSONRPCRequest(args);
    return response.caseOf<SolanaJsonRpcResponse | void>({
      Right: (rpcResponse) => {
        this.logger.debug("Solana JSONRPCRequest response", { rpcResponse });
        return rpcResponse;
      },
      Left: (error) => {
        this.logger.error("Solana JSONRPCRequest failed", { error });
        return;
      },
    });
  }
}
