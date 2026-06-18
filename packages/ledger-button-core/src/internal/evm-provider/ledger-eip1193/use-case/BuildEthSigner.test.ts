import { ContextModuleChainID } from "@ledgerhq/context-module";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Config } from "../../config/model/config.js";
import { createMockDeviceManagementKitService } from "../../device/__tests__/mocks.js";
import type { DeviceManagementKitService } from "../../device/service/DeviceManagementKitService.js";
import { BuildContextModule } from "./BuildContextModule.js";
import { BuildEthSigner } from "./BuildEthSigner.js";

const mocks = vi.hoisted(() => ({
  builderConstructor: vi.fn(),
  withContextModule: vi.fn(),
  build: vi.fn(),
}));

vi.mock("@ledgerhq/device-signer-kit-ethereum", async (importActual) => {
  const actual = await importActual<
    typeof import("@ledgerhq/device-signer-kit-ethereum")
  >();

  class SignerEthBuilder {
    constructor(args: unknown) {
      mocks.builderConstructor(args);
    }
    withContextModule(contextModule: unknown) {
      mocks.withContextModule(contextModule);
      return this;
    }
    build() {
      return mocks.build();
    }
  }

  return { ...actual, SignerEthBuilder };
});

describe("BuildEthSigner", () => {
  let useCase: BuildEthSigner;
  let mockDeviceManagementKitService: ReturnType<
    typeof createMockDeviceManagementKitService
  >;
  let buildContextModule: { execute: ReturnType<typeof vi.fn> };

  const fakeContextModule = { id: "context-module" };
  const fakeSigner = { id: "eth-signer" };
  const fakeDmk = { id: "dmk" };

  const config = new Config({
    originToken: "origin-token",
    dAppIdentifier: "dapp-identifier",
  });

  beforeEach(() => {
    vi.clearAllMocks();

    mockDeviceManagementKitService = createMockDeviceManagementKitService();
    mockDeviceManagementKitService.dmk = fakeDmk;

    mocks.build.mockReturnValue(fakeSigner);

    buildContextModule = {
      execute: vi.fn().mockReturnValue(fakeContextModule),
    };

    useCase = new BuildEthSigner(
      mockDeviceManagementKitService as unknown as DeviceManagementKitService,
      config,
      buildContextModule as unknown as BuildContextModule,
    );
  });

  it("should build an eth signer using the context module and the session", () => {
    const result = useCase.execute({
      sessionId: "session-123",
      chain: ContextModuleChainID.Ethereum,
    });

    expect(buildContextModule.execute).toHaveBeenCalledWith({
      chain: ContextModuleChainID.Ethereum,
    });
    expect(mocks.builderConstructor).toHaveBeenCalledWith({
      dmk: fakeDmk,
      originToken: "origin-token",
      sessionId: "session-123",
    });
    expect(mocks.withContextModule).toHaveBeenCalledWith(fakeContextModule);
    expect(mocks.build).toHaveBeenCalledTimes(1);
    expect(result).toBe(fakeSigner);
  });
});
