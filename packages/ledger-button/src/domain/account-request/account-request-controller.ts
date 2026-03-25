import { ReactiveController, ReactiveControllerHost } from "lit";

export class AccountRequestController implements ReactiveController {
  constructor(private readonly host: ReactiveControllerHost) {
    this.host.addController(this);
  }

  // TODO: wire up account request logic
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  hostConnected() {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  hostDisconnected() {}

  handleAllow() {
    console.log("Account request approved");
  }

  handleReject() {
    console.log("Account request rejected");
  }
}
