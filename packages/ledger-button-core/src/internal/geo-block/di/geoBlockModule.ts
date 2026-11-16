import { ContainerModule } from "inversify";

import { DefaultGeoBlockDataSource } from "../datasource/DefaultGeoBlockDataSource";
import { CheckGeoBlockUseCase } from "../use-case/CheckGeoBlockUseCase";
import { HandleGeoBlockUseCase } from "../use-case/HandleGeoBlockUseCase";
import { geoBlockModuleTypes } from "./geoBlockModuleTypes";

export function geoBlockModuleFactory() {
  return new ContainerModule(({ bind }) => {
    bind(geoBlockModuleTypes.GeoBlockDataSource).to(DefaultGeoBlockDataSource);

    bind(geoBlockModuleTypes.HandleGeoBlockUseCase).to(HandleGeoBlockUseCase);

    bind(geoBlockModuleTypes.CheckGeoBlockUseCase).to(CheckGeoBlockUseCase);
  });
}
