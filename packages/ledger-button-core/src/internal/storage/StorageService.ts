export interface StorageService {
  getLedgerButtonItem<T>(key: string): T | null;
  setLedgerButtonItem<T>(key: string, value: T): void;
  removeLedgerButtonItem(key: string): void;
  hasLedgerButtonItem(key: string): boolean;
  resetLedgerButtonStorage(): void;

  storeKeyPair(keyPair: unknown): Promise<void>;
  getKeyPair(): Promise<unknown>;
  removeKeyPair(): Promise<void>;
  getPublicKey(): Promise<string>;
  getPrivateKey(): Promise<string>;

  saveJWT(jwt: unknown): void;
  getJWT(): unknown;
  removeJWT(): void;
}
