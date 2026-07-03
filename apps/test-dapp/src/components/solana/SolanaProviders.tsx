"use client";

import { type ReactNode, useMemo } from "react";
import { createSolanaRpc } from "@solana/kit";
import { SelectedWalletAccountContextProvider } from "@solana/react";
import { type UiWallet } from "@wallet-standard/react";

import { SolanaChainContext } from "./solanaChainContext";
import {
  getSolanaChain,
  getSolanaRpcUrl,
  type SolanaCluster,
} from "./solanaCluster";

const SELECTED_WALLET_STORAGE_KEY = "test-dapp:selected-solana-wallet";

const stateSync = {
  deleteSelectedWallet: () =>
    localStorage.removeItem(SELECTED_WALLET_STORAGE_KEY),
  getSelectedWallet: () => localStorage.getItem(SELECTED_WALLET_STORAGE_KEY),
  storeSelectedWallet: (accountKey: string) =>
    localStorage.setItem(SELECTED_WALLET_STORAGE_KEY, accountKey),
};

function walletSupportsSolana(wallet: UiWallet): boolean {
  return wallet.chains.some((chain) => chain.startsWith("solana:"));
}

interface SolanaProvidersProps {
  cluster: SolanaCluster;
  children: ReactNode;
}

export default function SolanaProviders({
  cluster,
  children,
}: SolanaProvidersProps) {
  const chainValue = useMemo(
    () => ({
      cluster,
      chain: getSolanaChain(cluster),
      rpc: createSolanaRpc(getSolanaRpcUrl(cluster)),
    }),
    [cluster],
  );

  return (
    <SolanaChainContext.Provider value={chainValue}>
      <SelectedWalletAccountContextProvider
        filterWallets={walletSupportsSolana}
        stateSync={stateSync}
      >
        {children}
      </SelectedWalletAccountContextProvider>
    </SolanaChainContext.Provider>
  );
}
