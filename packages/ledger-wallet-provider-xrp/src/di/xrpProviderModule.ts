import { ContainerModule } from "inversify";

import { SignXrpTransaction } from "../use-case/SignXrpTransaction";
import { xrpProviderModuleTypes } from "./xrpProviderModuleTypes";

/**
 * Local Inversify module for the XRP provider. Loaded into the per-provider
 * container owned by {@link XrpBlockchainProvider}, on top of the
 * {@link xrpProviderModuleTypes.CoreFacade} and
 * {@link xrpProviderModuleTypes.BlockchainConfig} constants bound there.
 */
export function xrpProviderModule() {
  return new ContainerModule(({ bind }) => {
    bind(xrpProviderModuleTypes.SignTransactionUseCase).to(SignXrpTransaction);
  });
}
