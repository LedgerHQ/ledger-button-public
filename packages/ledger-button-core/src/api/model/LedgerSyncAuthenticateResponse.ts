import { LedgerSyncAuthenticationError } from "./errors";
import { UserInteractionNeededResponse } from "./UserInteractionNeeded";

export type LedgerSyncAuthenticateResponse =
  | AuthContext
  | UserInteractionNeededResponse
  | LedgerSyncAuthenticationError;

export type AuthContext = {
  trustChainId: string;
  applicationPath: string;
};
