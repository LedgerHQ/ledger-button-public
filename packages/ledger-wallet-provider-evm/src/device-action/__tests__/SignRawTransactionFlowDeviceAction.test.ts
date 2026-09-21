/* eslint @typescript-eslint/consistent-type-imports: 0 */
import {
  DeviceActionStatus,
  GlobalCommandError,
  RefusedByUserDAError,
  UnknownDAError,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import { SignTransactionDAStep } from "@ledgerhq/device-signer-kit-ethereum";
import { EthAppCommandError } from "@ledgerhq/device-signer-kit-ethereum/internal/app-binder/command/utils/ethAppErrors.js";
import {
  BlindSigningDisabledError,
  IncorrectSeedError,
  UserRejectedTransactionError,
} from "@ledgerhq/ledger-wallet-provider-core";
import { lastValueFrom, type Observable } from "rxjs";

import { SignRawTransactionFlowDeviceAction } from "../SignRawTransactionFlowDeviceAction";
import { SignRawTransactionFlowDAStep } from "../SignRawTransactionFlowDeviceActionTypes";
import {
  DEFAULT_ADDRESS,
  DEFAULT_INPUT,
  makeInternalApiMock,
  setupGetAddressMock,
  setupOpenAppMock,
  setupSignTransactionMock,
} from "./SignRawTransactionFlowDeviceAction.mock";
import {
  executeUntilStep,
  type SignRawTransactionFlowDAState,
} from "./SignRawTransactionFlowDeviceAction.utils";

vi.mock("@ledgerhq/device-management-kit", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@ledgerhq/device-management-kit")>();
  return {
    ...original,
    OpenAppWithDependenciesDeviceAction: vi.fn(function () {
      return {
        makeStateMachine: vi.fn(),
      };
    }),
  };
});

vi.mock("@ledgerhq/device-signer-kit-ethereum", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("@ledgerhq/device-signer-kit-ethereum")
    >();
  return {
    ...original,
    GetAddressDeviceActionFactory: vi.fn(() => ({
      makeStateMachine: vi.fn(),
      input: {},
    })),
    SignTransactionDeviceActionFactory: vi.fn(() => ({
      makeStateMachine: vi.fn(),
      input: {},
    })),
  };
});

describe("SignRawTransactionFlowDeviceAction", () => {
  let apiMock: ReturnType<typeof makeInternalApiMock>;

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock = makeInternalApiMock();
  });

  function executeAction(inputOverrides?: Partial<typeof DEFAULT_INPUT>) {
    const da = new SignRawTransactionFlowDeviceAction({
      input: { ...DEFAULT_INPUT, ...inputOverrides },
    });
    return lastValueFrom(da._execute(apiMock).observable);
  }

  describe("Happy path", () => {
    describe("should sign a raw transaction", () => {
      let observable: Observable<SignRawTransactionFlowDAState>;

      beforeEach(() => {
        setupOpenAppMock();
        setupGetAddressMock(DEFAULT_ADDRESS);
        setupSignTransactionMock();
        const da = new SignRawTransactionFlowDeviceAction({
          input: { ...DEFAULT_INPUT },
        });
        observable = da._execute(apiMock)
          .observable as Observable<SignRawTransactionFlowDAState>;
      });

      // stepIndex 3 is the transient CheckGetAddressResult state which uses
      // an `always` transition and doesn't emit a meaningful Pending event.
      it.each([
        {
          stepIndex: 0,
          expectedStep: SignRawTransactionFlowDAStep.OPEN_APP,
          description: "should open the app",
        },
        {
          stepIndex: 1,
          expectedStep: SignRawTransactionFlowDAStep.OPEN_APP,
          expectedInteraction: UserInteractionRequired.ConfirmOpenApp,
          description: "should confirm open app",
        },
        {
          stepIndex: 2,
          expectedStep: SignRawTransactionFlowDAStep.GET_ADDRESS,
          description: "should get address",
        },
        {
          stepIndex: 4,
          expectedStep: SignRawTransactionFlowDAStep.VERIFY_ADDRESS,
          description: "should verify address",
        },
        {
          stepIndex: 5,
          expectedStep: SignRawTransactionFlowDAStep.SIGN,
          expectedInteraction: UserInteractionRequired.SignTransaction,
          description: "should sign the transaction",
        },
      ])(
        "$description (step $stepIndex)",
        async ({ stepIndex, expectedStep, expectedInteraction }) => {
          const { steps } = await executeUntilStep(stepIndex, observable);
          const step = steps[stepIndex];

          if (step.status !== DeviceActionStatus.Pending) {
            throw new Error(
              `Step ${stepIndex} is not pending: ${JSON.stringify(step)}`,
            );
          }

          expect(step.intermediateValue?.step).toBe(expectedStep);
          if (expectedInteraction) {
            expect(step.intermediateValue?.requiredUserInteraction).toBe(
              expectedInteraction,
            );
          }
        },
      );

      it("should return the signed transaction", async () => {
        const result = await lastValueFrom(observable);
        expect(result.status).toBe(DeviceActionStatus.Completed);
        if (result.status === DeviceActionStatus.Completed) {
          expect(result.output.rawTransaction).toBe(
            DEFAULT_INPUT.rawTransaction,
          );
          expect(result.output.signedRawTransaction).toMatch(/^0x[0-9a-fA-F]+$/);
          expect(result.output.signedRawTransaction).not.toBe(
            DEFAULT_INPUT.rawTransaction,
          );
        }
      });
    });

    it("should match addresses case-insensitively", async () => {
      setupOpenAppMock();
      setupGetAddressMock("0xABC123");
      setupSignTransactionMock();

      const result = await executeAction({ expectedAddress: "0xabc123" });

      expect(result.status).toBe(DeviceActionStatus.Completed);
    });
  });

  describe("Error cases", () => {
    it("should throw when the raw transaction hex is invalid", () => {
      const da = new SignRawTransactionFlowDeviceAction({
        input: { ...DEFAULT_INPUT, rawTransaction: "not-a-hex" },
      });

      expect(() => da._execute(apiMock)).toThrow(
        "Invalid raw transaction hex string",
      );
    });

    it("should error when OpenApp fails", async () => {
      const openAppError = new UnknownDAError("OpenApp failed");
      setupOpenAppMock(openAppError);
      setupGetAddressMock();
      setupSignTransactionMock();

      const result = await executeAction();

      expect(result.status).toBe(DeviceActionStatus.Error);
      if (result.status === DeviceActionStatus.Error) {
        expect(result.error).toBe(openAppError);
      }
    });

    it("should wrap RefusedByUserDAError from OpenApp as UserRejectedTransactionError", async () => {
      setupOpenAppMock(new RefusedByUserDAError("User refused"));
      setupGetAddressMock();
      setupSignTransactionMock();

      const result = await executeAction();

      expect(result.status).toBe(DeviceActionStatus.Error);
      if (result.status === DeviceActionStatus.Error) {
        expect(result.error).toBeInstanceOf(UserRejectedTransactionError);
      }
    });

    it("should wrap GlobalCommandError 5501 from OpenApp as UserRejectedTransactionError", async () => {
      setupOpenAppMock(
        new GlobalCommandError({
          errorCode: "5501",
          message: "Refused by user",
        }),
      );
      setupGetAddressMock();
      setupSignTransactionMock();

      const result = await executeAction();

      expect(result.status).toBe(DeviceActionStatus.Error);
      if (result.status === DeviceActionStatus.Error) {
        expect(result.error).toBeInstanceOf(UserRejectedTransactionError);
      }
    });

    it("should error when GetAddress fails", async () => {
      const getAddrError = new UnknownDAError("GetAddress failed");
      setupOpenAppMock();
      setupGetAddressMock(undefined, getAddrError);
      setupSignTransactionMock();

      const result = await executeAction();

      expect(result.status).toBe(DeviceActionStatus.Error);
      if (result.status === DeviceActionStatus.Error) {
        expect(result.error).toBe(getAddrError);
      }
    });

    it("should error with IncorrectSeedError on address mismatch", async () => {
      setupOpenAppMock();
      setupGetAddressMock("0xDIFFERENT_ADDRESS");
      setupSignTransactionMock();

      const result = await executeAction({ expectedAddress: "0xabc123" });

      expect(result.status).toBe(DeviceActionStatus.Error);
      if (result.status === DeviceActionStatus.Error) {
        expect(result.error).toBeInstanceOf(IncorrectSeedError);
      }
    });

    it("should error when Sign fails", async () => {
      const signError = new UnknownDAError("Sign failed");
      setupOpenAppMock();
      setupGetAddressMock(DEFAULT_ADDRESS);
      setupSignTransactionMock(undefined, signError);

      const result = await executeAction();

      expect(result.status).toBe(DeviceActionStatus.Error);
      if (result.status === DeviceActionStatus.Error) {
        expect(result.error).toBe(signError);
      }
    });

    it("should wrap 6985 error code as UserRejectedTransactionError", async () => {
      const rejectionError = new EthAppCommandError({
        errorCode: "6985",
        message: "Condition not satisfied",
      });
      setupOpenAppMock();
      setupGetAddressMock(DEFAULT_ADDRESS);
      setupSignTransactionMock(undefined, rejectionError);

      const result = await executeAction();

      expect(result.status).toBe(DeviceActionStatus.Error);
      if (result.status === DeviceActionStatus.Error) {
        expect(result.error).toBeInstanceOf(UserRejectedTransactionError);
      }
    });

    it("should wrap 6a80 during blind-sign fallback as BlindSigningDisabledError", async () => {
      const blindSignError = new EthAppCommandError({
        errorCode: "6a80",
        message: "Incorrect data",
      });
      setupOpenAppMock();
      setupGetAddressMock(DEFAULT_ADDRESS);
      setupSignTransactionMock(
        undefined,
        blindSignError,
        SignTransactionDAStep.BLIND_SIGN_TRANSACTION_FALLBACK,
      );

      const result = await executeAction();

      expect(result.status).toBe(DeviceActionStatus.Error);
      if (result.status === DeviceActionStatus.Error) {
        expect(result.error).toBeInstanceOf(BlindSigningDisabledError);
      }
    });

    it("should keep 6a80 as EthAppCommandError outside the blind-sign fallback", async () => {
      const dataError = new EthAppCommandError({
        errorCode: "6a80",
        message: "Incorrect data",
      });
      setupOpenAppMock();
      setupGetAddressMock(DEFAULT_ADDRESS);
      setupSignTransactionMock(
        undefined,
        dataError,
        SignTransactionDAStep.SIGN_TRANSACTION,
      );

      const result = await executeAction();

      expect(result.status).toBe(DeviceActionStatus.Error);
      if (result.status === DeviceActionStatus.Error) {
        expect(result.error).toBe(dataError);
      }
    });
  });
});
