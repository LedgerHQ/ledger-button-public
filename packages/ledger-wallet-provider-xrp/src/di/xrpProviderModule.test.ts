import type {
  BlockchainConfig,
  CoreFacade,
} from "@ledgerhq/ledger-wallet-provider-core";
import { Container } from "inversify";
import { describe, expect, it } from "vitest";

import {
  createMockCoreFacade,
  XRP_TEST_BLOCKCHAIN_CONFIG,
} from "../__mocks__/coreFacadeMock";
import { SignXrpTransaction } from "../use-case/SignXrpTransaction";
import { xrpProviderModule } from "./xrpProviderModule";
import { xrpProviderModuleTypes } from "./xrpProviderModuleTypes";

describe("xrpProviderModule (per-provider container)", () => {
  const createLocalContainer = () => {
    const container = new Container();
    container
      .bind<CoreFacade>(xrpProviderModuleTypes.CoreFacade)
      .toConstantValue(createMockCoreFacade());
    container
      .bind<BlockchainConfig>(xrpProviderModuleTypes.BlockchainConfig)
      .toConstantValue(XRP_TEST_BLOCKCHAIN_CONFIG);
    container.loadSync(xrpProviderModule());
    return container;
  };

  it("resolves the SignXrpTransaction use-case", () => {
    expect(
      createLocalContainer().get<SignXrpTransaction>(
        xrpProviderModuleTypes.SignTransactionUseCase,
      ),
    ).toBeInstanceOf(SignXrpTransaction);
  });
});
