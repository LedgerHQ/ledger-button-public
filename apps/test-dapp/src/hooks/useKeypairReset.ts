"use client";

import { useCallback, useEffect, useState } from "react";

const DB_NAME = "ledger-button-db";
const STORE_NAME = "ledger-button-store";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export interface UseKeypairResetReturn {
  hasKeypair: boolean;
  reset: () => Promise<void>;
}

/**
 * Tracks whether the Ledger Button keypair exists in IndexedDB and exposes a
 * `reset` that wipes it (plus `ledger-button*` localStorage keys) and reloads
 * the page, forcing a fresh onboarding.
 */
export function useKeypairReset(
  onError: (message: string) => void,
): UseKeypairResetReturn {
  const [hasKeypair, setHasKeypair] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const db = await openDb();
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.close();
          setHasKeypair(false);
          return;
        }
        const getReq = db
          .transaction(STORE_NAME, "readonly")
          .objectStore(STORE_NAME)
          .get("keyPair");
        const exists = await new Promise<boolean>((resolve) => {
          getReq.onsuccess = () => resolve(getReq.result != null);
          getReq.onerror = () => resolve(false);
        });
        db.close();
        setHasKeypair(exists);
      } catch {
        setHasKeypair(false);
      }
    })();
  }, []);

  const reset = useCallback(async () => {
    try {
      const db = await openDb();
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).clear();
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();

      Object.keys(localStorage)
        .filter((key) => key.startsWith("ledger-button"))
        .forEach((key) => localStorage.removeItem(key));

      setHasKeypair(false);
      window.location.reload();
    } catch (err) {
      onError(`Reset failed: ${(err as Error)?.message ?? String(err)}`);
    }
  }, [onError]);

  return { hasKeypair, reset };
}
