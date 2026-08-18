import "../../components/index";
import "../onboarding/consent-prompt/consent-analytics-screen";
import "../home/ledger-home";

import { consume } from "@lit/context";
import { css, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { html as staticHtml, unsafeStatic } from "lit/static-html.js";

import type { WalletTransactionFeature } from "../../components/molecule/wallet-actions/ledger-wallet-actions";
import { CoreContext, coreContext } from "../../context/core-context";
import {
  langContext,
  LanguageContext,
} from "../../context/language-context";
import { Navigation } from "../../shared/navigation";
import { Destinations } from "../../shared/routes";
import { HomeFlowController } from "./home-flow-controller";

@customElement("home-flow")
export class HomeFlow extends LitElement {
  static override styles = css`
    :host {
      display: block;
      height: 100%;
    }
  `;
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

  controller!: HomeFlowController;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new HomeFlowController(
      this,
      this.coreContext,
      this.navigation,
      this.destinations,
    );
  }

  override render() {
    const stateTag = unsafeStatic(this.controller.state + "-screen");
    return staticHtml`
        <${stateTag}
        .destinations=${this.destinations}
        .navigation=${this.navigation}
        .walletTransactionFeatures=${this.walletTransactionFeatures}
        ></${stateTag}>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "home-flow": HomeFlow;
  }
}
