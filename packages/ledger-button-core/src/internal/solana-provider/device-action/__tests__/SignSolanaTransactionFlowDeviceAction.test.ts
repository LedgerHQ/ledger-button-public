/* eslint @typescript-eslint/consistent-type-imports: 0 */
import {
  DeviceActionStatus,
  UnknownDAError,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import { SolanaAppCommandError } from "@ledgerhq/device-signer-kit-solana";
import { lastValueFrom, type Observable } from "rxjs";

import {
  IncorrectSeedError,
  UserRejectedTransactionError,
} from "../../../../api/errors/DeviceErrors.js";
import { SignSolanaTransactionFlowDeviceAction } from "../SignSolanaTransactionFlowDeviceAction.js";
import { SignSolanaTransactionFlowDAStep } from "../SignSolanaTransactionFlowDeviceActionTypes.js";
import {
  DEFAULT_ADDRESS,
  DEFAULT_INPUT,
  makeInternalApiMock,
  setupGetAddressMock,
  setupOpenAppMock,
  setupSignTransactionMock,
  VALID_SIGNATURE,
} from "./SignSolanaTransactionFlowDeviceAction.mock.js";
import {
  executeUntilStep,
  type SignSolanaTransactionFlowDAState,
} from "./SignSolanaTransactionFlowDeviceAction.utils.js";

vi.mock("@ledgerhq/device-management-kit", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@ledgerhq/device-management-kit")>();
  return {
    ...original,
    OpenAppWithDependenciesDeviceAction: vi.fn(() => ({
      makeStateMachine: vi.fn(),
    })),
  };
});

vi.mock("@ledgerhq/device-signer-kit-solana", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@ledgerhq/device-signer-kit-solana")>();
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

describe("SignSolanaTransactionFlowDeviceAction", () => {
  let apiMock: ReturnType<typeof makeInternalApiMock>;

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock = makeInternalApiMock();
  });

  function executeAction(inputOverrides?: Partial<typeof DEFAULT_INPUT>) {
    const da = new SignSolanaTransactionFlowDeviceAction({
      input: { ...DEFAULT_INPUT, ...inputOverrides },
    });
    return lastValueFrom(da._execute(apiMock).observable);
  }

  describe("Happy path", () => {
    describe("should sign a transaction", () => {
      let observable: Observable<SignSolanaTransactionFlowDAState>;

      beforeEach(() => {
        setupOpenAppMock();
        setupGetAddressMock(DEFAULT_ADDRESS);
        setupSignTransactionMock();
        const da = new SignSolanaTransactionFlowDeviceAction({
          input: { ...DEFAULT_INPUT },
        });
        observable = da._execute(apiMock)
          .observable as Observable<SignSolanaTransactionFlowDAState>;
      });

      // stepIndex 3 is the transient CheckGetAddressResult state which uses an
      // `always` transition and doesn't emit a meaningful Pending event.
      it.each([
        {
          stepIndex: 0,
          expectedStep: SignSolanaTransactionFlowDAStep.OPEN_APP,
          description: "should open the app",
        },
        {
          stepIndex: 1,
          expectedStep: SignSolanaTransactionFlowDAStep.OPEN_APP,
          expectedInteraction: UserInteractionRequired.ConfirmOpenApp,
          description: "should confirm open app",
        },
        {
          stepIndex: 2,
          expectedStep: SignSolanaTransactionFlowDAStep.GET_ADDRESS,
          description: "should get address",
        },
        {
          stepIndex: 4,
          expectedStep: SignSolanaTransactionFlowDAStep.VERIFY_ADDRESS,
          description: "should verify address",
        },
        {
          stepIndex: 5,
          expectedStep: SignSolanaTransactionFlowDAStep.SIGN,
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

      it("should return the raw signature", async () => {
        const result = await lastValueFrom(observable);
        expect(result.status).toBe(DeviceActionStatus.Completed);
        if (result.status === DeviceActionStatus.Completed) {
          expect(result.output.signature).toBe(VALID_SIGNATURE);
        }
      });
    });
  });

  describe("Error cases", () => {
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
      setupGetAddressMock("22222222222222222222222222222222");
      setupSignTransactionMock();

      const result = await executeAction({ expectedAddress: DEFAULT_ADDRESS });

      expect(result.status).toBe(DeviceActionStatus.Error);
      if (result.status === DeviceActionStatus.Error) {
        expect(result.error).toBeInstanceOf(IncorrectSeedError);
      }
    });

    it("should error with IncorrectSeedError on case-different address (base58 is case-sensitive)", async () => {
      setupOpenAppMock();
      setupGetAddressMock("So11111111111111111111111111111111111111112");
      setupSignTransactionMock();

      const result = await executeAction({
        expectedAddress: "so11111111111111111111111111111111111111112",
      });

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
      const rejectionError = new SolanaAppCommandError({
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
  });
});
