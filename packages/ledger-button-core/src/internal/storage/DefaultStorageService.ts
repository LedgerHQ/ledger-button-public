import { Maybe, Nothing } from "purify-ts";

import { STORAGE_KEYS } from "./model/constant.js";
import { KeyPair, StorageService } from "./StorageService.js";

export class DefaultStorageService implements StorageService {
  private jwt: unknown;
  private idb: Maybe<IDBDatabase> = Nothing;

  static formatKey(key: string) {
    return `${STORAGE_KEYS.PREFIX}-${key}`;
  }

  initIdb(): Promise<boolean> {
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

  // IndexDB
  async storeKeyPair(keyPair: KeyPair) {
    if (this.idb.isNothing()) {
      const success = await this.initIdb();
      if (!success) {
        // TODO: Add logging system
        console.error("Error initializing IDB");
        return Promise.resolve(false);
      }
    }

    return new Promise<boolean>((resolve) => {
      const objectStore = { keyPair };
      this.idb
        .map((db) => {
          const transaction = db.transaction(
            STORAGE_KEYS.DB_STORE_NAME,
            "readwrite"
          );
          const store = transaction.objectStore(STORAGE_KEYS.DB_STORE_NAME);
          store.add(objectStore, STORAGE_KEYS.DB_STORE_KEYPAIR_KEY);
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
    if (this.idb.isNothing()) {
      const success = await this.initIdb();
      if (!success) {
        // TODO: Add logging system
        console.error("Error initializing IDB");
        return Promise.resolve(Nothing);
      }
    }

    return new Promise<Maybe<{ keyPair: KeyPair }>>((resolve) => {
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
    if (this.idb.isNothing()) {
      const success = await this.initIdb();
      if (!success) {
        // TODO: Add logging system
        console.error("Error initializing IDB");
        return Promise.resolve(false);
      }
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
    if (this.idb.isNothing()) {
      const success = await this.initIdb();
      if (!success) {
        // TODO: Add logging system
        console.error("Error initializing IDB");
        return Promise.resolve(Nothing);
      }
    }

    return new Promise<Maybe<Uint8Array>>((resolve) => {
      this.getKeyPair().then((result) => {
        if (result.isNothing()) return resolve(Nothing);

        resolve(result.map(({ keyPair }) => keyPair.publicKey));
      });
    });
  }

  async getPrivateKey() {
    if (this.idb.isNothing()) {
      const success = await this.initIdb();
      if (!success) {
        // TODO: Add logging system
        console.error("Error initializing IDB");
        return Promise.resolve(Nothing);
      }
    }

    return new Promise<Maybe<Uint8Array>>((resolve) => {
      this.getKeyPair().then((result) => {
        if (result.isNothing()) return resolve(Nothing);

        resolve(result.map(({ keyPair }) => keyPair.privateKey));
      });
    });
  }

  // JWT
  saveJWT(jwt: unknown): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getJWT() {
    return this.jwt;
  }
  removeJWT(): Promise<void> {
    throw new Error("Method not implemented.");
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
      return;
    }

    localStorage.removeItem(formattedKey);
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

  getLedgerButtonItem<T>(key: string): T | null {
    const formattedKey = DefaultStorageService.formatKey(key);
    const item = JSON.parse(localStorage.getItem(formattedKey) ?? "null");
    if (!item) {
      // TODO: Add a logger
      console.warn(`Item with key ${key} not found`);
      return null;
    }

    return item as T;
  }
}
