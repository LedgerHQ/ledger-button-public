import { BroadcastRequest, ConfigRequest } from "../model/types.js";

export interface BackendService {
  broadcast(request: BroadcastRequest): Promise;
  getConfig(request: ConfigRequest): Promise;
}
