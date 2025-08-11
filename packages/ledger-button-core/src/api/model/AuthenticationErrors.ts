export class LedgerSyncAuthenticationError {
  name: string;
  message: string;
  timestamp: Date;

  constructor(message: string) {
    this.message = message;
    this.name = "LedgerSyncAuthenticationError";
    this.timestamp = new Date();
  }
}
