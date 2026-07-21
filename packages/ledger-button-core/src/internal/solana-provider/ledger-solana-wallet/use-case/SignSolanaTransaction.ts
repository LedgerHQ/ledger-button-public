import {
  type DeviceActionState,
  DeviceActionStatus,
  type OpenAppWithDependenciesDAInput,
  OutOfMemoryDAError,
} from "@ledgerhq/device-management-kit";
import { inject, injectable } from "inversify";
import { catchError, map, type Observable, of, switchMap } from "rxjs";

import type { CoreFacade } from "../../../../api/blockchain-provider/model/CoreFacade.js";
import { DeviceOutOfMemoryError } from "../../../../api/errors/DeviceErrors.js";
import { AccountNotSelectedError } from "../../../../api/errors/DeviceFlowErrors.js";
import type { ProviderAccount } from "../../../../api/model/blockchain/ProviderAccount.js";
import type { ProviderLogger } from "../../../../api/model/blockchain/ProviderLogger.js";
import type { BlockchainConfig } from "../../../../api/model/dappConfig/BlockchainConfig.js";
import type {
  SignFlowStatus,
  SignType,
} from "../../../../api/model/signing/SignFlowStatus.js";
import { waitForDeviceSession } from "../../../blockchain-provider/utils/waitForDeviceSession.js";
import { solanaProviderModuleTypes } from "../../solanaProviderModuleTypes.js";
import { SignSolanaTransactionFlowDeviceAction } from "../device-action/SignSolanaTransactionFlowDeviceAction.js";
import type {
  SignSolanaTransactionFlowDAError,
  SignSolanaTransactionFlowDAIntermediateValue,
  SignSolanaTransactionFlowDAOutput,
} from "../device-action/SignSolanaTransactionFlowDeviceActionTypes.js";
import { getSolanaDerivationPath } from "../utils/derivationUtils.js";
import { BuildSolanaContextModule } from "./BuildSolanaContextModule.js";

export type SignSolanaTransactionParams = {
  transaction: Uint8Array;
};

@injectable()
export class SignSolanaTransaction {
  private readonly logger: ProviderLogger;

  constructor(
    @inject(solanaProviderModuleTypes.CoreFacade)
    private readonly core: CoreFacade,
    @inject(solanaProviderModuleTypes.BlockchainConfig)
    private readonly blockchainConfig: BlockchainConfig,
    @inject(solanaProviderModuleTypes.BuildContextModuleUseCase)
    private readonly buildContextModule: BuildSolanaContextModule,
  ) {
    this.logger = this.core.getLogger("[SignSolanaTransaction]");
  }

  execute(
    params: SignSolanaTransactionParams,
    selectedAccount: ProviderAccount | undefined,
  ): Observable<SignFlowStatus> {
    this.logger.info("Starting Solana transaction signing");

    const { transaction } = params;
    const signType: SignType = "transaction";

    return waitForDeviceSession(this.core).pipe(
      switchMap((session) => {
        const sessionId = session.sessionId;
        const dmk = session.dmk;

        if (!selectedAccount) {
          throw new AccountNotSelectedError("No account selected");
        }

        const derivationPath = getSolanaDerivationPath(selectedAccount);
        const contextModule = this.buildContextModule.execute();
        const openAppConfig = this.createOpenAppConfig();

        this.core.trackTransactionStarted();

        const deviceAction = new SignSolanaTransactionFlowDeviceAction({
          input: {
            signType,
            derivationPath,
            transaction,
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
          map((state) =>
            this.toSignFlowStatus(
              state,
              signType,
              openAppConfig.application.name,
            ),
          ),
        ) as Observable<SignFlowStatus>;
      }),
      catchError((error) => {
        this.logger.error("Failed to sign Solana transaction", { error });
        return of({
          signType,
          status: "error" as const,
          error,
        });
      }),
    );
  }

  private createOpenAppConfig(): OpenAppWithDependenciesDAInput {
    const { appName, dependencies } = this.blockchainConfig.appDependencies;
    return {
      application: { name: appName },
      dependencies: dependencies.map((name) => ({ name })),
      requireLatestFirmware: false,
    };
  }

  private toSignFlowStatus(
    state: DeviceActionState<
      SignSolanaTransactionFlowDAOutput,
      SignSolanaTransactionFlowDAError,
      SignSolanaTransactionFlowDAIntermediateValue
    >,
    signType: SignType,
    appName: string,
  ): SignFlowStatus {
    switch (state.status) {
      case DeviceActionStatus.Pending:
        return state.intermediateValue.signFlowStatus;

      case DeviceActionStatus.Completed:
        return {
          signType,
          status: "success",
          data: { solanaSignature: state.output.signature },
        };

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
