import { ContextModuleChainID } from "@ledgerhq/context-module";
import {
  type DeviceActionState,
  DeviceActionStatus,
  type OpenAppWithDependenciesDAInput,
  OutOfMemoryDAError,
} from "@ledgerhq/device-management-kit";
import { inject, injectable } from "inversify";
import { map, type Observable, of, switchMap } from "rxjs";

import type { CoreFacade } from "../../../../api/blockchain-provider/model/CoreFacade.js";
import { DeviceOutOfMemoryError } from "../../../../api/errors/DeviceErrors.js";
import {
  AccountNotSelectedError,
  DeviceConnectionError,
} from "../../../../api/errors/DeviceFlowErrors.js";
import type { ProviderAccount } from "../../../../api/model/blockchain/ProviderAccount.js";
import type { ProviderLogger } from "../../../../api/model/blockchain/ProviderLogger.js";
import type { BlockchainConfig } from "../../../../api/model/dappConfig/BlockchainConfig.js";
import type {
  SignFlowStatus,
  SignType,
} from "../../../../api/model/signing/SignFlowStatus.js";
import type { SignPersonalMessageParams } from "../../../../api/model/signing/SignPersonalMessageParams.js";
import { evmProviderModuleTypes } from "../../evmProviderModuleTypes.js";
import { SignPersonalMessageFlowDeviceAction } from "../device-action/SignPersonalMessageFlowDeviceAction.js";
import type {
  SignPersonalMessageFlowDAError,
  SignPersonalMessageFlowDAIntermediateValue,
  SignPersonalMessageFlowDAOutput,
} from "../device-action/SignPersonalMessageFlowDeviceActionTypes.js";
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

    const session = this.core.getDeviceSession();
    const sessionId = session.sessionId;

    if (!sessionId || !session.isConnected) {
      this.logger.error("No device connected");
      throw new DeviceConnectionError(
        "No device connected. Please connect a device first.",
        { type: "not-connected" },
      );
    }

    const [, message] = params;
    const signType: SignType = "personal-sign";

    try {
      const dmk = session.dmk;

      if (!selectedAccount) {
        throw new AccountNotSelectedError("No account selected");
      }

      const derivationPath = getEvmDerivationPath(selectedAccount);
      const contextModule = this.buildContextModule.execute({
        chain: ContextModuleChainID.Ethereum,
      });

      return of(this.createOpenAppConfig()).pipe(
        switchMap((openAppConfig) => {
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
      );
    } catch (error) {
      this.logger.error("Failed to sign personal message", { error });
      return of({
        signType,
        status: "error" as const,
        error,
      });
    }
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
