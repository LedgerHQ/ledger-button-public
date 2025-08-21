import { inject, injectable } from "inversify";

import { type NetworkServiceOpts } from "../../network/DefaultNetworkService.js";
import { networkModuleTypes } from "../../network/networkModuleTypes.js";
import { type NetworkService } from "../../network/NetworkService.js";
import { JSONRPCRequest, JSONRPCResponse } from "../model/EIPTypes.js";

@injectable()
export class LedgerRemoteDatasource {
  constructor(
    @inject(networkModuleTypes.NetworkService)
    private readonly networkService: NetworkService<NetworkServiceOpts>,
  ) {}

  async JSONRPCRequest(args: JSONRPCRequest) {
    // TODO: Update when we have the backend ready
    const response = await this.networkService.post<JSONRPCResponse>(
      `https://api.ledger.com/jsonrpc`,
      args,
    );

    return response;
  }
}
