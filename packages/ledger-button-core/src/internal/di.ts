import { Container } from "inversify";

import { dmkModuleFactory } from "./dmk/dmkModule.js";
import { networkModuleFactory } from "./network/networkModule.js";
import { storageModuleFactory } from "./storage/storageModule.js";

export type ContainerOptions = {
  stub?: boolean;
  supportedNetworks?: string[];
};

export async function createContainer({
  stub = false,
  supportedNetworks: _supportedNetworks = [],
}: ContainerOptions) {
  const container = new Container();

  await Promise.all([
    container.load(dmkModuleFactory({ stub })),
    container.load(storageModuleFactory({ stub })),
    container.load(networkModuleFactory({ stub })),
  ]);

  return container;
}
