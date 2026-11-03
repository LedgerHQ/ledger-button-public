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
} from "@ledgerhq/device-signer-kit-xrp";
import type {
  IncorrectSeedError,
  SignFlowStatus,
} from "@ledgerhq/ledger-wallet-provider-core";

import type { XrpTransaction } from "../utils/xrpTransaction";

export enum SignXrpTransactionFlowDAStep {
  OPEN_APP = "open-app",
  GET_ADDRESS = "get-address",
  VERIFY_ADDRESS = "verify-address",
  PREPARE_TRANSACTION = "prepare-transaction",
  SIGN = "sign",
}

export type SignXrpTransactionFlowDAOutput = {
  /** DER-encoded signature returned by the XRP app. */
  readonly signature: Uint8Array;
  /** Public key (hex) the device signed with: the transaction's `SigningPubKey`. */
  readonly signingPubKey: string;
};

export type SignXrpTransactionFlowDAInput = {
  readonly derivationPath: string;
  readonly transaction: XrpTransaction;
  readonly expectedAddress: string;
  readonly openAppInput: OpenAppWithDependenciesDAInput;
};

export type SignXrpTransactionFlowDAError =
  | OpenAppWithDependenciesDAError
  | GetAddressDAError
  | SignTransactionDAError
  | IncorrectSeedError
  | UnknownDAError;

export type SignXrpTransactionFlowDAIntermediateValue = {
  readonly requiredUserInteraction: UserInteractionRequired;
  readonly step: SignXrpTransactionFlowDAStep;
  readonly signFlowStatus: SignFlowStatus;
};

export type SignXrpTransactionFlowDAInternalState = {
  readonly error: (SignXrpTransactionFlowDAError & DmkError) | null;
  readonly address: string | null;
  readonly publicKey: string | null;
  /** Bytes sent to the device; only known once the public key has been read. */
  readonly serializedTransaction: Uint8Array | null;
  readonly signature: Uint8Array | null;
};
