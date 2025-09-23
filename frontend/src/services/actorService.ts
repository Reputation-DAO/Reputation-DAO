import { makeChildWithPlug } from '../components/canister/child';
import type { _SERVICE } from '../declarations/reputation_dao/reputation_dao.did.d.ts';
import { ensurePlugAgent, PLUG_HOST } from '../utils/plug';

/**
 * Simple actor service that uses Plug wallet
 */
class ActorService {
  /**
   * Get the Plug actor
   */
  async getActor(canisterId: string): Promise<_SERVICE> {
    await ensurePlugAgent({ host: PLUG_HOST, whitelist: [canisterId] });
    return makeChildWithPlug({ canisterId, host: PLUG_HOST });
  }

  /**
   * Check if actor is available
   */
  isActorAvailable(): boolean {
    // For Plug, we can't easily check without triggering the connection
    // This will be handled by the getActor method
    return true;
  }
}

// Create singleton instance
export const actorService = new ActorService();

// Export types
export type { _SERVICE };
