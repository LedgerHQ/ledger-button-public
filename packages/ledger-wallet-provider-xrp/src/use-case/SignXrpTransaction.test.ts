import {
  DeviceActionStatus,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import {
  AccountNotSelectedError,
  type SignFlowStatus,
  UserRejectedTransactionError,
} from "@ledgerhq/ledger-wallet-provider-core";
import { firstValueFrom, of, toArray } from "rxjs";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import {
  createMockCoreFacade,
  XRP_TEST_ACCOUNT,
  XRP_TEST_BLOCKCHAIN_CONFIG,
} from "../__mocks__/coreFacadeMock";
import { SignXrpTransactionFlowDeviceAction } from "../device-action/SignXrpTransactionFlowDeviceAction";
import { SignXrpTransactionFlowDAStep } from "../device-action/SignXrpTransactionFlowDeviceActionTypes";
import { SignXrpTransaction } from "./SignXrpTransaction";

vi.mock("../device-action/SignXrpTransactionFlowDeviceAction", () => ({
  SignXrpTransactionFlowDeviceAction: vi.fn(function (args: unknown) {
    return { args };
  }),
}));

const PUBLIC_KEY =
  "03430ce12840c76b40f778c7900dc706cedaf6073947a1437179ef8bd402f871af";
const DER_SIGNATURE = new Uint8Array([0x30, 0x45, 0x02, 0x21]);
const TX = {
  TransactionType: "Payment",
  Destination: "rQruxtzFbPR2JgBp47FEbh4pAyYDStcLJH",
  Amount: "1000000",
  Fee: "10",
  Sequence: 1,
};

const SIGN_PENDING_STATE = {
  status: DeviceActionStatus.Pending,
  intermediateValue: {
    requiredUserInteraction: UserInteractionRequired.SignTransaction,
    step: SignXrpTransactionFlowDAStep.SIGN,
    signFlowStatus: {
      signType: "transaction",
      status: "user-interaction-needed",
      interaction: UserInteractionRequired.SignTransaction,
    },
  },
};

const COMPLETED_STATE = {
  status: DeviceActionStatus.Completed,
  output: { signature: DER_SIGNATURE, signingPubKey: PUBLIC_KEY },
};

function createUseCase(states: unknown[] = [COMPLETED_STATE]) {
  const dmk = {
    executeDeviceAction: vi.fn(() => ({
      observable: of(...states),
      cancel: vi.fn(),
    })),
  };
  const core = createMockCoreFacade({
    getDeviceSession: vi.fn(() => ({
      dmk: dmk as never,
      sessionId: "session-id",
      isConnected: true,
    })),
  });
  return {
    dmk,
    core,
    useCase: new SignXrpTransaction(core, XRP_TEST_BLOCKCHAIN_CONFIG),
  };
}

function collect(
  statuses$: ReturnType<SignXrpTransaction["execute"]>,
): Promise<SignFlowStatus[]> {
  return firstValueFrom(statuses$.pipe(toArray()));
}

function lastOf(statuses: SignFlowStatus[]): SignFlowStatus {
  return statuses[statuses.length - 1];
}

describe("SignXrpTransaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails without a selected account", async () => {
    const { useCase, dmk } = createUseCase();

    const statuses = await collect(useCase.execute(TX, undefined));

    expect((lastOf(statuses) as { error: unknown }).error).toBeInstanceOf(
      AccountNotSelectedError,
    );
    expect(dmk.executeDeviceAction).not.toHaveBeenCalled();
  });

  it("runs the flow device action for the selected account", async () => {
    const { useCase, dmk, core } = createUseCase();

    await collect(useCase.execute(TX, XRP_TEST_ACCOUNT));

    expect(SignXrpTransactionFlowDeviceAction as Mock).toHaveBeenCalledWith({
      input: expect.objectContaining({
        derivationPath: "44'/144'/0'/0/0",
        transaction: TX,
        expectedAddress: XRP_TEST_ACCOUNT.freshAddress,
      }),
      inspect: false,
    });
    expect(dmk.executeDeviceAction).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: "session-id" }),
    );
    expect(core.trackTransactionStarted).toHaveBeenCalledWith("xrp");
  });

  it("forwards pending statuses and returns the signature on completion", async () => {
    const { useCase } = createUseCase([SIGN_PENDING_STATE, COMPLETED_STATE]);

    const statuses = await collect(useCase.execute(TX, XRP_TEST_ACCOUNT));

    expect(statuses).toEqual([
      SIGN_PENDING_STATE.intermediateValue.signFlowStatus,
      {
        signType: "transaction",
        status: "success",
        data: { xrpSignature: DER_SIGNATURE, signingPubKey: PUBLIC_KEY },
      },
    ]);
  });

  it("maps a rejection on the device to UserRejectedTransactionError", async () => {
    const { useCase } = createUseCase([
      { status: DeviceActionStatus.Error, error: { errorCode: "6985" } },
    ]);

    const statuses = await collect(useCase.execute(TX, XRP_TEST_ACCOUNT));

    expect((lastOf(statuses) as { error: unknown }).error).toBeInstanceOf(
      UserRejectedTransactionError,
    );
  });
});
