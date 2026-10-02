import type { BlockchainConfig } from "../../model/dappConfig/BlockchainConfig";

export const findBlockchainConfig = (
  blockchains: BlockchainConfig[],
  family: string,
): BlockchainConfig | undefined =>
  blockchains.find((b) => b.blockchain === family);
