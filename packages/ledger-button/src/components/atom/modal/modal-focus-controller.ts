import { ReactiveController, ReactiveControllerHost } from "lit";

const FOCUSABLE_SELECTORS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export class ModalFocusController implements ReactiveController {
  private previousActiveElement: Element | null = null;
  private boundHandleKeydown: (event: KeyboardEvent) => void;
  private onEscapeCallback: (() => void) | null = null;
  private containerElement: HTMLElement | null = null;
  private isActive = false;

  constructor(private readonly host: ReactiveControllerHost) {
    this.host.addController(this);
    this.boundHandleKeydown = this.handleKeydown.bind(this);
  }

  hostConnected(): void {
    document.addEventListener("keydown", this.boundHandleKeydown);
  }

  hostDisconnected(): void {
    document.removeEventListener("keydown", this.boundHandleKeydown);
    this.deactivate();
  }

  activate(container: HTMLElement, onEscape: () => void): void {
    this.containerElement = container;
    this.onEscapeCallback = onEscape;
    this.isActive = true;
    this.previousActiveElement = document.activeElement;

    this.focusFirstElement();
  }

  deactivate(): void {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;
    this.containerElement = null;
    this.onEscapeCallback = null;

    if (
      this.previousActiveElement &&
      this.previousActiveElement instanceof HTMLElement
    ) {
      this.previousActiveElement.focus();
    }

    this.previousActiveElement = null;
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (!this.isActive) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      this.onEscapeCallback?.();
      return;
    }

    if (event.key === "Tab") {
      this.handleTabKey(event);
    }
  }

  private handleTabKey(event: KeyboardEvent): void {
    if (!this.containerElement) {
      return;
    }

    const focusableElements = this.getFocusableElements();

    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = this.deepActiveElement();

    if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  private deepActiveElement(): Element | null {
    let el: Element | null = document.activeElement;
    while (el?.shadowRoot?.activeElement) {
      el = el.shadowRoot.activeElement;
    }
    return el;
  }

  private getFocusableElements(): HTMLElement[] {
    if (!this.containerElement) {
      return [];
    }

    return this.collectFocusableElements(this.containerElement);
  }

  private collectFocusableElements(root: Element | ShadowRoot): HTMLElement[] {
    const results: HTMLElement[] = [];

    for (const el of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
      if (el instanceof HTMLSlotElement) {
        for (const assigned of el.assignedElements({ flatten: true })) {
          results.push(...this.collectFocusableElements(assigned));
        }
        continue;
      }

      if (
        el.matches(FOCUSABLE_SELECTORS) &&
        el.offsetParent !== null &&
        !el.hasAttribute("inert")
      ) {
        results.push(el);
      }

      if (el.shadowRoot) {
        results.push(...this.collectFocusableElements(el.shadowRoot));
      }
    }

    return results;
  }

  private focusFirstElement(): void {
    if (!this.containerElement) {
      return;
    }

    const toolbar = this.containerElement.querySelector("ledger-toolbar");

    if (toolbar instanceof HTMLElement) {
      toolbar.focus();
      return;
    }

    const focusableElements = this.getFocusableElements();
    const [firstElement] = focusableElements;

    if (firstElement) {
      firstElement.focus();
    }
  }
}
