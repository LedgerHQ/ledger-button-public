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
  BlindSigningDisabledError,
  BroadcastTransactionError,
  // type ChainInfo,
  CommonEIP1193ErrorCode,
  type EIP1193Provider,
  type EIP6963AnnounceProviderEvent,
  type EIP6963RequestProviderEvent,
  type EthSignTypedDataParams,
  IncorrectSeedError,
  isBroadcastedTransactionResult,
  isSignedMessageOrTypedDataResult,
  isSignedTransactionResult,
  type ProviderConnectInfo,
  type ProviderEvent,
  type ProviderMessage,
  type ProviderRpcError,
  type RequestArguments,
  type RpcMethods,
  UserRejectedTransactionError,
} from "@ledgerhq/ledger-button-core";
import { LedgerButtonCore } from "@ledgerhq/ledger-button-core";

import { LedgerButtonApp } from "../ledger-button-app.js";

const EIP1193_SUPPORTED_METHODS = [
  "eth_accounts",
  "eth_requestAccounts",
  "eth_chainId",
  "eth_sendTransaction",
  "eth_signTransaction",
  "eth_signRawTransaction",
  "eth_sign",
  "eth_sendRawTransaction",
  "eth_signTypedData",
  "eth_signTypedData_v4",
];
//TODO complete with Node JSON rpc methods that can be broadcasted and directly handled by nodes

export class LedgerEIP1193Provider
  extends EventTarget
  implements EIP1193Provider
{
  private _isConnected = false;
  // private _supportedChains: Map<string, ChainInfo> = new Map();
  private _selectedAccount: string | null = null;
  private _selectedChainId = 1;

  private _id = 0;

  public isLedgerButton = true;

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
    return new Promise((resolve, reject) => {
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
            if (e.detail.status === "error") {
              return reject(this.mapErrors(e.detail.error));
            }

            if (e.detail.status === "success") {
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
            }
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
    method: RpcMethods,
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

      let tx: Record<string, unknown> | string;
      //Sanitize transaction for EIP-1193
      if (typeof params[0] === "object") {
        const transaction = params[0] as Record<string, unknown>;
        transaction["chainId"] = this._selectedChainId;
        tx = transaction;
      } else {
        tx = params[0] as string;
      }

      window.addEventListener(
        "ledger-provider-sign",
        (e) => {
          if (e.detail.status === "success") {
            if (isBroadcastedTransactionResult(e.detail.data)) {
              return resolve(e.detail.data.hash);
            }
            if (isSignedTransactionResult(e.detail.data)) {
              return resolve(e.detail.data.signedRawTransaction);
            }
          }

          if (e.detail.status === "error") {
            return reject(this.mapErrors(e.detail.error));
          }
        },
        {
          once: true,
        },
      );

      this.app.navigationIntent("signTransaction", {
        transaction: tx,
        method,
        broadcast,
      });
    });
  }

  private async handleSignTypedData(
    params: unknown[],
    method: RpcMethods,
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

      window.addEventListener(
        "ledger-provider-sign",
        (e) => {
          if (e.detail.status === "success") {
            if (isSignedMessageOrTypedDataResult(e.detail.data)) {
              return resolve(e.detail.data.signature);
            }
          }

          if (e.detail.status === "error") {
            return reject(this.mapErrors(e.detail.error));
          }
        },
        {
          once: true,
        },
      );

      if (
        typeof params[0] === "string" &&
        params[0].toLowerCase() !== this._selectedAccount.toLowerCase()
      ) {
        return reject(
          this.createError(
            CommonEIP1193ErrorCode.Unauthorized,
            "Address mismatch",
          ),
        );
      }

      if (params[1] === "string") {
        try {
          const p = JSON.parse(
            params[1] as string,
          ) as EthSignTypedDataParams["typedData"];
          this.app.navigationIntent("signTransaction", [params[0], p, method]);
          return;
        } catch (error) {
          return reject(
            this.createError(
              CommonEIP1193ErrorCode.InvalidParams,
              "Invalid typed data",
              {
                error,
              },
            ),
          );
        }
      }

      this.app.navigationIntent("signTransaction", [...params, method]);
    });
  }

  private async handleSignPersonalMessage(
    params: unknown[],
    method: RpcMethods,
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

      window.addEventListener(
        "ledger-provider-sign",
        (e) => {
          if (e.detail.status === "success") {
            if (isSignedMessageOrTypedDataResult(e.detail.data)) {
              return resolve(e.detail.data.signature);
            }
          }
          if (e.detail.status === "error") {
            return reject(this.mapErrors(e.detail.error));
          }
        },
        {
          once: true,
        },
      );

      this.app.navigationIntent("signTransaction", [...params, method]);
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
    eth_accounts: async (_: unknown, _method: RpcMethods) =>
      this.handleAccounts(),
    eth_requestAccounts: async (_: unknown, _method: RpcMethods) =>
      this.handleRequestAccounts(),
    eth_chainId: async (_: unknown) => this.handleChainId(),
    eth_sendTransaction: async (params: unknown[], method: RpcMethods) =>
      this.handleSignTransaction(params, method, true),
    eth_signTransaction: async (params: unknown[], method: RpcMethods) =>
      this.handleSignTransaction(params, method),
    eth_signRawTransaction: async (params: unknown[], method: RpcMethods) =>
      this.handleSignTransaction(params, method),
    eth_sign: async (params: unknown[], method: RpcMethods) =>
      this.handleSignPersonalMessage(params, method),
    eth_sendRawTransaction: async (params: unknown[], method: RpcMethods) =>
      this.handleSignTransaction(params, method, true),
    eth_signTypedData: async (params: unknown[], method: RpcMethods) =>
      this.handleSignTypedData(params, method),
    eth_signTypedData_v4: async (params: unknown[], method: RpcMethods) =>
      this.handleSignTypedData(params, method),
  } as const;

  // Public API
  public async request({ method, params }: RequestArguments) {
    if (method in this.handlers) {
      const res = await this.handlers[method as keyof typeof this.handlers](
        params as unknown[],
        method,
      );

      return res;
    }

    if (EIP1193_SUPPORTED_METHODS.includes(method)) {
      const res = await this.core.jsonRpcRequest({
        jsonrpc: "2.0",
        id: this._id++,
        method,
        params,
      });
      return res;
    }

    return this.createError(
      CommonEIP1193ErrorCode.UnsupportedMethod,
      `Method ${method} is not supported, { method: ${method}, params: ${JSON.stringify(params)} }`,
    );
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
    const err = new Error(message) as ProviderRpcError;
    const error = err;
    error.code = code;
    error.data = data;
    error.stack = err.stack;
    return error;
  }

  private mapErrors(error: unknown) {
    switch (true) {
      case error instanceof UserRejectedTransactionError:
        return this.createError(
          CommonEIP1193ErrorCode.UserRejectedRequest,
          "User rejected transaction",
          error,
        );
      case error instanceof BroadcastTransactionError:
        return this.createError(
          CommonEIP1193ErrorCode.InternalError,
          "Broadcast transaction failed",
          error,
        );
      case error instanceof BlindSigningDisabledError:
        return this.createError(
          CommonEIP1193ErrorCode.InternalError,
          "Blind signing disabled",
          error,
        );
      case error instanceof IncorrectSeedError:
        return this.createError(
          CommonEIP1193ErrorCode.Unauthorized,
          "Address mismatch",
          error,
        );
      default:
        return this.createError(
          CommonEIP1193ErrorCode.InternalError,
          "Unknown error",
          error,
        );
    }
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
