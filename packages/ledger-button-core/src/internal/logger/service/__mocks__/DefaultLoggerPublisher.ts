import { type Mock, vi } from "vitest";

import { LoggerSubscriber } from "../LoggerSubscriber";

export class DefaultLoggerPublisher {
  constructor(
    readonly subscribers: LoggerSubscriber[],
    readonly tag: string,
  ) {}
  error: Mock = vi.fn();
  warn: Mock = vi.fn();
  info: Mock = vi.fn();
  debug: Mock = vi.fn();
  fatal: Mock = vi.fn();
}
