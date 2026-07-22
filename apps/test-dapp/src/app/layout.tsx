import { HeaderNav, SettingsDialog, ThemeToggle } from "../components";
import { LedgerProvider } from "../components/LedgerProvider";
import { Providers } from "../components/Providers";
import { SolanaClusterProvider } from "../components/solana";

import "./global.css";
// eslint-disable-next-line @nx/enforce-module-boundaries -- CSS must be loaded statically
import "@ledgerhq/ledger-wallet-provider/styles.css";

export const metadata = {
  title: "Ledger Button Test dApp",
  description:
    "Test EIP-1193 / EIP-6963 and Solana Wallet Standard integrations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <LedgerProvider>
            <SolanaClusterProvider>
              <div className="flex min-h-screen flex-col">
                <header className="bg-muted border-muted flex shrink-0 items-center justify-between border-b px-24 py-12">
                  <div className="flex items-center gap-24">
                    <p className="body-2-semi-bold text-base">
                      Ledger Button · Test dApp
                    </p>
                    <HeaderNav />
                  </div>
                  <div className="flex items-center gap-12">
                    <SettingsDialog />
                    <ThemeToggle />
                    <div id="floating-button-container"></div>
                  </div>
                </header>
                <main className="bg-canvas flex-1">{children}</main>
              </div>
            </SolanaClusterProvider>
          </LedgerProvider>
        </Providers>
      </body>
    </html>
  );
}
