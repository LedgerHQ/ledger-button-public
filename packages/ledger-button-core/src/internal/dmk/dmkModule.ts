import { LedgerButtonDmkBuilder } from "@ledgerhq/ledger-button-dmk";
import { ContainerModule } from "inversify";

import { ContainerOptions } from "../di.js";
import { dmkModuleTypes } from "./dmkModuleTypes.js";

type DmkModuleOptions = Pick<ContainerOptions, "stub">;

export function dmkModuleFactory({ stub }: DmkModuleOptions) {
  const dmk = LedgerButtonDmkBuilder();
  return new ContainerModule(({ bind, rebindSync }) => {
    bind(dmkModuleTypes.LedgerButtonDmk).toConstantValue(dmk);

    if (stub) {
      rebindSync(dmkModuleTypes.LedgerButtonDmk).toConstantValue({
        // TODO: Implement stub
      });
    }
  });
}
