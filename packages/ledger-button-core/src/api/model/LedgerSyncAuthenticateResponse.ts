import { LedgerSyncAuthenticationError } from "./errors.js";
import { UserInteractionNeeded } from "./UserInteractionNeeded.js";

export type LedgerSyncAuthenticateResponse =
  | AuthContext
  | UserInteractionNeeded
  | LedgerSyncAuthenticationError;

export type AuthContext = {
  trustChainId: string;
  applicationPath: string;
};
