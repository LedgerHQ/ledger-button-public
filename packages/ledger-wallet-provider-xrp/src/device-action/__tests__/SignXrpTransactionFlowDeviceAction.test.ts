/* eslint @typescript-eslint/consistent-type-imports: 0 */
import {
  DeviceActionStatus,
  DmkResultStatus,
  UnknownDAError,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import {
  GetAddressDeviceActionFactory,
  SignTransactionDeviceActionFactory,
} from "@ledgerhq/device-signer-kit-xrp";
import { IncorrectSeedError } from "@ledgerhq/ledger-wallet-provider-core";
import { Left, Right } from "purify-ts";
import { decode } from "ripple-binary-codec";
import { lastValueFrom, type Observable } from "rxjs";
import { type Mock } from "vitest";

import { SignXrpTransactionFlowDeviceAction } from "../SignXrpTransactionFlowDeviceAction";
import { SignXrpTransactionFlowDAStep } from "../SignXrpTransactionFlowDeviceActionTypes";
import {
  DEFAULT_ADDRESS,
  DEFAULT_INPUT,
  DER_SIGNATURE,
  executeUntilStep,
  makeChildMachine,
  makeInternalApiMock,
  PUBLIC_KEY,
  setupOpenAppMock,
  type SignXrpTransactionFlowDAState,
} from "./SignXrpTransactionFlowDeviceAction.mock";

vi.mock("@ledgerhq/device-management-kit", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@ledgerhq/device-management-kit")>();
  return {
    ...original,
    OpenAppWithDependenciesDeviceAction: vi.fn(function () {
      return { makeStateMachine: vi.fn() };
    }),
  };
});

vi.mock("@ledgerhq/device-signer-kit-xrp", () => ({
  GetAddressDeviceActionFactory: vi.fn(),
  SignTransactionDeviceActionFactory: vi.fn(),
}));

function setupGetAddressMock(
  result: { address: string; publicKey: string } | { error: unknown },
): void {
  (GetAddressDeviceActionFactory as Mock).mockReturnValue({
    makeStateMachine: vi.fn(() =>
      makeChildMachine(UserInteractionRequired.None, () =>
        "error" in result ? Left(result.error) : Right(result),
      ),
    ),
    input: {},
  });
}

function setupSignTransactionMock(error?: unknown): void {
  (SignTransactionDeviceActionFactory as Mock).mockImplementation(
    ({ transaction }: { transaction: Uint8Array }) => ({
      input: {
        task: async () =>
          error
            ? { status: DmkResultStatus.Error, error }
            : { status: DmkResultStatus.Success, data: DER_SIGNATURE },
        // Kept for call-site assertions; the flow only uses `.input.task`.
        transaction,
      },
    }),
  );
}

function setupHappyPath(): void {
  setupOpenAppMock();
  setupGetAddressMock({ address: DEFAULT_ADDRESS, publicKey: PUBLIC_KEY });
  setupSignTransactionMock();
}

function execute(
  inputOverrides?: Partial<typeof DEFAULT_INPUT>,
): Observable<SignXrpTransactionFlowDAState> {
  const da = new SignXrpTransactionFlowDeviceAction({
    input: { ...DEFAULT_INPUT, ...inputOverrides },
  });
  return da._execute(makeInternalApiMock())
    .observable as Observable<SignXrpTransactionFlowDAState>;
}

function signedTransactionBytes(): Uint8Array | undefined {
  const calls = (SignTransactionDeviceActionFactory as Mock).mock.calls;
  return calls.map(([args]) => args.transaction).find((tx) => tx.length > 0);
}

describe("SignXrpTransactionFlowDeviceAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Happy path", () => {
    beforeEach(setupHappyPath);

    // Step 3 is the transient CheckGetAddressResult state, which emits no
    // meaningful Pending event.
    it.each([
      { stepIndex: 0, expectedStep: SignXrpTransactionFlowDAStep.OPEN_APP },
      {
        stepIndex: 1,
        expectedStep: SignXrpTransactionFlowDAStep.OPEN_APP,
        expectedInteraction: UserInteractionRequired.ConfirmOpenApp,
      },
      { stepIndex: 2, expectedStep: SignXrpTransactionFlowDAStep.GET_ADDRESS },
      {
        stepIndex: 4,
        expectedStep: SignXrpTransactionFlowDAStep.VERIFY_ADDRESS,
      },
      {
        stepIndex: 5,
        expectedStep: SignXrpTransactionFlowDAStep.PREPARE_TRANSACTION,
      },
      {
        stepIndex: 6,
        expectedStep: SignXrpTransactionFlowDAStep.SIGN,
        expectedInteraction: UserInteractionRequired.SignTransaction,
      },
    ])(
      "emits $expectedStep at step $stepIndex",
      async ({ stepIndex, expectedStep, expectedInteraction }) => {
        const { steps } = await executeUntilStep(stepIndex, execute());
        const step = steps[stepIndex];

        if (step.status !== DeviceActionStatus.Pending) {
          throw new Error(`Step ${stepIndex} is not pending`);
        }
        expect(step.intermediateValue.step).toBe(expectedStep);
        if (expectedInteraction) {
          expect(step.intermediateValue.requiredUserInteraction).toBe(
            expectedInteraction,
          );
        }
      },
    );

    it("returns the signature and the public key it signed with", async () => {
      const result = await lastValueFrom(execute());

      expect(result).toMatchObject({
        status: DeviceActionStatus.Completed,
        output: { signature: DER_SIGNATURE, signingPubKey: PUBLIC_KEY },
      });
    });

    it("signs the transaction with the device address and public key", async () => {
      await lastValueFrom(execute());

      const bytes = signedTransactionBytes() ?? new Uint8Array();
      expect(decode(Buffer.from(bytes).toString("hex"))).toMatchObject({
        Account: DEFAULT_ADDRESS,
        SigningPubKey: PUBLIC_KEY.toUpperCase(),
        Amount: "1000000",
      });
    });
  });

  describe("Error cases", () => {
    it("stops when OpenApp fails", async () => {
      const openAppError = new UnknownDAError("OpenApp failed");
      setupOpenAppMock(openAppError);
      setupGetAddressMock({ address: DEFAULT_ADDRESS, publicKey: PUBLIC_KEY });
      setupSignTransactionMock();

      const result = await lastValueFrom(execute());

      expect(result).toMatchObject({
        status: DeviceActionStatus.Error,
        error: openAppError,
      });
    });

    it("stops when GetAddress fails", async () => {
      const getAddressError = new UnknownDAError("GetAddress failed");
      setupOpenAppMock();
      setupGetAddressMock({ error: getAddressError });
      setupSignTransactionMock();

      const result = await lastValueFrom(execute());

      expect(result).toMatchObject({
        status: DeviceActionStatus.Error,
        error: getAddressError,
      });
    });

    it("refuses to sign when the device address is not the selected account", async () => {
      setupOpenAppMock();
      setupGetAddressMock({ address: "rSomeoneElse", publicKey: PUBLIC_KEY });
      setupSignTransactionMock();

      const result = await lastValueFrom(execute());

      expect(result.status).toBe(DeviceActionStatus.Error);
      if (result.status === DeviceActionStatus.Error) {
        expect(result.error).toBeInstanceOf(IncorrectSeedError);
      }
      expect(signedTransactionBytes()).toBeUndefined();
    });

    it("compares addresses case-sensitively", async () => {
      setupOpenAppMock();
      setupGetAddressMock({
        address: DEFAULT_ADDRESS.toLowerCase(),
        publicKey: PUBLIC_KEY,
      });
      setupSignTransactionMock();

      const result = await lastValueFrom(execute());

      expect(result.status).toBe(DeviceActionStatus.Error);
      if (result.status === DeviceActionStatus.Error) {
        expect(result.error).toBeInstanceOf(IncorrectSeedError);
      }
    });

    it("refuses to sign when the device returns no public key", async () => {
      setupOpenAppMock();
      setupGetAddressMock({ address: DEFAULT_ADDRESS, publicKey: "" });
      setupSignTransactionMock();

      const result = await lastValueFrom(execute());

      expect(result.status).toBe(DeviceActionStatus.Error);
      if (result.status === DeviceActionStatus.Error) {
        expect(result.error).toBeInstanceOf(UnknownDAError);
      }
      expect(signedTransactionBytes()).toBeUndefined();
    });

    it("names the invalid field when the transaction cannot be serialized", async () => {
      setupHappyPath();

      const result = await lastValueFrom(
        execute({
          transaction: { ...DEFAULT_INPUT.transaction, Sequence: 1.5 },
        }),
      );

      expect(result.status).toBe(DeviceActionStatus.Error);
      if (result.status === DeviceActionStatus.Error) {
        expect(result.error).toBeInstanceOf(UnknownDAError);
        expect(
          (result.error as UnknownDAError).originalError?.message,
        ).toContain('"Sequence"');
      }
      expect(signedTransactionBytes()).toBeUndefined();
    });

    it("forwards the signing error", async () => {
      const signError = { _tag: "XrpAppCommandError", errorCode: "6985" };
      setupOpenAppMock();
      setupGetAddressMock({ address: DEFAULT_ADDRESS, publicKey: PUBLIC_KEY });
      setupSignTransactionMock(signError);

      const result = await lastValueFrom(execute());

      expect(result).toMatchObject({
        status: DeviceActionStatus.Error,
        error: signError,
      });
    });
  });
});
