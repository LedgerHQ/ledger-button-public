import { type Factory, inject, injectable } from "inversify";
import { BehaviorSubject, Observable } from "rxjs";

import { type ContextEvent } from "./model/ContextEvent.js";
import type { BlockchainFamily } from "../../api/blockchain-provider/model/types.js";
import {
  type ButtonCoreContext,
  DEFAULT_BLOCKCHAIN_FAMILY,
} from "../../api/model/ButtonCoreContext.js";
import {
  type Account,
  type DetailedAccount,
} from "../account/service/AccountService.js";
import { DEFAULT_FIAT_CURRENCY } from "../currency/constant.js";
import {
  getChainIdFromCurrencyId,
  getCurrencyIdFromChainId,
} from "../evm-provider/ledger-eip1193/utils/chainUtils.js";
import { loggerModuleTypes } from "../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../logger/service/LoggerPublisher.js";
import { type ContextService } from "./ContextService.js";

@injectable()
export class DefaultContextService implements ContextService {
  private context: ButtonCoreContext = {
    connectedDevice: undefined,
    selectedAccounts: new Map<BlockchainFamily, Account>(),
    activeFamily: undefined,
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
      case "chain_changed": {
        this.context.chainId = event.chainId;
        // chainId is an EVM concept: only the default (ethereum) selection
        // follows a chain switch.
        const evmAccount = this.context.selectedAccounts.get(
          DEFAULT_BLOCKCHAIN_FAMILY,
        );
        if (evmAccount) {
          this.context.selectedAccounts.set(DEFAULT_BLOCKCHAIN_FAMILY, {
            ...evmAccount,
            currencyId:
              getCurrencyIdFromChainId(event.chainId) ?? evmAccount.currencyId,
          });
        }
        break;
      }
      case "account_changed":
        this.applySelectedAccount(event.account, event.family);
        this.context.activeFamily = event.family;
        break;
      case "hydrated_account":
        this.applyHydratedAccount(event.account);
        break;
      case "active_family_changed":
        if (this.context.selectedAccounts.has(event.family)) {
          this.context.activeFamily = event.family;
        }
        break;
      case "account_disconnected":
        this.context.selectedAccounts.delete(event.family);
        if (this.context.activeFamily === event.family) {
          this.context.activeFamily = this.firstConnectedFamily();
        }
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
        this.context.selectedAccounts = new Map<BlockchainFamily, Account>();
        this.context.activeFamily = undefined;
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

    this.emitContext();
  }

  /**
   * Emit an immutable snapshot of the context. `this.context` is mutated in
   * place by the handlers above, so re-emitting the same reference would defeat
   * any `distinctUntilChanged` downstream (previous and next would be the same
   * mutated object). Rebuilding a fresh object (and a fresh `selectedAccounts`
   * map) ensures consumers can reliably detect field-level changes such as an
   * active-family switch.
   */
  private emitContext(): void {
    this.context = {
      ...this.context,
      selectedAccounts: new Map(this.context.selectedAccounts),
    };
    this.contextSubject.next(this.context);
  }

  private applySelectedAccount(
    account: Account | DetailedAccount,
    family: BlockchainFamily,
  ): void {
    this.context.selectedAccounts.set(family, account);
    // chainId tracks the default (ethereum) selection only.
    if (family === DEFAULT_BLOCKCHAIN_FAMILY) {
      this.context.chainId = getChainIdFromCurrencyId(account.currencyId);
    }
  }

  /**
   * Re-apply a freshly hydrated account to the family that currently holds it
   * (matched by address), defaulting to {@link DEFAULT_BLOCKCHAIN_FAMILY}.
   */
  private applyHydratedAccount(account: Account | DetailedAccount): void {
    const family =
      this.findFamilyForAccount(account) ?? DEFAULT_BLOCKCHAIN_FAMILY;
    this.applySelectedAccount(account, family);
  }

  private findFamilyForAccount(
    account: Account | DetailedAccount,
  ): BlockchainFamily | undefined {
    for (const [family, selected] of this.context.selectedAccounts) {
      if (selected.freshAddress === account.freshAddress) {
        return family;
      }
    }
    return undefined;
  }

  private firstConnectedFamily(): BlockchainFamily | undefined {
    for (const family of this.context.selectedAccounts.keys()) {
      return family;
    }
    return undefined;
  }
}
