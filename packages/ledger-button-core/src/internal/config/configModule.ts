import { ContainerModule } from "inversify";

import { Config } from "./model/config.js";
import { type ContainerOptions } from "../diTypes.js";
import { configModuleTypes } from "./configModuleTypes.js";

type ConfigModuleOptions = Pick<
  ContainerOptions,
  "loggerLevel" | "apiKey" | "dAppIdentifier" | "environment"
>;

export function configModuleFactory({
  loggerLevel,
  apiKey,
  dAppIdentifier,
  environment,
}: ConfigModuleOptions) {
  return new ContainerModule(({ bind }) => {
    bind<Config>(configModuleTypes.Config).toResolvedValue(() => {
      return new Config({
        logLevel: loggerLevel,
        originToken: apiKey,
        dAppIdentifier: dAppIdentifier,
        environment,
      });
    });
  });
}
