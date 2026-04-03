import { injectable } from "inversify";

@injectable()
export class IsLedgerLiveMobileUseCase {
  execute(): boolean {
    if (typeof window === "undefined") {
      return false;
    }
    if (!("ethereum" in window)) {
      return false;
    }
    const eth = (window as typeof window & { ethereum?: { isLedgerLive?: boolean } }).ethereum;
    return eth?.isLedgerLive === true;
  }
}
