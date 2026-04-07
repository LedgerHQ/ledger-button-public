import { injectable } from "inversify";

@injectable()
export class IsMobileUseCase {
  execute(): boolean {
    if (typeof navigator === "undefined") {
      return false;
    }
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
      navigator.userAgent,
    );
  }
}
