// lib/canisters/child.ts
import { HttpAgent, Actor } from "@dfinity/agent";
import type { ActorSubclass } from "@dfinity/agent";

import { idlFactory } from '../../../../src/declarations/reputation_dao/reputation_dao.did.js';
import type { _SERVICE } from '../../../../src/declarations/reputation_dao/reputation_dao.did.d.ts';
import { createAgent, getIdentity, II_HOST } from '@/utils/internetIdentity';

export type ChildActor = ActorSubclass<_SERVICE>;

type MakeChildOpts = {
  host?: string;          // defaults to II_HOST
  canisterId: string;     // child canister id (:cid)
};

const DEFAULT_HOST = II_HOST;

/**
 * Create a child canister actor using Internet Identity authentication
 * If not authenticated, creates an anonymous actor (queries OK, updates will fail)
 */
export async function makeChildActor(opts: MakeChildOpts): Promise<ChildActor> {
  const host = opts.host ?? DEFAULT_HOST;

  console.log('🔧 makeChildActor called with:', { canisterId: opts.canisterId, host });

  try {
    // Try to get authenticated identity from Internet Identity
    const identity = await getIdentity();
    
    if (identity) {
      console.log('✅ Using authenticated Internet Identity');
      const agent = await createAgent({ host });
      
      const actor = Actor.createActor<_SERVICE>(idlFactory, {
        agent,
        canisterId: opts.canisterId,
      }) as ChildActor;
      
      console.log('✅ Authenticated actor created successfully');
      return actor;
    }
  } catch (error) {
    console.warn('⚠️  Could not create authenticated actor:', error);
  }

  // Fallback: anonymous agent (queries OK; updates needing identity will fail)
  console.log('ℹ️  Creating anonymous actor (read-only)');
  const agent = new HttpAgent({ host });
  
  const isLocal = host.includes("127.0.0.1") || host.includes("localhost");
  if (isLocal) {
    try {
      await agent.fetchRootKey();
    } catch (error) {
      console.warn('Could not fetch root key:', error);
    }
  }
  
  return Actor.createActor<_SERVICE>(idlFactory, {
    agent,
    canisterId: opts.canisterId,
  }) as ChildActor;
}

// Keep old name for backward compatibility during migration
export const makeChildWithPlug = makeChildActor;
