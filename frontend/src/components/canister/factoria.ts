// frontend/src/canister/factoria.ts
import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from '../../declarations/factoria/factoria.did.js';
import type { _SERVICE } from '../../declarations/factoria/factoria.did.d.ts';

const FACTORIA_CANISTER_ID = import.meta.env.VITE_FACTORIA_CANISTER_ID || "ttoz7-uaaaa-aaaam-qd34a-cai";
const DEFAULT_HOST = 'https://ic0.app';

export async function makeFactoriaActor(opts?: {
  agent?: HttpAgent;
  host?: string;
  canisterId?: string;
}): Promise<_SERVICE> {
  const host = opts?.host ?? DEFAULT_HOST;
  const canisterId = opts?.canisterId ?? FACTORIA_CANISTER_ID!;

  const agent =
    opts?.agent ??
    new HttpAgent({ host });

  const lowerHost = host.toLowerCase();
  const isLocal =
    lowerHost.startsWith('http://127.0.0.1') ||
    lowerHost.startsWith('http://localhost');

  if (!opts?.agent && isLocal) {
    try { await agent.fetchRootKey(); } catch {}
  }

  return Actor.createActor<_SERVICE>(idlFactory, { agent, canisterId });
}

export async function makeFactoriaWithPlug(opts?: {
  host?: string;
  canisterId?: string;
}): Promise<_SERVICE> {
  const canisterId = opts?.canisterId ?? FACTORIA_CANISTER_ID!;
  const host = opts?.host ?? DEFAULT_HOST;

  if (!window.ic?.plug) {
    throw new Error('Plug extension not found. Please install/enable Plug.');
  }

  const connected = await window.ic.plug.isConnected?.();
  if (!connected) {
    const ok = await window.ic.plug.requestConnect?.({ whitelist: [canisterId], host });
    if (!ok) throw new Error('User rejected Plug connection.');
  }

  if (!window.ic.plug.agent) {
    await window.ic.plug.createAgent?.({ whitelist: [canisterId], host });
  }

  const agent = window.ic.plug.agent as HttpAgent;
  return Actor.createActor<_SERVICE>(idlFactory, { agent, canisterId });
}

export const getFactoriaCanisterId = () => FACTORIA_CANISTER_ID!;

// Global types are handled by @connect2ic library
