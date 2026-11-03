import { inject, injectable } from "inversify";
import { Just, Maybe, Nothing } from "purify-ts";

import { configModuleTypes } from "@internal/config/di/configModuleTypes";
import type { Config } from "@internal/config/model/config";

import {
  GEO_BLOCK_PROBE_PATH,
  GEO_BLOCK_PROBE_TIMEOUT_MS,
} from "../model/constant";
import type { GeoBlockDataSource } from "./GeoBlockDataSource";

/**
 * Reads the status only: a 451 body is HTML, so the JSON based network service
 * cannot be reused here.
 */
@injectable()
export class DefaultGeoBlockDataSource implements GeoBlockDataSource {
  constructor(
    @inject(configModuleTypes.Config)
    private readonly config: Config,
  ) {}

  async getProbeStatus(): Promise<Maybe<number>> {
    try {
      const response = await fetch(
        `${this.config.getCounterValueUrl()}${GEO_BLOCK_PROBE_PATH}`,
        { signal: AbortSignal.timeout(GEO_BLOCK_PROBE_TIMEOUT_MS) },
      );
      return Just(response.status);
    } catch {
      return Nothing;
    }
  }
}
