import type { CoreFacade } from "../../../api/blockchain-provider/model/CoreFacade.js";
import type { BlockchainFamily } from "../../../api/blockchain-provider/model/types.js";

/**
 * DI contract for the Corefacade
 *
 * @method broadcastRPC - JSON-RPC transport to the node (reads + broadcast)
 * @method requestAccount - triggers account selection flow in core
 * @method requestSwitchChain - triggers chain-switch flow in core
 * @method disconnect - drops the calling family's selected account (full teardown when none remain)
 * @method setDisconnectHandler - wires the core-owned teardown invoked by {@link CoreFacade.disconnect}
 */
export interface CoreFacadeService extends CoreFacade {
  /**
   * Register the core-owned disconnect that {@link CoreFacade.disconnect} runs.
   *
   * Removing a family's selected account and, once none remain, tearing the
   * session down (storage reset, DI container unbind/recreate, device
   * subscription cleanup) is owned by `LedgerButtonCore`, which lives outside
   * this module. It registers the handler here so a provider can trigger a
   * disconnect through the `CoreFacade` port without depending on core itself.
   */
  setDisconnectHandler(
    handler: (family: BlockchainFamily) => Promise<void>,
  ): void;
}
