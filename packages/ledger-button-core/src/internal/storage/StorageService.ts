export interface StorageService {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  resetStorage(): Promise<void>;

  storeKeyPair(keyPair: unknown): Promise<void>;
  getKeyPair(): Promise<unknown>;
  removeKeyPair(): Promise<void>;
  getPublicKey(): Promise<string>;
  getPrivateKey(): Promise<string>;

  saveJWT(jwt: unknown):void;
  getJWT(): unknown;
  removeJWT(): void;
}
