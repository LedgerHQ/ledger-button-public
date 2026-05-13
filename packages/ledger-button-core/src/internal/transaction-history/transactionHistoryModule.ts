import { ContainerModule } from "inversify";

import { DefaultTransactionHistoryDataSource } from "./datasource/coinService/DefaultTransactionHistoryDataSource.js";
import type { TransactionHistoryDataSource } from "./datasource/TransactionHistoryDataSource.js";
import type { CurrencyMetadataProvider } from "./service/CurrencyMetadataProvider.js";
import { DefaultCurrencyMetadataProvider } from "./service/DefaultCurrencyMetadataProvider.js";
import { FetchTransactionHistoryUseCase } from "./use-case/FetchTransactionHistoryUseCase.js";
import { HydrateTransactionsWithFiatUseCase } from "./use-case/HydrateTransactionsWithFiatUseCase.js";
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
