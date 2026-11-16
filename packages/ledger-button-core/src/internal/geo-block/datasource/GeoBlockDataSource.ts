import type { Maybe } from "purify-ts";

export interface GeoBlockDataSource {
  /**
   * Status of the geo-block probe. `Nothing` when the probe could not get an
   * answer (network error or timeout).
   */
  getProbeStatus(): Promise<Maybe<number>>;
}
