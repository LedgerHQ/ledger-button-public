import { consume } from "@lit/context";
import { css, html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";

import {
  type CoreContext,
  coreContext,
} from "../../../context/core-context.js";
import {
  langContext,
  LanguageContext,
} from "../../../context/language-context.js";
import { Navigation } from "../../../shared/navigation.js";
import tailwindStyles from "../../../styles.css?inline";
import { FollowInstructionsController } from "./follow-instructions-controller.js";

@customElement("follow-instructions-screen")
export class FollowInstructionsScreen extends LitElement {
  @property({ type: Object })
  navigation!: Navigation;

  @consume({ context: coreContext })
  @property({ attribute: false })
  public coreContext!: CoreContext;

  @consume({ context: langContext })
  @property({ attribute: false })
  public languages!: LanguageContext;

  controller!: FollowInstructionsController;

  static override styles = [
    unsafeCSS(tailwindStyles),
    css`
      .container {
        display: flex;
        min-height: 200px;
        padding: 0px 0px;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        align-self: stretch;
        gap: var(--spacing-24);
      }

      .text-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-8);
        align-self: stretch;
      }

      .device-animation {
        width: 200px;
      }
    `,
  ];

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new FollowInstructionsController(
      this,
      this.coreContext,
      this.navigation,
    );
  }

  override render() {
    const { device } = this.controller;
    if (!device) {
      return;
    }

    const lang = this.languages.currentTranslation;

    return html`
      <div class="container gap-24">
        <div class="device-animation">
          <ledger-device-animation
            modelId=${device.modelId}
            animation="continueOnLedger"
          ></ledger-device-animation>
        </div>
        <div class="text-container">
          <p class="text-center body-1">
            ${lang.common.device.deviceActions.continueOnLedger.title}
            ${lang.common.device.model[device.modelId]}
          </p>
          <p class="text-center text-muted body-2">
            ${lang.common.device.deviceActions.continueOnLedger.description}
          </p>
        </div>
      </div>
    `;
  }
}
