import {
  buildExplorerTransactionUrl,
  type DetailedAccount,
  formatBalance,
  type PendingTransaction,
  type TransactionHistoryItem,
} from "@ledgerhq/ledger-wallet-provider-core";
import { ReactiveController, ReactiveControllerHost } from "lit";
import { distinctUntilChanged, map, Subscription } from "rxjs";

import { CoreContext } from "../../context/core-context.js";
import { LanguageContext } from "../../context/language-context.js";
import { belongsToAccount } from "../../shared/pending-transaction-account-filter.js";
import type { TransactionListItem } from "../transaction-list/transaction-list.js";

export class LedgerHomeController implements ReactiveController {
  selectedAccount: DetailedAccount | undefined = undefined;
  loading = false;
  private preferredFiatCurrency!: string;
  private pendingTransactions: PendingTransaction[] = [];
  private accountSubscription: Subscription | undefined = undefined;
  private currencySubscription: Subscription | undefined = undefined;
  private pendingTxSubscription: Subscription | undefined = undefined;

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
    private readonly languages: LanguageContext,
  ) {
    this.host.addController(this);
  }

  get preferredCurrency(): string {
    return this.preferredFiatCurrency.toUpperCase();
  }

  get transactionListItems(): TransactionListItem[] {
    if (!this.selectedAccount?.transactionHistory) {
      return [];
    }
    const explorerUrlTemplate =
      this.selectedAccount.transactionExplorerUrlTemplate;
    return this.selectedAccount.transactionHistory.map((tx) =>
      this.mapHistoryItemToListItem(tx, explorerUrlTemplate),
    );
  }

  get pendingTransactionListItems(): TransactionListItem[] {
    if (!this.selectedAccount) {
      return [];
    }
    return this.pendingTransactions
      .filter((tx) => belongsToAccount(tx, this.selectedAccount))
      .map((tx) => this.mapPendingToListItem(tx));
  }

  hostConnected() {
    this.loading = true;
    this.startListeningToContextChanges();
    this.startListeningToPendingTransactions();
  }

  hostDisconnected() {
    this.accountSubscription?.unsubscribe();
    this.currencySubscription?.unsubscribe();
    this.pendingTxSubscription?.unsubscribe();
  }

  private mapHistoryItemToListItem(
    tx: TransactionHistoryItem,
    explorerUrlTemplate: string | undefined,
  ): TransactionListItem {
    const date = new Date(tx.timestamp);
    const formattedValue = formatBalance(
      tx.value,
      tx.asset.decimals,
      tx.asset.ticker,
      tx.asset.ledgerId,
    );
    const formattedFee = tx.fee
      ? formatBalance(
          tx.fee.amount,
          tx.fee.asset.decimals,
          tx.fee.asset.ticker,
          tx.fee.asset.ledgerId,
        )
      : undefined;
    const isFeesRow = tx.kind === "fees" && !!formattedFee;
    const fiatAmount = (isFeesRow ? tx.fee?.fiatAmount : tx.fiatValue) ?? "";
    const unknownToken =
      this.languages.currentTranslation.accountTokens?.unknownToken ??
      "Unknown Token";
    return {
      hash: tx.hash,
      type: tx.type,
      status: tx.status,
      kind: tx.kind,
      date: date.toISOString().split("T")[0],
      time: date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      amount: formattedValue,
      ticker: tx.asset.ticker,
      title: tx.asset.name ?? unknownToken,
      fiatAmount,
      fiatCurrency: tx.fiatCurrency ?? "",
      explorerUrl:
        buildExplorerTransactionUrl(explorerUrlTemplate, tx.hash) ?? undefined,
      formattedFee,
      feeTicker: tx.fee?.asset.ticker,
    };
  }

  private mapPendingToListItem(tx: PendingTransaction): TransactionListItem {
    const date = new Date(tx.timestamp);
    return {
      hash: tx.hash,
      type: tx.type,
      status: "pending",
      kind: "transfer",
      date: date.toISOString().split("T")[0],
      time: date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      amount: tx.formattedValue,
      ticker: tx.ticker,
      title: tx.currencyName,
      fiatAmount: tx.fiatValue ?? "",
      fiatCurrency: tx.fiatCurrency ?? "",
      explorerUrl: tx.explorerUrl,
      formattedFee: undefined,
      feeTicker: undefined,
    };
  }

  private startListeningToContextChanges() {
    this.accountSubscription?.unsubscribe();
    this.currencySubscription?.unsubscribe();

    this.accountSubscription = this.core
      .observeSelectedAccountChanges()
      .subscribe((account) => {
        this.selectedAccount = account;
        this.loading = false;
        this.host.requestUpdate();
      });

    this.currencySubscription = this.core
      .observeContext()
      .pipe(
        map((ctx) => ctx.preferredFiatCurrency),
        distinctUntilChanged(),
      )
      .subscribe((currency) => {
        this.preferredFiatCurrency = currency;
        this.host.requestUpdate();
      });
  }

  private startListeningToPendingTransactions() {
    if (this.pendingTxSubscription) {
      this.pendingTxSubscription.unsubscribe();
    }

    this.pendingTxSubscription = this.core
      .observePendingTransactions()
      .subscribe((txs) => {
        this.pendingTransactions = txs;
        this.host.requestUpdate();
      });
  }
}
