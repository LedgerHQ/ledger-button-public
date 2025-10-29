import { Either, Maybe } from "purify-ts";

import { StorageIDBErrors } from "./model/errors.js";
import { Account } from "../account/service/AccountService.js";

export interface StorageService {
  setDbVersion(version: number): void;
  getDbVersion(): number;
  getItem<T>(key: string): Maybe<T>;
  saveItem<T>(key: string, value: T): void;
  removeItem(key: string): boolean;
  hasItem(key: string): boolean;
  resetStorage(): void;

  storeKeyPair(keyPair: Uint8Array): Promise<Either<StorageIDBErrors, boolean>>;
  getKeyPair(): Promise<Either<StorageIDBErrors, Uint8Array>>;
  removeKeyPair(): Promise<Either<StorageIDBErrors, boolean>>;

  saveTrustChainId(trustChainId: string): void;
  getTrustChainId(): Maybe<string>;
  isTrustChainValid(): boolean;
  removeTrustChainId(): void;

  saveSelectedAccount(selectedAccount: Account): unknown;
  getSelectedAccount(): Maybe<Account>;
  removeSelectedAccount(): void;

  storeEncryptionKey(encryptionKey: CryptoKey): Promise<void>;
  getEncryptionKey(): Promise<Maybe<CryptoKey>>;
}
