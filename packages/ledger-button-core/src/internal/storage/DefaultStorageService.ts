import { Jwt } from "jsonwebtoken";
import { Maybe, Nothing } from "purify-ts";

import { STORAGE_KEYS } from "./model/constant.js";
import { KeyPair, StorageService } from "./StorageService.js";

export class DefaultStorageService implements StorageService {
  private jwt: Maybe<Jwt> = Nothing;
  private idb: Maybe<IDBDatabase> = Nothing;

  static formatKey(key: string) {
    return `${STORAGE_KEYS.PREFIX}-${key}`;
  }

  // IndexDB
  initIdb(): Promise<boolean> {
    if (this.idb.isJust()) {
      return Promise.resolve(true);
    }

    return new Promise<boolean>((resolve) => {
      const request = indexedDB.open(STORAGE_KEYS.DB_NAME, 3);
      request.onsuccess = (event) => {
        const idb = (event.target as IDBOpenDBRequest).result;
        this.idb = Maybe.of(idb);
        resolve(true);
        // TODO: Add logging system
        // console.log("IDB opened", event);
      };

      request.onerror = (event) => {
        // TODO: Add logging system
        console.error("Error opening IDB", event);
        resolve(false);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const store = db.createObjectStore(STORAGE_KEYS.DB_STORE_NAME);

        store.createIndex(
          STORAGE_KEYS.DB_STORE_KEYPAIR_KEY,
          STORAGE_KEYS.DB_STORE_KEYPAIR_KEY,
          { unique: true }
        );
      };
    });
  }

  async storeKeyPair(keyPair: KeyPair) {
    const success = await this.initIdb();
    if (!success) {
      // TODO: Add logging system
      console.error("Error initializing IDB");
      return Promise.resolve(false);
    }

    return new Promise<boolean>((resolve) => {
      this.idb
        .map((db) => {
          const transaction = db.transaction(
            STORAGE_KEYS.DB_STORE_NAME,
            "readwrite"
          );
          const store = transaction.objectStore(STORAGE_KEYS.DB_STORE_NAME);
          store.add(keyPair, STORAGE_KEYS.DB_STORE_KEYPAIR_KEY);
          resolve(true);
        })
        // TODO: Handle errors through reject ? She we use Maybe/Either here ?
        .orDefaultLazy(() => {
          // TODO: Add logging system
          console.log("no db");
          resolve(false);
        });
    });
  }

  async getKeyPair() {
    const success = await this.initIdb();
    if (!success) {
      return Promise.resolve(Nothing);
    }

    return new Promise<Maybe<KeyPair>>((resolve) => {
      this.idb
        .map((db) => {
          const transaction = db.transaction(
            STORAGE_KEYS.DB_STORE_NAME,
            "readonly"
          );
          const store = transaction.objectStore(STORAGE_KEYS.DB_STORE_NAME);
          const request = store.get(STORAGE_KEYS.DB_STORE_KEYPAIR_KEY);

          request.onsuccess = (event) => {
            const result = (event.target as IDBRequest)?.result;
            if (!result) {
              resolve(Nothing);
            } else {
              resolve(Maybe.of(result));
            }
          };

          request.onerror = (event) => {
            // TODO: Add logging system
            console.error("Error getting key pair", event);
            resolve(Nothing);
          };
        })
        .orDefaultLazy(() => resolve(Nothing));
    });
  }

  async removeKeyPair() {
    const success = await this.initIdb();
    if (!success) {
      return Promise.resolve(false);
    }

    return new Promise<boolean>((resolve) => {
      this.idb
        .map((db) => {
          const transaction = db.transaction(
            STORAGE_KEYS.DB_STORE_NAME,
            "readwrite"
          );
          const store = transaction.objectStore(STORAGE_KEYS.DB_STORE_NAME);
          store.delete(STORAGE_KEYS.DB_STORE_KEYPAIR_KEY);
          resolve(true);
        })
        .orDefaultLazy(() => resolve(false));
    });
  }

  async getPublicKey() {
    const success = await this.initIdb();
    if (!success) {
      return Promise.resolve(Nothing);
    }

    return new Promise<Maybe<Uint8Array>>((resolve) => {
      this.getKeyPair().then((result) => {
        if (result.isNothing()) return resolve(Nothing);

        resolve(result.map((keyPair) => keyPair.publicKey));
      });
    });
  }

  async getPrivateKey() {
    const success = await this.initIdb();
    if (!success) {
      return Promise.resolve(Nothing);
    }

    return new Promise<Maybe<Uint8Array>>((resolve) => {
      this.getKeyPair().then((result) => {
        if (result.isNothing()) return resolve(Nothing);

        resolve(result.map((keyPair) => keyPair.privateKey));
      });
    });
  }

  // JWT
  saveJWT(jwt: Jwt) {
    this.jwt = Maybe.of(jwt);
  }

  getJWT() {
    return this.jwt;
  }

  removeJWT() {
    if (this.jwt.isJust()) {
      this.jwt = Nothing;
      return true;
    }
    return false;
  }

  // LocalStorage
  setLedgerButtonItem<T>(key: string, value: T) {
    localStorage.setItem(
      DefaultStorageService.formatKey(key),
      JSON.stringify(value)
    );
  }

  removeLedgerButtonItem(key: string) {
    const formattedKey = DefaultStorageService.formatKey(key);
    if (!this.hasLedgerButtonItem(formattedKey)) {
      // TODO: Add a logger
      console.warn(`Item with key ${key} not found`);
      return false;
    }

    localStorage.removeItem(formattedKey);
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
        // TODO: Add logging system
        console.error("Error parsing item", error);
        return Nothing;
      }
    });
  }
}
