/* eslint @typescript-eslint/consistent-type-imports: 0 */
import {
  DeviceActionStatus,
  UnknownDAError,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import { EthAppCommandError } from "@ledgerhq/device-signer-kit-ethereum/internal/app-binder/command/utils/ethAppErrors.js";
import {
  IncorrectSeedError,
  UserRejectedTransactionError,
} from "@ledgerhq/ledger-wallet-provider-core";
import { lastValueFrom, type Observable } from "rxjs";

import { SignPersonalMessageFlowDeviceAction } from "../SignPersonalMessageFlowDeviceAction.js";
import { SignPersonalMessageFlowDAStep } from "../SignPersonalMessageFlowDeviceActionTypes.js";
import {
  DEFAULT_ADDRESS,
  DEFAULT_INPUT,
  makeInternalApiMock,
  setupGetAddressMock,
  setupOpenAppMock,
  setupSignMessageMock,
  VALID_SIGNATURE_HEX,
} from "./SignPersonalMessageFlowDeviceAction.mock.js";
import {
  executeUntilStep,
  type SignPersonalMessageFlowDAState,
} from "./SignPersonalMessageFlowDeviceAction.utils.js";

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
    SignPersonalMessageDeviceActionFactory: vi.fn(() => ({
      makeStateMachine: vi.fn(),
      input: {},
    })),
  };
});

describe("SignPersonalMessageFlowDeviceAction", () => {
  let apiMock: ReturnType<typeof makeInternalApiMock>;

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock = makeInternalApiMock();
  });

  function executeAction(inputOverrides?: Partial<typeof DEFAULT_INPUT>) {
    const da = new SignPersonalMessageFlowDeviceAction({
      input: { ...DEFAULT_INPUT, ...inputOverrides },
    });
    return lastValueFrom(da._execute(apiMock).observable);
  }

  describe("Happy path", () => {
    describe("should sign a personal message", () => {
      let observable: Observable<SignPersonalMessageFlowDAState>;

      beforeEach(() => {
        setupOpenAppMock();
        setupGetAddressMock(DEFAULT_ADDRESS);
        setupSignMessageMock();
        const da = new SignPersonalMessageFlowDeviceAction({
          input: { ...DEFAULT_INPUT },
        });
        observable = da._execute(apiMock)
          .observable as Observable<SignPersonalMessageFlowDAState>;
      });

      // stepIndex 3 is the transient CheckGetAddressResult state which uses
      // an `always` transition and doesn't emit a meaningful Pending event.
      it.each([
        {
          stepIndex: 0,
          expectedStep: SignPersonalMessageFlowDAStep.OPEN_APP,
          description: "should open the app",
        },
        {
          stepIndex: 1,
          expectedStep: SignPersonalMessageFlowDAStep.OPEN_APP,
          expectedInteraction: UserInteractionRequired.ConfirmOpenApp,
          description: "should confirm open app",
        },
        {
          stepIndex: 2,
          expectedStep: SignPersonalMessageFlowDAStep.GET_ADDRESS,
          description: "should get address",
        },
        {
          stepIndex: 4,
          expectedStep: SignPersonalMessageFlowDAStep.VERIFY_ADDRESS,
          description: "should verify address",
        },
        {
          stepIndex: 5,
          expectedStep: SignPersonalMessageFlowDAStep.SIGN,
          expectedInteraction: UserInteractionRequired.SignPersonalMessage,
          description: "should sign the message",
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

      it("should return the signature", async () => {
        const result = await lastValueFrom(observable);
        expect(result.status).toBe(DeviceActionStatus.Completed);
        if (result.status === DeviceActionStatus.Completed) {
          expect(result.output.signature).toBe(VALID_SIGNATURE_HEX);
        }
      });
    });

    it("should match addresses case-insensitively", async () => {
      setupOpenAppMock();
      setupGetAddressMock("0xABC123");
      setupSignMessageMock();

      const result = await executeAction({ expectedAddress: "0xabc123" });

      expect(result.status).toBe(DeviceActionStatus.Completed);
    });
  });

  describe("Error cases", () => {
    it("should error when OpenApp fails", async () => {
      const openAppError = new UnknownDAError("OpenApp failed");
      setupOpenAppMock(openAppError);
      setupGetAddressMock();
      setupSignMessageMock();

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
      setupSignMessageMock();

      const result = await executeAction();

      expect(result.status).toBe(DeviceActionStatus.Error);
      if (result.status === DeviceActionStatus.Error) {
        expect(result.error).toBe(getAddrError);
      }
    });

    it("should error with IncorrectSeedError on address mismatch", async () => {
      setupOpenAppMock();
      setupGetAddressMock("0xDIFFERENT_ADDRESS");
      setupSignMessageMock();

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
      setupSignMessageMock(undefined, signError);

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
      setupSignMessageMock(undefined, rejectionError);

      const result = await executeAction();

      expect(result.status).toBe(DeviceActionStatus.Error);
      if (result.status === DeviceActionStatus.Error) {
        expect(result.error).toBeInstanceOf(UserRejectedTransactionError);
      }
    });
  });
});
