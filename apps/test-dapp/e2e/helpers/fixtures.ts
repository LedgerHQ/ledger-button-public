import fs from "node:fs";
import path from "node:path";

import { devices, test as base } from "@playwright/test";

import { DeviceMockServer } from "./DeviceMockServer";
import { LedgerButtonApp } from "./LedgerButtonApp";
import { OnboardingFlow } from "./OnboardingFlow";
import { TestDapp } from "./TestDapp";

const PERSISTENT_CONTEXT_ROOT = path.join(__dirname, "..", "..", ".playwright");

type E2EFixtures = {
  deviceMockServer: DeviceMockServer;
  testDapp: TestDapp;
  ledgerButtonApp: LedgerButtonApp;
  onboardingFlow: OnboardingFlow;
};

export const test = base.extend<E2EFixtures>({
  context: async ({ browserName, playwright }, use) => {
    // Every test starts from a fresh profile (IndexedDB, localStorage…) so
    // onboarding is exercised from scratch.
    fs.mkdirSync(PERSISTENT_CONTEXT_ROOT, { recursive: true });
    const profilePath = fs.mkdtempSync(
      path.join(PERSISTENT_CONTEXT_ROOT, "ledger-button-profile-"),
    );

    const desktopChrome = devices["Desktop Chrome"];
    const context = await playwright[browserName].launchPersistentContext(
      profilePath,
      {
        baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
        deviceScaleFactor: desktopChrome.deviceScaleFactor,
        hasTouch: desktopChrome.hasTouch,
        headless: false,
        isMobile: desktopChrome.isMobile,
        userAgent: desktopChrome.userAgent,
        viewport: desktopChrome.viewport,
      },
    );

    await use(context);
    await context.close();
    fs.rmSync(profilePath, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 200,
    });
  },

  page: async ({ context }, use) => {
    await use(context.pages()[0] ?? (await context.newPage()));
  },

  // Playwright requires fixtures to destructure their first argument.
  // eslint-disable-next-line no-empty-pattern
  deviceMockServer: async ({}, use) => {
    const deviceMockServer = new DeviceMockServer();
    try {
      await deviceMockServer.setUp();
      await use(deviceMockServer);
    } finally {
      await deviceMockServer.tearDown();
    }
  },

  testDapp: async ({ page, deviceMockServer }, use) => {
    const testDapp = new TestDapp(page);
    testDapp.forwardBrowserLogs();
    await testDapp.useMockServerSession(deviceMockServer.getSession());
    await use(testDapp);
  },

  ledgerButtonApp: async ({ page }, use) => {
    await use(await LedgerButtonApp.install(page));
  },

  onboardingFlow: async ({ page, ledgerButtonApp, deviceMockServer }, use) => {
    await use(new OnboardingFlow(page, ledgerButtonApp, deviceMockServer));
  },
});

export { expect } from "@playwright/test";
