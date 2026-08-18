import { Observable } from "rxjs";

import { LedgerSyncAuthenticateResponse } from "@api/model/LedgerSyncAuthenticateResponse";

import { InternalAuthContext } from "../model/InternalAuthContext";

export interface LedgerSyncService {
  authContext: InternalAuthContext | undefined;

  authenticate(): Observable<LedgerSyncAuthenticateResponse>;
  decrypt(encryptedData: Uint8Array): Promise<Uint8Array>;
}
