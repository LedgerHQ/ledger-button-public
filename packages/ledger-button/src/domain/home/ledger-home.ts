import "../../components/index.js";
import "../token-list/token-list.js";
import "../transaction-list/transaction-list.js";

import { consume } from "@lit/context";
import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import type { TabChangeEventDetail } from "../../components/atom/tabs/ledger-tabs.js";
import type {
  WalletActionClickEventDetail,
  WalletTransactionFeature,
} from "../../components/molecule/wallet-actions/ledger-wallet-actions.js";
import { CoreContext, coreContext } from "../../context/core-context.js";
import {
  langContext,
  LanguageContext,
} from "../../context/language-context.js";
import {
  buildAccountDeepLink,
  buildWalletActionDeepLink,
} from "../../shared/constants/deeplinks.js";
import { Navigation } from "../../shared/navigation.js";
import { Destinations } from "../../shared/routes.js";
import { tailwindElement } from "../../tailwind-element.js";
import { LedgerHomeController } from "./ledger-home-controller.js";

type RedirectIntent =
  | { type: "action"; action: WalletTransactionFeature }
  | { type: "account"; currency: string; address: string };

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

  @consume({ context: langContext, subscribe: true })
  @property({ attribute: false })
  public languages!: LanguageContext;

  @state()
  private activeTab = "tokens";

  @state()
  private showRedirectDrawer = false;

  @state()
  private redirectIntent: RedirectIntent | null = null;

  controller!: LedgerHomeController;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new LedgerHomeController(
      this,
      this.coreContext,
      this.languages,
    );
  }

  private handleAccountItemClick = () => {
    this.dispatchEvent(
      new CustomEvent("ledger-internal-account-switch", {
        bubbles: true,
        composed: true,
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
    this.redirectIntent = { type: "action", action };
    this.showRedirectDrawer = true;

    void this.coreContext.trackWalletActionClicked(action);
  };

  private handleRedirectConfirm = () => {
    const intent = this.redirectIntent;
    if (!intent) return;

    const partner = this.coreContext.getConfig().dAppIdentifier;

    let deeplink: string;
    if (intent.type === "action") {
      void this.coreContext.trackWalletRedirectConfirmed(intent.action);
      deeplink = buildWalletActionDeepLink(
        intent.action,
        {
          currency: this.controller.selectedAccount?.currencyId,
        },
        partner,
      );
    } else {
      void this.coreContext.trackViewAllTransactionsRedirectConfirmed({
        currencyId: intent.currency,
        accountAddress: intent.address,
      });
      deeplink = buildAccountDeepLink(
        {
          currency: intent.currency,
          address: intent.address,
        },
        partner,
      );
    }

    window.open(deeplink, "_blank", "noopener,noreferrer");

    this.showRedirectDrawer = false;
    this.redirectIntent = null;
  };

  private handleRedirectCancel = () => {
    const intent = this.redirectIntent;

    if (intent?.type === "action") {
      void this.coreContext.trackWalletRedirectCancelled(intent.action);
    } else if (intent?.type === "account") {
      void this.coreContext.trackViewAllTransactionsRedirectCancelled({
        currencyId: intent.currency,
        accountAddress: intent.address,
      });
    }

    this.showRedirectDrawer = false;
    this.redirectIntent = null;
  };

  private handleViewAllTransactionsClick = () => {
    const account = this.controller.selectedAccount;
    if (!account) return;

    void this.coreContext.trackViewAllTransactionsClicked({
      currencyId: account.currencyId,
      accountAddress: account.freshAddress,
    });

    this.redirectIntent = {
      type: "account",
      currency: account.currencyId,
      address: account.freshAddress,
    };
    this.showRedirectDrawer = true;
  };

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
      <div class="relative flex h-full flex-col">
        <div class="scrollbar-custom min-h-0 flex-1 overflow-y-auto">
          <div class="flex flex-col items-stretch gap-12 p-24 pt-0">
            <div class="bg-muted flex flex-col gap-24 rounded-md p-16">
              <div class="flex flex-row items-center justify-between">
                <ledger-account-switch
                  class="max-w-256"
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
                .currency=${this.controller.preferredCurrency}
                .locale=${this.languages.locale}
              ></ledger-fiat-total>
            </div>

            <ledger-wallet-actions
              .features=${this.walletTransactionFeatures}
              @wallet-action-click=${this.handleWalletActionClick}
            ></ledger-wallet-actions>

            <div class="mt-12">
              <ledger-tabs
                .tabs=${[
                  { id: "tokens", label: lang.home.tabs.tokens },
                  {
                    id: "transactions",
                    label: lang.home.tabs.transactions,
                    badge:
                      this.controller.pendingTransactionListItems.length ||
                      undefined,
                  },
                ]}
                .selectedId=${this.activeTab}
                @tab-change=${this.handleTabChange}
              ></ledger-tabs>
            </div>

            ${this.activeTab === "tokens"
              ? html`<token-list-screen
                  .account=${account}
                  .locale=${this.languages.locale}
                ></token-list-screen>`
              : html`<transaction-list-screen
                  .transactions=${this.controller.transactionListItems}
                  .pendingTransactions=${this.controller
                    .pendingTransactionListItems}
                  @view-all-transactions-click=${this
                    .handleViewAllTransactionsClick}
                ></transaction-list-screen>`}
          </div>
        </div>

        <div class="shrink-0 p-24 pt-12">
          <ledger-button
            variant="secondary"
            size="full"
            label=${lang.common.button.disconnect}
            @click=${this.handleDisconnectClick}
          ></ledger-button>
        </div>

        ${this.showRedirectDrawer && this.redirectIntent
          ? html`
              <ledger-wallet-redirect-drawer
                .action=${this.redirectIntent.type === "action"
                  ? this.redirectIntent.action
                  : "send"}
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
    "ledger-internal-account-switch": CustomEvent<void>;
  }
}
