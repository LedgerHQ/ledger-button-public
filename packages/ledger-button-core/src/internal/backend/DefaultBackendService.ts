import { inject, injectable } from "inversify";
import { Either, Left } from "purify-ts";

import type { NetworkServiceOpts } from "../network/DefaultNetworkService.js";
import { networkModuleTypes } from "../network/networkModuleTypes.js";
import type { NetworkService } from "../network/NetworkService.js";
import type { BackendService } from "./BackendService.js";
import type {
  BroadcastRequest,
  BroadcastResponse,
  ConfigRequest,
  ConfigResponse,
} from "./types.js";

const BACKEND_BASE_URL = "https://ledgerb.aws.stg.ldg-tech.com";

@injectable()
export class DefaultBackendService implements BackendService {
  constructor(
    @inject(networkModuleTypes.NetworkService)
    private readonly networkService: NetworkService,
  ) {}

  async broadcast(
    request: BroadcastRequest,
    clientOrigin = "ledger-button",
    domain = "ledger-button-domain",
  ): Promise {
    const url = `${BACKEND_BASE_URL}/broadcast`;

    const headers = {
      "Content-Type": "application/json",
      "X-Ledger-client-origin": clientOrigin,
      "X-Ledger-Domain": domain,
    };

    const options: NetworkServiceOpts = {
      headers,
    };

    try {
      const result = await this.networkService.post<BroadcastResponse>(
        url,
        JSON.stringify(request),
        options,
      );

      return result.mapLeft(
        (error: Error) => new Error(`Broadcast failed: ${error.message}`),
      );
    } catch (error) {
      return Left(
        new Error(
          `Broadcast request failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ),
      );
    }
  }

  async getConfig(
    request: ConfigRequest,
    domain = "ledger-button-domain",
  ): Promise {
    const url = `${BACKEND_BASE_URL}/config?dAppIdentifier=${encodeURIComponent(
      request.dAppIdentifier,
    )}`;

    const headers = {
      "X-Ledger-Domain": domain,
    };

    const options: NetworkServiceOpts = {
      headers,
    };

    try {
      const result = await this.networkService.get<ConfigResponse>(
        url,
        options,
      );

      return result.mapLeft(
        (error: Error) => new Error(`Get config failed: ${error.message}`),
      );
    } catch (error) {
      return Left(
        new Error(
          `Get config request failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ),
      );
    }
  }
}
