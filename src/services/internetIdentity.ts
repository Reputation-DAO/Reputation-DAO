import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';
import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from '../declarations/reputation_dao/reputation_dao.did.js';
import type { _SERVICE } from '../declarations/reputation_dao/reputation_dao.did.d.ts';
// Canister ID for the reputation DAO (playground network)
const REPUTATION_DAO_CANISTER_ID = "xblvd-yqaaa-aaaab-qaddq-cai";

// Network configuration
const getNetworkConfig = () => ({
  host: 'https://ic0.app',
  name: 'Playground Network'
});

// For playground network, we need to use the IC mainnet host
const PLAYGROUND_HOST = 'https://ic0.app';

// Internet Identity configuration
const II_DERIVATION_ORIGIN = 'https://identity.ic0.app';
const II_PROVIDER = 'https://identity.ic0.app/#authorize';

class InternetIdentityService {
  private authClient: AuthClient | null = null;
  private actor: _SERVICE | null = null;
  private principal: Principal | null = null;

  /**
   * Initialize the Internet Identity service
   */
  async initialize(): Promise<void> {
    try {
      this.authClient = await AuthClient.create({
        idleOptions: {
          idleTimeout: 1000 * 60 * 30, // 30 minutes
          disableDefaultIdleCallback: true,
        },
      });
      console.log('✅ Internet Identity service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Internet Identity:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated with Internet Identity
   */
  async isAuthenticated(): Promise<boolean> {
    if (!this.authClient) {
      await this.initialize();
    }

    try {
      const isAuthenticated = await this.authClient!.isAuthenticated();
      console.log('🔍 II Authentication check:', isAuthenticated);
      if (isAuthenticated) {
        this.principal = this.authClient!.getIdentity().getPrincipal();
        console.log('🔍 II Principal:', this.principal.toString());
        await this.createActor();
        console.log('✅ II Actor created successfully');
      }
      return isAuthenticated;
    } catch (error) {
      console.error('❌ Error checking II authentication:', error);
      return false;
    }
  }

  /**
   * Get current principal
   */
  getPrincipal(): Principal | null {
    return this.principal;
  }

  /**
   * Login with Internet Identity
   */
  async login(): Promise<Principal> {
    if (!this.authClient) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      this.authClient!.login({
        identityProvider: II_PROVIDER,
        onSuccess: async () => {
          try {
            this.principal = this.authClient!.getIdentity().getPrincipal();
            await this.createActor();
            console.log('✅ Internet Identity login successful:', this.principal.toString());
            resolve(this.principal);
          } catch (error) {
            console.error('❌ Error after II login:', error);
            reject(error);
          }
        },
        onError: (error) => {
          console.error('❌ Internet Identity login failed:', error);
          reject(error);
        },
      });
    });
  }

  /**
   * Logout from Internet Identity
   */
  async logout(): Promise<void> {
    if (!this.authClient) {
      return;
    }

    try {
      await this.authClient.logout();
      this.principal = null;
      this.actor = null;
      console.log('✅ Internet Identity logout successful');
    } catch (error) {
      console.error('❌ Internet Identity logout failed:', error);
      throw error;
    }
  }

  /**
   * Create actor for backend communication
   */
  private async createActor(): Promise<void> {
    if (!this.authClient || !this.principal) {
      throw new Error('Not authenticated with Internet Identity');
    }

    try {
      console.log('🔧 Creating II actor with canister ID:', REPUTATION_DAO_CANISTER_ID);
      console.log('🔧 Using host:', PLAYGROUND_HOST);
      
      const agent = new HttpAgent({
        identity: this.authClient.getIdentity(),
        host: PLAYGROUND_HOST,
        verifyQuerySignatures: false,
      });

      // Fetch root key for local development
      if (PLAYGROUND_HOST.includes('localhost') || PLAYGROUND_HOST.includes('127.0.0.1')) {
        console.log('🔧 Fetching root key for local development');
        await agent.fetchRootKey();
      }

      this.actor = Actor.createActor(idlFactory, {
        agent,
        canisterId: REPUTATION_DAO_CANISTER_ID,
      });

      console.log('✅ Internet Identity actor created successfully');
    } catch (error) {
      console.error('❌ Failed to create II actor:', error);
      throw error;
    }
  }

  /**
   * Get the actor for backend communication
   */
  getActor(): _SERVICE {
    if (!this.actor) {
      throw new Error('Internet Identity actor not available. Please login first.');
    }
    return this.actor;
  }

  /**
   * Check if actor is available
   */
  hasActor(): boolean {
    return this.actor !== null;
  }
}

// Create singleton instance
export const internetIdentityService = new InternetIdentityService();

// Export types
export type { _SERVICE };
