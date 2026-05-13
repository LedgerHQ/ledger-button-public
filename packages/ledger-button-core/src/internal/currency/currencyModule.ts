import { ContainerModule } from "inversify";

import { DefaultFiatCurrencyDataSource } from "./datasource/DefaultFiatCurrencyDataSource.js";
import { FiatCurrencyDataSource } from "./datasource/FiatCurrencyDataSource.js";
import { CurrencyService } from "./service/CurrencyService.js";
import { DefaultCurrencyService } from "./service/DefaultCurrencyService.js";
import { currencyModuleTypes } from "./currencyModuleTypes.js";

export function currencyModuleFactory() {
  return new ContainerModule(({ bind }) => {
    bind<FiatCurrencyDataSource>(currencyModuleTypes.FiatCurrencyDataSource)
      .to(DefaultFiatCurrencyDataSource)
      .inSingletonScope();

    bind<CurrencyService>(currencyModuleTypes.CurrencyService)
      .to(DefaultCurrencyService)
      .inSingletonScope();
  });
}
