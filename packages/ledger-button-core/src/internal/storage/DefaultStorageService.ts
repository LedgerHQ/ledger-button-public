import { STORAGE_KEYS } from "./model/constant.js";
import { StorageService } from "./StorageService.js";

export class DefaultStorageService implements StorageService {
  private jwt: unknown;

  static formatKey(key: string) {
    return `${STORAGE_KEYS.PREFIX}-${key}`;
  }

  // IndexDB
  storeKeyPair(keyPair: unknown): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getKeyPair(): Promise<unknown> {
    throw new Error("Method not implemented.");
  }
  removeKeyPair(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getPublicKey(): Promise<string> {
    throw new Error("Method not implemented.");
  }
  getPrivateKey(): Promise<string> {
    throw new Error("Method not implemented.");
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
    return localStorage.getItem(formattedKey) !== null;
  }

  resetLedgerButtonStorage(): void {
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
