import type {
  CoreFacade,
  ProviderAccount,
  ProviderLogger,
} from "@ledgerhq/ledger-wallet-provider-core";

import { XrpApiError } from "./model/XrpApiError";
import { isSignedXrpTransactionResult } from "./model/XrpSignedResult";
import type { SignXrpTransaction } from "./use-case/SignXrpTransaction";
import { runSignFlow } from "./utils/runSignFlow";
import { assertSubmitAccepted } from "./utils/xrpSubmitResult";
import {
  assembleSignedTransaction,
  getXrpDestination,
  getXrpDropsAmount,
  serializeForDevice,
  type SignedXrpTransaction,
  withSigningFields,
  type XrpTransaction,
} from "./utils/xrpTransaction";
import {
  XRP_BACKEND_CHAIN_ID,
  XRP_CURRENCY_ID,
  XRP_FAMILY,
  XRP_NETWORK_ID,
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
      account?.currencyId === XRP_CURRENCY_ID ? account : undefined;

    if (this.account?.freshAddress !== previousAddress) {
      this.emit("accountChanged", this.selectedAccountInfo());
    }
  }

  async connect(options?: XrpConnectOptions): Promise<XrpAccountInfo> {
    return this.reportErrors(async () => {
      if (options?.silent && !this.account) {
        throw new XrpApiError("NOT_CONNECTED", "No account selected");
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
      const { signed, unsigned } = await this.signWithDevice(
        structuredClone(tx),
      );
      await this.submit(signed.tx_blob);
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

  private async signWithDevice(
    tx: XrpTransaction,
  ): Promise<{ signed: SignedXrpTransaction; unsigned: XrpTransaction }> {
    const account = await this.resolveAccount();
    this.assertSenderIsSelectedAccount(tx, account);

    const { xrpSignature, signingPubKey } = await runSignFlow({
      core: this.core,
      logger: this.logger,
      runUseCase: () => this.signXrp.execute(tx, account),
      mapResult: (data) =>
        isSignedXrpTransactionResult(data) ? data : undefined,
    });

    const unsigned = withSigningFields(tx, account.freshAddress, signingPubKey);
    const signed = await assembleSignedTransaction(unsigned, xrpSignature);
    return { signed, unsigned };
  }

  /** Rejects unless the node accepted or queued the transaction. */
  private async submit(txBlob: string): Promise<void> {
    // XRPL JSON-RPC `submit` fits CoreFacade.broadcastRPC directly.
    const response = await this.core.broadcastRPC(
      {
        jsonrpc: "2.0",
        id: 1,
        method: "submit",
        params: [{ tx_blob: txBlob }],
      },
      { name: XRP_FAMILY, chainId: XRP_BACKEND_CHAIN_ID },
    );
    assertSubmitAccepted(response);
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
    return { address: account.freshAddress, network: XRP_NETWORK_ID };
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
