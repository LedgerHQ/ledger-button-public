import { inject, injectable } from "inversify";
import { Either, Left, Right } from "purify-ts";

import { BroadcastTransactionError } from "@api/errors/NetworkErrors";
import { configModuleTypes } from "@internal/config/di/configModuleTypes";
import { Config } from "@internal/config/model/config";
import { networkModuleTypes } from "@internal/network/di/networkModuleTypes";
import type { NetworkServiceOpts } from "@internal/network/model/types";
import type { NetworkService } from "@internal/network/service/NetworkService";

import { ConfigResponseSchema } from "../model/schemas";
import type { EventRequest, EventResponse } from "../model/trackEvent";
import type {
  BroadcastRequest,
  BroadcastResponse,
  ConfigRequest,
  ConfigResponse,
} from "../model/types";
import type { BackendService } from "./BackendService";

@injectable()
export class DefaultBackendService implements BackendService {
  constructor(
    @inject(networkModuleTypes.NetworkService)
    private readonly networkService: NetworkService<NetworkServiceOpts>,
    @inject(configModuleTypes.Config)
    private readonly config: Config,
  ) {}

  async broadcast(
    request: BroadcastRequest,
    domain = "ledger-button-domain",
  ): Promise<Either<Error, BroadcastResponse>> {
    const url = `${this.config.getBackendUrl()}/broadcast`;

    const headers = {
      "Content-Type": "application/json",
      "X-Ledger-client-origin": this.config.originToken,
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

    return result.mapLeft((error: Error) => {
      return new BroadcastTransactionError(
        `Broadcast failed: ${error.message}`,
        {
          error,
        },
      );
    });
  }

  async getConfigV2(
    request: ConfigRequest,
    domain = this.config.dAppIdentifier,
  ) {
    const url = `${this.config.getBackendUrl()}/v2/config?dAppIdentifier=${encodeURIComponent(
      request.dAppIdentifier,
    )}`;

    const headers = {
      "X-Ledger-Domain": domain,
      "X-Ledger-client-origin": this.config.originToken,
    };

    const options: NetworkServiceOpts = {
      headers,
    };

    const result = await this.networkService.get<ConfigResponse>(url, options);

    return result
      .mapLeft(
        (error: Error) => new Error(`Get config V2 failed: ${error.message}`),
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
    const url = `${this.config.getBackendUrl()}/event`;

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
