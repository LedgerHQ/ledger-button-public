import { type Factory, inject, injectable } from "inversify";
import { Either, Left, Right } from "purify-ts";

import { getSelectedAccount } from "../../../../../api/model/ButtonCoreContext.js";
import type { JSONRPCRequest } from "../../../../../api/model/eip/EIPTypes.js";
import {
  SolanaJSONRPCRequest,
  SolanaJsonRpcResponse,
} from "../../../../../api/model/solana/SolanaTypes.js";
import { backendModuleTypes } from "../../../../backend/backendModuleTypes.js";
import { type BackendService } from "../../../../backend/BackendService.js";
import { isJsonRpcResponse } from "../../../../backend/types.js";
import { contextModuleTypes } from "../../../../context/contextModuleTypes.js";
import { type ContextService } from "../../../../context/ContextService.js";
import { loggerModuleTypes } from "../../../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../../../logger/service/LoggerPublisher.js";
import {
  DEFAULT_SOLANA_CLUSTER,
  getClusterFromCurrencyId,
} from "../../utils/clusterUtils.js";

@injectable()
export class SolanaRemoteDatasource {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    private readonly loggerFactory: Factory<LoggerPublisher>,
    @inject(backendModuleTypes.BackendService)
    private readonly backendService: BackendService,
    @inject(contextModuleTypes.ContextService)
    private readonly contextService: ContextService,
  ) {
    this.logger = this.loggerFactory("SolanaRemoteDatasource");
  }

  async JSONRPCRequest(
    args: SolanaJSONRPCRequest,
  ): Promise<Either<Error, SolanaJsonRpcResponse>> {
    try {
      const cluster = this.resolveCluster();
      const response = await this.backendService.broadcast({
        blockchain: {
          name: "solana",
          chainId: cluster,
        },
        rpc: args as unknown as JSONRPCRequest,
      });

      if (response.isLeft()) {
        return Left(
          new Error("Error in Solana JSONRPCRequest", {
            cause: response.extract(),
          }),
        );
      }
      if (response.isRight() && isJsonRpcResponse(response.extract())) {
        return Right(response.extract() as SolanaJsonRpcResponse);
      }
      return Left(
        new Error("Error in Solana JSONRPCRequest", {
          cause: response.extract(),
        }),
      );
    } catch (error) {
      this.logger.error("Error in Solana JSONRPCRequest", { error });
      return Left(new Error("Error in Solana JSONRPCRequest", { cause: error }));
    }
  }

  private resolveCluster(): string {
    const selectedAccount = getSelectedAccount(
      this.contextService.getContext(),
      "solana",
    );
    if (selectedAccount?.currencyId) {
      return getClusterFromCurrencyId(selectedAccount.currencyId);
    }
    return DEFAULT_SOLANA_CLUSTER;
  }
}
