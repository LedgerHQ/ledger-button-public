import { DAppConfig } from "../model/dAppConfigTypes.js";

export interface DAppConfigDataSource {
  getDAppConfig(): Promise<DAppConfig>;
}
