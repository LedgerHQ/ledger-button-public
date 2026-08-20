import type { BlockchainFamily } from "@api/blockchain-provider/model/types";
import type { Account, DetailedAccount } from "@api/model/Account";
import type { ButtonCoreContext } from "@api/model/ButtonCoreContext";
import type { Device } from "@internal/device/model/Device";

export type ContextEvent =
  | {
      type: "initialize_context";
      context: ButtonCoreContext;
    }
  | {
      type: "chain_changed";
      chainId: number;
      currencyId?: string;
    }
  | {
      type: "account_changed";
      account: Account | DetailedAccount;
      /** Blockchain family the account belongs to (resolved by core). */
      family: BlockchainFamily;
      chainId: number;
    }
  | {
      type: "hydrated_account";
      account: Account | DetailedAccount;
    }
  | {
      type: "account_disconnected";
      /** Blockchain family whose selected account is being removed. */
      family: BlockchainFamily;
    }
  | {
      type: "active_family_changed";
      /** Blockchain family the user switched to (must already be connected). */
      family: BlockchainFamily;
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
    }
  | {
      type: "developer_mode_enabled";
    };
