import { ContainerModule } from "inversify";

import { CalDataSource } from "./datasource/cal/CalDataSource.js";
import { DefaultCalDataSource } from "./datasource/cal/DefaultCalDataSource.js";
import { CoinServiceDataSource } from "./datasource/coinService/CoinServiceDataSource.js";
import { DefaultCoinServiceDataSource } from "./datasource/coinService/DefaultCoinServiceDataSource.js";
import { CounterValueDataSource } from "./datasource/countervalue/CounterValueDataSource.js";
import { DefaultCounterValueDataSource } from "./datasource/countervalue/DefaultCounterValueDataSource.js";
import { BalanceService } from "./service/BalanceService.js";
import { DefaultBalanceService } from "./service/DefaultBalanceService.js";
import { balanceModuleTypes } from "./balanceModuleTypes.js";

type BalanceModuleOptions = {
  stub?: boolean;
};

export function balanceModuleFactory({ stub }: BalanceModuleOptions) {
  return new ContainerModule(({ bind }) => {
    bind<BalanceService>(balanceModuleTypes.BalanceService)
      .to(DefaultBalanceService)
      .inSingletonScope();

    bind<CoinServiceDataSource>(balanceModuleTypes.CoinServiceDataSource)
      .to(DefaultCoinServiceDataSource)
      .inSingletonScope();

    bind<CalDataSource>(balanceModuleTypes.CalDataSource)
      .to(DefaultCalDataSource)
      .inSingletonScope();

    bind<CounterValueDataSource>(balanceModuleTypes.CounterValueDataSource)
      .to(DefaultCounterValueDataSource)
      .inSingletonScope();

    if (stub) {
      /*
      rebindSync<CoinServiceDataSource>(balanceModuleTypes.CoinServiceDataSource)
        .to(StubCoinServiceDataSource)
        .inSingletonScope();
*/
      //TODO: add stubs for CalDataSource and CoinServiceDataSource
    }
  });
}
