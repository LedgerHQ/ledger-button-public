import { Container } from "inversify";
import { describe, expect, it } from "vitest";

import type { CoreFacade } from "../../../api/blockchain-provider/model/CoreFacade.js";
import type { BlockchainConfig } from "../../../api/model/dappConfig/BlockchainConfig.js";
import { createMockCoreFacade } from "../../blockchain-provider/__mocks__/coreFacadeMock.js";
import { createContainer } from "../../di.js";
import { SolanaRemoteDatasource } from "../datasource/rpc/SolanaRemoteDatasource.js";
import { StubSolanaRemoteDatasource } from "../datasource/rpc/StubSolanaRemoteDatasource.js";
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

describe("solanaProviderModule", () => {
  it("should resolve SolanaRemoteDatasource from the root container", () => {
    const container = createContainer({
      devConfig: {
        stub: {
          solanaProvider: false,
        },
      },
    });

    expect(
      container.get<SolanaRemoteDatasource>(
        solanaProviderModuleTypes.SolanaRemoteDatasource,
      ),
    ).toBeInstanceOf(SolanaRemoteDatasource);
  });

  it("should bind StubSolanaRemoteDatasource when solanaProvider stub is enabled", () => {
    const container = createContainer({
      devConfig: {
        stub: {
          solanaProvider: true,
        },
      },
    });

    expect(
      container.get<SolanaRemoteDatasource>(
        solanaProviderModuleTypes.SolanaRemoteDatasource,
      ),
    ).toBeInstanceOf(StubSolanaRemoteDatasource);
  });

  it("should return unsupported method error from stub datasource", async () => {
    const container = createContainer({
      devConfig: {
        stub: {
          solanaProvider: true,
        },
      },
    });

    const datasource = container.get<SolanaRemoteDatasource>(
      solanaProviderModuleTypes.SolanaRemoteDatasource,
    );

    const response = await datasource.JSONRPCRequest({
      jsonrpc: "2.0",
      id: 1,
      method: "getBalance",
      params: [],
    });

    expect(response.isRight()).toBe(true);
    expect(response.extract()).toMatchObject({
      jsonrpc: "2.0",
      id: 1,
      error: {
        code: -32601,
        message: expect.stringContaining("getBalance"),
      },
    });
  });
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
