import "@ledgerhq/ledger-button-ui";

import { DeviceItemClickEventDetail } from "@ledgerhq/ledger-button-ui";
import { consume } from "@lit/context";
import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";

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

  @state()
  private isLoading = true;

  controller!: DeviceSwitchController;

  override connectedCallback() {
    super.connectedCallback();

    this.controller = new DeviceSwitchController(
      this,
      this.coreContext,
      this.navigation,
      this.destinations,
    );

    this.controller.hostConnected().finally(() => {
      this.isLoading = false;
      this.requestUpdate();
    });
  }

  handleDeviceItemClick = (e: CustomEvent<DeviceItemClickEventDetail>) => {
    this.controller.connectToDevice({
      title: e.detail.title,
      connectionType: e.detail.connectionType,
      timestamp: e.detail.timestamp,
    });
  };

  handleAddNewDevice = () => {
    this.controller.addNewDevice();
  };

  private renderDeviceList() {
    const devices = this.controller?.getDevices() || [];

    if (this.isLoading) {
      return html`
        <div class="flex items-center justify-center p-24">
          <div
            class="border-primary h-32 w-32 animate-spin rounded-full border-b-2"
          ></div>
        </div>
      `;
    }

    if (devices.length === 0) {
      return html`
        <div class="flex flex-col items-center gap-16 p-24 text-center">
          <div class="text-muted body-2">
            ${this.languageContext.currentTranslation.deviceSwitch.noDevices}
          </div>
        </div>
      `;
    }

    return html`
      <div class="flex flex-col gap-12 p-24 pt-0">
        ${devices.map((device) => {
          const connectionType = this.controller.getConnectionTypeFromTransport(
            device.transport,
          );
          const connectedDevice = this.coreContext.getConnectedDevice();
          const isConnected =
            connectedDevice && connectedDevice.name === device.name;
          const status = isConnected ? "connected" : "available";
          const deviceModelId = this.controller.mapDeviceModelId(
            device.deviceModel?.model,
          );

          const lang = this.languageContext.currentTranslation;

          return html`
            <ledger-device-item
              device-id=${device.id}
              title=${device.name}
              connection-type=${connectionType}
              device-model-id=${deviceModelId}
              status=${status}
              connected-text=${lang.deviceSwitch.status.connected}
              available-text=${lang.deviceSwitch.status.available}
              @device-item-click=${this.handleDeviceItemClick}
            ></ledger-device-item>
          `;
        })}
      </div>
    `;
  }

  private renderSeparator() {
    return html`
      <div class="relative flex items-center gap-8 px-24">
        <div class="h-1 flex-1 bg-muted-pressed"></div>
        <span class="px-4 text-muted body-3"
          >${this.languageContext.currentTranslation.deviceSwitch
            .connectAnother}</span
        >
        <div class="h-1 flex-1 bg-muted-pressed"></div>
      </div>
    `;
  }

  private renderAddNewDeviceSection() {
    return html`
      <div class="flex flex-col gap-12 p-24">
        <ledger-connection-item
          title="${this.languageContext.currentTranslation.deviceSwitch
            .connectBluetooth}"
          connection-type="bluetooth"
          @connection-item-click=${this.handleAddNewDevice}
        ></ledger-connection-item>
        <ledger-connection-item
          title="${this.languageContext.currentTranslation.deviceSwitch
            .connectUsb}"
          connection-type="usb"
          @connection-item-click=${this.handleAddNewDevice}
        ></ledger-connection-item>
      </div>
    `;
  }

  override render() {
    return html`
      <div class="flex flex-col">
        ${this.renderDeviceList()} ${this.renderSeparator()}
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
