import { DeviceStatus } from "@ledgerhq/device-management-kit";
import { Container, Factory } from "inversify";
import { Observable, Subscription, tap } from "rxjs";

import type {
  BlockchainFamily,
  WalletNavigationIntent,
} from "./blockchain-provider/model/types.js";
import {
  ButtonCoreContext,
  DEFAULT_BLOCKCHAIN_FAMILY,
  getSelectedAccount,
} from "./model/ButtonCoreContext.js";
import { JSONRPCRequest } from "./model/eip/EIPTypes.js";
import {
  AuthContext,
  LedgerSyncAuthenticateResponse,
} from "./model/LedgerSyncAuthenticateResponse.js";
import { getChainIdFromCurrencyId } from "./utils/index.js";
import { accountModuleTypes } from "../internal/account/accountModuleTypes.js";
import {
  Account,
  type AccountService,
  type AccountWithFiat,
  type DetailedAccount,
} from "../internal/account/service/AccountService.js";
import { FetchAccountsUseCase } from "../internal/account/use-case/fetchAccountsUseCase.js";
import { ObserveAccountsWithFiatUseCase } from "../internal/account/use-case/observeAccountsWithFiatUseCase.js";
import type { ObserveSelectedAccountChangesUseCase } from "../internal/account/use-case/observeSelectedAccountChangesUseCase.js";
import { type WalletActionType } from "../internal/backend/model/trackEvent.js";
import { balanceModuleTypes } from "../internal/balance/balanceModuleTypes.js";
import type { CalDataSource } from "../internal/balance/datasource/cal/CalDataSource.js";
import { blockchainProviderModuleTypes } from "../internal/blockchain-provider/blockchainProviderModuleTypes.js";
import type { BlockchainProviderManager } from "../internal/blockchain-provider/service/BlockchainProviderManager.js";
import { CoreFacadeService } from "../internal/blockchain-provider/service/CoreFacadeService.js";
import { configModuleTypes } from "../internal/config/configModuleTypes.js";
import { Config } from "../internal/config/model/config.js";
import { consentModuleTypes } from "../internal/consent/consentModuleTypes.js";
import { type ConsentService } from "../internal/consent/ConsentService.js";
import { contextModuleTypes } from "../internal/context/contextModuleTypes.js";
import { ContextService } from "../internal/context/ContextService.js";
import { DEFAULT_FIAT_CURRENCY } from "../internal/currency/constant.js";
import { currencyModuleTypes } from "../internal/currency/currencyModuleTypes.js";
import type { FiatCurrency } from "../internal/currency/datasource/fiatCurrencyTypes.js";
import type { CurrencyService } from "../internal/currency/service/CurrencyService.js";
import { dAppConfigV1ModuleTypes } from "../internal/dAppConfig/v1/di/dAppConfigV1ModuleTypes.js";
import { type DAppConfigService } from "../internal/dAppConfig/v1/service/DAppConfigService.js";
import { dAppConfigV2ModuleTypes } from "../internal/dAppConfig/v2/di/dAppConfigV2ModuleTypes.js";
import { type GetDAppConfigV2UseCase } from "../internal/dAppConfig/v2/use-case/GetDAppConfigV2UseCase.js";
import { deviceModuleTypes } from "../internal/device/deviceModuleTypes.js";
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
import { eventTrackingModuleTypes } from "../internal/event-tracking/eventTrackingModuleTypes.js";
import { TrackCurrencyChanged } from "../internal/event-tracking/usecase/TrackCurrencyChanged.js";
import { TrackFloatingButtonClick } from "../internal/event-tracking/usecase/TrackFloatingButtonClick.js";
import { TrackLanguageChanged } from "../internal/event-tracking/usecase/TrackLanguageChanged.js";
import { TrackLedgerSyncActivated } from "../internal/event-tracking/usecase/TrackLedgerSyncActivated.js";
import { TrackLedgerSyncOpened } from "../internal/event-tracking/usecase/TrackLedgerSyncOpened.js";
import { TrackMobileRedirectLedgerWallet } from "../internal/event-tracking/usecase/TrackMobileRedirectLedgerWallet.js";
import { TrackOnboarding } from "../internal/event-tracking/usecase/TrackOnboarding.js";
import {
  TrackViewAllTransactions,
  type TrackViewAllTransactionsParams,
} from "../internal/event-tracking/usecase/TrackViewAllTransactions.js";
import { TrackViewTransactionDetailsClick } from "../internal/event-tracking/usecase/TrackViewTransactionDetailsClick.js";
import { TrackWalletAction } from "../internal/event-tracking/usecase/TrackWalletAction.js";
import { ledgerSyncModuleTypes } from "../internal/ledgersync/ledgerSyncModuleTypes.js";
import { LedgerSyncService } from "../internal/ledgersync/service/LedgerSyncService.js";
import { loggerModuleTypes } from "../internal/logger/loggerModuleTypes.js";
import { LOG_LEVELS } from "../internal/logger/model/constant.js";
import { LoggerPublisher } from "../internal/logger/service/LoggerPublisher.js";
import { modalModuleTypes } from "../internal/modal/modalModuleTypes.js";
import { ModalService } from "../internal/modal/service/ModalService.js";
import { navigationModuleTypes } from "../internal/navigation/navigationModuleTypes.js";
import { NavigationIntentService } from "../internal/navigation/service/NavigationIntentService.js";
import { type PendingTransactionController } from "../internal/pending-transaction/controller/PendingTransactionController.js";
import { type PendingTransaction } from "../internal/pending-transaction/model/PendingTransaction.js";
import { pendingTransactionModuleTypes } from "../internal/pending-transaction/pendingTransactionModuleTypes.js";
import { platformModuleTypes } from "../internal/platform/platformModuleTypes.js";
import { IsMobileUseCase } from "../internal/platform/use-case/IsMobileUseCase.js";
import { IsSupportedPlatformUseCase } from "../internal/platform/use-case/IsSupportedPlatformUseCase.js";
import { storageModuleTypes } from "../internal/storage/storageModuleTypes.js";
import { type StorageService } from "../internal/storage/StorageService.js";
import { MigrateDbUseCase } from "../internal/storage/usecases/MigrateDbUseCase/MigrateDbUseCase.js";

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
    //Fetch dApp config that will be used later for fetching supported blockchains/referral url/etc.
    await this.container
      .get<DAppConfigService>(dAppConfigV1ModuleTypes.DAppConfigService)
      .getDAppConfig();

    const dappConfig = await this.container
      .get<GetDAppConfigV2UseCase>(
        dAppConfigV2ModuleTypes.GetDAppConfigV2UseCase,
      )
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

    // Session teardown is owned by core; expose it to the facade so a provider
    // (e.g. EIP-1193 `disconnect`) can trigger a full disconnect through the port.
    coreFacade.setDisconnectHandler(() => this.disconnect());

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
      ? getChainIdFromCurrencyId(defaultAccount.currencyId)
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
        trustChainId: isTrustChainValid ? trustChainId : undefined,
        applicationPath: undefined,
        chainId: chainId,
        welcomeScreenCompleted,
        hasTrackingConsent,
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

  async disconnect() {
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
      .get<DAppConfigService>(dAppConfigV1ModuleTypes.DAppConfigService)
      .getDAppConfig()
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

  observeSelectedAccountChanges(): Observable<DetailedAccount | undefined> {
    return this.container
      .get<ObserveSelectedAccountChangesUseCase>(
        accountModuleTypes.ObserveSelectedAccountChangesUseCase,
      )
      .execute();
  }

  observePendingTransactions(): Observable<PendingTransaction[]> {
    return this.container
      .get<PendingTransactionController>(
        pendingTransactionModuleTypes.PendingTransactionController,
      )
      .observePendingTransactions();
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
