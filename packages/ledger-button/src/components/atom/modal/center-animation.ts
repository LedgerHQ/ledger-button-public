import { animate } from "motion";

import { ANIMATION_DELAY } from "../../../shared/navigation";
import {
  type AnimationInstance,
  type ContainerAnimation,
} from "./animation-types";

export class CenterAnimation implements ContainerAnimation {
  private animation: AnimationInstance | null = null;

  async open(container: HTMLElement): Promise<void> {
    this.cancel();

    await new Promise<void>((resolve) => {
      this.animation = animate(
        container,
        { opacity: [0, 1] },
        {
          duration: ANIMATION_DELAY / 1000,
          ease: "easeOut",
          onComplete: () => resolve(),
        },
      );
    });
  }

  async close(container: HTMLElement): Promise<void> {
    this.cancel();

    await new Promise<void>((resolve) => {
      this.animation = animate(
        container,
        { opacity: 0 },
        {
          duration: ANIMATION_DELAY / 1000,
          onComplete: () => resolve(),
        },
      );
    });

    this.animation = null;
  }

  cancel(): void {
    if (this.animation) {
      this.animation.cancel();
      this.animation = null;
    }
  }
}
