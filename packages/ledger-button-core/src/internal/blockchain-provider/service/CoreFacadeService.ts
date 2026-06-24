import type { CoreFacade } from "../model/BlockchainProvider.js";

/**
 * DI contract for the Corefacade
 *
 * @method broadcastRPC - JSON-RPC transport to the node (reads + broadcast)
 * @method requestAccount - triggers account selection flow in core
 * @method requestSign - triggers signing flow in core
 * @method requestSwitchChain - triggers chain-switch flow in core
 * @method disconnect - tears down the session
 */
export type CoreFacadeService = CoreFacade;
