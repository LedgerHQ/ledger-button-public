import {
  bufferToHexaString,
  hexaStringToBuffer,
} from "@ledgerhq/device-management-kit";
import { type Factory, inject, injectable } from "inversify";
import { Either, Just, Left, Maybe, Nothing, Right } from "purify-ts";

import { AccountDbModel, mapToAccountDbModel } from "./model/accountDbModel.js";
import { STORAGE_KEYS } from "./model/constant.js";
import {
  StorageIDBErrors,
  StorageIDBGetError,
  StorageIDBNotInitializedError,
  StorageIDBOpenError,
  StorageIDBRemoveError,
  StorageIDBStoreError,
} from "./model/errors.js";
import { type Account } from "../account/service/AccountService.js";
import { loggerModuleTypes } from "../logger/loggerModuleTypes.js";
import { type LoggerPublisher } from "../logger/service/LoggerPublisher.js";
import { type StorageService } from "./StorageService.js";

@injectable()
export class DefaultStorageService implements StorageService {
  private readonly logger: LoggerPublisher;
  private initialization: Maybe<Promise<void>> = Nothing;
  private idb: Either<StorageIDBErrors, IDBDatabase> = Left(
    new StorageIDBNotInitializedError("IDB not initialized"),
  );

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    private readonly loggerFactory: Factory<LoggerPublisher>,
  ) {
    this.logger = this.loggerFactory("[Storage Service]");
  }

  static formatKey(key: string) {
    return `${STORAGE_KEYS.PREFIX}-${key}`;
  }

  // Database Version
  setDbVersion(version: number): void {
    this.saveItem(STORAGE_KEYS.DB_VERSION, version);
  }

  getDbVersion(): number {
    return this.getItem<number>(STORAGE_KEYS.DB_VERSION).orDefault(0);
  }

  // IndexDB
  async initIdb(): Promise<Either<StorageIDBErrors, IDBDatabase>> {
    if (this.idb.isRight()) {
      return this.idb;
    }

    if (this.initialization.isJust()) {
      await this.initialization.orDefault(Promise.resolve());
      return this.idb;
    }

    this.initialization = Just(
      new Promise((resolve) => {
        const request = indexedDB.open(STORAGE_KEYS.DB_NAME, 3);

        request.onsuccess = (event) => {
          this.logger.debug("IDB opened");
          const idb = (event.target as IDBOpenDBRequest).result;
          resolve(Right(idb));
        };

        request.onerror = (event) => {
          this.logger.error("Error opening IDB", { event });
          resolve(
            Left(new StorageIDBOpenError("Error opening IDB", { event })),
          );
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const store = db.createObjectStore(STORAGE_KEYS.DB_STORE_NAME);

          store.createIndex(
            STORAGE_KEYS.DB_STORE_KEYPAIR_KEY,
            STORAGE_KEYS.DB_STORE_KEYPAIR_KEY,
            { unique: true },
          );

          store.createIndex(
            STORAGE_KEYS.ENCRYPTION_KEY,
            STORAGE_KEYS.ENCRYPTION_KEY,
            { unique: true },
          );
        };
      }).then((result) => {
        if (Either.isEither(result)) {
          this.idb = result as Either<StorageIDBErrors, IDBDatabase>;
        }
        return;
      }),
    );

    await this.initialization.orDefault(Promise.resolve());
    return this.idb;
  }

  // IndexedDB (KeyPair)
  async storeKeyPair(keyPair: Uint8Array) {
    const encryptedKeyPairString = bufferToHexaString(keyPair);
    this.logger.debug("Storing encrypted keyPair in storage", {
      keyPair: encryptedKeyPairString,
    });
    const init = await this.initIdb();
    return new Promise<Either<StorageIDBErrors, boolean>>((resolve) => {
      init.map((db) => {
        const transaction = db.transaction(
          STORAGE_KEYS.DB_STORE_NAME,
          "readwrite",
        );
        const store = transaction.objectStore(STORAGE_KEYS.DB_STORE_NAME);
        const request = store.add(
          encryptedKeyPairString,
          STORAGE_KEYS.DB_STORE_KEYPAIR_KEY,
        );

        request.onsuccess = () => {
          this.logger.debug("KeyPair stored", {
            keyPair: bufferToHexaString(keyPair),
          });
          resolve(Right(true));
        };

        request.onerror = (event) => {
          this.logger.error("Error storing key pair", { event });
          resolve(
            Left(
              new StorageIDBStoreError("Error storing key pair", {
                event,
                keyPair: encryptedKeyPairString,
              }),
            ),
          );
        };
      });
    });
  }

  async getKeyPair(): Promise<Either<StorageIDBErrors, Uint8Array>> {
    const init = await this.initIdb();

    return new Promise<Either<StorageIDBErrors, Uint8Array>>((resolve) => {
      init.map((db) => {
        const transaction = db.transaction(
          STORAGE_KEYS.DB_STORE_NAME,
          "readonly",
        );
        const store = transaction.objectStore(STORAGE_KEYS.DB_STORE_NAME);
        const request = store.get(STORAGE_KEYS.DB_STORE_KEYPAIR_KEY);

        request.onsuccess = (event) => {
          const result = (event.target as IDBRequest)?.result;

          if (!result) {
            this.logger.error("Error getting key pair from indexDB", { event });
            resolve(
              Left(new StorageIDBGetError("Error getting key pair", { event })),
            );

            return;
          }

          this.logger.info("KeyPair retrieved from indexDB", {
            keyPair: result,
          });

          resolve(Right(hexaStringToBuffer(result) as Uint8Array));
        };

        request.onerror = (event) => {
          this.logger.error("Error getting key pair", { event });
          resolve(
            Left(
              new StorageIDBGetError("Error getting key pair", {
                event,
              }),
            ),
          );
        };
      });
    });
  }

  async removeKeyPair() {
    const init = await this.initIdb();

    return new Promise<Either<StorageIDBErrors, boolean>>((resolve) => {
      init.map((db) => {
        const transaction = db.transaction(
          STORAGE_KEYS.DB_STORE_NAME,
          "readwrite",
        );
        const store = transaction.objectStore(STORAGE_KEYS.DB_STORE_NAME);
        const request = store.delete(STORAGE_KEYS.DB_STORE_KEYPAIR_KEY);

        request.onsuccess = () => {
          this.logger.debug("Key pair removed");
          resolve(Right(true));
        };

        request.onerror = (event) => {
          this.logger.error("Error removing key pair", { event });
          resolve(
            Left(
              new StorageIDBRemoveError("Error removing key pair", { event }),
            ),
          );
        };
      });
    });
  }

  // Encryption Key
  async storeEncryptionKey(encryptionKey: CryptoKey): Promise<void> {
    const init = await this.initIdb();

    return new Promise<void>((resolve, reject) => {
      init
        .map((db) => {
          const transaction = db.transaction(
            STORAGE_KEYS.DB_STORE_NAME,
            "readwrite",
          );
          const store = transaction.objectStore(STORAGE_KEYS.DB_STORE_NAME);

          const request = store.put(encryptionKey, STORAGE_KEYS.ENCRYPTION_KEY);

          request.onsuccess = () => {
            this.logger.debug("Encryption key stored successfully");
            resolve();
          };

          request.onerror = (event) => {
            this.logger.error("Error storing encryption key", { event });
            reject(new Error("Failed to store encryption key"));
          };
        })
        .caseOf({
          Left: (error) => {
            this.logger.error(
              "Error initializing IDB for encryption key storage",
              { error },
            );
            reject(error);
          },
          Right: () => {
            // Transaction handled in map callback
          },
        });
    });
  }

  async getEncryptionKey(): Promise<Maybe<CryptoKey>> {
    const init = await this.initIdb();

    return new Promise<Maybe<CryptoKey>>((resolve) => {
      init
        .map((db) => {
          const transaction = db.transaction(
            STORAGE_KEYS.DB_STORE_NAME,
            "readonly",
          );
          const store = transaction.objectStore(STORAGE_KEYS.DB_STORE_NAME);
          const request = store.get(STORAGE_KEYS.ENCRYPTION_KEY);

          request.onsuccess = (event) => {
            const result = (event.target as IDBRequest)?.result;
            if (result && result instanceof CryptoKey) {
              this.logger.debug("Encryption key retrieved successfully");
              resolve(Just(result));
            } else {
              this.logger.debug("No encryption key found in storage");
              resolve(Nothing);
            }
          };

          request.onerror = (event) => {
            this.logger.error("Error retrieving encryption key", { event });
            resolve(Nothing);
          };
        })
        .caseOf({
          Left: (error) => {
            this.logger.error(
              "Error initializing IDB for encryption key retrieval",
              { error },
            );
            resolve(Nothing);
          },
          Right: () => {
            // Transaction handled in map callback
          },
        });
    });
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

  // Selected Account
  saveSelectedAccount(selectedAccount: Account): void {
    if (!selectedAccount) {
      return;
    }
    const accountDbModel: AccountDbModel = mapToAccountDbModel(selectedAccount);
    this.saveItem(STORAGE_KEYS.SELECTED_ACCOUNT, accountDbModel);
  }

  getSelectedAccount(): Maybe<Account> {
    const accountMaybe = this.getItem<AccountDbModel>(
      STORAGE_KEYS.SELECTED_ACCOUNT,
    );

    return accountMaybe.caseOf({
      Just: (accountDbModel) => {
        return Just({
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
        });
      },
      Nothing: () => Nothing,
    });
  }
  removeSelectedAccount(): void {
    this.removeItem(STORAGE_KEYS.SELECTED_ACCOUNT);
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
}
