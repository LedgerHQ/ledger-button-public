import { ReactiveController, ReactiveControllerHost } from "lit";

export class AccountRequestController implements ReactiveController {
  constructor(private readonly host: ReactiveControllerHost) {
    this.host.addController(this);
  }

  handleAllow() {
    console.log("Account request approved");
  }

  handleReject() {
    console.log("Account request rejected");
  }
}
