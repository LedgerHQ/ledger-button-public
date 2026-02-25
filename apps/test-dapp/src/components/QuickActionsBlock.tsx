"use client";

import { Button } from "@ledgerhq/lumen-ui-react";

interface QuickActionsBlockProps {
  isConnected: boolean;
  hasAccount: boolean;
  onOpenHome: () => void;
  onOpenSettings: () => void;
  onRequestAccounts: () => void;
}

export function QuickActionsBlock({
  isConnected,
  hasAccount,
  onOpenHome,
  onOpenSettings,
  onRequestAccounts,
}: QuickActionsBlockProps) {
  return (
    <div className="border border-muted rounded-lg overflow-hidden">
      <div className="px-24 py-16 bg-muted">
        <h3 className="flex items-center gap-10 body-2-semi-bold text-base">
          <span>⚡</span>
          Quick Actions
        </h3>
      </div>

      <div className="p-24 bg-canvas">
        {!isConnected ? (
          <div className="text-center p-20 bg-muted rounded-lg border border-dashed border-muted">
            <p className="body-2 text-muted">
              Connect to a provider to access quick actions.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-12">
            <Button
              appearance="gray"
              size="md"
              onClick={onOpenHome}
              disabled={!hasAccount}
            >
              🏠 Home
            </Button>

            <Button appearance="gray" size="md" onClick={onOpenSettings}>
              ⚙️ Settings
            </Button>

            {!hasAccount && (
              <Button
                appearance="accent"
                size="md"
                onClick={onRequestAccounts}
              >
                👛 Request Accounts
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}