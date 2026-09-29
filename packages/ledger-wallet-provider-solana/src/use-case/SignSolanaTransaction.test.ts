import {
  DeviceActionStatus,
  UnsupportedFirmwareDAError,
} from "@ledgerhq/device-management-kit";
import type { CoreFacade } from "@ledgerhq/ledger-wallet-provider-core";
import type { ProviderAccount } from "@ledgerhq/ledger-wallet-provider-core";
import type { BlockchainConfig } from "@ledgerhq/ledger-wallet-provider-core";
import type { SignFlowStatus } from "@ledgerhq/ledger-wallet-provider-core";
import { DeviceFirmwareOutdatedError } from "@ledgerhq/ledger-wallet-provider-core";
import { defer, from, lastValueFrom, of } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockCoreFacade } from "../__mocks__/coreFacadeMock";
import type { BuildSolanaContextModule } from "./BuildSolanaContextModule";
import { SignSolanaTransaction } from "./SignSolanaTransaction";

const SOLANA_ADDRESS = "11111111111111111111111111111111";

const createAccount = (
  overrides: Partial<ProviderAccount> = {},
): ProviderAccount => ({
  id: "solana:1",
  currencyId: "solana",
  freshAddress: SOLANA_ADDRESS,
  derivationMode: "solanaSub",
  index: 0,
  ...overrides,
});

const createBlockchainConfig = (): BlockchainConfig => ({
  blockchain: "solana",
  appName: "Solana",
  networks: [],
  rpcMethods: { local: [], broadcasted: [] },
  appDependencies: { appName: "Solana", dependencies: [{ name: "Solana" }] },
});

describe("SignSolanaTransaction", () => {
  // Minimal but structurally valid legacy compiled message: 3 header bytes, one
  // account key, a recent blockhash, and one instruction calling that account
  // with no accounts and no data.
  const messageBytes = new Uint8Array([
    1,
    0,
    0,
    1,
    ...new Uint8Array(32).fill(9),
    ...new Uint8Array(32).fill(3),
    1,
    0,
    0,
    0,
  ]);
  // Wallet Standard delivers the full wire transaction: a compact-u16 signature
  // count, one zero-filled signature slot, then the compiled message.
  const transaction = new Uint8Array([
    1,
    ...new Uint8Array(64),
    ...messageBytes,
  ]);
  const signature = new Uint8Array(64).fill(7);
  const params = {
    kind: "solana-transaction" as const,
    address: SOLANA_ADDRESS,
    transaction,
  };

  let executeDeviceAction: ReturnType<typeof vi.fn>;
  let core: CoreFacade;
  let buildContextModule: BuildSolanaContextModule;

  const createUseCase = () =>
    new SignSolanaTransaction(
      core,
      createBlockchainConfig(),
      buildContextModule,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    executeDeviceAction = vi.fn();
    core = createMockCoreFacade({
      getDeviceSession: () => ({
        dmk: { executeDeviceAction } as never,
        sessionId: "session-1",
        isConnected: true,
      }),
    });
    buildContextModule = {
      execute: vi.fn(() => ({}) as never),
    } as unknown as BuildSolanaContextModule;
  });

  it("maps a completed device action to a success status carrying the raw signature", async () => {
    executeDeviceAction.mockReturnValue({
      observable: of({
        status: DeviceActionStatus.Completed,
        output: { signature },
      }),
    });

    const result = await lastValueFrom(
      createUseCase().execute(params, createAccount()),
    );

    expect(result).toEqual({
      signType: "transaction",
      status: "success",
      data: { solanaSignature: signature },
    });
    expect(core.trackTransactionStarted).toHaveBeenCalledExactlyOnceWith(
      "solana",
    );
  });

  it("forwards the compiled message bytes (not the wire transaction) to the device", async () => {
    executeDeviceAction.mockReturnValue({
      observable: of({
        status: DeviceActionStatus.Completed,
        output: { signature },
      }),
    });

    await lastValueFrom(createUseCase().execute(params, createAccount()));

    const { deviceAction } = executeDeviceAction.mock.calls[0]![0];
    expect(deviceAction.input.transaction).toEqual(messageBytes);
  });

  it("always forwards delayed-signing options and lets the signer-kit decide", async () => {
    executeDeviceAction.mockReturnValue({
      observable: of({
        status: DeviceActionStatus.Completed,
        output: { signature },
      }),
    });
    const coSigned = new Uint8Array([
      1,
      ...new Uint8Array(64).fill(1),
      ...messageBytes,
    ]);

    await lastValueFrom(
      createUseCase().execute(
        { ...params, transaction: coSigned },
        createAccount(),
      ),
    );

    const { deviceAction } = executeDeviceAction.mock.calls[0]![0];
    expect(deviceAction.input.delayed).toBe(true);
    expect(deviceAction.input.fetchBlockhash).toBeTypeOf("function");
  });

  it("fetchBlockhash loads a 32-byte hash through broadcastRPC", async () => {
    executeDeviceAction.mockReturnValue({
      observable: of({
        status: DeviceActionStatus.Completed,
        output: { signature },
      }),
    });
    vi.mocked(core.broadcastRPC).mockResolvedValue({
      jsonrpc: "2.0",
      id: 0,
      result: {
        context: { slot: 1 },
        value: {
          blockhash: "11111111111111111111111111111111",
          lastValidBlockHeight: 2,
        },
      },
    });

    await lastValueFrom(createUseCase().execute(params, createAccount()));

    const { deviceAction } = executeDeviceAction.mock.calls[0]![0];
    await expect(deviceAction.input.fetchBlockhash()).resolves.toEqual(
      new Uint8Array(32),
    );
    expect(core.broadcastRPC).toHaveBeenCalledWith(
      {
        jsonrpc: "2.0",
        id: 0,
        method: "getLatestBlockhash",
        params: [{ commitment: "finalized" }],
      },
      { name: "solana", chainId: "900" },
    );
  });

  it("includes the captured blockhash on success after fetchBlockhash runs", async () => {
    vi.mocked(core.broadcastRPC).mockResolvedValue({
      jsonrpc: "2.0",
      id: 0,
      result: {
        context: { slot: 1 },
        value: {
          blockhash: "11111111111111111111111111111111",
          lastValidBlockHeight: 2,
        },
      },
    });
    executeDeviceAction.mockImplementation(
      ({
        deviceAction,
      }: {
        deviceAction: { input: { fetchBlockhash?: () => Promise<Uint8Array> } };
      }) => ({
        observable: defer(() =>
          from(
            (async () => {
              await deviceAction.input.fetchBlockhash?.();
              return {
                status: DeviceActionStatus.Completed,
                output: { signature },
              };
            })(),
          ),
        ),
      }),
    );

    const result = await lastValueFrom(
      createUseCase().execute(params, createAccount()),
    );

    expect(result).toEqual({
      signType: "transaction",
      status: "success",
      data: {
        solanaSignature: signature,
        refreshedBlockhash: new Uint8Array(32),
      },
    });
  });

  it("forwards the intermediate signFlowStatus while pending", async () => {
    const pendingStatus: SignFlowStatus = {
      signType: "transaction",
      status: "user-interaction-needed",
      interaction: "sign-transaction",
    };
    executeDeviceAction.mockReturnValue({
      observable: of({
        status: DeviceActionStatus.Pending,
        intermediateValue: { signFlowStatus: pendingStatus },
      }),
    });

    const result = await lastValueFrom(
      createUseCase().execute(params, createAccount()),
    );

    expect(result).toEqual(pendingStatus);
  });

  it("maps UnsupportedFirmwareDAError to DeviceFirmwareOutdatedError", async () => {
    executeDeviceAction.mockReturnValue({
      observable: of({
        status: DeviceActionStatus.Error,
        error: new UnsupportedFirmwareDAError(
          "Application Solana needs latest firmware",
        ),
      }),
    });

    const result = await lastValueFrom(
      createUseCase().execute(params, createAccount()),
    );

    expect(result.status).toBe("error");
    if (result.status !== "error") {
      throw new Error("Expected error status");
    }
    expect(result.error).toBeInstanceOf(DeviceFirmwareOutdatedError);
    expect(result.error).toMatchObject({ context: { appName: "Solana" } });
  });

  it("emits an error status when no account is selected", async () => {
    const result = await lastValueFrom(
      createUseCase().execute(params, undefined),
    );

    expect(result.status).toBe("error");
  });

  it("emits an error status without signing when the transaction has no recipient", async () => {
    const noInstructionTransaction = new Uint8Array([
      ...transaction.slice(0, -4),
      0,
    ]);

    const result = await lastValueFrom(
      createUseCase().execute(
        { ...params, transaction: noInstructionTransaction },
        createAccount(),
      ),
    );

    expect(result).toMatchObject({
      status: "error",
      error: expect.objectContaining({
        message: "Transaction has no recipient",
      }),
    });
    expect(executeDeviceAction).not.toHaveBeenCalled();
  });
});
