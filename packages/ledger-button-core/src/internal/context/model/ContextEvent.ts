import type { BlockchainFamily } from "../../../api/blockchain-provider/model/types.js";
import { ButtonCoreContext } from "../../../api/model/ButtonCoreContext.js";
import type { Account, DetailedAccount } from "../../account/service/AccountService.js";
import { Device } from "../../device/model/Device.js";

export type ContextEvent =
  | {
      type: "initialize_context";
      context: ButtonCoreContext;
    }
  | {
      type: "chain_changed";
      chainId: number;
    }
  | {
      type: "account_changed";
      account: Account | DetailedAccount;
      /** Blockchain family the account belongs to (resolved by core). */
      family: BlockchainFamily;
    }
  | {
      type: "hydrated_account";
      account: Account | DetailedAccount;
    }
  | {
      type: "device_connected";
      device: Device;
    }
  | {
      type: "device_disconnected";
    }
  | {
      type: "trustchain_connected";
      trustChainId: string;
      applicationPath: string;
    }
  | {
      type: "wallet_disconnected";
    }
  | {
      type: "welcome_screen_completed";
    }
  | {
      type: "tracking_consent_given";
    }
  | {
      type: "tracking_consent_refused";
    }
  | {
      type: "preferred_fiat_currency_changed";
      currency: string;
    };
