"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { clusterApiUrl } from "@solana/web3.js";

import { type SolanaCluster } from "./solanaCluster";

interface SolanaProvidersProps {
  cluster: SolanaCluster;
  children: ReactNode;
}

export default function SolanaProviders({
  cluster,
  children,
}: SolanaProvidersProps) {
  const endpoint = useMemo(() => clusterApiUrl(cluster), [cluster]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
