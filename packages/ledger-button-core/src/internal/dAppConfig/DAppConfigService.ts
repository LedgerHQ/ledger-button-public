import { EitherAsync } from "purify-ts";

import { DAppConfig } from "./types.js";

export interface DAppConfigService {
  get<K extends keyof DAppConfig>(key: K): EitherAsync<Error, DAppConfig[K]>;
}
