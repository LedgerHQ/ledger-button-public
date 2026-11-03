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
   * leaves the user unblocked. A 451 flags the context through the shared
   * use case, so there is nothing to return.
   */
  async execute(): Promise<void> {
    const status = await this.geoBlockDataSource.getProbeStatus();

    status.ifJust((s) => {
      this.handleGeoBlock.execute(s);
    });
  }
}
