// TODO: Type could be temporary until we are done with the LEdger Keyring Protocol trusted app
import { KeyPair } from "@ledgerhq/device-trusted-app-kit-ledger-keyring-protocol";
import { Either, Maybe } from "purify-ts";
import { Account } from "src/api/index.js";

import { StorageIDBErrors } from "./model/errors.js";

export interface StorageService {
  getItem<T>(key: string): Maybe<T>;
  saveItem<T>(key: string, value: T): void;
  removeItem(key: string): boolean;
  hasItem(key: string): boolean;
  resetStorage(): void;

  storeKeyPair(keyPair: KeyPair): Promise<Either<StorageIDBErrors, boolean>>;
  getKeyPair(): Promise<Either<StorageIDBErrors, KeyPair>>;
  removeKeyPair(): Promise<Either<StorageIDBErrors, boolean>>;

  saveTrustChainId(trustChainId: string): void;
  getTrustChainId(): Maybe<string>;
  removeTrustChainId(): void;

  saveSelectedAccount(selectedAccount: Account | undefined): unknown;
  getSelectedAccount(): Maybe<Account>;
  removeSelectedAccount(): void;
}
