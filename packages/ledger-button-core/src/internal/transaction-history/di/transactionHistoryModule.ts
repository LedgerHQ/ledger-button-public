import { ContainerModule } from "inversify";

import { DefaultTransactionHistoryDataSource } from "../datasource/coinService/DefaultTransactionHistoryDataSource";
import type { TransactionHistoryDataSource } from "../datasource/coinService/TransactionHistoryDataSource";
import { FetchTransactionHistoryUseCase } from "../use-case/FetchTransactionHistoryUseCase";
import { HydrateTransactionsWithFiatUseCase } from "../use-case/HydrateTransactionsWithFiatUseCase";
import { transactionHistoryModuleTypes } from "./transactionHistoryModuleTypes";

type TransactionHistoryModuleOptions = {
  stub?: boolean;
};

export function transactionHistoryModuleFactory({
  stub,
}: TransactionHistoryModuleOptions) {
  return new ContainerModule(({ bind }) => {
    bind<TransactionHistoryDataSource>(
      transactionHistoryModuleTypes.TransactionHistoryDataSource,
    )
      .to(DefaultTransactionHistoryDataSource)
      .inSingletonScope();

    bind<FetchTransactionHistoryUseCase>(
      transactionHistoryModuleTypes.FetchTransactionHistoryUseCase,
    )
      .to(FetchTransactionHistoryUseCase)
      .inSingletonScope();

    bind<HydrateTransactionsWithFiatUseCase>(
      transactionHistoryModuleTypes.HydrateTransactionsWithFiatUseCase,
    )
      .to(HydrateTransactionsWithFiatUseCase)
      .inSingletonScope();

    if (stub) {
      // TODO: Add stub implementations for testing
    }
  });
}
