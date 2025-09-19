// src/components/canister/child.ts
import { HttpAgent, Actor } from "@dfinity/agent";
import type { ActorSubclass } from "@dfinity/agent";

import { idlFactory } from '../../declarations/reputation_dao/reputation_dao.did.js';
import type { _SERVICE } from '../../declarations/reputation_dao/reputation_dao.did.d.ts';

export type ChildActor = ActorSubclass<_SERVICE>;

type MakeChildOpts = {
  host?: string;          // defaults to ic0.app
  canisterId: string;     // child canister id (:cid)
  whitelist?: string[];   // optional extra canisters
};

export async function makeChildWithPlug(opts: MakeChildOpts): Promise<ChildActor> {
  const host = opts.host ?? "https://ic0.app";
  const whitelist = opts.whitelist ?? [opts.canisterId];

  console.log('🔧 makeChildWithPlug called with:', { canisterId: opts.canisterId, host, whitelist });

  const plug = (window as any)?.ic?.plug;

  if (plug) {
    console.log('🔌 Plug found, checking connection...');
    
    // Ensure connected
    if (!plug.agent) {
      console.log('🔗 Plug not connected, requesting connection...');
      await plug.requestConnect?.({ host, whitelist });
      if (!plug.agent && plug.createAgent) {
        console.log('🔧 Creating Plug agent...');
        await plug.createAgent({ host });
      }
    } else {
      console.log('✅ Plug already connected');
    }

    // Prefer Plug's createActor if available
    if (typeof plug.createActor === "function") {
      console.log('🎭 Creating actor with Plug...');
      const actor = await plug.createActor({
        canisterId: opts.canisterId,
        interfaceFactory: idlFactory,
      });
      console.log('✅ Actor created successfully');
      return actor as ChildActor;
    }

    // Fallback: build via Actor with Plug's agent
    return Actor.createActor<_SERVICE>(idlFactory, {
      agent: plug.agent,
      canisterId: opts.canisterId,
    }) as ChildActor;
  }

  // No Plug: anonymous agent (queries OK; updates needing identity will fail)
  const agent = new HttpAgent({ host });
  if (host.includes("127.0.0.1") || host.includes("localhost")) {
    await agent.fetchRootKey();
  }
  return Actor.createActor<_SERVICE>(idlFactory, {
    agent,
    canisterId: opts.canisterId,
  }) as ChildActor;
}
