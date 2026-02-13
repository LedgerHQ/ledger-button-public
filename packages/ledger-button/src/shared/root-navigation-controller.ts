import {
  Account,
  Device,
  SignRawTransactionParams,
  SignTransactionParams,
} from "@ledgerhq/ledger-wallet-provider-core";
import { ReactiveController, ReactiveControllerHost } from "lit";
import { Subscription } from "rxjs";

import type { DeviceModelId } from "../components/atom/icon/device-icon/device-icon.js";
import { CoreContext } from "../context/core-context.js";
import { Translation } from "../context/language-context.js";
import { Navigation } from "./navigation.js";
import {
  Destination,
  Destinations,
  makeDestinations,
  resolveCanGoBack,
} from "./routes.js";

export type RootNavigationUiModel = {
  title: string | undefined;
  canGoBack: boolean;
  canClose: boolean;
  showSettings: boolean;
  deviceModelId: DeviceModelId | undefined;
};

export class RootNavigationController implements ReactiveController {
  navigation: Navigation;
  isModalOpen = false;
  destinations: Destinations;
  pendingTransactionParams?: SignRawTransactionParams | SignTransactionParams;
  params?: unknown;

  private hasTrackingConsent?: boolean;
  private contextSubscription?: Subscription;
  connectedDevice: Device | undefined;

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly core: CoreContext,
    translation: Translation,
    private readonly modalContent: HTMLElement,
  ) {
    this.host.addController(this);
    this.navigation = new Navigation(host, this.modalContent);
    this.destinations = makeDestinations(translation);
    this.pendingTransactionParams = core.getPendingTransactionParams();
  }

  hostConnected() {
    this.computeInitialState();
    this.contextSubscription = this.core
      .observeContext()
      .subscribe((context) => {
        this.hasTrackingConsent = context.hasTrackingConsent;
        this.connectedDevice = context.connectedDevice;
        this.host.requestUpdate();
      });
  }

  hostDisconnected() {
    this.contextSubscription?.unsubscribe();
  }

  get currentScreen() {
    return this.navigation.currentScreen;
  }

  get rootNavigationUiModel(): RootNavigationUiModel {
    const connectedDevice = this.connectedDevice;
    const canGoBack = resolveCanGoBack(
      this.currentScreen?.canGoBack,
      this.core,
    );

    const canClose = this.currentScreen?.toolbar.canClose ?? true;

    const isHomeFlow = this.currentScreen?.name === "home-flow";

    const isOnConsentScreen =
      isHomeFlow && this.hasTrackingConsent === undefined;

    const shouldShowDeviceChip = isHomeFlow && !isOnConsentScreen;

    const title =
      connectedDevice && shouldShowDeviceChip
        ? connectedDevice.name
        : this.currentScreen?.toolbar.title;

    const deviceModelId =
      connectedDevice && shouldShowDeviceChip
        ? connectedDevice.modelId
        : undefined;

    const showSettings = this.currentScreen?.name === "home-flow";

    const uiModel: RootNavigationUiModel = {
      title,
      canGoBack,
      canClose,
      showSettings,
      deviceModelId,
    };

    return uiModel;
  }

  async computeInitialState() {
    const selectedAccount = await this.core.getSelectedAccount();

    if (!selectedAccount) {
      this.navigation.navigateTo(this.destinations.onboardingFlow);
      return;
    } else {
      this.navigation.navigateTo(this.destinations.home);
      return;
    }
  }

  // NOTE: First Draft of navigationIntent
  // Could be moved to a separate file/controller (maybe navigation ?)
  navigationIntent(route: Destination["name"], params: unknown) {
    this.params = params ?? undefined;

    switch (route) {
      case "selectAccount": {
        if (this.core.getSelectedAccount()) {
          this.navigation.navigateTo(this.destinations.home);
          break;
        }

        this.computeInitialState();
        break;
      }

      case "home": {
        if (!this.core.getSelectedAccount()) {
          this.navigation.navigateTo(this.destinations.onboardingFlow);
          break;
        }

        this.navigation.navigateTo(this.destinations.home);
        break;
      }

      case "turnOnSync":
        this.navigation.navigateTo(this.destinations.turnOnSync);
        break;

      case "signTransaction": {
        if (!this.core.getSelectedAccount()) {
          this.navigation.navigateTo(this.destinations.onboardingFlow);
          break;
        }

        this.core.setPendingTransactionParams(params as SignTransactionParams);
        this.navigation.navigateTo(this.destinations.signingFlow);
        break;
      }

      case "deviceSwitch": {
        if (!this.core.getConnectedDevice()) {
          this.navigation.navigateTo(this.destinations.onboardingFlow);
          break;
        }

        this.navigation.navigateTo(this.destinations.deviceSwitch);
        break;
      }
      case "fetchAccounts": {
        if (!this.core.getConnectedDevice()) {
          this.navigation.navigateTo(this.destinations.onboardingFlow);
          break;
        }

        this.navigation.navigateTo(this.destinations.fetchAccounts);
        break;
      }
      case "deviceConnectionStatus": {
        if (!this.core.getConnectedDevice()) {
          this.navigation.navigateTo(this.destinations.onboardingFlow);
          break;
        }

        this.navigation.navigateTo(this.destinations.deviceConnectionStatus);
        break;
      }
      case "ledgerSync": {
        if (!this.core.getConnectedDevice()) {
          this.navigation.navigateTo(this.destinations.onboardingFlow);
          break;
        }

        this.navigation.navigateTo(this.destinations.ledgerSync);
        break;
      }

      case "onboarding":
        this.navigation.navigateTo(this.destinations.onboardingFlow);
        break;

      case "settings":
        this.navigation.navigateTo(this.destinations.settings);
        break;

      case "notFound":
      default:
        this.navigation.navigateTo(this.destinations.notFound);
        break;
    }
  }

  async handleModalOpen() {
    if (!this.currentScreen) {
      await this.computeInitialState();
      return;
    }

    this.navigation.navigateTo(this.currentScreen);
  }

  async handleModalClose() {
    this.navigation.resetNavigation();
  }

  async handleChipClick() {
    this.navigation.navigateTo(this.destinations.deviceSwitch);
  }

  navigateToSettings() {
    this.navigation.navigateTo(this.destinations.settings);
  }

  selectAccount(account: Account) {
    this.core.selectAccount(account);
    this.host.requestUpdate();
  }

  navigateBack() {
    this.navigation.navigateBack();
  }

  get selectedAccount() {
    return this.core.getSelectedAccount();
  }
}
