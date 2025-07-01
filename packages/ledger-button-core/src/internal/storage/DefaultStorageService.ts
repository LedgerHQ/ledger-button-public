import { type Factory, inject, injectable } from "inversify";
import { Jwt } from "jsonwebtoken";
import { Either, Just, Left, Maybe, Nothing, Right } from "purify-ts";

import { STORAGE_KEYS } from "./model/constant.js";
import {
  StorageIDBErrors,
  StorageIDBGetError,
  StorageIDBNotInitializedError,
  StorageIDBOpenError,
  StorageIDBRemoveError,
  StorageIDBStoreError,
} from "./model/errors.js";
import { loggerModuleTypes } from "../logger/loggerModuleTypes.js";
import { type LoggerPublisher } from "../logger/service/LoggerPublisher.js";
import { KeyPair, StorageService } from "./StorageService.js";

@injectable()
export class DefaultStorageService implements StorageService {
  private readonly logger: LoggerPublisher;
  private jwt: Maybe<Jwt> = Nothing;
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

  async storeKeyPair(keyPair: KeyPair) {
    const init = await this.initIdb();

    return new Promise<Either<StorageIDBErrors, boolean>>((resolve) => {
      init.map((db) => {
        const transaction = db.transaction(
          STORAGE_KEYS.DB_STORE_NAME,
          "readwrite",
        );
        const store = transaction.objectStore(STORAGE_KEYS.DB_STORE_NAME);
        const request = store.add(keyPair, STORAGE_KEYS.DB_STORE_KEYPAIR_KEY);

        request.onsuccess = () => {
          this.logger.debug("Key pair stored", { keyPair });
          resolve(Right(true));
        };

        request.onerror = (event) => {
          this.logger.error("Error storing key pair", { event });
          resolve(
            Left(
              new StorageIDBStoreError("Error storing key pair", {
                event,
                // keyPair,
              }),
            ),
          );
        };
      });
    });
  }

  async getKeyPair() {
    const init = await this.initIdb();

    return new Promise<Either<StorageIDBErrors, KeyPair>>((resolve) => {
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
            this.logger.error("Error getting key pair", { event });
            resolve(
              Left(new StorageIDBGetError("Error getting key pair", { event })),
            );

            return;
          }

          this.logger.debug("Key pair retrieved", { result });
          resolve(Right(result));
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

  async getPublicKey() {
    return (await this.getKeyPair()).map((kp) => kp.publicKey);
  }

  async getPrivateKey() {
    return (await this.getKeyPair()).map((kp) => kp.privateKey);
  }

  // JWT
  saveJWT(jwt: Jwt) {
    // NOTE: Add checks for jwt validity ?
    if (jwt) {
      this.jwt = Maybe.of(jwt);
      this.logger.debug("JWT saved");
      return;
    }
  }

  getJWT() {
    return this.jwt;
  }

  removeJWT() {
    if (this.jwt.isJust()) {
      this.jwt = Nothing;
    }
  }

  // LocalStorage
  setLedgerButtonItem<T>(key: string, value: T) {
    localStorage.setItem(
      DefaultStorageService.formatKey(key),
      JSON.stringify(value),
    );
  }

  removeLedgerButtonItem(key: string) {
    const formattedKey = DefaultStorageService.formatKey(key);
    if (!this.hasLedgerButtonItem(formattedKey)) {
      this.logger.debug("Item not found", { key });
      return false;
    }

    localStorage.removeItem(formattedKey);
    this.logger.debug("Item removed", { key });
    return true;
  }

  hasLedgerButtonItem(key: string) {
    const formattedKey = DefaultStorageService.formatKey(key);
    const item = localStorage.getItem(formattedKey);
    return item !== null;
  }

  resetLedgerButtonStorage() {
    for (const key in localStorage) {
      if (key.startsWith(STORAGE_KEYS.PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  }

  getLedgerButtonItem<T>(key: string): Maybe<T> {
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
