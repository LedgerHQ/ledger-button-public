import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

import { tailwindElement } from "../../../tailwind-element.js";

const styles = css`
  :host {
    display: block;
  }
`;

@customElement("ledger-skeleton")
@tailwindElement(styles)
export class LedgerSkeleton extends LitElement {
  override render() {
    return html`
      <div
        data-slot="skeleton"
        class="lb-h-full lb-w-full lb-animate-pulse lb-rounded-[inherit] lb-bg-muted-transparent"
        role="presentation"
        aria-hidden="true"
      ></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-skeleton": LedgerSkeleton;
  }
}
