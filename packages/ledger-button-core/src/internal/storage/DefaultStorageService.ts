import { type Factory, inject, injectable } from "inversify";
import { Either, Maybe, Nothing } from "purify-ts";

import type { BlockchainFamily } from "@api/blockchain-provider/model/types";
import type { Account } from "@api/model/Account";

import { storageModuleTypes } from "./di/storageModuleTypes";
import { AccountDbModel, mapToAccountDbModel } from "./model/accountDbModel";
import { STORAGE_KEYS } from "./model/constant";
import { StorageIDBErrors } from "./model/errors";
import {
  DEFAULT_FEATURE_FLAGS,
  type FeatureFlags,
} from "./model/FeatureFlags";
import { type UserConsent } from "./model/UserConsent";
import { type IndexedDbService } from "./service/IndexedDbService";
import { loggerModuleTypes } from "../logger/di/loggerModuleTypes";
import { type LoggerPublisher } from "../logger/service/LoggerPublisher";
import { type StorageService } from "./StorageService";

@injectable()
export class DefaultStorageService implements StorageService {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    private readonly loggerFactory: Factory<LoggerPublisher>,
    @inject(storageModuleTypes.IndexedDbService)
    private readonly indexedDbService: IndexedDbService,
  ) {
    this.logger = this.loggerFactory("Storage Service");
  }

  static formatKey(key: string) {
    return `${STORAGE_KEYS.PREFIX}-${key}`;
  }

  async setDbVersion(version: number): Promise<Either<StorageIDBErrors, void>> {
    return this.indexedDbService.setDbVersion(version);
  }

  async getDbVersion(): Promise<number> {
    const version = await this.indexedDbService.getDbVersion();
    return version.caseOf({
      Right: (maybeVersion) => maybeVersion.orDefault(0),
      Left: () => this.getItem<number>(STORAGE_KEYS.DB_VERSION).orDefault(0),
    });
  }

  async storeKeyPair(
    keyPair: Uint8Array,
  ): Promise<Either<StorageIDBErrors, boolean>> {
    return this.indexedDbService.storeKeyPair(keyPair);
  }

  async getKeyPair(): Promise<Either<StorageIDBErrors, Uint8Array>> {
    return this.indexedDbService.getKeyPair();
  }

  async removeKeyPair(): Promise<Either<StorageIDBErrors, boolean>> {
    return this.indexedDbService.removeKeyPair();
  }

  async storeEncryptionKey(encryptionKey: CryptoKey): Promise<void> {
    return this.indexedDbService.storeEncryptionKey(encryptionKey);
  }

  async getEncryptionKey(): Promise<Maybe<CryptoKey>> {
    return this.indexedDbService.getEncryptionKey();
  }
  // Trust Chain ID
  saveTrustChainId(_trustChainId: string): void {
    this.saveItem(STORAGE_KEYS.TRUST_CHAIN_ID, _trustChainId);
    this.saveItem(STORAGE_KEYS.TRUST_CHAIN_VALIDITY, new Date().getTime());
  }

  getTrustChainId(): Maybe<string> {
    return this.getItem(STORAGE_KEYS.TRUST_CHAIN_ID);
  }

  removeTrustChainId(): void {
    this.removeItem(STORAGE_KEYS.TRUST_CHAIN_ID);
    this.removeItem(STORAGE_KEYS.TRUST_CHAIN_VALIDITY);
  }

  isTrustChainValid(): boolean {
    return this.getItem<number>(STORAGE_KEYS.TRUST_CHAIN_VALIDITY)
      .map((value) => {
        const ms30days = 30 * 24 * 60 * 60 * 1000;
        const storedDate = new Date(value);
        const validity = new Date(storedDate.getTime() + ms30days);
        const now = new Date();
        return validity > now;
      })
      .orDefault(false);
  }

  // Selected Accounts (one per blockchain family)
  saveSelectedAccount(
    selectedAccount: Account,
    family: BlockchainFamily,
  ): void {
    if (!selectedAccount) {
      return;
    }
    const stored = this.getItem<Record<string, AccountDbModel>>(
      STORAGE_KEYS.SELECTED_ACCOUNTS,
    ).orDefault({});
    stored[family] = mapToAccountDbModel(selectedAccount);
    this.saveItem(STORAGE_KEYS.SELECTED_ACCOUNTS, stored);
  }

  getSelectedAccounts(): Map<BlockchainFamily, Account> {
    const accounts = new Map<BlockchainFamily, Account>();

    const stored = this.getItem<Record<string, AccountDbModel>>(
      STORAGE_KEYS.SELECTED_ACCOUNTS,
    ).orDefault({});
    for (const [family, dbModel] of Object.entries(stored)) {
      accounts.set(family as BlockchainFamily, this.toAccount(dbModel));
    }

    return accounts;
  }

  removeSelectedAccount(family: BlockchainFamily): void {
    const stored = this.getItem<Record<string, AccountDbModel>>(
      STORAGE_KEYS.SELECTED_ACCOUNTS,
    ).orDefault({});
    delete stored[family];
    this.saveItem(STORAGE_KEYS.SELECTED_ACCOUNTS, stored);
  }

  removeSelectedAccounts(): void {
    this.removeItem(STORAGE_KEYS.SELECTED_ACCOUNTS);
    this.removeItem(STORAGE_KEYS.SELECTED_ACCOUNT);
  }

  private toAccount(accountDbModel: AccountDbModel): Account {
    return {
      id: "",
      name: "",
      freshAddress: accountDbModel.address,
      seedIdentifier: "",
      derivationMode: accountDbModel.derivationMode,
      index: accountDbModel.index,
      currencyId: accountDbModel.currencyId,
      ticker: "",
      balance: "",
      tokens: [],
    };
  }

  /***  Local Storage Primitives ***/
  // LocalStorage
  saveItem<T>(key: string, value: T) {
    localStorage.setItem(
      DefaultStorageService.formatKey(key),
      JSON.stringify(value),
    );
  }

  removeItem(key: string) {
    const formattedKey = DefaultStorageService.formatKey(key);
    if (!this.hasItem(key)) {
      this.logger.debug("Item not found", { key });
      return false;
    }

    localStorage.removeItem(formattedKey);
    this.logger.debug("Item removed", { key });
    return true;
  }

  hasItem(key: string) {
    const formattedKey = DefaultStorageService.formatKey(key);
    const item = localStorage.getItem(formattedKey);
    return item !== null;
  }

  resetStorage() {
    Object.keys(localStorage).forEach((key) => {
      this.logger.debug("Item", { key });
      if (key.startsWith(STORAGE_KEYS.PREFIX)) {
        localStorage.removeItem(key);
        this.logger.debug("Item removed", { key });
      }
    });
  }

  getItem<T>(key: string): Maybe<T> {
    const formattedKey = DefaultStorageService.formatKey(key);
    const item = localStorage.getItem(formattedKey);
    return Maybe.fromNullable(item).chain((item) => {
      try {
        return Maybe.of(JSON.parse(item) as T);
      } catch (error) {
        this.logger.error("Error parsing item", { error, key });
        return Nothing;
      }
    });
  }

  // Consent Management
  async saveUserConsent(consent: UserConsent): Promise<void> {
    const result = await this.indexedDbService.storeUserConsent(consent);
    result.caseOf({
      Right: () => {
        this.logger.debug("User consent saved", { consent });
      },
      Left: (error) => {
        this.logger.error("Error saving user consent", { error, consent });
      },
    });
  }

  async getUserConsent(): Promise<Maybe<UserConsent>> {
    const result = await this.indexedDbService.getUserConsent();
    return result.caseOf({
      Right: (maybeConsent) => maybeConsent,
      Left: (error) => {
        this.logger.error("Error getting user consent", { error });
        return Nothing;
      },
    });
  }

  async removeUserConsent(): Promise<void> {
    const consent: UserConsent = {
      consentGiven: false,
      consentDate: new Date().toISOString(),
    };
    const result = await this.indexedDbService.storeUserConsent(consent);
    result.caseOf({
      Right: () => {
        this.logger.debug("User consent set to refused", { consent });
      },
      Left: (error) => {
        this.logger.error("Error removing user consent", { error });
      },
    });
  }

  // Welcome Screen Management
  async saveWelcomeScreenCompleted(): Promise<void> {
    const result =
      await this.indexedDbService.storeWelcomeScreenCompleted(true);
    result.caseOf({
      Right: () => {
        this.logger.debug("Welcome screen completed saved");
      },
      Left: (error) => {
        this.logger.error("Error saving welcome screen completed", { error });
      },
    });
  }

  async isWelcomeScreenCompleted(): Promise<boolean> {
    const result = await this.indexedDbService.getWelcomeScreenCompleted();
    return result.caseOf({
      Right: (maybeCompleted) => maybeCompleted.orDefault(false),
      Left: (error) => {
        this.logger.error("Error getting welcome screen completed", { error });
        return false;
      },
    });
  }

  async removeWelcomeScreenCompleted(): Promise<void> {
    const result =
      await this.indexedDbService.storeWelcomeScreenCompleted(false);
    result.caseOf({
      Right: () => {
        this.logger.debug("Welcome screen completed set to false");
      },
      Left: (error) => {
        this.logger.error("Error removing welcome screen completed", { error });
      },
    });
  }

  async savePreferredLanguage(language: string): Promise<void> {
    const result = await this.indexedDbService.storePreferredLanguage(language);
    result.caseOf({
      Right: () => {
        this.logger.debug("Preferred language saved", { language });
      },
      Left: (error) => {
        this.logger.error("Error saving preferred language", {
          error,
          language,
        });
      },
    });
  }

  async getPreferredLanguage(): Promise<Maybe<string>> {
    const result = await this.indexedDbService.getPreferredLanguage();
    return result.caseOf({
      Right: (language) => language,
      Left: (error) => {
        this.logger.error("Error getting preferred language", { error });
        return Nothing;
      },
    });
  }

  async savePreferredFiatCurrency(
    preferredFiatCurrency: string,
  ): Promise<void> {
    const result = await this.indexedDbService.storePreferredFiatCurrency(
      preferredFiatCurrency,
    );
    result.caseOf({
      Right: () => {
        this.logger.debug("Preferred fiat currency saved", {
          preferredFiatCurrency,
        });
      },
      Left: (error) => {
        this.logger.error("Error saving preferred fiat currency", {
          error,
          preferredFiatCurrency,
        });
      },
    });
  }

  async getPreferredFiatCurrency(): Promise<Maybe<string>> {
    const result = await this.indexedDbService.getPreferredFiatCurrency();
    return result.caseOf({
      Right: (preferredFiatCurrency) => preferredFiatCurrency,
      Left: (error) => {
        this.logger.error("Error getting preferred fiat currency", { error });
        return Nothing;
      },
    });
  }

  saveDeveloperMode(): void {
    this.saveItem(STORAGE_KEYS.HAS_DEVELOPER_MODE, true);
  }

  hasDeveloperMode(): boolean {
    return this.getItem<boolean>(STORAGE_KEYS.HAS_DEVELOPER_MODE).orDefault(
      false,
    );
  }

  getFeatureFlags(): FeatureFlags {
    const stored = this.getItem<Partial<FeatureFlags>>(
      STORAGE_KEYS.FEATURE_FLAGS,
    ).orDefault({});
    return { ...DEFAULT_FEATURE_FLAGS, ...stored };
  }

  saveFeatureFlags(flags: FeatureFlags): void {
    this.saveItem(STORAGE_KEYS.FEATURE_FLAGS, flags);
  }
}
