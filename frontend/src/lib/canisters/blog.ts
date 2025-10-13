import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from '../../../../src/declarations/blog_backend/blog_backend.did.js';
import type { _SERVICE, Post } from '../../../../src/declarations/blog_backend/blog_backend.did.d.ts';
import { getIdentity, II_HOST } from '@/utils/internetIdentity';

const BLOG_BACKEND_CANISTER_ID = import.meta.env.VITE_BLOG_BACKEND_CANISTER_ID || 'oy2j4-syaaa-aaaam-qdvxq-cai';
const DEFAULT_HOST = II_HOST;

/**
 * Create a blog backend canister actor
 * Supports both authenticated (via II) and anonymous modes
 */
export async function makeBlogActor(opts?: {
  agent?: HttpAgent;
  host?: string;
  canisterId?: string;
}): Promise<_SERVICE> {
  const host = opts?.host ?? DEFAULT_HOST;
  const canisterId = opts?.canisterId ?? BLOG_BACKEND_CANISTER_ID!;

  // Use provided agent or create new one
  let agent = opts?.agent;
  if (!agent) {
    const identity = await getIdentity();
    agent = new HttpAgent({
      host,
      identity: identity ?? undefined,
    });

    // Fetch root key for local/test networks (not needed for mainnet)
    if (host.includes('localhost') || host.includes('127.0.0.1') || host.includes('icp0.io')) {
      await agent.fetchRootKey().catch((err) => {
        console.warn('Failed to fetch root key for blog actor:', err);
      });
    }
  }

  return Actor.createActor<_SERVICE>(idlFactory, {
    agent,
    canisterId,
  });
}

// Create a default instance for convenience (anonymous)
const agent = new HttpAgent({ host: DEFAULT_HOST });

// Fetch root key for local/playground networks
if (DEFAULT_HOST.includes('localhost') || DEFAULT_HOST.includes('127.0.0.1') || DEFAULT_HOST.includes('icp0.io')) {
  agent.fetchRootKey().catch(() => {
    console.warn('Unable to fetch root key for blog actor');
  });
}

export const blogActor = Actor.createActor<_SERVICE>(idlFactory, {
  agent,
  canisterId: BLOG_BACKEND_CANISTER_ID,
});

// Re-export types for easier imports elsewhere
export type { Post };
