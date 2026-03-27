import { ReactiveController, ReactiveControllerHost } from "lit";

export class MobileOnboardingController implements ReactiveController {
  constructor(private readonly host: ReactiveControllerHost) {
    this.host.addController(this);
  }

  // TODO: wire up mobile onboarding logic
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  hostConnected() {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  hostDisconnected() {}

  handleAllow() {
    console.log("Mobile onboarding approved");
  }

  handleReject() {
    console.log("Mobile onboarding rejected");
  }
}
