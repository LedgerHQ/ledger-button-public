import { type Factory, inject, injectable } from "inversify";
import { BehaviorSubject, Observable } from "rxjs";

import { type ContextEvent } from "./model/ContextEvent.js";
import type { ButtonCoreContext } from "../../api/model/ButtonCoreContext.js";
import {
  type Account,
  type DetailedAccount,
} from "../account/service/AccountService.js";
import { DEFAULT_FIAT_CURRENCY } from "../currency/constant.js";
import {
  getChainIdFromCurrencyId,
  getCurrencyIdFromChainId,
} from "../evm-provider/utils/chainUtils.js";
import { loggerModuleTypes } from "../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../logger/service/LoggerPublisher.js";
import { type ContextService } from "./ContextService.js";

@injectable()
export class DefaultContextService implements ContextService {
  private context: ButtonCoreContext = {
    connectedDevice: undefined,
    selectedAccount: undefined,
    trustChainId: undefined,
    applicationPath: undefined,
    chainId: 1,
    welcomeScreenCompleted: false,
    hasTrackingConsent: undefined,
    isMobilePlatform: false,
    preferredFiatCurrency: DEFAULT_FIAT_CURRENCY,
  };

  private readonly logger: LoggerPublisher;
  private readonly contextSubject: BehaviorSubject<ButtonCoreContext> =
    new BehaviorSubject<ButtonCoreContext>(this.context);

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    private readonly loggerFactory: Factory<LoggerPublisher>,
  ) {
    this.logger = this.loggerFactory("Context Service");
  }

  observeContext(): Observable<ButtonCoreContext> {
    return this.contextSubject.asObservable();
  }
  getContext(): ButtonCoreContext {
    return this.context;
  }

  onEvent(event: ContextEvent): void {
    this.logger.debug("onEvent", { event });
    switch (event.type) {
      case "initialize_context":
        this.context = event.context;
        break;
      case "chain_changed":
        this.context.chainId = event.chainId;
        if (this.context.selectedAccount) {
          this.context.selectedAccount = {
            ...(this.context.selectedAccount as Account),
            currencyId:
              getCurrencyIdFromChainId(event.chainId) ??
              this.context.selectedAccount?.currencyId,
          } as Account;
        }
        break;
      case "account_changed":
      case "hydrated_account":
        this.applySelectedAccount(event.account);
        break;
      case "device_connected":
        this.context.connectedDevice = event.device;
        break;
      case "device_disconnected":
        this.context.connectedDevice = undefined;
        break;
      case "trustchain_connected":
        this.context.trustChainId = event.trustChainId;
        this.context.applicationPath = event.applicationPath;
        break;
      case "wallet_disconnected":
        this.context.selectedAccount = undefined;
        this.context.trustChainId = undefined;
        this.context.connectedDevice = undefined;
        this.context.applicationPath = undefined;
        break;
      case "welcome_screen_completed":
        this.context.welcomeScreenCompleted = true;
        break;
      case "tracking_consent_given":
        this.context.hasTrackingConsent = true;
        break;
      case "tracking_consent_refused":
        this.context.hasTrackingConsent = false;
        break;
      case "preferred_fiat_currency_changed":
        this.context.preferredFiatCurrency = event.currency;
        break;
    }

    this.contextSubject.next(this.context);
  }

  private applySelectedAccount(account: Account | DetailedAccount): void {
    this.context.selectedAccount = account;
    this.context.chainId = getChainIdFromCurrencyId(account.currencyId);
  }
}
