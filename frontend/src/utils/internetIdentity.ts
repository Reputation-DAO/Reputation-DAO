// utils/internetIdentity.ts
// Internet Identity authentication utilities for Reputation DAO

import { AuthClient } from '@dfinity/auth-client';
import { HttpAgent } from '@dfinity/agent';
import type { Identity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';

// Use the host from environment variable or default to IC mainnet
export const II_HOST = import.meta.env.VITE_IC_HOST || 'https://icp-api.io';

// Internet Identity provider URL
// Always use production II unless explicitly running a local replica with II canister
const hasLocalII = import.meta.env.CANISTER_ID_INTERNET_IDENTITY && 
                   (window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1'));

const II_URL = hasLocalII
  ? `http://${import.meta.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943`
  : 'https://identity.ic0.app';

// Singleton auth client instance
let authClientInstance: AuthClient | null = null;

/**
 * Get or create the AuthClient singleton
 * This ensures we reuse the same client throughout the app
 */
export async function getAuthClient(): Promise<AuthClient> {
  if (authClientInstance) {
    return authClientInstance;
  }
  
  authClientInstance = await AuthClient.create({
    idleOptions: {
      disableIdle: true, // Disable auto-logout on idle
      disableDefaultIdleCallback: true,
    },
  });
  
  return authClientInstance;
}

/**
 * Check if user is currently authenticated with Internet Identity
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const authClient = await getAuthClient();
    return await authClient.isAuthenticated();
  } catch (error) {
    console.error('Error checking II authentication:', error);
    return false;
  }
}

/**
 * Get the current authenticated identity
 * Returns null if not authenticated
 */
export async function getIdentity(): Promise<Identity | null> {
  try {
    const authClient = await getAuthClient();
    const authenticated = await authClient.isAuthenticated();
    
    if (!authenticated) {
      return null;
    }
    
    return authClient.getIdentity();
  } catch (error) {
    console.error('Error getting II identity:', error);
    return null;
  }
}

/**
 * Get the principal of the currently authenticated user
 * Returns null if not authenticated
 */
export async function getPrincipal(): Promise<Principal | null> {
  try {
    const identity = await getIdentity();
    if (!identity) {
      return null;
    }
    
    return identity.getPrincipal();
  } catch (error) {
    console.error('Error getting II principal:', error);
    return null;
  }
}

/**
 * Login with Internet Identity
 * Opens the II authentication window
 * Returns the authenticated principal on success
 */
export async function loginWithII(): Promise<Principal> {
  try {
    const authClient = await getAuthClient();
    
    return new Promise((resolve, reject) => {
      authClient.login({
        identityProvider: II_URL,
        onSuccess: async () => {
          const identity = authClient.getIdentity();
          const principal = identity.getPrincipal();
          console.log('✅ Internet Identity login successful:', principal.toString());
          resolve(principal);
        },
        onError: (error) => {
          console.error('❌ Internet Identity login failed:', error);
          reject(new Error('Internet Identity login failed'));
        },
        // Optional: customize the login window behavior
        windowOpenerFeatures: `
          left=${window.screen.width / 2 - 525 / 2},
          top=${window.screen.height / 2 - 705 / 2},
          toolbar=0,location=0,menubar=0,width=525,height=705
        `,
      });
    });
  } catch (error) {
    console.error('❌ Error initiating II login:', error);
    throw error;
  }
}

/**
 * Logout from Internet Identity
 * Clears the authentication state
 */
export async function logout(): Promise<void> {
  try {
    const authClient = await getAuthClient();
    await authClient.logout();
    authClientInstance = null; // Clear the singleton
    console.log('✅ Internet Identity logout successful');
  } catch (error) {
    console.error('❌ Error during II logout:', error);
    throw error;
  }
}

/**
 * Create an HttpAgent with the current II identity
 * This agent can be used to create actors for canisters
 */
export async function createAgent(options: { host?: string } = {}): Promise<HttpAgent> {
  try {
    const identity = await getIdentity();
    
    if (!identity) {
      throw new Error('Not authenticated with Internet Identity');
    }
    
    const host = options.host ?? II_HOST;
    
    const agent = new HttpAgent({
      identity,
      host,
    });
    
    // Fetch root key for local development or playground network
    const needsRootKey = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('icp0.io');
    if (needsRootKey) {
      try {
        await agent.fetchRootKey();
      } catch (error) {
        console.warn('Failed to fetch root key (this is normal on IC mainnet)');
      }
    }
    
    return agent;
  } catch (error) {
    console.error('Error creating II agent:', error);
    throw error;
  }
}

/**
 * Utility to check if Internet Identity is available
 * Always returns true since II is built into the IC
 */
export function isIIAvailable(): boolean {
  return true; // II is always available on IC
}

/**
 * Get a short display version of a principal
 * Format: abc123...xyz789
 */
export function shortPrincipal(principal: Principal | string | null | undefined): string {
  if (!principal) return '';
  const str = typeof principal === 'string' ? principal : principal.toString();
  if (str.length <= 16) return str;
  return `${str.slice(0, 6)}...${str.slice(-6)}`;
}
