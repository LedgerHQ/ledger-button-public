/**
 * Ledger Solana Wallet (Wallet Standard)
 *
 * Wallet Standard wallet that announces the Ledger button as a Solana wallet so
 * it is discoverable and usable by Wallet Standard compatible dApps (e.g. via
 * `@solana/wallet-adapter-react`).
 *
 * Connection-only scope (LBD-581):
 * - `standard:connect` / `standard:disconnect` / `standard:events`
 * - advertises the supported `solana:*` chains
 *
 * Signing features (`solana:signTransaction`, `solana:signMessage`) are added in
 * follow-up tickets (LBD-580 / LBD-582).
 *
 * @see https://github.com/wallet-standard/wallet-standard
 */

import { address, getAddressEncoder } from "@solana/kit";
import type { Wallet, WalletAccount, WalletIcon } from "@wallet-standard/base";
import {
  StandardConnect,
  type StandardConnectFeature,
  type StandardConnectMethod,
  StandardDisconnect,
  type StandardDisconnectFeature,
  type StandardDisconnectMethod,
  StandardEvents,
  type StandardEventsChangeProperties,
  type StandardEventsFeature,
  type StandardEventsListeners,
  type StandardEventsNames,
  type StandardEventsOnMethod,
} from "@wallet-standard/features";

import {
  getClusterFromCurrencyId,
  isSupportedSolanaCurrency,
} from "./utils/clusterUtils.js";
import { LedgerButtonCore } from "../../api/LedgerButtonCore.js";
import type { SolanaCluster } from "../../api/model/solana/SolanaTypes.js";
import { Account } from "../account/service/AccountService.js";
import { SolanaProviderUI } from "./SolanaProviderUI.js";

const LEDGER_ICON: WalletIcon =
  "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDIzLjAuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCAxMTQ5LjA0IDEwNDkuNDciIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8c3R5bGUgdHlwZT0idGV4dC9jc3MiPgoJLnN0MHtmaWxsOiMwMDAwMDA7fQo8L3N0eWxlPgo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNMTkwLjA2LDY2OS4zNXYxOTAuMDZoMjg5LjIydi00Mi4xNEgyMzIuMjFWNjY5LjM1SDE5MC4wNnogTTkxNi44Myw2NjkuMzV2MTQ3LjkySDY2OS43NXY0Mi4xNGgyODkuMjJWNjY5LjM1CglIOTE2LjgzeiBNNDc5LjcsMzgwLjEydjI4OS4yMmgxOTAuMDV2LTM4LjAxSDUyMS44NFYzODAuMTJINDc5Ljd6IE0xOTAuMDYsMTkwLjA2djE5MC4wNmg0Mi4xNFYyMzIuMjFoMjQ3LjA4di00Mi4xNEgxOTAuMDZ6CgkgTTY2OS43NSwxOTAuMDZ2NDIuMTRoMjQ3LjA4djE0Ny45Mmg0Mi4xNFYxOTAuMDZINjY5Ljc1eiIvPgo8L3N2Zz4K";

const SOLANA_CHAINS = [
  "solana:mainnet",
  "solana:devnet",
  "solana:testnet",
] as const;

type SolanaChain = (typeof SOLANA_CHAINS)[number];

const CLUSTER_TO_CHAIN: Record<SolanaCluster, SolanaChain> = {
  mainnet: "solana:mainnet",
  devnet: "solana:devnet",
  testnet: "solana:testnet",
};

const ACCOUNT_SELECTED_EVENT = "ledger-provider-account-selected";

const addressEncoder = getAddressEncoder();

type SolanaWalletFeatures = StandardConnectFeature &
  StandardDisconnectFeature &
  StandardEventsFeature;

export class LedgerSolanaWallet implements Wallet {
  readonly version = "1.0.0" as const;
  readonly name = "Ledger";
  readonly icon = LEDGER_ICON;

  private _accounts: readonly WalletAccount[] = [];
  private readonly _listeners: {
    [E in StandardEventsNames]?: StandardEventsListeners[E][];
  } = {};

  constructor(
    private readonly core: LedgerButtonCore,
    private readonly app: SolanaProviderUI,
  ) {}

  get chains() {
    return SOLANA_CHAINS;
  }

  get accounts(): readonly WalletAccount[] {
    return this._accounts;
  }

  get features(): SolanaWalletFeatures {
    return {
      [StandardConnect]: { version: "1.0.0", connect: this.connect },
      [StandardDisconnect]: { version: "1.0.0", disconnect: this.disconnect },
      [StandardEvents]: { version: "1.0.0", on: this.on },
    };
  }

  private readonly connect: StandardConnectMethod = async () => {
    if (this._accounts.length > 0) {
      return { accounts: this._accounts };
    }

    const account = await this.resolveSolanaAccount();
    this._accounts = [this.toWalletAccount(account)];
    this.emitChange({ accounts: this._accounts });

    return { accounts: this._accounts };
  };

  private readonly disconnect: StandardDisconnectMethod = async () => {
    if (this._accounts.length === 0) {
      return;
    }
    this._accounts = [];
    this.emitChange({ accounts: this._accounts });
  };

  private readonly on: StandardEventsOnMethod = (event, listener) => {
    const listeners = this._listeners[event];
    if (listeners) {
      listeners.push(listener);
    } else {
      this._listeners[event] = [listener];
    }
    return () => this.off(event, listener);
  };

  private async resolveSolanaAccount(): Promise<Account> {
    const selected = this.core.getSelectedAccount();
    if (selected && isSupportedSolanaCurrency(selected.currencyId)) {
      return selected;
    }
    return this.requestAccountSelection();
  }

  private requestAccountSelection(): Promise<Account> {
    return new Promise<Account>((resolve, reject) => {
      window.addEventListener(
        ACCOUNT_SELECTED_EVENT,
        (event) => {
          if (event.detail.status === "error") {
            return reject(
              new Error("Account selection failed", {
                cause: event.detail.error,
              }),
            );
          }

          const account = event.detail.account;
          if (!isSupportedSolanaCurrency(account.currencyId)) {
            return reject(
              new Error("Selected account is not a Solana account"),
            );
          }
          return resolve(account);
        },
        { once: true },
      );

      this.app.navigationIntent("selectAccount");
    });
  }

  private toWalletAccount(account: Account): WalletAccount {
    const cluster = getClusterFromCurrencyId(account.currencyId);
    return {
      address: account.freshAddress,
      publicKey: new Uint8Array(
        addressEncoder.encode(address(account.freshAddress)),
      ),
      chains: [CLUSTER_TO_CHAIN[cluster]],
      // Signing features are added in LBD-580 / LBD-582.
      features: [],
    };
  }

  private emitChange(properties: StandardEventsChangeProperties): void {
    this._listeners.change?.forEach((listener) => listener(properties));
  }

  private off<E extends StandardEventsNames>(
    event: E,
    listener: StandardEventsListeners[E],
  ): void {
    this._listeners[event] = this._listeners[event]?.filter(
      (existingListener) => listener !== existingListener,
    );
  }
}
