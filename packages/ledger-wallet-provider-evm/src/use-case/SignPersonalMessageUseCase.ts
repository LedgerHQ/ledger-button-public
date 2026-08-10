import { ContextModuleChainID } from "@ledgerhq/context-module";
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
import type { SignPersonalMessageParams } from "@ledgerhq/ledger-wallet-provider-core";
import { DeviceOutOfMemoryError } from "@ledgerhq/ledger-wallet-provider-core";
import { AccountNotSelectedError } from "@ledgerhq/ledger-wallet-provider-core";
import { waitForDeviceSession } from "@ledgerhq/ledger-wallet-provider-core";
import { inject, injectable } from "inversify";
import { catchError, map, type Observable, of, switchMap } from "rxjs";

import { SignPersonalMessageFlowDeviceAction } from "../device-action/SignPersonalMessageFlowDeviceAction.js";
import type {
  SignPersonalMessageFlowDAError,
  SignPersonalMessageFlowDAIntermediateValue,
  SignPersonalMessageFlowDAOutput,
} from "../device-action/SignPersonalMessageFlowDeviceActionTypes.js";
import { evmProviderModuleTypes } from "../di/evmProviderModuleTypes.js";
import { getEvmDerivationPath } from "../utils/derivationUtils.js";
import { BuildContextModule } from "./BuildContextModule.js";

@injectable()
export class SignPersonalMessageUseCase {
  private readonly logger: ProviderLogger;

  constructor(
    @inject(evmProviderModuleTypes.CoreFacade)
    private readonly core: CoreFacade,
    @inject(evmProviderModuleTypes.BlockchainConfig)
    private readonly blockchainConfig: BlockchainConfig,
    @inject(evmProviderModuleTypes.BuildContextModuleUseCase)
    private readonly buildContextModule: BuildContextModule,
  ) {
    this.logger = this.core.getLogger("[SignPersonalMessageUseCase]");
  }

  execute(
    params: SignPersonalMessageParams,
    selectedAccount: ProviderAccount | undefined,
  ): Observable<SignFlowStatus> {
    this.logger.info("Starting signing message", { params });

    const [, message] = params;
    const signType: SignType = "personal-sign";

    return waitForDeviceSession(this.core).pipe(
      switchMap((session) => {
        const sessionId = session.sessionId;
        const dmk = session.dmk;

        if (!selectedAccount) {
          throw new AccountNotSelectedError("No account selected");
        }

        const derivationPath = getEvmDerivationPath(selectedAccount);
        const contextModule = this.buildContextModule.execute({
          chain: ContextModuleChainID.Ethereum,
        });
        const openAppConfig = this.createOpenAppConfig();

        const deviceAction = new SignPersonalMessageFlowDeviceAction({
          input: {
            signType,
            derivationPath,
            message,
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
        this.logger.error("Failed to sign personal message", { error });
        return of({
          signType,
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
      SignPersonalMessageFlowDAOutput,
      SignPersonalMessageFlowDAError,
      SignPersonalMessageFlowDAIntermediateValue
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
          data: { signature: state.output.signature },
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
