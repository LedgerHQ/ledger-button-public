import { ReactiveController, ReactiveControllerHost } from "lit";

import { Translation } from "./context/language-context.js";

export class LedgerButtonAppController implements ReactiveController {
  host: ReactiveControllerHost;
  label: string;

  constructor(
    host: ReactiveControllerHost,
    private readonly translation: Translation,
  ) {
    this.host = host;
    this.host.addController(this);
    this.label = this.translation.common.button.connect;
  }

  hostConnected() {
    this.host.requestUpdate();
  }

  setLabel = (label?: string) => {
    console.log("setLabel", label);
    this.label = label ?? this.translation.common.button.connect;
    this.host.requestUpdate();
  };
}
