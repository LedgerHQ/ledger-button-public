// TODO: Type could be temporary until we are done with the LEdger Keyring Protocol trusted app
import { Jwt } from "jsonwebtoken";
import { Maybe } from "purify-ts";

// TODO: Temporary type while we work on the trusted-app ledger-keyring-protocol
export type KeyPair = {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
};

export interface StorageService {
  getLedgerButtonItem<T>(key: string): Maybe<T>;
  setLedgerButtonItem<T>(key: string, value: T): void;
  removeLedgerButtonItem(key: string): boolean;
  hasLedgerButtonItem(key: string): boolean;
  resetLedgerButtonStorage(): void;

  storeKeyPair(keyPair: KeyPair): Promise<boolean>;
  getKeyPair(): Promise<Maybe<KeyPair>>;
  removeKeyPair(): Promise<boolean>;
  getPublicKey(): Promise<Maybe<Uint8Array>>;
  getPrivateKey(): Promise<Maybe<Uint8Array>>;

  saveJWT(jwt: Jwt): void;
  getJWT(): Maybe<Jwt>;
  removeJWT(): boolean;
}
