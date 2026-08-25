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
} from "@api/blockchain-provider/model/types";
import { ModalClosedError } from "@api/errors/ProviderErrors";
import type { Account } from "@api/model/Account";
import type {
  ProviderGasFeeEstimation,
  ProviderTransactionInfo,
} from "@api/model/blockchain/GasFee";
import type { ProviderLogger } from "@api/model/blockchain/ProviderLogger";
import { getSelectedAccount } from "@api/model/ButtonCoreContext";
import {
  isBroadcastedTransactionResult,
  type SignedResults,
} from "@api/model/signing/SignedTransaction";
import type { SignFlowStatus } from "@api/model/signing/SignFlowStatus";
import type { BackendService } from "@internal/backend/BackendService";
import { backendModuleTypes } from "@internal/backend/di/backendModuleTypes";
import {
  type BroadcastResponse,
  isCoinServiceBroadcastResponse,
  isJsonRpcResponse,
  type JSONRPCRequest,
} from "@internal/backend/types";
import { getCoinServiceNetworkName } from "@internal/balance/constants/networkConstants";
import type { CalDataSource } from "@internal/balance/datasource/cal/CalDataSource";
import type { CoinServiceDataSource } from "@internal/balance/datasource/coinService/CoinServiceDataSource";
import { balanceModuleTypes } from "@internal/balance/di/balanceModuleTypes";
import { configModuleTypes } from "@internal/config/di/configModuleTypes";
import type { Config } from "@internal/config/model/config";
import type { ContextService } from "@internal/context/ContextService";
import { contextModuleTypes } from "@internal/context/di/contextModuleTypes";
import { deviceModuleTypes } from "@internal/device/di/deviceModuleTypes";
import type { DeviceManagementKitService } from "@internal/device/service/DeviceManagementKitService";
import { eventTrackingModuleTypes } from "@internal/event-tracking/di/eventTrackingModuleTypes";
import type { TrackTransactionCompleted } from "@internal/event-tracking/use-case/TrackTransactionCompleted";
import type { TrackTransactionStarted } from "@internal/event-tracking/use-case/TrackTransactionStarted";
import type { TrackTypedMessageCompleted } from "@internal/event-tracking/use-case/TrackTypedMessageCompleted";
import type { TrackTypedMessageStarted } from "@internal/event-tracking/use-case/TrackTypedMessageStarted";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes";
import type { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";
import { modalModuleTypes } from "@internal/modal/di/modalModuleTypes";
import type { ModalService } from "@internal/modal/service/ModalService";
import { navigationModuleTypes } from "@internal/navigation/di/navigationModuleTypes";
import type { NavigationIntentService } from "@internal/navigation/service/NavigationIntentService";
import { pendingTransactionModuleTypes } from "@internal/pending-transaction/di/pendingTransactionModuleTypes";
import type { TrackBroadcastedTransactionUseCase } from "@internal/pending-transaction/use-case/TrackBroadcastedTransactionUseCase";

import { blockchainProviderModuleTypes } from "../di/blockchainProviderModuleTypes";
import type { BlockchainProviderManager } from "./BlockchainProviderManager";
import type { CoreFacadeService } from "./CoreFacadeService";

@injectable()
export class DefaultCoreFacadeService implements CoreFacadeService {
  private readonly _logger: LoggerPublisher;

  constructor(
    @inject(navigationModuleTypes.NavigationIntentService)
    private readonly _navigationIntentService: NavigationIntentService,
    @inject(contextModuleTypes.ContextService)
    private readonly _contextService: ContextService,
    @inject(blockchainProviderModuleTypes.BlockchainProviderManager)
    private readonly _blockchainProviderManager: BlockchainProviderManager,
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
    @inject(balanceModuleTypes.CalDataSource)
    private readonly _calDataSource: CalDataSource,
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
  ): Promise<BroadcastResponse> {
    this._logger.debug("Broadcasting JSON-RPC request", { args, blockchain });

    const response = await this._backendService.broadcast({
      blockchain,
      rpc: args,
    });
    return response.caseOf<BroadcastResponse>({
      Right: (result) => {
        if (
          isJsonRpcResponse(result) ||
          isCoinServiceBroadcastResponse(result)
        ) {
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
    const currencyId = this._blockchainProviderManager
      .describeNetwork(String(chainId))
      .map((c) => c.currencyId)
      .extract();
    this._contextService.onEvent({
      type: "chain_changed",
      chainId,
      currencyId,
    });
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
    this._warmCurrencyMetadata(intent);
    this._navigationIntentService.emit(intent);
  }

  /**
   * A broadcast ends with core resolving currency metadata to build the pending
   * transaction (formatted value, explorer link). Kicking that lookup off when
   * the sign phase starts means it runs while the user approves on device, so
   * the explorer link is ready as soon as the hash is known.
   */
  private _warmCurrencyMetadata(intent: WalletNavigationIntent): void {
    if (intent.name !== "signTransaction" || !intent.params.broadcast) {
      return;
    }
    const account = getSelectedAccount(
      this._contextService.getContext(),
      intent.params.family,
    );
    if (!account) {
      return;
    }
    void this._calDataSource.getCurrencyInformation(account.currencyId);
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
