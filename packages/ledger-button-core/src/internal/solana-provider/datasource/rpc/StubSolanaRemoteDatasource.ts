import { type Factory, inject, injectable } from "inversify";
import { Right } from "purify-ts";

import {
  CommonSolanaErrorCode,
  SolanaJSONRPCRequest,
} from "../../../../api/model/solana/SolanaTypes.js";
import { type BackendService } from "../../../backend/BackendService.js";
import { backendModuleTypes } from "../../../backend/di/backendModuleTypes.js";
import { type ContextService } from "../../../context/ContextService.js";
import { contextModuleTypes } from "../../../context/di/contextModuleTypes.js";
import { loggerModuleTypes } from "../../../logger/di/loggerModuleTypes.js";
import { LoggerPublisher } from "../../../logger/service/LoggerPublisher.js";
import { SolanaRemoteDatasource } from "./SolanaRemoteDatasource.js";

@injectable()
export class StubSolanaRemoteDatasource extends SolanaRemoteDatasource {
  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(backendModuleTypes.BackendService)
    backendService: BackendService,
    @inject(contextModuleTypes.ContextService)
    contextService: ContextService,
  ) {
    super(loggerFactory, backendService, contextService);
  }

  override async JSONRPCRequest(args: SolanaJSONRPCRequest) {
    return Promise.resolve(
      Right({
        jsonrpc: "2.0",
        id: args.id,
        result: undefined,
        error: {
          code: CommonSolanaErrorCode.MethodNotFound,
          message: `Method ${args.method} is not supported, { method: ${args.method}, params: ${JSON.stringify(args.params)} }`,
        },
      }),
    );
  }
}
