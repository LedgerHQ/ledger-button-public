"use client";

import { createContext, useContext } from "react";
import { type createSolanaRpc } from "@solana/kit";

import { type SolanaChain, type SolanaCluster } from "./solanaCluster";

export type SolanaRpc = ReturnType<typeof createSolanaRpc>;

export interface SolanaChainContextValue {
  cluster: SolanaCluster;
  chain: SolanaChain;
  rpc: SolanaRpc;
}

export const SolanaChainContext = createContext<SolanaChainContextValue | null>(
  null,
);

export function useSolanaChain(): SolanaChainContextValue {
  const context = useContext(SolanaChainContext);
  if (!context) {
    throw new Error("useSolanaChain must be used within <SolanaProviders>");
  }
  return context;
}
