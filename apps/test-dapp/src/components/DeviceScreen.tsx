"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { MOCK_SERVER_PROXY_PATH } from "../hooks/useMockServer";

const POLL_FAST_MS = 500;
const POLL_READY_MS = 2_000;
const POLL_SLOW_MS = 10_000;

const DEVICE_WIDTH_FALLBACK = 480;
const DEVICE_HEIGHT_FALLBACK = 600;

type SpeculosEvent = {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

function readMockSession(): { token: string; deviceId: string } | null {
  const token = localStorage.getItem("MOCK_SERVER_TOKEN");
  const deviceId = localStorage.getItem("MOCK_SERVER_DEVICE_ID");
  if (!token || !deviceId) return null;
  return { token, deviceId };
}

function getProxyUrl(): string {
  return `${window.location.origin}${MOCK_SERVER_PROXY_PATH}`;
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

type DeviceHealth = {
  alive: boolean;
  connected: boolean;
};

/**
 * Lightweight health check via GET /devices/{id}.
 * - `alive`     — the pod is up and the device exists.
 * - `connected` — the DMK has connected (Speculos is running).
 */
async function checkDeviceHealth(
  token: string,
  deviceId: string,
): Promise<DeviceHealth> {
  try {
    const res = await fetch(`${getProxyUrl()}/devices/${deviceId}`, {
      headers: authHeaders(token),
    });
    if (!res.ok) return { alive: false, connected: false };
    const body = await res.json();
    return { alive: true, connected: body?.connected === true };
  } catch {
    return { alive: false, connected: false };
  }
}

async function fetchScreenshot(
  token: string,
  deviceId: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `${getProxyUrl()}/devices/${deviceId}/speculos/screenshot`,
      { headers: authHeaders(token) },
    );
    if (!res.ok) return null;
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

/**
 * Fetch the screen elements with their bounding boxes from Speculos.
 * Returns the list of interactive elements on the current screen.
 */
async function fetchScreenEvents(
  token: string,
  deviceId: string,
): Promise<SpeculosEvent[]> {
  try {
    const res = await fetch(
      `${getProxyUrl()}/devices/${deviceId}/speculos/events?currentscreenonly=true`,
      { headers: authHeaders(token) },
    );
    if (!res.ok) return [];
    const body = (await res.json()) as { events?: SpeculosEvent[] };
    return body.events ?? [];
  } catch {
    return [];
  }
}

/**
 * Find the screen element the user actually clicked on (hit-test), then
 * return its center so the tap lands cleanly on the element.
 *
 * Priority:
 *   1. Element whose bounding box contains the click point.
 *      When several overlap, prefer the smallest (most specific).
 *   2. `null` — caller should send the raw coordinates.
 */
function findHitElement(
  events: SpeculosEvent[],
  tapX: number,
  tapY: number,
): { x: number; y: number; text: string } | null {
  const hits = events.filter(
    (e) =>
      tapX >= e.x &&
      tapX <= e.x + e.w &&
      tapY >= e.y &&
      tapY <= e.y + e.h,
  );

  if (hits.length === 0) return null;

  // Prefer the smallest element (most specific — button label, not container).
  hits.sort((a, b) => a.w * a.h - b.w * b.h);
  const best = hits[0];

  return {
    x: best.x + Math.floor(best.w / 2),
    y: best.y + Math.floor(best.h / 2),
    text: best.text,
  };
}

type SpeculosAction = "press-and-release" | "press" | "release";

async function sendTouch(
  token: string,
  deviceId: string,
  x: number,
  y: number,
  action: SpeculosAction = "press-and-release",
): Promise<void> {
  await fetch(
    `${getProxyUrl()}/devices/${deviceId}/speculos/finger`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify({ action, x, y }),
    },
  );
}

export function DeviceScreen() {
  const [src, setSrc] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const prevUrlRef = useRef<string | null>(null);

  const [position, setPosition] = useState({ right: 24, bottom: 100 });
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startRight: number;
    startBottom: number;
  } | null>(null);

  const didDragRef = useRef(false);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      didDragRef.current = false;
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startRight: position.right,
        startBottom: position.bottom,
      };

      const handleMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const dx = ev.clientX - dragRef.current.startX;
        const dy = ev.clientY - dragRef.current.startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDragRef.current = true;
        setPosition({
          right: Math.max(0, dragRef.current.startRight - dx),
          bottom: Math.max(0, dragRef.current.startBottom - dy),
        });
      };

      const handleUp = () => {
        dragRef.current = null;
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [position],
  );

  const handleHeaderClick = useCallback(() => {
    if (!didDragRef.current) setMinimized((v) => !v);
  }, []);

  // Two-phase polling:
  //   1. Health check only (GET /devices/{id}) every 10 s — no screenshot
  //      calls at all. Waits until the device reports Speculos is ready.
  //   2. Live screenshot polling every 500 ms once Speculos is confirmed up.
  //      Falls back to phase 1 if screenshots start failing.
  useEffect(() => {
    let cancelled = false;
    let streaming = false;

    const poll = async () => {
      while (!cancelled) {
        const session = readMockSession();

        if (!session) {
          setActive(false);
          setSrc(null);
          streaming = false;
          await new Promise((r) => setTimeout(r, POLL_SLOW_MS));
          continue;
        }

        if (!streaming) {
          const health = await checkDeviceHealth(
            session.token,
            session.deviceId,
          );
          if (cancelled) break;

          if (!health.alive) {
            setActive(false);
            setSrc(null);
            await new Promise((r) => setTimeout(r, POLL_SLOW_MS));
            continue;
          }

          if (!health.connected) {
            await new Promise((r) => setTimeout(r, POLL_SLOW_MS));
            continue;
          }

          const url = await fetchScreenshot(session.token, session.deviceId);
          if (cancelled) {
            if (url) URL.revokeObjectURL(url);
            break;
          }

          if (url) {
            streaming = true;
            setActive(true);
            setSrc(url);
            if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
            prevUrlRef.current = url;
            await new Promise((r) => setTimeout(r, POLL_FAST_MS));
          } else {
            await new Promise((r) => setTimeout(r, POLL_READY_MS));
          }
          continue;
        }

        const url = await fetchScreenshot(session.token, session.deviceId);
        if (cancelled) {
          if (url) URL.revokeObjectURL(url);
          break;
        }

        if (url) {
          setSrc(url);
          if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
          prevUrlRef.current = url;
          await new Promise((r) => setTimeout(r, POLL_FAST_MS));
        } else {
          streaming = false;
          setActive(false);
          setSrc(null);
          await new Promise((r) => setTimeout(r, POLL_READY_MS));
        }
      }
    };
    void poll();

    return () => {
      cancelled = true;
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
        prevUrlRef.current = null;
      }
    };
  }, []);

  // Long-press ("Hold to sign") support.
  // A short click (<HOLD_THRESHOLD_MS) sends press-and-release (tap).
  // A long press sends press on mousedown, then release on mouseup.
  const HOLD_THRESHOLD_MS = 300;
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdActiveRef = useRef(false);
  const holdCoordsRef = useRef<{ x: number; y: number } | null>(null);
  const [holding, setHolding] = useState(false);

  /**
   * Map a mouse event on the rendered image to device-native coordinates,
   * hit-test against on-screen elements, and return the best tap target.
   */
  const resolveTouch = useCallback(
    async (e: React.MouseEvent<HTMLImageElement>) => {
      const session = readMockSession();
      if (!session) return null;

      const img = e.currentTarget;
      const rect = img.getBoundingClientRect();
      const nativeW = img.naturalWidth || DEVICE_WIDTH_FALLBACK;
      const nativeH = img.naturalHeight || DEVICE_HEIGHT_FALLBACK;
      const scaleX = nativeW / rect.width;
      const scaleY = nativeH / rect.height;
      const rawX = Math.round((e.clientX - rect.left) * scaleX);
      const rawY = Math.round((e.clientY - rect.top) * scaleY);

      const events = await fetchScreenEvents(
        session.token,
        session.deviceId,
      );

      const hit = findHitElement(events, rawX, rawY);
      const coords = hit ?? { x: rawX, y: rawY, text: "(raw)" };
      return { session, coords };
    },
    [],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      e.preventDefault();
      void resolveTouch(e).then((resolved) => {
        if (!resolved) return;
        const { session, coords } = resolved;

        holdCoordsRef.current = { x: coords.x, y: coords.y };
        holdActiveRef.current = false;

        holdTimerRef.current = setTimeout(() => {
          holdActiveRef.current = true;
          setHolding(true);
          void sendTouch(
            session.token,
            session.deviceId,
            coords.x,
            coords.y,
            "press",
          );
        }, HOLD_THRESHOLD_MS);
      });
    },
    [resolveTouch],
  );

  const handleMouseUp = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    const session = readMockSession();
    const coords = holdCoordsRef.current;

    if (holdActiveRef.current && session && coords) {
      void sendTouch(session.token, session.deviceId, coords.x, coords.y, "release");
    }

    holdActiveRef.current = false;
    holdCoordsRef.current = null;
    setHolding(false);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      if (holding) return;

      void resolveTouch(e).then((resolved) => {
        if (!resolved) return;
        const { session, coords } = resolved;
        void sendTouch(session.token, session.deviceId, coords.x, coords.y);
      });
    },
    [resolveTouch, holding],
  );

  if (!active) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: position.bottom,
        right: position.right,
        zIndex: 10010,
        width: minimized ? "auto" : 340,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 12px",
          background: "#1a1a1a",
          color: "#fff",
          borderRadius: minimized ? "8px" : "8px 8px 0 0",
          fontSize: 12,
          fontFamily: "monospace",
          cursor: "grab",
          userSelect: "none",
        }}
        onMouseDown={handleDragStart}
        onClick={handleHeaderClick}
      >
        <span>📱 Speculos – Ledger Flex</span>
        <span>{minimized ? "▲" : "▼"}</span>
      </div>

      {!minimized && (
        <div
          style={{
            background: "#000",
            borderRadius: "0 0 8px 8px",
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          {src ? (
            <div style={{ position: "relative" }}>
              <img
                src={src}
                alt="Speculos device screen"
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleClick}
                style={{
                  display: "block",
                  width: "100%",
                  height: "auto",
                  cursor: holding ? "grabbing" : "pointer",
                }}
                draggable={false}
              />
              {holding && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 8,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(0,0,0,0.75)",
                    color: "#4caf50",
                    padding: "4px 12px",
                    borderRadius: 12,
                    fontSize: 11,
                    fontFamily: "monospace",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                  }}
                >
                  ✋ Holding… release to confirm
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                width: "100%",
                aspectRatio: `${DEVICE_WIDTH_FALLBACK} / ${DEVICE_HEIGHT_FALLBACK}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#888",
                fontSize: 13,
              }}
            >
              Waiting for Speculos…
            </div>
          )}
          <div
            style={{
              padding: "4px 12px 6px",
              color: "#888",
              fontSize: 11,
              fontFamily: "monospace",
              textAlign: "center",
            }}
          >
            Click to tap · Hold to sign · {DEVICE_WIDTH_FALLBACK}×
            {DEVICE_HEIGHT_FALLBACK}
          </div>
        </div>
      )}
    </div>
  );
}
