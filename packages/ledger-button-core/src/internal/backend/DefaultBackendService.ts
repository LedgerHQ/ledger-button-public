import { inject, injectable } from "inversify";
import { Either, Left, Right } from "purify-ts";

import type { NetworkServiceOpts } from "../network/DefaultNetworkService.js";
import { networkModuleTypes } from "../network/networkModuleTypes.js";
import type { NetworkService } from "../network/NetworkService.js";
import type { BackendService } from "./BackendService.js";
import { ConfigResponseSchema } from "./schemas.js";
import type {
  BroadcastRequest,
  BroadcastResponse,
  ConfigRequest,
  ConfigResponse,
  EventRequest,
  EventResponse,
} from "./types.js";

const BACKEND_BASE_URL = "https://ledgerb.aws.stg.ldg-tech.com";

@injectable()
export class DefaultBackendService implements BackendService {
  constructor(
    @inject(networkModuleTypes.NetworkService)
    private readonly networkService: NetworkService<NetworkServiceOpts>,
  ) {}

  async broadcast(
    request: BroadcastRequest,
    clientOrigin = "ledger-button",
    domain = "ledger-button-domain",
  ): Promise<Either<Error, BroadcastResponse>> {
    const url = `${BACKEND_BASE_URL}/broadcast`;

    const headers = {
      "Content-Type": "application/json",
      "X-Ledger-client-origin": clientOrigin,
      "X-Ledger-Domain": domain,
    };

    const options: NetworkServiceOpts = {
      headers,
    };

    const result = await this.networkService.post<BroadcastResponse>(
      url,
      JSON.stringify(request),
      options,
    );

    return result.mapLeft(
      (error: Error) => new Error(`Broadcast failed: ${error.message}`),
    );
  }

  async getConfig(request: ConfigRequest, domain = "ledger-button-domain") {
    const url = `${BACKEND_BASE_URL}/config?dAppIdentifier=${encodeURIComponent(
      request.dAppIdentifier,
    )}`;

    const headers = {
      "X-Ledger-Domain": domain,
    };

    const options: NetworkServiceOpts = {
      headers,
    };

    const result = await this.networkService.get<ConfigResponse>(url, options);

    return result
      .mapLeft(
        (error: Error) => new Error(`Get config failed: ${error.message}`),
      )
      .map((res: unknown) => ConfigResponseSchema.safeParse(res))
      .chain((parsed) =>
        parsed.success ? Right(parsed.data) : Left(parsed.error),
      );
  }

  async event(
    request: EventRequest,
    domain = "ledger-button-domain",
  ): Promise<Either<Error, EventResponse>> {
    const url = `${BACKEND_BASE_URL}/event`;

    const headers = {
      "Content-Type": "application/json",
      "X-Ledger-Domain": domain,
    };

    const options: NetworkServiceOpts = {
      headers,
    };

    const result = await this.networkService.post<EventResponse>(
      url,
      JSON.stringify(request),
      options,
    );

    return result.mapLeft(
      (error: Error) => new Error(`Event tracking failed: ${error.message}`),
    );
  }
}
