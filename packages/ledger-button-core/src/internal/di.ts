import { Container } from "inversify";

import { dmkModuleFactory } from "./dmk/dmkModule.js";

export type ContainerOptions = {
  stub?: boolean;
  supportedNetworks?: string[];
};

export async function createContainer({
  stub = false,
  supportedNetworks = [],
}: ContainerOptions) {
  const container = new Container();

  await container.load(dmkModuleFactory({ stub }));

  return container;
}
