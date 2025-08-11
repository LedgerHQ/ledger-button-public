/**
 * Ledger EIP-1193 Provider
 *
 * A complete implementation of the EIP-1193 Ethereum Provider JavaScript API
 * for Ledger hardware wallets.
 *
 * @see https://eips.ethereum.org/EIPS/eip-1193
 * @see https://eips.ethereum.org/EIPS/eip-1102
 * @see https://eips.ethereum.org/EIPS/eip-6963
 * @see https://eips.ethereum.org/EIPS/eip-2255
 */

import "../ledger-button-app.js";

// import { LedgerButtonCore } from "@ledgerhq/ledger-button-core";`
import { LedgerButtonApp } from "../ledger-button-app.js";

export type RpcMethods =
  | "eth_accounts"
  | "eth_requestAccounts"
  | "personal_sign"
  | "eth_sendRawTransaction"
  | "eth_sendTransaction"
  | "eth_signTransaction"
  | "eth_signTypedData";

export interface RequestArguments {
  readonly method: RpcMethods;
  readonly params?: readonly unknown[] | object;
}

export interface ProviderRpcError extends Error {
  code: number;
  data?: unknown;
}

// Error codes as defined in EIP-1193
export const CommonEIP1193ErrorCode = {
  UserRejectedRequest: 4001,
  Unauthorized: 4100,
  UnsupportedMethod: 4200,
  Disconnected: 4900,
  ChainDisconnected: 4901,
  // Additional common error codes (JSON-RPC 2.0)
  ParseError: -32700,
  InvalidRequest: -32600,
  MethodNotFound: -32601,
  InvalidParams: -32602,
  InternalError: -32603,
} as const;

export interface ProviderMessage {
  readonly type: string;
  readonly data: unknown;
}

export interface ProviderConnectInfo {
  readonly chainId: string;
}

export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: LedgerEIP1193Provider;
}

export interface EIP6963AnnounceProviderEvent extends CustomEvent {
  type: "eip6963:announceProvider";
  detail: EIP6963ProviderDetail;
}

export interface EIP6963RequestProviderEvent extends Event {
  type: "eip6963:requestProvider";
}

// Standard Ethereum RPC method interfaces
export interface EthRequestAccountsResult {
  accounts: string[];
}

export interface EthSendTransactionParams {
  from: string;
  to?: string;
  gas?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  value?: string;
  data?: string;
  nonce?: string;
  type?: string;
  chainId?: string;
}

export type EthSignTransactionParams = EthSendTransactionParams;

export interface PersonalSignParams {
  message: string;
  address: string;
}

export interface EthSignTypedDataParams {
  address: string;
  typedData: {
    types: Record<string, Array<{ name: string; type: string }>>;
    primaryType: string;
    domain: Record<string, unknown>;
    message: Record<string, unknown>;
  };
}

// Provider events
export type ProviderEvent =
  | "connect"
  | "disconnect"
  | "chainChanged"
  | "accountsChanged"
  | "message";

// Chain information
export interface ChainInfo {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
}

export class LedgerEIP1193Provider extends EventTarget {
  private _isConnected = false;
  private _supportedChains: Map<string, ChainInfo> = new Map();

  // NOTE: Tracking listeners by function reference
  // This is a workaround to wrap the event listener in the `on` method
  // so we can remove it later
  private _listeners: Map<
    (...args: unknown[]) => void,
    (e: CustomEvent | Event) => void
  > = new Map();

  constructor(
    // private readonly core: LedgerButtonCore,
    private readonly app: LedgerButtonApp,
  ) {
    super();
    this.initializeSupportedChains();
  }

  // Handlers for the different RPC methods
  private handleRequestAccounts(): Promise<string[]> {
    return new Promise((resolve) => {
      this.app.navigationIntent("selectAccount");

      window.addEventListener(
        "ledger-provider-account-selected",
        (e) => {
          this.dispatchEvent(
            new CustomEvent<{ accounts: string[] }>("accountsChanged", {
              bubbles: true,
              composed: true,
              detail: { accounts: e.detail.accounts },
            }),
          );

          resolve(e.detail.accounts);
        },
        {
          once: true,
        },
      );
    });
  }

  handlers = {
    eth_accounts: (_: unknown) => this.handleRequestAccounts(),
    eth_requestAccounts: (_: unknown) => this.handleRequestAccounts(),
    eth_sendTransaction: () => {
      return Promise.reject(new Error("eth_sendTransaction not implemented"));
    },
    eth_sendRawTransaction: () => {
      return Promise.reject(new Error("eth_sendTransaction not implemented"));
    },
    eth_signTransaction: () => {
      return Promise.reject(new Error("eth_sendTransaction not implemented"));
    },
    personal_sign: () => {
      return Promise.reject(new Error("eth_sendTransaction not implemented"));
    },
    eth_signTypedData: () => {
      return Promise.reject(new Error("eth_sendTransaction not implemented"));
    },
  };

  // Public API
  public request({
    method,
    params,
  }: RequestArguments): ReturnType<
    (typeof this.handlers)[keyof typeof this.handlers]
  > {
    const handler = this.handlers[method];

    if (!handler) {
      throw this.createError(
        CommonEIP1193ErrorCode.UnsupportedMethod,
        `Method ${method} not supported`,
      );
    }

    return handler(params);
  }

  public on(
    eventName: ProviderEvent,
    listener: (...args: unknown[]) => void,
  ): this {
    this._listeners.set(listener, (e) => {
      // NOTE: we should not handle non-custom events here
      if (e instanceof CustomEvent) {
        listener(...e.detail);
      }
    });

    const fn = this._listeners.get(listener);
    if (!fn) return this;

    this.addEventListener(eventName, fn);
    return this;
  }

  public removeListener(
    eventName: ProviderEvent,
    listener: (...args: unknown[]) => void,
  ): this {
    const fn = this._listeners.get(listener);
    if (!fn) return this;
    this.removeEventListener(eventName, fn);
    this._listeners.delete(listener);
    return this;
  }

  public isConnected(): boolean {
    return this._isConnected;
  }

  // NOTE: Those next two might be private in the end.
  async connect(): Promise<void> {
    // TODO: Logic to check if we are connected to a chain
    if (!this._isConnected) {
      this._isConnected = true;
      this.dispatchEvent(
        new CustomEvent<ProviderConnectInfo>("connect", {
          bubbles: true,
          composed: true,
          detail: {
            chainId: "0x1", // TODO: Replace with the actual chainId
          },
        }),
      );
    }
  }

  async disconnect(
    code = 1000, // NOTE: Code here must follow the [CloseEvent.code](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes) convention
    message = "Provider disconnected",
    data?: unknown,
  ): Promise<void> {
    // TODO: Logic to disconnect from the chain
    if (this._isConnected) {
      this._isConnected = false;
      this.dispatchEvent(
        new CustomEvent<ProviderRpcError>("disconnect", {
          bubbles: true,
          composed: true,
          detail: this.createError(code, message, data),
        }),
      );
    }
  }

  // Private API
  private createError(
    code: number,
    message: string,
    data?: unknown,
  ): ProviderRpcError {
    const error = new Error(message) as ProviderRpcError;
    error.code = code;
    error.data = data;
    return error;
  }

  private initializeSupportedChains(): void {
    // NOTE: Initialize with common Ethereum chains (infos to be verified!)
    this._supportedChains.set("0x1", {
      chainId: "0x1",
      chainName: "Ethereum Mainnet",
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrls: ["https://ethereum.publicnode.com"],
      blockExplorerUrls: ["https://etherscan.io"],
    });
  }
}

declare global {
  interface WindowEventMap {
    connect: CustomEvent<ProviderConnectInfo>;
    disconnect: CustomEvent<ProviderRpcError>;
    chainChanged: CustomEvent<ProviderConnectInfo>;
    accountsChanged: CustomEvent<{ accounts: string[] }>;
    message: CustomEvent<ProviderMessage>;
    "eip6963:announceProvider": EIP6963AnnounceProviderEvent;
    "eip6963:requestProvider": EIP6963RequestProviderEvent;
  }
}
