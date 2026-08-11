import { DeviceStatus } from "@ledgerhq/device-management-kit";
import { Container, Factory } from "inversify";
import { Maybe } from "purify-ts";
import { Observable, Subscription, tap } from "rxjs";

import type {
  BlockchainFamily,
  WalletNavigationIntent,
} from "./blockchain-provider/model/types.js";
import type {
  Account,
  AccountWithFiat,
  DetailedAccount,
} from "./model/Account.js";
import {
  ButtonCoreContext,
  DEFAULT_BLOCKCHAIN_FAMILY,
  getActiveFamily,
  getActiveSelectedAccount,
  getConnectedFamilies,
  getSelectedAccount,
} from "./model/ButtonCoreContext.js";
import {
  AuthContext,
  LedgerSyncAuthenticateResponse,
} from "./model/LedgerSyncAuthenticateResponse.js";
import { accountModuleTypes } from "../internal/account/di/accountModuleTypes.js";
import type { AccountService } from "../internal/account/service/AccountService.js";
import { FetchAccountsUseCase } from "../internal/account/use-case/fetchAccountsUseCase.js";
import type { FetchSelectedAccountUseCase } from "../internal/account/use-case/fetchSelectedAccountUseCase.js";
import { ObserveAccountsWithFiatUseCase } from "../internal/account/use-case/observeAccountsWithFiatUseCase.js";
import { type WalletActionType } from "../internal/backend/model/trackEvent.js";
import type { JSONRPCRequest } from "../internal/backend/types.js";
import type { CalDataSource } from "../internal/balance/datasource/cal/CalDataSource.js";
import { balanceModuleTypes } from "../internal/balance/di/balanceModuleTypes.js";
import { blockchainProviderModuleTypes } from "../internal/blockchain-provider/di/blockchainProviderModuleTypes.js";
import type { BlockchainProviderManager } from "../internal/blockchain-provider/service/BlockchainProviderManager.js";
import { CoreFacadeService } from "../internal/blockchain-provider/service/CoreFacadeService.js";
import { configModuleTypes } from "../internal/config/di/configModuleTypes.js";
import { Config } from "../internal/config/model/config.js";
import { consentModuleTypes } from "../internal/consent/di/consentModuleTypes.js";
import { type ConsentService } from "../internal/consent/service/ConsentService.js";
import { ContextService } from "../internal/context/ContextService.js";
import { contextModuleTypes } from "../internal/context/di/contextModuleTypes.js";
import { DEFAULT_FIAT_CURRENCY } from "../internal/currency/constant.js";
import type { FiatCurrency } from "../internal/currency/datasource/fiatCurrencyTypes.js";
import { currencyModuleTypes } from "../internal/currency/di/currencyModuleTypes.js";
import type { CurrencyService } from "../internal/currency/service/CurrencyService.js";
import { dAppConfigModuleTypes } from "../internal/dAppConfig/di/dAppConfigModuleTypes.js";
import { type GetDAppConfigUseCase } from "../internal/dAppConfig/use-case/GetDAppConfigUseCase.js";
import { deviceModuleTypes } from "../internal/device/di/deviceModuleTypes.js";
import {
  type ConnectionType,
  type DeviceManagementKitService,
} from "../internal/device/service/DeviceManagementKitService.js";
import { ConnectDevice } from "../internal/device/use-case/ConnectDevice.js";
import { DisconnectDevice } from "../internal/device/use-case/DisconnectDevice.js";
import { ListAvailableDevices } from "../internal/device/use-case/ListAvailableDevices.js";
import { SwitchDevice } from "../internal/device/use-case/SwitchDevice.js";
import { createContainer } from "../internal/di.js";
import { type ContainerOptions } from "../internal/diTypes.js";
import { eventTrackingModuleTypes } from "../internal/event-tracking/di/eventTrackingModuleTypes.js";
import { TrackCurrencyChanged } from "../internal/event-tracking/use-case/TrackCurrencyChanged.js";
import { TrackFloatingButtonClick } from "../internal/event-tracking/use-case/TrackFloatingButtonClick.js";
import { TrackLanguageChanged } from "../internal/event-tracking/use-case/TrackLanguageChanged.js";
import { TrackLedgerSyncActivated } from "../internal/event-tracking/use-case/TrackLedgerSyncActivated.js";
import { TrackLedgerSyncOpened } from "../internal/event-tracking/use-case/TrackLedgerSyncOpened.js";
import { TrackMobileRedirectLedgerWallet } from "../internal/event-tracking/use-case/TrackMobileRedirectLedgerWallet.js";
import { TrackOnboarding } from "../internal/event-tracking/use-case/TrackOnboarding.js";
import {
  TrackViewAllTransactions,
  type TrackViewAllTransactionsParams,
} from "../internal/event-tracking/use-case/TrackViewAllTransactions.js";
import { TrackViewTransactionDetailsClick } from "../internal/event-tracking/use-case/TrackViewTransactionDetailsClick.js";
import { TrackWalletAction } from "../internal/event-tracking/use-case/TrackWalletAction.js";
import { ledgerSyncModuleTypes } from "../internal/ledgersync/di/ledgerSyncModuleTypes.js";
import { LedgerSyncService } from "../internal/ledgersync/service/LedgerSyncService.js";
import { loggerModuleTypes } from "../internal/logger/di/loggerModuleTypes.js";
import { LOG_LEVELS } from "../internal/logger/model/constant.js";
import { LoggerPublisher } from "../internal/logger/service/LoggerPublisher.js";
import { modalModuleTypes } from "../internal/modal/di/modalModuleTypes.js";
import { ModalService } from "../internal/modal/service/ModalService.js";
import { navigationModuleTypes } from "../internal/navigation/di/navigationModuleTypes.js";
import { NavigationIntentService } from "../internal/navigation/service/NavigationIntentService.js";
import { type PendingTransactionController } from "../internal/pending-transaction/controller/PendingTransactionController.js";
import { pendingTransactionModuleTypes } from "../internal/pending-transaction/di/pendingTransactionModuleTypes.js";
import { type BroadcastTracking } from "../internal/pending-transaction/model/BroadcastTracking.js";
import { type PendingTransaction } from "../internal/pending-transaction/model/PendingTransaction.js";
import { platformModuleTypes } from "../internal/platform/di/platformModuleTypes.js";
import { IsMobileUseCase } from "../internal/platform/use-case/IsMobileUseCase.js";
import { IsSupportedPlatformUseCase } from "../internal/platform/use-case/IsSupportedPlatformUseCase.js";
import { storageModuleTypes } from "../internal/storage/di/storageModuleTypes.js";
import type { FeatureFlags } from "../internal/storage/model/FeatureFlags.js";
import { type StorageService } from "../internal/storage/StorageService.js";
import { MigrateDbUseCase } from "../internal/storage/use-case/MigrateDbUseCase.js";

export type LedgerButtonCoreOptions = ContainerOptions;
export class LedgerButtonCore {
  private container!: Container;
  private readonly _logger: LoggerPublisher;
  // @ts-expect-error making sure ModalService is created, not used
  private readonly _modalService: ModalService;

  private get _contextService(): ContextService {
    return this.container.get<ContextService>(
      contextModuleTypes.ContextService,
    );
  }

  private get _navigationIntentService(): NavigationIntentService {
    return this.container.get<NavigationIntentService>(
      navigationModuleTypes.NavigationIntentService,
    );
  }

  // Subscription to device connection state in order to handle device disconnection
  private deviceConnectionSubscription?: Subscription;

  constructor(private readonly opts: LedgerButtonCoreOptions) {
    this.container = createContainer(this.opts);
    const loggerFactory = this.container.get<Factory<LoggerPublisher>>(
      loggerModuleTypes.LoggerPublisher,
    );
    this._logger = loggerFactory("Ledger Button Core");

    this._modalService = this.container.get<ModalService>(
      modalModuleTypes.ModalService,
    );

    this.initializeContext();
  }

  private async initializeContext() {
    this._logger.debug("Initializing context");
    console.log("Initializing context");

    const dappConfig = await this.container
      .get<GetDAppConfigUseCase>(dAppConfigModuleTypes.GetDAppConfigUseCase)
      .execute();

    console.log("dappConfigv2", dappConfig);

    //TODO throw error if dApp config is not found ?
    // Migrate database to latest version
    await this.container
      .get<MigrateDbUseCase>(storageModuleTypes.MigrateDbUseCase)
      .execute();

    const coreFacade = this.container.get<CoreFacadeService>(
      blockchainProviderModuleTypes.CoreFacadeService,
    );

    // Disconnect is owned by core; expose it to the facade so a provider
    // (e.g. EIP-1193 `disconnect`) can drop its family through the port.
    coreFacade.setDisconnectHandler((family) => this.disconnect(family));

    const blockchainProviderManager =
      this.container.get<BlockchainProviderManager>(
        blockchainProviderModuleTypes.BlockchainProviderManager,
      );
    blockchainProviderManager.init(coreFacade, dappConfig);

    // Restore selected accounts (one per blockchain family) from storage
    const selectedAccounts = this.container
      .get<StorageService>(storageModuleTypes.StorageService)
      .getSelectedAccounts();

    // Restore trust chain id from storage
    const trustChainId = this.container
      .get<StorageService>(storageModuleTypes.StorageService)
      .getTrustChainId()
      .extract();

    const isTrustChainValid = this.container
      .get<StorageService>(storageModuleTypes.StorageService)
      .isTrustChainValid();

    if (trustChainId && !isTrustChainValid) {
      this._logger.debug("Logging out, trust chain is expired");
      await this.disconnect();
    }

    const restoredAccounts = isTrustChainValid
      ? selectedAccounts
      : new Map<BlockchainFamily, Account>();

    // chainId tracks the default (ethereum) selection.
    const defaultAccount = restoredAccounts.get(DEFAULT_BLOCKCHAIN_FAMILY);
    const chainId = defaultAccount
      ? blockchainProviderManager
          .resolveNetwork(defaultAccount.currencyId)
          .chain((network) => {
            const parsed = Number(network.networkId);
            return Number.isFinite(parsed)
              ? Maybe.of(parsed)
              : Maybe.empty();
          })
          .orDefault(1)
      : 1;

    const welcomeScreenCompleted = await this.container
      .get<StorageService>(storageModuleTypes.StorageService)
      .isWelcomeScreenCompleted();

    const userConsent = await this.container
      .get<StorageService>(storageModuleTypes.StorageService)
      .getUserConsent();

    const hasTrackingConsent = userConsent.isJust()
      ? userConsent.extract().consentGiven
      : undefined;

    const hasDeveloperMode = this.container
      .get<StorageService>(storageModuleTypes.StorageService)
      .hasDeveloperMode();

    const isMobilePlatform = this.container
      .get<IsMobileUseCase>(platformModuleTypes.IsMobileUseCase)
      .execute();

    const preferredFiatCurrency = await this.container
      .get<CurrencyService>(currencyModuleTypes.CurrencyService)
      .initialize();
    this._contextService.onEvent({
      type: "initialize_context",
      context: {
        connectedDevice: undefined,
        selectedAccounts: restoredAccounts,
        // Resolution is delegated to getActiveFamily (prefers ethereum, else the
        // first connected family), keeping this layer free of selection logic.
        activeFamily: undefined,
        trustChainId: isTrustChainValid ? trustChainId : undefined,
        applicationPath: undefined,
        chainId: chainId,
        welcomeScreenCompleted,
        hasTrackingConsent,
        hasDeveloperMode,
        isMobilePlatform,
        preferredFiatCurrency,
      },
    });

    // Attach the restored selection to the blockchain providers so a returning
    // session is wired up without waiting for a fresh account selection.
    blockchainProviderManager.setSelectedAccounts(restoredAccounts);

    this.container.get<PendingTransactionController>(
      pendingTransactionModuleTypes.PendingTransactionController,
    );
  }

  private listenDevice() {
    const deviceService = this.container.get<DeviceManagementKitService>(
      deviceModuleTypes.DeviceManagementKitService,
    );
    const dmk = deviceService.dmk;
    const sessionId = deviceService.connectedDevice?.sessionId;

    if (!sessionId) {
      return;
    }

    if (this.deviceConnectionSubscription) {
      this.deviceConnectionSubscription.unsubscribe();
    }

    this.deviceConnectionSubscription = dmk
      .getDeviceSessionState({
        sessionId: sessionId as string,
      })
      .subscribe((state) => {
        if (state.deviceStatus === DeviceStatus.NOT_CONNECTED) {
          this._logger.info("Device disconnected");

          this._contextService.onEvent({
            type: "device_disconnected",
          });
        }
      });
  }

  /**
   * Disconnect a blockchain `family`'s selected account. While other families
   * still have a selected account, only that family's account is removed;
   * once no selected account remains (or when called with no `family`), the
   * whole session is reset. Passing no `family` forces a full reset (used for
   * an expired trust chain or an explicit "log out").
   */
  async disconnect(family?: BlockchainFamily) {
    if (family) {
      const remaining = new Map(
        this._contextService.getContext().selectedAccounts,
      );
      remaining.delete(family);

      if (remaining.size > 0) {
        this._logger.debug("Disconnecting account for family", { family });
        this.container
          .get<StorageService>(storageModuleTypes.StorageService)
          .removeSelectedAccount(family);
        this._contextService.onEvent({ type: "account_disconnected", family });
        return;
      }
    }

    await this.resetSession();
  }

  private async resetSession() {
    this._logger.debug("Disconnecting from device");

    const currentContextService = this._contextService;
    const currentNavigationIntentService = this._navigationIntentService;

    this.container
      .get<StorageService>(storageModuleTypes.StorageService)
      .resetStorage();

    // Clean up device connection subscription
    this.deviceConnectionSubscription?.unsubscribe();
    this.deviceConnectionSubscription = undefined;
    const deviceService = this.container.get<DeviceManagementKitService>(
      deviceModuleTypes.DeviceManagementKitService,
    );
    deviceService.dmk.close();

    try {
      await this.container.unbindAll();
    } catch (error) {
      this._logger.error("Error unbinding container", { error });
    }

    this.container = createContainer(this.opts);
    this.container
      .rebindSync(contextModuleTypes.ContextService)
      .toConstantValue(currentContextService);
    // Keep the same navigation-intent stream so the UI bridge subscription
    // (set up once at bootstrap) survives the container recreation.
    this.container
      .rebindSync(navigationModuleTypes.NavigationIntentService)
      .toConstantValue(currentNavigationIntentService);

    void this.initializeContext();
  }

  // Device methods
  async connectToDevice(type: ConnectionType) {
    this._logger.debug("Connecting to device", { type });

    //Implicitly disconnect from device if already connected to one
    if (this._contextService.getContext().connectedDevice !== undefined) {
      this.deviceConnectionSubscription?.unsubscribe();
      await this.container
        .get<DisconnectDevice>(deviceModuleTypes.DisconnectDeviceUseCase)
        .execute();
    }

    const device = await this.container
      .get<ConnectDevice>(deviceModuleTypes.ConnectDeviceUseCase)
      .execute({ type });

    this._contextService.onEvent({
      type: "device_connected",
      device: device,
    });

    this.listenDevice();
    return device;
  }

  async disconnectFromDevice() {
    this._logger.debug("Disconnecting from device");
    const result = await this.container
      .get<DisconnectDevice>(deviceModuleTypes.DisconnectDeviceUseCase)
      .execute();

    this._contextService.onEvent({
      type: "device_disconnected",
    });

    return result;
  }

  async getReferralUrl() {
    return this.container
      .get<GetDAppConfigUseCase>(dAppConfigModuleTypes.GetDAppConfigUseCase)
      .execute()
      .then((res) => res.referralUrl);
  }

  async switchDevice(type: ConnectionType) {
    this._logger.debug("Switching device", { type });
    return this.container
      .get<SwitchDevice>(deviceModuleTypes.SwitchDeviceUseCase)
      .execute({ type });
  }

  async fetchAccountsFromCloudSync(): Promise<Account[]> {
    return this.container
      .get<FetchAccountsUseCase>(accountModuleTypes.FetchAccountsUseCase)
      .execute();
  }

  observeAccounts(options?: {
    forceRefresh?: boolean;
    family?: BlockchainFamily;
  }): Observable<AccountWithFiat[]> {
    return this.container
      .get<ObserveAccountsWithFiatUseCase>(
        accountModuleTypes.ObserveAccountsWithFiatUseCase,
      )
      .execute(options);
  }

  selectAccount(account: Account) {
    const family = this.resolveBlockchainFamily(account.currencyId);

    this.container
      .get<AccountService>(accountModuleTypes.AccountService)
      .selectAccount(account, family);

    this._contextService.onEvent({
      type: "account_changed",
      account,
      family,
    });

    this.container
      .get<TrackOnboarding>(eventTrackingModuleTypes.TrackOnboarding)
      .execute(account);
  }

  /** Default (ethereum) selected account, or for a specific `family`. */
  getSelectedAccount(family: BlockchainFamily = DEFAULT_BLOCKCHAIN_FAMILY) {
    return getSelectedAccount(this._contextService.getContext(), family);
  }

  /** Selected account for the currently active family (family-agnostic). */
  getActiveSelectedAccount() {
    return getActiveSelectedAccount(this._contextService.getContext());
  }

  /** The currently active blockchain family, if any. */
  getActiveFamily(): BlockchainFamily | undefined {
    return getActiveFamily(this._contextService.getContext());
  }

  /** All blockchain families that currently have a selected account. */
  getConnectedFamilies(): BlockchainFamily[] {
    return getConnectedFamilies(this._contextService.getContext());
  }

  /** Switch the active family (must already have a selected account). */
  setActiveFamily(family: BlockchainFamily): void {
    this._contextService.onEvent({ type: "active_family_changed", family });
  }

  private resolveBlockchainFamily(currencyId: string): BlockchainFamily {
    return this.container
      .get<BlockchainProviderManager>(
        blockchainProviderModuleTypes.BlockchainProviderManager,
      )
      .resolveBlockchainFamily(currencyId)
      .orDefault(DEFAULT_BLOCKCHAIN_FAMILY);
  }

  // Device methods
  getConnectedDevice() {
    this._logger.debug("Getting connected device");
    return this.container.get<DeviceManagementKitService>(
      deviceModuleTypes.DeviceManagementKitService,
    ).connectedDevice;
  }

  async listAvailableDevices() {
    this._logger.debug("Listing available devices");
    return this.container
      .get<ListAvailableDevices>(deviceModuleTypes.ListAvailableDevicesUseCase)
      .execute();
  }

  // Consent methods
  async hasConsent(): Promise<boolean> {
    this._logger.debug("Checking user consent");
    return await this.container
      .get<ConsentService>(consentModuleTypes.ConsentService)
      .hasConsent();
  }

  async hasRespondedToConsent(): Promise<boolean> {
    this._logger.debug("Checking if user has responded to consent");
    return await this.container
      .get<ConsentService>(consentModuleTypes.ConsentService)
      .hasRespondedToConsent();
  }

  async giveConsent(): Promise<void> {
    this._logger.debug("Giving user consent");
    await this.container
      .get<ConsentService>(consentModuleTypes.ConsentService)
      .giveConsent();
    this._contextService.onEvent({
      type: "tracking_consent_given",
    });
  }

  async refuseConsent(): Promise<void> {
    this._logger.debug("Refusing user consent");
    await this.container
      .get<ConsentService>(consentModuleTypes.ConsentService)
      .refuseConsent();
    this._contextService.onEvent({
      type: "tracking_consent_refused",
    });
  }

  async removeConsent(): Promise<void> {
    this._logger.debug("Removing user consent");
    await this.container
      .get<ConsentService>(consentModuleTypes.ConsentService)
      .removeConsent();
    this._contextService.onEvent({
      type: "tracking_consent_refused",
    });
  }

  async setWelcomeScreenCompleted(): Promise<void> {
    this._logger.debug("Setting welcome screen as completed");
    await this.container
      .get<StorageService>(storageModuleTypes.StorageService)
      .saveWelcomeScreenCompleted();
    this._contextService.onEvent({
      type: "welcome_screen_completed",
    });
  }

  isWelcomeScreenCompleted(): boolean {
    return this._contextService.getContext().welcomeScreenCompleted;
  }

  enableDeveloperMode(): void {
    this._logger.debug("Enabling developer mode");
    this.container
      .get<StorageService>(storageModuleTypes.StorageService)
      .saveDeveloperMode();
    this._contextService.onEvent({
      type: "developer_mode_enabled",
    });
  }

  hasDeveloperMode(): boolean {
    return this._contextService.getContext().hasDeveloperMode;
  }

  getFeatureFlags(): FeatureFlags {
    return this.container
      .get<StorageService>(storageModuleTypes.StorageService)
      .getFeatureFlags();
  }

  setFeatureFlag(flag: keyof FeatureFlags, enabled: boolean): void {
    this._logger.debug("Updating feature flag", { flag, enabled });
    const storageService = this.container.get<StorageService>(
      storageModuleTypes.StorageService,
    );
    storageService.saveFeatureFlags({
      ...storageService.getFeatureFlags(),
      [flag]: enabled,
    });
  }

  getPreferredFiatCurrency(): string {
    return (
      this._contextService.getContext().preferredFiatCurrency ??
      DEFAULT_FIAT_CURRENCY
    );
  }

  getSupportedFiatCurrencies(): FiatCurrency[] {
    return this.container
      .get<CurrencyService>(currencyModuleTypes.CurrencyService)
      .getSupportedFiatCurrencies();
  }

  async savePreferredFiatCurrency(currency: string): Promise<void> {
    this._logger.debug("Saving preferred fiat currency", { currency });
    await this.container
      .get<CurrencyService>(currencyModuleTypes.CurrencyService)
      .savePreferredFiatCurrency(currency);
    this._contextService.onEvent({
      type: "preferred_fiat_currency_changed",
      currency,
    });
  }

  async savePreferredLanguage(language: string): Promise<void> {
    this._logger.debug("Saving preferred language", { language });
    await this.container
      .get<StorageService>(storageModuleTypes.StorageService)
      .savePreferredLanguage(language);
  }

  async getPreferredLanguage(): Promise<string | undefined> {
    const result = await this.container
      .get<StorageService>(storageModuleTypes.StorageService)
      .getPreferredLanguage();
    return result.extract();
  }

  async jsonRpcRequest(args: JSONRPCRequest) {
    this._logger.debug("JSON RPC request", { args });
    return this.container
      .get<CoreFacadeService>(blockchainProviderModuleTypes.CoreFacadeService)
      .broadcastRPC(args, {
        name: "ethereum",
        chainId: this._contextService.getContext().chainId.toString(),
      });
  }

  /** Stream of generic navigation intents emitted by core for the UI to map. */
  observeNavigationIntents(): Observable<WalletNavigationIntent> {
    return this._navigationIntentService.observe();
  }

  connectToLedgerSync(): Observable<LedgerSyncAuthenticateResponse> {
    this._logger.debug("Connecting to ledger sync");

    // A selected account (for any blockchain family) means onboarding is
    // already done, so Ledger Sync open / activated events are not tracked.
    const isOnboarded =
      this._contextService.getContext().selectedAccounts.size > 0;

    if (!isOnboarded) {
      this.container
        .get<TrackLedgerSyncOpened>(
          eventTrackingModuleTypes.TrackLedgerSyncOpened,
        )
        .execute();
    }

    const res = this.container
      .get<LedgerSyncService>(ledgerSyncModuleTypes.LedgerSyncService)
      .authenticate();

    return res.pipe(
      tap(async (res: LedgerSyncAuthenticateResponse) => {
        if (!this.isAuthContext(res)) return;

        this._contextService.onEvent({
          type: "trustchain_connected",
          trustChainId: res.trustChainId,
          applicationPath: res.applicationPath,
        });

        if (isOnboarded) return;

        //TODO move inside context service onEvent
        await this.container
          .get<TrackLedgerSyncActivated>(
            eventTrackingModuleTypes.TrackLedgerSyncActivated,
          )
          .execute();
      }),
    );
  }

  private isAuthContext(
    res: LedgerSyncAuthenticateResponse,
  ): res is AuthContext {
    return "trustChainId" in res && "applicationPath" in res;
  }

  observeContext(): Observable<ButtonCoreContext> {
    return this._contextService.observeContext();
  }

  async fetchSelectedAccount(
    family: BlockchainFamily = DEFAULT_BLOCKCHAIN_FAMILY,
  ): Promise<DetailedAccount | undefined> {
    const result = await this.container
      .get<FetchSelectedAccountUseCase>(
        accountModuleTypes.FetchSelectedAccountUseCase,
      )
      .execute(family);
    return result.isRight() ? result.unsafeCoerce() : undefined;
  }

  observePendingTransactions(): Observable<PendingTransaction[]> {
    return this.container
      .get<PendingTransactionController>(
        pendingTransactionModuleTypes.PendingTransactionController,
      )
      .observePendingTransactions();
  }

  /**
   * Lifecycle of a single broadcasted transaction, from `processing` (once core
   * has registered it and resolved its explorer link) to `validated`.
   */
  observeBroadcastedTransaction(hash: string): Observable<BroadcastTracking> {
    return this.container
      .get<PendingTransactionController>(
        pendingTransactionModuleTypes.PendingTransactionController,
      )
      .observeBroadcastedTransaction(hash);
  }

  // Config methods
  getConfig(): Config {
    return this.container.get<Config>(configModuleTypes.Config);
  }

  setLogLevel(logLevel: keyof typeof LOG_LEVELS) {
    this.container.get<Config>(configModuleTypes.Config).setLogLevel(logLevel);
  }

  isMobile() {
    return this.container
      .get<IsMobileUseCase>(platformModuleTypes.IsMobileUseCase)
      .execute();
  }

  isSupportedPlatform() {
    return this.container
      .get<IsSupportedPlatformUseCase>(
        platformModuleTypes.IsSupportedPlatformUseCase,
      )
      .execute();
  }

  setChainId(chainId: number) {
    this._contextService.onEvent({
      type: "chain_changed",
      chainId,
    });
  }

  getChainId(): number {
    return this._contextService.getContext().chainId;
  }

  async getCurrencyInfo(currencyId: string): Promise<{
    name: string;
    ticker: string;
    transactionExplorerUrlTemplate?: string;
  }> {
    const result = await this.container
      .get<CalDataSource>(balanceModuleTypes.CalDataSource)
      .getCurrencyInformation(currencyId);

    if (result.isRight()) {
      const { name, ticker, transactionExplorerUrlTemplate } = result.extract();
      return { name, ticker, transactionExplorerUrlTemplate };
    }
    return { name: currencyId, ticker: currencyId.toUpperCase() };
  }

  async trackMobileRedirectLedgerWallet(): Promise<void> {
    await this.container
      .get<TrackMobileRedirectLedgerWallet>(
        eventTrackingModuleTypes.TrackMobileRedirectLedgerWallet,
      )
      .execute();
  }

  async trackFloatingButtonClick(): Promise<void> {
    await this.container
      .get<TrackFloatingButtonClick>(
        eventTrackingModuleTypes.TrackFloatingButtonClick,
      )
      .execute();
  }

  async trackViewTransactionDetailsClicked(
    transactionHash: string,
  ): Promise<void> {
    await this.container
      .get<TrackViewTransactionDetailsClick>(
        eventTrackingModuleTypes.TrackViewTransactionDetailsClick,
      )
      .execute(transactionHash);
  }

  async trackViewAllTransactionsClicked(
    params: TrackViewAllTransactionsParams,
  ): Promise<void> {
    await this.container
      .get<TrackViewAllTransactions>(
        eventTrackingModuleTypes.TrackViewAllTransactions,
      )
      .trackClicked(params);
  }

  async trackViewAllTransactionsRedirectConfirmed(
    params: TrackViewAllTransactionsParams,
  ): Promise<void> {
    await this.container
      .get<TrackViewAllTransactions>(
        eventTrackingModuleTypes.TrackViewAllTransactions,
      )
      .trackRedirectConfirmed(params);
  }

  async trackViewAllTransactionsRedirectCancelled(
    params: TrackViewAllTransactionsParams,
  ): Promise<void> {
    await this.container
      .get<TrackViewAllTransactions>(
        eventTrackingModuleTypes.TrackViewAllTransactions,
      )
      .trackRedirectCancelled(params);
  }

  async trackLanguageChanged(languageKey: string): Promise<void> {
    await this.container
      .get<TrackLanguageChanged>(eventTrackingModuleTypes.TrackLanguageChanged)
      .execute(languageKey);
  }

  async trackCurrencyChanged(currencyCode: string): Promise<void> {
    await this.container
      .get<TrackCurrencyChanged>(eventTrackingModuleTypes.TrackCurrencyChanged)
      .execute(currencyCode);
  }

  async trackWalletActionClicked(
    walletAction: WalletActionType,
  ): Promise<void> {
    await this.container
      .get<TrackWalletAction>(eventTrackingModuleTypes.TrackWalletAction)
      .trackWalletActionClicked(walletAction);
  }

  async trackWalletRedirectConfirmed(
    walletAction: WalletActionType,
  ): Promise<void> {
    await this.container
      .get<TrackWalletAction>(eventTrackingModuleTypes.TrackWalletAction)
      .trackWalletRedirectConfirmed(walletAction);
  }

  async trackWalletRedirectCancelled(
    walletAction: WalletActionType,
  ): Promise<void> {
    await this.container
      .get<TrackWalletAction>(eventTrackingModuleTypes.TrackWalletAction)
      .trackWalletRedirectCancelled(walletAction);
  }
}
