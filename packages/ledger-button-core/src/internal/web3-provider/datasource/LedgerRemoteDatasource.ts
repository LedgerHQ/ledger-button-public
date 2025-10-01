import { inject, injectable } from "inversify";
import { Either, Left } from "purify-ts";

import {
  JSONRPCRequest,
  JSONRPCResponse,
} from "../../../api/model/eip/EIPTypes.js";
import { type NetworkServiceOpts } from "../../network/DefaultNetworkService.js";
import { networkModuleTypes } from "../../network/networkModuleTypes.js";
import { type NetworkService } from "../../network/NetworkService.js";

@injectable()
export class LedgerRemoteDatasource {
  constructor(
    @inject(networkModuleTypes.NetworkService)
    private readonly networkService: NetworkService<NetworkServiceOpts>,
  ) {}

  async JSONRPCRequest(
    args: JSONRPCRequest,
  ): Promise<Either<Error, JSONRPCResponse>> {
    // TODO: Update when we have the backend ready
    try {
      const response = await this.networkService.post<JSONRPCResponse>(
        `https://api.ledger.com/jsonrpc`,
        args,
      );
      return response;
    } catch (error) {
      console.error("Error in JSONRPCRequest", error);
      return Left(new Error("Error in JSONRPCRequest", { cause: error }));
    }
  }
}
