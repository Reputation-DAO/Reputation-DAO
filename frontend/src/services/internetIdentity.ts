import { AuthClient } from '@dfinity/auth-client';
import type { Identity } from '@dfinity/agent';
import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from '../../../src/declarations/reputation_dao/reputation_dao.did.js';
import type { _SERVICE } from '../../../src/declarations/reputation_dao/reputation_dao.did.d.ts';

// Configuration
const INTERNET_IDENTITY_URL = 'https://identity.ic0.app'; // Always use production II
const HOST = 'https://ic0.app'; // Always use production IC
const CANISTER_ID = 'owyeu-jiaaa-aaaam-qdvwq-cai'; // Your canister ID

interface AuthState {
  isAuthenticated: boolean;
  identity: Identity | null;
  principal: string | null;
  actor: _SERVICE | null;
}

class InternetIdentityService {
  private authClient: AuthClient | null = null;
  private actor: _SERVICE | null = null;
  private identity: Identity | null = null;

  async init(): Promise<AuthClient> {
    if (!this.authClient) {
      this.authClient = await AuthClient.create({
        idleOptions: {
          disableIdle: true,
          disableDefaultIdleCallback: true
        }
      });
    }
    return this.authClient;
  }

  async login(): Promise<AuthState> {
    const authClient = await this.init();
    
    return new Promise((resolve, reject) => {
      authClient.login({
        identityProvider: INTERNET_IDENTITY_URL,
        onSuccess: async () => {
          try {
            const identity = authClient.getIdentity();
            const principal = identity.getPrincipal().toString();
            
            // Create HTTP agent with the authenticated identity
            const agent = new HttpAgent({
              host: HOST,
              identity: identity,
            });

            // Note: No need to fetch root key for production IC

            // Create actor with authenticated identity
            const actor = Actor.createActor(idlFactory, {
              agent,
              canisterId: CANISTER_ID,
            }) as _SERVICE;

            this.identity = identity;
            this.actor = actor;

            const authState: AuthState = {
              isAuthenticated: true,
              identity: identity,
              principal: principal,
              actor: actor
            };

            resolve(authState);
          } catch (error) {
            console.error('Error creating authenticated actor:', error);
            reject(error);
          }
        },
        onError: (error) => {
          console.error('Internet Identity login failed:', error);
          reject(error);
        }
      });
    });
  }

  async logout(): Promise<void> {
    const authClient = await this.init();
    await authClient.logout();
    this.identity = null;
    this.actor = null;
  }

  async isAuthenticated(): Promise<boolean> {
    const authClient = await this.init();
    return await authClient.isAuthenticated();
  }

  async getAuthState(): Promise<AuthState> {
    const authClient = await this.init();
    const isAuth = await authClient.isAuthenticated();
    
    if (!isAuth) {
      return {
        isAuthenticated: false,
        identity: null,
        principal: null,
        actor: null
      };
    }

    const identity = authClient.getIdentity();
    const principal = identity.getPrincipal().toString();

    // Create actor if not already created
    if (!this.actor) {
      const agent = new HttpAgent({
        host: HOST,
        identity: identity,
      });

      // Note: No need to fetch root key for production IC

      this.actor = Actor.createActor(idlFactory, {
        agent,
        canisterId: CANISTER_ID,
      }) as _SERVICE;
    }

    return {
      isAuthenticated: true,
      identity: identity,
      principal: principal,
      actor: this.actor
    };
  }

  getActor(): _SERVICE | null {
    return this.actor;
  }

  getIdentity(): Identity | null {
    return this.identity;
  }
}

// Export singleton instance
export const internetIdentityService = new InternetIdentityService();
export type { AuthState };
