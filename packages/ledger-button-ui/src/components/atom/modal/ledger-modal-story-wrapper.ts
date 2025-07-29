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
        class="fixed inset-0 z-10 flex flex-col self-center justify-self-center overflow-y-auto rounded-xl bg-black"
        @click=${(e: Event) => e.stopPropagation()}
        style="width: min(calc(100% - 32px), 400px); max-height: 550px"
      >
        <slot name="toolbar">
          <ledger-toolbar
            title=${this.title}
            aria-label=${this.title}
          ></ledger-toolbar>
        </slot>
        <div class="text-base">
          <slot></slot>
        </div>
      </div>
    `;
  }
}
