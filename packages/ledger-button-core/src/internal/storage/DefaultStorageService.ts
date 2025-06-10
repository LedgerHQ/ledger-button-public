import { StorageService } from "./StorageService.js";

export default class DefaultStorageService implements StorageService {
  private jwt: unknown;

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
  saveJWT(jwt: unknown): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getJWT() {
    return this.jwt;
  }
  removeJWT(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  setItem<T>(key: string, value: T): Promise<void> {
    throw new Error("Method not implemented.");
  }
  removeItem(key: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  has(key: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  resetStorage(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getItem<T>(key: string): Promise<T | null> {
    throw new Error("Method not implemented.");
  }
}
