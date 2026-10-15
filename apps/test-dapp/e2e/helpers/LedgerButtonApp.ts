import type { Page } from "@playwright/test";

const DEFAULT_TIMEOUT = 15_000;

type LedgerButtonE2EBridge = {
  findByTestIds: (testIds: string[]) => Element | null;
};

declare global {
  interface Window {
    __ledgerButtonE2E?: LedgerButtonE2EBridge;
  }
}

/**
 * Runs in the browser. Deep-walks the shadow DOM tree rooted at
 * `ledger-button-app` so lookups never hit the modal backdrop or the dApp.
 */
function installLedgerButtonE2EBridge(): void {
  function deepFind(root: ParentNode, testIds: string[]): Element | null {
    for (const element of Array.from(root.querySelectorAll("*"))) {
      const testId = element.getAttribute("data-testid");
      if (testId && testIds.includes(testId)) return element;
      if (element.shadowRoot) {
        const found = deepFind(element.shadowRoot, testIds);
        if (found) return found;
      }
    }
    return null;
  }

  window.__ledgerButtonE2E = {
    findByTestIds: (testIds) => {
      const app = document.querySelector("ledger-button-app");
      return app?.shadowRoot ? deepFind(app.shadowRoot, testIds) : null;
    },
  };
}

/**
 * Page object for the Ledger Button modal (`ledger-button-app`).
 *
 * Lit components render inside nested shadow roots and the modal backdrop
 * intercepts pointer events, so interactions go through `page.evaluate`
 * instead of Playwright's actionability-checked clicks.
 */
export class LedgerButtonApp {
  constructor(private readonly page: Page) {}

  static async install(page: Page): Promise<LedgerButtonApp> {
    await page.addInitScript(installLedgerButtonE2EBridge);
    return new LedgerButtonApp(page);
  }

  async waitUntilMounted(timeout = DEFAULT_TIMEOUT): Promise<void> {
    await this.page.waitForFunction(
      () => !!document.querySelector("ledger-button-app")?.shadowRoot,
      undefined,
      { timeout },
    );
  }

  async waitForTestId(testId: string, timeout = DEFAULT_TIMEOUT): Promise<void> {
    await this.waitForAnyTestId([testId], timeout);
  }

  /**
   * Resolves with the first of `testIds` rendered in the modal, which lets a
   * test branch on whichever onboarding screen is currently displayed.
   */
  async waitForAnyTestId<T extends string>(
    testIds: readonly T[],
    timeout = DEFAULT_TIMEOUT,
  ): Promise<T> {
    const handle = await this.page.waitForFunction(
      (ids: string[]) =>
        window.__ledgerButtonE2E
          ?.findByTestIds(ids)
          ?.getAttribute("data-testid") ?? false,
      [...testIds],
      { timeout },
    );
    return (await handle.jsonValue()) as T;
  }

  /**
   * The SDK updates its context as soon as IndexedDB acknowledges the write,
   * before the transaction commits; reloading earlier can drop the progress.
   */
  async waitForPersistedOnboardingProgress(
    timeout = DEFAULT_TIMEOUT,
  ): Promise<void> {
    await this.page.waitForFunction(
      async ({ dbName, storeName, keys }) => {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open(dbName);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        try {
          if (!db.objectStoreNames.contains(storeName)) return false;
          const store = db
            .transaction(storeName, "readonly")
            .objectStore(storeName);
          const values = await Promise.all(
            keys.map(
              (key) =>
                new Promise<unknown>((resolve) => {
                  const request = store.get(key);
                  request.onsuccess = () => resolve(request.result);
                  request.onerror = () => resolve(undefined);
                }),
            ),
          );
          const [welcomeScreenCompleted, userConsent] = values;
          return welcomeScreenCompleted === true && userConsent !== undefined;
        } finally {
          db.close();
        }
      },
      {
        dbName: "ledger-button-db",
        storeName: "ledger-button-store",
        keys: ["welcomeScreenCompleted", "userConsent"],
      },
      { timeout },
    );
  }

  async isTestIdRendered(testId: string): Promise<boolean> {
    return this.page.evaluate(
      (id: string) => !!window.__ledgerButtonE2E?.findByTestIds([id]),
      testId,
    );
  }

  /**
   * Clicks the element with `testId`. When it is a custom element whose shadow
   * root holds a `<button>`, that inner button is clicked instead because Lit
   * components emit their events from it.
   */
  async clickByTestId(testId: string): Promise<void> {
    await this.page.evaluate((id: string) => {
      const element = window.__ledgerButtonE2E?.findByTestIds([id]);
      if (!element) {
        throw new Error(`[data-testid="${id}"] not found in ledger-button-app`);
      }

      const innerButton = element.shadowRoot?.querySelector("button");
      (innerButton ?? (element as HTMLElement)).click();
    }, testId);
  }

  /**
   * Waits for `testId` and clicks it in the same browser tick, for elements
   * that may re-render between a wait and a separate click (account cards).
   */
  async clickByTestIdWhenRendered(
    testId: string,
    timeout = DEFAULT_TIMEOUT,
  ): Promise<void> {
    await this.page.waitForFunction(
      (id: string) => {
        const element = window.__ledgerButtonE2E?.findByTestIds([id]);
        if (!element) return false;

        element.dispatchEvent(
          new MouseEvent("click", { bubbles: true, composed: true }),
        );
        return true;
      },
      testId,
      { timeout },
    );
  }
}
