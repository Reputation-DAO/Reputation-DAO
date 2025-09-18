import { internetIdentityService } from './internetIdentity';
import { getPlugActor } from '../components/canister/reputationDao';
import type { _SERVICE } from '../declarations/reputation_dao/reputation_dao.did.d.ts';

/**
 * Unified actor service that automatically uses the correct authentication method
 * This ensures that Plug wallet actor doesn't pop up when using Internet Identity
 */
class ActorService {
  private currentAuthMethod: 'plug' | 'internet-identity' | null = null;

  /**
   * Set the current authentication method
   */
  setAuthMethod(method: 'plug' | 'internet-identity' | null) {
    this.currentAuthMethod = method;
    console.log('🔧 Actor service auth method set to:', method);
  }

  /**
   * Get the appropriate actor based on current authentication method
   */
  async getActor(): Promise<_SERVICE> {
    if (this.currentAuthMethod === 'internet-identity') {
      // Use Internet Identity actor
      if (!internetIdentityService.hasActor()) {
        throw new Error('Internet Identity actor not available. Please login first.');
      }
      return internetIdentityService.getActor();
    } else if (this.currentAuthMethod === 'plug') {
      // Use Plug actor
      return await getPlugActor();
    } else {
      throw new Error('No authentication method set. Please login first.');
    }
  }

  /**
   * Check if actor is available for current auth method
   */
  isActorAvailable(): boolean {
    if (this.currentAuthMethod === 'internet-identity') {
      return internetIdentityService.hasActor();
    } else if (this.currentAuthMethod === 'plug') {
      // For Plug, we can't easily check without triggering the connection
      // This will be handled by the getActor method
      return true;
    }
    return false;
  }

  /**
   * Get current authentication method
   */
  getCurrentAuthMethod(): 'plug' | 'internet-identity' | null {
    return this.currentAuthMethod;
  }
}

// Create singleton instance
export const actorService = new ActorService();

// Export types
export type { _SERVICE };
