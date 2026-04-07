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
  SignPersonalMessageDAError,
} from "@ledgerhq/device-signer-kit-ethereum";

import type {
  IncorrectSeedError,
  UserRejectedTransactionError,
} from "../../../../api/errors/DeviceErrors.js";
import type { SignFlowStatus, SignType } from "../../../../api/model/signing/SignFlowStatus.js";

export enum SignPersonalMessageFlowDAStep {
  OPEN_APP = "open-app",
  GET_ADDRESS = "get-address",
  VERIFY_ADDRESS = "verify-address",
  SIGN = "sign",
}

export type SignPersonalMessageFlowDAOutput = {
  readonly signature: string;
};

export type SignPersonalMessageFlowDAInput = {
  readonly signType: SignType;
  readonly derivationPath: string;
  readonly message: string | Uint8Array;
  readonly expectedAddress: string;
  readonly openAppInput: OpenAppWithDependenciesDAInput;
  readonly contextModule: ContextModule;
};

export type SignPersonalMessageFlowDAError =
  | OpenAppWithDependenciesDAError
  | GetAddressDAError
  | SignPersonalMessageDAError
  | IncorrectSeedError
  | UserRejectedTransactionError
  | UnknownDAError;

export type SignPersonalMessageFlowDAIntermediateValue = {
  readonly requiredUserInteraction: UserInteractionRequired;
  readonly step: SignPersonalMessageFlowDAStep;
  readonly signFlowStatus: SignFlowStatus;
};

export type SignPersonalMessageFlowDAInternalState = {
  readonly error: (SignPersonalMessageFlowDAError & DmkError) | null;
  readonly address: string | null;
  readonly signature: string | null;
};
