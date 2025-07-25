import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { tailwindElement } from "../../../tailwind-element";

@customElement("ledger-modal-story-wrapper")
@tailwindElement()
export class LedgerModalStoryWrapper extends LitElement {
  @property({ type: String })
  override title = "";

  @property({ type: Boolean })
  showClose = true;

  @property({ type: Boolean })
  showLogo = true;

  override render() {
    return html`
      <div
        class="fixed inset-0 z-10 flex flex-col self-center justify-self-center overflow-hidden rounded-xl bg-black"
        @click=${(e: Event) => e.stopPropagation()}
        style="width: min(calc(100% - 32px), 400px); max-height: calc(100vh - 64px); min-height: 400px;"
      >
        <slot name="toolbar">
          <ledger-toolbar
            title=${this.title}
            .showLogo=${this.showLogo}
            .showClose=${this.showClose}
            aria-label=${this.title}
          ></ledger-toolbar>
        </slot>
        <div class="flex-1 overflow-y-auto text-base">
          <slot></slot>
        </div>
      </div>
    `;
  }
}
