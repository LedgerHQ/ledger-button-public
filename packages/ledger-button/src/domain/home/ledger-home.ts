import "../../components/index.js";

import { consume } from "@lit/context";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import type { AccountItemClickEventDetail } from "../../components/molecule/account-item/ledger-account-item.js";
import type { WalletTransactionFeature } from "../../components/molecule/wallet-actions/ledger-wallet-actions.js";
import { CoreContext, coreContext } from "../../context/core-context.js";
import {
  langContext,
  LanguageContext,
} from "../../context/language-context.js";
import { Navigation } from "../../shared/navigation.js";
import { Destinations } from "../../shared/routes.js";
import { tailwindElement } from "../../tailwind-element.js";
import { LedgerHomeController } from "./ledger-home-controller.js";

const styles = css`
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

  @consume({ context: langContext })
  @property({ attribute: false })
  public languages!: LanguageContext;

  controller!: LedgerHomeController;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new LedgerHomeController(
      this,
      this.coreContext,
      this.navigation,
      this.destinations,
    );
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

  private handleDisconnectClick = async () => {
    this.dispatchEvent(
      new CustomEvent("ledger-internal-button-disconnect", {
        bubbles: true,
        composed: true,
      }),
    );
  };

  override render() {
    if (this.controller.loading) {
      return html`
        <div class="lb-min-h-full lb-overflow-hidden">
          <ledger-lottie
            class="animation lb-overflow-hidden"
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
      <div
        class="lb-flex lb-flex-col lb-items-stretch lb-gap-24 lb-p-24 lb-pt-0"
      >
        <div
          class="lb-flex lb-flex-col lb-gap-32 lb-rounded-md lb-bg-muted lb-p-16"
        >
          <div class="lb-flex lb-flex-row lb-items-center lb-justify-between">
            <ledger-account-switch
              .account=${account}
              @account-switch=${this.handleAccountItemClick}
            ></ledger-account-switch>
            <ledger-crypto-icon
              .ledgerId=${account.currencyId}
              size="small"
              variant="square"
            ></ledger-crypto-icon>
          </div>
          <div class="lb-flex lb-flex-row lb-items-center lb-justify-between">
            <ledger-balance
              label=${lang.home.balance}
              .balance=${account.balance}
              .ticker=${account.ticker}
            ></ledger-balance>
          </div>
        </div>
        <ledger-wallet-actions
          .features=${this.walletTransactionFeatures}
        ></ledger-wallet-actions>
        <ledger-button
          variant="secondary"
          size="full"
          label=${lang.common.button.disconnect}
          @click=${this.handleDisconnectClick}
        ></ledger-button>
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
