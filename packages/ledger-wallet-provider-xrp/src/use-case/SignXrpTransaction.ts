import {
  type DeviceActionState,
  DeviceActionStatus,
} from "@ledgerhq/device-management-kit";
import type {
  BlockchainConfig,
  CoreFacade,
  ProviderAccount,
  ProviderLogger,
  SignFlowStatus,
} from "@ledgerhq/ledger-wallet-provider-core";
import {
  AccountNotSelectedError,
  createOpenAppConfig,
  waitForDeviceSession,
} from "@ledgerhq/ledger-wallet-provider-core";
import { inject, injectable } from "inversify";
import { catchError, map, Observable, of, switchMap } from "rxjs";

import { SignXrpTransactionFlowDeviceAction } from "../device-action/SignXrpTransactionFlowDeviceAction";
import type {
  SignXrpTransactionFlowDAError,
  SignXrpTransactionFlowDAIntermediateValue,
  SignXrpTransactionFlowDAOutput,
} from "../device-action/SignXrpTransactionFlowDeviceActionTypes";
import { xrpProviderModuleTypes } from "../di/xrpProviderModuleTypes";
import { normalizeXrpDeviceError } from "../utils/normalizeXrpDeviceError";
import type { XrpTransaction } from "../utils/xrpTransaction";
import { getXrpDerivationPath, XRP_FAMILY } from "../utils/xrpUtils";

type SignXrpTransactionFlowDAState = DeviceActionState<
  SignXrpTransactionFlowDAOutput,
  SignXrpTransactionFlowDAError,
  SignXrpTransactionFlowDAIntermediateValue
>;

@injectable()
export class SignXrpTransaction {
  private readonly logger: ProviderLogger;

  constructor(
    @inject(xrpProviderModuleTypes.CoreFacade)
    private readonly core: CoreFacade,
    @inject(xrpProviderModuleTypes.BlockchainConfig)
    private readonly blockchainConfig: BlockchainConfig,
  ) {
    this.logger = this.core.getLogger("[SignXrpTransaction]");
  }

  execute(
    tx: XrpTransaction,
    account: ProviderAccount | undefined,
  ): Observable<SignFlowStatus> {
    if (!account) {
      return of(
        this.toErrorStatus(new AccountNotSelectedError("No account selected")),
      );
    }

    return waitForDeviceSession(this.core).pipe(
      switchMap(({ dmk, sessionId }) => {
        this.core.trackTransactionStarted(XRP_FAMILY);

        const deviceAction = new SignXrpTransactionFlowDeviceAction({
          input: {
            derivationPath: getXrpDerivationPath(account),
            transaction: tx,
            expectedAddress: account.freshAddress,
            openAppInput: createOpenAppConfig(this.blockchainConfig),
          },
          inspect: false,
        });

        return dmk
          .executeDeviceAction({ sessionId, deviceAction })
          .observable.pipe(map((state) => this.toSignFlowStatus(state)));
      }),
      catchError((error) => of(this.toErrorStatus(error))),
    );
  }

  private toSignFlowStatus(
    state: SignXrpTransactionFlowDAState,
  ): SignFlowStatus {
    switch (state.status) {
      case DeviceActionStatus.Pending:
        return state.intermediateValue.signFlowStatus;

      case DeviceActionStatus.Completed:
        return {
          signType: "transaction",
          status: "success",
          data: {
            xrpSignature: state.output.signature,
            signingPubKey: state.output.signingPubKey,
          },
        };

      case DeviceActionStatus.Error:
        return this.toErrorStatus(state.error);

      default:
        return {
          signType: "transaction",
          status: "debugging",
          message: `Status: ${state.status}`,
        };
    }
  }

  private toErrorStatus(error: unknown): SignFlowStatus {
    this.logger.error("Failed to sign XRP transaction", { error });
    return {
      signType: "transaction",
      status: "error",
      error: normalizeXrpDeviceError(error, this.blockchainConfig.appName),
    };
  }
}
