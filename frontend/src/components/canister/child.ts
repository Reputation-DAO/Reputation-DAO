// src/components/canister/child.ts
import { HttpAgent, Actor } from "@dfinity/agent";
import type { ActorSubclass } from "@dfinity/agent";

import { idlFactory } from '../../../../src/declarations/reputation_dao/reputation_dao.did.js';
import type { _SERVICE } from '../../../../src/declarations/reputation_dao/reputation_dao.did.d.ts';

export type ChildActor = ActorSubclass<_SERVICE>;

type MakeChildOpts = {
  host?: string;          // defaults to icp-api.io
  canisterId: string;     // child canister id (:cid)
  whitelist?: string[];   // optional extra canisters
};

export async function makeChildWithPlug(opts: MakeChildOpts): Promise<ChildActor> {
  const host = opts.host ?? "https://icp-api.io";
  const whitelist = opts.whitelist ?? [opts.canisterId];

  const plug = (window as any)?.ic?.plug;

  if (plug) {
    // Ensure connected
    if (!plug.agent) {
      await plug.requestConnect?.({ host, whitelist });
      if (!plug.agent && plug.createAgent) {
        await plug.createAgent({ host });
      }
    }

    // Prefer Plug's createActor if available
    if (typeof plug.createActor === "function") {
      const actor = await plug.createActor({
        canisterId: opts.canisterId,
        interfaceFactory: idlFactory,
      });
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
