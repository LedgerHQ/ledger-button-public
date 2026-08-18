import "../onboarding/select-device/select-device";
import "../sign-transaction/sign-transaction";

import { consume } from "@lit/context";
import { LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { html as staticHtml, unsafeStatic } from "lit/static-html.js";

import { CoreContext, coreContext } from "../../context/core-context";
import {
  langContext,
  LanguageContext,
} from "../../context/language-context";
import { Navigation } from "../../shared/navigation";
import { Destinations } from "../../shared/routes";
import { SigningFlowController } from "./signing-flow-controller";

@customElement("signing-flow")
export class SigningFlow extends LitElement {
  @property({ type: Object })
  navigation!: Navigation;

  @property({ type: Object })
  destinations!: Destinations;

  @property({ type: Object })
  params?: unknown;

  @consume({ context: coreContext })
  @property({ attribute: false })
  public coreContext!: CoreContext;

  @consume({ context: langContext, subscribe: true })
  @property({ attribute: false })
  public languages!: LanguageContext;

  controller!: SigningFlowController;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new SigningFlowController(this, this.coreContext);
  }

  override render() {
    const stateTag = unsafeStatic(this.controller.state + "-screen");
    return staticHtml`
        <${stateTag}
        .destinations=${this.destinations}
        .navigation=${this.navigation}
        .params=${this.params}
        ></${stateTag}>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "signing-flow": SigningFlow;
  }
}
