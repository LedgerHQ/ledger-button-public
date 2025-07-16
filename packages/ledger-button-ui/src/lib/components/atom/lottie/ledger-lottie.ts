import { cva } from "class-variance-authority";
import { html, LitElement, unsafeCSS } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import type { AnimationItem } from "lottie-web";
import lottie from "lottie-web";

import tailwindStyles from "../../../../styles.css?inline";

export type LottieSize = "small" | "medium" | "large";

export interface LedgerLottieAttributes {
  animationData: object;
  size?: LottieSize;
  autoplay?: boolean;
  loop?: boolean;
  speed?: number;
  paused?: boolean;
}

const lottieVariants = cva(["lottie-container"], {
  variants: {
    size: {
      small: ["w-8", "h-8"],
      medium: ["w-16", "h-16"],
      large: ["w-32", "h-32"],
    },
  },
  defaultVariants: {
    size: "medium",
  },
});

@customElement("ledger-lottie")
export class LedgerLottie extends LitElement {
  @property({ type: Object, attribute: "animation-data" })
  animationData!: object;

  @property({ type: String })
  size: LottieSize = "medium";

  @property({ type: Boolean })
  autoplay = true;

  @property({ type: Boolean })
  loop = false;

  @property({ type: Number })
  speed = 1;

  @property({ type: Boolean })
  paused = false;

  @query(".lottie-container")
  private container!: HTMLElement;

  private animation?: AnimationItem;

  static override styles = [unsafeCSS(tailwindStyles)];

  private get containerClasses() {
    return {
      [lottieVariants({ size: this.size })]: true,
    };
  }

  override firstUpdated() {
    if (!this.animationData) {
      throw new Error("animationData is required for ledger-lottie");
    }

    this.initializeAnimation();
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has("animationData")) {
      this.initializeAnimation();
    }

    if (changedProperties.has("paused")) {
      this.togglePlayPause();
    }

    if (changedProperties.has("speed") && this.animation) {
      this.animation.setSpeed(this.speed);
    }

    if (changedProperties.has("loop") && this.animation) {
      this.animation.loop = this.loop;
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.destroyAnimation();
  }

  private initializeAnimation() {
    if (!this.container || !this.animationData) {
      return;
    }

    this.destroyAnimation();

    this.animation = lottie.loadAnimation({
      container: this.container,
      renderer: "svg",
      loop: this.loop,
      autoplay: this.autoplay && !this.paused,
      animationData: this.animationData,
    });

    this.animation.setSpeed(this.speed);
  }

  private destroyAnimation() {
    if (!this.animation) {
      return;
    }

    this.animation.destroy();
    this.animation = undefined;
  }

  private togglePlayPause() {
    if (!this.animation) {
      return;
    }

    if (this.paused) {
      this.animation.pause();

      return;
    }

    this.animation.play();
  }

  public play() {
    this.paused = false;

    if (!this.animation) {
      return;
    }

    this.animation.play();
  }

  public pause() {
    this.paused = true;

    if (!this.animation) {
      return;
    }

    this.animation.pause();
  }

  public stop() {
    this.paused = true;

    if (this.animation) {
      this.animation.stop();
    }
  }

  public goToAndPlay(value: number, isFrame?: boolean) {
    if (!this.animation) {
      return;
    }

    this.animation.goToAndPlay(value, isFrame);
    this.paused = false;
  }

  public goToAndStop(value: number, isFrame?: boolean) {
    if (!this.animation) {
      return;
    }

    this.animation.goToAndStop(value, isFrame);
    this.paused = true;
  }

  public setSpeed(speed: number) {
    this.speed = speed;

    if (!this.animation) {
      return;
    }

    this.animation.setSpeed(speed);
  }

  public setDirection(direction: 1 | -1) {
    if (!this.animation) {
      return;
    }

    this.animation.setDirection(direction);
  }

  override render() {
    return html`
      <div
        class=${classMap(this.containerClasses)}
        role="img"
        aria-label="Lottie animation"
      ></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-lottie": LedgerLottie;
  }
}

export default LedgerLottie;
