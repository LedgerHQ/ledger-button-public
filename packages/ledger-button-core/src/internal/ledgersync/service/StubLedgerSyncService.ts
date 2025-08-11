import {
  AuthenticateDAOutput,
  AuthenticateDAReturnType,
} from "@ledgerhq/device-trusted-app-kit-ledger-keyring-protocol";
import { injectable } from "inversify";
import { Observable, of } from "rxjs";

import { AuthContext } from "../../../api/model/AuthContext.js";
import {
  AuthenticateResponse,
  LedgerSyncService,
} from "./LedgerSyncService.js";

@injectable()
export class StubLedgerSyncService implements LedgerSyncService {
  get authContext(): AuthContext | undefined {
    return undefined;
  }

  authenticate(): Observable<AuthenticateResponse> {
    return {
      observable: of({
        jwt: "jwt",
        trustchainId: "trustchainId",
        applicationPath: "applicationPath",
        encryptionKey: new Uint8Array(),
      } as unknown as AuthenticateDAOutput),
      cancel: () => {
        //DO NOTHING
      },
    } as unknown as AuthenticateDAReturnType;
  }
}
