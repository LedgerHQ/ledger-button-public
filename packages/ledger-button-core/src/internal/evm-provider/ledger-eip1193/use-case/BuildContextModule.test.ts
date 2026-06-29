import { ContextModuleChainID } from "@ledgerhq/context-module";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockCoreFacade } from "../../../blockchain-provider/__mocks__/coreFacadeMock.js";
import { BuildContextModule } from "./BuildContextModule.js";

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

describe("BuildContextModule", () => {
  let useCase: BuildContextModule;
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
    useCase = new BuildContextModule(core);
  });

  it("should build a context module wired with the config and chain", () => {
    const result = useCase.execute({ chain: ContextModuleChainID.Ethereum });

    expect(mocks.builderConstructor).toHaveBeenCalledWith({
      originToken: "origin-token",
    });
    expect(mocks.setAppSource).toHaveBeenCalledWith("dapp-identifier");
    expect(mocks.setChain).toHaveBeenCalledWith(ContextModuleChainID.Ethereum);
    expect(mocks.build).toHaveBeenCalledTimes(1);
    expect(result).toBe(fakeContextModule);
  });

  it("should forward the requested chain to the builder", () => {
    useCase.execute({ chain: ContextModuleChainID.Solana });

    expect(mocks.setChain).toHaveBeenCalledWith(ContextModuleChainID.Solana);
  });
});
