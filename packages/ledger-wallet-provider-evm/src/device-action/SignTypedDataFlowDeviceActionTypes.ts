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
  SignTypedDataDAError,
} from "@ledgerhq/device-signer-kit-ethereum";
import type { TypedData } from "@ledgerhq/device-signer-kit-ethereum";
import type {
  BlindSigningDisabledError,
  IncorrectSeedError,
  UserRejectedTransactionError,
} from "@ledgerhq/ledger-wallet-provider-core";
import type { SignFlowStatus, SignType } from "@ledgerhq/ledger-wallet-provider-core";

export enum SignTypedDataFlowDAStep {
  OPEN_APP = "open-app",
  GET_ADDRESS = "get-address",
  VERIFY_ADDRESS = "verify-address",
  SIGN = "sign",
}

export type SignTypedDataFlowDAOutput = {
  readonly signature: string;
};

export type SignTypedDataFlowDAInput = {
  readonly signType: SignType;
  readonly derivationPath: string;
  readonly typedData: TypedData;
  readonly expectedAddress: string;
  readonly openAppInput: OpenAppWithDependenciesDAInput;
  readonly contextModule: ContextModule;
};

export type SignTypedDataFlowDAError =
  | OpenAppWithDependenciesDAError
  | GetAddressDAError
  | SignTypedDataDAError
  | IncorrectSeedError
  | UserRejectedTransactionError
  | BlindSigningDisabledError
  | UnknownDAError;

export type SignTypedDataFlowDAIntermediateValue = {
  readonly requiredUserInteraction: UserInteractionRequired;
  readonly step: SignTypedDataFlowDAStep;
  readonly signFlowStatus: SignFlowStatus;
};

export type SignTypedDataFlowDAInternalState = {
  readonly error: (SignTypedDataFlowDAError & DmkError) | null;
  readonly address: string | null;
  readonly signature: string | null;
  readonly lastSignStep: string | null;
};
