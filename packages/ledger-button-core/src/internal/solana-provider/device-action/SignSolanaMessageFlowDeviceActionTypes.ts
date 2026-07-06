import type {
  CallTaskInAppDAError,
  DmkError,
  OpenAppWithDependenciesDAError,
  OpenAppWithDependenciesDAInput,
  SendCommandInAppDAError,
  UnknownDAError,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import type { SolanaAppErrorCodes } from "@ledgerhq/device-signer-kit-solana";

import type {
  IncorrectSeedError,
  UserRejectedTransactionError,
} from "../../../api/errors/DeviceErrors.js";
import type {
  SignFlowStatus,
  SignType,
} from "../../../api/model/signing/SignFlowStatus.js";

export enum SignSolanaMessageFlowDAStep {
  OPEN_APP = "open-app",
  GET_ADDRESS = "get-address",
  VERIFY_ADDRESS = "verify-address",
  SIGN = "sign",
}

export type SignSolanaMessageFlowDAOutput = {
  readonly signature: string;
};

export type SignSolanaMessageFlowDAInput = {
  readonly signType: SignType;
  readonly derivationPath: string;
  readonly message: Uint8Array;
  readonly expectedAddress: string;
  readonly openAppInput: OpenAppWithDependenciesDAInput;
};

export type SignSolanaMessageFlowDAError =
  | OpenAppWithDependenciesDAError
  | SendCommandInAppDAError<SolanaAppErrorCodes>
  | CallTaskInAppDAError
  | IncorrectSeedError
  | UserRejectedTransactionError
  | UnknownDAError;

export type SignSolanaMessageFlowDAIntermediateValue = {
  readonly requiredUserInteraction: UserInteractionRequired;
  readonly step: SignSolanaMessageFlowDAStep;
  readonly signFlowStatus: SignFlowStatus;
};

export type SignSolanaMessageFlowDAInternalState = {
  readonly error: (SignSolanaMessageFlowDAError & DmkError) | null;
  readonly address: string | null;
  readonly signature: string | null;
};
