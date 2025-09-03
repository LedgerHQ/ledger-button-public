import type { Either } from "purify-ts";

import type {
  BroadcastRequest,
  BroadcastResponse,
  ConfigRequest,
  ConfigResponse,
  ConfigResponseError,
} from "./types.js";

export interface BackendService {
  broadcast(
    request: BroadcastRequest,
    clientOrigin?: string,
    domain?: string,
  ): Promise<Either<Error, BroadcastResponse>>;

  getConfig(
    request: ConfigRequest,
    domain?: string,
  ): Promise<Either<ConfigResponseError, ConfigResponse>>;
}
