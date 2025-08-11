import { AuthContext } from "../../../api/model/AuthContext.js";
import { CloudSyncData } from "../DefaultCloudSyncService.js";

export interface CloudSyncService {
  fetchEncryptedAccounts(authContext: AuthContext): Promise<CloudSyncData>;
}
