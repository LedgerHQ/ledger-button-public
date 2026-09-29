import {
  DeviceActionStatus,
  UnsupportedFirmwareDAError,
} from "@ledgerhq/device-management-kit";
import type { BlockchainConfig } from "@ledgerhq/ledger-wallet-provider-core";
import type { CoreFacade } from "@ledgerhq/ledger-wallet-provider-core";
import type { ProviderAccount } from "@ledgerhq/ledger-wallet-provider-core";
import { DeviceFirmwareOutdatedError } from "@ledgerhq/ledger-wallet-provider-core";
import { Transaction } from "ethers";
import { lastValueFrom, of } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockCoreFacade } from "../__mocks__/coreFacadeMock";
import type { BroadcastTransaction } from "./BroadcastTransaction";
import type { BuildContextModule } from "./BuildContextModule";
import { SignRawTransaction } from "./SignRawTransaction";

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

const RECIPIENT = "0x111111125421cA6dc452d289314280a0f8842A65";
const BROADCAST_HASH =
  "0xcaf172bf3784a1ea3dbb2c551de9e2b263c9c4f762589363776cda325b6de11c";

const createAccount = (): ProviderAccount => ({
  id: "eth:1",
  currencyId: "ethereum",
  freshAddress: "0x1111111111111111111111111111111111111111",
  derivationMode: "default",
  index: 0,
});

const createBlockchainConfig = (): BlockchainConfig => ({
  blockchain: "ethereum",
  appName: "Ethereum",
  networks: [],
  rpcMethods: { local: [], broadcasted: [] },
  appDependencies: { appName: "Ethereum", dependencies: [] },
});

const aTransferTransaction = (): string =>
  Transaction.from({
    type: 2,
    chainId: 1,
    nonce: 0,
    maxFeePerGas: 1,
    maxPriorityFeePerGas: 1,
    gasLimit: 21000,
    to: RECIPIENT,
    value: 0,
    data: "0x",
  }).unsignedSerialized;

const aContractDeployment = (): string =>
  Transaction.from({
    type: 2,
    chainId: 1,
    nonce: 0,
    maxFeePerGas: 1,
    maxPriorityFeePerGas: 1,
    gasLimit: 21000,
    value: 0,
    data: "0x00",
  }).unsignedSerialized;

describe("SignRawTransaction", () => {
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

    const useCase = new SignRawTransaction(
      createMockCoreFacade({
        getDeviceSession: () => ({
          dmk: { executeDeviceAction } as never,
          sessionId: "session-1",
          isConnected: true,
        }),
      }),
      blockchainConfig,
      { execute: vi.fn() } as unknown as BroadcastTransaction,
      { execute: vi.fn() } as unknown as BuildContextModule,
    );

    const status = await lastValueFrom(
      useCase.execute(
        {
          transaction: "0x",
          method: "eth_signRawTransaction",
          broadcast: false,
        },
        account,
      ),
    );

    expect(status.status).toBe("error");
    if (status.status !== "error") {
      throw new Error("Expected error status");
    }
    expect(status.error).toBeInstanceOf(DeviceFirmwareOutdatedError);
    expect(status.error).toMatchObject({ context: { appName: "Ethereum" } });
  });
});

describe("SignRawTransaction tracking", () => {
  let executeDeviceAction: ReturnType<typeof vi.fn>;
  let core: CoreFacade;
  let broadcastTransaction: BroadcastTransaction;
  let buildContextModule: BuildContextModule;

  const createUseCase = () =>
    new SignRawTransaction(
      core,
      createBlockchainConfig(),
      broadcastTransaction,
      buildContextModule,
    );

  const completeDeviceAction = () => {
    executeDeviceAction.mockReturnValue({
      observable: of({
        status: DeviceActionStatus.Completed,
        output: {
          rawTransaction: new Uint8Array(),
          signedRawTransaction: "0xsigned",
        },
      }),
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    executeDeviceAction = vi.fn();
    core = createMockCoreFacade({
      isModalOpen: vi.fn(() => true),
      getDeviceSession: () => ({
        dmk: { executeDeviceAction } as never,
        sessionId: "session-1",
        isConnected: true,
      }),
    });
    broadcastTransaction = {
      execute: vi.fn().mockResolvedValue({
        hash: BROADCAST_HASH,
        rawTransaction: new Uint8Array(),
        signedRawTransaction: "0xsigned",
      }),
    } as unknown as BroadcastTransaction;
    buildContextModule = {
      execute: vi.fn(() => ({}) as never),
    } as unknown as BuildContextModule;
  });

  it("tracks the transaction start with the ethereum family", async () => {
    completeDeviceAction();

    await lastValueFrom(
      createUseCase().execute(
        {
          transaction: aTransferTransaction(),
          broadcast: false,
          method: "eth_signTransaction",
        },
        createAccount(),
      ),
    );

    expect(core.trackTransactionStarted).toHaveBeenCalledExactlyOnceWith(
      "ethereum",
    );
    expect(core.trackTransactionCompleted).not.toHaveBeenCalled();
  });

  it("tracks completion once the broadcast succeeds", async () => {
    completeDeviceAction();
    const rawTransaction = aTransferTransaction();

    await lastValueFrom(
      createUseCase().execute(
        {
          transaction: rawTransaction,
          broadcast: true,
          method: "eth_sendTransaction",
        },
        createAccount(),
      ),
    );

    expect(core.trackTransactionCompleted).toHaveBeenCalledExactlyOnceWith({
      family: "ethereum",
      transactionHash: BROADCAST_HASH,
      unsignedTransaction: rawTransaction,
      recipientAddress: RECIPIENT,
    });
  });

  it("tracks a contract deployment with an empty recipient", async () => {
    completeDeviceAction();
    const rawTransaction = aContractDeployment();

    await lastValueFrom(
      createUseCase().execute(
        {
          transaction: rawTransaction,
          broadcast: true,
          method: "eth_sendTransaction",
        },
        createAccount(),
      ),
    );

    expect(core.trackTransactionCompleted).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        family: "ethereum",
        recipientAddress: "",
        unsignedTransaction: rawTransaction,
      }),
    );
  });

  it("still tracks completion with an empty recipient when the raw transaction cannot be parsed", async () => {
    completeDeviceAction();

    await lastValueFrom(
      createUseCase().execute(
        {
          transaction: "0xdeadbeef",
          broadcast: true,
          method: "eth_sendTransaction",
        },
        createAccount(),
      ),
    );

    expect(core.trackTransactionCompleted).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        family: "ethereum",
        recipientAddress: "",
        unsignedTransaction: "0xdeadbeef",
      }),
    );
  });

  it("does not track completion when the broadcast result has no hash", async () => {
    completeDeviceAction();
    vi.mocked(broadcastTransaction.execute).mockResolvedValue({
      rawTransaction: new Uint8Array(),
      signedRawTransaction: "0xsigned",
    });

    await lastValueFrom(
      createUseCase().execute(
        {
          transaction: aTransferTransaction(),
          broadcast: true,
          method: "eth_sendTransaction",
        },
        createAccount(),
      ),
    );

    expect(core.trackTransactionCompleted).not.toHaveBeenCalled();
  });
});
