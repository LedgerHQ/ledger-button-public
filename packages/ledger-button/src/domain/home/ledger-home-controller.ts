import type {
  DetailedAccount,
  PendingTransaction,
} from "@ledgerhq/ledger-wallet-provider-core";
import { ReactiveController, ReactiveControllerHost } from "lit";
import { Subscription } from "rxjs";

import type {
  TransactionKind,
  TransactionStatus,
  TransactionType,
} from "../../components/molecule/transaction-item/ledger-transaction-item.js";
import { CoreContext } from "../../context/core-context.js";
import { Navigation } from "../../shared/navigation.js";
import { Destinations } from "../../shared/routes.js";
import type { TransactionListItem } from "../transaction-list/transaction-list.js";

type MappableTransaction = {
  hash: string;
  type: TransactionType;
  status?: TransactionStatus;
  kind?: TransactionKind;
  timestamp: string;
  formattedValue: string;
  ticker: string;
  currencyName: string;
  fiatValue?: string;
  fiatCurrency?: string;
  explorerUrl?: string;
  formattedFee?: string;
  feeTicker?: string;
};

export class LedgerHomeController implements ReactiveController {
  selectedAccount: DetailedAccount | undefined = undefined;
  loading = false;
  private pendingTransactions: PendingTransaction[] = [];
  private contextSubscription: Subscription | undefined = undefined;
  private pendingTxSubscription: Subscription | undefined = undefined;
  private isConnected = false;
  private preferredFiatCurrency!: string;

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
    private readonly navigation: Navigation,
    private readonly destinations: Destinations,
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
    return this.selectedAccount.transactionHistory.map((tx) =>
      this.mapToTransactionListItem(tx),
    );
  }

  get pendingTransactionListItems(): TransactionListItem[] {
    return this.pendingTransactions.map((tx) =>
      this.mapToTransactionListItem(tx),
    );
  }

  async getSelectedAccount() {
    this.loading = true;
    this.host.requestUpdate();

    const result = await this.core.getDetailedSelectedAccount();

    if (!this.isConnected) return;

    result.caseOf({
      Left: () => {
        this.selectedAccount = undefined;
        this.navigation.navigateTo(this.destinations.onboardingFlow);
      },
      Right: (account) => {
        this.selectedAccount = account;
      },
    });

    this.loading = false;
    this.host.requestUpdate();
  }

  hostConnected() {
    this.isConnected = true;
    this.startListeningToContextChanges();
    this.startListeningToPendingTransactions();
  }

  hostDisconnected() {
    this.isConnected = false;
    this.contextSubscription?.unsubscribe();
    this.pendingTxSubscription?.unsubscribe();
  }

  private mapToTransactionListItem(
    tx: MappableTransaction,
  ): TransactionListItem {
    const date = new Date(tx.timestamp);
    return {
      hash: tx.hash,
      type: tx.type,
      status: tx.status ?? "pending",
      kind: tx.kind ?? "transfer",
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
      formattedFee: tx.formattedFee,
      feeTicker: tx.feeTicker,
    };
  }

  private startListeningToContextChanges() {
    if (!this.isConnected) return;

    if (this.contextSubscription) {
      this.contextSubscription.unsubscribe();
    }

    this.contextSubscription = this.core
      .observeContext()
      .subscribe((_context) => {
        const contextAccount = _context.selectedAccount;
        const currencyChanged =
          this.preferredFiatCurrency !== undefined &&
          this.preferredFiatCurrency !== _context.preferredFiatCurrency;
        this.preferredFiatCurrency = _context.preferredFiatCurrency;

        if (this.isAccountChanged(contextAccount) || currencyChanged) {
          this.getSelectedAccount();
        } else if (this.isDetailedAccount(contextAccount)) {
          this.selectedAccount = contextAccount;
          this.host.requestUpdate();
        }
      });
  }

  private isAccountChanged(contextAccount?: {
    freshAddress?: string;
    currencyId?: string;
  }): boolean {
    return (
      contextAccount?.freshAddress !== this.selectedAccount?.freshAddress ||
      contextAccount?.currencyId !== this.selectedAccount?.currencyId
    );
  }

  private isDetailedAccount(account: unknown): account is DetailedAccount {
    return (
      !!account &&
      typeof account === "object" &&
      "transactionHistory" in account
    );
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
