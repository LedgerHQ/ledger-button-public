import { inject, injectable } from "inversify";
import { Observable } from "rxjs";

import { SignFlowStatus } from "../../../api/model/signing/SignFlowStatus.js";
import {
  isSignPersonalMessageParams,
  SignPersonalMessageParams,
} from "../../../api/model/signing/SignPersonalMessageParams.js";
import {
  isSignRawTransactionParams,
  type SignRawTransactionParams,
} from "../../../api/model/signing/SignRawTransactionParams.js";
import {
  isSignTransactionParams,
  type SignTransactionParams,
} from "../../../api/model/signing/SignTransactionParams.js";
import {
  isSignTypedMessageParams,
  type SignTypedMessageParams,
} from "../../../api/model/signing/SignTypedMessageParams.js";
import { evmProviderModuleTypes } from "../../evm-provider/evmProviderModuleTypes.js";
import { SignPersonalMessageUseCase } from "../../evm-provider/use-case/SignPersonalMessageUseCase.js";
import { SignRawTransaction } from "../../evm-provider/use-case/SignRawTransaction.js";
import { SignTransaction } from "../../evm-provider/use-case/SignTransaction.js";
import { SignTypedData } from "../../evm-provider/use-case/SignTypedData.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { TransactionService } from "./TransactionService.js";

@injectable()
export class DefaultTransactionService implements TransactionService {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(evmProviderModuleTypes.SignTransactionUseCase)
    private readonly signTransactionUseCase: SignTransaction,
    @inject(evmProviderModuleTypes.SignRawTransactionUseCase)
    private readonly signRawTransactionUseCase: SignRawTransaction,
    @inject(evmProviderModuleTypes.SignTypedDataUseCase)
    private readonly signTypedDataUseCase: SignTypedData,
    @inject(evmProviderModuleTypes.SignPersonalMessageUseCase)
    private readonly signPersonalMessageUseCase: SignPersonalMessageUseCase,
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: (prefix: string) => LoggerPublisher,
  ) {
    this.logger = loggerFactory("DefaultTransactionService");
  }

  sign(
    params:
      | SignRawTransactionParams
      | SignTypedMessageParams
      | SignTransactionParams
      | SignPersonalMessageParams,
  ): Observable<SignFlowStatus> {
    this.logger.debug("[Sign] Signing intent received", { params });

    let useCase: Observable<SignFlowStatus>;
    switch (true) {
      case isSignTransactionParams(params):
        this.logger.debug("[Sign] Signing transaction");
        useCase = this.signTransactionUseCase.execute(params);
        break;
      case isSignTypedMessageParams(params):
        this.logger.debug("[Sign] Signing typed data");
        useCase = this.signTypedDataUseCase.execute(params);
        break;
      case isSignPersonalMessageParams(params):
        this.logger.debug("[Sign] Signing personal message");
        useCase = this.signPersonalMessageUseCase.execute(params);
        break;
      case isSignRawTransactionParams(params):
      default:
        this.logger.debug("[Sign] Signing raw transaction");
        useCase = this.signRawTransactionUseCase.execute(params);
        break;
    }

    return useCase;
  }

  reset(): void {
    // no-op
  }
}
