// lib/canisters/factoria.ts
import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from '../../../../src/declarations/factoria/factoria.did.js';
import type { _SERVICE } from '../../../../src/declarations/factoria/factoria.did.d.ts';
import { createAgent, getIdentity, II_HOST } from '@/utils/internetIdentity';

const FACTORIA_CANISTER_ID = import.meta.env.VITE_FACTORIA_CANISTER_ID || "ttoz7-uaaaa-aaaam-qd34a-cai";
const DEFAULT_HOST = II_HOST;

/**
 * Create a factoria canister actor
 * Supports both authenticated (via II) and anonymous modes
 */
export async function makeFactoriaActor(opts?: {
  agent?: HttpAgent;
  host?: string;
  canisterId?: string;
}): Promise<_SERVICE> {
  const host = opts?.host ?? DEFAULT_HOST;
  const canisterId = opts?.canisterId ?? FACTORIA_CANISTER_ID!;

  // If agent is provided, use it
  if (opts?.agent) {
    return Actor.createActor<_SERVICE>(idlFactory, { 
      agent: opts.agent, 
      canisterId 
    });
  }

  // Try to use authenticated II identity
  try {
    const identity = await getIdentity();
    if (identity) {
      console.log('✅ Using authenticated Internet Identity for factoria');
      const agent = await createAgent({ host });
      return Actor.createActor<_SERVICE>(idlFactory, { agent, canisterId });
    }
  } catch (error) {
    console.warn('⚠️  Could not create authenticated factoria actor:', error);
  }

  // Fallback: anonymous agent
  console.log('ℹ️  Creating anonymous factoria actor');
  const agent = new HttpAgent({ host });

  const lowerHost = host.toLowerCase();
  const isLocal =
    lowerHost.startsWith('http://127.0.0.1') ||
    lowerHost.startsWith('http://localhost');

  if (isLocal) {
    try { 
      await agent.fetchRootKey(); 
    } catch (error) {
      console.warn('Could not fetch root key:', error);
    }
  }

  return Actor.createActor<_SERVICE>(idlFactory, { agent, canisterId });
}

// Alias for backward compatibility
export const makeFactoriaWithPlug = makeFactoriaActor;

export const getFactoriaCanisterId = () => FACTORIA_CANISTER_ID!;
