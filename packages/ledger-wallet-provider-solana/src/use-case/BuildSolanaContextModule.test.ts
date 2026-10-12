import { ContextModuleChainID } from "@ledgerhq/context-module";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockCoreFacade } from "../__mocks__/coreFacadeMock";
import { BuildSolanaContextModule } from "./BuildSolanaContextModule";

const mocks = vi.hoisted(() => ({
  builderConstructor: vi.fn(),
  setAppSource: vi.fn(),
  setCalConfig: vi.fn(),
  setWeb3ChecksConfig: vi.fn(),
  setChain: vi.fn(),
  build: vi.fn(),
}));

vi.mock("@ledgerhq/context-module", async (importActual) => {
  const actual =
    await importActual<typeof import("@ledgerhq/context-module")>();

  class ContextModuleBuilder {
    constructor(args: unknown) {
      mocks.builderConstructor(args);
    }
    setAppSource(appSource: unknown) {
      mocks.setAppSource(appSource);
      return this;
    }
    setCalConfig(calConfig: unknown) {
      mocks.setCalConfig(calConfig);
      return this;
    }
    setWeb3ChecksConfig(web3ChecksConfig: unknown) {
      mocks.setWeb3ChecksConfig(web3ChecksConfig);
      return this;
    }
    setChain(chain: unknown) {
      mocks.setChain(chain);
      return this;
    }
    build() {
      return mocks.build();
    }
  }

  return { ...actual, ContextModuleBuilder };
});

describe("BuildSolanaContextModule", () => {
  let useCase: BuildSolanaContextModule;
  const fakeContextModule = { id: "context-module" };

  const core = createMockCoreFacade({
    getSdkConfig: () => ({
      originToken: "origin-token",
      dAppIdentifier: "dapp-identifier",
    }),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.build.mockReturnValue(fakeContextModule);
    useCase = new BuildSolanaContextModule(core);
  });

  it("should build a Solana context module wired with the config and chain", () => {
    const result = useCase.execute();

    expect(mocks.builderConstructor).toHaveBeenCalledWith({
      originToken: "origin-token",
    });
    expect(mocks.setAppSource).toHaveBeenCalledWith("dapp-identifier");
    expect(mocks.setChain).toHaveBeenCalledWith(ContextModuleChainID.Solana);
    expect(mocks.setCalConfig).not.toHaveBeenCalled();
    expect(mocks.setWeb3ChecksConfig).not.toHaveBeenCalled();
    expect(mocks.build).toHaveBeenCalledTimes(1);
    expect(result).toBe(fakeContextModule);
  });

  it("should point clear signing at the connect gateway when trial endpoints are set", () => {
    const trialCore = createMockCoreFacade({
      getSdkConfig: () => ({
        originToken: "origin-token",
        dAppIdentifier: "dapp-identifier",
        clearSigningEndpoints: {
          calUrl: "https://connect.api.prd.ledger.com/cal/v1",
          transactionCheckUrl:
            "https://connect.api.prd.ledger.com/transaction-checks/v3",
        },
      }),
    });
    const trialUseCase = new BuildSolanaContextModule(trialCore);

    trialUseCase.execute();

    expect(mocks.setCalConfig).toHaveBeenCalledWith({
      url: "https://connect.api.prd.ledger.com/cal/v1",
      mode: "prod",
      branch: "main",
    });
    expect(mocks.setWeb3ChecksConfig).toHaveBeenCalledWith({
      url: "https://connect.api.prd.ledger.com/transaction-checks/v3",
    });
  });
});
