import { DeviceActionStatus } from "@ledgerhq/device-management-kit";
import { getBase58Decoder } from "@solana/kit";
import { lastValueFrom, of } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CoreFacade } from "../../../api/blockchain-provider/model/CoreFacade.js";
import { AccountNotSelectedError } from "../../../api/errors/DeviceFlowErrors.js";
import type { BlockchainConfig } from "../../../api/model/dappConfig/BlockchainConfig.js";
import { SignSolanaMessage } from "./SignSolanaMessage.js";

const SOLANA_ADDRESS = "11111111111111111111111111111111";
const signatureBytes = new Uint8Array(64).fill(3);
const signatureBase58 = getBase58Decoder().decode(signatureBytes);

const account = {
  id: "solana:1",
  currencyId: "solana",
  freshAddress: SOLANA_ADDRESS,
  seedIdentifier: "seed",
  derivationMode: "",
  index: 0,
  name: "Solana 1",
  ticker: "SOL",
  balance: undefined,
  tokens: [],
};

const blockchainConfig: BlockchainConfig = {
  blockchain: "solana",
  appName: "Solana",
  networks: [],
  rpcMethods: { local: [], broadcasted: [] },
  appDependencies: { appName: "Solana", dependencies: ["Solana"] },
};

const params = {
  kind: "solana-message" as const,
  address: SOLANA_ADDRESS,
  message: new TextEncoder().encode("hello"),
};

describe("SignSolanaMessage", () => {
  let executeDeviceAction: ReturnType<typeof vi.fn>;
  let core: CoreFacade;
  const logger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
  };

  const createUseCase = () => new SignSolanaMessage(core, blockchainConfig);

  beforeEach(() => {
    vi.clearAllMocks();
    executeDeviceAction = vi.fn(() => ({
      observable: of({
        status: DeviceActionStatus.Completed,
        output: { signature: signatureBase58 },
      }),
    }));
    core = {
      getLogger: vi.fn(() => logger),
      getDeviceSession: vi.fn(() => ({
        dmk: { executeDeviceAction },
        sessionId: "session-1",
        isConnected: true,
      })),
    } as unknown as CoreFacade;
  });

  it("emits an error status when no account is selected", async () => {
    const status = await lastValueFrom(
      createUseCase().execute(params, undefined),
    );

    expect(status.status).toBe("error");
    if (status.status !== "error") {
      throw new Error("Expected error status");
    }
    expect(status.error).toBeInstanceOf(AccountNotSelectedError);
  });

  it("opens the Solana app with its dependencies and maps a completed state to success", async () => {
    const status = await lastValueFrom(
      createUseCase().execute(params, account),
    );

    expect(executeDeviceAction).toHaveBeenCalledTimes(1);
    expect(status).toEqual({
      signType: "solana-message",
      status: "success",
      data: { signature: signatureBase58 },
    });
  });

  it("builds the open-app config from the blockchain config", () => {
    const openAppInput = createUseCase().createOpenAppConfig();

    expect(openAppInput).toEqual({
      application: { name: "Solana" },
      dependencies: [{ name: "Solana" }],
      requireLatestFirmware: false,
    });
  });

  it("maps a device-action error state to an error status", async () => {
    executeDeviceAction.mockReturnValue({
      observable: of({
        status: DeviceActionStatus.Error,
        error: new Error("device error"),
      }),
    });

    const status = await lastValueFrom(
      createUseCase().execute(params, account),
    );

    expect(status.status).toBe("error");
  });
});
