import { type ContainerAnimation } from "./animation-types";
import { SlideUpAnimation } from "./slide-up-animation";

export class BottomAnimation implements ContainerAnimation {
  private readonly slideUp = new SlideUpAnimation();

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
