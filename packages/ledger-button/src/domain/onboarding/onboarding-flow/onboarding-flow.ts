import "../welcome/welcome-screen";
import "../consent-prompt/consent-analytics-screen";
import "../select-device/select-device";
import "../ledger-sync/ledger-sync";
import "../retrieving-accounts/retrieving-accounts";
import "../select-account/select-account";
import "../mobile-onboarding/mobile-onboarding-screen";

import { consume } from "@lit/context";
import { LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { html as staticHtml, unsafeStatic } from "lit/static-html.js";

import { CoreContext, coreContext } from "../../../context/core-context";
import {
  langContext,
  LanguageContext,
} from "../../../context/language-context";
import { Navigation } from "../../../shared/navigation";
import { Destinations } from "../../../shared/routes";
import { OnboardingFlowController } from "./onboarding-flow-controller";

@customElement("onboarding-flow")
export class OnboardingFlow extends LitElement {
  @property({ type: Object })
  navigation!: Navigation;

  @property({ type: Object })
  destinations!: Destinations;

  @consume({ context: coreContext })
  @property({ attribute: false })
  public coreContext!: CoreContext;

  @consume({ context: langContext, subscribe: true })
  @property({ attribute: false })
  public languages!: LanguageContext;

  controller!: OnboardingFlowController;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new OnboardingFlowController(this, this.coreContext);
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
    "onboarding-flow": OnboardingFlow;
  }
}
