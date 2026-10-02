"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

import { DEFAULT_SOLANA_CLUSTER, type SolanaCluster } from "./solanaCluster";

export interface SolanaClusterContextValue {
  cluster: SolanaCluster;
  setCluster: (cluster: SolanaCluster) => void;
}

const SolanaClusterContext = createContext<SolanaClusterContextValue | null>(
  null,
);

interface SolanaClusterProviderProps {
  children: ReactNode;
}

export function SolanaClusterProvider({
  children,
}: SolanaClusterProviderProps) {
  const [cluster, setCluster] = useState<SolanaCluster>(DEFAULT_SOLANA_CLUSTER);

  const value = useMemo<SolanaClusterContextValue>(
    () => ({ cluster, setCluster }),
    [cluster],
  );

  return (
    <SolanaClusterContext.Provider value={value}>
      {children}
    </SolanaClusterContext.Provider>
  );
}

export function useSolanaClusterConfig(): SolanaClusterContextValue {
  const context = useContext(SolanaClusterContext);
  if (!context) {
    throw new Error(
      "useSolanaClusterConfig must be used within a <SolanaClusterProvider>",
    );
  }
  return context;
}
