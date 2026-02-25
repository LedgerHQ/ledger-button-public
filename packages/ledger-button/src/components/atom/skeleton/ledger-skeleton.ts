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
        class="h-full w-full animate-pulse rounded-[inherit] bg-muted-transparent"
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
