import { type Factory, inject, injectable } from "inversify";
import { Subject } from "rxjs";

import { ModalClosedError } from "../../../api/errors/ProviderErrors.js";
import type {
  JSONRPCRequest,
  JsonRpcResponse,
} from "../../../api/model/eip/EIPTypes.js";
import type { SignFlowStatus } from "../../../api/model/signing/SignFlowStatus.js";
import type { Account } from "../../account/service/AccountService.js";
import { backendModuleTypes } from "../../backend/backendModuleTypes.js";
import type { BackendService } from "../../backend/BackendService.js";
import { isJsonRpcResponse } from "../../backend/types.js";
import { contextModuleTypes } from "../../context/contextModuleTypes.js";
import type { ContextService } from "../../context/ContextService.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { navigationModuleTypes } from "../../navigation/navigationModuleTypes.js";
import type { NavigationIntentService } from "../../navigation/service/NavigationIntentService.js";
import type {
  BlockchainFamily,
  ProviderBlockchain,
} from "../model/BlockchainProvider.js";
import { resolveBlockchainFamily } from "../utils/resolveBlockchainFamily.js";
import type { CoreFacadeService } from "./CoreFacadeService.js";

@injectable()
export class DefaultCoreFacadeService implements CoreFacadeService {
  private readonly _logger: LoggerPublisher;

  constructor(
    @inject(navigationModuleTypes.NavigationIntentService)
    private readonly _navigationIntentService: NavigationIntentService,
    @inject(contextModuleTypes.ContextService)
    private readonly _contextService: ContextService,
    @inject(backendModuleTypes.BackendService)
    private readonly _backendService: BackendService,
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
  ) {
    this._logger = loggerFactory("CoreFacadeService");
  }

  async broadcastRPC(
    args: JSONRPCRequest,
    blockchain: ProviderBlockchain,
  ): Promise<JsonRpcResponse> {
    this._logger.debug("Broadcasting JSON-RPC request", { args, blockchain });
    const response = await this._backendService.broadcast({
      blockchain,
      rpc: args,
    });
    return response.caseOf<JsonRpcResponse>({
      Right: (result) => {
        if (isJsonRpcResponse(result)) {
          return result;
        }
        throw new Error("Unexpected broadcast response for JSON-RPC request");
      },
      Left: (error) => {
        this._logger.error("JSON-RPC request failed", { error });
        throw error;
      },
    });
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

  async requestSwitchChain(chainId: number): Promise<void> {
    this._contextService.onEvent({ type: "chain_changed", chainId });
  }

  // TODO: extract disconnect() from LedgerButtonCore in a follow-up
  async disconnect(): Promise<void> {
    throw new Error("disconnect() not yet extracted from LedgerButtonCore");
  }
}

declare global {
  interface WindowEventMap {
    "ledger-provider-account-selected": CustomEvent<
      | { account: Account; status: "success" }
      | { status: "error"; error: unknown }
    >;
    "ledger-provider-close": CustomEvent;
  }
}
