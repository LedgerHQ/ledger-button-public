"use client";

import { useCallback, useState } from "react";
import { Button, Tag } from "@ledgerhq/lumen-ui-react";
import { Copy } from "@ledgerhq/lumen-ui-react/symbols";

import { MOCK_DEVICE_CONFIG, type UseMockServerReturn } from "../hooks/useMockServer";

function CopyableField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [value]);

  return (
    <div className="pt-14 border-t border-muted">
      <span className="body-2 text-muted block mb-4">{label}</span>
      <div className="flex items-start justify-between gap-8">
        <span className="body-2-semi-bold text-base font-mono break-all">
          {value}
        </span>
        <button
          onClick={handleCopy}
          className="text-muted hover:text-base transition-colors cursor-pointer shrink-0 mt-2"
          title={`Copy ${label.toLowerCase()}`}
        >
          {copied ? (
            <span className="body-4 text-success">Copied!</span>
          ) : (
            <Copy size={16} />
          )}
        </button>
      </div>
    </div>
  );
}

interface MockServerStatusBoxProps {
  mockServer: UseMockServerReturn;
}

export function MockServerStatusBox({ mockServer }: MockServerStatusBoxProps) {
  const { status, error, sessionToken, deviceId, connect, disconnect } =
    mockServer;

  if (status === "idle") {
    return (
      <div className="border border-dashed border-muted rounded-lg p-20 bg-canvas">
        <div className="flex items-center gap-10 mb-12">
          <div className="size-10 rounded-full bg-muted" />
          <span className="body-2-semi-bold text-muted uppercase tracking-wider">
            Device Mock Server
          </span>
        </div>
        <p className="body-2 text-muted mb-14">
          Not connected. Click below to acquire a session.
        </p>
        <Button appearance="accent" size="sm" onClick={connect}>
          Connect
        </Button>
      </div>
    );
  }

  if (status === "connecting") {
    return (
      <div className="border border-muted rounded-lg p-20 bg-canvas">
        <div className="flex items-center gap-10 mb-12">
          <div className="size-10 rounded-full bg-warning animate-pulse" />
          <span className="body-2-semi-bold text-muted uppercase tracking-wider">
            Device Mock Server
          </span>
        </div>
        <p className="body-2 text-muted">Acquiring session…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="border border-error rounded-lg p-20 bg-canvas">
        <div className="flex items-center gap-10 mb-12">
          <div className="size-10 rounded-full bg-error" />
          <span className="body-2-semi-bold text-muted uppercase tracking-wider">
            Device Mock Server
          </span>
        </div>
        <p className="body-2 text-error mb-4">Connection failed</p>
        {error && (
          <p className="body-4 text-muted font-mono mb-14 break-all">
            {error}
          </p>
        )}
        <Button appearance="accent" size="sm" onClick={connect}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="border border-active rounded-lg p-20 bg-canvas">
      <div className="flex items-center justify-between mb-14">
        <div className="flex items-center gap-10">
          <div className="size-10 rounded-full bg-success" />
          <span className="body-2-semi-bold text-muted uppercase tracking-wider">
            Device Mock Server
          </span>
        </div>
        <Tag appearance="success" size="sm" label="Connected" />
      </div>

      {sessionToken && (
        <CopyableField label="Session Token" value={sessionToken} />
      )}

      {deviceId && <CopyableField label="Device ID" value={deviceId} />}

      <details className="pt-14 border-t border-muted group">
        <summary className="body-2-semi-bold text-muted cursor-pointer select-none list-none flex items-center gap-6">
          <span className="transition-transform group-open:rotate-90">▶</span>
          Device Config
        </summary>
        <div className="mt-10 space-y-6 body-4 font-mono text-base">
          <p>
            <span className="text-muted">Name:</span>{" "}
            {MOCK_DEVICE_CONFIG.name}
          </p>
          <p>
            <span className="text-muted">Type:</span>{" "}
            {MOCK_DEVICE_CONFIG.device_type}
          </p>
          <p>
            <span className="text-muted">Connectivity:</span>{" "}
            {MOCK_DEVICE_CONFIG.connectivity_type}
          </p>
          <p>
            <span className="text-muted">Firmware:</span>{" "}
            {MOCK_DEVICE_CONFIG.firmware_version}
          </p>
          <div>
            <span className="text-muted">Apps:</span>
            <ul className="mt-4 ml-16 list-disc">
              {MOCK_DEVICE_CONFIG.apps.map((app) => (
                <li key={app.name}>
                  {app.name} <span className="text-muted">v{app.version}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </details>

      <div className="pt-14 border-t border-muted space-y-10">
        <p className="body-4 text-muted">
          Click the Ledger Wallet provider below to start Speculos.
        </p>
        <Button appearance="gray" size="sm" onClick={disconnect}>
          Disconnect
        </Button>
      </div>
    </div>
  );
}
