import { Observable } from "rxjs";

import { AuthenticateResponse } from "../../../api/model/LedgerSyncAuthenticate.js";
import { InternalAuthContext } from "../model/InternalAuthContext.js";

export interface LedgerSyncService {
  authContext: InternalAuthContext | undefined;

  authenticate(): Observable<AuthenticateResponse>;
  decrypt(encryptedData: Uint8Array): Uint8Array;
}
