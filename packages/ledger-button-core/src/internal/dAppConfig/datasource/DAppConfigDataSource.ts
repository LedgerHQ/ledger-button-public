import { DAppConfig } from "../model/dAppConfigTypes";

export interface DAppConfigDataSource {
  getDAppConfig(): Promise<DAppConfig>;
}
