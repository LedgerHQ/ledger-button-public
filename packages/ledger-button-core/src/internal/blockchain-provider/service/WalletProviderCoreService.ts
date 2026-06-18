import { type Factory, inject, injectable } from "inversify";
import { Subject } from "rxjs";

import type {
  JSONRPCRequest,
  JsonRpcResponse,
} from "../../../api/model/eip/EIPTypes.js";
import type { SignedResults } from "../../../api/model/signing/SignedTransaction.js";
import type { SignFlowStatus } from "../../../api/model/signing/SignFlowStatus.js";
import type { Account } from "../../account/service/AccountService.js";
import { contextModuleTypes } from "../../context/contextModuleTypes.js";
import type { ContextService } from "../../context/ContextService.js";
import { evmProviderModuleTypes } from "../../evm-provider/evmProviderModuleTypes.js";
import { JSONRPCCallUseCase } from "../../evm-provider/ledger-eip1193/jsonrpc/use-case/JSONRPCRequest.js";
import { ModalClosedError } from "../../evm-provider/ledger-eip1193/LedgerEIP1193Provider.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { navigationModuleTypes } from "../../navigation/navigationModuleTypes.js";
import type { NavigationIntentService } from "../../navigation/service/NavigationIntentService.js";
import type {
  BlockchainFamily,
  CoreFacade,
  WalletProviderSignRequest,
} from "../model/BlockchainProvider.js";
import { resolveBlockchainFamily } from "../utils/resolveBlockchainFamily.js";

@injectable()
export class WalletProviderCoreService implements CoreFacade {
  private readonly _logger: LoggerPublisher;

  constructor(
    @inject(navigationModuleTypes.NavigationIntentService)
    private readonly _navigationIntentService: NavigationIntentService,
    @inject(contextModuleTypes.ContextService)
    private readonly _contextService: ContextService,
    @inject(evmProviderModuleTypes.JSONRPCCallUseCase)
    private readonly _jsonRpcCallUseCase: JSONRPCCallUseCase,
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
  ) {
    this._logger = loggerFactory("WalletProviderCoreService");
  }

  async broadcastRPC(args: JSONRPCRequest): Promise<JsonRpcResponse> {
    this._logger.debug("Broadcasting JSON-RPC request", { args });
    const result = await this._jsonRpcCallUseCase.execute(args);
    if (!result) {
      throw new Error("JSON-RPC request returned no result");
    }
    return result;
  }

  async requestAccount(family: BlockchainFamily): Promise<Account> {
    const selected = this._contextService.getContext().selectedAccount;
    if (
      selected &&
      resolveBlockchainFamily(selected.currencyId).extract() === family
    ) {
      return selected;
    }

    return new Promise<Account>((resolve, reject) => {
      const status$ = new Subject<SignFlowStatus>();

      const onSelected = (
        event: WindowEventMap["ledger-provider-account-selected"],
      ) => {
        cleanup();
        if (event.detail.status === "error") {
          reject(event.detail.error);
          return;
        }
        resolve(event.detail.account);
      };
      const onClose = () => {
        cleanup();
        reject(new ModalClosedError("User closed the modal"));
      };
      const cleanup = () => {
        window.removeEventListener(
          "ledger-provider-account-selected",
          onSelected,
        );
        window.removeEventListener("ledger-provider-close", onClose);
      };

      window.addEventListener("ledger-provider-account-selected", onSelected, {
        once: true,
      });
      window.addEventListener("ledger-provider-close", onClose, { once: true });

      this._navigationIntentService.emit({
        name: "selectAccount",
        status$,
        finish: () => status$.complete(),
        retry: () =>
          this._navigationIntentService.emit({
            name: "selectAccount",
            status$,
            finish: () => status$.complete(),
            retry: () => undefined,
          }),
      });
    });
  }

  async requestSign(
    request: WalletProviderSignRequest,
  ): Promise<SignedResults> {
    const params = this.mapSignRequestToNavigationParams(request);

    return new Promise<SignedResults>((resolve, reject) => {
      const status$ = new Subject<SignFlowStatus>();

      const onSigned = (event: WindowEventMap["ledger-provider-sign"]) => {
        cleanup();
        if (event.detail.status === "error") {
          reject(event.detail.error);
          return;
        }
        resolve(event.detail.data);
      };
      const onClose = () => {
        cleanup();
        reject(new ModalClosedError("User closed the modal"));
      };
      const cleanup = () => {
        window.removeEventListener("ledger-provider-sign", onSigned);
        window.removeEventListener("ledger-provider-close", onClose);
      };

      window.addEventListener("ledger-provider-sign", onSigned, { once: true });
      window.addEventListener("ledger-provider-close", onClose, { once: true });

      const emit = () =>
        this._navigationIntentService.emit({
          name: "signTransaction",
          params,
          status$,
          finish: () => status$.complete(),
          retry: () => emit(),
        });
      emit();
    });
  }

  async requestSwitchChain(chainId: number): Promise<void> {
    this._contextService.onEvent({ type: "chain_changed", chainId });
  }

  // TODO: extract disconnect() from LedgerButtonCore in a follow-up
  async disconnect(): Promise<void> {
    throw new Error("disconnect() not yet extracted from LedgerButtonCore");
  }

  private mapSignRequestToNavigationParams(
    request: WalletProviderSignRequest,
  ): unknown {
    switch (request.kind) {
      case "transaction":
        return {
          transaction: request.transaction,
          method: request.method,
          broadcast: request.broadcast,
        };
      case "typedData":
      case "personalMessage":
        return request.payload;
    }
  }
}

declare global {
  interface WindowEventMap {
    "ledger-provider-account-selected": CustomEvent<
      | { account: Account; status: "success" }
      | { status: "error"; error: unknown }
    >;
    "ledger-provider-sign": CustomEvent<
      | { status: "success"; data: SignedResults }
      | { status: "error"; error: unknown }
    >;
    "ledger-provider-close": CustomEvent;
  }
}
