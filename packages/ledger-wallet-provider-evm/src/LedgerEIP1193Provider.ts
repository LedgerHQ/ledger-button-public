/**
 * Ledger EIP-1193 Provider
 *
 * A complete implementation of the EIP-1193 Ethereum Provider JavaScript API
 * for Ledger hardware wallets.
 *
 * The provider is a blackbox from the dApp's point of view and talks to core
 * only through a {@link CoreFacade}. It never imports
 * `LedgerButtonCore`, which keeps the `blockchain-provider` layer a candidate
 * for extraction into its own package.
 *
 * @see https://eips.ethereum.org/EIPS/eip-1193
 * @see https://eips.ethereum.org/EIPS/eip-1102
 * @see https://eips.ethereum.org/EIPS/eip-6963
 * @see https://eips.ethereum.org/EIPS/eip-2255
 */

import type { CoreFacade } from "@ledgerhq/ledger-wallet-provider-core";
import type { BlockchainFamily } from "@ledgerhq/ledger-wallet-provider-core";
import type { ProviderAccount } from "@ledgerhq/ledger-wallet-provider-core";
import type { BlockchainRpcMethods } from "@ledgerhq/ledger-wallet-provider-core";
import type { SignPersonalMessageParams } from "@ledgerhq/ledger-wallet-provider-core";
import type { SignRawTransactionParams } from "@ledgerhq/ledger-wallet-provider-core";
import type { SignTransactionParams } from "@ledgerhq/ledger-wallet-provider-core";
import type { SignTypedMessageParams } from "@ledgerhq/ledger-wallet-provider-core";
import {
  CommonEIP1193ErrorCode,
  type EIP1193Provider,
  type ProviderConnectInfo,
  type ProviderEvent,
  type ProviderRpcError,
  type RequestArguments,
  type RpcMethods,
  TypedData,
} from "@ledgerhq/ledger-wallet-provider-core";
import {
  isBroadcastedTransactionResult,
  isSignedMessageOrTypedDataResult,
  isSignedTransactionResult,
  type SignedResults,
} from "@ledgerhq/ledger-wallet-provider-core";
import {
  type SignFlowStatus,
  type SignType,
} from "@ledgerhq/ledger-wallet-provider-core";
import { toSignIntentType } from "@ledgerhq/ledger-wallet-provider-core";
import { hexToUtf8 } from "@ledgerhq/ledger-wallet-provider-core";
import { type Observable, Subject, type Subscription } from "rxjs";

import type { SignPersonalMessageUseCase } from "./use-case/SignPersonalMessageUseCase.js";
import type { SignRawTransaction } from "./use-case/SignRawTransaction.js";
import type { SignTransaction } from "./use-case/SignTransaction.js";
import type { SignTypedData } from "./use-case/SignTypedData.js";
import { getChainIdFromCurrencyId } from "./utils/chainUtils.js";
import { isBlockingRequestMethod } from "./utils/isBlockingRequestMethod.js";
import { resolveRpcRoute } from "./utils/resolveRpcRoute.js";
import { isSupportedChainId } from "./utils/supportedChains.js";

/** Lazily resolves the per-dApp RPC routing config (may be undefined). */
export type RpcMethodsLoader = () => Promise<BlockchainRpcMethods | undefined>;

/** EVM sign params accepted by the internal sign flow. */
type SignFlowParams =
  | SignTransactionParams
  | SignRawTransactionParams
  | SignTypedMessageParams
  | SignPersonalMessageParams;

/**
 * EVM-owned collaborators the provider needs to run the complete sign flow
 * internally. Supplied as plain constructor arguments (no DI decorators) by
 * {@link EvmBlockchainProvider}, which is built by the EVM factory.
 */
export type LedgerEIP1193ProviderDeps = {
  signTransaction: SignTransaction;
  signRawTransaction: SignRawTransaction;
  signTypedData: SignTypedData;
  signPersonalMessage: SignPersonalMessageUseCase;
};

export class LedgerEIP1193Provider
  extends EventTarget
  implements EIP1193Provider
{
  public readonly family: BlockchainFamily = "ethereum";
  private _isConnected = false;
  private _selectedAccount: ProviderAccount | null = null;
  private _selectedChainId = 1; // Default to Ethereum mainnet, when connected to the provider it is set to network 1

  private _id = 0;

  public isLedgerButton = true;

  // One blocking request (account selection / signing) in flight at a time.
  private _inFlight = false;

  // Per-dApp RPC routing config, lazily loaded once and cached.
  private _rpcMethods?: BlockchainRpcMethods;
  private _rpcMethodsLoaded = false;

  // NOTE: Tracking listeners by function reference
  // This is a workaround to wrap the event listener in the `on` method
  // so we can remove it later
  private _listeners: Map<
    (args: unknown) => void,
    (e: CustomEvent | Event) => void
  > = new Map();

  constructor(
    private readonly host: CoreFacade,
    private readonly deps: LedgerEIP1193ProviderDeps,
    private readonly loadRpcMethods?: RpcMethodsLoader,
  ) {
    super();
  }

  public async request({ method, params }: RequestArguments) {
    if (isBlockingRequestMethod(method)) {
      if (this._inFlight) {
        return Promise.reject(
          this.createError(
            CommonEIP1193ErrorCode.InternalError,
            "Ledger Provider is busy",
          ),
        );
      }

      this._inFlight = true;
      try {
        return await this.executeRequest({ method, params });
      } finally {
        this._inFlight = false;
      }
    }

    // Should be a JSON RPC request that can be broadcasted to Node RPC
    return this.executeRequest({ method, params });
  }

  public on<TEvent extends keyof ProviderEvent>(
    eventName: TEvent,
    listener: (args: ProviderEvent[TEvent]) => void,
  ): this {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._listeners.set(listener as any, (e) => {
      // NOTE: we should not handle non-custom events here
      if (e instanceof CustomEvent) {
        listener(e.detail);
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn = this._listeners.get(listener as any);
    if (!fn) return this;

    this.addEventListener(eventName, fn);
    return this;
  }

  public removeListener<TEvent extends keyof ProviderEvent>(
    eventName: TEvent,
    listener: (args: ProviderEvent[TEvent]) => void,
  ): this {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn = this._listeners.get(listener as any);
    if (!fn) return this;
    this.removeEventListener(eventName, fn);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._listeners.delete(listener as any);
    return this;
  }

  public isConnected(): boolean {
    return this._isConnected;
  }

  public async connect(): Promise<void> {
    if (!this._isConnected) {
      this._isConnected = true;

      this.dispatchEvent(
        new CustomEvent<ProviderConnectInfo>("connect", {
          bubbles: true,
          composed: true,
          detail: {
            chainId: "0x" + this._selectedChainId.toString(16),
          },
        }),
      );
    }
  }

  public async disconnect(
    code = 1000, // NOTE: Code here must follow the [CloseEvent.code](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes) convention
    message = "Provider disconnected",
    data?: unknown,
  ): Promise<void> {
    if (this._isConnected) {
      this._isConnected = false;
      this._selectedAccount = null;
      this._selectedChainId = 1; // Default to Ethereum mainnet
      this._inFlight = false;

      await this.host.disconnect(this.family);

      this.dispatchEvent(
        new CustomEvent<ProviderRpcError>("disconnect", {
          bubbles: true,
          composed: true,
          detail: this.createError(code, message, data),
        }),
      );
    }
  }

  /**
   * Core pushes the freshly selected account (or `undefined` on disconnect).
   * Emits EIP-1193 `accountsChanged` for switches made directly in the UI.
   */
  public setSelectedAccount(account: ProviderAccount | undefined): void {
    if (!account) {
      void this.disconnect();
      return;
    }

    if (
      this._selectedAccount &&
      this._selectedAccount.freshAddress === account.freshAddress &&
      this._isConnected
    ) {
      return;
    }

    this._isConnected = true;
    this._selectedAccount = account;
    this.dispatchEvent(
      new CustomEvent<string[]>("accountsChanged", {
        bubbles: true,
        composed: true,
        detail: [account.freshAddress],
      }),
    );

    this.setSelectedChainId(getChainIdFromCurrencyId(account.currencyId));
  }

  /** Core pushes the active chain id. Emits EIP-1193 `chainChanged`. */
  public setNetwork(chainId: number): void {
    this.setSelectedChainId(chainId);
  }

  private setSelectedChainId(chainId: number, forceAccountChange = false) {
    if (this._selectedChainId === chainId && !forceAccountChange) {
      return;
    }
    this._selectedChainId = chainId;
    this.dispatchEvent(
      new CustomEvent<string>("chainChanged", {
        bubbles: true,
        composed: true,
        detail: "0x" + chainId.toString(16),
      }),
    );
  }

  private async handleAccounts(): Promise<string[]> {
    if (this._selectedAccount) {
      return [this._selectedAccount.freshAddress];
    }
    return [];
  }

  private async handleRequestAccounts(): Promise<string[]> {
    const account = await this.host.requestAccount("ethereum");

    this._isConnected = true;
    this._selectedAccount = account;
    this.setSelectedChainId(getChainIdFromCurrencyId(account.currencyId), true);

    this.dispatchEvent(
      new CustomEvent<string[]>("accountsChanged", {
        bubbles: true,
        composed: true,
        detail: [account.freshAddress],
      }),
    );

    return [account.freshAddress];
  }

  private async handleSignTransaction(
    params: unknown[],
    method: RpcMethods,
    broadcast = false,
  ): Promise<string> {
    this.assertReadyToSign();

    let signParams: SignTransactionParams | SignRawTransactionParams;
    let runUseCase: () => Observable<SignFlowStatus>;
    if (typeof params[0] === "object") {
      signParams = {
        transaction: params[0] as SignTransactionParams["transaction"],
        method,
        broadcast,
      };
      const transactionParams = signParams as SignTransactionParams;
      runUseCase = () =>
        this.deps.signTransaction.execute(
          transactionParams,
          this._selectedAccount ?? undefined,
          this._selectedChainId,
        );
    } else {
      signParams = {
        transaction: params[0] as string,
        method,
        broadcast,
      };
      const rawParams = signParams as SignRawTransactionParams;
      runUseCase = () =>
        this.deps.signRawTransaction.execute(
          rawParams,
          this._selectedAccount ?? undefined,
        );
    }

    const result = await this.handleBlockchainRequest(
      signParams,
      "transaction",
      runUseCase,
      broadcast,
    );
    if (isBroadcastedTransactionResult(result)) {
      return result.hash;
    }
    if (isSignedTransactionResult(result)) {
      return result.signedRawTransaction;
    }
    throw this.createError(
      CommonEIP1193ErrorCode.InternalError,
      "Unexpected sign result",
    );
  }

  private async handleSignTypedData(
    params: unknown[],
    method: RpcMethods,
  ): Promise<string> {
    this.assertReadyToSign();

    if (
      typeof params[0] === "string" &&
      params[0].toLowerCase() !==
        this._selectedAccount?.freshAddress.toLowerCase()
    ) {
      throw this.createError(
        CommonEIP1193ErrorCode.Unauthorized,
        "Address mismatch",
      );
    }

    let payload: SignTypedMessageParams;
    if (typeof params[1] === "string") {
      try {
        const typedData = JSON.parse(params[1] as string) as TypedData;
        payload = [params[0] as string, typedData, method];
      } catch (error) {
        throw this.createError(
          CommonEIP1193ErrorCode.InvalidParams,
          "Invalid typed data",
          { error },
        );
      }
    } else {
      payload = [params[0] as string, params[1] as TypedData, method];
    }

    const result = await this.handleBlockchainRequest(
      payload,
      "typed-message",
      () =>
        this.deps.signTypedData.execute(
          payload,
          this._selectedAccount ?? undefined,
        ),
    );
    if (isSignedMessageOrTypedDataResult(result)) {
      return result.signature;
    }
    throw this.createError(
      CommonEIP1193ErrorCode.InternalError,
      "Unexpected sign result",
    );
  }

  private async handleSignPersonalMessage(
    params: unknown[],
    method: RpcMethods,
  ): Promise<string> {
    this.assertReadyToSign();

    let payload: SignPersonalMessageParams;
    // CF: https://docs.metamask.io/wallet/reference/json-rpc-methods/personal_sign
    if (method === "personal_sign") {
      const address = params[1] as string;
      const message = hexToUtf8(params[0] as string);
      payload = [address, message, method];
    } else {
      // eth_sign
      payload = [params[0] as string, params[1] as string, method];
    }

    const result = await this.handleBlockchainRequest(
      payload,
      "personal-sign",
      () =>
        this.deps.signPersonalMessage.execute(
          payload,
          this._selectedAccount ?? undefined,
        ),
    );
    if (isSignedMessageOrTypedDataResult(result)) {
      return result.signature;
    }
    throw this.createError(
      CommonEIP1193ErrorCode.InternalError,
      "Unexpected sign result",
    );
  }

  /**
   * Runs the complete EVM sign flow internally: emits a {@link WalletNavigationIntent}
   * so the UI can render and drive the flow (retry / finish), runs the matching
   * sign use-case, and resolves the dApp-facing promise with the signed result.
   *
   * The promise stays pending across UI retries and only settles when the
   * use-case emits `success` (resolve) or the user closes the modal (reject with
   * a `ModalClosedError`). Each emitted status is forwarded to the UI through
   * the intent's `status$` stream and to broadcasted-transaction tracking.
   */
  private handleBlockchainRequest(
    params: SignFlowParams,
    signType: SignType,
    runUseCase: () => Observable<SignFlowStatus>,
    broadcast = false,
  ): Promise<SignedResults> {
    return new Promise<SignedResults>((resolve, reject) => {
      const status$ = new Subject<SignFlowStatus>();
      let subscription: Subscription | undefined;
      let settled = false;

      const onClose = () => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        reject(
          this.createError(
            CommonEIP1193ErrorCode.UserRejectedRequest,
            "User closed the modal",
          ),
        );
      };

      const cleanup = () => {
        subscription?.unsubscribe();
        globalThis.removeEventListener?.("ledger-provider-close", onClose);
      };

      const start = () => {
        subscription?.unsubscribe();
        let observable: Observable<SignFlowStatus>;
        try {
          observable = runUseCase();
        } catch (error) {
          status$.next({ signType, status: "error", error });
          return;
        }
        subscription = observable.subscribe({
          next: (status) => {
            this.host.trackBroadcastedTransaction(status, params);
            status$.next(status);
            if (status.status === "success") {
              settled = true;
              globalThis.removeEventListener?.(
                "ledger-provider-close",
                onClose,
              );
              resolve(status.data);
            }
          },
          error: (error) => {
            status$.next({ signType, status: "error", error });
          },
        });
      };

      globalThis.addEventListener?.("ledger-provider-close", onClose);

      this.host.emitNavigationIntent({
        name: "signTransaction",
        params: {
          family: "ethereum",
          type: toSignIntentType(signType),
          broadcast,
        },
        status$: status$.asObservable(),
        retry: () => start(),
        finish: () => {
          cleanup();
          status$.complete();
        },
      });

      start();
    });
  }

  private async handleSwitchChainId(params: unknown[]): Promise<null> {
    if (!this._isConnected) {
      throw this.createError(
        CommonEIP1193ErrorCode.Disconnected,
        "Disconnected",
      );
    }

    const chainId = (params[0] as { chainId: string }).chainId;
    const chainIdNumber = parseInt(chainId, 16);

    if (!isSupportedChainId(chainIdNumber.toString())) {
      throw this.createError(
        CommonEIP1193ErrorCode.ChainDisconnected,
        "Unsupported chain",
      );
    }

    await this.host.requestSwitchChain(chainIdNumber);
    this.setSelectedChainId(chainIdNumber);

    // returns null if the active chain is switched.
    // cf. https://docs.metamask.io/wallet/reference/json-rpc-methods/wallet_switchEthereumChain#returns
    return null;
  }

  private async handleChainId(): Promise<string> {
    // Chain ID must be in hex format => https://ethereum.org/developers/docs/apis/json-rpc/#eth_chainId
    return "0x" + this._selectedChainId.toString(16);
  }

  private assertReadyToSign(): void {
    if (!this._isConnected) {
      throw this.createError(
        CommonEIP1193ErrorCode.Disconnected,
        "Disconnected",
      );
    }
    if (!this._selectedAccount) {
      throw this.createError(
        CommonEIP1193ErrorCode.Unauthorized,
        "No account selected",
      );
    }
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
    personal_sign: async (params: unknown[], method: RpcMethods) =>
      this.handleSignPersonalMessage(params, method),
    eth_sendRawTransaction: async (params: unknown[], method: RpcMethods) =>
      this.handleSignTransaction(params, method, true),
    eth_signTypedData: async (params: unknown[], method: RpcMethods) =>
      this.handleSignTypedData(params, method),
    eth_signTypedData_v4: async (params: unknown[], method: RpcMethods) =>
      this.handleSignTypedData(params, method),
    wallet_switchEthereumChain: async (
      params: unknown[],
      _method: RpcMethods,
    ) => this.handleSwitchChainId(params),
  } as const;

  /** Lazily load (once) and cache the per-dApp RPC routing config. */
  private async ensureRpcMethods(): Promise<void> {
    if (this._rpcMethodsLoaded || !this.loadRpcMethods) {
      return;
    }
    try {
      this._rpcMethods = await this.loadRpcMethods();
    } catch {
      this._rpcMethods = undefined;
    }
    this._rpcMethodsLoaded = true;
  }

  // Private method to execute request logic
  private async executeRequest({ method, params }: RequestArguments) {
    await this.ensureRpcMethods();
    const route = resolveRpcRoute(method, this._rpcMethods);

    if (route === "local" && method in this.handlers) {
      if (method !== "eth_requestAccounts" && !this._isConnected) {
        throw this.createError(
          CommonEIP1193ErrorCode.Unauthorized,
          "Unauthorized",
        );
      }

      return this.handlers[method as keyof typeof this.handlers](
        params as unknown[],
        method,
      );
    }

    if (route === "broadcasted") {
      return this.host.broadcastRPC(
        {
          jsonrpc: "2.0",
          id: this._id++,
          method,
          params,
        },
        { name: "ethereum", chainId: this._selectedChainId.toString() },
      );
    }

    throw this.createError(
      CommonEIP1193ErrorCode.UnsupportedMethod,
      `Method ${method} is not supported, { method: ${method}, params: ${JSON.stringify(params)} }`,
    );
  }

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
}
