import "../../../components/index.js";

import { consume } from "@lit/context";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { CoreContext, coreContext } from "../../../context/core-context.js";
import {
  langContext,
  LanguageContext,
} from "../../../context/language-context.js";
import { Navigation } from "../../../shared/navigation.js";
import { Destinations } from "../../../shared/routes.js";
import { tailwindElement } from "../../../tailwind-element.js";
import { RetrievingAccountsController } from "./retrieving-accounts-controller.js";

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
      rgba(0, 0, 0, 0) 29.8%,
      rgba(0, 0, 0, 0.35) 51.02%,
      var(--background-base) 93.25%
    );
  }
`;
@customElement("retrieving-accounts-screen")
@tailwindElement(styles)
export class RetrievingAccountsScreen extends LitElement {
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

  controller!: RetrievingAccountsController;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new RetrievingAccountsController(
      this,
      this.coreContext,
      this.navigation,
      this.destinations,
      this.languages,
    );
  }

  override render() {
    return html`
      <div class="min-h-full overflow-hidden">
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
}

declare global {
  interface HTMLElementTagNameMap {
    "retrieving-accounts-screen": RetrievingAccountsScreen;
  }
}
