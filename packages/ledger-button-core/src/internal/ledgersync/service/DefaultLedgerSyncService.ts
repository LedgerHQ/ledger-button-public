import {
  DeviceActionState,
  DeviceActionStatus,
  DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import {
  AuthenticateDAError,
  AuthenticateDAIntermediateValue,
  AuthenticateDAOutput,
  Keypair,
  LedgerKeyringProtocol,
  LedgerKeyringProtocolBuilder,
  LKRPEnv,
  Permissions,
} from "@ledgerhq/device-trusted-app-kit-ledger-keyring-protocol";
import { type Factory, inject, injectable } from "inversify";
import pako from "pako";
import { Either } from "purify-ts/Either";
import { from, map, Observable, switchMap } from "rxjs";

import { AuthenticateResponse, StorageIDBErrors } from "../../../api/index.js";
import { type AuthContext } from "../../../api/model/AuthContext.js";
import { LedgerSyncAuthenticationError } from "../../../api/model/AuthenticationErrors.js";
import { type UserInteractionNeeded } from "../../../api/model/UserInteractionNeeded.js";
import { cryptographicModuleTypes } from "../../cryptographic/cryptographicModuleTypes.js";
import { GenerateKeypairUseCase } from "../../cryptographic/usecases/GenerateKeypairUseCase.js";
import { deviceModuleTypes } from "../../device/deviceModuleTypes.js";
import type { DeviceManagementKitService } from "../../device/service/DeviceManagementKitService.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { storageModuleTypes } from "../../storage/storageModuleTypes.js";
import type { StorageService } from "../../storage/StorageService.js";
import { InternalAuthContext } from "../model/InternalAuthContext.js";
import { LedgerSyncService } from "./LedgerSyncService.js";

const LEDGER_SYNC_APPLICATION_ID = 16;

@injectable()
export class DefaultLedgerSyncService implements LedgerSyncService {
  private readonly logger: LoggerPublisher;
  private _authContext: InternalAuthContext | undefined;
  lkrpAppKit: LedgerKeyringProtocol;
  private keypair: Keypair | undefined;
  private trustChainId: string | undefined;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    private readonly loggerFactory: Factory<LoggerPublisher>,
    @inject(deviceModuleTypes.DeviceManagementKitService)
    private readonly deviceManagementKitService: DeviceManagementKitService,
    @inject(storageModuleTypes.StorageService)
    private readonly storageService: StorageService,
    @inject(cryptographicModuleTypes.GenerateKeypairUseCase)
    private readonly generateKeypairUseCase: GenerateKeypairUseCase,
  ) {
    this.logger = this.loggerFactory("[Ledger Sync Service]");
    this.logger.info("Ledger Sync Service created 2");

    const dmk: DeviceManagementKit = this.deviceManagementKitService.dmk;
    this.lkrpAppKit = new LedgerKeyringProtocolBuilder({
      dmk: dmk,
      sessionId: this.deviceManagementKitService.sessionId ?? "",
      applicationId: LEDGER_SYNC_APPLICATION_ID,
      env: LKRPEnv.STAGING,
    }).build();
  }

  get authContext() {
    return this._authContext;
  }

  authenticate(): Observable<AuthenticateResponse> {
    this.logger.info("Authenticating with ledger sync");

    if (!this.deviceManagementKitService.sessionId) {
      throw new Error("No session ID");
    }

    return from(this.storageService.getKeyPair()).pipe(
      switchMap((keypairResult: Either<StorageIDBErrors, Keypair>) => {
        const keypair = keypairResult.caseOf({
          Left: () => {
            this.logger.info(
              "Cannot retrieve keypair from storage, generating new one",
            );
            const keypair = this.generateKeypairUseCase.execute();
            this.logger.info("New keypair created", {
              keypair: keypair.pubKeyToHex(),
            });
            this.storageService.storeKeyPair(keypair);
            return keypair;
          },
          Right: (keypair: Keypair) => {
            this.logger.info("New keypair retrieved from storage", {
              keypair,
            });
            return keypair;
          },
        });

        this.keypair = keypair;

        this.trustChainId = this.storageService.getTrustChainId().extract();

        this.logger.info(
          `Trustchain ID ${this.trustChainId ?? "No trustchain ID"}`,
        );

        this.logger.info(
          "Start DeviceAction for authenticate with ledger sync",
        );

        return this.lkrpAppKit.authenticate(
          keypair,
          "LedgerButton::app.1inch.io", //TODO use config for generating the client app name
          Permissions.OWNER,
          this.trustChainId,
        ).observable;
      }),
      map(
        (
          response: DeviceActionState<
            AuthenticateDAOutput,
            AuthenticateDAError,
            AuthenticateDAIntermediateValue
          >,
        ) => {
          return this.mapAuthenticateResponse(response);
        },
      ),
    );
  }

  decrypt(encryptedData: Uint8Array): Uint8Array {
    if (!this.authContext?.encryptionKey) {
      throw new Error("No encryption key");
    }

    const compressedClearData = this.lkrpAppKit.decryptData(
      this.authContext?.encryptionKey,
      encryptedData,
    );

    return pako.inflate(compressedClearData);
  }

  private mapAuthenticateResponse(
    state: DeviceActionState<
      AuthenticateDAOutput,
      AuthenticateDAError,
      AuthenticateDAIntermediateValue
    >,
  ): AuthenticateResponse {
    switch (state.status) {
      case DeviceActionStatus.Completed: {
        const newAuthContext = {
          jwt: state.output.jwt,
          trustChainId: state.output.trustchainId,
          encryptionKey: state.output.encryptionKey,
          applicationPath: state.output.applicationPath,
          keypair: this.keypair,
        } as unknown as InternalAuthContext;

        this.trustChainId = newAuthContext.trustChainId;
        this.storageService.saveTrustChainId(this.trustChainId);

        this._authContext = newAuthContext;

        return {
          trustChainId: newAuthContext.trustChainId,
          applicationPath: newAuthContext.applicationPath,
        } as AuthContext;
      }
      case DeviceActionStatus.Error:
        this.logger.error(`Error: ${JSON.stringify(state.error)}`);
        return new LedgerSyncAuthenticationError("An unknown error occurred"); //TODO map errors
      case DeviceActionStatus.Pending:
        return {
          requiredUserInteraction:
            state.intermediateValue?.requiredUserInteraction,
        } as unknown as UserInteractionNeeded;
      default:
        return new LedgerSyncAuthenticationError("Unknown error");
    }
  }
}
