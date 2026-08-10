import {
  DeviceConnectionError,
  DeviceDisconnectedError,
  DeviceNotOnboardedError,
  DeviceNotSupportedError,
} from "@ledgerhq/ledger-wallet-provider-core";
import { type ReactiveController, type ReactiveControllerHost } from "lit";

import { type StatusType } from "../../../components/organism/status/ledger-status.js";
import { type CoreContext } from "../../../context/core-context.js";
import { type LanguageContext } from "../../../context/language-context.js";
import { LEDGER_WALLET_DEVICE_SETUP_DEEPLINK } from "../../../shared/constants/deeplinks.js";
import {
  getLedgerNanoSUpgradeUrl,
  getReferralShopUrl,
} from "../../../shared/constants/shop-urls.js";
import { formatDeviceModelName } from "../../../utils/format-device-name.js";

export class SelectDeviceController implements ReactiveController {
  errorData?: {
    message: string;
    title: string;
    statusType?: StatusType;
    cta1?: { label: string; action: () => void | Promise<void> };
    cta2?: { label: string; action: () => void | Promise<void> };
  } = undefined;

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
    private readonly lang: LanguageContext,
  ) {
    this.host.addController(this);
  }

  hostConnected() {
    this.host.requestUpdate();
  }

  async clickAdItem() {
    await this.core
      .getReferralUrl()
      .then((url) =>
        window.open(
          getReferralShopUrl(url, this.lang.currentLanguage),
          "_blank",
          "noopener,noreferrer",
        ),
      )
      .catch((error) =>
        console.error("Failed to get a valid referral url", error),
      );
  }

  private mapErrors(error: unknown) {
    const lang = this.lang.currentTranslation;

    switch (true) {
      case error instanceof DeviceNotSupportedError: {
        const deviceName = formatDeviceModelName(lang, error.context?.modelId);

        const title = lang.error.device.DeviceNotSupported.title.replace(
          "{device}",
          deviceName,
        );
        const description =
          lang.error.device.DeviceNotSupported.description.replace(
            "{device}",
            deviceName,
          );

        this.errorData = {
          title,
          message: description,
          cta1: {
            label: lang.error.device.DeviceNotSupported.cta1,
            action: () => {
              this.errorData = undefined;
              this.host.requestUpdate();
            },
          },
          cta2: {
            label: lang.error.device.DeviceNotSupported.cta2,
            action: () => {
              window.open(
                getLedgerNanoSUpgradeUrl(this.lang.currentLanguage),
                "_blank",
                "noopener,noreferrer",
              );
            },
          },
        };
        break;
      }
      case error instanceof DeviceNotOnboardedError: {
        const deviceName = formatDeviceModelName(lang, error.context?.modelId);
        const description =
          lang.error.device.DeviceNotOnboarded.description.replace(
            "{device}",
            deviceName,
          );

        this.errorData = {
          title: lang.error.device.DeviceNotOnboarded.title,
          message: description,
          statusType: "info",
          cta1: {
            label: lang.error.device.DeviceNotOnboarded.cta1,
            action: () => {
              window.open(
                LEDGER_WALLET_DEVICE_SETUP_DEEPLINK,
                "_blank",
                "noopener,noreferrer",
              );
            },
          },
          cta2: {
            label: lang.error.device.DeviceNotOnboarded.cta2,
            action: () => {
              this.errorData = undefined;
              this.host.requestUpdate();
            },
          },
        };
        break;
      }
      case error instanceof DeviceDisconnectedError: {
        const description =
          lang.error.connection.DeviceDisconnected.description;

        this.errorData = {
          title: lang.error.connection.DeviceDisconnected.title,
          message: description,
          cta1: {
            label: lang.error.connection.DeviceDisconnected.cta1,
            action: () => {
              this.errorData = undefined;
              this.host.requestUpdate();
            },
          },
        };
        break;
      }
      case error instanceof DeviceConnectionError:
        if (
          error.context?.type === "no-accessible-device" ||
          error.context?.type === "failed-to-start-discovery"
        ) {
          this.errorData = undefined;
          break;
        }

        break;
      default:
        // TODO: handle other errors
        break;
    }

    this.host.requestUpdate();
  }

  async connectToDevice(detail: {
    title: string;
    connectionType: "bluetooth" | "usb" | "";
    timestamp: number;
  }) {
    if (detail.connectionType === "") {
      console.error("No connection type selected");
      return;
    }

    try {
      await this.core.connectToDevice(detail.connectionType);
    } catch (error) {
      console.error("Failed to connect to device", error);
      this.mapErrors(error);
    }
  }
}
