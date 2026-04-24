import { type ContainerAnimation } from "./animation-types.js";
import { SlideUpAnimation } from "./slide-up-animation.js";

export class BottomAnimation implements ContainerAnimation {
  private slideUp = new SlideUpAnimation();

  open(container: HTMLElement): void {
    this.slideUp.open(container);
  }

  close(container: HTMLElement): Promise<void> {
    return this.slideUp.close(container);
  }

  cancel(): void {
    this.slideUp.cancel();
  }
}
