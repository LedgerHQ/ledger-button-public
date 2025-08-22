import { ContainerModule } from "inversify";

import { DefaultTransactionService } from "./service/DefaultTransactionService.js";
import { TransactionService } from "./service/TransactionService.js";
import { ContainerOptions } from "../diTypes.js";
import { transactionModuleTypes } from "./transactionModuleTypes.js";

type TransactionModuleOptions = Pick<ContainerOptions, "stub">;

export function transactionModuleFactory({
  stub: _stub,
}: TransactionModuleOptions) {
  return new ContainerModule(({ bind }) => {
    bind<TransactionService>(transactionModuleTypes.TransactionService)
      .to(DefaultTransactionService)
      .inSingletonScope();
  });
}
