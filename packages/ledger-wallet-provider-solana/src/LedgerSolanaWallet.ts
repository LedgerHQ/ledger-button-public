/**
 * Ledger Solana Wallet (Wallet Standard)
 *
 * Wallet Standard wallet that announces the Ledger button as a Solana wallet so
 * it is discoverable and usable by Wallet Standard compatible dApps (e.g. via
 * `@solana/wallet-adapter-react`).
 *
 * @see https://github.com/wallet-standard/wallet-standard
 */

import {
  address,
  getAddressEncoder,
  getBase58Encoder,
  getBase64Decoder,
} from "@solana/kit";
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
import { Either, Left, Right } from "purify-ts";
import {
  from,
  map,
  type Observable,
  of,
  Subject,
  type Subscription,
  switchMap,
} from "rxjs";

import {
  buildSendTransactionRequest,
  decodeSolanaSignature,
  extractBroadcastedSignature,
  type SolanaSendOptions,
} from "./datasource/rpc/solanaBroadcastUtils";
import {
  isBroadcastedSolanaTransactionResult,
  isSignedSolanaTransactionResult,
} from "./model/SolanaSignedResult";
export type { SolanaSignedResult } from "./model/SolanaSignedResult";
import type { CoreFacade } from "@ledgerhq/ledger-wallet-provider-core";
import type { BlockchainFamily } from "@ledgerhq/ledger-wallet-provider-core";
import type { ProviderAccount } from "@ledgerhq/ledger-wallet-provider-core";
import type { ProviderLogger } from "@ledgerhq/ledger-wallet-provider-core";
import type {
  SignFlowStatus,
  SignType,
} from "@ledgerhq/ledger-wallet-provider-core";
import type { SignSolanaMessageParams } from "@ledgerhq/ledger-wallet-provider-core";
import type { SignSolanaTransactionParams } from "@ledgerhq/ledger-wallet-provider-core";
import type { SolanaCluster } from "@ledgerhq/ledger-wallet-provider-core";
import {
  isSignedMessageOrTypedDataResult,
  type SignedResults,
} from "@ledgerhq/ledger-wallet-provider-core";
import { toSignIntentType } from "@ledgerhq/ledger-wallet-provider-core";
import { getLedgerProviderIcon } from "@ledgerhq/ledger-wallet-provider-core";

import type { SignSolanaMessage } from "./use-case/SignSolanaMessage";
import type { SignSolanaTransaction } from "./use-case/SignSolanaTransaction";
import {
  getBackendChainIdFromCurrencyId,
  getClusterFromCurrencyId,
  isSupportedSolanaCurrency,
} from "./utils/clusterUtils";
import { attachSolanaSignature } from "./utils/signatureUtils";

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
const base58Encoder = getBase58Encoder();
const base64Decoder = getBase64Decoder();

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
  ...inputs: readonly {
    account: WalletAccount;
    transaction: Uint8Array;
    options?: SolanaSendOptions;
  }[]
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

type LedgerSolanaWalletDeps = {
  signSolanaMessage: SignSolanaMessage;
  signSolanaTransaction: SignSolanaTransaction;
};

export class LedgerSolanaWallet implements Wallet {
  readonly version = "1.0.0" as const;
  readonly family: BlockchainFamily = "solana";
  readonly name = "Ledger";
  readonly icon = getLedgerProviderIcon() as WalletIcon;

  private _accounts: readonly WalletAccount[] = [];
  private _selectedAccount?: ProviderAccount;
  private readonly _listeners: {
    [E in StandardEventsNames]?: StandardEventsListeners[E][];
  } = {};
  private readonly logger: ProviderLogger;
  private _rpcId = 0;

  constructor(
    private readonly host: CoreFacade,
    private readonly deps: LedgerSolanaWalletDeps,
  ) {
    this.logger = this.host.getLogger("[LedgerSolanaWallet]");
  }

  /** Core pushes the freshly selected account (or `undefined` on disconnect). */
  setSelectedAccount(account: ProviderAccount | undefined): void {
    this._selectedAccount = account;

    if (!account) {
      void this.disconnect();
      return;
    }

    // Nothing to propagate until the dApp has connected (accounts not announced yet).
    if (this._accounts.length === 0) {
      return;
    }

    // Switching to a non-Solana account -> disconnect the Solana dApp.
    if (!isSupportedSolanaCurrency(account.currencyId)) {
      void this.disconnect();
      return;
    }

    // No actual change -> emit nothing.
    if (this._accounts[0]?.address === account.freshAddress) {
      return;
    }

    this._accounts = [this.toWalletAccount(account)];
    this.emitChange({ accounts: this._accounts });
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

  // Off-chain message signing. Runs the sign use case inside the provider and
  // emits a navigation intent so the button UI can drive the flow, matching the
  // EVM provider's handleBlockchainRequest pattern.
  private readonly signMessage: SolanaSignMessageMethod = async (...inputs) => {
    const account = await this.resolveSolanaAccount();

    const results: {
      signedMessage: Uint8Array;
      signature: Uint8Array;
      signatureType?: "ed25519";
    }[] = [];

    for (const input of inputs) {
      const { signature, signedMessage } = await this.signSolanaMessage(
        account,
        input.message,
      );
      results.push({
        signedMessage,
        signature,
        signatureType: "ed25519",
      });
    }

    return results;
  };

  private readonly signTransaction: SolanaSignTransactionMethod = async (
    ...inputs
  ) => {
    const account = await this.resolveSolanaAccount();

    // Hardware signing is one confirmation at a time; process sequentially.
    const results: { signedTransaction: Uint8Array }[] = [];
    for (const input of inputs) {
      results.push(
        await this.signSolanaTransaction(account, input.transaction),
      );
    }
    return results;
  };

  /**
   * Runs the full Solana sign flow for one transaction: emits a
   * {@link WalletNavigationIntent} so the UI can render/drive the flow, runs the
   * {@link SignSolanaTransaction} use-case, and resolves with the reassembled
   * signed wire transaction. Mirrors the EVM `handleBlockchainRequest`.
   */
  private signSolanaTransaction(
    account: ProviderAccount,
    transaction: Uint8Array,
  ): Promise<{ signedTransaction: Uint8Array }> {
    const params: SignSolanaTransactionParams = {
      kind: "solana-transaction",
      address: account.freshAddress,
      transaction,
    };

    return this.runSignFlow(
      params,
      "transaction",
      () => this.deps.signSolanaTransaction.execute(params, account),
      (data) =>
        isSignedSolanaTransactionResult(data)
          ? {
              signedTransaction: attachSolanaSignature(
                transaction,
                account.freshAddress,
                data.solanaSignature,
              ),
            }
          : undefined,
    );
  }

  private readonly signAndSendTransaction: SolanaSignAndSendTransactionMethod =
    async (...inputs) => {
      const account = await this.resolveSolanaAccount();

      // Hardware signing is one confirmation at a time; process sequentially.
      const results: { signature: Uint8Array }[] = [];
      for (const input of inputs) {
        const signature = await this.signAndBroadcastSolanaTransaction(
          account,
          input.transaction,
          input.options,
        );
        results.push({ signature });
      }
      return results;
    };

  /**
   * Signs then broadcasts one transaction, both phases inside {@link runSignFlow}
   * so a broadcast failure surfaces in the modal (with retry) and a success is
   * tracked as a pending transaction, mirroring the EVM flow. Resolves with the
   * raw 64-byte signature.
   */
  private signAndBroadcastSolanaTransaction(
    account: ProviderAccount,
    transaction: Uint8Array,
    options?: SolanaSendOptions,
  ): Promise<Uint8Array> {
    const params: SignSolanaTransactionParams = {
      kind: "solana-transaction",
      address: account.freshAddress,
      transaction,
    };

    return this.runSignFlow(
      params,
      "transaction",
      () =>
        this.deps.signSolanaTransaction.execute(params, account).pipe(
          switchMap((status): Observable<SignFlowStatus> => {
            // Only the signed success is swapped for the broadcast.
            if (
              status.status !== "success" ||
              !isSignedSolanaTransactionResult(status.data)
            ) {
              return of(status);
            }

            const signedTransaction = attachSolanaSignature(
              transaction,
              account.freshAddress,
              status.data.solanaSignature,
            );

            return from(
              this.broadcastSolanaTransaction(
                account,
                base64Decoder.decode(signedTransaction),
                options,
              ),
            ).pipe(
              map(
                (result): SignFlowStatus =>
                  result.caseOf<SignFlowStatus>({
                    Left: (error) => ({
                      signType: "transaction",
                      status: "error",
                      error,
                    }),
                    Right: ({ hash, signature }) => ({
                      signType: "transaction",
                      status: "success",
                      data: { hash, signature },
                    }),
                  }),
              ),
            );
          }),
        ),
      (data) =>
        isBroadcastedSolanaTransactionResult(data) ? data.signature : undefined,
    );
  }

  /**
   * Broadcasts a base64-encoded signed wire transaction through
   * {@link CoreFacade.broadcastRPC}, which owns the routing: staging uses the
   * button backend, production still hits Ledger's public Solana node proxy
   * (see LBD-712). Resolves with the base58 transaction signature, used as the
   * explorer `hash`, and the raw 64-byte signature.
   */
  private async broadcastSolanaTransaction(
    account: ProviderAccount,
    base64WireTx: string,
    options?: SolanaSendOptions,
  ): Promise<Either<Error, { hash: string; signature: Uint8Array }>> {
    const chainId = getBackendChainIdFromCurrencyId(account.currencyId);
    if (!chainId) {
      this.logger.error("No Solana chain id for currency", {
        currencyId: account.currencyId,
      });
      return Left(
        new Error(
          `Solana broadcast failed: no chain id for ${account.currencyId}`,
        ),
      );
    }

    this.logger.info("Broadcasting Solana transaction");
    this.logger.debug("Solana broadcast payload", {
      base64WireTxLength: base64WireTx.length,
      commitment: options?.commitment,
      skipPreflight: options?.skipPreflight,
      preflightCommitment: options?.preflightCommitment,
      maxRetries: options?.maxRetries,
      minContextSlot: options?.minContextSlot,
    });

    try {
      const response = await this.host.broadcastRPC(
        buildSendTransactionRequest(this._rpcId++, base64WireTx, options),
        { name: "solana", chainId },
      );

      const hash = extractBroadcastedSignature(response);

      if (hash === undefined) {
        const error =
          "error" in response
            ? response.error
            : { message: "Unknown broadcast error" };
        this.logger.error("Solana broadcast failed", { error });
        return Left(new Error(`Solana broadcast failed: ${error.message}`));
      }

      this.logger.info("Solana broadcast succeeded", { hash });
      return Right({ hash, signature: decodeSolanaSignature(hash) });
    } catch (error) {
      this.logger.error("Solana broadcast failed", { error });
      return Left(
        error instanceof Error
          ? error
          : new Error("Solana broadcast failed", { cause: error }),
      );
    }
  }

  private async resolveSolanaAccount(): Promise<ProviderAccount> {
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

  /**
   * Shared driver for every Solana sign flow (message / transaction). Emits a
   * {@link WalletNavigationIntent} so the button UI can render and drive the
   * phase, runs `runUseCase`, forwards each {@link SignFlowStatus} to the modal
   * (and to core for tracking), and resolves once `mapResult` turns a success
   * status into a caller-shaped value. Mirrors the EVM `handleBlockchainRequest`.
   *
   * The promise only settles on a mapped success or a modal close; error
   * statuses (thrown synchronously, streamed via rxjs `error`, or emitted as a
   * `status: "error"` value) surface in the modal so the user can retry.
   *
   * @param mapResult maps a success payload to the resolved value, or returns
   * `undefined` to keep waiting when the payload is not the expected shape.
   */
  private runSignFlow<T>(
    params: SignSolanaMessageParams | SignSolanaTransactionParams,
    signType: SignType,
    runUseCase: () => Observable<SignFlowStatus>,
    mapResult: (data: SignedResults) => T | undefined,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const status$ = new Subject<SignFlowStatus>();
      let subscription: Subscription | undefined;
      let settled = false;

      this.logger.debug("Starting Solana sign flow", {
        kind: params.kind,
        signType,
        address: params.address,
      });

      const onClose = () => {
        if (settled) {
          return;
        }
        settled = true;
        this.logger.debug("User closed the modal", {
          kind: params.kind,
          signType,
        });
        cleanup();
        reject(new Error("User closed the modal"));
      };

      const cleanup = () => {
        subscription?.unsubscribe();
        globalThis.removeEventListener?.("ledger-provider-close", onClose);
      };

      const emitError = (error: unknown) => {
        const status: SignFlowStatus = { signType, status: "error", error };
        this.host.trackBroadcastedTransaction(status, params);
        status$.next(status);
      };

      const start = () => {
        subscription?.unsubscribe();
        let observable: Observable<SignFlowStatus>;
        try {
          observable = runUseCase();
        } catch (error) {
          emitError(error);
          return;
        }
        subscription = observable.subscribe({
          next: (status) => {
            this.host.trackBroadcastedTransaction(status, params);
            status$.next(status);
            if (status.status !== "success") {
              return;
            }
            const result = mapResult(status.data);
            if (result === undefined) {
              return;
            }
            settled = true;
            globalThis.removeEventListener?.("ledger-provider-close", onClose);
            resolve(result);
          },
          error: emitError,
        });
      };

      globalThis.addEventListener?.("ledger-provider-close", onClose);

      this.host.emitNavigationIntent({
        name: "signTransaction",
        params: {
          family: "solana",
          type: toSignIntentType(signType),
          // Solana signing never broadcasts through core today.
          broadcast: false,
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

  private signSolanaMessage(
    account: ProviderAccount,
    message: Uint8Array,
  ): Promise<{ signature: Uint8Array; signedMessage: Uint8Array }> {
    const params: SignSolanaMessageParams = {
      kind: "solana-message",
      address: account.freshAddress,
      message,
    };

    return this.runSignFlow(
      params,
      "solana-message",
      () =>
        this.deps.signSolanaMessage.execute(
          params,
          this._selectedAccount ?? undefined,
        ),
      (data) =>
        isSignedMessageOrTypedDataResult(data) && data.signedMessage
          ? {
              signature: new Uint8Array(base58Encoder.encode(data.signature)),
              signedMessage: data.signedMessage,
            }
          : undefined,
    );
  }

  private toWalletAccount(account: ProviderAccount): WalletAccount {
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
