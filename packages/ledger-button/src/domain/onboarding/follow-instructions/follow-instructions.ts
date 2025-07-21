import { LedgerButtonCore } from "@ledgerhq/ledger-button-core";
import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { coreContext } from "../../../context/core-context.js";
import { Navigation } from "../../../shared/navigation.js";
import { FollowInstructionsController } from "./follow-instructions-controller.js";

@customElement("follow-instructions-screen")
export class FollowInstructionsScreen extends LitElement {
  @property({ type: Object })
  navigation!: Navigation;

  @consume({ context: coreContext })
  @property({ attribute: false })
  public coreContext!: LedgerButtonCore;

  controller!: FollowInstructionsController;

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

    console.log(device);

    return html`
      <ledger-device-animaton
        modelId=${device.modelId}
        animation="continueOnLedger"
      ></ledger-device-animaton>
    `;
  }
}
