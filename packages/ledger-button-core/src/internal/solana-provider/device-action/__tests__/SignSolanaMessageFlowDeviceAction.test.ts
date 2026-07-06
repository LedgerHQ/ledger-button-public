/* eslint @typescript-eslint/consistent-type-imports: 0 */
import {
  DeviceActionStatus,
  UnknownDAError,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import { SolanaAppCommandError } from "@ledgerhq/device-signer-kit-solana/internal/app-binder/command/utils/SolanaApplicationErrors.js";
import { lastValueFrom, type Observable } from "rxjs";

import {
  IncorrectSeedError,
  UserRejectedTransactionError,
} from "../../../../api/errors/DeviceErrors.js";
import { SignSolanaMessageFlowDeviceAction } from "../SignSolanaMessageFlowDeviceAction.js";
import { SignSolanaMessageFlowDAStep } from "../SignSolanaMessageFlowDeviceActionTypes.js";
import {
  DEFAULT_ADDRESS,
  DEFAULT_INPUT,
  INVALID_SIGNATURE_BASE58,
  makeInternalApiMock,
  setupGetAddressMock,
  setupOpenAppMock,
  setupSignMessageMock,
  VALID_SIGNATURE_BASE58,
} from "./SignSolanaMessageFlowDeviceAction.mock.js";
import {
  executeUntilStep,
  type SignSolanaMessageFlowDAState,
} from "./SignSolanaMessageFlowDeviceAction.utils.js";

vi.mock("@ledgerhq/device-management-kit", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@ledgerhq/device-management-kit")>();
  return {
    ...original,
    OpenAppWithDependenciesDeviceAction: vi.fn(() => ({
      makeStateMachine: vi.fn(),
      input: {},
    })),
    SendCommandInAppDeviceAction: vi.fn(() => ({
      makeStateMachine: vi.fn(),
      input: {},
    })),
    CallTaskInAppDeviceAction: vi.fn(() => ({
      makeStateMachine: vi.fn(),
      input: {},
    })),
  };
});

describe("SignSolanaMessageFlowDeviceAction", () => {
  let apiMock: ReturnType<typeof makeInternalApiMock>;

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock = makeInternalApiMock();
  });

  function executeAction(inputOverrides?: Partial<typeof DEFAULT_INPUT>) {
    const da = new SignSolanaMessageFlowDeviceAction({
      input: { ...DEFAULT_INPUT, ...inputOverrides },
    });
    return lastValueFrom(da._execute(apiMock).observable);
  }

  describe("Happy path", () => {
    let observable: Observable<SignSolanaMessageFlowDAState>;

    beforeEach(() => {
      setupOpenAppMock();
      setupGetAddressMock(DEFAULT_ADDRESS);
      setupSignMessageMock();
      const da = new SignSolanaMessageFlowDeviceAction({
        input: { ...DEFAULT_INPUT },
      });
      observable = da._execute(apiMock)
        .observable as Observable<SignSolanaMessageFlowDAState>;
    });

    it("should walk through every step of the flow", async () => {
      const { steps } = await executeUntilStep(Infinity, observable);

      const pendingSteps = steps
        .filter((s) => s.status === DeviceActionStatus.Pending)
        .map((s) =>
          s.status === DeviceActionStatus.Pending
            ? s.intermediateValue.step
            : undefined,
        );

      expect(pendingSteps).toContain(SignSolanaMessageFlowDAStep.OPEN_APP);
      expect(pendingSteps).toContain(SignSolanaMessageFlowDAStep.GET_ADDRESS);
      expect(pendingSteps).toContain(
        SignSolanaMessageFlowDAStep.VERIFY_ADDRESS,
      );
      expect(pendingSteps).toContain(SignSolanaMessageFlowDAStep.SIGN);
    });

    it("should surface the required user interactions", async () => {
      const { steps } = await executeUntilStep(Infinity, observable);

      const interactions = steps
        .filter((s) => s.status === DeviceActionStatus.Pending)
        .map((s) =>
          s.status === DeviceActionStatus.Pending
            ? s.intermediateValue.requiredUserInteraction
            : undefined,
        );

      expect(interactions).toContain(UserInteractionRequired.ConfirmOpenApp);
      expect(interactions).toContain(
        UserInteractionRequired.SignPersonalMessage,
      );
    });

    it("should return the extracted raw signature", async () => {
      const result = await lastValueFrom(observable);

      expect(result.status).toBe(DeviceActionStatus.Completed);
      if (result.status === DeviceActionStatus.Completed) {
        expect(result.output.signature).toBe(VALID_SIGNATURE_BASE58);
      }
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
      setupGetAddressMock("SomeOtherSolanaAddress11111111111111111111111");
      setupSignMessageMock();

      const result = await executeAction({ expectedAddress: DEFAULT_ADDRESS });

      expect(result.status).toBe(DeviceActionStatus.Error);
      if (result.status === DeviceActionStatus.Error) {
        expect(result.error).toBeInstanceOf(IncorrectSeedError);
      }
    });

    it("should match Solana addresses case-sensitively (exact match passes)", async () => {
      setupOpenAppMock();
      setupGetAddressMock(DEFAULT_ADDRESS);
      setupSignMessageMock();

      const result = await executeAction({ expectedAddress: DEFAULT_ADDRESS });

      expect(result.status).toBe(DeviceActionStatus.Completed);
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

    it("should wrap the 6985 APDU error as UserRejectedTransactionError", async () => {
      const rejectionError = new SolanaAppCommandError({
        errorCode: "6985",
        message: "Canceled by user",
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

    it("should error with UnknownDAError on an unparseable signature payload", async () => {
      setupOpenAppMock();
      setupGetAddressMock(DEFAULT_ADDRESS);
      setupSignMessageMock(INVALID_SIGNATURE_BASE58);

      const result = await executeAction();

      expect(result.status).toBe(DeviceActionStatus.Error);
      if (result.status === DeviceActionStatus.Error) {
        expect(result.error).toBeInstanceOf(UnknownDAError);
      }
    });
  });
});
