// TODO: Type could be temporary until we are done with the LEdger Keyring Protocol trusted app
import { Keypair } from "@ledgerhq/device-trusted-app-kit-ledger-keyring-protocol";
import { Either, Maybe } from "purify-ts";

import { StorageIDBErrors } from "./model/errors.js";

export interface StorageService {
  getItem<T>(key: string): Maybe<T>;
  saveItem<T>(key: string, value: T): void;
  removeItem(key: string): boolean;
  hasItem(key: string): boolean;
  resetStorage(): void;

  storeKeyPair(keyPair: Keypair): Promise<Either<StorageIDBErrors, boolean>>;
  getKeyPair(): Promise<Either<StorageIDBErrors, Keypair>>;
  removeKeyPair(): Promise<Either<StorageIDBErrors, boolean>>;

  saveTrustChainId(trustChainId: string): void;
  getTrustChainId(): Maybe<string>;
  removeTrustChainId(): void;
}
