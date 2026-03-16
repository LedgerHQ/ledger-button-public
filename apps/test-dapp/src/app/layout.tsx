import { ThemeToggle } from "../components";
import { Providers } from "../components/Providers";

import "./global.css";
// eslint-disable-next-line @nx/enforce-module-boundaries -- CSS must be loaded statically
import "@ledgerhq/ledger-wallet-provider/styles.css";

export const metadata = {
  title: "Ledger Button Test dApp",
  description: "Test EIP-1193 / EIP-6963 provider integration",
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
          <div className="flex flex-col min-h-screen">
            <header className="flex items-center justify-between px-24 py-12 bg-muted border-b border-muted shrink-0">
              <p className="body-2-semi-bold text-base">
                Ledger Button · Test dApp
              </p>
              <div className="flex items-center gap-12">
                <ThemeToggle />
                <div id="floating-button-container"></div>
              </div>
            </header>
            <main className="flex-1 bg-canvas">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}