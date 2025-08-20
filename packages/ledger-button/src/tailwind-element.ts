import { CSSResult, LitElement, unsafeCSS } from "lit";

import tailwindStyles from "./styles.css?inline";

type Constructor = new (...args: any[]) => LitElement;

export function tailwindElement(styles?: CSSResult) {
  return function <T extends Constructor>(constructor: T): T {
    return class extends constructor {
      static styles = [unsafeCSS(tailwindStyles), unsafeCSS(styles)];
    };
  };
}
