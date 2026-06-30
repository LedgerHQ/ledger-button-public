import type { CoreFacade } from "../../../api/blockchain-provider/model/CoreFacade.js";

/**
 * DI contract for the Corefacade
 *
 * @method broadcastRPC - JSON-RPC transport to the node (reads + broadcast)
 * @method requestAccount - triggers account selection flow in core
 * @method requestSwitchChain - triggers chain-switch flow in core
 * @method disconnect - tears down the session
 * @method setDisconnectHandler - wires the core-owned teardown invoked by {@link CoreFacade.disconnect}
 */
export interface CoreFacadeService extends CoreFacade {
  /**
   * Register the core-owned teardown that {@link CoreFacade.disconnect} runs.
   *
   * Session teardown (storage reset, DI container unbind/recreate, device
   * subscription cleanup) is owned by `LedgerButtonCore`, which lives outside
   * this module. It registers the handler here so a provider can trigger a full
   * disconnect through the `CoreFacade` port without depending on core itself.
   */
  setDisconnectHandler(handler: () => Promise<void>): void;
}
