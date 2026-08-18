import { ContainerModule } from "inversify";

import { CalDataSource } from "../datasource/cal/CalDataSource";
import { DefaultCalDataSource } from "../datasource/cal/DefaultCalDataSource";
import { CoinServiceDataSource } from "../datasource/coinService/CoinServiceDataSource";
import { DefaultCoinServiceDataSource } from "../datasource/coinService/DefaultCoinServiceDataSource";
import { CounterValueDataSource } from "../datasource/countervalue/CounterValueDataSource";
import { DefaultCounterValueDataSource } from "../datasource/countervalue/DefaultCounterValueDataSource";
import { BalanceService } from "../service/BalanceService";
import { DefaultBalanceService } from "../service/DefaultBalanceService";
import { balanceModuleTypes } from "./balanceModuleTypes";

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
