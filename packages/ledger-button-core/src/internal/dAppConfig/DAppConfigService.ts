import { EitherAsync } from "purify-ts";

import { DAppConfig, DAppConfigError } from "./types.js";

export interface DAppConfigService {
  get<K extends keyof DAppConfig>(
    key: K,
  ): EitherAsync<DAppConfigError, DAppConfig[K]>;
}
