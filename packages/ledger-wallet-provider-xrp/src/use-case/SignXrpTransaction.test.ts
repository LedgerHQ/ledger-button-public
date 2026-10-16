import { DeviceActionStatus } from "@ledgerhq/device-management-kit";
import {
  AccountNotSelectedError,
  IncorrectSeedError,
  type SignFlowStatus,
  UserRejectedTransactionError,
} from "@ledgerhq/ledger-wallet-provider-core";
import { decode } from "ripple-binary-codec";
import { firstValueFrom, of, toArray } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createMockCoreFacade,
  XRP_TEST_ACCOUNT,
  XRP_TEST_BLOCKCHAIN_CONFIG,
} from "../__mocks__/coreFacadeMock";
import { SignXrpTransaction } from "./SignXrpTransaction";

const signerMock = vi.hoisted(() => ({
  getAddress: vi.fn(),
  signTransaction: vi.fn(),
}));

vi.mock("@ledgerhq/device-signer-kit-xrp", () => ({
  SignerXrpBuilder: vi.fn(function () {
    return { build: () => signerMock };
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

function completed<Output>(output: Output) {
  return {
    observable: of({ status: DeviceActionStatus.Completed, output }),
    cancel: vi.fn(),
  };
}

function failed(error: unknown) {
  return {
    observable: of({ status: DeviceActionStatus.Error, error }),
    cancel: vi.fn(),
  };
}

function createUseCase() {
  const dmk = { executeDeviceAction: vi.fn(() => completed(undefined)) };
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

function collect(statuses$: ReturnType<SignXrpTransaction["execute"]>) {
  return firstValueFrom(statuses$.pipe(toArray()));
}

function lastOf(statuses: SignFlowStatus[]): SignFlowStatus {
  return statuses[statuses.length - 1];
}

describe("SignXrpTransaction", () => {
  beforeEach(() => {
    signerMock.getAddress.mockReset();
    signerMock.signTransaction.mockReset();
    signerMock.getAddress.mockReturnValue(
      completed({
        address: XRP_TEST_ACCOUNT.freshAddress,
        publicKey: PUBLIC_KEY,
      }),
    );
    signerMock.signTransaction.mockReturnValue(completed(DER_SIGNATURE));
  });

  it("fails without a selected account", async () => {
    const { useCase } = createUseCase();

    const statuses = await collect(useCase.execute(TX, undefined));

    expect(lastOf(statuses)).toMatchObject({ status: "error" });
    expect((lastOf(statuses) as { error: unknown }).error).toBeInstanceOf(
      AccountNotSelectedError,
    );
  });

  it("signs with the device public key and returns the DER signature", async () => {
    const { useCase, core } = createUseCase();

    const statuses = await collect(useCase.execute(TX, XRP_TEST_ACCOUNT));

    expect(lastOf(statuses)).toEqual({
      signType: "transaction",
      status: "success",
      data: { xrpSignature: DER_SIGNATURE, signingPubKey: PUBLIC_KEY },
    });
    expect(core.trackTransactionStarted).toHaveBeenCalledWith("xrp");
  });

  it("sends the encoded transaction, with SigningPubKey, to the device", async () => {
    const { useCase } = createUseCase();

    await collect(useCase.execute(TX, XRP_TEST_ACCOUNT));

    const [path, bytes, options] = signerMock.signTransaction.mock.calls[0];
    expect(path).toBe("44'/144'/0'/0/0");
    expect(options).toEqual({ skipOpenApp: true });
    expect(decode(Buffer.from(bytes).toString("hex"))).toMatchObject({
      Account: XRP_TEST_ACCOUNT.freshAddress,
      SigningPubKey: PUBLIC_KEY.toUpperCase(),
      Amount: "1000000",
    });
  });

  it("refuses to sign when the device address is not the selected account", async () => {
    signerMock.getAddress.mockReturnValue(
      completed({ address: "rSomeoneElse", publicKey: PUBLIC_KEY }),
    );
    const { useCase } = createUseCase();

    const statuses = await collect(useCase.execute(TX, XRP_TEST_ACCOUNT));

    expect((lastOf(statuses) as { error: unknown }).error).toBeInstanceOf(
      IncorrectSeedError,
    );
    expect(signerMock.signTransaction).not.toHaveBeenCalled();
  });

  it("maps a rejection on the device to UserRejectedTransactionError", async () => {
    signerMock.signTransaction.mockReturnValue(failed({ errorCode: "6985" }));
    const { useCase } = createUseCase();

    const statuses = await collect(useCase.execute(TX, XRP_TEST_ACCOUNT));

    expect((lastOf(statuses) as { error: unknown }).error).toBeInstanceOf(
      UserRejectedTransactionError,
    );
  });
});
