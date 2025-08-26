import { inject, injectable } from "inversify";
import { Left } from "purify-ts";
import type { Either } from "purify-ts";

import type { NetworkServiceOpts } from "../../network/DefaultNetworkService.js";
import { networkModuleTypes } from "../../network/networkModuleTypes.js";
import type { NetworkService } from "../../network/NetworkService.js";
import type {
  BroadcastRequest,
  BroadcastResponse,
  ConfigRequest,
  ConfigResponse,
} from "../model/types.js";
import type { BackendService } from "./BackendService.js";

const BACKEND_BASE_URL = "https://ledgerb.aws.stg.ldg-tech.com";

@injectable()
export class DefaultBackendService implements BackendService {
  constructor(
    @inject(networkModuleTypes.NetworkService)
    private readonly networkService: NetworkService<NetworkServiceOpts>,
  ) {}
