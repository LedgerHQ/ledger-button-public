import { ContainerModule } from "inversify";

import { DefaultFiatCurrencyDataSource } from "../datasource/DefaultFiatCurrencyDataSource";
import { FiatCurrencyDataSource } from "../datasource/FiatCurrencyDataSource";
import { CurrencyService } from "../service/CurrencyService";
import { DefaultCurrencyService } from "../service/DefaultCurrencyService";
import { ResolveCurrencyDecimalsUseCase } from "../use-case/ResolveCurrencyDecimalsUseCase";
import { currencyModuleTypes } from "./currencyModuleTypes";

export function currencyModuleFactory() {
  return new ContainerModule(({ bind }) => {
    bind<FiatCurrencyDataSource>(currencyModuleTypes.FiatCurrencyDataSource)
      .to(DefaultFiatCurrencyDataSource)
      .inSingletonScope();

    bind<CurrencyService>(currencyModuleTypes.CurrencyService)
      .to(DefaultCurrencyService)
      .inSingletonScope();

    bind<ResolveCurrencyDecimalsUseCase>(
      currencyModuleTypes.ResolveCurrencyDecimalsUseCase,
    )
      .to(ResolveCurrencyDecimalsUseCase)
      .inSingletonScope();
  });
}
