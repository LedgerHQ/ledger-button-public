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

import {
  type ChainInfo,
  CommonEIP1193ErrorCode,
  type EIP1193Provider,
  type EIP6963AnnounceProviderEvent,
  type EIP6963RequestProviderEvent,
  type ProviderConnectInfo,
  type ProviderEvent,
  type ProviderMessage,
  type ProviderRpcError,
  type RequestArguments,
  type Signature,
  type SignedTransaction,
} from "@ledgerhq/ledger-button-core";
import { LedgerButtonCore } from "@ledgerhq/ledger-button-core";

import { LedgerButtonApp } from "../ledger-button-app.js";

export class LedgerEIP1193Provider
  extends EventTarget
  implements EIP1193Provider
{
  private _isConnected = false;
  private _supportedChains: Map<string, ChainInfo> = new Map();
  private _selectedAccount: string | null = null;

  private _id = 0;

  // NOTE: Tracking listeners by function reference
  // This is a workaround to wrap the event listener in the `on` method
  // so we can remove it later
  private _listeners: Map<
    (args: any) => void,
    (e: CustomEvent | Event) => void
  > = new Map();

  constructor(
    private readonly core: LedgerButtonCore,
    private readonly app: LedgerButtonApp,
  ) {
    super();
    this.initializeSupportedChains();

    window.addEventListener("ledger-provider-disconnect", () => {
      this.disconnect();
    });
  }

  // Handlers for the different RPC methods
  private handleRequestAccounts(): Promise<string[]> {
    return new Promise((resolve) => {
      this.app.navigationIntent("selectAccount");

      window.addEventListener(
        "ledger-provider-account-selected",
        (e) => {
          // EIP-1193 accountsChanged event
          this.dispatchEvent(
            new CustomEvent<string[]>("accountsChanged", {
              bubbles: true,
              composed: true,
              detail: [e.detail.accounts[0]],
            }),
          );
          // TODO: replace with real connection logic
          this._selectedAccount = e.detail.accounts[0];
          this._isConnected = true;
          resolve([e.detail.accounts[0]]);
        },
        {
          once: true,
        },
      );
    });
  }

  private handleSignTransaction(params: object): Promise<SignedTransaction> {
    return new Promise((resolve, reject) => {
      if (!this._selectedAccount) {
        return reject(
          this.createError(
            CommonEIP1193ErrorCode.Unauthorized,
            "No account selected",
          ),
        );
      }

      this.app.navigationIntent("signTransaction", params);

      window.addEventListener(
        "ledger-provider-sign-transaction",
        (e) => {
          resolve(e?.detail);
        },
        {
          once: true,
        },
      );
    });
  }

  private handleSignTypedData(params: object): Promise<Signature> {
    return new Promise((resolve, reject) => {
      if (!this._selectedAccount) {
        return reject(
          this.createError(
            CommonEIP1193ErrorCode.Unauthorized,
            "No account selected",
          ),
        );
      }

      this.app.navigationIntent("signTransaction", params);

      window.addEventListener(
        "ledger-provider-sign-typed-data",
        (e) => {
          resolve(e?.detail);
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
    // NOTE: DEFERRED TO CORE
    // eth_sendTransaction: () => {
    //   return Promise.reject(new Error("eth_sendTransaction not implemented"));
    // },
    // eth_sendRawTransaction: () => {
    //   return Promise.reject(new Error("eth_sendTransaction not implemented"));
    // },
    eth_signTransaction: (params: object) => this.handleSignTransaction(params),
    // personal_sign: () => {
    //   return Promise.reject(new Error("eth_sendTransaction not implemented"));
    // },
    eth_signTypedData: (params: object) => this.handleSignTypedData(params),
  } as const;

  // Public API
  public request({ method, params }: RequestArguments) {
    if (method in this.handlers) {
      return this.handlers[method as keyof typeof this.handlers](params);
    }

    return this.core.jsonRpcRequest({
      jsonrpc: "2.0",
      id: this._id++,
      method,
      params,
    });
  }

  public on<TEvent extends keyof ProviderEvent>(
    eventName: TEvent,
    listener: (args: ProviderEvent[TEvent]) => void,
  ): this {
    this._listeners.set(listener, (e) => {
      // NOTE: we should not handle non-custom events here
      if (e instanceof CustomEvent) {
        listener(e.detail);
      }
    });

    const fn = this._listeners.get(listener);
    if (!fn) return this;

    this.addEventListener(eventName, fn);
    return this;
  }

  public removeListener<TEvent extends keyof ProviderEvent>(
    eventName: TEvent,
    listener: (args: ProviderEvent[TEvent]) => void,
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
    accountsChanged: CustomEvent<string[]>;
    message: CustomEvent<ProviderMessage>;
    "eip6963:announceProvider": EIP6963AnnounceProviderEvent;
    "eip6963:requestProvider": EIP6963RequestProviderEvent;
  }
}
