import { DeviceActionStatus } from "@ledgerhq/device-management-kit";
import { lastValueFrom, of } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CoreFacade } from "../../../../api/blockchain-provider/model/CoreFacade.js";
import type { ProviderAccount } from "../../../../api/model/blockchain/ProviderAccount.js";
import type { BlockchainConfig } from "../../../../api/model/dappConfig/BlockchainConfig.js";
import type { SignFlowStatus } from "../../../../api/model/signing/SignFlowStatus.js";
import { createMockCoreFacade } from "../../../blockchain-provider/__mocks__/coreFacadeMock.js";
import type { BuildSolanaContextModule } from "./BuildSolanaContextModule.js";
import { SignSolanaTransaction } from "./SignSolanaTransaction.js";

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
  // account key, a recent blockhash, and zero instructions.
  const messageBytes = new Uint8Array([
    1,
    0,
    0,
    1,
    ...new Uint8Array(32).fill(9),
    ...new Uint8Array(32).fill(3),
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
    expect(core.trackTransactionStarted).toHaveBeenCalledOnce();
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

  it("emits an error status when no account is selected", async () => {
    const result = await lastValueFrom(
      createUseCase().execute(params, undefined),
    );

    expect(result.status).toBe("error");
  });
});
