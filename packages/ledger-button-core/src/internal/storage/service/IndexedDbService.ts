import { Either, Maybe } from "purify-ts";

import { StorageIDBErrors } from "../model/errors.js";

export interface IndexedDbService {
  initIdb(): Promise<Either<StorageIDBErrors, IDBDatabase>>;

  storeKeyPair(keyPair: Uint8Array): Promise<Either<StorageIDBErrors, boolean>>;
  getKeyPair(): Promise<Either<StorageIDBErrors, Uint8Array>>;
  removeKeyPair(): Promise<Either<StorageIDBErrors, boolean>>;

  storeEncryptionKey(encryptionKey: CryptoKey): Promise<void>;
  getEncryptionKey(): Promise<Maybe<CryptoKey>>;
}
