import { ContainerModule } from "inversify";

import { DefaultFiatCurrencyDataSource } from "./datasource/DefaultFiatCurrencyDataSource.js";
import { FiatCurrencyDataSource } from "./datasource/FiatCurrencyDataSource.js";
import { DefaultFiatCatalogService } from "./service/DefaultFiatCatalogService.js";
import { FiatCatalogService } from "./service/FiatCatalogService.js";
import { currencyModuleTypes } from "./currencyModuleTypes.js";

export function currencyModuleFactory() {
  return new ContainerModule(({ bind }) => {
    bind<FiatCurrencyDataSource>(currencyModuleTypes.FiatCurrencyDataSource)
      .to(DefaultFiatCurrencyDataSource)
      .inSingletonScope();

    bind<FiatCatalogService>(currencyModuleTypes.FiatCatalogService)
      .to(DefaultFiatCatalogService)
      .inSingletonScope();
  });
}
