import { type Mock, vi } from "vitest";

export class ConsoleLoggerSubscriber {
  log: Mock = vi.fn();
}
