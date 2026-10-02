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
} from "@ledgerhq/device-signer-kit-ethereum";
import type {
  BlindSigningDisabledError,
  IncorrectSeedError,
  SignedTransactionResult,
  UserRejectedTransactionError,
} from "@ledgerhq/ledger-wallet-provider-core";
import type { SignFlowStatus, SignType } from "@ledgerhq/ledger-wallet-provider-core";

export enum SignRawTransactionFlowDAStep {
  OPEN_APP = "open-app",
  GET_ADDRESS = "get-address",
  VERIFY_ADDRESS = "verify-address",
  SIGN = "sign",
}

export type SignRawTransactionFlowDAOutput = SignedTransactionResult;

export type SignRawTransactionFlowDAInput = {
  readonly signType: SignType;
  readonly derivationPath: string;
  readonly rawTransaction: string;
  readonly expectedAddress: string;
  readonly openAppInput: OpenAppWithDependenciesDAInput;
  readonly contextModule: ContextModule;
};

export type SignRawTransactionFlowDAError =
  | OpenAppWithDependenciesDAError
  | GetAddressDAError
  | SignTransactionDAError
  | IncorrectSeedError
  | UserRejectedTransactionError
  | BlindSigningDisabledError
  | UnknownDAError;

export type SignRawTransactionFlowDAIntermediateValue = {
  readonly requiredUserInteraction: UserInteractionRequired;
  readonly step: SignRawTransactionFlowDAStep;
  readonly signFlowStatus: SignFlowStatus;
};

export type SignRawTransactionFlowDAInternalState = {
  readonly error: (SignRawTransactionFlowDAError & DmkError) | null;
  readonly address: string | null;
  readonly signedTransaction: SignedTransactionResult | null;
  readonly lastSignStep: string | null;
};
