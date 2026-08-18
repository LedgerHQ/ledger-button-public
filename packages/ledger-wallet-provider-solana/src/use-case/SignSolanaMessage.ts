import {
  type DeviceActionState,
  DeviceActionStatus,
  type OpenAppWithDependenciesDAInput,
} from "@ledgerhq/device-management-kit";
import type { CoreFacade } from "@ledgerhq/ledger-wallet-provider-core";
import type { ProviderAccount } from "@ledgerhq/ledger-wallet-provider-core";
import type { ProviderLogger } from "@ledgerhq/ledger-wallet-provider-core";
import type { BlockchainConfig } from "@ledgerhq/ledger-wallet-provider-core";
import type {
  SignFlowStatus,
  SignType,
} from "@ledgerhq/ledger-wallet-provider-core";
import type { SignSolanaMessageParams } from "@ledgerhq/ledger-wallet-provider-core";
import { AccountNotSelectedError } from "@ledgerhq/ledger-wallet-provider-core";
import { waitForDeviceSession } from "@ledgerhq/ledger-wallet-provider-core";
import { inject, injectable } from "inversify";
import { catchError, map, type Observable, of, switchMap } from "rxjs";

import { SignSolanaMessageFlowDeviceAction } from "../device-action/SignSolanaMessageFlowDeviceAction";
import type {
  SignSolanaMessageFlowDAError,
  SignSolanaMessageFlowDAIntermediateValue,
  SignSolanaMessageFlowDAOutput,
} from "../device-action/SignSolanaMessageFlowDeviceActionTypes";
import { solanaProviderModuleTypes } from "../di/solanaProviderModuleTypes";
import { getSolanaDerivationPath } from "../utils/derivationUtils";

const SIGN_TYPE: SignType = "solana-message";

@injectable()
export class SignSolanaMessage {
  private readonly logger: ProviderLogger;

  constructor(
    @inject(solanaProviderModuleTypes.CoreFacade)
    private readonly core: CoreFacade,
    @inject(solanaProviderModuleTypes.BlockchainConfig)
    private readonly blockchainConfig: BlockchainConfig,
  ) {
    this.logger = this.core.getLogger("[SignSolanaMessage]");
  }

  execute(
    params: SignSolanaMessageParams,
    selectedAccount: ProviderAccount | undefined,
  ): Observable<SignFlowStatus> {
    this.logger.info("Starting Solana message signing", {
      messageByteLength: params.message.byteLength,
    });

    return waitForDeviceSession(this.core).pipe(
      switchMap((session) => {
        const sessionId = session.sessionId;
        const dmk = session.dmk;

        if (!selectedAccount) {
          throw new AccountNotSelectedError("No account selected");
        }

        const derivationPath = getSolanaDerivationPath(selectedAccount);
        const openAppConfig = this.createOpenAppConfig();

        this.logger.debug("Prepared Solana message signing", {
          address: params.address,
          messageByteLength: params.message.byteLength,
          derivationPath,
        });
        this.logger.debug("Starting Solana message device action", {
          appName: openAppConfig.application.name,
          dependencyCount: openAppConfig.dependencies.length,
        });

        const deviceAction = new SignSolanaMessageFlowDeviceAction({
          input: {
            signType: SIGN_TYPE,
            derivationPath,
            message: params.message,
            expectedAddress: selectedAccount.freshAddress,
            openAppInput: openAppConfig,
          },
          inspect: false,
        });

        const { observable } = dmk.executeDeviceAction({
          sessionId,
          deviceAction,
        });

        return observable.pipe(
          map((state) => this.toSignFlowStatus(state)),
        ) as Observable<SignFlowStatus>;
      }),
      catchError((error) => {
        this.logger.error("Failed to sign Solana message", { error });
        return of({
          signType: SIGN_TYPE,
          status: "error" as const,
          error,
        });
      }),
    );
  }

  createOpenAppConfig(): OpenAppWithDependenciesDAInput {
    const { appName, dependencies } = this.blockchainConfig.appDependencies;
    return {
      application: { name: appName },
      dependencies: dependencies.map(({ name }) => ({ name })),
      requireLatestFirmware: false,
    };
  }

  private toSignFlowStatus(
    state: DeviceActionState<
      SignSolanaMessageFlowDAOutput,
      SignSolanaMessageFlowDAError,
      SignSolanaMessageFlowDAIntermediateValue
    >,
  ): SignFlowStatus {
    switch (state.status) {
      case DeviceActionStatus.Pending:
        return state.intermediateValue.signFlowStatus;

      case DeviceActionStatus.Completed: {
        this.logger.debug("Solana message signing completed", {
          signatureCharLength: state.output.signature.length,
          signedMessageByteLength: state.output.signedMessage.byteLength,
        });
        return {
          signType: SIGN_TYPE,
          status: "success",
          data: {
            signature: state.output.signature,
            signedMessage: state.output.signedMessage,
          },
        };
      }

      case DeviceActionStatus.Error: {
        // Same as transaction signing: device-action errors emit a status value
        // rather than throwing, so `catchError` never sees them.
        this.logger.error("Solana message signing device action failed", {
          error: state.error,
        });
        return { signType: SIGN_TYPE, status: "error", error: state.error };
      }

      default:
        return {
          signType: SIGN_TYPE,
          status: "debugging",
          message: `Status: ${(state as { status: string }).status}`,
        };
    }
  }
}
