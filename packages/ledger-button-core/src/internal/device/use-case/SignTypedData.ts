import {
  type OpenAppWithDependenciesDAState,
  OpenAppWithDependenciesDeviceAction,
} from "@ledgerhq/device-management-kit";
import {
  SignerEthBuilder,
  type SignTypedDataDAState,
} from "@ledgerhq/device-signer-kit-ethereum";
import { type Factory, inject, injectable } from "inversify";
import { concat, map, Observable, of } from "rxjs";

import type { SignFlowStatus } from "../../../api/model/signing/SignFlowStatus.js";
import type { SignTypedMessageParams } from "../../../api/model/signing/SignTypedMessageParams.js";
import { accountModuleTypes } from "../../account/accountModuleTypes.js";
import type { AccountService } from "../../account/service/AccountService.js";
import { configModuleTypes } from "../../config/configModuleTypes.js";
import { Config } from "../../config/model/config.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { deviceModuleTypes } from "../deviceModuleTypes.js";
import { SignTransactionError } from "../model/errors.js";
import type { DeviceManagementKitService } from "../service/DeviceManagementKitService.js";

@injectable()
export class SignTypedData {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(deviceModuleTypes.DeviceManagementKitService)
    private readonly deviceManagementKitService: DeviceManagementKitService,
    @inject(accountModuleTypes.AccountService)
    private readonly accountService: AccountService,
    @inject(configModuleTypes.Config)
    private readonly config: Config,
  ) {
    this.logger = loggerFactory("[SignTypedData]");
  }

  execute(params: SignTypedMessageParams): Observable<SignFlowStatus> {
    this.logger.info("Starting typed data signing", { params });

    const sessionId = this.deviceManagementKitService.sessionId;
    if (!sessionId) {
      this.logger.error("No device connected");
      throw new Error("No device connected. Please connect a device first.");
    }

    const device = this.deviceManagementKitService.connectedDevice;
    if (!device) {
      this.logger.error("No connected device found");
      throw new Error("No connected device found");
    }

    const { typedData } = params;

    try {
      const dmk = this.deviceManagementKitService.dmk;
      const ethSigner = new SignerEthBuilder({
        dmk,
        originToken: this.config.originToken,
        sessionId,
      }).build();

      const account = this.accountService.getSelectedAccount();
      if (!account) {
        throw Error("No account selected");
      }

      const openObservable: Observable<OpenAppWithDependenciesDAState> =
        dmk.executeDeviceAction({
          sessionId: sessionId,
          deviceAction: new OpenAppWithDependenciesDeviceAction({
            input: {
              application: {
                name: "Ethereum",
              },
              dependencies: [],
              requireLatestFirmware: false,
            },
            inspect: false,
          }),
        }).observable;

      //TODO check account with derivation path and throw error if not matching
      const derivationPath = account.derivationMode;

      const { observable: signObservable } = ethSigner.signTypedData(
        derivationPath,
        typedData,
      );

      return concat(openObservable, signObservable).pipe(
        map((result: OpenAppWithDependenciesDAState | SignTypedDataDAState) => {
          //TODO handle mapping
          return {
            signType: "typed-message",
            status: "debugging",
            message: `DA status: ${result.status} - ${JSON.stringify(result)}`,
          };
        }),
      );
      /*
      if (result.status === "error" || result.status !== "completed") {
        throw Error("Typed data signing failed");
      }

      return result.output;*/
    } catch (error) {
      this.logger.error("Failed to sign typed data", { error });
      return of({
        signType: "typed-message",
        status: "error",
        error: new SignTransactionError(`Typed data signing failed: ${error}`),
      });
    }
  }
}
