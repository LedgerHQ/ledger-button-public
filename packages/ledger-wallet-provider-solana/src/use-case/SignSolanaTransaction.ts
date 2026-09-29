import {
  type DeviceActionState,
  DeviceActionStatus,
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
  AccountNotSelectedError,
  SignTransactionError,
} from "@ledgerhq/ledger-wallet-provider-core";
import {
  createOpenAppConfig,
  mapOpenAppDeviceActionError,
  waitForDeviceSession,
} from "@ledgerhq/ledger-wallet-provider-core";
import { inject, injectable } from "inversify";
import { catchError, map, type Observable, of, switchMap } from "rxjs";

import {
  buildGetLatestBlockhashRequest,
  extractLatestBlockhash,
} from "../datasource/rpc/solanaBroadcastUtils";
import { SignSolanaTransactionFlowDeviceAction } from "../device-action/SignSolanaTransactionFlowDeviceAction";
import type {
  SignSolanaTransactionFlowDAError,
  SignSolanaTransactionFlowDAIntermediateValue,
  SignSolanaTransactionFlowDAOutput,
} from "../device-action/SignSolanaTransactionFlowDeviceActionTypes";
import { solanaProviderModuleTypes } from "../di/solanaProviderModuleTypes";
import type { SignSolanaTransactionParams } from "../model/SignSolanaTransactionParams";
import {
  getBackendChainIdFromCurrencyId,
  SOLANA_FAMILY,
} from "../utils/clusterUtils";
import { getSolanaDerivationPath } from "../utils/derivationUtils";
import {
  getSolanaMessageBytes,
  getSolanaTransactionRecipient,
} from "../utils/transactionUtils";
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

    if (getSolanaTransactionRecipient(transaction).isNothing()) {
      return this.toErrorStatus(
        new SignTransactionError("Transaction has no recipient"),
        signType,
      );
    }

    return waitForDeviceSession(this.core).pipe(
      switchMap((session) => {
        const sessionId = session.sessionId;
        const dmk = session.dmk;

        const derivationPath = getSolanaDerivationPath(selectedAccount);
        const contextModule = this.buildContextModule.execute();
        const openAppConfig = createOpenAppConfig(this.blockchainConfig);

        // Wallet Standard delivers a full wire transaction, but the Ledger
        // Solana app signs the compiled message only. Strip the signature
        // envelope so the device does not reject the request with `6a80`.
        const messageBytes = getSolanaMessageBytes(transaction);
        // The signer-kit decides whether a refresh is safe. It skips
        // co-signed transactions and durable-nonce lifetimes itself.
        let refreshedBlockhash: Uint8Array | undefined;
        const fetchBlockhash = async (): Promise<Uint8Array> => {
          const hash = await this.fetchLatestBlockhash(selectedAccount);
          refreshedBlockhash = hash;
          return hash;
        };

        this.logger.debug("Prepared Solana message bytes", {
          address: params.address,
          messageByteLength: messageBytes.byteLength,
          derivationPath,
        });
        this.logger.debug("Starting Solana transaction device action", {
          appName: openAppConfig.application.name,
          dependencyCount: openAppConfig.dependencies.length,
        });

        this.core.trackTransactionStarted(SOLANA_FAMILY);

        const deviceAction = new SignSolanaTransactionFlowDeviceAction({
          input: {
            signType,
            derivationPath,
            transaction: messageBytes,
            expectedAddress: selectedAccount.freshAddress,
            openAppInput: openAppConfig,
            contextModule,
            delayed: true,
            fetchBlockhash,
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
              () => refreshedBlockhash,
            ),
          ),
        ) as Observable<SignFlowStatus>;
      }),
      catchError((error) => this.toErrorStatus(error, signType)),
    );
  }

  private async fetchLatestBlockhash(
    selectedAccount: ProviderAccount,
  ): Promise<Uint8Array> {
    const chainId = getBackendChainIdFromCurrencyId(selectedAccount.currencyId);
    if (!chainId) {
      throw new Error(
        `Solana getLatestBlockhash failed: no chain id for ${selectedAccount.currencyId}`,
      );
    }

    const response = await this.core.broadcastRPC(
      buildGetLatestBlockhashRequest(0),
      { name: "solana", chainId },
    );
    const hash = extractLatestBlockhash(response);
    if (!hash) {
      throw new Error("Solana getLatestBlockhash failed: unexpected response");
    }
    return hash;
  }

  private toErrorStatus(
    error: unknown,
    signType: SignType,
  ): Observable<SignFlowStatus> {
    this.logger.error("Failed to sign Solana transaction", { error });
    return of({ signType, status: "error" as const, error });
  }

  private toSignFlowStatus(
    state: DeviceActionState<
      SignSolanaTransactionFlowDAOutput,
      SignSolanaTransactionFlowDAError,
      SignSolanaTransactionFlowDAIntermediateValue
    >,
    signType: SignType,
    appName: string,
    getRefreshedBlockhash: () => Uint8Array | undefined,
  ): SignFlowStatus {
    switch (state.status) {
      case DeviceActionStatus.Pending:
        return state.intermediateValue.signFlowStatus;

      case DeviceActionStatus.Completed: {
        const refreshedBlockhash = getRefreshedBlockhash();
        this.logger.debug("Solana transaction signing completed", {
          signatureByteLength: state.output.signature.byteLength,
          refreshedBlockhash: refreshedBlockhash !== undefined,
        });
        return {
          signType,
          status: "success",
          data: {
            solanaSignature: state.output.signature,
            ...(refreshedBlockhash ? { refreshedBlockhash } : {}),
          },
        };
      }

      case DeviceActionStatus.Error: {
        // The device-action error path emits an error status value rather than
        // throwing, so `catchError` never sees it. Log the raw error here so the
        // real cause is visible instead of only the generic UI sign message.
        this.logger.error("Solana transaction signing device action failed", {
          error: state.error,
        });
        const error = mapOpenAppDeviceActionError(state.error, appName);
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
