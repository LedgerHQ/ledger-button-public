import { DAppConfigV2 } from "../model/dAppConfigV2Types.js";

export interface DAppConfigV2DataSource {
  getDAppConfig(): Promise<DAppConfigV2>;
}
