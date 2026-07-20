import {
  type DeviceActionState,
  DeviceActionStatus,
  type OpenAppWithDependenciesDAInput,
} from "@ledgerhq/device-management-kit";
import { inject, injectable } from "inversify";
import { catchError, map, type Observable, of, switchMap } from "rxjs";

import type { CoreFacade } from "../../../api/blockchain-provider/model/CoreFacade.js";
import { AccountNotSelectedError } from "../../../api/errors/DeviceFlowErrors.js";
import type { ProviderAccount } from "../../../api/model/blockchain/ProviderAccount.js";
import type { ProviderLogger } from "../../../api/model/blockchain/ProviderLogger.js";
import type { BlockchainConfig } from "../../../api/model/dappConfig/BlockchainConfig.js";
import type {
  SignFlowStatus,
  SignType,
} from "../../../api/model/signing/SignFlowStatus.js";
import type { SignSolanaMessageParams } from "../../../api/model/signing/solana/SignSolanaMessageParams.js";
import { waitForDeviceSession } from "../../evm-provider/ledger-eip1193/utils/waitForDeviceSession.js";
import { SignSolanaMessageFlowDeviceAction } from "../device-action/SignSolanaMessageFlowDeviceAction.js";
import type {
  SignSolanaMessageFlowDAError,
  SignSolanaMessageFlowDAIntermediateValue,
  SignSolanaMessageFlowDAOutput,
} from "../device-action/SignSolanaMessageFlowDeviceActionTypes.js";
import { getSolanaDerivationPath } from "../ledger-solana-wallet/utils/derivationUtils.js";
import { solanaProviderModuleTypes } from "../solanaProviderModuleTypes.js";

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
    this.logger.info("Starting Solana message signing", { params });

    return waitForDeviceSession(this.core).pipe(
      switchMap((session) => {
        const sessionId = session.sessionId;
        const dmk = session.dmk;

        if (!selectedAccount) {
          throw new AccountNotSelectedError("No account selected");
        }

        const derivationPath = getSolanaDerivationPath(selectedAccount);
        const openAppConfig = this.createOpenAppConfig();

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
      dependencies: dependencies.map((name) => ({ name })),
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

      case DeviceActionStatus.Completed:
        return {
          signType: SIGN_TYPE,
          status: "success",
          data: {
            signature: state.output.signature,
            signedMessage: state.output.signedMessage,
          },
        };

      case DeviceActionStatus.Error:
        return { signType: SIGN_TYPE, status: "error", error: state.error };

      default:
        return {
          signType: SIGN_TYPE,
          status: "debugging",
          message: `Status: ${(state as { status: string }).status}`,
        };
    }
  }
}
