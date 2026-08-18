export const blockchainProviderModuleTypes = {
  BlockchainProviderManager: Symbol.for("BlockchainProviderManager"),
  /**
   * Lazy factory used by collaborators that are themselves dependencies of the
   * manager (e.g. ContextService) to break the construction cycle.
   */
  BlockchainProviderManagerFactory: Symbol.for(
    "BlockchainProviderManagerFactory",
  ),
  CoreFacadeService: Symbol.for("CoreFacadeService"),
} as const;
