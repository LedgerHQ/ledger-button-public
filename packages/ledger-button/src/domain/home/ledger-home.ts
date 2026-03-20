import "../../components/index.js";
import "../token-list/token-list.js";
import "../transaction-list/transaction-list.js";

import type {
  PendingTransaction,
  TransactionHistoryItem,
} from "@ledgerhq/ledger-wallet-provider-core";
import { consume } from "@lit/context";
import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { Subscription } from "rxjs";

import type { TabChangeEventDetail } from "../../components/atom/tabs/ledger-tabs.js";
import type { AccountItemClickEventDetail } from "../../components/molecule/account-item/ledger-account-item.js";
import type {
  WalletActionClickEventDetail,
  WalletTransactionFeature,
} from "../../components/molecule/wallet-actions/ledger-wallet-actions.js";
import type {
  WalletRedirectCancelEventDetail,
  WalletRedirectConfirmEventDetail,
} from "../../components/molecule/wallet-redirect-drawer/ledger-wallet-redirect-drawer.js";
import { CoreContext, coreContext } from "../../context/core-context.js";
import {
  langContext,
  LanguageContext,
} from "../../context/language-context.js";
import { buildWalletActionDeepLink } from "../../shared/constants/deeplinks.js";
import { Navigation } from "../../shared/navigation.js";
import { Destinations } from "../../shared/routes.js";
import { tailwindElement } from "../../tailwind-element.js";
import type { TransactionListItem } from "../transaction-list/transaction-list.js";
import { LedgerHomeController } from "./ledger-home-controller.js";

const styles = css`
  :host {
    display: block;
    height: 100%;
  }

  .animation {
    position: relative;
  }

  .animation::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      0deg,
      rgba(21, 21, 21, 0) 0%,
      var(--background-canvas-sheet) 100%
    );
  }
`;

function mapTransactionHistoryToListItem(
  transaction: TransactionHistoryItem,
): TransactionListItem {
  const date = new Date(transaction.timestamp);
  const dateString = date.toISOString().split("T")[0];
  const timeString = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    hash: transaction.hash,
    type: transaction.type,
    date: dateString,
    time: timeString,
    amount: transaction.formattedValue,
    ticker: transaction.ticker,
    title: transaction.currencyName,
    fiatAmount: transaction.fiatValue ?? "",
    fiatCurrency: transaction.fiatCurrency ?? "",
  };
}

function mapPendingTransactionToListItem(
  tx: PendingTransaction,
): TransactionListItem {
  const date = new Date(tx.timestamp);
  const timeString = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    hash: tx.hash,
    type: tx.type,
    date: date.toISOString().split("T")[0],
    time: timeString,
    amount: tx.formattedValue,
    ticker: tx.ticker,
    title: tx.currencyName,
    fiatAmount: "",
    fiatCurrency: "",
  };
}

@customElement("ledger-home-screen")
@tailwindElement(styles)
export class LedgerHomeScreen extends LitElement {
  @property({ type: Object })
  navigation!: Navigation;

  @property({ type: Object })
  destinations!: Destinations;

  @property({ type: Array })
  walletTransactionFeatures?: WalletTransactionFeature[];

  @consume({ context: coreContext })
  @property({ attribute: false })
  public coreContext!: CoreContext;

  @consume({ context: langContext })
  @property({ attribute: false })
  public languages!: LanguageContext;

  @state()
  private activeTab = "tokens";

  @state()
  private showRedirectDrawer = false;

  @state()
  private currentAction: WalletTransactionFeature | null = null;

  @state()
  private pendingTransactions: PendingTransaction[] = [];

  controller!: LedgerHomeController;
  private pendingTxSubscription?: Subscription;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new LedgerHomeController(
      this,
      this.coreContext,
      this.navigation,
      this.destinations,
    );
    this.pendingTxSubscription = this.coreContext
      .observePendingTransactions()
      .subscribe((txs) => {
        this.pendingTransactions = txs;
      });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.pendingTxSubscription?.unsubscribe();
  }

  private handleAccountItemClick = (
    event: CustomEvent<AccountItemClickEventDetail>,
  ) => {
    this.dispatchEvent(
      new CustomEvent("ledger-internal-account-switch", {
        bubbles: true,
        composed: true,
        detail: event.detail,
      }),
    );
  };

  private handleNetworksClick = () => {
    this.navigation.navigateTo(this.destinations.availableNetworks);
  };

  private handleDisconnectClick = async () => {
    this.dispatchEvent(
      new CustomEvent("ledger-internal-button-disconnect", {
        bubbles: true,
        composed: true,
      }),
    );
  };

  private handleTabChange = (event: CustomEvent<TabChangeEventDetail>) => {
    this.activeTab = event.detail.selectedId;
  };

  private handleWalletActionClick = (
    event: CustomEvent<WalletActionClickEventDetail>,
  ) => {
    const action = event.detail.action;
    this.currentAction = action;
    this.showRedirectDrawer = true;

    void this.coreContext.trackWalletActionClicked(action);
  };

  private handleRedirectConfirm = (
    event: CustomEvent<WalletRedirectConfirmEventDetail>,
  ) => {
    const action = event.detail.action;

    void this.coreContext.trackWalletRedirectConfirmed(action);

    const deeplink = buildWalletActionDeepLink(
      action,
      {
        currency: this.controller.selectedAccount?.currencyId,
      },
      this.coreContext.getConfig().dAppIdentifier,
    );
    window.open(deeplink, "_blank", "noopener,noreferrer");

    this.showRedirectDrawer = false;
    this.currentAction = null;
  };

  private handleRedirectCancel = (
    event: CustomEvent<WalletRedirectCancelEventDetail>,
  ) => {
    const action = event.detail.action;

    void this.coreContext.trackWalletRedirectCancelled(action);

    this.showRedirectDrawer = false;
    this.currentAction = null;
  };

  private getTransactionListItems(): TransactionListItem[] {
    const account = this.controller.selectedAccount;
    if (!account?.transactionHistory) {
      return [];
    }

    return account.transactionHistory.map((tx) =>
      mapTransactionHistoryToListItem(tx),
    );
  }

  private getPendingTransactionListItems(): TransactionListItem[] {
    return this.pendingTransactions.map(mapPendingTransactionToListItem);
  }

  override render() {
    if (this.controller.loading) {
      return html`
        <div class="h-full min-h-full overflow-hidden">
          <ledger-lottie
            class="animation overflow-hidden"
            animationName="backgroundFlare"
            .autoplay=${true}
            .loop=${true}
            size="full"
          ></ledger-lottie>
        </div>
      `;
    }
    const account = this.controller.selectedAccount;

    if (!account) {
      this.navigation.navigateTo(this.destinations.onboardingFlow);
      return;
    }

    const lang = this.languages.currentTranslation;

    return html`
      <div class="relative h-full">
        <div
          class="flex flex-col items-stretch gap-12 p-24 pt-0"
        >
          <div
            class="flex flex-col gap-24 rounded-md bg-muted p-16"
          >
            <div class="flex flex-row items-center justify-between">
              <ledger-account-switch
                .account=${account}
                @account-switch=${this.handleAccountItemClick}
              ></ledger-account-switch>

              <ledger-networks
                .networks=${account.networks}
                @networks-click=${this.handleNetworksClick}
              ></ledger-networks>
            </div>

            <ledger-fiat-total
              .value=${account.totalFiatValue?.value ?? "0"}
            ></ledger-fiat-total>
          </div>

          <ledger-wallet-actions
            .features=${this.walletTransactionFeatures}
            @wallet-action-click=${this.handleWalletActionClick}
          ></ledger-wallet-actions>

          <div class="mt-12">
            <ledger-tabs
              .tabs=${[
                { id: "tokens", label: "Tokens" },
                {
                  id: "transactions",
                  label: "Transactions",
                  badge: this.pendingTransactions.length || undefined,
                },
              ]}
              .selectedId=${this.activeTab}
              @tab-change=${this.handleTabChange}
            ></ledger-tabs>
          </div>

          ${this.activeTab === "tokens"
            ? html`<token-list-screen
                .account=${account}
              ></token-list-screen>`
            : html`<transaction-list-screen
                .transactions=${this.getTransactionListItems()}
                .pendingTransactions=${this.getPendingTransactionListItems()}
              ></transaction-list-screen>`}

          <ledger-button
            variant="secondary"
            size="full"
            label=${lang.common.button.disconnect}
            @click=${this.handleDisconnectClick}
          ></ledger-button>
        </div>

        ${this.showRedirectDrawer && this.currentAction
          ? html`
              <ledger-wallet-redirect-drawer
                .action=${this.currentAction}
                @wallet-redirect-confirm=${this.handleRedirectConfirm}
                @wallet-redirect-cancel=${this.handleRedirectCancel}
              ></ledger-wallet-redirect-drawer>
            `
          : ""}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-home-screen": LedgerHomeScreen;
  }

  interface WindowEventMap {
    "ledger-internal-button-disconnect": CustomEvent<void>;
    "ledger-internal-account-switch": CustomEvent<AccountItemClickEventDetail>;
  }
}
