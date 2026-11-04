import type {
  BroadcastResponse,
  CoreFacade,
  ProviderAccount,
  ProviderLogger,
} from "@ledgerhq/ledger-wallet-provider-core";

import {
  XrpNotConnectedError,
  XrpSubmitFailedError,
} from "./model/XrpApiError";
import { isSignedXrpTransactionResult } from "./model/XrpSignedResult";
import type {
  SignedXrpTransaction,
  XrpTransaction,
} from "./model/XrpTransaction";
import type { SignXrpTransaction } from "./use-case/SignXrpTransaction";
import { runSignFlow } from "./utils/runSignFlow";
import { autofillTransaction } from "./utils/xrpAutofill";
import { assertSubmitAccepted } from "./utils/xrpSubmitResult";
import {
  assembleSignedTransaction,
  getXrpDestination,
  getXrpDropsAmount,
  serializeForDevice,
  withSigningFields,
} from "./utils/xrpTransaction";
import {
  getNetworkIdFromCurrencyId,
  isSupportedXrpCurrency,
  XRP_FAMILY,
} from "./utils/xrpUtils";
import type {
  LedgerXrpApi,
  XrpAccountInfo,
  XrpApiEvent,
  XrpApiListener,
  XrpConnectOptions,
} from "./LedgerXrpApi";

export class XrpWalletProvider implements LedgerXrpApi {
  readonly family = XRP_FAMILY;
  private account?: ProviderAccount;
  private readonly listeners = new Map<XrpApiEvent, Set<XrpApiListener>>();
  private readonly logger: ProviderLogger;

  constructor(
    private readonly core: CoreFacade,
    private readonly signXrp: SignXrpTransaction,
  ) {
    this.logger = this.core.getLogger("[XrpWalletProvider]");
  }

  setSelectedAccount(account: ProviderAccount | undefined): void {
    const previousAddress = this.account?.freshAddress;
    this.account =
      account && isSupportedXrpCurrency(account.currencyId)
        ? account
        : undefined;

    if (this.account?.freshAddress !== previousAddress) {
      this.emit("accountChanged", this.selectedAccountInfo());
    }
  }

  async connect(options?: XrpConnectOptions): Promise<XrpAccountInfo> {
    return this.reportErrors(async () => {
      if (options?.silent && !this.account) {
        throw new XrpNotConnectedError();
      }

      const info = this.toAccountInfo(await this.resolveAccount());
      this.emit("connect", info);
      return info;
    });
  }

  async disconnect(): Promise<void> {
    this.account = undefined;
    await this.core.disconnect(XRP_FAMILY);
    this.emit("disconnect", undefined);
  }

  async getAccount(): Promise<XrpAccountInfo | null> {
    return this.selectedAccountInfo();
  }

  async fetchAccount(): Promise<XrpAccountInfo | null> {
    return this.getAccount();
  }

  async sign(tx: XrpTransaction): Promise<SignedXrpTransaction> {
    return this.reportErrors(
      async () => (await this.signWithDevice(structuredClone(tx))).signed,
    );
  }

  async signAndSubmit(tx: XrpTransaction): Promise<{ hash: string }> {
    return this.reportErrors(async () => {
      const { signed, unsigned, account } = await this.signWithDevice(
        structuredClone(tx),
      );
      await this.submit(account, signed.tx_blob);
      this.trackSubmission(signed, unsigned);
      return { hash: signed.hash };
    });
  }

  on(event: XrpApiEvent, listener: XrpApiListener): void {
    const forEvent = this.listeners.get(event) ?? new Set<XrpApiListener>();
    forEvent.add(listener);
    this.listeners.set(event, forEvent);
  }

  off(event: XrpApiEvent, listener: XrpApiListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  private async signWithDevice(tx: XrpTransaction): Promise<{
    signed: SignedXrpTransaction;
    unsigned: XrpTransaction;
    account: ProviderAccount;
  }> {
    const account = await this.resolveAccount();
    this.assertSenderIsSelectedAccount(tx, account);
    const filled = await autofillTransaction(
      tx,
      account.freshAddress,
      (method, params) => this.requestXrpl(account, method, params),
    );

    const { xrpSignature, signingPubKey } = await runSignFlow({
      core: this.core,
      logger: this.logger,
      runUseCase: () => this.signXrp.execute(filled, account),
      mapResult: (data) =>
        isSignedXrpTransactionResult(data) ? data : undefined,
    });

    const unsigned = withSigningFields(
      filled,
      account.freshAddress,
      signingPubKey,
    );
    const signed = await assembleSignedTransaction(unsigned, xrpSignature);
    return { signed, unsigned, account };
  }

  /** Rejects unless the node accepted or queued the transaction. */
  private async submit(
    account: ProviderAccount,
    txBlob: string,
  ): Promise<void> {
    const response = await this.requestXrpl(account, "submit", {
      tx_blob: txBlob,
    }).catch((error: unknown) => {
      throw XrpSubmitFailedError.requestFailed(error);
    });
    assertSubmitAccepted(response);
  }

  private requestXrpl(
    account: ProviderAccount,
    method: string,
    params: Record<string, unknown>,
  ): Promise<BroadcastResponse> {
    return this.core.broadcastRPC(
      { method, params: [params] },
      {
        name: XRP_FAMILY,
        chainId: getNetworkIdFromCurrencyId(account.currencyId),
      },
    );
  }

  /**
   * Registers the pending transaction and sends the completion and invoicing
   * events. Never throws: the transaction is already submitted.
   */
  private trackSubmission(
    signed: SignedXrpTransaction,
    unsigned: XrpTransaction,
  ): void {
    try {
      const signedPayload = serializeForDevice(unsigned);
      this.core.trackBroadcastedTransaction(
        {
          signType: "transaction",
          status: "success",
          data: {
            hash: signed.hash,
            rawTransaction: signedPayload,
            signedRawTransaction: signed.tx_blob,
          },
        },
        { family: XRP_FAMILY, value: getXrpDropsAmount(unsigned) },
      );
      this.core.trackTransactionCompleted({
        family: XRP_FAMILY,
        transactionHash: signed.hash,
        unsignedTransaction: signedPayload,
        recipientAddress: getXrpDestination(unsigned),
      });
    } catch (error) {
      this.logger.warn("Could not track the XRP transaction submission", {
        error,
      });
    }
  }

  private async resolveAccount(): Promise<ProviderAccount> {
    if (this.account) {
      return this.account;
    }
    this.account = await this.core.requestAccount(XRP_FAMILY);
    return this.account;
  }

  private assertSenderIsSelectedAccount(
    tx: XrpTransaction,
    account: ProviderAccount,
  ): void {
    if (tx.Account !== undefined && tx.Account !== account.freshAddress) {
      throw new Error("Transaction Account is not the selected account");
    }
  }

  private selectedAccountInfo(): XrpAccountInfo | null {
    return this.account ? this.toAccountInfo(this.account) : null;
  }

  private toAccountInfo(account: ProviderAccount): XrpAccountInfo {
    return {
      address: account.freshAddress,
      network: getNetworkIdFromCurrencyId(account.currencyId),
    };
  }

  private async reportErrors<T>(run: () => Promise<T>): Promise<T> {
    try {
      return await run();
    } catch (error) {
      this.emit("error", error);
      throw error;
    }
  }

  private emit(event: XrpApiEvent, data: unknown): void {
    this.listeners.get(event)?.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        this.logger.error("XrpAPI listener threw", { event, error });
      }
    });
  }
}
