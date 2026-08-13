import { ContextModuleChainID } from "@ledgerhq/context-module";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockCoreFacade } from "@internal/blockchain-provider/__mocks__/coreFacadeMock.js";

import { BuildSolanaContextModule } from "./BuildSolanaContextModule.js";

const mocks = vi.hoisted(() => ({
  builderConstructor: vi.fn(),
  setAppSource: vi.fn(),
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
    expect(mocks.build).toHaveBeenCalledTimes(1);
    expect(result).toBe(fakeContextModule);
  });
});
