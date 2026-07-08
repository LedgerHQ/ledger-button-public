const CAL_DAPPS_URL = "https://crypto-assets-service.api.ledger.com/v1/dapps";

const ETHEREUM_MAINNET_ID_PREFIX = "ethereum/";
const CONTRACT_ADDRESS_REGEX = /^0x[0-9a-f]{40}$/;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export interface SupportedDapp {
  id: string;
  contracts: string[];
}

interface CalDappEntry {
  id: string;
  contracts?: string[];
}

/**
 * Fetches the list of dApps that have clear-signing descriptors from Ledger's
 * crypto-assets-service (CAL) and keeps only Ethereum mainnet entries whose
 * contract addresses can be replayed through `eth_signRawTransaction`.
 */
export async function fetchSupportedDapps(
  apiKey: string,
): Promise<SupportedDapp[]> {
  const url = new URL(CAL_DAPPS_URL);
  url.searchParams.set("ref", "branch:main");
  url.searchParams.set("output", "id,contracts");
  url.searchParams.set("pageSize", "1000");

  const response = await fetch(url.toString(), {
    headers: { "X-Ledger-Client-Origin": apiKey },
  });
  if (!response.ok) {
    throw new Error(`CAL dapps request failed with status ${response.status}`);
  }

  const data = (await response.json()) as CalDappEntry[];

  return data
    .filter((entry) => entry.id.startsWith(ETHEREUM_MAINNET_ID_PREFIX))
    .map((entry) => ({
      id: entry.id,
      contracts: normalizeContracts(entry.contracts),
    }))
    .filter((entry) => entry.contracts.length > 0)
    .sort((a, b) => a.id.localeCompare(b.id));
}

function normalizeContracts(contracts: string[] | undefined): string[] {
  if (!contracts) {
    return [];
  }

  const normalized = contracts
    .map((contract) => {
      const lower = contract.toLowerCase();
      return lower.startsWith("0x") ? lower : `0x${lower}`;
    })
    .filter(
      (contract) =>
        CONTRACT_ADDRESS_REGEX.test(contract) && contract !== ZERO_ADDRESS,
    );

  return Array.from(new Set(normalized));
}
