"use client";

import { createContext, type ReactNode, useContext } from "react";

import { useMockServer, type UseMockServerReturn } from "../hooks/useMockServer";
import { useLedgerContext } from "./LedgerProvider";

const MockServerContext = createContext<UseMockServerReturn | null>(null);

interface MockServerProviderProps {
  children: ReactNode;
}

/**
 * Owns the device mock server session for the whole app. Mounting it per page
 * re-ran the stored-session restore on every navigation, which reinitialized
 * the Ledger provider and dropped the open device session.
 */
export function MockServerProvider({ children }: MockServerProviderProps) {
  const { reinitialize } = useLedgerContext();
  const mockServer = useMockServer(reinitialize);

  return (
    <MockServerContext.Provider value={mockServer}>
      {children}
    </MockServerContext.Provider>
  );
}

export function useMockServerContext(): UseMockServerReturn {
  const context = useContext(MockServerContext);
  if (!context) {
    throw new Error(
      "useMockServerContext must be used within a <MockServerProvider>",
    );
  }
  return context;
}
