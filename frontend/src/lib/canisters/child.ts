// lib/canisters/child.ts
import { HttpAgent, Actor } from "@dfinity/agent";
import type { ActorSubclass } from "@dfinity/agent";

import { idlFactory } from "../../declarations/reputation_dao/reputation_dao.did.js";
import type { _SERVICE } from "../../declarations/reputation_dao/reputation_dao.did.d.ts";
import { PLUG_HOST, ensurePlugAgent } from "@/utils/plug";

export type ChildActor = ActorSubclass<_SERVICE>;

type MakeChildOpts = {
  host?: string;        // defaults to PLUG_HOST
  canisterId: string;   // child canister id (:cid)
  whitelist?: string[]; // optional extra canisters to authorise
};

const DEFAULT_HOST = PLUG_HOST;

export async function makeChildWithPlug(opts: MakeChildOpts): Promise<ChildActor> {
  const host = opts.host ?? DEFAULT_HOST;
  const whitelist = Array.from(new Set([opts.canisterId, ...(opts.whitelist ?? [])]));
  const plug = (window as any)?.ic?.plug;

  if (plug) {
    await ensurePlugAgent({ host, whitelist });

    if (!plug.agent) {
      throw new Error("Plug agent is unavailable after attempting connection.");
    }

    if (typeof plug.createActor === "function") {
      return (await plug.createActor({
        canisterId: opts.canisterId,
        interfaceFactory: idlFactory,
      })) as ChildActor;
    }

    return Actor.createActor<_SERVICE>(idlFactory, {
      agent: plug.agent,
      canisterId: opts.canisterId,
    }) as ChildActor;
  }

  // No Plug available: anonymous agent (queries ok; updates will fail without identity)
  const agent = new HttpAgent({ host });
  if (host.includes("127.0.0.1") || host.includes("localhost")) {
    await agent.fetchRootKey();
  }
  return Actor.createActor<_SERVICE>(idlFactory, {
    agent,
    canisterId: opts.canisterId,
  }) as ChildActor;
}
