import {
  type DeviceManagementKit,
  OpenAppWithDependenciesDeviceAction,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import { SignerXrpBuilder } from "@ledgerhq/device-signer-kit-xrp";
import type {
  BlockchainConfig,
  CoreFacade,
  ProviderAccount,
  ProviderLogger,
  SignFlowStatus,
  UserInteractionNeeded,
} from "@ledgerhq/ledger-wallet-provider-core";
import {
  AccountNotSelectedError,
  createOpenAppConfig,
  IncorrectSeedError,
  waitForDeviceSession,
} from "@ledgerhq/ledger-wallet-provider-core";
import { inject, injectable } from "inversify";
import { catchError, Observable, of, switchMap } from "rxjs";

import { xrpProviderModuleTypes } from "../di/xrpProviderModuleTypes";
import type { SignedXrpTransactionResult } from "../model/XrpSignedResult";
import { normalizeXrpDeviceError } from "../utils/normalizeXrpDeviceError";
import {
  type DeviceActionExecution,
  waitForDeviceActionOutput,
} from "../utils/waitForDeviceActionOutput";
import {
  serializeForDevice,
  withSigningFields,
  type XrpTransaction,
} from "../utils/xrpTransaction";
import { getXrpDerivationPath, XRP_FAMILY } from "../utils/xrpUtils";

type DeviceSession = {
  readonly dmk: DeviceManagementKit;
  readonly sessionId: string;
};

/**
 * Signs an XRPL transaction with the Ledger XRP app: opens the app, reads the
 * address and public key, checks the address against the selected account,
 * then signs.
 *
 * It is not a single device action like the Solana one, because the bytes sent
 * to the device contain `SigningPubKey`, which is only known once the address
 * has been read.
 */
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
      switchMap((session) => this.signOnDevice(session, tx, account)),
      catchError((error) => of(this.toErrorStatus(error))),
    );
  }

  private signOnDevice(
    { dmk, sessionId }: DeviceSession,
    tx: XrpTransaction,
    account: ProviderAccount,
  ): Observable<SignFlowStatus> {
    return new Observable<SignFlowStatus>((subscriber) => {
      const derivationPath = getXrpDerivationPath(account);
      const openAppConfig = createOpenAppConfig(this.blockchainConfig);
      const signer = new SignerXrpBuilder({ dmk, sessionId }).build();
      let cancelCurrent: () => void = () => undefined;

      const run = <Output>(
        step: string,
        execution: DeviceActionExecution<Output>,
      ): Promise<Output> => {
        cancelCurrent = execution.cancel;
        return waitForDeviceActionOutput(execution, (interaction) =>
          subscriber.next(this.toPendingStatus(step, interaction)),
        );
      };

      const signFlow = async (): Promise<SignedXrpTransactionResult> => {
        this.core.trackTransactionStarted(XRP_FAMILY);

        await run(
          "open-app",
          dmk.executeDeviceAction({
            sessionId,
            deviceAction: new OpenAppWithDependenciesDeviceAction({
              input: openAppConfig,
              inspect: false,
            }),
          }),
        );

        const { address, publicKey } = await run(
          "get-address",
          signer.getAddress(derivationPath, { skipOpenApp: true }),
        );
        this.assertSameAddress(address, account);

        const unsigned = withSigningFields(tx, address, publicKey);
        const xrpSignature = await run(
          "sign",
          signer.signTransaction(derivationPath, serializeForDevice(unsigned), {
            skipOpenApp: true,
          }),
        );

        return { xrpSignature, signingPubKey: publicKey };
      };

      signFlow()
        .then((data) => {
          subscriber.next({ signType: "transaction", status: "success", data });
          subscriber.complete();
        })
        .catch((error: unknown) => {
          subscriber.next(this.toErrorStatus(error));
          subscriber.complete();
        });

      return () => cancelCurrent();
    });
  }

  private assertSameAddress(address: string, account: ProviderAccount): void {
    // XRP addresses are base58 and case-sensitive: compare exactly.
    if (address !== account.freshAddress) {
      throw new IncorrectSeedError("Address mismatch");
    }
  }

  private toPendingStatus(
    step: string,
    interaction: UserInteractionRequired,
  ): SignFlowStatus {
    if (interaction !== UserInteractionRequired.None) {
      return {
        signType: "transaction",
        status: "user-interaction-needed",
        interaction: interaction as UserInteractionNeeded,
      };
    }
    return {
      signType: "transaction",
      status: "debugging",
      message: `Step: ${step}`,
    };
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
