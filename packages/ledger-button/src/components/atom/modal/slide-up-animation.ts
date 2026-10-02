import { animate } from "motion";

import { ANIMATION_DELAY } from "../../../shared/navigation";
import {
  type AnimationInstance,
  BOTTOM_CLOSED_TRANSFORM,
  type ContainerAnimation,
  SPRING_CONFIG,
} from "./animation-types";

export class SlideUpAnimation implements ContainerAnimation {
  private animation: AnimationInstance | null = null;

  async open(container: HTMLElement): Promise<void> {
    this.cancel();

    await new Promise<void>((resolve) => {
      this.animation = animate(
        container,
        { transform: [BOTTOM_CLOSED_TRANSFORM, "translateY(0)"] },
        {
          ...SPRING_CONFIG,
          duration: ANIMATION_DELAY / 1000,
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
        { transform: ["translateY(0)", BOTTOM_CLOSED_TRANSFORM] },
        {
          ...SPRING_CONFIG,
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
