import { InternalAuthContext } from "@internal/ledgersync/model/InternalAuthContext";

import { CloudSyncData } from "../model/cloudSyncTypes";

export interface CloudSyncService {
  fetchEncryptedAccounts(
    authContext: InternalAuthContext,
  ): Promise<CloudSyncData>;
}
