import { Actor, HttpAgent } from "@dfinity/agent";
import type { Identity } from "@dfinity/agent";

import { idlFactory } from "../../declarations/treasury/treasury.did.js";
import type { _SERVICE } from "../../declarations/treasury/treasury.did.d.ts";
import { ensurePlugAgent, PLUG_HOST } from "@/utils/plug";
import { ensureInternetIdentityAgent } from "@/utils/internetIdentity";

const TREASURY_CANISTER_ID = import.meta.env.VITE_TREASURY_CANISTER_ID || "qyncc-5qaaa-aaaam-qeqsq-cai";
const DEFAULT_HOST = PLUG_HOST;

export async function makeTreasuryActor(opts?: {
  agent?: HttpAgent;
  host?: string;
  canisterId?: string;
}): Promise<_SERVICE> {
  const host = opts?.host ?? DEFAULT_HOST;
  const canisterId = opts?.canisterId ?? TREASURY_CANISTER_ID!;
  const agent = opts?.agent ?? new HttpAgent({ host });

  const isLocal = host.startsWith("http://127.0.0.1") || host.startsWith("http://localhost");
  if (!opts?.agent && isLocal) {
    try {
      await agent.fetchRootKey();
    } catch (err) {
      console.warn("treasury: failed to fetch root key", err);
    }
  }

  return Actor.createActor<_SERVICE>(idlFactory, { agent, canisterId });
}

export async function makeTreasuryWithPlug(opts?: {
  host?: string;
  canisterId?: string;
}): Promise<_SERVICE> {
  const host = opts?.host ?? DEFAULT_HOST;
  const canisterId = opts?.canisterId ?? TREASURY_CANISTER_ID!;

  const whitelist = [canisterId];
  await ensurePlugAgent({ host, whitelist });

  const plug = (window as any)?.ic?.plug;
  if (!plug?.agent) {
    throw new Error("Plug agent unavailable for treasury canister");
  }

  const isLocal = host.startsWith("http://127.0.0.1") || host.startsWith("http://localhost");
  if (isLocal) {
    try {
      await plug.agent.fetchRootKey?.();
    } catch (err) {
      console.warn("treasury: fetchRootKey via plug failed", err);
    }
  }

  if (typeof plug.createActor === "function") {
    return (await plug.createActor({
      canisterId,
      interfaceFactory: idlFactory,
    })) as _SERVICE;
  }

  return Actor.createActor<_SERVICE>(idlFactory, {
    agent: plug.agent,
    canisterId,
  });
}

export async function makeTreasuryWithInternetIdentity(opts?: {
  host?: string;
  canisterId?: string;
}): Promise<_SERVICE> {
  const host = opts?.host ?? DEFAULT_HOST;
  const canisterId = opts?.canisterId ?? TREASURY_CANISTER_ID!;
  const agent = await ensureInternetIdentityAgent({ host });
  return Actor.createActor<_SERVICE>(idlFactory, { agent, canisterId });
}

export async function makeTreasuryWithIdentity(opts: {
  identity: Identity;
  host?: string;
  canisterId?: string;
}): Promise<_SERVICE> {
  const host = opts.host ?? DEFAULT_HOST;
  const canisterId = opts.canisterId ?? TREASURY_CANISTER_ID!;
  const agent = new HttpAgent({ host, identity: opts.identity });
  if (host.startsWith("http://127.0.0.1") || host.startsWith("http://localhost")) {
    try {
      await agent.fetchRootKey();
    } catch (err) {
      console.warn("treasury: fetchRootKey failed", err);
    }
  }
  return Actor.createActor<_SERVICE>(idlFactory, { agent, canisterId });
}

export const getTreasuryCanisterId = () => TREASURY_CANISTER_ID!;
