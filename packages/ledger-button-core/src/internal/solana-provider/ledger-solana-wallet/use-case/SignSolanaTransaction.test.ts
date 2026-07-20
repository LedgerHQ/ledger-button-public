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
  appDependencies: { appName: "Solana", dependencies: ["Solana"] },
});

describe("SignSolanaTransaction", () => {
  const transaction = new Uint8Array([1, 2, 3, 4]);
  const signature = new Uint8Array(64).fill(7);

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
      createUseCase().execute({ transaction }, createAccount()),
    );

    expect(result).toEqual({
      signType: "transaction",
      status: "success",
      data: { solanaSignature: signature },
    });
    expect(core.trackTransactionStarted).toHaveBeenCalledOnce();
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
      createUseCase().execute({ transaction }, createAccount()),
    );

    expect(result).toEqual(pendingStatus);
  });

  it("emits an error status when no account is selected", async () => {
    const result = await lastValueFrom(
      createUseCase().execute({ transaction }, undefined),
    );

    expect(result.status).toBe("error");
  });
});
