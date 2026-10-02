import {
  DeviceActionStatus,
  UnsupportedFirmwareDAError,
} from "@ledgerhq/device-management-kit";
import type { BlockchainConfig } from "@ledgerhq/ledger-wallet-provider-core";
import type { ProviderAccount } from "@ledgerhq/ledger-wallet-provider-core";
import { DeviceFirmwareOutdatedError } from "@ledgerhq/ledger-wallet-provider-core";
import { lastValueFrom, of } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockCoreFacade } from "../__mocks__/coreFacadeMock";
import type { BuildContextModule } from "./BuildContextModule";
import { SignPersonalMessageUseCase } from "./SignPersonalMessageUseCase";

const account: ProviderAccount = {
  id: "ethereum:1",
  currencyId: "ethereum",
  freshAddress: "0xabc",
  derivationMode: "",
  index: 0,
};

const blockchainConfig: BlockchainConfig = {
  blockchain: "ethereum",
  appName: "Ethereum",
  networks: [],
  rpcMethods: { local: [], broadcasted: [] },
  appDependencies: {
    appName: "Ethereum",
    dependencies: [{ name: "Ethereum" }],
  },
};

describe("SignPersonalMessageUseCase", () => {
  let executeDeviceAction: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    executeDeviceAction = vi.fn();
  });

  it("maps UnsupportedFirmwareDAError to DeviceFirmwareOutdatedError", async () => {
    executeDeviceAction.mockReturnValue({
      observable: of({
        status: DeviceActionStatus.Error,
        error: new UnsupportedFirmwareDAError(
          "Application Ethereum needs latest firmware",
        ),
      }),
    });

    const useCase = new SignPersonalMessageUseCase(
      createMockCoreFacade({
        getDeviceSession: () => ({
          dmk: { executeDeviceAction } as never,
          sessionId: "session-1",
          isConnected: true,
        }),
      }),
      blockchainConfig,
      { execute: vi.fn() } as unknown as BuildContextModule,
    );

    const status = await lastValueFrom(
      useCase.execute(["0xabc", "0x01", "personal_sign"], account),
    );

    expect(status.status).toBe("error");
    if (status.status !== "error") {
      throw new Error("Expected error status");
    }
    expect(status.error).toBeInstanceOf(DeviceFirmwareOutdatedError);
    expect(status.error).toMatchObject({ context: { appName: "Ethereum" } });
  });
});
