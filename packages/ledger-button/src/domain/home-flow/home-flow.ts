import "../../components/index.js";
import "../onboarding/consent-prompt/consent-analytics-screen.js";
import "../home/ledger-home.js";

import { consume } from "@lit/context";
import { LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { html as staticHtml, unsafeStatic } from "lit/static-html.js";

import { CoreContext, coreContext } from "../../context/core-context.js";
import {
  langContext,
  LanguageContext,
} from "../../context/language-context.js";
import { Navigation } from "../../shared/navigation.js";
import { Destinations } from "../../shared/routes.js";
import { HomeFlowController } from "./home-flow-controller.js";

@customElement("home-flow")
export class HomeFlow extends LitElement {
  @property({ type: Object })
  navigation!: Navigation;

  @property({ type: Object })
  destinations!: Destinations;

  @consume({ context: coreContext })
  @property({ attribute: false })
  public coreContext!: CoreContext;

  @consume({ context: langContext })
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
        ></${stateTag}>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "home-flow": HomeFlow;
  }
}
