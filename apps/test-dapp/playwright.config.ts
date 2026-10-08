import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the test-dapp Device Mock Server e2e tests.
 *
 * Run:
 *   pnpm nx e2e @ledgerhq/test-dapp
 *
 * Or directly (requires the dApp to already be running on port 3000):
 *   pnpm --filter @ledgerhq/test-dapp exec playwright test
 */
export default defineConfig({
  testDir: "./e2e/specs",
  timeout: 180_000,
  retries: 0,
  // Headed runs against a shared Device Mock Server: one browser at a time.
  workers: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    headless: false,
    trace: "on",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    // Run Next.js directly rather than through `nx dev` to avoid Nx's
    // interactive TTY renderer, which exits with code 130 when Playwright
    // does not attach a TTY.
    command:
      "pnpm --filter @ledgerhq/test-dapp exec next dev --webpack --port 3000",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
