"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MockClient } from "@ledgerhq/device-mockserver-client";

import { flex, MOCK_SERVER_URL, TEST_SEED } from "../mock-server";

const STORAGE_KEY_TOKEN = "MOCK_SERVER_TOKEN";
const STORAGE_KEY_ENV = "LEDGER_ENVIRONMENT";
const STORAGE_KEY_DEVICE_ID = "MOCK_SERVER_DEVICE_ID";

export type MockServerStatus = "idle" | "connecting" | "connected" | "error";

export interface UseMockServerReturn {
  status: MockServerStatus;
  error: string | null;
  sessionToken: string | null;
  deviceId: string | null;
  connect: () => void;
  disconnect: () => void;
}

/**
 * Check whether the stored session and device still exist.
 * Uses the device info endpoint — NOT Speculos (which returns 409 until
 * the DMK connects).
 */
async function isSessionAlive(
  token: string,
  deviceId: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${MOCK_SERVER_URL}/devices/${deviceId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function useMockServer(reinitialize: () => void): UseMockServerReturn {
  const [status, setStatus] = useState<MockServerStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const clientRef = useRef<MockClient | null>(null);
  const initDoneRef = useRef(false);
  const reinitializeRef = useRef(reinitialize);
  reinitializeRef.current = reinitialize;

  const teardown = useCallback(async () => {
    try {
      if (clientRef.current) {
        await clientRef.current.disconnectAll();
        await clientRef.current.disposeSession();
      }
    } catch {
      // Session may already be gone — ignore.
    }
    clientRef.current = null;
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_ENV);
    localStorage.removeItem(STORAGE_KEY_DEVICE_ID);
    setSessionToken(null);
    setDeviceId(null);
    setStatus("idle");
    setError(null);
  }, []);

  const setup = useCallback(async () => {
    setStatus("connecting");
    setError(null);

    try {
      const apiUrl = MOCK_SERVER_URL;
      const client = new MockClient(apiUrl);
      const token = await client.authenticate();

      const seedResponse = await fetch(`${apiUrl}/sessions/current/seed`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ seed: TEST_SEED }),
      });
      if (!seedResponse.ok) {
        throw new Error(
          `Seed override failed: ${seedResponse.status} ${await seedResponse.text()}`,
        );
      }

      const device = await client.addDevice({ ...flex });

      clientRef.current = client;
      localStorage.setItem(STORAGE_KEY_TOKEN, token);
      localStorage.setItem(STORAGE_KEY_ENV, "staging");
      localStorage.setItem(STORAGE_KEY_DEVICE_ID, device.id);
      setSessionToken(token);
      setDeviceId(device.id);
      setStatus("connected");
      reinitializeRef.current();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setStatus("error");
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_ENV);
      localStorage.removeItem(STORAGE_KEY_DEVICE_ID);
      setSessionToken(null);
      setDeviceId(null);
      reinitializeRef.current();
    }
  }, []);

  // On mount: try to reuse a stored session, otherwise stay idle.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (initDoneRef.current) return;
    initDoneRef.current = true;

    const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
    const storedDeviceId = localStorage.getItem(STORAGE_KEY_DEVICE_ID);

    if (storedToken && storedDeviceId) {
      setStatus("connecting");
      void isSessionAlive(storedToken, storedDeviceId).then((alive) => {
        if (alive) {
          clientRef.current = new MockClient(MOCK_SERVER_URL, {
            token: storedToken,
          });
          setSessionToken(storedToken);
          setDeviceId(storedDeviceId);
          setStatus("connected");
          reinitializeRef.current();
        } else {
          localStorage.removeItem(STORAGE_KEY_TOKEN);
          localStorage.removeItem(STORAGE_KEY_ENV);
          localStorage.removeItem(STORAGE_KEY_DEVICE_ID);
          setStatus("idle");
          reinitializeRef.current();
        }
      });
    }
  }, []);

  const connect = useCallback(() => {
    void setup();
  }, [setup]);

  const disconnect = useCallback(() => {
    void teardown().then(() => {
      reinitialize();
    });
  }, [teardown, reinitialize]);

  return { status, error, sessionToken, deviceId, connect, disconnect };
}
