/**
 * Minimal logger surface handed to blockchain provider modules.
 *
 * Structurally compatible with core's `LoggerPublisher`, so core can hand its
 * own logger instance straight through {@link CoreFacade.getLogger} without the
 * provider importing the internal logger model.
 */
export type ProviderLogData = Record<string, unknown>;

export type ProviderLogger = {
  error(message: string, data?: ProviderLogData): void;
  warn(message: string, data?: ProviderLogData): void;
  info(message: string, data?: ProviderLogData): void;
  debug(message: string, data?: ProviderLogData): void;
  fatal(message: string, data?: ProviderLogData): void;
};
