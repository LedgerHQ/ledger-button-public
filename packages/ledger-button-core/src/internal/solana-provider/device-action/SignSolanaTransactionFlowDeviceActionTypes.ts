import type { ContextModule } from "@ledgerhq/context-module";
import type {
  DmkError,
  OpenAppWithDependenciesDAError,
  OpenAppWithDependenciesDAInput,
  UnknownDAError,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import type {
  GetAddressDAError,
  SignTransactionDAError,
} from "@ledgerhq/device-signer-kit-solana";

import type {
  IncorrectSeedError,
  UserRejectedTransactionError,
} from "../../../api/errors/DeviceErrors.js";
import type {
  SignFlowStatus,
  SignType,
} from "../../../api/model/signing/SignFlowStatus.js";

export enum SignSolanaTransactionFlowDAStep {
  OPEN_APP = "open-app",
  GET_ADDRESS = "get-address",
  VERIFY_ADDRESS = "verify-address",
  SIGN = "sign",
}

export type SignSolanaTransactionFlowDAOutput = {
  /** Raw 64-byte ed25519 signature returned by the device. */
  readonly signature: Uint8Array;
};

export type SignSolanaTransactionFlowDAInput = {
  readonly signType: SignType;
  readonly derivationPath: string;
  readonly transaction: Uint8Array;
  readonly expectedAddress: string;
  readonly openAppInput: OpenAppWithDependenciesDAInput;
  readonly contextModule: ContextModule;
};

export type SignSolanaTransactionFlowDAError =
  | OpenAppWithDependenciesDAError
  | GetAddressDAError
  | SignTransactionDAError
  | IncorrectSeedError
  | UserRejectedTransactionError
  | UnknownDAError;

export type SignSolanaTransactionFlowDAIntermediateValue = {
  readonly requiredUserInteraction: UserInteractionRequired;
  readonly step: SignSolanaTransactionFlowDAStep;
  readonly signFlowStatus: SignFlowStatus;
};

export type SignSolanaTransactionFlowDAInternalState = {
  readonly error: (SignSolanaTransactionFlowDAError & DmkError) | null;
  readonly address: string | null;
  readonly signature: Uint8Array | null;
};
