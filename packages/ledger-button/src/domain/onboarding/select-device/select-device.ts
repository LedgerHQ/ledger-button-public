import "@ledgerhq/ledger-button-ui";

import { LedgerButtonCore } from "@ledgerhq/ledger-button-core";
import {
  ConnectionItemClickEventDetail,
  tailwindElement,
} from "@ledgerhq/ledger-button-ui";
import { consume } from "@lit/context";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";

import { coreContext } from "../../../context/core-context.js";
import {
  langContext,
  LanguageContext,
} from "../../../context/language-context.js";
import { Navigation } from "../../../shared/navigation.js";
import { Destinations } from "../../../shared/routes.js";
import { SelectDeviceController } from "./select-device-controller.js";

const styles = css`
  :host {
    animation: intro 250ms ease-in-out;
    transform-origin: left bottom;
  }

  :host(.remove) {
    animation: intro 250ms ease-in-out reverse;
  }

  @keyframes intro {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(32px);
    }

    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
`;
@customElement("select-device-screen")
@tailwindElement(styles)
export class SelectDeviceScreen extends LitElement {
  @property({ type: Object })
  navigation!: Navigation;

  @property({ type: Object })
  destinations!: Destinations;

  @consume({ context: coreContext })
  @property({ attribute: false })
  public coreContext!: LedgerButtonCore;

  @consume({ context: langContext })
  @property({ attribute: false })
  public languageContext!: LanguageContext;

  controller!: SelectDeviceController;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new SelectDeviceController(
      this,
      this.coreContext,
      this.navigation,
      this.destinations,
    );
  }

  override render() {
    const lang = this.languageContext.currentTranslation;

    return html`
      <div class="flex flex-col">
        <div class="flex flex-col gap-12 p-24 pt-0">
          ${repeat(["bluetooth", "usb"] as const, (el) => {
            return html`
              <ledger-connection-item
                title=${lang.common.button[el]}
                connection-type=${el}
                @connection-item-click=${(
                  e: CustomEvent<ConnectionItemClickEventDetail>,
                ) => {
                  this.controller.connectToDevice(e.detail);
                }}
              ></ledger-connection-item>
            `;
          })}
        </div>
        <div class="flex flex-col gap-12 border-t-1 border-muted-subtle p-24">
          <ledger-ad-item
            title=${lang.common.ad.buyALedger}
            @ad-item-click=${this.controller.clickAdItem}
          ></ledger-ad-item>
        </div>
      </div>
    `;
  }
}
