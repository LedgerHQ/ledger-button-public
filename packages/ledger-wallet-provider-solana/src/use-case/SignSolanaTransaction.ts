import {
  type DeviceActionState,
  DeviceActionStatus,
  type OpenAppWithDependenciesDAInput,
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
import type { SignSolanaTransactionParams } from "@ledgerhq/ledger-wallet-provider-core";
import { DeviceOutOfMemoryError } from "@ledgerhq/ledger-wallet-provider-core";
import { AccountNotSelectedError } from "@ledgerhq/ledger-wallet-provider-core";
import { waitForDeviceSession } from "@ledgerhq/ledger-wallet-provider-core";
import { inject, injectable } from "inversify";
import { catchError, map, type Observable, of, switchMap } from "rxjs";

import { SignSolanaTransactionFlowDeviceAction } from "../device-action/SignSolanaTransactionFlowDeviceAction";
import type {
  SignSolanaTransactionFlowDAError,
  SignSolanaTransactionFlowDAIntermediateValue,
  SignSolanaTransactionFlowDAOutput,
} from "../device-action/SignSolanaTransactionFlowDeviceActionTypes";
import { solanaProviderModuleTypes } from "../di/solanaProviderModuleTypes";
import { getSolanaDerivationPath } from "../utils/derivationUtils";
import { getSolanaMessageBytes } from "../utils/transactionUtils";
import { BuildSolanaContextModule } from "./BuildSolanaContextModule";

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
    this.logger.info("Starting Solana transaction signing", {
      transactionByteLength: params.transaction.byteLength,
    });

    const { transaction } = params;
    const signType: SignType = "transaction";

    // Guard before opening a device session: no point waiting for the device
    // when we already know there is no account to sign with.
    if (!selectedAccount) {
      return this.toErrorStatus(
        new AccountNotSelectedError("No account selected"),
        signType,
      );
    }

    return waitForDeviceSession(this.core).pipe(
      switchMap((session) => {
        const sessionId = session.sessionId;
        const dmk = session.dmk;

        const derivationPath = getSolanaDerivationPath(selectedAccount);
        const contextModule = this.buildContextModule.execute();
        const openAppConfig = this.createOpenAppConfig();

        // Wallet Standard delivers a full wire transaction, but the Ledger
        // Solana app signs the compiled message only. Strip the signature
        // envelope so the device does not reject the request with `6a80`.
        const messageBytes = getSolanaMessageBytes(transaction);

        this.logger.debug("Prepared Solana message bytes", {
          address: params.address,
          messageByteLength: messageBytes.byteLength,
          derivationPath,
        });
        this.logger.debug("Starting Solana transaction device action", {
          appName: openAppConfig.application.name,
          dependencyCount: openAppConfig.dependencies.length,
        });

        this.core.trackTransactionStarted();

        const deviceAction = new SignSolanaTransactionFlowDeviceAction({
          input: {
            signType,
            derivationPath,
            transaction: messageBytes,
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
      catchError((error) => this.toErrorStatus(error, signType)),
    );
  }

  private toErrorStatus(
    error: unknown,
    signType: SignType,
  ): Observable<SignFlowStatus> {
    this.logger.error("Failed to sign Solana transaction", { error });
    return of({ signType, status: "error" as const, error });
  }

  private createOpenAppConfig(): OpenAppWithDependenciesDAInput {
    const { appName, dependencies } = this.blockchainConfig.appDependencies;
    return {
      application: { name: appName },
      dependencies: dependencies.map(({ name }) => ({ name })),
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

      case DeviceActionStatus.Completed: {
        this.logger.debug("Solana transaction signing completed", {
          signatureByteLength: state.output.signature.byteLength,
        });
        return {
          signType,
          status: "success",
          data: { solanaSignature: state.output.signature },
        };
      }

      case DeviceActionStatus.Error: {
        // The device-action error path emits an error status value rather than
        // throwing, so `catchError` never sees it. Log the raw error here so the
        // real cause is visible instead of only the generic UI sign message.
        this.logger.error("Solana transaction signing device action failed", {
          error: state.error,
        });
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
