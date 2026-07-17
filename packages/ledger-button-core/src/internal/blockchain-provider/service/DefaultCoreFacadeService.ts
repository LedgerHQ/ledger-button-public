import type { TypedData } from "@ledgerhq/device-signer-kit-ethereum";
import { type Factory, inject, injectable } from "inversify";
import { Subject } from "rxjs";

import type {
  BlockchainFamily,
  ProviderBlockchain,
  ProviderDeviceSession,
  ProviderSdkConfig,
  ProviderSignParams,
  WalletNavigationIntent,
} from "../../../api/blockchain-provider/model/types.js";
import { ModalClosedError } from "../../../api/errors/ProviderErrors.js";
import type {
  ProviderGasFeeEstimation,
  ProviderTransactionInfo,
} from "../../../api/model/blockchain/GasFee.js";
import type { ProviderLogger } from "../../../api/model/blockchain/ProviderLogger.js";
import { getSelectedAccount } from "../../../api/model/ButtonCoreContext.js";
import type {
  JSONRPCRequest,
  JsonRpcResponse,
} from "../../../api/model/eip/EIPTypes.js";
import {
  isBroadcastedTransactionResult,
  type SignedResults,
} from "../../../api/model/signing/SignedTransaction.js";
import type { SignFlowStatus } from "../../../api/model/signing/SignFlowStatus.js";
import type { Account } from "../../../internal/account/service/AccountService.js";
import { backendModuleTypes } from "../../../internal/backend/backendModuleTypes.js";
import type { BackendService } from "../../../internal/backend/BackendService.js";
import { isJsonRpcResponse } from "../../../internal/backend/types.js";
import { balanceModuleTypes } from "../../../internal/balance/balanceModuleTypes.js";
import { getCoinServiceNetworkName } from "../../../internal/balance/constants/networkConstants.js";
import type { CoinServiceDataSource } from "../../../internal/balance/datasource/coinService/CoinServiceDataSource.js";
import { configModuleTypes } from "../../../internal/config/configModuleTypes.js";
import type { Config } from "../../../internal/config/model/config.js";
import { contextModuleTypes } from "../../../internal/context/contextModuleTypes.js";
import type { ContextService } from "../../../internal/context/ContextService.js";
import { deviceModuleTypes } from "../../../internal/device/deviceModuleTypes.js";
import type { DeviceManagementKitService } from "../../../internal/device/service/DeviceManagementKitService.js";
import { eventTrackingModuleTypes } from "../../../internal/event-tracking/eventTrackingModuleTypes.js";
import type { TrackTransactionCompleted } from "../../../internal/event-tracking/usecase/TrackTransactionCompleted.js";
import type { TrackTransactionStarted } from "../../../internal/event-tracking/usecase/TrackTransactionStarted.js";
import type { TrackTypedMessageCompleted } from "../../../internal/event-tracking/usecase/TrackTypedMessageCompleted.js";
import type { TrackTypedMessageStarted } from "../../../internal/event-tracking/usecase/TrackTypedMessageStarted.js";
import { loggerModuleTypes } from "../../../internal/logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../../internal/logger/service/LoggerPublisher.js";
import { modalModuleTypes } from "../../../internal/modal/modalModuleTypes.js";
import type { ModalService } from "../../../internal/modal/service/ModalService.js";
import { navigationModuleTypes } from "../../../internal/navigation/navigationModuleTypes.js";
import type { NavigationIntentService } from "../../../internal/navigation/service/NavigationIntentService.js";
import { pendingTransactionModuleTypes } from "../../../internal/pending-transaction/pendingTransactionModuleTypes.js";
import type { TrackBroadcastedTransactionUseCase } from "../../../internal/pending-transaction/use-case/TrackBroadcastedTransactionUseCase.js";
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
    @inject(deviceModuleTypes.DeviceManagementKitService)
    private readonly _deviceManagementKitService: DeviceManagementKitService,
    @inject(configModuleTypes.Config)
    private readonly _config: Config,
    @inject(modalModuleTypes.ModalService)
    private readonly _modalService: ModalService,
    @inject(balanceModuleTypes.CoinServiceDataSource)
    private readonly _coinServiceDataSource: CoinServiceDataSource,
    @inject(eventTrackingModuleTypes.TrackTransactionStarted)
    private readonly _trackTransactionStarted: TrackTransactionStarted,
    @inject(eventTrackingModuleTypes.TrackTransactionCompleted)
    private readonly _trackTransactionCompleted: TrackTransactionCompleted,
    @inject(eventTrackingModuleTypes.TrackTypedMessageStarted)
    private readonly _trackTypedMessageStarted: TrackTypedMessageStarted,
    @inject(eventTrackingModuleTypes.TrackTypedMessageCompleted)
    private readonly _trackTypedMessageCompleted: TrackTypedMessageCompleted,
    @inject(pendingTransactionModuleTypes.TrackBroadcastedTransactionUseCase)
    private readonly _trackBroadcastedTransaction: TrackBroadcastedTransactionUseCase,
    @inject(loggerModuleTypes.LoggerPublisher)
    private readonly _loggerFactory: Factory<LoggerPublisher>,
  ) {
    this._logger = this._loggerFactory("CoreFacadeService") as LoggerPublisher;
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
    const selected = getSelectedAccount(
      this._contextService.getContext(),
      family,
    );
    if (selected) {
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
        params: { family },
        status$,
        finish: () => status$.complete(),
        retry: () =>
          this._navigationIntentService.emit({
            name: "selectAccount",
            params: { family },
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

  private _disconnectHandler?: (family: BlockchainFamily) => Promise<void>;

  setDisconnectHandler(
    handler: (family: BlockchainFamily) => Promise<void>,
  ): void {
    this._disconnectHandler = handler;
  }

  async disconnect(family: BlockchainFamily): Promise<void> {
    if (!this._disconnectHandler) {
      this._logger.error(
        "disconnect() called before a handler was registered by core",
      );
      return;
    }
    this._logger.debug("Disconnecting family via core handler", { family });
    await this._disconnectHandler(family);
  }

  getLogger(tag: string): ProviderLogger {
    return this._loggerFactory(tag) as ProviderLogger;
  }

  getDeviceSession(): ProviderDeviceSession {
    return {
      dmk: this._deviceManagementKitService.dmk,
      sessionId: this._deviceManagementKitService.sessionId,
      isConnected: Boolean(this._deviceManagementKitService.connectedDevice),
    };
  }

  getSdkConfig(): ProviderSdkConfig {
    return {
      originToken: this._config.originToken,
      dAppIdentifier: this._config.dAppIdentifier,
    };
  }

  isModalOpen(): boolean {
    return this._modalService.open;
  }

  trackTransactionStarted(): void {
    void this._trackTransactionStarted.execute();
  }

  trackTransactionCompleted(
    rawTransaction: string,
    result: SignedResults,
  ): void {
    if (isBroadcastedTransactionResult(result)) {
      void this._trackTransactionCompleted.execute(rawTransaction, result);
    }
  }

  trackTypedMessageStarted(typedData: TypedData): void {
    void this._trackTypedMessageStarted.execute(typedData);
  }

  trackTypedMessageCompleted(typedData: TypedData): void {
    void this._trackTypedMessageCompleted.execute(typedData);
  }

  emitNavigationIntent(intent: WalletNavigationIntent): void {
    this._navigationIntentService.emit(intent);
  }

  trackBroadcastedTransaction(
    status: SignFlowStatus,
    params: ProviderSignParams,
  ): void {
    void this._trackBroadcastedTransaction.execute(status, params);
  }

  async estimateGasFromCoinService(
    tx: ProviderTransactionInfo,
  ): Promise<ProviderGasFeeEstimation | undefined> {
    const network = getCoinServiceNetworkName(tx.chainId);
    if (!network) {
      return undefined;
    }

    const either = await this._coinServiceDataSource.estimateTransactionFee(
      network,
      {
        type: "send",
        sender: tx.from,
        recipient: tx.to,
        amount: tx.value,
        asset: { type: "native" },
        feesStrategy: "medium",
        data: tx.data,
      },
    );

    return either.caseOf<ProviderGasFeeEstimation | undefined>({
      Left: (error) => {
        this._logger.debug("CoinService gas fee estimation failed", { error });
        return undefined;
      },
      Right: (response) => ({
        gasLimit: response.parameters.gasLimit,
        maxFeePerGas: response.parameters.maxFeePerGas,
        maxPriorityFeePerGas: response.parameters.maxPriorityFeePerGas,
      }),
    });
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
