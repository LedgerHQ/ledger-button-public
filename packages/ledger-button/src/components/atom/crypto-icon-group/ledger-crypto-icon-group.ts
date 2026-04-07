import "../crypto-icon/ledger-crypto-icon.js";

import { cva } from "class-variance-authority";
import { html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

import { tailwindElement } from "../../../tailwind-element.js";

export type CryptoIconGroupItem = {
  id: string;
  ticker?: string;
};

const ICON_PX = 20;
const ICON_RX = 4;
const OVERLAP = 1.5;
const GAP = 2;

function roundedRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): string {
  return `M${x + r},${y}H${x + w - r}A${r},${r},0,0,1,${x + w},${y + r}V${y + h - r}A${r},${r},0,0,1,${x + w - r},${y + h}H${x + r}A${r},${r},0,0,1,${x},${y + h - r}V${y + r}A${r},${r},0,0,1,${x + r},${y}Z`;
}

const cutoutDim = ICON_PX + GAP * 2;
const cutoutX = ICON_PX - OVERLAP - GAP;
const cutoutY = -GAP;
const cutoutRx = ICON_RX + GAP;

const outerPath = roundedRectPath(0, 0, ICON_PX, ICON_PX, ICON_RX);
const holePath = roundedRectPath(
  cutoutX,
  cutoutY,
  cutoutDim,
  cutoutDim,
  cutoutRx,
);
const maskSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='${ICON_PX}' height='${ICON_PX}'><path fill-rule='evenodd' d='${outerPath} ${holePath}' fill='white'/></svg>`;
const MASK_STYLE = `-webkit-mask-image: url("data:image/svg+xml,${maskSvg}"); -webkit-mask-repeat: no-repeat; mask-image: url("data:image/svg+xml,${maskSvg}"); mask-repeat: no-repeat`;

const groupVariants = cva(["group flex items-center"]);

const overflowVariants = cva(["body-3 text-muted ml-4"]);

const iconWrapperVariants = cva(["relative shrink-0"]);

@customElement("ledger-crypto-icon-group")
@tailwindElement()
export class LedgerCryptoIconGroup extends LitElement {
  @property({ type: Array })
  items: CryptoIconGroupItem[] = [];

  @property({ type: Number, attribute: "max-visible" })
  maxVisible = 3;

  override render() {
    if (this.items.length === 0) {
      return nothing;
    }

    const visible = this.items.slice(0, this.maxVisible);
    const overflowCount = this.items.length - this.maxVisible;

    return html`
      <style>
        ledger-crypto-icon {
          display: block;
        }
      </style>
      <div class="${groupVariants()}">
        ${visible.map((item, index) => {
          const isLast = index === visible.length - 1;
          return html`
            <div
              class="${iconWrapperVariants()}"
              style="z-index: ${index};${index > 0
                ? ` margin-left: -${OVERLAP}px;`
                : ""} ${isLast ? "" : MASK_STYLE}"
            >
              <ledger-crypto-icon
                .ledgerId=${item.id}
                .ticker=${item.ticker ?? ""}
                size="small"
                variant="square"
              ></ledger-crypto-icon>
            </div>
          `;
        })}
        ${overflowCount > 0
          ? html`<span class="${overflowVariants()}">+${overflowCount}</span>`
          : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-crypto-icon-group": LedgerCryptoIconGroup;
  }
}

export default LedgerCryptoIconGroup;
