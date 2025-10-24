// lib/canisters/child.ts
import { Actor } from "@dfinity/agent";
import type { ActorSubclass } from "@dfinity/agent";

import { idlFactory } from "../../declarations/reputation_dao/reputation_dao.did.js";
import type { _SERVICE } from "../../declarations/reputation_dao/reputation_dao.did.d.ts";
import { ensureInternetIdentityAgent } from "@/utils/internetIdentity";

export type ChildActor = ActorSubclass<_SERVICE>;

type MakeChildOpts = {
  host?: string;
  canisterId: string;   // child canister id (:cid)
  whitelist?: string[]; // optional extra canisters to authorise (legacy - not used with II)
};

const DEFAULT_HOST = 
  import.meta.env.VITE_DFX_NETWORK === 'local'
    ? 'http://127.0.0.1:4943'
    : 'https://icp-api.io';

export async function makeChildWithInternetIdentity(opts: MakeChildOpts): Promise<ChildActor> {
  const host = opts.host ?? DEFAULT_HOST;
  const agent = await ensureInternetIdentityAgent({ host });
  return Actor.createActor<_SERVICE>(idlFactory, {
    agent,
    canisterId: opts.canisterId,
  }) as ChildActor;
}

// Default export for convenience
export async function makeChildActor(opts: MakeChildOpts): Promise<ChildActor> {
  return makeChildWithInternetIdentity(opts);
}
