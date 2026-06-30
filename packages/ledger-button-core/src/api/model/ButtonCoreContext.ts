import { Account } from "../../internal/account/service/AccountService.js";
import { Device } from "../../internal/device/model/Device.js";
import type { BlockchainFamily } from "../blockchain-provider/model/types.js";

/** The blockchain family used as the default when none is specified. */
export const DEFAULT_BLOCKCHAIN_FAMILY: BlockchainFamily = "ethereum";

export type ButtonCoreContext = {
  connectedDevice: Device | undefined;
  /**
   * Selected account per blockchain family (one provider can be active per
   * family). Use {@link getSelectedAccount} to read the default ("ethereum")
   * or a specific family.
   */
  selectedAccounts: Map<BlockchainFamily, Account>;
  trustChainId: string | undefined;
  applicationPath: string | undefined;
  chainId: number;
  welcomeScreenCompleted: boolean;
  hasTrackingConsent: boolean | undefined;
  isMobilePlatform: boolean;
  preferredFiatCurrency: string;
};

/**
 * Read the selected account for a given blockchain `family`, defaulting to the
 * {@link DEFAULT_BLOCKCHAIN_FAMILY} ("ethereum") when omitted.
 */
export function getSelectedAccount(
  context: ButtonCoreContext,
  family: BlockchainFamily = DEFAULT_BLOCKCHAIN_FAMILY,
): Account | undefined {
  return context.selectedAccounts.get(family);
}
