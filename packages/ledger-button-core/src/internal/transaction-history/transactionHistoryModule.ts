import { ContainerModule } from "inversify";

import type { CurrencyMetadataProvider } from "./application/port/CurrencyMetadataProvider.js";
import type { TransactionHistoryDataSource } from "./application/port/TransactionHistoryDataSource.js";
import { FetchTransactionHistoryUseCase } from "./application/use-case/FetchTransactionHistoryUseCase.js";
import { HydrateTransactionsWithFiatUseCase } from "./application/use-case/HydrateTransactionsWithFiatUseCase.js";
import { DefaultTransactionHistoryDataSource } from "./infrastructure/coinService/DefaultTransactionHistoryDataSource.js";
import { DefaultCurrencyMetadataProvider } from "./infrastructure/DefaultCurrencyMetadataProvider.js";
import { transactionHistoryModuleTypes } from "./transactionHistoryModuleTypes.js";

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

    bind<CurrencyMetadataProvider>(
      transactionHistoryModuleTypes.CurrencyMetadataProvider,
    )
      .to(DefaultCurrencyMetadataProvider)
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
