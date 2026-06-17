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
import type { SolanaCluster } from "../../api/model/solana/SolanaTypes.js";
import { Account } from "../account/service/AccountService.js";
import type { WalletProviderHost } from "../blockchain-provider/model/BlockchainProvider.js";
import { getLedgerProviderIcon } from "../provider-registration/ledgerProviderIcon.js";

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

const addressEncoder = getAddressEncoder();

type SolanaSignMessageMethod = (
  ...inputs: readonly { account: WalletAccount; message: Uint8Array }[]
) => Promise<
  readonly {
    signedMessage: Uint8Array;
    signature: Uint8Array;
    signatureType?: "ed25519";
  }[]
>;

type SolanaSignTransactionMethod = (
  ...inputs: readonly { account: WalletAccount; transaction: Uint8Array }[]
) => Promise<readonly { signedTransaction: Uint8Array }[]>;

type SolanaSignAndSendTransactionMethod = (
  ...inputs: readonly { account: WalletAccount; transaction: Uint8Array }[]
) => Promise<readonly { signature: Uint8Array }[]>;

type SolanaSignFeatures = {
  "solana:signMessage": {
    version: "1.0.0";
    signMessage: SolanaSignMessageMethod;
  };
  "solana:signTransaction": {
    version: "1.0.0";
    supportedTransactionVersions: readonly ("legacy" | 0)[];
    signTransaction: SolanaSignTransactionMethod;
  };
  "solana:signAndSendTransaction": {
    version: "1.0.0";
    supportedTransactionVersions: readonly ("legacy" | 0)[];
    signAndSendTransaction: SolanaSignAndSendTransactionMethod;
  };
};

type SolanaWalletFeatures = StandardConnectFeature &
  StandardDisconnectFeature &
  StandardEventsFeature &
  SolanaSignFeatures;

export class LedgerSolanaWallet implements Wallet {
  readonly version = "1.0.0" as const;
  readonly name = "Ledger";
  readonly icon = getLedgerProviderIcon() as WalletIcon;

  private _accounts: readonly WalletAccount[] = [];
  private _selectedAccount?: Account;
  private readonly _listeners: {
    [E in StandardEventsNames]?: StandardEventsListeners[E][];
  } = {};

  constructor(private readonly host: WalletProviderHost) {}

  /** Core pushes the freshly selected account (or `undefined` on disconnect). */
  setSelectedAccount(account: Account | undefined): void {
    this._selectedAccount = account;
    if (!account) {
      void this.disconnect();
    }
  }

  /** No-op for Solana today; kept for the BlockchainProvider contract. */
  setNetwork(_chainId: number): void {
    // Solana network is derived from the account cluster, not a chain id.
  }

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
      "solana:signMessage": {
        version: "1.0.0",
        signMessage: this.signMessage,
      },
      "solana:signTransaction": {
        version: "1.0.0",
        supportedTransactionVersions: ["legacy", 0],
        signTransaction: this.signTransaction,
      },
      "solana:signAndSendTransaction": {
        version: "1.0.0",
        supportedTransactionVersions: ["legacy", 0],
        signAndSendTransaction: this.signAndSendTransaction,
      },
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

  // Stub signing implementations (real signing arrives with LBD-580 / LBD-582).
  // For now they only log so dApps can discover the features without crashing.
  private readonly signMessage: SolanaSignMessageMethod = async (...inputs) => {
    console.log("[LedgerSolanaWallet] solana:signMessage", inputs);
    return inputs.map((input) => ({
      signedMessage: input.message,
      signature: new Uint8Array(64),
    }));
  };

  private readonly signTransaction: SolanaSignTransactionMethod = async (
    ...inputs
  ) => {
    console.log("[LedgerSolanaWallet] solana:signTransaction", inputs);
    return inputs.map((input) => ({ signedTransaction: input.transaction }));
  };

  private readonly signAndSendTransaction: SolanaSignAndSendTransactionMethod =
    async (...inputs) => {
      console.log("[LedgerSolanaWallet] solana:signAndSendTransaction", inputs);
      return inputs.map(() => ({ signature: new Uint8Array(64) }));
    };

  private async resolveSolanaAccount(): Promise<Account> {
    if (
      this._selectedAccount &&
      isSupportedSolanaCurrency(this._selectedAccount.currencyId)
    ) {
      return this._selectedAccount;
    }

    const account = await this.host.requestAccount("solana");
    if (!isSupportedSolanaCurrency(account.currencyId)) {
      throw new Error("Selected account is not a Solana account");
    }
    this._selectedAccount = account;
    return account;
  }

  private toWalletAccount(account: Account): WalletAccount {
    const cluster = getClusterFromCurrencyId(account.currencyId);
    return {
      address: account.freshAddress,
      publicKey: new Uint8Array(
        addressEncoder.encode(address(account.freshAddress)),
      ),
      chains: [CLUSTER_TO_CHAIN[cluster]],
      features: [
        "solana:signMessage",
        "solana:signTransaction",
        "solana:signAndSendTransaction",
      ],
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
