import "../../components/index.js";

import { consume } from "@lit/context";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { CoreContext, coreContext } from "../../context/core-context.js";
import {
  langContext,
  LanguageContext,
} from "../../context/language-context.js";
import { Navigation } from "../../shared/navigation.js";
import { Destination, Destinations } from "../../shared/routes.js";
import { tailwindElement } from "../../tailwind-element.js";
import { DeviceSwitchController } from "./device-switch-controller.js";

const styles = css`
  :host {
    animation: intro 250ms ease-in-out;
    transform-origin: left bottom;
  }

  :host(.remove) {
    animation: intro 250ms ease-in-out reverse;
  }

  @keyframes intro {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(32px);
    }

    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
`;

@customElement("device-switch-screen")
@tailwindElement(styles)
export class DeviceSwitchScreen extends LitElement {
  @property({ type: Object })
  navigation!: Navigation;

  @property({ type: Object })
  destinations!: Destinations;

  @property({ type: Object })
  navigateTo!: (destination: Destination) => Promise<void>;

  @consume({ context: coreContext })
  @property({ attribute: false })
  public coreContext!: CoreContext;

  @consume({ context: langContext })
  @property({ attribute: false })
  public languageContext!: LanguageContext;

  controller!: DeviceSwitchController;

  override connectedCallback() {
    super.connectedCallback();

    this.controller = new DeviceSwitchController(
      this.navigation,
      this.destinations,
    );
  }

  handleAddNewDevice = () => {
    this.controller.addNewDevice();
  };

  private renderConnectedDevice() {
    const connectedDevice = this.coreContext.getConnectedDevice();

    if (!connectedDevice) {
      return "";
    }

    const deviceModelId = this.controller.mapDeviceModelId(
      connectedDevice.modelId,
    );
    const lang = this.languageContext.currentTranslation;

    return html`
      <div class="lb-flex lb-flex-col lb-gap-12 lb-p-24 lb-pt-0">
        <ledger-device-item
          title=${connectedDevice.name}
          device-model-id=${deviceModelId}
          status="connected"
          .clickable=${false}
          connected-text=${lang.deviceSwitch.status.connected}
          available-text=${lang.deviceSwitch.status.available}
        ></ledger-device-item>
      </div>
    `;
  }

  private renderSeparator() {
    return html`
      <div class="lb-relative lb-flex lb-items-center lb-gap-8 lb-px-24">
        <div class="lb-h-1 lb-flex-1 lb-bg-muted-pressed"></div>
        <span class="lb-px-4 lb-text-muted lb-body-3"
          >${this.languageContext.currentTranslation.deviceSwitch
            .connectAnother}</span
        >
        <div class="lb-h-1 lb-flex-1 lb-bg-muted-pressed"></div>
      </div>
    `;
  }

  private renderAddNewDeviceSection() {
    const lang = this.languageContext.currentTranslation;

    return html`
      <div class="lb-flex lb-flex-col lb-gap-12 lb-p-24">
        <ledger-connection-item
          title="${lang.deviceSwitch.connectBluetooth}"
          hint="${lang.deviceSwitch.connectBluetoothHint}"
          connection-type="bluetooth"
          @connection-item-click=${this.handleAddNewDevice}
        ></ledger-connection-item>
        <ledger-connection-item
          title="${lang.deviceSwitch.connectUsb}"
          hint="${lang.deviceSwitch.connectUsbHint}"
          connection-type="usb"
          @connection-item-click=${this.handleAddNewDevice}
        ></ledger-connection-item>
      </div>
    `;
  }

  override render() {
    return html`
      <div class="lb-flex lb-flex-col">
        ${this.renderConnectedDevice()} ${this.renderSeparator()}
        ${this.renderAddNewDeviceSection()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "device-switch-screen": DeviceSwitchScreen;
  }
}

export default DeviceSwitchScreen;
