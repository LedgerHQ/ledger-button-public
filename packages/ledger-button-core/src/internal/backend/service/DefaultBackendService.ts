import { inject, injectable } from "inversify";
import { Left } from "purify-ts";

import { networkModuleTypes } from "../../network/networkModuleTypes.js";
import {
  NetworkService,
  NetworkServiceOpts,
} from "../../network/NetworkService.js";
import {
  BroadcastRequest,
  BroadcastResponse,
  ConfigRequest,
  ConfigResponse,
} from "../model/types.js";
import { BackendService } from "./BackendService.js";

const BACKEND_BASE_URL = "https://ledgerb.aws.stg.ldg-tech.com";

@injectable()
export class DefaultBackendService implements BackendService {
  constructor(
    @inject(networkModuleTypes.NetworkService)
    private readonly networkService: NetworkService,
  ) {}

  async broadcast(
    request: BroadcastRequest,
    clientOrigin: string = "ledger-button",
    domain: string = "ledger-button-domain",
  ): Promise {
    const url = `${BACKEND_BASE_URL}/broadcast`;

    const headers = {
      "Content-Type": "application/json",
      "X-Ledger-client-origin": clientOrigin,
      "X-Ledger-domain": domain,
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
        (error) => new Error(`Broadcast failed: ${error.message}`),
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
    domain: string = "ledger-button-domain",
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
        (error) => new Error(`Get config failed: ${error.message}`),
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
