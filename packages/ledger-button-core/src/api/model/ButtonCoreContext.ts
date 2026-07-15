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
  /**
   * Blockchain family the user is currently interacting with (the most recently
   * selected one). `undefined` when no account is selected. Use
   * {@link getActiveSelectedAccount} to read the corresponding account in a
   * family-agnostic way.
   */
  activeFamily: BlockchainFamily | undefined;
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

/**
 * List the blockchain families that currently have a selected account.
 */
export function getConnectedFamilies(
  context: ButtonCoreContext,
): BlockchainFamily[] {
  return Array.from(context.selectedAccounts.keys());
}

/**
 * Read the selected account for the currently active family, in a
 * family-agnostic way. Falls back to the first connected family when
 * `activeFamily` is not set (e.g. right after a restore), and returns
 * `undefined` when no account is selected at all.
 */
export function getActiveSelectedAccount(
  context: ButtonCoreContext,
): Account | undefined {
  if (context.activeFamily) {
    const active = context.selectedAccounts.get(context.activeFamily);
    if (active) {
      return active;
    }
  }
  for (const account of context.selectedAccounts.values()) {
    return account;
  }
  return undefined;
}

/**
 * Resolve the active family, falling back to the first connected family when
 * `activeFamily` has not been set yet.
 */
export function getActiveFamily(
  context: ButtonCoreContext,
): BlockchainFamily | undefined {
  if (
    context.activeFamily &&
    context.selectedAccounts.has(context.activeFamily)
  ) {
    return context.activeFamily;
  }
  for (const family of context.selectedAccounts.keys()) {
    return family;
  }
  return undefined;
}
