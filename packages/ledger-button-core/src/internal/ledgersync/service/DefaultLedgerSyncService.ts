import {
  DeviceActionState,
  DeviceActionStatus,
  DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import {
  AuthenticateDAError,
  AuthenticateDAIntermediateValue,
  AuthenticateDAOutput,
  KeyPair,
  LedgerKeyringProtocol,
  LedgerKeyringProtocolBuilder,
  LKRPEnv,
  Permissions,
} from "@ledgerhq/device-trusted-app-kit-ledger-keyring-protocol";
import { AuthenticateUsecaseInput } from "@ledgerhq/device-trusted-app-kit-ledger-keyring-protocol/internal/use-cases/authentication/AuthenticateUseCase.js";
import { type Factory, inject, injectable } from "inversify";
import pako from "pako";
import { Either } from "purify-ts/Either";
import { from, map, Observable, switchMap } from "rxjs";

import { AuthenticateResponse, StorageIDBErrors } from "../../../api/index.js";
import { type AuthContext } from "../../../api/model/AuthContext.js";
import { LedgerSyncAuthenticationError } from "../../../api/model/error/LedgerSyncAuthenticationErrors.js";
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
  private keypair: KeyPair | undefined;
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
    this.logger.info("Ledger Sync Service created");

    const dmk: DeviceManagementKit = this.deviceManagementKitService.dmk;
    this.lkrpAppKit = new LedgerKeyringProtocolBuilder({
      dmk: dmk,
      applicationId: LEDGER_SYNC_APPLICATION_ID,
      env: LKRPEnv.STAGING,
    }).build();
  }

  get authContext() {
    return this._authContext;
  }

  authenticate(): Observable<AuthenticateResponse> {
    this.logger.info("Authenticating with ledger sync");

    return from(this.storageService.getKeyPair()).pipe(
      switchMap(async (keypairResult: Either<StorageIDBErrors, KeyPair>) => {
        if (keypairResult.isLeft()) {
          const keypair = await this.generateKeypairUseCase.execute();
          this.logger.info("New keypair created", {
            keypair: keypair.getPublicKeyToHex(),
          });
          this.storageService.storeKeyPair(keypair);

          return keypair;
        } else if (keypairResult.isRight()) {
          const keypair = keypairResult.extract();
          this.logger.info("Keypair retrieved from storage", {
            keypair: keypair.getPublicKeyToHex(),
          });
          return keypair;
        }
      }),
      switchMap((keypair: KeyPair | undefined) => {
        this.keypair = keypair;
        this.trustChainId = this.storageService.getTrustChainId().extract();
        this.logger.info(`Trustchain ID : ${this.trustChainId}`);
        this.logger.info(
          "Start DeviceAction for authenticate with ledger sync",
        );

        if (!this.trustChainId) {
          this.logger.info("Try to authenticate with a Ledger Device");

          if (!this.deviceManagementKitService.sessionId) {
            throw new Error("No session ID");
          }

          return this.lkrpAppKit.authenticate({
            keypair: keypair,
            clientName: "LedgerButton::app.1inch.io", //TODO use config for generating the client app name
            permissions: Permissions.OWNER,
            trustchainId: undefined,
            sessionId: this.deviceManagementKitService.sessionId,
          } as AuthenticateUsecaseInput).observable;
        } else {
          this.logger.info("Try to authenticate with keypair");

          return this.lkrpAppKit.authenticate({
            keypair: keypair,
            clientName: "LedgerButton::app.1inch.io", //TODO use config for generating the client app name
            permissions: Permissions.OWNER,
            trustchainId: this.trustChainId,
            sessionId: undefined,
          } as AuthenticateUsecaseInput).observable;
        }
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

  async decrypt(encryptedData: Uint8Array): Promise<Uint8Array> {
    if (!this.authContext?.encryptionKey) {
      throw new Error("No encryption key");
    }

    const compressedClearData = await this.lkrpAppKit.decryptData(
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
      //TODO Handle error when members has been removed from the trustchain => Remove the trustchainId from the storage and retry the authentication
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
