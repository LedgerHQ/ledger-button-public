import { ContextModuleChainID } from "@ledgerhq/context-module";
import {
  type DeviceActionState,
  DeviceActionStatus,
  OutOfMemoryDAError,
} from "@ledgerhq/device-management-kit";
import type { CoreFacade } from "@ledgerhq/ledger-wallet-provider-core";
import type { ProviderAccount } from "@ledgerhq/ledger-wallet-provider-core";
import type { ProviderLogger } from "@ledgerhq/ledger-wallet-provider-core";
import type { BlockchainConfig } from "@ledgerhq/ledger-wallet-provider-core";
import type {
  SignFlowStatus,
  SignType,
} from "@ledgerhq/ledger-wallet-provider-core";
import {
  DeviceOutOfMemoryError,
  isBroadcastedTransactionResult,
} from "@ledgerhq/ledger-wallet-provider-core";
import { AccountNotSelectedError } from "@ledgerhq/ledger-wallet-provider-core";
import {
  createOpenAppConfig,
  waitForDeviceSession,
} from "@ledgerhq/ledger-wallet-provider-core";
import { inject, injectable } from "inversify";
import { catchError, from, type Observable, of, switchMap } from "rxjs";

import { SignRawTransactionFlowDeviceAction } from "../device-action/SignRawTransactionFlowDeviceAction";
import type {
  SignRawTransactionFlowDAError,
  SignRawTransactionFlowDAIntermediateValue,
  SignRawTransactionFlowDAOutput,
} from "../device-action/SignRawTransactionFlowDeviceActionTypes";
import { evmProviderModuleTypes } from "../di/evmProviderModuleTypes";
import type { SignRawTransactionParams } from "../model/SignRawTransactionParams";
import { getEvmDerivationPath } from "../utils/derivationUtils";
import { BroadcastTransaction } from "./BroadcastTransaction";
import { BuildContextModule } from "./BuildContextModule";

@injectable()
export class SignRawTransaction {
  private readonly logger: ProviderLogger;

  constructor(
    @inject(evmProviderModuleTypes.CoreFacade)
    private readonly core: CoreFacade,
    @inject(evmProviderModuleTypes.BlockchainConfig)
    private readonly blockchainConfig: BlockchainConfig,
    @inject(evmProviderModuleTypes.BroadcastTransactionUseCase)
    private readonly broadcastTransactionUseCase: BroadcastTransaction,
    @inject(evmProviderModuleTypes.BuildContextModuleUseCase)
    private readonly buildContextModule: BuildContextModule,
  ) {
    this.logger = this.core.getLogger("SignRawTransaction");
  }

  execute(
    params: SignRawTransactionParams,
    selectedAccount: ProviderAccount | undefined,
  ): Observable<SignFlowStatus> {
    this.logger.info("Starting transaction signing", { params });

    const { transaction, broadcast } = params;
    const signType: SignType = "transaction";

    this.core.trackTransactionStarted();

    return waitForDeviceSession(this.core).pipe(
      switchMap((session) => {
        const { sessionId, dmk } = session;

        if (!selectedAccount) {
          throw new AccountNotSelectedError("No account selected");
        }

        const derivationPath = getEvmDerivationPath(selectedAccount);
        const contextModule = this.buildContextModule.execute({
          chain: ContextModuleChainID.Ethereum,
        });
        const openAppConfig = createOpenAppConfig(this.blockchainConfig);

        const deviceAction = new SignRawTransactionFlowDeviceAction({
          input: {
            signType,
            derivationPath,
            rawTransaction: transaction,
            expectedAddress: selectedAccount.freshAddress,
            openAppInput: openAppConfig,
            contextModule,
          },
          inspect: false,
        });

        const { observable } = dmk.executeDeviceAction({
          sessionId,
          deviceAction,
        });

        return observable.pipe(
          switchMap((state) =>
            from(
              this.toSignFlowStatus(
                state,
                transaction,
                broadcast,
                signType,
                openAppConfig.application.name,
              ),
            ),
          ),
        );
      }),
      catchError((error) => {
        this.logger.error("Transaction signing failed", { error });
        return of({ signType, status: "error" as const, error });
      }),
    );
  }

  private async toSignFlowStatus(
    state: DeviceActionState<
      SignRawTransactionFlowDAOutput,
      SignRawTransactionFlowDAError,
      SignRawTransactionFlowDAIntermediateValue
    >,
    rawTransaction: string,
    broadcast: boolean,
    signType: SignType,
    appName: string,
  ): Promise<SignFlowStatus> {
    switch (state.status) {
      case DeviceActionStatus.Pending:
        return state.intermediateValue.signFlowStatus;

      case DeviceActionStatus.Completed: {
        const signedTransaction = state.output;

        if (broadcast && this.core.isModalOpen()) {
          const broadcastResult =
            await this.broadcastTransactionUseCase.execute({
              signedRawTransaction: signedTransaction.signedRawTransaction,
              rawTransaction,
            });

          if (isBroadcastedTransactionResult(broadcastResult)) {
            this.core.trackTransactionCompleted(rawTransaction, broadcastResult);
          }

          return { signType, status: "success", data: broadcastResult };
        }

        return { signType, status: "success", data: signedTransaction };
      }

      case DeviceActionStatus.Error: {
        const error =
          state.error instanceof OutOfMemoryDAError
            ? new DeviceOutOfMemoryError(
                "Not enough memory on device to process the request",
                { appName },
              )
            : state.error;
        return { signType, status: "error", error };
      }

      default:
        return {
          signType,
          status: "debugging",
          message: `Status: ${(state as { status: string }).status}`,
        };
    }
  }
}
