import type { BlockchainNetwork } from "@ledgerhq/ledger-wallet-provider-core";

// Must stay in sync with the key used by DefaultStorageService in ledger-button-core.
const STORAGE_KEY = "ledger-button-configOverrides";

type ConfigOverrides = {
  networkOverrides: Record<string, BlockchainNetwork[]>;
};

const DEFAULT: ConfigOverrides = { networkOverrides: {} };

function read(): ConfigOverrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...(JSON.parse(raw) as Partial<ConfigOverrides>) };
  } catch {
    return DEFAULT;
  }
}

function write(overrides: ConfigOverrides): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

export function getNetworkOverrides(blockchainId: string): BlockchainNetwork[] {
  return read().networkOverrides[blockchainId] ?? [];
}

export function addNetworkOverride(
  blockchainId: string,
  network: BlockchainNetwork,
): void {
  const current = read();
  const existing = current.networkOverrides[blockchainId] ?? [];
  write({
    ...current,
    networkOverrides: {
      ...current.networkOverrides,
      [blockchainId]: [...existing, network],
    },
  });
}

export function resetNetworkOverrides(blockchainId: string): void {
  const current = read();
  write({
    ...current,
    networkOverrides: { ...current.networkOverrides, [blockchainId]: [] },
  });
}

export function hasNetworkOverrides(blockchainId: string): boolean {
  return getNetworkOverrides(blockchainId).length > 0;
}
