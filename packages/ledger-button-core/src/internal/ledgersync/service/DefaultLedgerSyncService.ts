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
import { from, map, Observable, switchMap } from "rxjs";

import { LedgerSyncAuthenticationError } from "../../../api/model/errors.js";
import {
  type AuthContext,
  type LedgerSyncAuthenticateResponse,
} from "../../../api/model/LedgerSyncAuthenticateResponse.js";
import type {
  UserInteractionNeeded,
  UserInteractionNeededResponse,
} from "../../../api/model/UserInteractionNeeded.js";
import { configModuleTypes } from "../../config/configModuleTypes.js";
import { Config } from "../../config/model/config.js";
import { cryptographicModuleTypes } from "../../cryptographic/cryptographicModuleTypes.js";
import { GetKeyPairUseCase } from "../../cryptographic/usecases/GetKeyPairUseCase.js";
import { deviceModuleTypes } from "../../device/deviceModuleTypes.js";
import type { DeviceManagementKitService } from "../../device/service/DeviceManagementKitService.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { storageModuleTypes } from "../../storage/storageModuleTypes.js";
import type { StorageService } from "../../storage/StorageService.js";
import { LedgerSyncAuthContextMissingError } from "../model/errors.js";
import { InternalAuthContext } from "../model/InternalAuthContext.js";
import { LedgerSyncService } from "./LedgerSyncService.js";

const LEDGER_SYNC_APPLICATION_ID = 16;

@injectable()
export class DefaultLedgerSyncService implements LedgerSyncService {
  private readonly logger: LoggerPublisher;
  private _authContext: InternalAuthContext | undefined;
  lkrpAppKit: LedgerKeyringProtocol;
  private keyPair: KeyPair | undefined;
  private trustChainId: string | undefined;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    private readonly loggerFactory: Factory<LoggerPublisher>,
    @inject(deviceModuleTypes.DeviceManagementKitService)
    private readonly deviceManagementKitService: DeviceManagementKitService,
    @inject(storageModuleTypes.StorageService)
    private readonly storageService: StorageService,
    @inject(cryptographicModuleTypes.GetKeyPairUseCase)
    private readonly getKeyPairUseCase: GetKeyPairUseCase,
    @inject(configModuleTypes.Config)
    private readonly config: Config,
  ) {
    this.logger = this.loggerFactory("[Ledger Sync Service]");

    const dmk: DeviceManagementKit = this.deviceManagementKitService.dmk;
    this.lkrpAppKit = new LedgerKeyringProtocolBuilder({
      dmk: dmk,
      applicationId: LEDGER_SYNC_APPLICATION_ID,
      env:
        this.config.environment === "production"
          ? LKRPEnv.PROD
          : LKRPEnv.STAGING,
    }).build();
  }

  get authContext() {
    return this._authContext;
  }

  authenticate(): Observable<LedgerSyncAuthenticateResponse> {
    this.logger.info("Authenticating with ledger sync");

    return from(this.getKeyPairUseCase.execute()).pipe(
      switchMap((keyPair: KeyPair) => {
        this.logger.info("KeyPair retrieved", {
          keyPair: keyPair.getPublicKeyToHex(),
        });
        this.keyPair = keyPair;
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
            keypair: keyPair,
            clientName: this.getClientName(),
            permissions: Permissions.OWNER & ~Permissions.CAN_ADD_BLOCK,
            trustchainId: undefined,
            sessionId: this.deviceManagementKitService.sessionId,
          } as AuthenticateUsecaseInput).observable;
        } else {
          this.logger.info("Try to authenticate with keyPair");
          return this.lkrpAppKit.authenticate({
            keypair: keyPair,
            clientName: this.getClientName(),
            permissions: Permissions.OWNER & ~Permissions.CAN_ADD_BLOCK,
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
      throw new LedgerSyncAuthContextMissingError("No encryption key");
    }

    const compressedClearData = await this.lkrpAppKit.decryptData(
      this.authContext?.encryptionKey,
      encryptedData,
    );

    return pako.inflate(compressedClearData);
  }

  private getClientName(): string {
    return `LedgerWalletProvider::${this.config.dAppIdentifier}`;
  }

  private mapAuthenticateResponse(
    state: DeviceActionState<
      AuthenticateDAOutput,
      AuthenticateDAError,
      AuthenticateDAIntermediateValue
    >,
  ): LedgerSyncAuthenticateResponse {
    switch (state.status) {
      case DeviceActionStatus.Completed: {
        const newAuthContext = {
          jwt: state.output.jwt,
          trustChainId: state.output.trustchainId,
          encryptionKey: state.output.encryptionKey,
          applicationPath: state.output.applicationPath,
          keyPair: this.keyPair,
        } as unknown as InternalAuthContext;

        this.trustChainId = newAuthContext.trustChainId;
        this.storageService.saveTrustChainId(this.trustChainId);

        this._authContext = newAuthContext;

        return {
          trustChainId: newAuthContext.trustChainId,
          applicationPath: newAuthContext.applicationPath,
        } satisfies AuthContext;
      }

      case DeviceActionStatus.Error:
        this.logger.error(`Error: ${JSON.stringify(state.error)}`);
        return new LedgerSyncAuthenticationError("An unknown error occurred"); //TODO map errors
      //TODO Handle error when members has been removed from the trustchain => Remove the trustchainId from the storage and retry the authentication

      case DeviceActionStatus.Pending:
        return {
          requiredUserInteraction: state.intermediateValue
            ?.requiredUserInteraction as UserInteractionNeeded,
        } satisfies UserInteractionNeededResponse;

      default:
        return new LedgerSyncAuthenticationError("Unknown error");
    }
  }
}
