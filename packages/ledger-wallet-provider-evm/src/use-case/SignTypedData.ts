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
import { DeviceOutOfMemoryError } from "@ledgerhq/ledger-wallet-provider-core";
import { AccountNotSelectedError } from "@ledgerhq/ledger-wallet-provider-core";
import {
  createOpenAppConfig,
  waitForDeviceSession,
} from "@ledgerhq/ledger-wallet-provider-core";
import { inject, injectable } from "inversify";
import { catchError, map, type Observable, of, switchMap } from "rxjs";

import { SignTypedDataFlowDeviceAction } from "../device-action/SignTypedDataFlowDeviceAction";
import type {
  SignTypedDataFlowDAError,
  SignTypedDataFlowDAIntermediateValue,
  SignTypedDataFlowDAOutput,
} from "../device-action/SignTypedDataFlowDeviceActionTypes";
import { evmProviderModuleTypes } from "../di/evmProviderModuleTypes";
import type { SignTypedMessageParams } from "../model/SignTypedMessageParams";
import { getEvmDerivationPath } from "../utils/derivationUtils";
import { BuildContextModule } from "./BuildContextModule";

@injectable()
export class SignTypedData {
  private readonly logger: ProviderLogger;

  constructor(
    @inject(evmProviderModuleTypes.CoreFacade)
    private readonly core: CoreFacade,
    @inject(evmProviderModuleTypes.BlockchainConfig)
    private readonly blockchainConfig: BlockchainConfig,
    @inject(evmProviderModuleTypes.BuildContextModuleUseCase)
    private readonly buildContextModule: BuildContextModule,
  ) {
    this.logger = this.core.getLogger("SignTypedData");
  }

  execute(
    params: SignTypedMessageParams,
    selectedAccount: ProviderAccount | undefined,
  ): Observable<SignFlowStatus> {
    this.logger.info("Starting typed data signing", { params });

    const [, typedData] = params;
    const signType: SignType = "typed-message";

    this.core.trackTypedMessageStarted(typedData);

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

        const deviceAction = new SignTypedDataFlowDeviceAction({
          input: {
            signType,
            derivationPath,
            typedData,
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
              typedData,
              signType,
              openAppConfig.application.name,
            ),
          ),
        ) as Observable<SignFlowStatus>;
      }),
      catchError((error) => {
        this.logger.error("Failed to sign typed data", { error });
        return of({ signType, status: "error" as const, error });
      }),
    );
  }

  private toSignFlowStatus(
    state: DeviceActionState<
      SignTypedDataFlowDAOutput,
      SignTypedDataFlowDAError,
      SignTypedDataFlowDAIntermediateValue
    >,
    typedData: SignTypedMessageParams[1],
    signType: SignType,
    appName: string,
  ): SignFlowStatus {
    switch (state.status) {
      case DeviceActionStatus.Pending:
        return state.intermediateValue.signFlowStatus;

      case DeviceActionStatus.Completed:
        this.core.trackTypedMessageCompleted(typedData);
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
