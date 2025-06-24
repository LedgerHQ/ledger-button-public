import { createContainer } from "../internal/di.js";

export const initLedgerButtonCore = async () => {
  const container = await createContainer({});

  return container;
};
