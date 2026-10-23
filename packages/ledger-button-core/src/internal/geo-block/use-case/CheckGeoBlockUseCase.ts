import { inject, injectable } from "inversify";

import type { GeoBlockDataSource } from "../datasource/GeoBlockDataSource";
import { geoBlockModuleTypes } from "../di/geoBlockModuleTypes";
import { HandleGeoBlockUseCase } from "./HandleGeoBlockUseCase";

@injectable()
export class CheckGeoBlockUseCase {
  constructor(
    @inject(geoBlockModuleTypes.GeoBlockDataSource)
    private readonly geoBlockDataSource: GeoBlockDataSource,
    @inject(geoBlockModuleTypes.HandleGeoBlockUseCase)
    private readonly handleGeoBlock: HandleGeoBlockUseCase,
  ) {}

  /**
   * Fail-open: anything but a 451 (other status, network error, timeout)
   * leaves the user unblocked.
   */
  async execute(): Promise<boolean> {
    const status = await this.geoBlockDataSource.getProbeStatus();

    return status.map((s) => this.handleGeoBlock.execute(s)).orDefault(false);
  }
}
