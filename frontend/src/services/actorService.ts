import { getPlugActor } from './childCanisterService';
import type { _SERVICE } from '../declarations/reputation_dao/reputation_dao.did.d.ts';

/**
 * Simple actor service that uses Plug wallet
 */
class ActorService {
  /**
   * Get the Plug actor
   */
  async getActor(): Promise<_SERVICE> {
    return await getPlugActor();
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
