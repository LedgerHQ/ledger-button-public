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
  // type ChainInfo,
  CommonEIP1193ErrorCode,
  type EIP1193Provider,
  type EIP6963AnnounceProviderEvent,
  type EIP6963RequestProviderEvent,
  isBroadcastedTransactionResult,
  type ProviderConnectInfo,
  type ProviderEvent,
  type ProviderMessage,
  type ProviderRpcError,
  type RequestArguments,
} from "@ledgerhq/ledger-button-core";
import { LedgerButtonCore } from "@ledgerhq/ledger-button-core";

import { LedgerButtonApp } from "../ledger-button-app.js";

export class LedgerEIP1193Provider
  extends EventTarget
  implements EIP1193Provider
{
  private _isConnected = false;
  // private _supportedChains: Map<string, ChainInfo> = new Map();
  private _selectedAccount: string | null = null;
  private _selectedChainId = 1;

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

    window.addEventListener("ledger-provider-disconnect", () => {
      this.disconnect();
    });
  }

  private async handleAccounts(): Promise<string[]> {
    return new Promise((resolve) => {
      if (
        this._selectedAccount &&
        this.core.getSelectedAccount()?.freshAddress === this._selectedAccount
      ) {
        this.dispatchEvent(
          new CustomEvent<string[]>("accountsChanged", {
            bubbles: true,
            composed: true,
            detail: [this._selectedAccount],
          }),
        );
        return resolve([this._selectedAccount]);
      }

      const selectedAccount = this.core.getSelectedAccount();
      if (selectedAccount) {
        this._selectedAccount = selectedAccount.freshAddress;
        this._isConnected = true;
        this.dispatchEvent(
          new CustomEvent<string[]>("accountsChanged", {
            bubbles: true,
            composed: true,
            detail: [selectedAccount.freshAddress],
          }),
        );
        return resolve([selectedAccount.freshAddress]);
      }

      this.dispatchEvent(
        new CustomEvent<string[]>("accountsChanged", {
          bubbles: true,
          composed: true,
          detail: [],
        }),
      );

      return resolve([]);
    });
  }

  // Handlers for the different RPC methods
  private async handleRequestAccounts(): Promise<string[]> {
    return new Promise((resolve) => {
      const selectedAccount = this.core.getSelectedAccount();

      if (selectedAccount) {
        this._selectedAccount = selectedAccount.freshAddress;
        this._isConnected = true;
        this.dispatchEvent(
          new CustomEvent<string[]>("accountsChanged", {
            bubbles: true,
            composed: true,
            detail: [selectedAccount.freshAddress],
          }),
        );
        return resolve([selectedAccount.freshAddress]);
      } else {
        window.addEventListener(
          "ledger-provider-account-selected",
          (e) => {
            this._isConnected = true;
            this._selectedAccount = e.detail.account.freshAddress;

            this.dispatchEvent(
              new CustomEvent<string[]>("accountsChanged", {
                bubbles: true,
                composed: true,
                detail: [e.detail.account.freshAddress],
              }),
            );
            this._selectedAccount = e.detail.account.freshAddress;
            // TODO: create mapping between chainId and account.currencyId
            this._selectedChainId = 1; // TODO: fetch the chain id from ?
            this._isConnected = true;
            resolve([e.detail.account.freshAddress]);
          },
          {
            once: true,
          },
        );

        this.app.navigationIntent("selectAccount");
      }
    });
  }

  private async handleSignTransaction(
    params: unknown[],
    broadcast = false,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this._selectedAccount) {
        return reject(
          this.createError(
            CommonEIP1193ErrorCode.Unauthorized,
            "No account selected",
          ),
        );
      }

      //Sanitize transaction for EIP-1193
      const transaction = params[0] as Record<string, unknown>;
      transaction["chainId"] = this._selectedChainId;

      window.addEventListener(
        "ledger-provider-sign-transaction",
        (e) => {
          if (isBroadcastedTransactionResult(e.detail)) {
            resolve(e.detail.hash);
          } else {
            resolve(e.detail.signedRawTransaction);
          }
        },
        {
          once: true,
        },
      );

      this.app.navigationIntent("signTransaction", {
        transaction: transaction,
        broadcast,
      });
    });
  }

  private async handleSignTypedData(params: object): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this._selectedAccount) {
        return reject(
          this.createError(
            CommonEIP1193ErrorCode.Unauthorized,
            "No account selected",
          ),
        );
      }

      window.addEventListener(
        "ledger-provider-sign-message",
        (e) => {
          resolve(e.detail.signature);
        },
        {
          once: true,
        },
      );

      this.app.navigationIntent("signTransaction", params);
    });
  }

  private async handleSignPersonalMessage(params: object): Promise<string> {
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
        "ledger-provider-sign-message",
        (e) => {
          resolve(e.detail.signature);
        },
        {
          once: true,
        },
      );
    });
  }

  handleChainId(): Promise<string> {
    return new Promise((resolve) => {
      this.dispatchEvent(
        new CustomEvent("chainChanged", {
          bubbles: true,
          composed: true,
          detail: {
            chainId: this._selectedChainId.toString(16),
          },
        }),
      );

      //Chain ID must be in hex format => https://ethereum.org/developers/docs/apis/json-rpc/#eth_chainId
      resolve(this._selectedChainId.toString(16));
    });
  }

  handlers = {
    eth_accounts: async (_: unknown) => this.handleAccounts(),
    eth_requestAccounts: async (_: unknown) => this.handleRequestAccounts(),
    eth_chainId: async (_: unknown) => this.handleChainId(),
    eth_sendTransaction: async (params: unknown[]) =>
      this.handleSignTransaction(params, true),
    eth_signTransaction: async (params: unknown[]) =>
      this.handleSignTransaction(params),
    eth_signRawTransaction: async (params: unknown[]) =>
      this.handleSignTransaction(params),
    eth_sign: async (params: unknown[]) =>
      this.handleSignPersonalMessage(params),
    eth_sendRawTransaction: async (params: unknown[]) =>
      this.handleSignTransaction(params, true),
    eth_signTypedData: async (params: unknown[]) =>
      this.handleSignTypedData(params),
    eth_signTypedData_v4: async (params: unknown[]) =>
      this.handleSignTypedData(params),
  } as const;

  // Public API
  public async request({ method, params }: RequestArguments) {
    if (method in this.handlers) {
      const res = await this.handlers[method as keyof typeof this.handlers](
        params as unknown[],
      );

      return res;
    }

    const res = await this.core.jsonRpcRequest({
      jsonrpc: "2.0",
      id: this._id++,
      method,
      params,
    });

    return res;
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
      this.core.disconnect();
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

  //TODO: check if still needed
  // private initializeSupportedChains(): void {
  //   // NOTE: Initialize with common Ethereum chains (infos to be verified!)
  //   this._supportedChains.set("0x1", {
  //     chainId: "0x1",
  //     chainName: "Ethereum Mainnet",
  //     nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  //     rpcUrls: ["https://ethereum.publicnode.com"],
  //     blockExplorerUrls: ["https://etherscan.io"],
  //   });
  // }
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
