import { ContainerModule } from "inversify";

import { DefaultPendingTransactionController } from "../controller/DefaultPendingTransactionController";
import { DefaultPendingTransactionStorageService } from "../service/DefaultPendingTransactionStorageService";
import { ConfirmPendingTransactionsUseCase } from "../use-case/ConfirmPendingTransactionsUseCase";
import { HydratePendingTransactionsWithFiatUseCase } from "../use-case/HydratePendingTransactionsWithFiatUseCase";
import { TrackBroadcastedTransactionUseCase } from "../use-case/TrackBroadcastedTransactionUseCase";
import { pendingTransactionModuleTypes } from "./pendingTransactionModuleTypes";

export function pendingTransactionModuleFactory() {
  return new ContainerModule(({ bind }) => {
    bind(pendingTransactionModuleTypes.PendingTransactionStorageService)
      .to(DefaultPendingTransactionStorageService)
      .inSingletonScope();

    bind(pendingTransactionModuleTypes.TrackBroadcastedTransactionUseCase).to(
      TrackBroadcastedTransactionUseCase,
    );

    bind(pendingTransactionModuleTypes.ConfirmPendingTransactionsUseCase).to(
      ConfirmPendingTransactionsUseCase,
    );

    bind(
      pendingTransactionModuleTypes.HydratePendingTransactionsWithFiatUseCase,
    ).to(HydratePendingTransactionsWithFiatUseCase);

    bind(pendingTransactionModuleTypes.PendingTransactionController)
      .to(DefaultPendingTransactionController)
      .inSingletonScope();
  });
}
