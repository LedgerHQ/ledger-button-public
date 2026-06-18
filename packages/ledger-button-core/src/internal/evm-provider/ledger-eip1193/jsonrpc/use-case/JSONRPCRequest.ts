import { type Factory, inject, injectable } from "inversify";

import {
  JSONRPCRequest,
  JsonRpcResponse,
} from "../../../../api/model/eip/EIPTypes.js";
import { loggerModuleTypes } from "../../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../../logger/service/LoggerPublisher.js";
import { evmProviderModuleTypes } from "../../evmProviderModuleTypes.js";
import { LedgerRemoteDatasource } from "../datasource/LedgerRemoteDatasource.js";

@injectable()
export class JSONRPCCallUseCase {
  private readonly logger: LoggerPublisher;
  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(evmProviderModuleTypes.LedgerRemoteDatasource)
    private readonly datasource: LedgerRemoteDatasource,
  ) {
    this.logger = loggerFactory("JSONRPCCallUseCase UseCase");
  }

  async execute(args: JSONRPCRequest) {
    this.logger.debug("JSONRPCRequest", { args });
    const response = await this.datasource.JSONRPCRequest(args);
    return response.caseOf<JsonRpcResponse | void>({
      Right: (response) => {
        this.logger.debug("JSONRPCRequest response", { response });
        return response;
      },
      Left: (error) => {
        // NOTE: this should technically never happen since the JSONRPCResponse is always
        // a 200 reponse, with a different body.
        this.logger.error("JSONRPCRequest failed", { error });
        return;
      },
    });
  }
}
