import { type Factory, inject, injectable, preDestroy } from "inversify";

import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { type LoggerPublisher } from "../../logger/service/LoggerPublisher.js";

@injectable()
export class ModalService {
  private _open = false;
  private readonly logger: LoggerPublisher;
  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
  ) {
    this.logger = loggerFactory("[ModalService]");
    if (window) {
      window.addEventListener("ledger-core-modal-open", this.openModal);
      window.addEventListener("ledger-core-modal-close", this.closeModal);
    }
  }

  openModal = () => {
    this.logger.info("ledger-core-modal-open");
    this._open = true;
  };

  closeModal = () => {
    this.logger.info("ledger-core-modal-close");
    this._open = false;
  };

  @preDestroy()
  public onDeactivation() {
    if (window) {
      window.removeEventListener("ledger-core-modal-open", this.openModal);
      window.removeEventListener("ledger-core-modal-close", this.closeModal);
    }
  }

  get open() {
    return this._open;
  }
}
