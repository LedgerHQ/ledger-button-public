import type {
  BlockchainConfig,
  CoreFacade,
} from "@ledgerhq/ledger-wallet-provider-core";
import { Container } from "inversify";
import { describe, expect, it } from "vitest";

import { createMockCoreFacade } from "../__mocks__/coreFacadeMock.js";
import { BuildSolanaContextModule } from "../use-case/BuildSolanaContextModule.js";
import { SignSolanaTransaction } from "../use-case/SignSolanaTransaction.js";
import { solanaProviderModule } from "./solanaProviderModule.js";
import { solanaProviderModuleTypes } from "./solanaProviderModuleTypes.js";

const createBlockchainConfig = (): BlockchainConfig => ({
  blockchain: "solana",
  appName: "Solana",
  networks: [],
  rpcMethods: { local: [], broadcasted: [] },
  appDependencies: { appName: "Solana", dependencies: [] },
});

describe("solanaProviderModule (per-provider container)", () => {
  const createLocalContainer = () => {
    const container = new Container();
    container
      .bind<CoreFacade>(solanaProviderModuleTypes.CoreFacade)
      .toConstantValue(createMockCoreFacade());
    container
      .bind<BlockchainConfig>(solanaProviderModuleTypes.BlockchainConfig)
      .toConstantValue(createBlockchainConfig());
    container.loadSync(solanaProviderModule());
    return container;
  };

  it("resolves the SignSolanaTransaction use-case", () => {
    expect(
      createLocalContainer().get<SignSolanaTransaction>(
        solanaProviderModuleTypes.SignTransactionUseCase,
      ),
    ).toBeInstanceOf(SignSolanaTransaction);
  });

  it("resolves the BuildSolanaContextModule use-case", () => {
    expect(
      createLocalContainer().get<BuildSolanaContextModule>(
        solanaProviderModuleTypes.BuildContextModuleUseCase,
      ),
    ).toBeInstanceOf(BuildSolanaContextModule);
  });
});
